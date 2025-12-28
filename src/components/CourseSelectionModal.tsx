import React, { useState, useEffect } from 'react';
import { Modal, StyleSheet, Text, View, TouchableOpacity, ScrollView, FlatList } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Course, DAY_LABELS } from '../lib/types';

interface CourseSelectionModalProps {
    visible: boolean;
    scannedCourses: Course[];
    onClose: () => void;
    onConfirm: (selectedCourses: Course[]) => void;
    isDarkMode?: boolean;
}

export const CourseSelectionModal: React.FC<CourseSelectionModalProps> = ({
    visible,
    scannedCourses,
    onClose,
    onConfirm,
    isDarkMode = false
}) => {
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    // Initialize selection when courses change
    useEffect(() => {
        if (visible && scannedCourses.length > 0) {
            // Select all by default
            const allIds = new Set(scannedCourses.map(c => c.id));
            setSelectedIds(allIds);
        }
    }, [visible, scannedCourses]);

    const toggleSelection = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedIds(newSet);
    };

    const handleConfirm = () => {
        const selected = scannedCourses.filter(c => selectedIds.has(c.id));
        onConfirm(selected);
    };

    const bg = isDarkMode ? '#1e293b' : '#fff';
    const textPrimary = isDarkMode ? '#f8fafc' : '#1e293b';
    const textSecondary = isDarkMode ? '#94a3b8' : '#64748b';
    const itemBg = isDarkMode ? '#334155' : '#f8fafc';
    const border = isDarkMode ? '#475569' : '#e2e8f0';

    if (!visible) return null;

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={[styles.container, { backgroundColor: bg }]}>
                    <View style={styles.header}>
                        <Text style={[styles.title, { color: textPrimary }]}>
                            検出された授業 ({scannedCourses.length})
                        </Text>
                        <TouchableOpacity onPress={onClose}>
                            <Feather name="x" size={24} color={textSecondary} />
                        </TouchableOpacity>
                    </View>

                    <Text style={[styles.subtitle, { color: textSecondary }]}>
                        追加する授業を選択してください
                    </Text>

                    <FlatList
                        data={scannedCourses}
                        keyExtractor={item => item.id}
                        style={styles.list}
                        renderItem={({ item }) => {
                            const isSelected = selectedIds.has(item.id);
                            return (
                                <TouchableOpacity
                                    style={[
                                        styles.item,
                                        { backgroundColor: itemBg, borderColor: border },
                                        isSelected && { borderColor: '#4f46e5', borderWidth: 1.5 }
                                    ]}
                                    onPress={() => toggleSelection(item.id)}
                                >
                                    <View style={styles.checkbox}>
                                        <Feather
                                            name={isSelected ? "check-square" : "square"}
                                            size={24}
                                            color={isSelected ? "#4f46e5" : textSecondary}
                                        />
                                    </View>
                                    <View style={styles.itemContent}>
                                        <Text style={[styles.courseName, { color: textPrimary }]}>
                                            {item.name}
                                        </Text>
                                        <Text style={[styles.courseDetails, { color: textSecondary }]}>
                                            {DAY_LABELS[item.day]} {item.period}限 • {item.room || '教室不明'}
                                            {item.professor ? ` • ${item.professor}` : ''}
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            );
                        }}
                    />

                    <View style={styles.footer}>
                        <TouchableOpacity
                            style={[styles.button, styles.cancelButton]}
                            onPress={onClose}
                        >
                            <Text style={styles.cancelText}>キャンセル</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.button, styles.confirmButton]}
                            onPress={handleConfirm}
                        >
                            <Text style={styles.confirmText}>
                                追加する ({selectedIds.size})
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 20,
    },
    container: {
        borderRadius: 16,
        padding: 20,
        maxHeight: '80%',
        elevation: 5,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    subtitle: {
        fontSize: 14,
        marginBottom: 16,
    },
    list: {
        marginBottom: 16,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
        marginBottom: 8,
        borderWidth: 1,
    },
    checkbox: {
        marginRight: 12,
    },
    itemContent: {
        flex: 1,
    },
    courseName: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 2,
    },
    courseDetails: {
        fontSize: 13,
    },
    footer: {
        flexDirection: 'row',
        gap: 12,
    },
    button: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelButton: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '#94a3b8',
    },
    confirmButton: {
        backgroundColor: '#4f46e5',
    },
    cancelText: {
        color: '#64748b',
        fontWeight: '600',
    },
    confirmText: {
        color: 'white',
        fontWeight: '600',
    },
});
