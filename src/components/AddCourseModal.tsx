import React, { useState, useEffect } from 'react';
import { Modal, StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Course, Day, Period, DAYS, PERIODS, DAY_LABELS, COLORS } from '../lib/types';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { translations } from '../lib/i18n';
import { Settings } from '../lib/types';

interface AddCourseModalProps {
    visible: boolean;
    onClose: () => void;
    onSave: (course: Course) => void;
    onDelete: (id: string) => void;
    initialData?: Partial<Course>;
    isDarkMode?: boolean;
    onOpenShare?: () => void;
    onOpenImport?: () => void;
    settings: Settings;
}

const AddCourseModal: React.FC<AddCourseModalProps> = ({ visible, onClose, onSave, onDelete, initialData, isDarkMode = false, onOpenShare, onOpenImport, settings }) => {
    const [formData, setFormData] = useState<Partial<Course>>({});
    const t = translations[settings.language || 'ja'] as any;

    useEffect(() => {
        if (visible && initialData) {
            setFormData({
                ...initialData,
                color: initialData.color || COLORS[Math.floor(Math.random() * COLORS.length)]
            });
        }
    }, [visible, initialData]);

    const handleChange = (field: keyof Course, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = () => {
        if (formData.name && formData.day && formData.period) {
            onSave({
                id: formData.id || Math.random().toString(36).substr(2, 9),
                name: formData.name,
                code: formData.code,
                room: formData.room,
                professor: formData.professor,
                day: formData.day,
                period: formData.period,
                color: formData.color || COLORS[0],
                syllabusUrl: formData.syllabusUrl,
            });
            onClose();
        } else {
            Alert.alert(t.error, t.courseRequired);
        }
    };

    const handleDelete = () => {
        if (formData.id) {
            Alert.alert(t.confirm, t.deleteConfirm, [
                { text: t.cancel, style: "cancel" },
                {
                    text: t.delete, style: "destructive", onPress: () => {
                        onDelete(formData.id!);
                        onClose();
                    }
                }
            ]);
        }
    };

    const bg = isDarkMode ? 'rgba(30, 41, 59, 0.92)' : 'rgba(255, 255, 255, 0.92)';
    const textPrimary = isDarkMode ? '#f8fafc' : '#1e293b';
    const textSecondary = isDarkMode ? '#94a3b8' : '#64748b';
    const inputBg = isDarkMode ? 'rgba(51, 65, 85, 0.5)' : 'rgba(241, 245, 249, 0.5)';
    const borderColor = isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)';

    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <BlurView intensity={25} tint={isDarkMode ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />

            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.overlay}
            >
                <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />

                <View style={[styles.modalContent, { backgroundColor: bg }]}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={{ position: 'absolute', left: 16, top: 16, flexDirection: 'row', gap: 8, zIndex: 10 }}>
                            {onOpenImport && (
                                <TouchableOpacity onPress={onOpenImport} style={[styles.iconButton, { backgroundColor: inputBg, width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }]}>
                                    <Feather name="download" size={16} color={textSecondary} />
                                </TouchableOpacity>
                            )}
                            {onOpenShare && (
                                <TouchableOpacity onPress={onOpenShare} style={[styles.iconButton, { backgroundColor: inputBg, width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }]}>
                                    <Feather name="share" size={16} color={textSecondary} />
                                </TouchableOpacity>
                            )}
                        </View>

                        <Text style={[styles.title, { color: textPrimary }]}>{initialData?.id ? t.edit : t.add}</Text>

                        <TouchableOpacity onPress={onClose} style={[styles.closeButton, { backgroundColor: inputBg }]}>
                            <Feather name="x" size={18} color={textSecondary} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

                        {/* Course Name & Code */}
                        <View style={styles.section}>
                            <Text style={[styles.label, { color: textSecondary }]}>{t.basicInfo}</Text>
                            <View style={styles.row}>
                                <View style={[styles.inputWrapper, { flex: 2, backgroundColor: inputBg, borderColor }]}>
                                    <View style={styles.inputIcon}>
                                        <Feather name="book" size={14} color={textSecondary} />
                                    </View>
                                    <TextInput
                                        style={[styles.input, { color: textPrimary }]}
                                        value={formData.name || ''}
                                        onChangeText={(text) => handleChange('name', text)}
                                        placeholder={t.courseNamePlaceholder}
                                        placeholderTextColor={textSecondary}
                                    />
                                </View>
                            </View>
                            <View style={styles.row}>
                                <View style={[styles.inputWrapper, { flex: 1, backgroundColor: inputBg, borderColor }]}>
                                    <View style={styles.inputIcon}>
                                        <Feather name="hash" size={14} color={textSecondary} />
                                    </View>
                                    <TextInput
                                        style={[styles.input, { color: textPrimary }]}
                                        value={formData.code || ''}
                                        onChangeText={(text) => handleChange('code', text)}
                                        placeholder={t.placeholderCourseCode}
                                        placeholderTextColor={textSecondary}
                                    />
                                </View>
                            </View>
                        </View>

                        {/* Day & Period */}
                        <View style={styles.section}>
                            <Text style={[styles.label, { color: textSecondary }]}>{t.timetableInfo}</Text>

                            <View style={[styles.chipContainer, { marginBottom: 10 }]}>
                                {DAYS.map(day => {
                                    const isActive = formData.day === day;
                                    return (
                                        <TouchableOpacity
                                            key={day}
                                            onPress={() => handleChange('day', day)}
                                        >
                                            <LinearGradient
                                                colors={isActive ? ['#4f46e5', '#6366f1'] : (isDarkMode ? ['#334155', '#1e293b'] : ['#f1f5f9', '#e2e8f0'])}
                                                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                                                style={[styles.chip, isActive && styles.chipActive]}
                                            >
                                                <Text style={[styles.chipText, { color: isActive ? 'white' : textSecondary }]}>
                                                    {DAY_LABELS[day]}
                                                </Text>
                                            </LinearGradient>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>

                            <View style={styles.chipContainer}>
                                {PERIODS.filter(p => p <= 7).map(period => {
                                    const isActive = formData.period === period;
                                    return (
                                        <TouchableOpacity
                                            key={period}
                                            onPress={() => handleChange('period', period)}
                                        >
                                            <LinearGradient
                                                colors={isActive ? ['#4f46e5', '#6366f1'] : (isDarkMode ? ['#334155', '#1e293b'] : ['#f1f5f9', '#e2e8f0'])}
                                                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                                                style={[styles.periodChip, isActive && styles.chipActive]}
                                            >
                                                <Text style={[styles.chipText, { color: isActive ? 'white' : textSecondary }]}>
                                                    {period}
                                                </Text>
                                            </LinearGradient>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </View>

                        {/* Details */}
                        <View style={styles.section}>
                            <Text style={[styles.label, { color: textSecondary }]}>{t.detailedInfo}</Text>
                            <View style={styles.row}>
                                <View style={[styles.inputWrapper, { flex: 1, marginRight: 8, backgroundColor: inputBg, borderColor }]}>
                                    <View style={styles.inputIcon}>
                                        <Feather name="map-pin" size={14} color={textSecondary} />
                                    </View>
                                    <TextInput
                                        style={[styles.input, { color: textPrimary }]}
                                        value={formData.room || ''}
                                        onChangeText={(text) => handleChange('room', text)}
                                        placeholder={t.placeholderRoom}
                                        placeholderTextColor={textSecondary}
                                    />
                                </View>
                                <View style={[styles.inputWrapper, { flex: 1, marginLeft: 8, backgroundColor: inputBg, borderColor }]}>
                                    <View style={styles.inputIcon}>
                                        <Feather name="user" size={14} color={textSecondary} />
                                    </View>
                                    <TextInput
                                        style={[styles.input, { color: textPrimary }]}
                                        value={formData.professor || ''}
                                        onChangeText={(text) => handleChange('professor', text)}
                                        placeholder={t.placeholderProfessor}
                                        placeholderTextColor={textSecondary}
                                    />
                                </View>
                            </View>

                            {/* Syllabus URL */}
                            <View style={[styles.row, { marginTop: 10 }]}>
                                <View style={[styles.inputWrapper, { flex: 1, backgroundColor: inputBg, borderColor }]}>
                                    <View style={styles.inputIcon}>
                                        <Feather name="link" size={14} color={textSecondary} />
                                    </View>
                                    <TextInput
                                        style={[styles.input, { color: textPrimary }]}
                                        value={formData.syllabusUrl || ''}
                                        onChangeText={(text) => handleChange('syllabusUrl', text)}
                                        placeholder={t.placeholderSyllabus}
                                        placeholderTextColor={textSecondary}
                                        autoCapitalize="none"
                                        keyboardType="url"
                                    />
                                </View>
                            </View>
                        </View>

                        {/* Color Picker */}
                        <View style={styles.section}>
                            <Text style={[styles.label, { color: textSecondary }]}>{t.themeColor}</Text>
                            <View style={[styles.chipContainer, { gap: 10 }]}>
                                {COLORS.map(color => (
                                    <TouchableOpacity
                                        key={color}
                                        style={[
                                            styles.colorCircle,
                                            { backgroundColor: color },
                                            formData.color === color && styles.colorCircleActive
                                        ]}
                                        onPress={() => handleChange('color', color)}
                                    />
                                ))}
                            </View>
                        </View>

                    </ScrollView>

                    {/* Footer Actions */}
                    <View style={styles.footer}>
                        {initialData?.id && (
                            <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
                                <Feather name="trash-2" size={18} color="#ef4444" />
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity onPress={handleSave} style={{ flex: 1, marginLeft: initialData?.id ? 12 : 0 }}>
                            <LinearGradient
                                colors={['#4f46e5', '#6366f1']}
                                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                style={styles.saveButton}
                            >
                                <Text style={styles.saveButtonText}>{t.saveAction}</Text>
                                <Feather name="check" size={16} color="white" />
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>

                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
    },
    modalContent: {
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        padding: 24,
        paddingBottom: 40,
        maxHeight: '85%',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -6 },
        shadowOpacity: 0.1,
        shadowRadius: 16,
        elevation: 10,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20, // Reduced from 24
    },
    title: {
        fontSize: 20, // Reduced
        fontWeight: 'bold',
        letterSpacing: -0.5,
    },
    closeButton: {
        width: 32, // Reduced
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContent: {
        paddingBottom: 20,
    },
    section: {
        marginBottom: 20, // Reduced from 24
    },
    label: {
        fontSize: 12, // Reduced
        fontWeight: '600',
        marginBottom: 8, // Reduced
        marginLeft: 4,
    },
    row: {
        flexDirection: 'row',
        marginBottom: 10, // Reduced
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12, // Reduced
        borderWidth: 1,
        paddingHorizontal: 12,
        height: 44, // Reduced from 52
    },
    inputIcon: {
        marginRight: 8,
    },
    input: {
        flex: 1,
        fontSize: 14, // Reduced from 16
        height: '100%',
        fontWeight: '500',
    },
    chipContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6, // Reduced
    },
    chip: {
        paddingVertical: 6, // Reduced from 8
        paddingHorizontal: 12, // Reduced from 14
        borderRadius: 10, // Reduced
    },
    periodChip: {
        width: 38, // Reduced from 44
        height: 38,
        borderRadius: 19,
        justifyContent: 'center',
        alignItems: 'center',
    },
    chipActive: {
        elevation: 2,
        shadowColor: "#4f46e5",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    chipText: {
        fontSize: 12, // Reduced
        fontWeight: '600',
    },
    colorCircle: {
        width: 36, // Reduced from 40
        height: 36,
        borderRadius: 18,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    colorCircleActive: {
        borderColor: '#1e293b',
        transform: [{ scale: 1.1 }],
        elevation: 2,
    },
    iconButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    saveButton: {
        flexDirection: 'row',
        height: 48, // Reduced from 56
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 6,
        elevation: 2,
        shadowColor: "#4f46e5",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    saveButtonText: {
        color: 'white',
        fontSize: 14, // Reduced
        fontWeight: 'bold',
    },
    deleteButton: {
        width: 48, // Reduced
        height: 48,
        borderRadius: 24,
        backgroundColor: '#fee2e2',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
});

export default AddCourseModal;
