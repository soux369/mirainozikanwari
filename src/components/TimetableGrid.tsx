import React, { useMemo } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { Course, DAYS, PERIODS, DAY_LABELS, Day, Period, Settings } from '../lib/types';
import { calculateTime } from '../lib/timeUtils';
import CourseCard from './CourseCard';
import { ThemedText } from './ThemedText';

interface TimetableGridProps {
    courses: Course[];
    settings: Settings;
    onCourseClick: (course: Course) => void;
    onEmptySlotClick: (day: Day, period: Period) => void;
    isDarkMode?: boolean;
    readOnly?: boolean;
}

const getTodayDay = (): Day | null => {
    const today = new Date().getDay();
    const map: Record<number, Day> = { 1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri', 6: 'Sat' };
    return map[today] || null;
};



const TimetableGrid: React.FC<TimetableGridProps> = ({ courses, settings, onCourseClick, onEmptySlotClick, isDarkMode = false, readOnly = false }) => {
    const currentDay = getTodayDay();
    const visibleDays = settings.visibleDays;
    const periods = PERIODS.slice(0, settings.maxPeriod);

    const getCoursesForSlot = (day: Day, period: Period) => {
        return courses.filter(c => c.day === day && c.period === period);
    };

    const textPrimary = isDarkMode ? '#f8fafc' : '#334155';
    const textSecondary = isDarkMode ? '#94a3b8' : '#94a3b8';
    const dividerColor = isDarkMode ? '#334155' : '#e2e8f0';
    const badgeActiveBg = isDarkMode ? '#cbd5e1' : '#1e293b';
    const badgeActiveText = isDarkMode ? '#0f172a' : '#fff';
    const emptyBorder = isDarkMode ? '#334155' : '#e2e8f0';

    return (
        <View style={styles.container}>
            {/* Header Row (Days) */}
            <View style={styles.headerRow}>
                <View style={styles.timeHeaderPlaceholder} />
                {visibleDays.map(day => {
                    const isToday = day === currentDay;
                    return (
                        <View key={day} style={styles.headerCell}>
                            <View style={[styles.dayBadge, isToday && { backgroundColor: badgeActiveBg }]}>
                                <ThemedText style={[styles.headerText, { color: textSecondary }, isToday && { color: badgeActiveText, fontWeight: 'bold' }]}>
                                    {DAY_LABELS[day]}
                                </ThemedText>
                            </View>
                        </View>
                    );
                })}
            </View>

            <ScrollView style={styles.gridScroll} contentContainerStyle={styles.gridContainer}>
                {periods.map(period => {
                    const time = calculateTime(
                        period,
                        settings.firstPeriodStart,
                        settings.thirdPeriodStart,
                        settings.periodDuration || 90,
                        settings.breakDuration || 10,
                        settings.customPeriodDurations
                    );

                    // Dynamic Height Calculation
                    // Find max number of courses in this period across all visible days
                    const maxCount = Math.max(...visibleDays.map(d => getCoursesForSlot(d, period).length), 1);
                    // Base 100, allow expansion. 55px per course seems reasonable (card padding + text)
                    const rowHeight = Math.max(100, maxCount * 60);

                    return (
                        <View key={period} style={[styles.row, { height: rowHeight }]}>
                            {/* Time Column */}
                            <View style={styles.timeColumn}>
                                <ThemedText style={styles.periodNumber}>{period}</ThemedText>
                                <ThemedText style={styles.timeText}>{time.start}</ThemedText>
                                <ThemedText style={[styles.timeTextDivider, { color: dividerColor }]}>|</ThemedText>
                                <ThemedText style={styles.timeText}>{time.end}</ThemedText>
                            </View>

                            {/* Days Columns */}
                            {visibleDays.map(day => {
                                const slotCourses = getCoursesForSlot(day, period);
                                return (
                                    <View key={`${day}-${period}`} style={styles.cell}>
                                        {slotCourses.length > 0 ? (
                                            <View style={{ flex: 1, gap: 4 }}>
                                                {slotCourses.map((course) => (
                                                    <View key={course.id} style={{ flex: 1 }}>
                                                        <CourseCard course={course} onClick={readOnly ? undefined : onCourseClick} />
                                                    </View>
                                                ))}
                                            </View>
                                        ) : (
                                            <TouchableOpacity
                                                style={[styles.emptySlot, { borderColor: emptyBorder }]}
                                                onPress={() => !readOnly && onEmptySlotClick(day, period)}
                                                activeOpacity={readOnly ? 1 : 0.6}
                                                delayPressIn={150}
                                                disabled={readOnly}
                                            />
                                        )}
                                    </View>
                                );
                            })}
                        </View>
                    );
                })}
                <View style={{ height: 100 }} />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    headerRow: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingBottom: 10,
        alignItems: 'center',
    },
    timeHeaderPlaceholder: {
        width: 44,
    },
    headerCell: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    dayBadge: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerText: {
        fontWeight: '600',
        fontSize: 13,
    },
    gridScroll: {
        flex: 1,
    },
    gridContainer: {
        paddingHorizontal: 16,
    },
    row: {
        flexDirection: 'row',
        height: 100,
        marginBottom: 12,
    },
    timeColumn: {
        width: 44,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 6,
    },
    periodNumber: {
        fontSize: 18,
        fontWeight: '800',
        color: '#94a3b8',
        marginBottom: 2,
    },
    timeText: {
        fontSize: 9,
        fontWeight: '600',
        color: '#94a3b8',
        lineHeight: 11,
    },
    timeTextDivider: {
        fontSize: 8,
        marginVertical: 1,
    },
    cell: {
        flex: 1,
        paddingHorizontal: 3,
    },
    emptySlot: {
        flex: 1,
        backgroundColor: 'transparent',
        borderRadius: 16,
        borderWidth: 1.5,
        borderStyle: 'dashed',
    },
});

export default TimetableGrid;
