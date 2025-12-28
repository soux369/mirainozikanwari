import { Period } from './types';

export const calculateTime = (
    period: number,
    start: string,
    thirdPeriodStart: string | undefined,
    duration: number,
    breakTime: number,
    customDurations: Record<string, number> = {},
    day?: string // 'Mon', 'Tue' etc.
): { start: string, end: string, startMinutes: number, endMinutes: number } => {

    const parseMinutes = (timeStr: string) => {
        const [h, m] = timeStr.split(':').map(Number);
        return h * 60 + m;
    };

    let currentMinutes = parseMinutes(start);

    // Iterate from Period 1 up to target period
    for (let p = 1; p <= period; p++) {
        // Handle 3rd period reset
        if (p === 3 && thirdPeriodStart) {
            currentMinutes = parseMinutes(thirdPeriodStart);
        }

        // Determine duration for this period
        // Priority: Day-Specific > Global Custom > Default
        let pDuration = duration;

        if (day && customDurations[`${day}-${p}`] !== undefined) {
            pDuration = customDurations[`${day}-${p}`];
        } else if (customDurations[`${p}`] !== undefined) {
            pDuration = customDurations[`${p}`];
        }

        // If this is the target period, we have our start time
        if (p === period) {
            const endMinutes = currentMinutes + pDuration;
            const toTime = (mins: number) => {
                const hh = Math.floor(mins / 60) % 24;
                const mm = mins % 60;
                return `${hh.toString().padStart(2, '0')}:${mm.toString().padStart(2, '0')}`;
            };

            return {
                start: toTime(currentMinutes),
                end: toTime(endMinutes),
                startMinutes: currentMinutes,
                endMinutes: endMinutes
            };
        }

        // Advance time for next loop
        currentMinutes += pDuration + breakTime;
    }

    // Fallback (should not reach here if loop works)
    return { start: "00:00", end: "00:00", startMinutes: 0, endMinutes: 0 };
};

export const getCurrentMinutes = (): number => {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
};

export const getPeriodStartTime = (
    period: number,
    settings: { firstPeriodStart: string, thirdPeriodStart?: string, periodDuration: number, breakDuration?: number, customPeriodDurations?: Record<string, number> },
    day?: string
): string => {
    const { start } = calculateTime(
        period,
        settings.firstPeriodStart,
        settings.thirdPeriodStart,
        settings.periodDuration,
        settings.breakDuration || 10,
        settings.customPeriodDurations,
        day
    );
    return start;
};
