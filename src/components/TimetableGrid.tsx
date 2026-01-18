import React, { useMemo, useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Animated, Platform } from 'react-native';
import { Course, DAYS, PERIODS, DAY_LABELS, Day, Period, Settings } from '../lib/types';
import { calculateTime } from '../lib/timeUtils';
import CourseCard from './CourseCard';
import { ThemedText } from './ThemedText';
import { GlassView } from './GlassView';
import { Ionicons } from '@expo/vector-icons';
import { translations } from '../lib/i18n';

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
    const t = translations[settings.language || 'ja'] as any;
    const animatedScales = useRef<Record<string, Animated.Value>>({}).current;

    const getScale = (id: string) => {
        if (!animatedScales[id]) {
            animatedScales[id] = new Animated.Value(1);
        }
        return animatedScales[id];
    };

    const animateScale = (id: string, toValue: number) => {
        Animated.spring(getScale(id), {
            toValue,
            useNativeDriver: true,
            speed: 20,
            bounciness: 10,
        }).start();
    };

    const currentDay = getTodayDay();
    const visibleDays = settings.visibleDays;
    const periods = PERIODS.slice(0, settings.maxPeriod);

    const getCoursesForSlot = (day: Day, period: Period) => {
        return courses.filter(c => c.day === day && c.period === period);
    };

    const textPrimary = isDarkMode ? '#f8fafc' : '#334155';
    const textSecondary = isDarkMode ? '#cbd5e1' : '#475569';
    const dividerColor = isDarkMode ? '#334155' : '#e2e8f0';
    const badgeActiveBg = isDarkMode ? '#cbd5e1' : '#1e293b';
    const badgeActiveText = isDarkMode ? '#0f172a' : '#fff';
    const emptyBorder = isDarkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.12)';

    return (
        <View style={styles.container}>
            {/* Header Row (Days) */}
            <View style={styles.headerRow}>
                <View style={styles.timeHeaderPlaceholder} />
                {visibleDays.map(day => {
                    const isToday = day === currentDay;
                    return (
                        <View key={day} style={styles.headerCell}>
                            <GlassView
                                intensity={isToday ? (isDarkMode ? 30 : 40) : (isDarkMode ? 10 : 15)}
                                tint={isDarkMode ? 'dark' : 'light'}
                                style={[styles.dayBadge, isToday && { backgroundColor: badgeActiveBg }]}
                            >
                                <ThemedText style={[styles.headerText, { color: textSecondary }, isToday && { color: badgeActiveText, fontWeight: 'bold' }]}>
                                    {t[day]}
                                </ThemedText>
                            </GlassView>
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
                        settings.customPeriodDurations,
                        currentDay || undefined
                    );

                    // Dynamic Height Calculation
                    // Find max number of courses in this period across all visible days
                    const maxCount = Math.max(...visibleDays.map(d => getCoursesForSlot(d, period).length), 1);
                    // Base 100, allow expansion. 55px per course seems reasonable (card padding + text)
                    const rowHeight = Math.max(100, maxCount * 60);

                    return (
                        <View key={period} style={[styles.row, { height: rowHeight }]}>
                            {/* Time Column */}
                            <GlassView
                                intensity={isDarkMode ? 10 : 15}
                                tint={isDarkMode ? 'dark' : 'light'}
                                style={styles.timeColumn}
                                borderRadius={12}
                            >
                                <ThemedText style={[styles.periodNumber, { color: textSecondary }]}>{period}</ThemedText>
                                <View style={styles.timeTextContainer}>
                                    <ThemedText style={[styles.timeText, { color: textSecondary }]}>{time.start}</ThemedText>
                                    <ThemedText style={[styles.timeTextDivider, { color: dividerColor }]}>-</ThemedText>
                                    <ThemedText style={[styles.timeText, { color: textSecondary }]}>{time.end}</ThemedText>
                                </View>
                            </GlassView>

                            {/* Days Columns */}
                            {visibleDays.map(day => {
                                const slotCourses = getCoursesForSlot(day, period);
                                return (
                                    <View key={`${day}-${period}`} style={styles.cell}>
                                        {(() => {
                                            const isToday = day === currentDay;
                                            const slotCourses = getCoursesForSlot(day, period);
                                            return (
                                                <>
                                                    {slotCourses.length > 0 ? (
                                                        <View style={{ flex: 1, gap: 4 }}>
                                                            {slotCourses.map((course) => {
                                                                const scale = getScale(course.id);
                                                                return (
                                                                    <Animated.View key={course.id} style={{ flex: 1, transform: [{ scale }] }}>
                                                                        <CourseCard
                                                                            course={course}
                                                                            onClick={(c) => {
                                                                                animateScale(course.id, 1);
                                                                                !readOnly && onCourseClick(c);
                                                                            }}
                                                                        />
                                                                    </Animated.View>
                                                                );
                                                            })}
                                                        </View>
                                                    ) : (
                                                        <Animated.View style={{ flex: 1, transform: [{ scale: getScale(`${day}-${period}`) }] }}>
                                                            <TouchableOpacity
                                                                style={[styles.emptySlot, { borderColor: emptyBorder }]}
                                                                onPressIn={() => animateScale(`${day}-${period}`, 0.96)}
                                                                onPressOut={() => animateScale(`${day}-${period}`, 1)}
                                                                onPress={() => !readOnly && onEmptySlotClick(day, period)}
                                                                activeOpacity={readOnly ? 1 : 0.6}
                                                                delayPressIn={150}
                                                                disabled={readOnly}
                                                            >
                                                                {!readOnly && (
                                                                    <GlassView
                                                                        intensity={isDarkMode ? 35 : 55}
                                                                        tint={isDarkMode ? 'dark' : 'light'}
                                                                        style={styles.emptyGlass}
                                                                    >
                                                                        <Ionicons
                                                                            name="add"
                                                                            size={20}
                                                                            color={isDarkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)'}
                                                                        />
                                                                    </GlassView>
                                                                )}
                                                            </TouchableOpacity>
                                                        </Animated.View>
                                                    )}
                                                    {/* Current Time Indicator Line - Removed */}
                                                </>
                                            );
                                        })()}
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
        paddingVertical: 8,
    },
    periodNumber: {
        fontSize: 16,
        fontWeight: '900',
        marginBottom: 4,
        textAlign: 'center',
    },
    timeTextContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        gap: 1,
    },
    timeText: {
        fontSize: 9,
        fontWeight: '700',
        lineHeight: 10,
        textAlign: 'center',
    },
    timeTextDivider: {
        fontSize: 8,
        lineHeight: 8,
        opacity: 0.5,
        textAlign: 'center',
    },
    cell: {
        flex: 1,
        paddingHorizontal: 3,
    },
    emptySlot: {
        flex: 1,
        backgroundColor: 'transparent',
        borderRadius: 16,
        borderWidth: 1,
        borderStyle: 'solid',
        overflow: 'hidden',
    },
    emptyGlass: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default TimetableGrid;
