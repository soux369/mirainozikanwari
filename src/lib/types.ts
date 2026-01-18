export type Day = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat';

export type Period = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'cancelled';

export interface AttendanceRecord {
    id: string; // Added for list rendering keys
    date: string;
    status: AttendanceStatus;
}

export interface Assignment {
    id: string;
    title: string;
    deadline?: string;
    completed: boolean;
}

export interface Course {
    id: string;
    name: string;
    code?: string; // 5-digit course code
    professor?: string;
    room?: string;
    day: Day;
    period: Period;
    color?: string; // Optional custom color
    term?: string; // e.g., "2025-Spring"
    attendanceHistory?: AttendanceRecord[];
    notes?: string;
    assignments?: Assignment[];
    syllabusUrl?: string;
    skipNotificationUntil?: string; // ISO date string
    images?: string[]; // Array of local file URIs
}

export interface Friend {
    id: string;
    name: string;
    courses: Course[];
    term: string; // Term ID this friend's schedule belongs to
    createdAt: string;
}

export const DAYS: Day[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const PERIODS: Period[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export const DAY_LABELS: Record<Day, string> = {
    Mon: '月',
    Tue: '火',
    Wed: '水',
    Thu: '木',
    Fri: '金',
    Sat: '土',
};

// ... existing code ...
// More distinct and vibrant colors for better readability and aesthetics
export const COLORS = [
    '#dbeafe', // Blue
    '#dcfce7', // Green
    '#fce7f3', // Pink
    '#fef3c7', // Yellow
    '#e0e7ff', // Indigo
    '#ffedd5', // Orange
    '#f3e8ff', // Purple
    '#fee2e2', // Red
    '#ccfbf1', // Teal
];

export interface Settings {
    visibleDays: Day[];
    maxPeriod: number;
    firstPeriodStart: string; // "09:00"
    thirdPeriodStart: string; // "13:00"
    periodDuration: number;   // 90 (minutes)
    breakDuration: number;    // 10 (minutes)
    latesEquivalentToAbsence: number; // How many lates count as 1 absence
    enableGlass: boolean;
    tableBackgroundColor: string;
    backgroundImage?: string | null;
    notificationFirstClassMinutes: number; // Minutes before first class
    notificationOtherClassMinutes: number; // Minutes before other classes
    notificationsEnabled: boolean;
    holidayStart: string | null;
    holidayEnd: string | null;
    holidayModeEnabled: boolean; // Toggle to ignore holiday settings
    fontFamily: string; // New: Global Font Setting
    enableSwipeNavigation: boolean;
    customPeriodDurations?: Record<string, number>; // key: "1" (global) or "Mon-1" (specific)
    language: 'ja' | 'en'; // New I18n
}


export const DEFAULT_SETTINGS: Settings = {
    visibleDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    maxPeriod: 5,
    firstPeriodStart: '09:00',
    thirdPeriodStart: '13:00',
    periodDuration: 90,
    breakDuration: 10,
    latesEquivalentToAbsence: 3,
    enableGlass: true,
    tableBackgroundColor: '#F8F9FA',
    backgroundImage: null,
    notificationFirstClassMinutes: 10,
    notificationOtherClassMinutes: 10,
    notificationsEnabled: true,
    holidayStart: null,
    holidayEnd: null,
    holidayModeEnabled: true,
    fontFamily: 'System', // Default
    enableSwipeNavigation: true,
    language: 'ja'
};

export const FONT_OPTIONS = [
    { label: '端末のフォント (標準)', value: 'System' },
    { label: '丸ゴシック (Rounded)', value: 'M PLUS Rounded 1c', isPremiumOnly: true }, // Will need Google Font
    { label: '明朝体 (Serif)', value: 'Noto Serif JP', isPremiumOnly: true },
    { label: 'モダン (Roboto)', value: 'Roboto' },
];

export interface ThemePreset {
    id: string; // usually the light color hex
    light: string;
    dark: string;
    lightGradient?: [string, string];
    darkGradient?: [string, string];
    label: string;
    isPremiumOnly?: boolean;
}

export const THEME_PRESETS: ThemePreset[] = [
    {
        id: '#F8F9FA',
        light: '#F8F9FA',
        dark: '#1e293b',
        lightGradient: ['#F8F9FA', '#E9ECEF'],
        darkGradient: ['#334155', '#0f172a'], // Slate 700 -> Slate 900
        label: 'Default'
    },
    {
        id: '#FFFFFF',
        light: '#FFFFFF',
        dark: '#0f172a',
        lightGradient: ['#FFFFFF', '#F1F5F9'],
        darkGradient: ['#1e293b', '#020617'], // Slate 800 -> Slate 950
        label: 'White'
    },
    {
        id: '#FFF8E1',
        light: '#FFF8E1',
        dark: '#4a3b2a',
        lightGradient: ['#FFF8E1', '#FFE0B2'],
        darkGradient: ['#78350f', '#451a03'], // Amber 900 -> Amber 950
        label: 'Warm'
    },
    {
        id: '#E3F2FD',
        light: '#E3F2FD',
        dark: '#1e3a8a',
        lightGradient: ['#E3F2FD', '#90CAF9'],
        darkGradient: ['#1d4ed8', '#172554'], // Blue 700 -> Blue 950
        label: 'Cool'
    },
    {
        id: '#E0F2F1',
        light: '#E0F2F1',
        dark: '#134e4a',
        lightGradient: ['#E0F2F1', '#B2DFDB'],
        darkGradient: ['#0f766e', '#042f2e'], // Teal 700 -> Teal 950
        label: 'Mint'
    },
    {
        id: '#F3E5F5',
        light: '#F3E5F5',
        dark: '#581c87',
        lightGradient: ['#F3E5F5', '#E1BEE7'],
        darkGradient: ['#7e22ce', '#3b0764'], // Purple 700 -> Purple 950
        label: 'Lilac'
    },
    {
        id: '#020617',
        light: '#020617',
        dark: '#000000',
        lightGradient: ['#0f172a', '#020617'],
        darkGradient: ['#020617', '#000000'],
        label: 'Midnight',
        // Unlock Midnight
    },
    // New Themes (6 total: 1 Free, 5 Premium)
    {
        id: '#ocean',
        light: '#e0f2fe',
        dark: '#0c4a6e',
        lightGradient: ['#e0f2fe', '#0ea5e9'], // Sky 100 -> Sky 500
        darkGradient: ['#0c4a6e', '#0369a1'], // Sky 900 -> Sky 700
        label: 'Ocean',
        // FREE
    },
    {
        id: '#marble',
        light: '#f3f4f6',
        dark: '#1f2937',
        lightGradient: ['#f3f4f6', '#d1d5db'], // Grey 100 -> Grey 300 (Marble-ish)
        darkGradient: ['#374151', '#111827'], // Grey 700 -> Grey 900
        label: 'Marble',
        isPremiumOnly: true
    },
    {
        id: '#galaxy',
        light: '#c4b5fd',
        dark: '#2e1065',
        lightGradient: ['#c4b5fd', '#8b5cf6'], // Violet 300 -> Violet 500
        darkGradient: ['#2e1065', '#4c1d95'], // Violet 950 -> Violet 900
        label: 'Galaxy',
        isPremiumOnly: true
    },
    {
        id: '#sunset',
        light: '#fecaca',
        dark: '#7f1d1d',
        lightGradient: ['#fdba74', '#f87171'], // Orange 300 -> Red 400
        darkGradient: ['#991b1b', '#7c2d12'], // Red 800 -> Orange 900
        label: 'Sunset',
        isPremiumOnly: true
    },
    {
        id: '#forest',
        light: '#bbf7d0',
        dark: '#14532d',
        lightGradient: ['#bbf7d0', '#16a34a'], // Green 200 -> Green 600
        darkGradient: ['#14532d', '#166534'], // Green 900 -> Green 800
        label: 'Forest',
        isPremiumOnly: true
    },
    {
        id: '#cherry',
        light: '#fce7f3',
        dark: '#831843',
        lightGradient: ['#fce7f3', '#db2777'], // Pink 100 -> Pink 600
        darkGradient: ['#881337', '#9d174d'], // Pink 900 -> Pink 800
        label: 'Cherry',
        isPremiumOnly: true
    },
];

export interface Term {
    id: string;
    label: string;
}

export const DEFAULT_TERMS: Term[] = [
    { id: '2027-Fall', label: '2027 / 秋セメスター' },
    { id: '2027-Spring', label: '2027 / 春セメスター' },
    { id: '2026-Fall', label: '2026 / 秋セメスター' },
    { id: '2026-Spring', label: '2026 / 春セメスター' },
    { id: '2025-Fall', label: '2025 / 秋セメスター' },
    { id: '2025-Spring', label: '2025 / 春セメスター' },
    { id: '2024-Fall', label: '2024 / 秋セメスター' },
    { id: '2024-Spring', label: '2024 / 春セメスター' },
];

export const getBackgroundColor = (settingColor: string, isDarkMode: boolean): string | [string, string] => {
    const preset = THEME_PRESETS.find(p => p.id === settingColor);
    if (preset) {
        if (isDarkMode) {
            return preset.darkGradient || preset.dark;
        } else {
            return preset.lightGradient || preset.light;
        }
    }
    return isDarkMode ? '#1e293b' : settingColor;
};
