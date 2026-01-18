import React from 'react';
import { Platform } from 'react-native';
// Native modules moved to dynamic import
// import SharedGroupPreferences from 'react-native-shared-group-preferences';
// import { requestWidgetUpdate } from 'react-native-android-widget';
// // @ts-ignore
// import WidgetCenter from 'react-native-widget-center';
import { Course, Settings } from './types';
import { TimetableWidget } from '../widgets/android/TimetableWidget';
import { CountdownWidget } from '../widgets/android/CountdownWidget';

const APP_GROUP = 'group.com.mono0261.universitytimetablemobile.expowidgets';
const WIDGET_DATA_KEY = 'widgetData';

interface AssignmentData {
    id: string;
    title: string;
    deadline?: string;
    courseName: string;
    daysRemaining: number;
    timeString?: string;
}



const WIDGET_ASSIGNMENTS_KEY = 'widgetAssignments';

export const updateWidgets = async (courses: Course[], settings?: Settings, isPremium: boolean = false) => {
    try {
        // Dynamic import for Native Modules
        let SharedGroupPreferences;
        try {
            SharedGroupPreferences = require('react-native-shared-group-preferences').default;
        } catch (e) {
            console.log("SharedGroupPreferences not available (Expo Go?)");
            return;
        }

        const AsyncStorage = require('@react-native-async-storage/async-storage').default;

        // 1. Prepare Courses Data
        const sanitizedCourses = courses.map(c => ({
            ...c,
            room: c.room || null
        }));
        const dataStr = JSON.stringify(sanitizedCourses);
        await AsyncStorage.setItem('WIDGET_DATA_COURSES', dataStr);

        // 2. Prepare Assignments Data (with Deduplication and Time)
        const allAssignments: AssignmentData[] = [];
        const seenIds = new Set<string>();
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        courses.forEach(c => {
            if (c.assignments) {
                c.assignments.forEach(a => {
                    if (!a.completed && a.deadline && !seenIds.has(a.id)) {
                        let deadlineDate = new Date(a.deadline);
                        let timeString = "";

                        // Extract time HH:mm
                        if (!isNaN(deadlineDate.getTime())) {
                            const h = deadlineDate.getHours();
                            const m = deadlineDate.getMinutes();
                            timeString = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
                        } else if (a.deadline.match(/^\d{1,2}\/\d{1,2}\s+\d{1,2}:\d{1,2}$/)) {
                            // Match MM/DD HH:mm manually if new Date fails on some platforms
                            const timePart = a.deadline.split(/\s+/)[1];
                            if (timePart) timeString = timePart;
                        }

                        // Handle "MM/DD" format manual parsing if Invalid Date or default year
                        if (isNaN(deadlineDate.getTime()) || a.deadline.match(/^\d{1,2}\/\d{1,2}$/)) {
                            const [m, d] = a.deadline.split('/').map(Number);
                            const now = new Date();
                            deadlineDate = new Date(now.getFullYear(), m - 1, d);
                        }

                        deadlineDate.setHours(0, 0, 0, 0);
                        const diffTime = deadlineDate.getTime() - today.getTime();
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                        if (diffDays >= 0) {
                            allAssignments.push({
                                id: a.id,
                                title: a.title,
                                deadline: a.deadline,
                                courseName: c.name,
                                daysRemaining: diffDays,
                                timeString: timeString || null as any // Force null for JSON
                            });
                            seenIds.add(a.id);
                        }
                    }
                });
            }
        });

        allAssignments.sort((a, b) => a.daysRemaining - b.daysRemaining);
        const assignmentsStr = JSON.stringify(allAssignments);
        await AsyncStorage.setItem('WIDGET_DATA_ASSIGNMENTS', assignmentsStr);

        if (settings) {
            await AsyncStorage.setItem('WIDGET_DATA_SETTINGS', JSON.stringify(settings));
        }

        // 4. Save isPremium status
        await AsyncStorage.setItem('WIDGET_DATA_IS_PREMIUM', JSON.stringify(isPremium));

        // Trigger updates
        if (Platform.OS === 'android') {
            try {
                const { requestWidgetUpdate } = require('react-native-android-widget');

                // 1. Timetable Widget logic
                const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                const daysJP = ['日', '月', '火', '水', '木', '金', '土'];
                const now = new Date();

                // Helper to check if a class period is over (Uses settings if provided)
                const isPeriodOver = (period: number, date: Date) => {
                    let endHour = 0;
                    let endMinute = 0;

                    if (settings) {
                        // Use calculated time from settings
                        const { calculateTime } = require('./timeUtils');
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
                        // Extract end time HH:mm
                        const [eh, em] = time.end.split(':').map(Number);
                        endHour = eh;
                        endMinute = em;
                    } else {
                        // Default Fallback
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

                let displayCourses = [];
                const todayStr = `${now.getMonth() + 1}/${now.getDate()} (${daysJP[now.getDay()]})`;
                let timetableDateString = todayStr;

                const todayCourses = getCoursesForDate(now);
                const upcomingToday = todayCourses.filter(c => !isPeriodOver(c.period, now));

                if (upcomingToday.length > 0) {
                    displayCourses = upcomingToday;
                } else {
                    let found = false;
                    for (let i = 1; i <= 7; i++) {
                        const nextDate = new Date(now);
                        nextDate.setDate(now.getDate() + i);
                        const nextCourses = getCoursesForDate(nextDate);

                        if (nextCourses.length > 0) {
                            displayCourses = nextCourses;
                            timetableDateString = `${nextDate.getMonth() + 1}/${nextDate.getDate()} (${daysJP[nextDate.getDay()]})`;
                            found = true;
                            break;
                        }
                    }
                    if (!found) {
                        timetableDateString = "予定なし";
                    }
                }

                requestWidgetUpdate({
                    widgetName: 'TimetableWidget',
                    renderWidget: () => <TimetableWidget courses={displayCourses} dateString={timetableDateString} widgetSize="medium" isPremium={isPremium} />,
                    widgetNotFound: () => { console.log('Timetable Widget not found'); }
                });

                requestWidgetUpdate({
                    widgetName: 'TimetableWidgetSmall',
                    renderWidget: () => <TimetableWidget courses={displayCourses} dateString={timetableDateString} widgetSize="small" isPremium={isPremium} />,
                    widgetNotFound: () => { console.log('Timetable Widget Small not found'); }
                });

                // 2. Countdown Widget
                requestWidgetUpdate({
                    widgetName: 'CountdownWidget',
                    renderWidget: () => <CountdownWidget assignments={allAssignments} lastUpdated={todayStr} widgetSize="medium" isPremium={isPremium} />,
                    widgetNotFound: () => { console.log('Countdown Widget not found'); }
                });

                requestWidgetUpdate({
                    widgetName: 'CountdownWidgetSmall',
                    renderWidget: () => <CountdownWidget assignments={allAssignments} lastUpdated={todayStr} widgetSize="small" isPremium={isPremium} />,
                    widgetNotFound: () => { console.log('Countdown Widget Small not found'); }
                });
            } catch (e) {
                console.log("Android Widget logic skipped", e);
            }

        } else if (Platform.OS === 'ios') {
            try {
                // For iOS, SharedGroupPreferences is used to share data with the widget extension
                const assignmentsData = JSON.stringify(allAssignments);
                SharedGroupPreferences.setItem(WIDGET_ASSIGNMENTS_KEY, assignmentsData, APP_GROUP);
                SharedGroupPreferences.setItem(WIDGET_DATA_KEY, dataStr, APP_GROUP);

                // Also share settings if available
                if (settings) {
                    SharedGroupPreferences.setItem('widgetSettings', JSON.stringify(settings), APP_GROUP);
                }

                // Share Premium status
                SharedGroupPreferences.setItem('isPremium', JSON.stringify(isPremium), APP_GROUP);

                const WidgetCenter = require('react-native-widget-center').default;
                WidgetCenter.reloadAllTimelines();
            } catch (e) {
                console.log("iOS Widget logic skipped", e);
            }
        }
    } catch (e) {
        console.error("Failed to update widgets", e);
    }
};
