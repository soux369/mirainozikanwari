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

    if (widgetName === 'TimetableWidget') {
        let courses: Course[] = [];
        try {
            const data = await SharedGroupPreferences.getItem(WIDGET_DATA_KEY, APP_GROUP);
            if (data) {
                courses = JSON.parse(data);
            }
        } catch (e) {
            console.log('No widget data found', e);
        }

        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const daysJP = ['日', '月', '火', '水', '木', '金', '土'];
        const now = new Date();

        // Helper to check if a class period is over
        const isPeriodOver = (period: number, date: Date) => {
            // 1: 10:30, 2: 12:10, 3: 14:30, 4: 16:10, 5: 17:50, 6: 19:30
            let endHour = 0;
            let endMinute = 0;
            switch (period) {
                case 1: endHour = 10; endMinute = 30; break;
                case 2: endHour = 12; endMinute = 10; break;
                case 3: endHour = 14; endMinute = 30; break;
                case 4: endHour = 16; endMinute = 10; break;
                case 5: endHour = 17; endMinute = 50; break;
                case 6: endHour = 19; endMinute = 30; break;
                default: endHour = 23; endMinute = 59; break;
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
            <TimetableWidget courses={displayCourses} dateString={dateString} />
        );
    } else if (widgetName === 'CountdownWidget') {
        let assignments: AssignmentData[] = [];
        try {
            const data = await SharedGroupPreferences.getItem(WIDGET_ASSIGNMENTS_KEY, APP_GROUP);
            if (data) {
                assignments = JSON.parse(data);
            }
        } catch (e) {
            console.log('No assignment data found', e);
        }

        const now = new Date();
        const daysJP = ['日', '月', '火', '水', '木', '金', '土'];
        const dateString = `${now.getMonth() + 1}/${now.getDate()} (${daysJP[now.getDay()]})`;

        props.renderWidget(
            <CountdownWidget assignments={assignments} lastUpdated={dateString} />
        );
    }
}
