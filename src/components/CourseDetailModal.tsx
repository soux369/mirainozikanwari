import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View, Modal, TouchableOpacity, TextInput, ScrollView, KeyboardAvoidingView, Platform, Linking, Alert, Image } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { Course, AttendanceStatus, AttendanceRecord, COLORS, Settings, Assignment } from '../lib/types';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

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
    const handleDelete = () => {
        if (!course || !onDelete) return;
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
    const [newAssignmentTitle, setNewAssignmentTitle] = useState('');
    const [assignmentDeadline, setAssignmentDeadline] = useState<Date | undefined>(undefined);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [viewingImage, setViewingImage] = useState<string | null>(null);

    const handleAddPhoto = async () => {
        Alert.alert(
            "写真を追加",
            "カメラで撮影するか、ライブラリから選択するかを選んでください。",
            [
                { text: "キャンセル", style: "cancel" },
                {
                    text: "写真を撮る",
                    onPress: async () => {
                        const { status } = await ImagePicker.requestCameraPermissionsAsync();
                        if (status !== 'granted') {
                            Alert.alert('許可が必要です', 'カメラを使用するには許可が必要です。');
                            return;
                        }
                        const result = await ImagePicker.launchCameraAsync({
                            mediaTypes: ImagePicker.MediaTypeOptions.Images,
                            quality: 0.7,
                        });
                        if (!result.canceled && result.assets[0].uri) {
                            saveImage(result.assets[0].uri);
                        }
                    }
                },
                {
                    text: "ライブラリから選択",
                    onPress: async () => {
                        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                        if (status !== 'granted') {
                            Alert.alert('許可が必要です', '写真ライブラリを使用するには許可が必要です。');
                            return;
                        }
                        const result = await ImagePicker.launchImageLibraryAsync({
                            mediaTypes: ImagePicker.MediaTypeOptions.Images,
                            quality: 0.7,
                        });
                        if (!result.canceled && result.assets[0].uri) {
                            saveImage(result.assets[0].uri);
                        }
                    }
                }
            ]
        );
    };

    const saveImage = async (uri: string) => {
        if (!course) return;
        try {
            // Move to app documents to ensure persistence? 
            // expo-image-picker returns cache dir mostly.
            // Better to copy.
            const filename = uri.split('/').pop();
            const newPath = FileSystem.documentDirectory + (filename || `photo_${Date.now()}.jpg`);
            await FileSystem.copyAsync({ from: uri, to: newPath });

            const newImages = [...(course.images || []), newPath];
            onUpdate({ ...course, images: newImages });
        } catch (e) {
            console.error(e);
            Alert.alert('保存エラー', '写真の保存に失敗しました。');
        }
    };

    const handleDeletePhoto = (uri: string) => {
        Alert.alert("写真を削除", "本当に削除しますか？", [
            { text: "キャンセル", style: "cancel" },
            {
                text: "削除する", style: "destructive",
                onPress: async () => {
                    if (!course) return;
                    // Remove from list
                    const newImages = (course.images || []).filter(i => i !== uri);
                    onUpdate({ ...course, images: newImages });
                    // Optionally delete file from storage to save space
                    try {
                        await FileSystem.deleteAsync(uri, { idempotent: true });
                    } catch (e) { }
                }
            }
        ]);
    };

    const handleViewPhoto = (uri: string) => {
        setViewingImage(uri);
    };



    // Theme Colors
    const bg = isDarkMode ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)';
    const text = isDarkMode ? '#f8fafc' : '#1e293b';
    const subText = isDarkMode ? '#94a3b8' : '#64748b';
    const itemBg = isDarkMode ? '#334155' : '#ffffff';
    const inputBg = isDarkMode ? '#1e293b' : '#f1f5f9';
    const borderColor = isDarkMode ? '#334155' : '#e2e8f0';

    // Gradient definitions
    const gradients = {
        present: ['#4ade80', '#22c55e'] as const, // Green
        late: ['#facc15', '#eab308'] as const,    // Yellow
        absent: ['#f87171', '#ef4444'] as const,  // Red
        neutral: isDarkMode ? ['#475569', '#334155'] as const : ['#f1f5f9', '#e2e8f0'] as const,
    };

    const stats = useMemo(() => {
        const records = course?.attendance || [];
        const total = records.length;
        const present = records.filter(r => r.status === 'present').length;
        const late = records.filter(r => r.status === 'late').length;
        const absent = records.filter(r => r.status === 'absent').length;
        const cancelled = records.filter(r => r.status === 'cancelled').length;

        const effectiveTotal = total - cancelled;

        // Logic: N Lates = 1 Absence (Compressed)
        const n = settings.latesEquivalentToAbsence || 3;

        const convertedAbsences = Math.floor(late / n);
        const remainingLates = late % n;

        // Effective counts after compression
        const effectivePresent = present;
        const effectiveAbsent = absent + convertedAbsences;
        const effectiveLate = remainingLates;

        // Total decreases because N lates are compressed into 1 absence
        const compressedTotal = effectivePresent + effectiveAbsent + effectiveLate;

        // Attended count (Present + Remaining Lates)
        const attendedCount = effectivePresent + effectiveLate;

        const rate = compressedTotal > 0 ? Math.round((attendedCount / compressedTotal) * 100) : 0;
        return { total, present, late, absent, cancelled, rate, penaltyFromLates: convertedAbsences };
    }, [course?.attendance, settings.latesEquivalentToAbsence]);

    // Rate Gradient Logic
    const rateGradient = stats.rate >= 80 ? gradients.present : stats.rate >= 60 ? gradients.late : gradients.absent;

    const updateAttendance = (status: AttendanceStatus, delta: number) => {
        if (!course) return;
        const records = [...(course.attendance || [])];
        if (delta > 0) {
            records.push({ date: new Date().toISOString().split('T')[0], status });
        } else {
            let indexToRemove = -1;
            for (let i = records.length - 1; i >= 0; i--) {
                if (records[i].status === status) {
                    indexToRemove = i;
                    break;
                }
            }
            if (indexToRemove !== -1) records.splice(indexToRemove, 1);
        }
        onUpdate({ ...course, attendance: records });
    };

    const addAssignment = () => {
        if (!course || !newAssignmentTitle.trim()) return;

        let deadlineStr: string | undefined = undefined;
        if (assignmentDeadline) {
            const m = assignmentDeadline.getMonth() + 1;
            const d = assignmentDeadline.getDate();
            deadlineStr = `${m}/${d}`;
        }

        const newAssignment: Assignment = {
            id: Math.random().toString(36).substr(2, 9),
            title: newAssignmentTitle.trim(),
            deadline: deadlineStr,
            completed: false,
        };
        const updated = [...(course.assignments || []), newAssignment];
        onUpdate({ ...course, assignments: updated });
        setNewAssignmentTitle('');
        setAssignmentDeadline(undefined);
    };

    const handleDateChange = (event: any, selectedDate?: Date) => {
        if (Platform.OS === 'android') {
            setShowDatePicker(false);
        }
        if (selectedDate) {
            setAssignmentDeadline(selectedDate);
        }
    };

    const toggleAssignment = (id: string) => {
        if (!course) return;
        const updated = (course.assignments || []).map(a =>
            a.id === id ? { ...a, completed: !a.completed } : a
        );
        onUpdate({ ...course, assignments: updated });
    };

    const deleteAssignment = (id: string) => {
        if (!course) return;
        const updated = (course.assignments || []).filter(a => a.id !== id);
        onUpdate({ ...course, assignments: updated });
    };

    const renderRow = (status: AttendanceStatus, label: string, gradientColors: readonly [string, string]) => (
        <View key={status} style={[styles.rowItem, { backgroundColor: itemBg }]}>
            {/* Gradient Line Accent */}
            <LinearGradient
                colors={gradientColors}
                start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
                style={styles.rowAccent}
            />

            <Text style={[styles.rowLabel, { color: subText }]}>{label}</Text>

            <View style={styles.rowControls}>
                <TouchableOpacity onPress={() => updateAttendance(status, -1)} style={[styles.miniButton, { borderColor: subText }]}>
                    <Feather name="minus" size={14} color={text} />
                </TouchableOpacity>
                <Text style={[styles.rowValue, { color: text }]}>
                    {(course.attendance || []).filter(r => r.status === status).length}
                </Text>
                <TouchableOpacity onPress={() => updateAttendance(status, 1)} style={[styles.miniButton, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', borderColor: 'transparent' }]}>
                    <Feather name="plus" size={14} color={text} />
                </TouchableOpacity>
            </View>
        </View>
    );

    if (!course) return null;

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
        >
            <BlurView intensity={25} tint={isDarkMode ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />

            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : undefined}
                style={{ flex: 1 }}
            >
                <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
                    <View onStartShouldSetResponder={() => true} style={[styles.container, { backgroundColor: bg }]}>

                        {/* Header */}
                        <View style={styles.header}>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.title, { color: text }]}>{course.name}</Text>
                                <View style={styles.tagRow}>
                                    <LinearGradient colors={isDarkMode ? ['#334155', '#1e293b'] : ['#f1f5f9', '#e2e8f0']} style={styles.tag} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                                        <Text style={[styles.tagText, { color: subText }]}>{course.code || course.id.substring(0, 6)}</Text>
                                    </LinearGradient>
                                    <LinearGradient colors={isDarkMode ? ['#334155', '#1e293b'] : ['#f1f5f9', '#e2e8f0']} style={styles.tag} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                                        <Text style={[styles.tagText, { color: subText }]}>{course.day}-{course.period}</Text>
                                    </LinearGradient>
                                    {course.professor && (
                                        <LinearGradient colors={isDarkMode ? ['#334155', '#1e293b'] : ['#f1f5f9', '#e2e8f0']} style={styles.tag} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                                            <Text style={[styles.tagText, { color: subText }]}>{course.professor}</Text>
                                        </LinearGradient>
                                    )}
                                </View>
                            </View>
                            <TouchableOpacity onPress={() => { onClose(); onEdit(course); }} style={[styles.iconBtn, { backgroundColor: isDarkMode ? '#334155' : '#f1f5f9' }]}>
                                <Feather name="edit-3" size={18} color={text} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={{ maxHeight: 500 }} showsVerticalScrollIndicator={false}>
                            {/* Attendance Content */}
                            <View style={styles.contentRow}>

                                {/* Gradient Rate Ring */}
                                <View style={styles.rateCardContainer}>
                                    <TouchableOpacity
                                        onPress={() => setShowHistory(true)}
                                        activeOpacity={0.8}
                                    >
                                        <LinearGradient
                                            colors={rateGradient}
                                            style={styles.gradientRing}
                                            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                                        >
                                            <View style={[styles.innerCircle, { backgroundColor: itemBg }]}>
                                                <View style={{ alignItems: 'center' }}>
                                                    <Text style={[styles.rateText, { color: text }]}>{stats.rate}<Text style={{ fontSize: 14 }}>%</Text></Text>
                                                    <Text style={[styles.rateLabel, { color: subText }]}>履歴を表示</Text>
                                                </View>
                                            </View>
                                        </LinearGradient>
                                    </TouchableOpacity>
                                </View>

                                {/* Attendance History Modal */}
                                <Modal
                                    visible={showHistory}
                                    transparent
                                    animationType="fade"
                                    onRequestClose={() => setShowHistory(false)}
                                >
                                    <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 }}>
                                        <View style={{ backgroundColor: itemBg, borderRadius: 20, padding: 20, maxHeight: '60%' }}>
                                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                                <Text style={{ fontSize: 18, fontWeight: 'bold', color: text }}>出席履歴</Text>
                                                <TouchableOpacity onPress={() => setShowHistory(false)}>
                                                    <Feather name="x" size={24} color={subText} />
                                                </TouchableOpacity>
                                            </View>

                                            <ScrollView contentContainerStyle={{ gap: 8 }}>
                                                {(course.attendance || []).length === 0 ? (
                                                    <Text style={{ color: subText, textAlign: 'center', padding: 20 }}>記録はありません</Text>
                                                ) : (
                                                    [...(course.attendance || [])].reverse().map((record, index) => (
                                                        <View key={index} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: subText + '40' }}>
                                                            <Text style={{ color: text, fontSize: 15 }}>{record.date.replace(/-/g, '/')}</Text>
                                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                                                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: record.status === 'present' ? '#22c55e' : (record.status === 'late' ? '#eab308' : '#ef4444') }} />
                                                                <Text style={{
                                                                    color: record.status === 'present' ? '#22c55e' : (record.status === 'late' ? '#eab308' : '#ef4444'),
                                                                    fontWeight: 'bold'
                                                                }}>
                                                                    {record.status === 'present' ? '出席' : (record.status === 'late' ? '遅刻' : (record.status === 'absent' ? '欠席' : '休講'))}
                                                                </Text>
                                                            </View>
                                                        </View>
                                                    ))
                                                )}
                                            </ScrollView>
                                        </View>
                                    </View>
                                </Modal>

                                {/* Controls */}
                                <View style={styles.countersColumn}>
                                    {renderRow('present', '出席', gradients.present)}
                                    {renderRow('late', '遅刻', gradients.late)}
                                    {renderRow('absent', '欠席', gradients.absent)}
                                </View>
                            </View>

                            {/* Syllabus Link */}
                            {course.syllabusUrl ? (
                                <TouchableOpacity
                                    onPress={() => Linking.openURL(course.syllabusUrl!)}
                                    style={[styles.section, { marginTop: 0, marginBottom: 24, backgroundColor: itemBg, padding: 16, borderRadius: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }]}
                                >
                                    <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: isDarkMode ? 'rgba(56, 189, 248, 0.2)' : '#e0f2fe', justifyContent: 'center', alignItems: 'center' }}>
                                        <Feather name="external-link" size={20} color={isDarkMode ? '#38bdf8' : '#0284c7'} />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={{ fontSize: 14, fontWeight: 'bold', color: text }}>シラバスを開く</Text>
                                        <Text style={{ fontSize: 11, color: subText }} numberOfLines={1}>{course.syllabusUrl}</Text>
                                    </View>
                                    <Feather name="chevron-right" size={20} color={subText} />
                                </TouchableOpacity>
                            ) : null}

                            {/* Assignments Section */}
                            <View style={styles.section}>
                                <Text style={[styles.sectionTitle, { color: text }]}>課題・提出物</Text>

                                <View style={{ gap: 8 }}>
                                    {(course.assignments || []).filter(a => !a.completed).map(a => (
                                        <View key={a.id} style={[styles.assignmentItem, { backgroundColor: itemBg }]}>
                                            <TouchableOpacity onPress={() => toggleAssignment(a.id)} style={styles.checkbox}>
                                                <Feather name="square" size={20} color={subText} />
                                            </TouchableOpacity>
                                            <Text style={[styles.assignmentTitle, { color: text }]}>{a.title}</Text>
                                            <TouchableOpacity onPress={() => deleteAssignment(a.id)} style={{ marginLeft: 'auto' }}>
                                                <Feather name="trash-2" size={16} color="#ef4444" />
                                            </TouchableOpacity>
                                        </View>
                                    ))}
                                </View>

                                {/* Complete Tasks Toggle (Optional - hidden for now to match request "disappear") */}

                                <View style={styles.addAssignmentRow}>
                                    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: inputBg, borderRadius: 8, paddingHorizontal: 12 }}>
                                        <TextInput
                                            style={[styles.assignmentInput, { backgroundColor: 'transparent', flex: 1, color: text, paddingHorizontal: 0 }]}
                                            placeholder="新しい課題を入力..."
                                            placeholderTextColor={subText}
                                            value={newAssignmentTitle}
                                            onChangeText={setNewAssignmentTitle}
                                            onSubmitEditing={addAssignment}
                                        />
                                        <TouchableOpacity onPress={() => setShowDatePicker(!showDatePicker)}>
                                            <Feather name="calendar" size={18} color={assignmentDeadline ? '#4f46e5' : subText} />
                                        </TouchableOpacity>
                                    </View>
                                    <TouchableOpacity
                                        style={[styles.miniButton, { backgroundColor: '#4f46e5', borderColor: '#4f46e5', width: 32, height: 32, borderRadius: 16 }]}
                                        onPress={addAssignment}
                                    >
                                        <Feather name="plus" size={18} color="white" />
                                    </TouchableOpacity>
                                </View>
                                <View style={{ flexDirection: 'row', gap: 12, marginTop: 24 }}>
                                    <TouchableOpacity
                                        style={[styles.actionButton, { backgroundColor: '#ef4444', flex: 1 }]}
                                        onPress={handleDelete}
                                    >
                                        <Feather name="trash-2" size={18} color="white" />
                                        <Text style={styles.actionButtonText}>削除</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[styles.actionButton, { backgroundColor: '#f59e0b', flex: 1 }]}
                                        onPress={() => {
                                            Alert.alert(
                                                "通知スキップ",
                                                "次の授業の通知を1回だけスキップしますか？\n(次回以降は自動で再開されます)",
                                                [
                                                    { text: "キャンセル", style: "cancel" },
                                                    {
                                                        text: "スキップする",
                                                        onPress: () => {
                                                            // Calculate next end time for this course
                                                            const now = new Date();
                                                            const skipUntil = new Date(now.getTime() + 24 * 60 * 60 * 1000);
                                                            onEdit({ ...course, skipNotificationUntil: skipUntil.toISOString() });
                                                            Alert.alert("完了", "次の通知をスキップしました。");
                                                        }
                                                    }
                                                ]
                                            );
                                        }}
                                    >
                                        <Feather name="bell-off" size={18} color="white" />
                                        <Text style={styles.actionButtonText}>通知OFF</Text>
                                    </TouchableOpacity>
                                </View>
                                {assignmentDeadline && (
                                    <Text style={{ fontSize: 12, color: '#4f46e5', marginTop: 4, marginLeft: 4 }}>
                                        期限: {assignmentDeadline.getMonth() + 1}/{assignmentDeadline.getDate()}
                                    </Text>
                                )}
                                {showDatePicker && (
                                    <DateTimePicker
                                        value={assignmentDeadline || new Date()}
                                        mode="date"
                                        display="default"
                                        onChange={handleDateChange}
                                    />
                                )}
                            </View>

                            {/* Notes Section */}
                            <View style={styles.section}>
                                <Text style={[styles.sectionTitle, { color: text }]}>メモ</Text>
                                <TextInput
                                    style={[styles.noteInput, { backgroundColor: itemBg, color: text }]}
                                    multiline
                                    placeholder="授業のメモ (教室変更、試験範囲など)..."
                                    placeholderTextColor={subText}
                                    value={course.notes || ''}
                                    onChangeText={(val) => onUpdate({ ...course, notes: val })}
                                />
                            </View>

                        </ScrollView>

                        {/* Footer */}
                        <View style={styles.footer}>
                            <TouchableOpacity onPress={onClose} style={[styles.closeButton]}>
                                <Feather name="chevron-down" size={24} color={subText} />
                            </TouchableOpacity>
                        </View>

                    </View>
                </TouchableOpacity>
            </KeyboardAvoidingView >

            {/* Image Viewer Modal */}
            <Modal visible={!!viewingImage} transparent={true} onRequestClose={() => setViewingImage(null)} animationType="fade">
                <View style={{ flex: 1, backgroundColor: 'black', justifyContent: 'center', alignItems: 'center' }}>
                    <TouchableOpacity
                        style={{ position: 'absolute', top: 40, right: 20, zIndex: 10, padding: 8 }}
                        onPress={() => setViewingImage(null)}
                    >
                        <Feather name="x" size={30} color="white" />
                    </TouchableOpacity>
                    {viewingImage && (
                        <Image
                            source={{ uri: viewingImage }}
                            style={{ width: '100%', height: '80%' }}
                            resizeMode="contain"
                        />
                    )}
                </View>
            </Modal>
        </Modal>

    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    container: {
        borderTopLeftRadius: 32, // Reduced
        borderTopRightRadius: 32,
        padding: 24, // Reduced from 28
        paddingBottom: 32,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -6 },
        shadowOpacity: 0.1,
        shadowRadius: 16,
        elevation: 10,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 20, // Reduced from 32
    },
    title: {
        fontSize: 22, // Reduced from 26
        fontWeight: 'bold',
        marginBottom: 8,
        letterSpacing: -0.5,
    },
    tagRow: {
        flexDirection: 'row',
        gap: 6, // Reduced
    },
    tag: {
        paddingHorizontal: 10, // Reduced
        paddingVertical: 4,
        borderRadius: 8,
    },
    tagText: {
        fontSize: 12, // Reduced
        fontWeight: '600',
    },
    iconBtn: {
        width: 36, // Reduced
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    contentRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16, // Reduced
        marginBottom: 16,
    },
    rateCardContainer: {
        flex: 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    gradientRing: {
        width: 100, // Reduced from 130
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 4,
    },
    innerCircle: {
        width: 88, // 100 - 12
        height: 88,
        borderRadius: 44,
        justifyContent: 'center',
        alignItems: 'center',
    },
    rateText: {
        fontSize: 28, // Reduced from 36
        fontWeight: 'bold',
        letterSpacing: -0.5,
    },
    rateLabel: {
        fontSize: 10, // Reduced
        fontWeight: '600',
        marginTop: 2,
    },
    countersColumn: {
        flex: 3,
        gap: 8, // Reduced
    },
    rowItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 10, // Reduced
        paddingHorizontal: 12,
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.03)',
    },
    rowAccent: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: 3,
    },
    rowLabel: {
        fontSize: 13, // Reduced
        fontWeight: '600',
    },
    rowControls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    rowValue: {
        fontSize: 16, // Reduced
        fontWeight: 'bold',
        minWidth: 16,
        textAlign: 'center',
    },
    miniButton: {
        width: 24, // Reduced
        height: 24,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'transparent',
        justifyContent: 'center',
        alignItems: 'center',
    },
    footer: {
        alignItems: 'center',
        marginTop: 4,
    },
    closeButton: {
        padding: 8,
        opacity: 0.5,
    },
    section: {
        marginTop: 24,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 12,
    },
    noteInput: {
        borderRadius: 12,
        padding: 12,
        fontSize: 14,
        minHeight: 100,
        textAlignVertical: 'top',
    },
    addAssignmentRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 12,
        gap: 8,
    },
    assignmentInput: {
        flex: 1,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 10,
        fontSize: 14,
    },
    assignmentItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
        gap: 12,
    },
    checkbox: {
        padding: 2,
    },
    assignmentTitle: {
        fontSize: 14,
        flex: 1,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 12,
        gap: 8,
    },
    actionButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
});
