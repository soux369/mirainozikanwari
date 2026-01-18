import { Course, Day, Period, DAYS, COLORS } from './types';

// This file is now purely for parsing logic.
// The image processing and OCR happened in the WebView.

export interface ParseResult {
    courses: Course[];
    rawText: string;
}

const JAPANESE_DAY_MAP: Record<string, Day> = {
    '月': 'Mon', '火': 'Tue', '水': 'Wed', '木': 'Thu', '金': 'Fri', '土': 'Sat',
    '月曜': 'Mon', '火曜': 'Tue', '水曜': 'Wed', '木曜': 'Thu', '金曜': 'Fri', '土曜': 'Sat',
};

// Clean course names
const cleanCourseName = (name: string): string => {
    // 1. Normalize (Fix half-width katakana etc.)
    let cleaned = name.normalize('NFKC');
    let qTag = '';

    // Extract Term indicators like (Q3), [Q4], Q1, 2Q BEFORE other cleaning
    // Handles: (Q1), [1Q], Q1, 1Q with boundaries
    // Capture to qTag and remove from string
    const qMatch = cleaned.match(/(?:^|[\s\(\[\{])([XxQq][1-4]|[1-4][QqXx])(?:$|[\s\)\]\}])/);
    if (qMatch) {
        const raw = qMatch[1];
        // Extract number
        const num = raw.match(/\d/)?.[0];
        if (num) {
            qTag = `[Q${num}]`;
        }
        // Remove from string (case insensitive global)
        cleaned = cleaned.replace(/(?:^|[\s\(\[\{])([XxQq][1-4]|[1-4][QqXx])(?:$|[\s\)\]\}])/g, ' ');
    }

    // 2. OCR Fixes
    // Recover 'I' from pipe character
    cleaned = cleaned.replace(/\|/g, 'I');

    // Recover Beta from 'B'/'8' followed by noise (UO, 00, etc) or isolated
    cleaned = cleaned.replace(/([IVXⅠ-Ⅻ\d])\s*(?:B|8)(?:UO|U0|OO|00|O|0)?\b/gi, '$1β');

    // 3. Remove common OCR noise symbols (excluding |)
    cleaned = cleaned.replace(/[!_>¥]+/g, '');

    // 4. Remove "Start from colon" pattern or leading/trailing symbols/spaces
    cleaned = cleaned.replace(/^[:：;.\-=\s]+|[:：;.\-=\s]+$/g, '');

    // 5. Remove spaces between Japanese characters, Greek, Roman Numerals
    const charClass = 'ぁ-んァ-ン一-龥（）\(\)α-ωΑ-ΩⅠ-ⅫIIVX\\u0370-\\u03FF\\u2160-\\u2188';
    const regex = new RegExp(`([${charClass}])\\s+([${charClass}])`, 'g');
    cleaned = cleaned.replace(regex, '$1$2');

    // 6. Specific Fixes (User Reported)
    // "JC" misread as "OUC"
    cleaned = cleaned.replace(/OUC/g, 'JC');
    // "英語" misread as "F3E"
    cleaned = cleaned.replace(/F3\s*E/g, '英語');

    cleaned = cleaned.trim();

    // Prepend Q tag if found
    if (qTag) {
        return `${qTag} ${cleaned}`;
    }

    return cleaned;
};

// Helper to advance day
const getNextDay = (current: Day): Day => {
    const idx = DAYS.indexOf(current);
    if (idx !== -1 && idx < DAYS.length - 1) return DAYS[idx + 1];
    return 'Sat'; // Cap at Sat
};

const parseSevenDigitCodes = (lines: string[]): Course[] => {
    const courses: Course[] = [];
    let currentDay: Day = 'Mon';
    let currentPeriod: Period = 1;
    let colorIndex = 0;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // 1. Period Marker (e.g. "1", "1限")
        const pMatch = line.match(/^([1-6])(?:限)?$/);
        if (pMatch) {
            currentPeriod = parseInt(pMatch[1]) as Period;
            currentDay = 'Mon'; // Reset to Mon for new row
            continue;
        }

        // 2. Course Code Marker (7 digits) - Allow following text as name
        const codeMatch = line.match(/^(\d{7})(?:[\s:：]+(.+))?$/);
        if (codeMatch) {
            const courseCode = codeMatch[1];
            // If name is on the same line, use it
            let name = codeMatch[2] ? codeMatch[2].trim() : '';
            let room = '';
            let prof = '';

            // Helper to check if a line is a start of next block (Code or Period)
            const isMarkerLine = (s: string) => /^(\d{7})/.test(s) || /^([1-6])(?:限)?$/.test(s);

            // If name not found yet, check next line
            if (!name && i + 1 < lines.length) {
                const l1 = lines[i + 1].trim();
                if (!isMarkerLine(l1)) {
                    name = l1;
                    i++;
                }
            }

            // Look for Room / Prof / Q-Tags in subsequent lines
            if (i + 1 < lines.length) {
                const l2 = lines[i + 1].trim();
                const isTag = /^[\(\[\{]?(?:[1-4][Qq]|[Qq][1-4])[\)\]\}]?$/.test(l2);

                if (!isMarkerLine(l2)) {
                    if (isTag) {
                        name += " " + l2;
                        i++;
                        // Check Room after Tag
                        if (i + 1 < lines.length) {
                            const l3 = lines[i + 1].trim();
                            if (!isMarkerLine(l3)) {
                                room = l3;
                                i++;
                                // Check Prof
                                if (i + 1 < lines.length) {
                                    const l4 = lines[i + 1].trim();
                                    if (!isMarkerLine(l4)) {
                                        prof = l4;
                                        i++;
                                    }
                                }
                            }
                        }
                    } else {
                        // l2 is Room
                        room = l2;
                        i++;
                        // Check Prof
                        if (i + 1 < lines.length) {
                            const l3 = lines[i + 1].trim();
                            const isTag3 = /^[\(\[\{]?(?:[1-4][Qq]|[Qq][1-4])[\)\]\}]?$/.test(l3);
                            if (!isMarkerLine(l3) && !isTag3) {
                                prof = l3;
                                i++;
                            }
                        }
                    }
                }
            }

            name = cleanCourseName(name);

            courses.push({
                id: Math.random().toString(36).substr(2, 9),
                name: name || '名称不明',
                code: courseCode,
                day: currentDay,
                period: currentPeriod,
                room: room,
                professor: prof,
                color: COLORS[colorIndex % COLORS.length]
            });
            colorIndex++;

            // Advance Day (Assume Row-Major reading)
            currentDay = getNextDay(currentDay);
        }
    }
    return courses;
};

// Main parsing logic (shared with Web version essentially, but adapted)
export const parseRawTextToCourses = (text: string): Course[] => {
    // Pre-filter: Check for 7-digit codes which imply the Grid Layout with Codes
    const hasSevenDigitCodes = /\d{7}/.test(text);

    const lines = text.split(/\r?\n|;/).map(l => l.trim()).filter(l => l);

    if (hasSevenDigitCodes) {
        return parseSevenDigitCodes(lines);
    }

    const courses: Course[] = [];
    const blockHeaderRegex = /^(\d{4,})\s*[:：]\s*(.+)/;


    const blocks: string[][] = [];
    let currentBlock: string[] = [];

    lines.forEach(line => {
        if (blockHeaderRegex.test(line)) {
            if (currentBlock.length > 0) {
                blocks.push(currentBlock);
            }
            currentBlock = [line];
        } else {
            currentBlock.push(line);
        }
    });
    if (currentBlock.length > 0) {
        blocks.push(currentBlock);
    }

    const useBlockParser = blocks.some(b => blockHeaderRegex.test(b[0]));

    let colorIndex = Math.floor(Math.random() * COLORS.length);

    if (useBlockParser) {
        blocks.forEach(block => {
            const headerMatch = block[0].match(blockHeaderRegex);
            if (!headerMatch) return;
            const courseCode = headerMatch[1];
            const courseName = cleanCourseName(headerMatch[2]);

            const assignedColor = COLORS[colorIndex % COLORS.length];
            colorIndex++;

            const slots: { day: Day, period: Period, room?: string }[] = [];
            let professor = '';

            const roomMap: Record<string, string> = {};

            block.slice(1).forEach(line => {
                const roomMatch = line.matchAll(/([月火水木金土])[曜]?\s*(\d)\s*[:：;.,\s]\s*([^\/\(\)\[\]\s].*?)(?=\s*[\/\(\)\[\]]|$)/g);
                for (const match of roomMatch) {
                    const d = Object.entries(JAPANESE_DAY_MAP).find(([k]) => k === match[1])?.[1];
                    const p = parseInt(match[2]);
                    let r = match[3].trim();
                    r = r.replace(/(\d)[^\d]+$/, '$1');

                    if (d && p && r) {
                        roomMap[`${d}${p}`] = r;
                    }
                }

                const scheduleMatch = line.matchAll(/([月火水木金土])[曜]?\s*(\d)/g);
                for (const match of scheduleMatch) {
                    const d = Object.entries(JAPANESE_DAY_MAP).find(([k]) => k === match[1])?.[1];
                    const p = parseInt(match[2]);
                    if (d && p) {
                        if (!slots.some(s => s.day === d && s.period === p)) {
                            slots.push({ day: d, period: p as Period });
                        }
                    }
                }

                if (!line.match(/\d/) && !line.includes('セメスター') && !line.includes('年度')) {
                    professor = line.trim();
                }
            });

            slots.forEach(slot => {
                const room = roomMap[`${slot.day}${slot.period}`] || '';

                courses.push({
                    id: Math.random().toString(36).substr(2, 9),
                    name: courseName,
                    code: courseCode,
                    day: slot.day,
                    period: slot.period,
                    room: room,
                    professor: professor,
                    color: assignedColor,
                });
            });
        });

    } else {
        lines.forEach(line => {
            const trimmed = line.trim();
            if (!trimmed) return;

            let detectedDay: Day | null = null;
            for (const [key, value] of Object.entries(JAPANESE_DAY_MAP)) {
                if (new RegExp(`[\\(\\[\\s]?${key}[\\)\\]\\s]?`).test(trimmed)) {
                    detectedDay = value;
                    break;
                }
            }
            if (!detectedDay) {
                for (const [key, value] of Object.entries(JAPANESE_DAY_MAP)) {
                    if (trimmed.includes(key)) {
                        detectedDay = value;
                        break;
                    }
                }
            }
            if (!detectedDay) {
                for (const day of DAYS) {
                    if (new RegExp(`\\b${day}\\b`, 'i').test(trimmed)) {
                        detectedDay = day;
                        break;
                    }
                }
            }

            let detectedPeriod: Period | null = null;
            const periodMatchExplicit = trimmed.match(/([1-6])\s*限/);
            if (periodMatchExplicit) {
                detectedPeriod = parseInt(periodMatchExplicit[1]) as Period;
            } else {
                const periodMatchBracket = trimmed.match(/[\[\(\{]([1-6])[\]\)\}]/);
                if (periodMatchBracket) {
                    detectedPeriod = parseInt(periodMatchBracket[1]) as Period;
                } else {
                    if (detectedDay) {
                        const periodMatchWeak = trimmed.match(/(?<!\d)([1-6])(?!\d)/);
                        if (periodMatchWeak) {
                            detectedPeriod = parseInt(periodMatchWeak[1]) as Period;
                        }
                    }
                }
            }

            if (detectedDay && detectedPeriod) {
                let name = trimmed;
                name = name.replace(new RegExp(`(${Object.keys(JAPANESE_DAY_MAP).join('|')})[曜]?`, 'g'), '');
                name = name.replace(/([1-6])\s*限/, '');
                name = name.replace(/[\[\(\{][1-6][\]\)\}]/, '');
                name = name.replace(/[\[\(\{](月|火|水|木|金|土)[\]\)\}]/g, '');
                name = name.replace(/^[:\.\-\s]+|[:\.\-\s]+$/g, '');
                name = cleanCourseName(name.trim());

                if (name.length > 1) {
                    const assignedColor = COLORS[colorIndex % COLORS.length];
                    colorIndex++;

                    courses.push({
                        id: Math.random().toString(36).substr(2, 9),
                        name: name,
                        day: detectedDay,
                        period: detectedPeriod,
                        color: assignedColor,
                    });
                }
            }
        });
    }

    return courses;
};
