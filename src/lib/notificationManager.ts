import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Course, Settings, DAYS } from './types';
import { getPeriodStartTime } from './timeUtils';

// Configure notification handler
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

export const registerForPushNotificationsAsync = async () => {
    try {
        let token;
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            console.log('Notification permissions not granted');
            return;
        }

        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('default', {
                name: 'default',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#FF231F7C',
            });
        }
        return finalStatus;
    } catch (error) {
        console.warn("Notification permission error:", error);
    }
};

// Map Day string to Expo Weekday number (Sunday=1, Monday=2, ...)
const getWeekdayNumber = (day: string): number => {
    const map: Record<string, number> = {
        'Mon': 2, 'Tue': 3, 'Wed': 4, 'Thu': 5, 'Fri': 6, 'Sat': 7, 'Sun': 1
    };
    return map[day] || 2;
};

export const scheduleCourseNotifications = async (courses: Course[], settings: Settings) => {
    // 1. Cancel all existing notifications
    await Notifications.cancelAllScheduledNotificationsAsync();

    // 2. Check global notification switch
    if (settings.notificationsEnabled === false) {
        // Notifications disabled via settings
        return;
    }

    // 3. Check Holiday
    const now = new Date();
    if (settings.holidayModeEnabled !== false && settings.holidayStart && settings.holidayEnd) {
        const start = new Date(settings.holidayStart);
        const end = new Date(settings.holidayEnd);
        // Set end time to end of day
        end.setHours(23, 59, 59, 999);

        if (now >= start && now <= end) {
            // Currently within holiday period
            return;
        }
    }

    // 4. Group by Day
    const coursesByDay: Record<string, Course[]> = {};
    for (const c of courses) {
        // Ideally filter by active term if available, but assuming passed courses are relevant
        if (!coursesByDay[c.day]) coursesByDay[c.day] = [];
        coursesByDay[c.day].push(c);
    }

    // 5. Schedule
    for (const day of Object.keys(coursesByDay)) {
        // Sort by period to find the first one
        const dayCourses = coursesByDay[day].sort((a, b) => a.period - b.period);

        // Find the earliest period number for this day
        const firstPeriod = dayCourses[0].period;

        for (const course of dayCourses) {
            // Check Skip Logic
            if (course.skipNotificationUntil) {
                const skipUntil = new Date(course.skipNotificationUntil);
                if (now < skipUntil) {
                    // Skip this course notification
                    continue;
                }
            }

            const isFirst = course.period === firstPeriod;
            const minutesBefore = isFirst
                ? (settings.notificationFirstClassMinutes ?? 10)
                : (settings.notificationOtherClassMinutes ?? 10);

            const startTime = getPeriodStartTime(course.period, settings, course.day);
            if (!startTime) continue;

            // Parse "HH:MM"
            const [hour, minute] = startTime.split(':').map(Number);

            // Calculate trigger time
            let targetHour = hour;
            let targetMinute = minute - minutesBefore;

            while (targetMinute < 0) {
                targetMinute += 60;
                targetHour -= 1;
            }
            // If targetHour < 0 (e.g. 00:00 - 10min -> 23:50 previous day), 
            // Expo calendar trigger with weekday might be tricky if it wraps to previous day.
            // For now assuming same-day notifications.

            const weekday = getWeekdayNumber(course.day);

            // Schedule weekly notification
            await Notifications.scheduleNotificationAsync({
                content: {
                    title: `${course.name} (開始${minutesBefore}分前)`,
                    body: `${course.room ? `教室: ${course.room}` : ''} ${startTime}~`,
                    sound: true,
                },
                trigger: {
                    type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
                    weekday: weekday,
                    hour: targetHour,
                    minute: targetMinute,
                    repeats: true,
                },
            });
        }
    }
};

export const sendTestNotification = async () => {
    await Notifications.scheduleNotificationAsync({
        content: {
            title: "通知テスト",
            body: "これは通知のテストです。通知機能は正しく動作しています。",
            sound: true,
        },
        trigger: {
            type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
            seconds: 5,
        },
    });
};
