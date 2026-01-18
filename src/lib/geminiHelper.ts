import { Course, COLORS, DAY_LABELS } from './types';
import { acquireVisionLock, releaseVisionLock } from './visionLock';

interface GeminiResponse {
    candidates: {
        content: {
            parts: {
                text: string;
            }[];
        };
    }[];
}

export const recognizeWithGemini = async (base64Image: string, apiKey: string): Promise<Course[]> => {
    // Check for empty or dummy key
    if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY' || apiKey.length < 10) {
        throw new Error("Gemini API Keyが設定されていません。\nsrc/secrets.ts に正しいキーを設定してください。");
    }

    const prompt = `
    Analyze this university timetable image (Grid Layout or List Layout) and extract course information into a JSON array.
    
    Layout Notes:
    - Columns usually represent Days: 月(Mon), 火(Tue), 水(Wed), 木(Thu), 金(Fri), 土(Sat).
    - Rows usually represent Periods: 1, 2, 3, 4, 5, 6.
    - If a cell contains multiple courses, include both.

    For each course, identify:
    - code: The course code (e.g. 7 digits like 2100010, usually at the top)
    - name: Course name. WARNING: Only include Quarter terms if EXPLICITLY written (e.g., "Q1", "3Q", "第2クォーター", "クォーター2"). IF found, convert to standard format "[Q2] Name". Do NOT guess or hallucinate if not written.
    - day: "Mon", "Tue", "Wed", "Thu", "Fri", or "Sat".
    - period: 1 to 6.
    - room: Room number or name (e.g. 2161, Gym, Lab, or text like "大競技")
    - professor: Professor name (Japanese or English)
    
    Return ONLY valid JSON.
    Format:
    [
      { "code": "...", "name": "[Q1] Math", "day": "Mon", "period": 1, "room": "...", "professor": "..." }
    ]
    `;

    if (!acquireVisionLock()) {
        throw new Error("VISION_BUSY");
    }

    const MAX_RETRIES = 3;
    let attempt = 0;

    const executeRequest = async (): Promise<Course[]> => {
        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [
                            { text: prompt },
                            {
                                inline_data: {
                                    mime_type: "image/jpeg",
                                    data: base64Image
                                }
                            }
                        ]
                    }]
                })
            });

            if (!response.ok) {
                const err = await response.text();
                // Check for rate limit (429) or overloaded server (503)
                if ((response.status === 429 || response.status === 503) && attempt < MAX_RETRIES) {
                    attempt++;
                    const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000; // Exponential backoff + jitter
                    console.warn(`Gemini busy (${response.status}). Retrying in ${Math.round(delay)}ms... (Attempt ${attempt})`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    return executeRequest();
                }
                throw new Error(`Gemini API Error (${response.status}): ${err}`);
            }

            const json: GeminiResponse = await response.json();
            const text = json.candidates?.[0]?.content?.parts?.[0]?.text;

            if (!text) throw new Error("No response from Gemini");

            const jsonMatch = text.match(/\[[\s\S]*\]/);
            if (!jsonMatch) {
                console.error("Gemini Raw Response:", text);
                throw new Error("AI returned texts but no JSON array found.");
            }

            const cleanedText = jsonMatch[0];
            const rawCourses = JSON.parse(cleanedText);

            let colorIndex = Math.floor(Math.random() * COLORS.length);
            return rawCourses.map((c: any) => {
                const course: Course = {
                    id: Math.random().toString(36).substr(2, 9),
                    name: c.name || '名称不明',
                    code: c.code || '',
                    day: c.day,
                    period: c.period,
                    room: c.room || '',
                    professor: c.professor || '',
                    term: '2025-Spring',
                    color: COLORS[colorIndex % COLORS.length]
                };
                colorIndex++;
                return course;
            });
        } catch (e) {
            throw e;
        }
    };

    try {
        return await executeRequest();
    } catch (e) {
        console.error("Gemini Recognition Failed after retries", e);
        throw e;
    } finally {
        releaseVisionLock();
    }
};
