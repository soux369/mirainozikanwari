import React, { useState, useEffect } from 'react';
import { Modal, StyleSheet, Text, View, TouchableOpacity, TextInput, Alert, KeyboardAvoidingView, Platform, ScrollView, Dimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Course, DAYS } from '../lib/types';

interface ImportTimetableModalProps {
    visible: boolean;
    onClose: () => void;
    onImport: (courses: Course[]) => void;
    onSaveAsFriend: (courses: Course[]) => void;
    isDarkMode?: boolean;
}

export const ImportTimetableModal: React.FC<ImportTimetableModalProps> = ({
    visible,
    onClose,
    onImport,
    onSaveAsFriend,
    isDarkMode = false
}) => {
    const [activeTab, setActiveTab] = useState<'text' | 'file' | 'scan'>('text');
    const [jsonText, setJsonText] = useState('');
    const [permission, requestPermission] = useCameraPermissions();
    const [isScanning, setIsScanning] = useState(false);
    const isProcessingRef = React.useRef(false);

    useEffect(() => {
        if (visible && activeTab === 'scan') {
            setIsScanning(true);
            isProcessingRef.current = false;
            if (!permission?.granted) {
                requestPermission();
            }
        } else {
            setIsScanning(false);
        }
    }, [visible, activeTab]);

    const parseAndImport = (data: any) => {
        try {
            let courses: Course[] = [];

            if (data.v === 2 && Array.isArray(data.data)) {
                // Minified format (V2)
                courses = data.data.map((item: any) => ({
                    id: Math.random().toString(36).substr(2, 9), // Temp ID, will be regenerated in App
                    name: item.n,
                    room: item.r,
                    professor: item.t,
                    day: DAYS[item.d],
                    period: item.p,
                    color: item.c,
                    syllabusUrl: item.s,
                    code: item.code,
                    term: item.term,
                    attendance: []
                }));
            } else if (data.courses && Array.isArray(data.courses)) {
                // Legacy format (V1)
                courses = data.courses as Course[];
            } else {
                throw new Error("Unknown format");
            }

            if (courses.length === 0) {
                throw new Error("No courses found");
            }

            setJsonText('');
            // Ask intention
            Alert.alert(
                "データの読み込み",
                `${courses.length}件の授業が見つかりました。\nどのように保存しますか？`,
                [
                    {
                        text: "友達として保存",
                        onPress: () => {
                            onSaveAsFriend(courses);
                            onClose();
                        }
                    },
                    {
                        text: "自分のに上書き",
                        style: 'destructive',
                        onPress: () => {
                            onImport(courses);
                            onClose();
                        }
                    },
                    { text: "キャンセル", style: 'cancel' }
                ]
            );

        } catch (e) {
            console.log(e);
            Alert.alert("エラー", "データの解析に失敗しました。形式を確認してください。");
        }
    };

    const handleTextImport = () => {
        if (!jsonText.trim()) return;
        try {
            const data = JSON.parse(jsonText);
            parseAndImport(data);
        } catch (e) {
            Alert.alert("エラー", "JSONの解析に失敗しました。");
        }
    };

    const handleFileImport = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: 'application/json',
                copyToCacheDirectory: true
            });

            if (result.canceled) return;

            const file = result.assets[0];
            const content = await FileSystem.readAsStringAsync(file.uri);
            const data = JSON.parse(content);
            parseAndImport(data);

        } catch (e) {
            Alert.alert("エラー", "ファイルの読み込みに失敗しました");
        }
    };

    const handleBarCodeScanned = ({ data }: { data: string }) => {
        if (!isScanning || isProcessingRef.current) return;
        isProcessingRef.current = true;
        setIsScanning(false); // Stop scanning immediately logic

        try {
            const parsed = JSON.parse(data);
            parseAndImport(parsed);
        } catch (e) {
            isProcessingRef.current = false; // Allow retry?
            Alert.alert("エラー", "QRコードの解析に失敗しました", [
                {
                    text: '再試行',
                    onPress: () => {
                        isProcessingRef.current = false;
                        setIsScanning(true);
                    }
                },
                { text: 'キャンセル', onPress: () => { } }
            ]);
        }
    };

    const bg = isDarkMode ? '#1e293b' : '#fff';
    const textPrimary = isDarkMode ? '#f8fafc' : '#1e293b';
    const textSecondary = isDarkMode ? '#94a3b8' : '#64748b';
    const inputBg = isDarkMode ? '#334155' : '#f8fafc';
    const border = isDarkMode ? '#475569' : '#e2e8f0';
    const tabBg = isDarkMode ? '#334155' : '#f1f5f9';
    const activeTabBg = isDarkMode ? '#475569' : '#fff';

    if (!visible) return null;

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.overlay}
            >
                <ScrollView
                    contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 20 }}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={[styles.container, { backgroundColor: bg }]}>
                        <View style={styles.header}>
                            <Text style={[styles.title, { color: textPrimary }]}>
                                時間割を読み込む
                            </Text>
                            <TouchableOpacity onPress={onClose}>
                                <Feather name="x" size={24} color={textSecondary} />
                            </TouchableOpacity>
                        </View>

                        {/* Tabs */}
                        <View style={[styles.tabContainer, { backgroundColor: tabBg }]}>
                            {(['text', 'file', 'scan'] as const).map((tab) => (
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
                                        {tab === 'text' ? 'テキスト' : tab === 'file' ? 'ファイル' : 'スキャン'}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <View style={styles.content}>
                            {activeTab === 'text' && (
                                <>
                                    <Text style={[styles.subtitle, { color: textSecondary }]}>
                                        共有されたテキストを貼り付けてください
                                    </Text>
                                    <TextInput
                                        style={[styles.input, { backgroundColor: inputBg, color: textPrimary, borderColor: border }]}
                                        multiline
                                        numberOfLines={10}
                                        placeholder='{ "v": 2, "data": [...] }'
                                        placeholderTextColor={textSecondary}
                                        value={jsonText}
                                        onChangeText={setJsonText}
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                    />
                                </>
                            )}

                            {activeTab === 'file' && (
                                <View style={styles.centerContent}>
                                    <Feather name="file-text" size={48} color={textSecondary} style={{ marginBottom: 16 }} />
                                    <Text style={[styles.instruction, { color: textSecondary }]}>
                                        .jsonファイルを選択してください
                                    </Text>
                                </View>
                            )}

                            {activeTab === 'scan' && (
                                <View style={styles.scannerWrapper}>
                                    {permission && permission.granted ? (
                                        <CameraView
                                            style={StyleSheet.absoluteFillObject}
                                            onBarcodeScanned={isScanning ? handleBarCodeScanned : undefined}
                                            barcodeScannerSettings={{
                                                barcodeTypes: ["qr"],
                                            }}
                                        />
                                    ) : (
                                        <Text style={{ color: textSecondary }}>カメラの許可が必要です</Text>
                                    )}
                                    <View style={styles.scanOverlay}>
                                        <View style={styles.scanFrame} />
                                        <Text style={styles.scanText}>QRコードを枠内に入れてください</Text>
                                    </View>
                                </View>
                            )}
                        </View>

                        <View style={styles.footer}>
                            <TouchableOpacity
                                style={[styles.button, styles.cancelButton]}
                                onPress={onClose}
                            >
                                <Text style={styles.cancelText}>キャンセル</Text>
                            </TouchableOpacity>

                            {activeTab !== 'scan' && (
                                <TouchableOpacity
                                    style={[styles.button, styles.confirmButton]}
                                    onPress={activeTab === 'file' ? handleFileImport : handleTextImport}
                                >
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                        <Feather name={activeTab === 'file' ? "folder" : "download"} size={18} color="white" />
                                        <Text style={styles.confirmText}>
                                            {activeTab === 'file' ? 'ファイル選択' : '読み込む'}
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
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
        maxHeight: '90%',
        elevation: 5,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    tabContainer: {
        flexDirection: 'row',
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
        minHeight: 300,
    },
    subtitle: {
        fontSize: 14,
        marginBottom: 16,
    },
    input: {
        textAlignVertical: 'top',
        height: 200,
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        marginBottom: 16,
        fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    },
    centerContent: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 200,
    },
    instruction: {
        fontSize: 16,
    },
    scannerWrapper: {
        flex: 1,
        borderRadius: 12,
        overflow: 'hidden',
        position: 'relative',
        minHeight: 300,
        backgroundColor: 'black',
    },
    scanOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scanFrame: {
        width: 200,
        height: 200,
        borderWidth: 2,
        borderColor: '#4f46e5',
        backgroundColor: 'transparent',
        marginBottom: 20,
    },
    scanText: {
        color: 'white',
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: 8,
        borderRadius: 4,
        overflow: 'hidden',
    },
    footer: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 16,
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
