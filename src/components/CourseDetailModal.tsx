import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View, Modal, TouchableOpacity, TextInput, ScrollView, KeyboardAvoidingView, Platform, Alert, Image, Linking, Animated, BackHandler, Dimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import Svg, { Circle } from 'react-native-svg';

import { Course, AttendanceStatus, AttendanceRecord, Assignment, Settings } from '../lib/types';

interface CourseDetailModalProps {
    visible: boolean;
    course: Course | null;
    settings: Settings;
    onClose: () => void;
    onUpdate: (course: Course) => void;
    onEdit: (course: Course) => void;
    onDelete?: (courseId: string) => void;
    isDarkMode?: boolean;
}

export const CourseDetailModal: React.FC<CourseDetailModalProps> = ({
    visible,
    course,
    settings,
    onClose,
    onUpdate,
    onEdit,
    onDelete,
    isDarkMode = false
}) => {
    // -------------------------------------------------------------------------
    // 1. Hooks & State
    // -------------------------------------------------------------------------
    const [newAssignmentTitle, setNewAssignmentTitle] = useState('');
    const [assignmentDeadline, setAssignmentDeadline] = useState<Date | undefined>(undefined);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [viewingImage, setViewingImage] = useState<string | null>(null);

    // Animation state
    const slideAnim = React.useRef(new Animated.Value(Dimensions.get('window').height)).current;
    const [isVisible, setIsVisible] = useState(visible);

    React.useEffect(() => {
        if (visible) {
            setIsVisible(true);
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }).start();
        } else {
            Animated.timing(slideAnim, {
                toValue: Dimensions.get('window').height,
                duration: 300,
                useNativeDriver: true,
            }).start(() => setIsVisible(false));
        }
    }, [visible]);

    React.useEffect(() => {
        if (visible) {
            const backAction = () => {
                onClose();
                return true;
            };
            const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
            return () => backHandler.remove();
        }
    }, [visible, onClose]);



    // -------------------------------------------------------------------------
    // 2. Computed Values
    // -------------------------------------------------------------------------
    const stats = useMemo(() => {
        if (!course || !course.attendanceHistory) return { present: 0, absent: 0, late: 0, total: 0, rate: 0 };

        // Exclude cancelled classes from total
        const validHistory = course.attendanceHistory.filter(r => r.status !== 'cancelled');
        const total = validHistory.length;

        if (total === 0) return { present: 0, absent: 0, late: 0, total: 0, rate: 0 };

        const present = validHistory.filter(r => r.status === 'present').length;
        const late = validHistory.filter(r => r.status === 'late').length;
        const absent = validHistory.filter(r => r.status === 'absent').length;

        // Logic: N lates = 1 absence (Condensed)
        const limit = settings.latesEquivalentToAbsence || 3;

        const convertedAbsences = Math.floor(late / limit);
        const remainingLates = late % limit;

        // Effective Present = Real Present + Remaining Lates (counted as present)
        const effectivePresent = present + remainingLates;
        // Effective Absent = Real Absent + Converted Absences
        const effectiveAbsent = absent + convertedAbsences;

        // Effective Total Events = Effective Present + Effective Absent
        const effectiveTotal = effectivePresent + effectiveAbsent;

        const rate = effectiveTotal === 0 ? 0 : Math.round((effectivePresent / effectiveTotal) * 100);
        return { present, absent, late, total, rate };
    }, [course?.attendanceHistory, settings.latesEquivalentToAbsence]);

    // Theme Colors
    const bg = isDarkMode ? '#1F2937' : '#FFFFFF';
    const text = isDarkMode ? '#F3F4F6' : '#111827';
    const subText = isDarkMode ? '#9CA3AF' : '#6B7280';
    const itemBg = isDarkMode ? '#374151' : '#F9FAFB'; // A bit lighter for items
    const inputBg = isDarkMode ? '#374151' : '#F3F4F6';

    const gradients = {
        blue: ['#60A5FA', '#3B82F6'] as const,
        green: ['#34D399', '#10B981'] as const,
        orange: ['#FB923C', '#F97316'] as const,
        pink: ['#F472B6', '#EC4899'] as const,
        red: ['#F87171', '#EF4444'] as const,
    };

    // Rate Ring Color
    const rateColor = stats.total === 0 ? (isDarkMode ? '#4B5563' : '#D1D5DB') : (stats.rate >= 80 ? '#34D399' : stats.rate >= 60 ? '#FB923C' : '#F87171');

    const isNotificationOff = React.useMemo(() => {
        if (!course?.skipNotificationUntil) return false;
        return new Date(course.skipNotificationUntil) > new Date();
    }, [course?.skipNotificationUntil]);

    if (!isVisible || !course) return null;

    // -------------------------------------------------------------------------
    // 3. Handlers
    // -------------------------------------------------------------------------

    const handleDelete = () => {
        if (!onDelete) return;
        Alert.alert(
            "削除の確認",
            "この授業を削除しますか？\n(出席データも削除されます)",
            [
                { text: "キャンセル", style: "cancel" },
                {
                    text: "削除する",
                    style: "destructive",
                    onPress: () => {
                        onDelete(course.id);
                        onClose();
                    }
                }
            ]
        );
    };

    const toggleNotification = () => {
        let newVal: string | undefined;
        if (isNotificationOff) {
            // Turn ON -> clear the date
            newVal = undefined;
        } else {
            // Turn OFF -> set to 1 year in future
            const d = new Date();
            d.setFullYear(d.getFullYear() + 1);
            newVal = d.toISOString();
        }
        onUpdate({ ...course, skipNotificationUntil: newVal });
    };

    const addAttendance = (status: AttendanceStatus) => {
        const newRecord: AttendanceRecord = {
            id: Math.random().toString(36).substr(2, 9),
            date: new Date().toISOString(),
            status
        };
        const updatedHistory = [newRecord, ...(course.attendanceHistory || [])];
        onUpdate({ ...course, attendanceHistory: updatedHistory });
    };

    const removeAttendance = (status: AttendanceStatus) => {
        if (!course.attendanceHistory) return;
        // Find the FIRST record that matches (most recent)
        const idx = course.attendanceHistory.findIndex(r => r.status === status);
        if (idx !== -1) {
            const updatedHistory = [...course.attendanceHistory];
            updatedHistory.splice(idx, 1);
            onUpdate({ ...course, attendanceHistory: updatedHistory });
        }
    };

    const addAssignment = () => {
        if (!newAssignmentTitle.trim()) {
            Alert.alert("エラー", "課題のタイトルを入力してください。");
            return;
        }

        const newAssignment: Assignment = {
            id: Math.random().toString(36).substr(2, 9),
            title: newAssignmentTitle.trim(),
            deadline: assignmentDeadline ? assignmentDeadline.toISOString() : undefined,
            completed: false,
        };
        const updated = [...(course.assignments || []), newAssignment];
        onUpdate({ ...course, assignments: updated });
        Alert.alert("完了", "課題を追加しました。");
        setNewAssignmentTitle('');
        setAssignmentDeadline(undefined);
    };

    const toggleAssignment = (id: string) => {
        const updated = (course.assignments || []).map(a =>
            a.id === id ? { ...a, completed: !a.completed } : a
        );
        onUpdate({ ...course, assignments: updated });
    };

    const deleteAssignment = (id: string) => {
        const updated = (course.assignments || []).filter(a => a.id !== id);
        onUpdate({ ...course, assignments: updated });
    };

    const handleDateChange = (event: any, date?: Date) => {
        if (Platform.OS === 'android') {
            if (event.type === 'set' && date) {
                // Determine if we need to set time (conceptually)
                // For Android, we just set the date first.
                // If we want time, we need to trigger another picker.
                const current = assignmentDeadline || new Date();
                const newDate = new Date(current);
                newDate.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
                setAssignmentDeadline(newDate);

                // Ask for time immediately
                require('@react-native-community/datetimepicker').DateTimePickerAndroid.open({
                    value: newDate,
                    onChange: handleTimeChange,
                    mode: 'time',
                    is24Hour: true,
                });
            }
        } else {
            // iOS - stays open or handles differently depending on inline/spinner
            // but we assume standard modal behavior or inline
            if (date) {
                setAssignmentDeadline(date);
            }
        }
    };

    const handleTimeChange = (event: any, date?: Date) => {
        if (event.type === 'set' && date) {
            setAssignmentDeadline(date);
        }
    }

    const showAndroidDatePicker = () => {
        if (Platform.OS === 'android') {
            try {
                require('@react-native-community/datetimepicker').DateTimePickerAndroid.open({
                    value: assignmentDeadline || new Date(),
                    onChange: handleDateChange,
                    mode: 'date',
                });
            } catch (e) {
                console.warn("DatePicker error", e);
            }
        } else {
            // Toggle for iOS
            setShowDatePicker(!showDatePicker);
        }

    };

    const handleDeleteImage = (index: number) => {
        Alert.alert(
            "画像の削除",
            "この画像を削除しますか？",
            [
                { text: "キャンセル", style: "cancel" },
                {
                    text: "削除",
                    style: "destructive",
                    onPress: () => {
                        const updatedImages = [...(course.images || [])];
                        updatedImages.splice(index, 1);
                        onUpdate({ ...course, images: updatedImages });
                    }
                }
            ]
        );
    };

    const handleAddPhoto = async () => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('権限が必要です', '写真を追加するにはアクセス権限が必要です。');
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: false,
                quality: 0.8,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                const asset = result.assets[0];

                // Use simple directory logic with legacy API
                const baseDir = FileSystem.documentDirectory || FileSystem.cacheDirectory;

                if (!baseDir) {
                    Alert.alert("エラー", "保存先のディレクトリが見つかりません");
                    return;
                }

                const timestamp = Date.now();
                const fileName = `course_img_${timestamp}.jpg`;
                const destUri = baseDir + fileName;

                try {
                    await FileSystem.copyAsync({
                        from: asset.uri,
                        to: destUri
                    });
                    const updatedImages = [...(course.images || []), destUri];
                    onUpdate({ ...course, images: updatedImages });
                } catch (copyErr) {
                    console.error("Copy Error", copyErr);
                    Alert.alert("エラー", "画像の保存に失敗しました");
                }
            }
        } catch (e) {
            console.error(e);
            Alert.alert("エラー", "画像の選択に失敗しました");
        }
    };

    // -------------------------------------------------------------------------
    // 4. Render Helpers
    // -------------------------------------------------------------------------
    const renderCounter = (label: string, count: number, color: string, status: AttendanceStatus) => (
        <View style={[styles.counterRow, { backgroundColor: itemBg }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={[styles.dot, { backgroundColor: color }]} />
                <Text style={[styles.counterLabel, { color: text }]}>{label}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <TouchableOpacity
                    style={styles.circleBtn}
                    onPress={() => removeAttendance(status)}
                    disabled={count === 0}
                >
                    <Feather name="minus" size={16} color={count === 0 ? '#D1D5DB' : subText} />
                </TouchableOpacity>
                <Text style={[styles.counterValue, { color: text }]}>{count}</Text>
                <TouchableOpacity style={styles.circleBtn} onPress={() => addAttendance(status)}>
                    <Feather name="plus" size={16} color={subText} />
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={[StyleSheet.absoluteFill, { zIndex: 50, elevation: 50 }]}>
            <Animated.View
                style={[
                    styles.overlay,
                    { transform: [{ translateY: slideAnim }] }
                ]}
            >
                <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1}>
                    <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }} />
                </TouchableOpacity>

                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? "padding" : undefined}
                    style={{ justifyContent: 'flex-end' }}
                >
                    <View style={[styles.container, { backgroundColor: bg }]}>
                        {/* Drag Handle */}
                        <View style={{ alignItems: 'center', marginTop: 8, marginBottom: 20 }}>
                            <View style={{ width: 40, height: 4, backgroundColor: '#E5E7EB', borderRadius: 2 }} />
                        </View>

                        {/* 1. Header Section */}
                        <View style={styles.headerRow}>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.courseTitle, { color: text }]}>{course.name}</Text>



                                <View style={styles.tagRow}>
                                    {course.code ? (
                                        <View style={[styles.tag, { backgroundColor: itemBg }]}>
                                            <Feather name="hash" size={10} color={subText} style={{ marginRight: 4 }} />
                                            <Text style={[styles.tagText, { color: subText }]}>{course.code}</Text>
                                        </View>
                                    ) : null}
                                    {course.room ? (
                                        <View style={[styles.tag, { backgroundColor: itemBg }]}>
                                            <Feather name="map-pin" size={10} color={subText} style={{ marginRight: 4 }} />
                                            <Text style={[styles.tagText, { color: subText }]}>{course.room}</Text>
                                        </View>
                                    ) : null}
                                    <View style={[styles.tag, { backgroundColor: itemBg }]}>
                                        <Feather name="clock" size={10} color={subText} style={{ marginRight: 4 }} />
                                        <Text style={[styles.tagText, { color: subText }]}>
                                            {['月', '火', '水', '木', '金', '土'][['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(course.day)]}-{course.period}
                                        </Text>
                                    </View>
                                    {course.professor ? (
                                        <View style={[styles.tag, { backgroundColor: itemBg }]}>
                                            <Feather name="user" size={10} color={subText} style={{ marginRight: 4 }} />
                                            <Text style={[styles.tagText, { color: subText }]}>{course.professor}</Text>
                                        </View>
                                    ) : null}
                                </View>
                            </View>
                            <TouchableOpacity style={[styles.editBtn, { backgroundColor: itemBg }]} onPress={() => onEdit(course)}>
                                <Feather name="edit-2" size={20} color={text} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={{ maxHeight: 500 }} showsVerticalScrollIndicator={false}>

                            {/* 2. Attendance Section */}
                            <View style={styles.section}>
                                <View style={styles.attendanceContainer}>
                                    {/* Left: Circular Progress */}
                                    <View style={styles.graphContainer}>
                                        <View style={{ width: 100, height: 100, justifyContent: 'center', alignItems: 'center' }}>
                                            <Svg width="100" height="100" viewBox="0 0 100 100">
                                                <Circle
                                                    cx="50"
                                                    cy="50"
                                                    r="45"
                                                    stroke={isDarkMode ? "#374151" : "#E5E7EB"}
                                                    strokeWidth="8"
                                                    fill="none"
                                                />
                                                <Circle
                                                    cx="50"
                                                    cy="50"
                                                    r="45"
                                                    stroke={rateColor}
                                                    strokeWidth="8"
                                                    fill="none"
                                                    strokeDasharray={`${283 * (stats.rate / 100)} 283`}
                                                    strokeDashoffset="0"
                                                    rotation="-90"
                                                    origin="50, 50"
                                                    strokeLinecap="round"
                                                />
                                            </Svg>
                                            <View style={[styles.ringInner, { position: 'absolute' }]}>
                                                <Text style={[styles.rateText, { color: text }]}>{stats.rate}<Text style={{ fontSize: 16 }}>%</Text></Text>
                                                <Text style={[styles.rateLabel, { color: subText }]}>履歴を表示</Text>
                                            </View>
                                        </View>
                                    </View>
                                    {/* Right: Counters */}
                                    <View style={styles.countersContainer}>
                                        {renderCounter('出席', stats.present, '#34D399', 'present')}
                                        {renderCounter('遅刻', stats.late, '#FB923C', 'late')}
                                        {renderCounter('欠席', stats.absent, '#EF4444', 'absent')}
                                    </View>
                                </View>
                            </View>

                            {/* 3. Assignments Section */}
                            <View style={styles.section}>
                                <Text style={[styles.sectionTitle, { color: text }]}>課題・提出物</Text>
                                {/* Input */}
                                <View style={[styles.inputRow, { backgroundColor: inputBg }]}>
                                    <TextInput
                                        style={{ flex: 1, padding: 12, color: text }}
                                        placeholder="新しい課題を入力..."
                                        placeholderTextColor={subText}
                                        value={newAssignmentTitle}
                                        onChangeText={setNewAssignmentTitle}
                                        onSubmitEditing={addAssignment}
                                    />
                                    <TouchableOpacity onPress={showAndroidDatePicker} style={{ padding: 10 }}>
                                        <Feather name="calendar" size={20} color={assignmentDeadline ? '#3B82F6' : subText} />
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={addAssignment} style={styles.addBtn}>
                                        <Feather name="plus" size={20} color="white" />
                                    </TouchableOpacity>
                                </View>

                                {Platform.OS === 'ios' && showDatePicker && (
                                    <DateTimePicker
                                        value={assignmentDeadline || new Date()}
                                        mode="datetime"
                                        display="default"
                                        onChange={handleDateChange}
                                    />
                                )}

                                {/* List */}
                                <View style={{ gap: 8, marginTop: 12 }}>
                                    {course.assignments?.map((a) => (
                                        <View key={a.id} style={[styles.assignmentItem, { backgroundColor: itemBg }]}>
                                            <TouchableOpacity onPress={() => toggleAssignment(a.id)}>
                                                <Feather name={a.completed ? "check-circle" : "circle"} size={22} color={a.completed ? '#34D399' : subText} />
                                            </TouchableOpacity>
                                            <View style={{ flex: 1 }}>
                                                <Text style={{ fontSize: 15, color: a.completed ? subText : text, textDecorationLine: a.completed ? 'line-through' : 'none' }}>{a.title}</Text>
                                                {a.deadline && (
                                                    <Text style={{ fontSize: 12, color: '#EF4444', marginTop: 2 }}>
                                                        {new Date(a.deadline).toLocaleString('ja-JP', {
                                                            year: 'numeric', month: '2-digit', day: '2-digit',
                                                            hour: '2-digit', minute: '2-digit'
                                                        })}
                                                    </Text>
                                                )}
                                            </View>
                                            <TouchableOpacity onPress={() => deleteAssignment(a.id)}>
                                                <Feather name="trash-2" size={18} color={subText} />
                                            </TouchableOpacity>
                                        </View>
                                    ))}
                                </View>
                            </View>

                            {/* 4. Action Buttons (Delete & Notification) */}
                            <View style={styles.actionRow}>
                                <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
                                    <Feather name="trash-2" size={20} color="white" style={{ marginRight: 8 }} />
                                    <Text style={styles.buttonText}>削除</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.notificationButton, { backgroundColor: isNotificationOff ? '#9CA3AF' : '#F59E0B' }]}
                                    onPress={toggleNotification}
                                >
                                    <Feather name={isNotificationOff ? "bell-off" : "bell"} size={20} color="white" style={{ marginRight: 8 }} />
                                    <Text style={styles.buttonText}>{isNotificationOff ? "通知OFF" : "通知ON"}</Text>
                                </TouchableOpacity>
                            </View>

                            {/* Syllabus Button */}
                            {course.syllabusUrl && (
                                <TouchableOpacity
                                    style={[styles.syllabusButton, { backgroundColor: '#3B82F6', marginBottom: 28 }]}
                                    onPress={() => Linking.openURL(course.syllabusUrl!)}
                                >
                                    <Feather name="external-link" size={20} color="white" style={{ marginRight: 8 }} />
                                    <Text style={styles.buttonText}>シラバスを確認する</Text>
                                </TouchableOpacity>
                            )}

                            {/* 5. Notes Section */}
                            <View style={styles.section}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                    <Text style={[styles.sectionTitle, { color: text, marginBottom: 0 }]}>メモ</Text>
                                    <TouchableOpacity onPress={handleAddPhoto}>
                                        <Feather name="plus-circle" size={24} color="#3B82F6" />
                                    </TouchableOpacity>
                                </View>

                                <TextInput
                                    style={[styles.noteInput, { backgroundColor: itemBg, color: text }]}
                                    multiline
                                    placeholder="授業のメモ (教室変更、試験範囲など)..."
                                    placeholderTextColor={subText}
                                    value={course.notes || ''}
                                    onChangeText={(val) => onUpdate({ ...course, notes: val })}
                                />
                                {/* Images */}
                                {course.images && course.images.length > 0 && (
                                    <ScrollView
                                        horizontal
                                        showsHorizontalScrollIndicator={false}
                                        style={{ marginTop: 4 }}
                                        contentContainerStyle={{ paddingTop: 10, paddingRight: 10, paddingLeft: 2 }}
                                    >
                                        {course.images.map((img, idx) => (
                                            <View key={idx} style={{ marginRight: 12, position: 'relative' }}>
                                                <TouchableOpacity onPress={() => setViewingImage(img)}>
                                                    <Image source={{ uri: img }} style={{ width: 100, height: 100, borderRadius: 12 }} />
                                                </TouchableOpacity>
                                                <TouchableOpacity
                                                    style={{
                                                        position: 'absolute', top: -6, right: -6,
                                                        backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 12, padding: 4
                                                    }}
                                                    onPress={() => handleDeleteImage(idx)}
                                                >
                                                    <Feather name="x" size={12} color="white" />
                                                </TouchableOpacity>
                                            </View>
                                        ))}
                                    </ScrollView>
                                )}
                            </View>

                            {/* Bottom Spacer */}
                            <View style={{ height: 40 }} />

                        </ScrollView>

                        {/* Close chevron */}
                        <TouchableOpacity onPress={onClose} style={{ alignItems: 'center', paddingVertical: 10 }}>
                            <Feather name="chevron-down" size={24} color={subText} />
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </Animated.View>

            {/* Simple Image Viewer - Keep as real Modal */}
            <Modal visible={!!viewingImage} transparent={true} onRequestClose={() => setViewingImage(null)}>
                <View style={{ flex: 1, backgroundColor: 'black', justifyContent: 'center' }}>
                    <TouchableOpacity style={{ position: 'absolute', top: 40, right: 20, zIndex: 10, padding: 10 }} onPress={() => setViewingImage(null)}>
                        <Feather name="x" size={30} color="white" />
                    </TouchableOpacity>
                    {viewingImage && (
                        <Image source={{ uri: viewingImage }} style={{ width: '100%', height: '80%' }} resizeMode="contain" />
                    )}
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    container: {
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        paddingHorizontal: 24,
        paddingBottom: 20,
        maxHeight: '92%',
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 24,
    },
    courseTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    courseCode: {
        fontSize: 14,
        marginBottom: 8,
    },
    tagRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        alignItems: 'center',
    },
    tag: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    tagText: {
        fontSize: 11,
        fontWeight: '600',
    },
    editBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    section: {
        marginBottom: 28,
    },
    attendanceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 20,
    },
    graphContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    ring: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 6,
        justifyContent: 'center',
        alignItems: 'center',
    },
    ringInner: {
        alignItems: 'center',
    },
    rateText: {
        fontSize: 28,
        fontWeight: 'bold',
    },
    rateLabel: {
        fontSize: 10,
        marginTop: 2,
    },
    countersContainer: {
        flex: 1,
        gap: 8,
    },
    counterRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 10,
        borderRadius: 12,
    },
    dot: {
        width: 6,
        height: 16,
        borderRadius: 3,
        marginRight: 10,
    },
    counterLabel: {
        fontSize: 14,
        fontWeight: '600',
    },
    circleBtn: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'white',
    },
    counterValue: {
        fontSize: 16,
        fontWeight: 'bold',
        minWidth: 16,
        textAlign: 'center',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        paddingRight: 6,
    },
    addBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#4F46E5', // Indigo
        justifyContent: 'center',
        alignItems: 'center',
    },
    assignmentItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
        gap: 12,
    },
    actionRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 28,
    },
    deleteButton: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: '#EF4444',
        paddingVertical: 14,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    notificationButton: {
        flex: 1,
        flexDirection: 'row',
        paddingVertical: 14,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 15,
    },
    noteInput: {
        borderRadius: 16,
        padding: 16,
        fontSize: 14,
        minHeight: 120,
        textAlignVertical: 'top',
    },
    syllabusButton: {
        flexDirection: 'row',
        paddingVertical: 14,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
