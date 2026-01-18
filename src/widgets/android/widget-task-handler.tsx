import React from 'react';
import type { WidgetTaskHandlerProps } from 'react-native-android-widget';
import { TimetableWidget } from './TimetableWidget';
import { CountdownWidget } from './CountdownWidget'; // Import CountdownWidget
import SharedGroupPreferences from 'react-native-shared-group-preferences';
import { Course } from '../../lib/types';

const APP_GROUP = 'group.com.mono0261.universitytimetablemobile.expowidgets'; // Fixed App Group
const WIDGET_DATA_KEY = 'widgetData';
const WIDGET_ASSIGNMENTS_KEY = 'widgetAssignments'; // Key for assignments

interface AssignmentData {
    id: string;
    title: string;
    deadline: string;
    courseName: string;
    daysRemaining: number;
}

export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
    const widgetName = props.widgetInfo?.widgetName;

    if (widgetName === 'TimetableWidget' || widgetName === 'TimetableWidgetSmall') {
        const isSmall = widgetName === 'TimetableWidgetSmall';
        let courses: Course[] = [];
        let settings: any = null;
        try {
            const AsyncStorage = require('@react-native-async-storage/async-storage').default;
            const data = await AsyncStorage.getItem('WIDGET_DATA_COURSES');
            if (data) courses = JSON.parse(data);

            const settingsData = await AsyncStorage.getItem('WIDGET_DATA_SETTINGS');
            if (settingsData) settings = JSON.parse(settingsData);

            const isPremiumData = await AsyncStorage.getItem('WIDGET_DATA_IS_PREMIUM');
            var isPremium = isPremiumData ? JSON.parse(isPremiumData) : false;
        } catch (e) {
            console.log('No widget data found', e);
        }

        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const daysJP = ['日', '月', '火', '水', '木', '金', '土'];
        const now = new Date();

        // Helper to check if a class period is over
        const isPeriodOver = (period: number, date: Date) => {
            let endHour = 0;
            let endMinute = 0;

            if (settings) {
                const { calculateTime } = require('../../lib/timeUtils');
                const dayStr = days[date.getDay()];
                const time = calculateTime(
                    period,
                    settings.firstPeriodStart,
                    settings.thirdPeriodStart,
                    settings.periodDuration || 90,
                    settings.breakDuration || 10,
                    settings.customPeriodDurations,
                    dayStr as any
                );
                const [eh, em] = time.end.split(':').map(Number);
                endHour = eh;
                endMinute = em;
            } else {
                switch (period) {
                    case 1: endHour = 10; endMinute = 30; break;
                    case 2: endHour = 12; endMinute = 10; break;
                    case 3: endHour = 14; endMinute = 30; break;
                    case 4: endHour = 16; endMinute = 10; break;
                    case 5: endHour = 17; endMinute = 50; break;
                    case 6: endHour = 19; endMinute = 30; break;
                    default: endHour = 23; endMinute = 59; break;
                }
            }
            const currentHour = date.getHours();
            const currentMinute = date.getMinutes();

            if (currentHour > endHour) return true;
            if (currentHour === endHour && currentMinute >= endMinute) return true;
            return false;
        };

        const getCoursesForDate = (date: Date) => {
            const dayStr = days[date.getDay()];
            return courses
                .filter(c => c.day === dayStr)
                .sort((a, b) => a.period - b.period);
        };

        let displayCourses: Course[] = [];
        let dateString = `${now.getMonth() + 1}/${now.getDate()} (${daysJP[now.getDay()]})`;

        // 1. Get Today's Courses
        const todayCourses = getCoursesForDate(now);

        // 2. Filter out finished courses for today
        const upcomingToday = todayCourses.filter(c => !isPeriodOver(c.period, now));

        if (upcomingToday.length > 0) {
            displayCourses = upcomingToday;
            dateString = `${now.getMonth() + 1}/${now.getDate()} (${daysJP[now.getDay()]})`;
        } else {
            // Today is done or empty, look for next classes
            let found = false;
            for (let i = 1; i <= 7; i++) {
                const nextDate = new Date(now);
                nextDate.setDate(now.getDate() + i);
                const nextCourses = getCoursesForDate(nextDate);

                if (nextCourses.length > 0) {
                    displayCourses = nextCourses;
                    dateString = `${nextDate.getMonth() + 1}/${nextDate.getDate()} (${daysJP[nextDate.getDay()]})`;
                    found = true;
                    break;
                }
            }
            if (!found) {
                dateString = "予定なし";
            }
        }

        props.renderWidget(
            <TimetableWidget
                courses={displayCourses}
                dateString={dateString}
                widgetSize={isSmall ? 'small' : 'medium'}
                isPremium={isPremium}
            />
        );
    } else if (widgetName === 'CountdownWidget' || widgetName === 'CountdownWidgetSmall') {
        const isSmall = widgetName === 'CountdownWidgetSmall';
        let assignments: AssignmentData[] = [];
        try {
            const AsyncStorage = require('@react-native-async-storage/async-storage').default;
            const data = await AsyncStorage.getItem('WIDGET_DATA_ASSIGNMENTS');
            if (data) {
                assignments = JSON.parse(data);
            }
            const isPremiumData = await AsyncStorage.getItem('WIDGET_DATA_IS_PREMIUM');
            var isPremium = isPremiumData ? JSON.parse(isPremiumData) : false;
        } catch (e) {
            console.log('No assignment data found', e);
        }

        const now = new Date();
        const daysJP = ['日', '月', '火', '水', '木', '金', '土'];
        const dateString = `${now.getMonth() + 1}/${now.getDate()} (${daysJP[now.getDay()]})`;

        // Recalculate daysRemaining dynamically
        const calculatedAssignments = assignments.map(a => {
            if (!a.deadline) return a;
            let deadlineDate = new Date(a.deadline);

            // Handle "MM/DD" format manual parsing (Fix for background task)
            if (isNaN(deadlineDate.getTime()) || a.deadline.match(/^\d{1,2}\/\d{1,2}$/)) {
                const [m, d] = a.deadline.split('/').map(Number);
                const currentYear = new Date().getFullYear();
                deadlineDate = new Date(currentYear, m - 1, d);
            }

            const today = new Date();
            today.setHours(0, 0, 0, 0);
            deadlineDate.setHours(0, 0, 0, 0);

            const diffTime = deadlineDate.getTime() - today.getTime();
            const daysDiff = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            return {
                ...a,
                daysRemaining: daysDiff
            };
        }).filter(a => a.daysRemaining >= 0).sort((a, b) => a.daysRemaining - b.daysRemaining);

        props.renderWidget(
            <CountdownWidget
                assignments={calculatedAssignments}
                lastUpdated={dateString}
                widgetSize={isSmall ? 'small' : 'medium'}
                isPremium={isPremium}
            />
        );
    }
}
