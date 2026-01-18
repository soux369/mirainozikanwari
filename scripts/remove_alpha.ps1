Add-Type -AssemblyName System.Drawing
$imagePath = "c:\Users\taiyo\.gemini\antigravity\scratch\university-timetable-mobile\assets\icon.png"
$outputPath = "c:\Users\taiyo\.gemini\antigravity\scratch\university-timetable-mobile\assets\icon_no_alpha.png"

$bmp = New-Object System.Drawing.Bitmap($imagePath)
$newBmp = New-Object System.Drawing.Bitmap($bmp.Width, $bmp.Height)
$g = [System.Drawing.Graphics]::FromImage($newBmp)
$g.Clear([System.Drawing.Color]::White)
$g.DrawImage($bmp, 0, 0)
$g.Dispose()
$bmp.Dispose()
$newBmp.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
$newBmp.Dispose()
Write-Host "Processed image saved to $outputPath"
