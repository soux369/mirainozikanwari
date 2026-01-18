import React, { useRef, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

interface OCRWebViewProps {
  onMessage: (event: any) => void;
  triggerScan?: string | null; // Base64 image
}

// Optimized HTML content for OCR
// We use a CDN for tesseract.js.
// It performs 2x upscaling on a canvas before recognition.
const HTML_CONTENT = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js"></script>
  <style>body { font-family: sans-serif; text-align: center; margin: 0; padding: 20px; }</style>
</head>
<body>
  <div id="status">Ready</div>
  <canvas id="canvas" style="display:none;"></canvas>
  <script>
    const statusDiv = document.getElementById('status');
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');

    // Notify RN that we are ready
    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ready' }));

    window.addEventListener('message', async (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'scan') {
          await runOCR(message.payload);
        }
      } catch (e) {
        log("Error parsing message: " + e.message);
      }
    });

    // Listen for document messages (Android sometimes needs this)
    document.addEventListener('message', async (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.type === 'scan') {
            await runOCR(message.payload);
          }
        } catch (e) {
          log("Error parsing document message: " + e.message);
        }
    });

    function log(msg) {
      statusDiv.innerText = msg;
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'log', payload: msg }));
    }

    async function runOCR(base64Image) {
      log("Loading Image...");
      
      const img = new Image();
      img.onload = async () => {
        try {
            log("Assignments Image...");
            log("Processing Image...");
            log("Processing Image...");
            // Blind 2.0x Upscale
            const scale = 2.0;
            canvas.width = img.width * scale;
            canvas.height = img.height * scale;
            
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            
            // "New Method": Gamma Correction + Grayscale (No Hard Threshold)
            // This preserves text edges better than binarization for Tesseract.
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            const gamma = 2.2; // Darkens midtones (text) relative to background
            for (let i = 0; i < data.length; i += 4) {
                // Luma Grayscale
                const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
                
                // Gamma Correction
                // Normalize 0-1, apply power, denormalize
                const corrected = 255 * Math.pow(gray / 255, gamma);
                
                // Clamp and Assign
                const val = Math.max(0, Math.min(255, corrected));
                
                data[i] = val;
                data[i+1] = val;
                data[i+2] = val;
            }
            ctx.putImageData(imageData, 0, 0);

            // Convert back to base64 or blob?
            // Tesseract recognize can take the canvas element directly!
            
            log("Initializing Tesseract...");
            const worker = await Tesseract.createWorker("jpn+eng", 1, {
              logger: m => {
                window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'progress', payload: m }));
              }
            });
            
            log("Recognizing...");
            // Pass the canvas directly
            const { data: { text } } = await worker.recognize(canvas);
            
            log("Done.");
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'complete', payload: text }));
            
            await worker.terminate();

        } catch (err) {
            log("OCR Error: " + err.message);
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'error', payload: err.message }));
        }
      };
      
      img.onerror = (e) => {
         log("Image load failed");
         window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'error', payload: "Image load failed" }));
      };

      img.src = "data:image/png;base64," + base64Image;
    }
  </script>
</body>
</html>
`;

export const OCRWebView = ({ onMessage, triggerScan }: OCRWebViewProps) => {
  const webViewRef = useRef<WebView>(null);

  useEffect(() => {
    if (triggerScan && webViewRef.current) {
      // Use postMessage for safer large data transfer
      webViewRef.current.postMessage(JSON.stringify({ type: 'scan', payload: triggerScan }));
    }
  }, [triggerScan]);

  return (
    <View style={{ height: 1, width: 1, opacity: 0, position: 'absolute', top: -100 }}>
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html: HTML_CONTENT }}
        onMessage={(event) => {
          if (onMessage) onMessage(event.nativeEvent.data);
        }}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        allowFileAccess={true}
      />
    </View>
  );
};
