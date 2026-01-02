import React, { useMemo } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { Course, Day, Settings, DAY_LABELS, DAYS, COLORS, Assignment } from '../lib/types';
import { calculateTime, getCurrentMinutes } from '../lib/timeUtils';
import CourseCard from './CourseCard';
import { Feather } from '@expo/vector-icons';
import { ThemedText } from './ThemedText';
import { translations } from '../lib/i18n';

interface NextClassViewProps {
    courses: Course[];
    settings: Settings;
    onCourseClick: (course: Course) => void;
    onUpdateCourse: (course: Course) => void;
    isDarkMode?: boolean;
}

export const NextClassView: React.FC<NextClassViewProps> = ({ courses, settings, onCourseClick, onUpdateCourse, isDarkMode = false }) => {
    // Determine the "Smart" default date (Today or Next Busy Day)
    const initialOffset = useMemo(() => {
        const now = new Date();
        const currentDayIndex = (now.getDay() + 6) % 7; // Mon=0 ... Sun=6
        // Use local minute calc
        const currentMins = now.getHours() * 60 + now.getMinutes();
        const currentDay = DAYS[currentDayIndex >= 6 ? 0 : currentDayIndex];

        // 1. Check Today
        const isTodaySunday = currentDayIndex >= 6;
        if (!isTodaySunday) {
            const todaysCourses = courses.filter(c => c.day === currentDay);
            let lastCourseEndMins = 0;
            todaysCourses.forEach(c => {
                const time = calculateTime(
                    c.period,
                    settings.firstPeriodStart,
                    settings.thirdPeriodStart,
                    settings.periodDuration,
                    settings.breakDuration,
                    settings.customPeriodDurations,
                    c.day
                );
                if (time.endMinutes > lastCourseEndMins) {
                    lastCourseEndMins = time.endMinutes;
                }
            });
            // If valid today (Show today until the very end of the last class)
            if (todaysCourses.length > 0 && currentMins <= lastCourseEndMins) {
                return 0; // Today
            }
            // If today has courses but they are all finished, we fall through to search next busy day.
            // If today has NO courses, we also fall through.
        }

        // 2. Search for Next Busy Day
        for (let i = 1; i <= 7; i++) {
            const nextIdx = (currentDayIndex + i) % 7;
            if (nextIdx >= 6) continue; // Skip Sunday
            const dayName = DAYS[nextIdx];
            if (courses.some(c => c.day === dayName)) {
                return i;
            }
        }
        return isTodaySunday ? 1 : 1; // Default to tomorrow
    }, [courses, settings]);

    const [dateOffset, setDateOffset] = React.useState(initialOffset);

    // Sync state with calculated smart offset (e.g. when courses load)
    React.useEffect(() => {
        setDateOffset(initialOffset);
    }, [initialOffset]);

    // Reset to "Smart" default only when courses change significantly (optional, but good for UX)
    // For now, we keep manual navigation persistent until component unmounts or hard reload.

    const targetDate = useMemo(() => {
        const d = new Date();
        d.setDate(d.getDate() + dateOffset);
        return d;
    }, [dateOffset]);

    const targetDayStr = useMemo(() => {
        const dayIdx = (targetDate.getDay() + 6) % 7;
        return dayIdx >= 6 ? 'Holiday' : DAYS[dayIdx]; // Handle Sunday
    }, [targetDate]);

    const isFuture = dateOffset > 0;
    const isToday = dateOffset === 0;

    const t = translations[settings.language];

    const label = useMemo(() => {
        if (isToday) return t.todaySchedule;
        if (dateOffset === 1) return t.tomorrowSchedule;
        if (dateOffset === -1) return t.yesterdaySchedule;
        return `${targetDate.getMonth() + 1}/${targetDate.getDate()} ${t.scheduleFor}`;
    }, [targetDate, isToday, dateOffset, t]);

    const targetCourses = useMemo(() => {
        if (targetDayStr === 'Holiday') return [];
        return courses
            .filter(c => c.day === targetDayStr)
            .sort((a, b) => a.period - b.period);
    }, [courses, targetDayStr]);

    // Assignments Logic (Keep existing)
    const allAssignments = useMemo(() => {
        const list: { course: Course, assignment: Assignment }[] = [];
        const seenIds = new Set<string>();
        courses.forEach(c => {
            (c.assignments || []).forEach(a => {
                if (!a.completed && !seenIds.has(a.id)) {
                    list.push({ course: c, assignment: a });
                    seenIds.add(a.id);
                }
            });
        });
        return list.sort((a, b) => {
            const timeA = a.assignment.deadline ? new Date(a.assignment.deadline).getTime() : 9999999999999;
            const timeB = b.assignment.deadline ? new Date(b.assignment.deadline).getTime() : 9999999999999;
            return timeA - timeB;
        });
    }, [courses]);

    const toggleAssignment = (course: Course, assignmentId: string) => {
        const updatedAssignments = (course.assignments || []).map(a =>
            a.id === assignmentId ? { ...a, completed: !a.completed } : a
        );
        onUpdateCourse({ ...course, assignments: updatedAssignments });
    };

    const getDeadlineColor = (deadline?: string) => {
        if (!deadline) return textSecondary;
        const now = new Date();
        const target = new Date(deadline);

        // Debug Log
        console.log(`Deadline: ${deadline}, Parsed: ${target}, DiffDays: ${(target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)}`);

        if (isNaN(target.getTime())) return textSecondary;

        const diffTime = target.getTime() - now.getTime();
        const diffDays = diffTime / (1000 * 60 * 60 * 24);

        if (diffTime < 0) return '#ef4444'; // Already passed
        if (diffDays <= 1) return '#ef4444'; // Red (Urgent / <= 24h)
        if (diffDays <= 3) return '#f59e0b'; // Orange (Warning / <= 72h)
        return '#22c55e'; // Green (Safe)
    };

    const formatDeadline = (deadline?: string) => {
        if (!deadline) return '';
        const now = new Date();
        const date = new Date(deadline);

        if (isNaN(date.getTime())) return deadline; // Fallback to raw string if parse fails

        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        const hour = date.getHours();
        const minute = date.getMinutes();

        const pad = (n: number) => n.toString().padStart(2, '0');

        let dateStr = `${month}/${day}`;
        if (year !== now.getFullYear()) {
            dateStr = `${year}/${month}/${day}`;
        }

        return `${dateStr} ${pad(hour)}:${pad(minute)}`;
    }

    const textPrimary = isDarkMode ? '#f8fafc' : '#1e293b';
    const textSecondary = isDarkMode ? '#94a3b8' : '#64748b';
    const cardBg = isDarkMode ? '#1e293b' : 'white';
    const borderColor = isDarkMode ? '#334155' : '#f1f5f9';

    // Swipe Handling
    const touchStartRef = React.useRef<{ x: number, y: number } | null>(null);
    const isSwipingRef = React.useRef(false);

    const onTouchStart = (e: any) => {
        // If tab swipe is enabled, disable local day-swipe to prevent conflict
        if (settings.enableSwipeNavigation) return;

        touchStartRef.current = { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY };
        isSwipingRef.current = false;
    };

    const onTouchMove = (e: any) => {
        if (!touchStartRef.current) return;
        const dx = e.nativeEvent.pageX - touchStartRef.current.x;
        const dy = e.nativeEvent.pageY - touchStartRef.current.y;

        // If moved significantly, mark as swiping
        if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
            isSwipingRef.current = true;
        }
    };

    const onTouchEnd = (e: any) => {
        if (!touchStartRef.current) return;
        const touchEnd = { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY };
        const dx = touchEnd.x - touchStartRef.current.x;
        const dy = touchEnd.y - touchStartRef.current.y;

        // If swipe horizontal dominates vertical
        if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
            if (dx > 0) {
                // Swipe Right -> Prev Day
                setDateOffset(prev => prev - 1);
            } else {
                // Swipe Left -> Next Day
                setDateOffset(prev => prev + 1);
            }
        }
        touchStartRef.current = null;
        // Reset swiping ref after a small delay to allow onPress to read it? 
        // Actually onPress fires before or during this bubble? 
        // Usually onPress fires, then we might process other things. 
        // But if isSwiping is true, we want onPress to FAIL.
        setTimeout(() => { isSwipingRef.current = false; }, 100);
    };

    const handleCoursePress = (course: Course) => {
        if (isSwipingRef.current) return;
        onCourseClick(course);
    };

    return (
        <View style={styles.container} onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => setDateOffset(prev => prev - 1)} style={{ padding: 8 }}>
                    <Feather name="chevron-left" size={24} color={textSecondary} />
                </TouchableOpacity>

                <View style={{ alignItems: 'center' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Feather name={isFuture ? "calendar" : "clock"} size={16} color={isFuture ? "#f59e0b" : "#4f46e5"} />
                        <ThemedText style={[styles.title, { color: textPrimary, fontSize: 18 }]}>
                            {label}
                        </ThemedText>
                    </View>
                    <ThemedText style={{ fontSize: 12, color: textSecondary }}>
                        {targetDayStr === 'Holiday' ? t.holiday : (settings.language === 'en' ? DAY_LABELS[targetDayStr as Day] : `${DAY_LABELS[targetDayStr as Day]}曜日`)}
                    </ThemedText>
                </View>

                <TouchableOpacity onPress={() => setDateOffset(prev => prev + 1)} style={{ padding: 8 }}>
                    <Feather name="chevron-right" size={24} color={textSecondary} />
                </TouchableOpacity>
            </View>

            {targetCourses.length === 0 ? (
                <View style={[styles.emptyState, { borderColor: isDarkMode ? '#334155' : '#e2e8f0' }]}>
                    <Feather name="coffee" size={48} color={textSecondary} />
                    <ThemedText style={[styles.emptyText, { color: textSecondary }]}>{t.noSchedule}</ThemedText>
                    <ThemedText style={[styles.emptySubText, { color: textSecondary }]}>{t.goodTime}</ThemedText>
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
                    {targetCourses.map(course => {
                        const badgeColor = course.color || '#4f46e5';
                        const isLightBg = COLORS.includes(badgeColor);
                        const badgeTextColor = isLightBg ? '#1e293b' : 'white';
                        const incompleteAssignments = (course.assignments || []).filter(a => !a.completed);

                        return (
                            <TouchableOpacity
                                key={course.id}
                                style={[styles.largeCard, { borderLeftColor: badgeColor, backgroundColor: cardBg }]}
                                onPress={() => handleCoursePress(course)}
                                activeOpacity={0.9}
                                delayPressIn={100}
                            >
                                <View style={styles.cardHeader}>
                                    <View style={[styles.periodBadge, { backgroundColor: badgeColor }]}>
                                        <ThemedText style={[styles.periodBadgeText, { color: badgeTextColor }]}>{course.period}限</ThemedText>
                                    </View>
                                    <View style={styles.timeInfo}>
                                        {course.room ? (
                                            <View style={styles.roomContainer}>
                                                <Feather name="map-pin" size={14} color={isDarkMode ? '#94a3b8' : '#64748b'} />
                                                <ThemedText style={[styles.roomText, { color: isDarkMode ? '#94a3b8' : '#64748b' }]}>{course.room}</ThemedText>
                                            </View>
                                        ) : (
                                            <ThemedText style={[styles.roomText, { color: isDarkMode ? '#94a3b8' : '#64748b' }]}>教室未定</ThemedText>
                                        )}
                                    </View>
                                </View>

                                <ThemedText style={[styles.largeCardTitle, { color: isDarkMode ? '#f8fafc' : '#1e293b' }]}>
                                    {course.name}
                                </ThemedText>

                                <View style={styles.cardFooter}>
                                    {course.professor ? (
                                        <View style={styles.professorContainer}>
                                            <Feather name="user" size={14} color={isDarkMode ? '#94a3b8' : '#64748b'} />
                                            <ThemedText style={[styles.professorText, { color: isDarkMode ? '#94a3b8' : '#64748b' }]}>{course.professor}</ThemedText>
                                        </View>
                                    ) : <View />}
                                </View>

                                {/* Assignments List */}
                                {incompleteAssignments.length > 0 && (
                                    <View style={[styles.assignmentsSection, { borderTopColor: borderColor }]}>
                                        <View style={styles.assignmentHeader}>
                                            <Feather name="check-square" size={14} color={textSecondary} />
                                            <ThemedText style={[styles.assignmentLabel, { color: textSecondary }]}>課題</ThemedText>
                                        </View>
                                        <View style={{ gap: 8 }}>
                                            {incompleteAssignments.map(a => (
                                                <TouchableOpacity
                                                    key={a.id}
                                                    style={[styles.assignmentRow, { alignItems: 'flex-start' }]}
                                                    onPress={() => toggleAssignment(course, a.id)}
                                                >
                                                    <Feather name="square" size={20} color={textPrimary} style={{ marginTop: 2 }} />
                                                    <View style={{ flex: 1 }}>
                                                        <ThemedText style={[styles.assignmentText, { color: textPrimary }]}>{a.title}</ThemedText>
                                                        {a.deadline && (
                                                            <ThemedText style={{ fontSize: 11, color: getDeadlineColor(a.deadline) }}>{formatDeadline(a.deadline)}</ThemedText>
                                                        )}
                                                    </View>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    </View>
                                )}
                            </TouchableOpacity>
                        );
                    })}
                    {/* All Assignments Section */}
                    {allAssignments.length > 0 && (
                        <View style={{ marginTop: 24, paddingBottom: 24 }}>
                            <View style={styles.header}>
                                <Feather name="check-circle" size={20} color={textPrimary} />
                                <ThemedText style={[styles.title, { color: textPrimary, fontSize: 18 }]}>{t.todo}</ThemedText>
                            </View>
                            <View style={[styles.largeCard, { backgroundColor: cardBg, borderLeftWidth: 0, padding: 16 }]}>
                                <View style={{ gap: 12 }}>
                                    {allAssignments.map(({ course, assignment }) => (
                                        <TouchableOpacity
                                            key={assignment.id}
                                            style={[styles.assignmentRow, { alignItems: 'flex-start' }]}
                                            onPress={() => toggleAssignment(course, assignment.id)}
                                        >
                                            <Feather name="square" size={20} color={textPrimary} style={{ marginTop: 2 }} />
                                            <View style={{ flex: 1 }}>
                                                <ThemedText style={[styles.assignmentText, { color: textPrimary }]}>{assignment.title}</ThemedText>
                                                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 6 }}>
                                                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: course.color || '#ccc' }} />
                                                    <ThemedText style={{ fontSize: 11, color: textSecondary }}>
                                                        {course.name}
                                                    </ThemedText>
                                                    {assignment.deadline ? (
                                                        <ThemedText style={{ fontSize: 11, color: getDeadlineColor(assignment.deadline) }}>
                                                            • {formatDeadline(assignment.deadline)}
                                                        </ThemedText>
                                                    ) : null}
                                                </View>
                                            </View>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        </View>
                    )}

                    <View style={{ height: 100 }} />
                </ScrollView>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 12, // Reduced from 16
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 4, // Reduced
        // Removed paddingVertical to fix spacing issue
        marginTop: 12,
    },
    title: {
        fontSize: 22,
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    list: {
        paddingBottom: 20,
    },
    largeCard: {
        borderRadius: 12, // Reduced
        padding: 10, // Compact padding
        marginBottom: 8, // Compact margin
        borderLeftWidth: 4, // Thinner border
        // Shadow
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 2, // Tighter spacing
    },
    periodBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    periodBadgeText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 11, // Smaller badge
    },
    timeInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    roomContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
    },
    roomText: {
        fontSize: 11,
        fontWeight: '600',
    },
    largeCardTitle: {
        fontSize: 16, // Compact text
        fontWeight: 'bold',
        marginBottom: 2,
        lineHeight: 22,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 2,
    },
    professorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    professorText: {
        fontSize: 11,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderStyle: 'dashed',
        borderRadius: 20,
        marginVertical: 40,
        opacity: 0.8,
    },
    emptyText: {
        fontSize: 16,
        fontWeight: 'bold',
        marginTop: 16,
    },
    emptySubText: {
        fontSize: 12,
        marginTop: 4,
    },
    // Assignment Styles
    assignmentsSection: {
        marginTop: 8, // Compact
        paddingTop: 4, // Reduced
        borderTopWidth: 1,
    },
    assignmentHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: 4,
    },
    assignmentLabel: {
        fontSize: 10,
        fontWeight: 'bold',
    },
    assignmentRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4, // Reduced
        paddingVertical: 0, // Very tight
    },
    assignmentText: {
        fontSize: 13,
        fontWeight: '500',
    }
});
