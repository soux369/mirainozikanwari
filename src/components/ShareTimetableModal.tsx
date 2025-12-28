import React, { useState, useEffect, useMemo } from 'react';
import { Modal, StyleSheet, Text, View, TouchableOpacity, ScrollView, Alert, Platform, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import QRCode from 'react-native-qrcode-svg';
import { Course, Day, DAYS } from '../lib/types';
import { Share } from 'react-native';

interface ShareTimetableModalProps {
    visible: boolean;
    courses: Course[];
    onClose: () => void;
    isDarkMode?: boolean;
}

export const ShareTimetableModal: React.FC<ShareTimetableModalProps> = ({
    visible,
    courses,
    onClose,
    isDarkMode = false
}) => {
    const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
    const [activeTab, setActiveTab] = useState<'text' | 'file' | 'qr'>('text');
    useEffect(() => {
        if (visible) {
            // Default select up to 15 courses (QR limit)
            const initialSelection = courses.slice(0, 15).map(c => c.id);
            setSelectedCourses(initialSelection);
        }
    }, [visible, courses]);

    const toggleCourse = (id: string) => {
        setSelectedCourses(prev =>
            prev.includes(id) ? prev.filter(cId => cId !== id) : [...prev, id]
        );
    };

    const handleSelectAll = () => setSelectedCourses(courses.map(c => c.id));
    const handleDeselectAll = () => setSelectedCourses([]);

    const generateShareData = (forQR = false) => {
        const coursesToShare = courses.filter(c => selectedCourses.includes(c.id)).map(c => {
            // Minify data for QR and Sharing
            // Mapping: n=name, r=room, t=teacher, d=day(index), p=period, c=color
            const data: any = {
                n: c.name,
                r: c.room,
                t: c.professor,
                d: DAYS.indexOf(c.day),
                p: c.period,
                c: c.color,
                code: c.code,
                term: c.term
            };

            // Include syllabus URL only if not QR (to save space)
            if (!forQR && c.syllabusUrl) {
                data.s = c.syllabusUrl;
            }

            return data;
        });

        return {
            v: 2, // version 2 (minified)
            data: coursesToShare
        };
    };

    const qrStatus = useMemo(() => {
        if (activeTab !== 'qr') return { valid: true, data: '' };

        // Count Limit (15 courses)
        if (selectedCourses.length > 15) {
            return { valid: false, count: selectedCourses.length, data: '' };
        }

        const data = generateShareData();
        const json = JSON.stringify(data);
        return { valid: true, data: json, count: selectedCourses.length };
    }, [activeTab, selectedCourses, courses]);

    const handleShareText = async () => {
        try {
            const shareData = generateShareData(false);
            const json = JSON.stringify(shareData);
            await Share.share({
                message: json,
                title: "時間割データ"
            });
        } catch (error) {
            Alert.alert("エラー", "共有に失敗しました");
        }
    };

    const handleShareFile = async () => {
        try {
            if (selectedCourses.length === 0) {
                Alert.alert("エラー", "共有する授業を選択してください");
                return;
            }

            const shareData = generateShareData(false);
            const json = JSON.stringify(shareData, null, 2);
            const fileUri = FileSystem.cacheDirectory + 'timetable_data.json';

            await FileSystem.writeAsStringAsync(fileUri, json);
            await Sharing.shareAsync(fileUri, {
                mimeType: 'application/json',
                dialogTitle: '時間割データを共有'
            });

        } catch (error) {
            console.error(error);
            Alert.alert("エラー", "ファイルの生成または共有に失敗しました");
        }
    };

    const bg = isDarkMode ? '#1e293b' : '#fff';
    const textPrimary = isDarkMode ? '#f8fafc' : '#1e293b';
    const textSecondary = isDarkMode ? '#94a3b8' : '#64748b';
    const border = isDarkMode ? '#475569' : '#e2e8f0';
    const tabBg = isDarkMode ? '#334155' : '#f1f5f9';
    const activeTabBg = isDarkMode ? '#475569' : '#fff';

    if (!visible) return null;

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <View style={[styles.container, { backgroundColor: bg }]}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={[styles.title, { color: textPrimary }]}>時間割を共有</Text>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <Feather name="x" size={24} color={textSecondary} />
                    </TouchableOpacity>
                </View>

                {/* Tabs */}
                <View style={[styles.tabContainer, { backgroundColor: tabBg }]}>
                    {(['text', 'file', 'qr'] as const).map((tab) => (
                        <TouchableOpacity
                            key={tab}
                            style={[
                                styles.tab,
                                activeTab === tab && [styles.activeTab, { backgroundColor: activeTabBg }]
                            ]}
                            onPress={() => setActiveTab(tab)}
                        >
                            <Text style={[
                                styles.tabText,
                                { color: activeTab === tab ? textPrimary : textSecondary }
                            ]}>
                                {tab === 'text' ? 'テキスト' : tab === 'file' ? 'ファイル' : 'QRコード'}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Content */}
                <View style={styles.content}>
                    {activeTab === 'qr' ? (
                        <View style={styles.qrContainer}>
                            <Text style={[styles.instruction, { color: textSecondary, marginBottom: 20 }]}>
                                相手の「読み込み」→「スキャン」で読み取ってください
                            </Text>
                            {!qrStatus.valid ? (
                                <View style={[styles.qrWrapper, { alignItems: 'center', justifyContent: 'center', height: 240 }]}>
                                    <Feather name="alert-triangle" size={48} color="#ef4444" />
                                    <Text style={{ color: '#ef4444', marginTop: 12, fontWeight: 'bold' }}>授業数が多すぎます</Text>
                                    <Text style={{ color: textSecondary, marginTop: 8, fontSize: 12, textAlign: 'center' }}>
                                        15件以内に減らしてください{'\n'}(現在: {qrStatus.count}件)
                                    </Text>
                                </View>
                            ) : selectedCourses.length > 0 ? (
                                <View style={styles.qrWrapper}>
                                    <QRCode
                                        value={qrStatus.data}
                                        size={200}
                                        color="black"
                                        backgroundColor="white"
                                    />
                                </View>
                            ) : (
                                <Text style={{ color: textSecondary }}>授業を選択してください</Text>
                            )}
                            <Text style={[styles.note, { color: textSecondary, marginTop: 20 }]}>
                                {selectedCourses.length}件選択中
                            </Text>
                        </View>
                    ) : (
                        <>
                            <View style={styles.selectionHeader}>
                                <Text style={[styles.sectionTitle, { color: textPrimary }]}>
                                    授業を選択 ({selectedCourses.length}/{courses.length})
                                </Text>
                                <View style={styles.selectionActions}>
                                    <TouchableOpacity onPress={handleSelectAll}>
                                        <Text style={styles.actionText}>全選択</Text>
                                    </TouchableOpacity>
                                    <Text style={{ color: border }}>|</Text>
                                    <TouchableOpacity onPress={handleDeselectAll}>
                                        <Text style={styles.actionText}>全解除</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <ScrollView style={styles.list}>
                                {courses.map(course => (
                                    <TouchableOpacity
                                        key={course.id}
                                        style={[styles.courseItem, { borderColor: border }]}
                                        onPress={() => toggleCourse(course.id)}
                                    >
                                        <View style={[
                                            styles.checkbox,
                                            selectedCourses.includes(course.id) && styles.checkboxChecked,
                                            { borderColor: selectedCourses.includes(course.id) ? '#4f46e5' : textSecondary }
                                        ]}>
                                            {selectedCourses.includes(course.id) && (
                                                <Feather name="check" size={12} color="white" />
                                            )}
                                        </View>
                                        <View style={styles.courseInfo}>
                                            <Text style={[styles.courseName, { color: textPrimary }]}>{course.name}</Text>
                                            <Text style={[styles.courseDetail, { color: textSecondary }]}>
                                                {course.day} {course.period}限
                                            </Text>
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </>
                    )}
                </View>

                {/* Footer Action */}
                {activeTab !== 'qr' && (
                    <View style={[styles.footer, { borderTopColor: border }]}>
                        <TouchableOpacity
                            style={[
                                styles.shareButton,
                                selectedCourses.length === 0 && styles.disabledButton
                            ]}
                            onPress={activeTab === 'file' ? handleShareFile : handleShareText}
                            disabled={selectedCourses.length === 0}
                        >
                            <Feather name={activeTab === 'file' ? "file" : "share"} size={20} color="white" />
                            <Text style={styles.shareButtonText}>
                                {activeTab === 'file' ? 'ファイルとして共有' : 'テキストとして共有'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
        position: 'relative',
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    closeButton: {
        position: 'absolute',
        right: 16,
        top: 16,
    },
    tabContainer: {
        flexDirection: 'row',
        marginHorizontal: 16,
        borderRadius: 8,
        padding: 4,
        marginBottom: 16,
    },
    tab: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
        borderRadius: 6,
    },
    activeTab: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 1,
        elevation: 1,
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
    },
    content: {
        flex: 1,
        paddingHorizontal: 16,
    },
    selectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
    },
    selectionActions: {
        flexDirection: 'row',
        gap: 12,
    },
    actionText: {
        color: '#4f46e5',
        fontSize: 14,
    },
    list: {
        flex: 1,
    },
    courseItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 8,
    },
    checkbox: {
        width: 20,
        height: 20,
        borderRadius: 6,
        borderWidth: 2,
        marginRight: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkboxChecked: {
        backgroundColor: '#4f46e5',
        borderColor: '#4f46e5',
    },
    courseInfo: {
        flex: 1,
    },
    courseName: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    courseDetail: {
        fontSize: 12,
    },
    footer: {
        padding: 16,
        borderTopWidth: 1,
    },
    shareButton: {
        backgroundColor: '#4f46e5',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 12,
        gap: 8,
    },
    disabledButton: {
        backgroundColor: '#94a3b8',
        opacity: 0.7,
    },
    shareButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    qrContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingBottom: 40,
    },
    qrWrapper: {
        padding: 20,
        backgroundColor: 'white',
        borderRadius: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    instruction: {
        textAlign: 'center',
        fontSize: 16,
    },
    note: {
        fontSize: 14,
    }
});
