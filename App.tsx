import { StatusBar } from 'expo-status-bar';
import { updateWidgets } from './src/lib/widgetHelper';
import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Platform, LogBox, ImageBackground, ActivityIndicator, Alert, Dimensions, ScrollView, AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import * as Network from 'expo-network';
import * as Location from 'expo-location';

import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import TimetableGrid from './src/components/TimetableGrid';
import AddCourseModal from './src/components/AddCourseModal';
import { SettingsScreen } from './src/components/SettingsScreen';
import { OCRWebView } from './src/components/OCRWebView';
import { CourseSelectionModal } from './src/components/CourseSelectionModal';
import { NextClassView } from './src/components/NextClassView';
import { DEFAULT_TERMS as LOADING_TERMS, Term, Course, Settings, DEFAULT_SETTINGS, getBackgroundColor, DEFAULT_TERMS, Day } from './src/lib/types';
import { calculateTime } from './src/lib/timeUtils';
import { parseRawTextToCourses, ParseResult } from './src/lib/ocrHelper';
import { registerForPushNotificationsAsync, scheduleCourseNotifications } from './src/lib/notificationManager';
import { CourseDetailModal } from './src/components/CourseDetailModal';
import { ShareTimetableModal } from './src/components/ShareTimetableModal';
import { ImportTimetableModal } from './src/components/ImportTimetableModal';
import { FriendsListModal } from './src/components/FriendsListModal';
import { FriendDetailModal } from './src/components/FriendDetailModal';
import { AdBanner } from './src/components/AdBanner';
import { FriendNameInputModal } from './src/components/FriendNameInputModal';
import { recognizeWithGemini } from './src/lib/geminiHelper';
import { GEMINI_API_KEY } from './src/config';
import { useFonts, NotoSerifJP_400Regular, NotoSerifJP_700Bold } from '@expo-google-fonts/noto-serif-jp';
import { MPLUSRounded1c_400Regular, MPLUSRounded1c_700Bold } from '@expo-google-fonts/m-plus-rounded-1c';
import { FontProvider } from './src/lib/FontContext';
import { ThemedText } from './src/components/ThemedText';

const STORAGE_KEY = '@timetable_data_v1';
const SETTINGS_KEY = '@timetable_settings_v1';
const TERMS_KEY = '@timetable_terms_v1';

LogBox.ignoreLogs([
    'Method readAsStringAsync imported from',
    'expo-notifications functionality is not fully supported'
]);

const SEASON_ORDER: Record<string, number> = {
    'spring': 1, '春': 1,
    'summer': 2, '夏': 2,
    'fall': 3, 'autumn': 3, '秋': 3,
    'winter': 4, '冬': 4
};

const sortTerms = (terms: Term[]) => {
    return [...terms].sort((a, b) => {
        const aLabel = a.label.toLowerCase();
        const bLabel = b.label.toLowerCase();

        // Extract years
        const aYearMatch = aLabel.match(/\d{4}/);
        const bYearMatch = bLabel.match(/\d{4}/);
        const aYear = aYearMatch ? parseInt(aYearMatch[0]) : 0;
        const bYear = bYearMatch ? parseInt(bYearMatch[0]) : 0;

        if (aYear !== bYear) return bYear - aYear; // Descending Year

        // Detect Season
        let aSeason = 0;
        let bSeason = 0;
        Object.entries(SEASON_ORDER).forEach(([key, val]) => {
            if (aLabel.includes(key)) aSeason = val;
            if (bLabel.includes(key)) bSeason = val;
        });

        if (aSeason !== bSeason && aSeason !== 0 && bSeason !== 0) {
            return bSeason - aSeason; // Descending Season (Winter > Spring)
        }

        return bLabel.localeCompare(aLabel);
    });
};

import { translations } from './src/lib/i18n';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function App() {
    const scrollViewRef = useRef<ScrollView>(null);
    const cameraBtnRef = useRef<View>(null); // Use View or specific type if available, View is safe for measure
    const [currentTerm, setCurrentTerm] = useState<string>('2025-Spring');
    const [terms, setTerms] = useState<Term[]>(DEFAULT_TERMS);

    const [courses, setCourses] = useState<Course[]>([]);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingCourse, setEditingCourse] = useState<Partial<Course> | undefined>(undefined);
    const [isDetailVisible, setIsDetailVisible] = useState(false);
    const [detailCourse, setDetailCourse] = useState<Course | null>(null);

    const [activeTab, setActiveTab] = useState<'timetable' | 'schedule' | 'settings'>('schedule'); // Default to schedule
    const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

    // OCR & Selection State
    const [ocrTrigger, setOcrTrigger] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [scannedCourses, setScannedCourses] = useState<Course[]>([]);
    const [isSelectionModalVisible, setIsSelectionModalVisible] = useState(false);
    const [isShareModalVisible, setIsShareModalVisible] = useState(false);
    const [isImportModalVisible, setIsImportModalVisible] = useState(false);

    // Theme State
    const [isDarkMode, setIsDarkMode] = useState(false);

    // Tutorial State
    const [showVisualTutorial, setShowVisualTutorial] = useState(false);
    const [hasShownAlert, setHasShownAlert] = useState(false);
    const [cameraBtnLayout, setCameraBtnLayout] = useState<{ x: number, y: number, width: number, height: number } | null>(null);

    const [fontsLoaded] = useFonts({
        'Noto Serif JP': NotoSerifJP_400Regular,
        'M PLUS Rounded 1c': MPLUSRounded1c_400Regular,
    });

    const TUTORIAL_KEY_VISUAL = '@tutorial_visual_v1';
    const TUTORIAL_KEY_ALERT = '@tutorial_camera_alert_v1';

    // Effects for Tab Switching
    useEffect(() => {
        if (scrollViewRef.current) {
            if (activeTab === 'schedule') scrollViewRef.current.scrollTo({ x: 0, animated: true });
            else if (activeTab === 'timetable') scrollViewRef.current.scrollTo({ x: SCREEN_WIDTH, animated: true });
            else if (activeTab === 'settings') scrollViewRef.current.scrollTo({ x: SCREEN_WIDTH * 2, animated: true });
        }
    }, [activeTab]);



    useEffect(() => {
        loadData();
        loadTutorialState();
        registerForPushNotificationsAsync();

        // Initialize AdMob
        const initAdMob = async () => {
            try {
                const { MobileAds } = require('react-native-google-mobile-ads');

                // Check Tracking Permission (iOS 14+)
                if (Platform.OS === 'ios') {
                    const { requestTrackingPermissionsAsync } = require('expo-tracking-transparency');
                    await requestTrackingPermissionsAsync();
                }

                await MobileAds().initialize();
            } catch (e) {
                // console.log('AdMob init failed (Expo Go?)', e);
            }
        };
        initAdMob();
    }, []);

    // Re-schedule notifications when courses or settings change
    useEffect(() => {
        if (courses.length > 0) {
            scheduleCourseNotifications(courses, settings);
        }
    }, [courses, settings]);

    // Auto Attendance Logic (Beta)
    useEffect(() => {
        const checkAutoAttendance = async () => {
            if (!settings.autoAttendanceEnabled || !settings.schoolWifiSSID) return;

            try {
                // Check Permission (Do NOT request here, only check)
                const { status } = await Location.getForegroundPermissionsAsync();
                if (status !== 'granted') return; // Silent return if not granted

                // Check WiFi SSID
                const state = await Network.getNetworkStateAsync();
                // @ts-ignore
                const currentSSID = state.type === Network.NetworkStateType.WIFI ? state.details?.ssid : null;

                // DEBUG ALERT
                // Alert.alert("WiFi Debug", `Permission: ${status}\nSSID: ${currentSSID}\nTarget: ${settings.schoolWifiSSID}`);

                if (!currentSSID || currentSSID === '<unknown ssid>') {
                    // console.log("Unknown SSID or Not WiFi");
                    return;
                }

                const cleanSSID = currentSSID.replace(/^"|"$/g, '');

                // Show toast or alert if matched (for verification)
                // if (cleanSSID === settings.schoolWifiSSID) Alert.alert("WiFi Matched", cleanSSID);

                if (cleanSSID !== settings.schoolWifiSSID) return;

                // SSID Matched! Find current course.
                const now = new Date();
                const dayIndex = now.getDay();
                if (dayIndex === 0) return; // Sunday

                const dayMap: Day[] = ['Mon', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                // Fix: getDay 0=Sun, 1=Mon. We need dayMap[1]='Mon'.
                // So index 1 => Mon.
                const todayLabel = dayMap[dayIndex];

                const nowMinutes = now.getHours() * 60 + now.getMinutes();

                const currentCourse = courses.find(c => {
                    if (c.day !== todayLabel) return false;
                    const { startMinutes, endMinutes } = calculateTime(
                        c.period,
                        settings.firstPeriodStart,
                        settings.thirdPeriodStart,
                        settings.periodDuration,
                        settings.breakDuration,
                        settings.customPeriodDurations,
                        c.day
                    );
                    // Allow check-in during class or slightly before?
                    // Let's say: Start - 10mins <= Now <= End
                    const buffer = 10;
                    return nowMinutes >= (startMinutes - buffer) && nowMinutes <= endMinutes;
                });

                if (currentCourse) {
                    const todayStr = '2025-12-24'; // FIXED DATE FOR TESTING? NO, use real date.
                    const realTodayStr = now.toISOString().split('T')[0];

                    // @ts-ignore
                    const alreadyAttended = currentCourse.attendance?.some(r => r.date === realTodayStr);

                    if (!alreadyAttended) {
                        // Mark as Present
                        const newRecord = { date: realTodayStr, status: 'present' as const };
                        const updatedCourse = {
                            ...currentCourse,
                            attendance: [...(currentCourse.attendance || []), newRecord]
                        };

                        // Helper to save
                        const newCourses = courses.map(c => c.id === updatedCourse.id ? updatedCourse : c);
                        setCourses(newCourses);
                        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newCourses));

                        Alert.alert("自動出席 (Beta)", `${currentCourse.name} に出席登録しました。`);
                    }
                }

            } catch (e) {
                // Silent fail
            }
        };

        const subscription = AppState.addEventListener('change', nextAppState => {
            if (nextAppState === 'active') {
                checkAutoAttendance();
            }
        });

        checkAutoAttendance();

        return () => {
            subscription.remove();
        };
    }, [settings.autoAttendanceEnabled, settings.schoolWifiSSID, courses /* Re-run if courses change? Maybe infinite loop if we update courses inside? No, because we check alreadyAttended. */]);


    const loadTutorialState = async () => {
        try {
            const visualDone = await AsyncStorage.getItem(TUTORIAL_KEY_VISUAL);
            if (!visualDone) setShowVisualTutorial(true);

            const alertDone = await AsyncStorage.getItem(TUTORIAL_KEY_ALERT);
            if (alertDone) setHasShownAlert(true);
        } catch (e) {
            console.error(e);
        }
    };

    const completeVisualTutorial = async () => {
        setShowVisualTutorial(false);
        await AsyncStorage.setItem(TUTORIAL_KEY_VISUAL, 'true');
    };

    // Measure Camera Button when tutorial is active
    const measureCameraBtn = () => {
        if (cameraBtnRef.current) {
            cameraBtnRef.current.measure((fx, fy, width, height, px, py) => {
                if (width > 0 && height > 0) {
                    setCameraBtnLayout({ x: px, y: py, width, height });
                }
            });
        }
    };

    useEffect(() => {
        if (showVisualTutorial) {
            // Retry a few times to ensure layout is ready
            measureCameraBtn();
            const t1 = setTimeout(measureCameraBtn, 100);
            const t2 = setTimeout(measureCameraBtn, 500);
            return () => { clearTimeout(t1); clearTimeout(t2); };
        }
    }, [showVisualTutorial]);

    // Re-schedule when settings change too (e.g. times)
    // Re-schedule when settings change too (e.g. times)
    // useEffect(() => {
    //     if (courses.length > 0) {
    //         scheduleCourseNotifications(courses, settings);
    //     }
    // }, [settings]);
    // Merged above to [courses, settings]

    // Update Widgets when courses or term changes
    useEffect(() => {
        const current = courses.filter(c => c.term === currentTerm);
        // Even if empty, we should update (to clear widget)
        updateWidgets(current);
    }, [courses, currentTerm]);

    const predictCurrentTerm = (): string => {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1; // 1-12

        // Japanese Academic Year: April to March
        // Spring: April (4) - September (9)
        // Fall: October (10) - March (3) of next calendar year (which is same academic year)

        if (month >= 4 && month <= 9) {
            return `${year}-Spring`;
        } else {
            // Oct, Nov, Dec -> Fall of current year
            // Jan, Feb, Mar -> Fall of previous year (Academic Year)
            const academicYear = month >= 10 ? year : year - 1;
            return `${academicYear}-Fall`;
        }
    };

    const loadData = async () => {
        try {
            const storedCourses = await AsyncStorage.getItem(STORAGE_KEY);
            const storedSettings = await AsyncStorage.getItem(SETTINGS_KEY);
            const storedTerm = await AsyncStorage.getItem('@current_term');
            const storedTermsList = await AsyncStorage.getItem(TERMS_KEY);

            let currentTermId = storedTerm;
            if (!currentTermId) {
                currentTermId = predictCurrentTerm();
                setCurrentTerm(currentTermId);
                // We don't save to storage yet, waiting for user confirmation or first save? 
                // Actually, let's just set it as active.
            } else {
                setCurrentTerm(storedTerm);
            }

            let loadedTerms = DEFAULT_TERMS;
            if (storedTermsList) {
                loadedTerms = sortTerms(JSON.parse(storedTermsList));
            }

            // Ensure the current term exists in the list
            if (!loadedTerms.some(t => t.id === currentTermId)) {
                const [y, s] = (currentTermId || "").split('-');
                const label = `${y} / ${s === 'Spring' ? '春' : '秋'}セメスター`;
                const newTerm: Term = { id: currentTermId!, label };
                loadedTerms = sortTerms([newTerm, ...loadedTerms]);
                // Save updated terms list implicitly or explicitly? 
                // For now just set state, it will save when they edit terms.
            }
            setTerms(loadedTerms);


            if (storedCourses) {
                const parsed: Course[] = JSON.parse(storedCourses);
                // Migrate existing data: if no term, assign to '2025-Spring' (or whatever default)
                // If migrating, use the PREDICTED term if no courses have term? 
                // Stick to safe default or predicted.
                const migrated = parsed.map(c => ({
                    ...c,
                    term: c.term || currentTermId || '2025-Spring'
                }));

                setCourses(migrated);
            }
            if (storedSettings) {
                const saved = JSON.parse(storedSettings);
                const merged = {
                    ...DEFAULT_SETTINGS, // Start with defaults
                    ...saved, // Overwrite with saved
                    // Manual migrations
                    firstPeriodStart: saved.firstPeriodStart || saved.firstPeriodTime?.start || DEFAULT_SETTINGS.firstPeriodStart,
                    thirdPeriodStart: saved.thirdPeriodStart || DEFAULT_SETTINGS.thirdPeriodStart,
                    periodDuration: saved.periodDuration || DEFAULT_SETTINGS.periodDuration,
                    breakDuration: saved.breakDuration || DEFAULT_SETTINGS.breakDuration,
                    latesEquivalentToAbsence: saved.latesEquivalentToAbsence || DEFAULT_SETTINGS.latesEquivalentToAbsence,
                    autoAttendanceEnabled: saved.autoAttendanceEnabled ?? DEFAULT_SETTINGS.autoAttendanceEnabled,
                    schoolWifiSSID: saved.schoolWifiSSID || DEFAULT_SETTINGS.schoolWifiSSID,
                    language: saved.language || DEFAULT_SETTINGS.language,
                };

                // Sync Max Period with loaded courses
                const currentCourses = storedCourses ? JSON.parse(storedCourses) as Course[] : [];
                const maxVal = Math.max(...currentCourses.map(c => c.period), 0);
                if (maxVal > merged.maxPeriod) {
                    merged.maxPeriod = maxVal;
                    AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(merged));
                }

                setSettings(merged);
            }
        } catch (e) {
            console.error('Failed to load data', e);
        }
    };

    const saveData = async (newCourses: Course[]) => {
        try {
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newCourses));
            setCourses(newCourses);
            scheduleCourseNotifications(newCourses, settings);

            // Auto-update maxPeriod if new courses exceed it
            const maxCoursePeriod = Math.max(...newCourses.map(c => c.period), 0);
            if (maxCoursePeriod > settings.maxPeriod) {
                const newSettings = { ...settings, maxPeriod: maxCoursePeriod };
                await saveSettings(newSettings);
            }
        } catch (e) {
            console.error('Failed to save data', e);
        }
    };

    const saveTerms = async (newTerms: Term[]) => {
        try {
            await AsyncStorage.setItem(TERMS_KEY, JSON.stringify(newTerms));
            setTerms(newTerms);
        } catch (e) {
            console.error(e);
        }
    };

    const handleAddTerm = (label: string) => {
        const newTerm: Term = {
            id: label.replace(/\s+/g, '-'), // Simple ID generation
            label: label
        };
        // Check duplicate
        if (terms.some(t => t.id === newTerm.id)) {
            alert("同じIDの学期が既に存在します");
            return;
        }
        saveTerms(sortTerms([newTerm, ...terms]));
    };

    const handleDeleteTerm = (id: string) => {
        const newTerms = terms.filter(t => t.id !== id);
        saveTerms(newTerms);
        // If current term is deleted, switch to first available? 
        // Logic in modal prevents deleting current term, so we are safe.
    };

    const handleTermChange = async (termId: string) => {
        setCurrentTerm(termId);
        await AsyncStorage.setItem('@current_term', termId);
    };

    const saveSettings = async (newSettings: Settings) => {
        try {
            await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
            setSettings(newSettings);
        } catch (e) {
            console.error(e);
        }
    };

    const addCourse = (course: Course) => {
        const courseWithTerm = { ...course, term: currentTerm };

        // Check for conflicts (Same Day, Period, Term, different ID)
        const conflicts = courses.filter(c =>
            c.term === currentTerm &&
            c.day === course.day &&
            c.period === course.period &&
            c.id !== course.id
        );

        if (conflicts.length > 0) {
            Alert.alert(
                "授業の重複",
                "同じ曜限に既に授業が登録されています。\n上書きしますか？それとも追加（クォーター制など）しますか？",
                [
                    { text: "キャンセル", style: "cancel" },
                    {
                        text: "追加する",
                        onPress: () => {
                            // Append (Quarter system support)
                            const filtered = courses.filter(c => c.id !== course.id);
                            saveData([...filtered, courseWithTerm]);
                        }
                    },
                    {
                        text: "上書き",
                        isPreferred: true,
                        onPress: () => {
                            // Overwrite: Remove conflicts and add new
                            const filtered = courses.filter(c =>
                                c.id !== course.id &&
                                !(c.term === currentTerm && c.day === course.day && c.period === course.period)
                            );
                            saveData([...filtered, courseWithTerm]);
                        }
                    }
                ]
            );
            return;
        }

        // Logic Change: Append course instead of replacing conflicts to support Quarter system (split periods)
        // Only replace if ID matches (editing case)
        const filtered = courses.filter(c => c.id !== course.id);

        saveData([...filtered, courseWithTerm]);
    };

    const deleteCourse = (id: string) => {
        saveData(courses.filter(c => c.id !== id));
    };

    const clearCourses = () => {
        // Clear all courses associated with the Current Term
        // We keep courses from other terms
        const retained = courses.filter(c => c.term !== currentTerm);
        saveData(retained);
        setActiveTab('timetable');
        Alert.alert("削除完了", "現在の学期の授業を全て削除しました。");
    };

    const updateCourse = (updated: Course) => {
        const next = courses.map(c => c.id === updated.id ? updated : c);
        saveData(next);
        if (detailCourse?.id === updated.id) {
            setDetailCourse(updated);
        }
    };

    const processImageAttributes = async (uri: string) => {
        try {
            const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });

            const apiKey = GEMINI_API_KEY?.trim();
            if (apiKey) {
                Alert.alert("確認", "AI解析を開始します", [
                    { text: "キャンセル", style: "cancel" },
                    {
                        text: "OK",
                        onPress: async () => {
                            setIsAnalyzing(true);
                            try {
                                const rawParsed = await recognizeWithGemini(base64, apiKey);
                                if (rawParsed.length > 0) {
                                    // Unify Colors
                                    const nameToColor: Record<string, string> = {};
                                    courses.forEach(c => nameToColor[c.name] = c.color);

                                    const parsed = rawParsed.map(c => {
                                        if (nameToColor[c.name]) {
                                            return { ...c, color: nameToColor[c.name] };
                                        }
                                        nameToColor[c.name] = c.color;
                                        return c;
                                    });

                                    const coursesWithTerm = parsed.map(c => ({ ...c, term: currentTerm }));
                                    setScannedCourses(coursesWithTerm);
                                    setIsSelectionModalVisible(true);
                                } else {
                                    alert("授業を検出できませんでした(AI)");
                                }
                            } catch (aiErr: any) {
                                console.error(aiErr);
                                alert("apiエラー。しばらくした後にお試しください");
                            } finally {
                                setIsAnalyzing(false);
                            }
                        }
                    }
                ]);
            } else {
                setOcrTrigger(base64);
            }
        } catch (err) {
            console.error("File Read Error", err);
            alert("画像の読み込みに失敗しました");
        }
    };

    const pickImage = async () => {
        // Dismiss visual tutorial if active
        if (showVisualTutorial) {
            completeVisualTutorial();
        }

        const runPicker = () => {
            Alert.alert(
                "画像の選択",
                "時間割を取り込みますか？",
                [
                    { text: "キャンセル", style: "cancel" },
                    {
                        text: "写真を撮る",
                        onPress: async () => {
                            try {
                                const result = await ImagePicker.launchCameraAsync({
                                    mediaTypes: ['images'],
                                    base64: false,
                                    quality: 1,
                                    allowsEditing: false,
                                });
                                if (!result.canceled && result.assets && result.assets.length > 0) {
                                    processImageAttributes(result.assets[0].uri);
                                }
                            } catch (e) {
                                console.error("Camera Error", e);
                                Alert.alert("エラー", "カメラの起動に失敗しました");
                            }
                        }
                    },
                    {
                        text: "ライブラリから選択",
                        onPress: async () => {
                            try {
                                const result = await ImagePicker.launchImageLibraryAsync({
                                    mediaTypes: ['images'],
                                    base64: false,
                                    quality: 1,
                                    allowsEditing: false,
                                    allowsMultipleSelection: false,
                                });
                                if (!result.canceled && result.assets && result.assets.length > 0) {
                                    processImageAttributes(result.assets[0].uri);
                                }
                            } catch (e) {
                                console.error("Library Error", e);
                            }
                        }
                    }
                ]
            );
        };

        if (!hasShownAlert) {
            Alert.alert(
                "確認",
                "授業名、曜日、時間が必要です",
                [
                    {
                        text: "OK",
                        onPress: async () => {
                            setHasShownAlert(true);
                            await AsyncStorage.setItem(TUTORIAL_KEY_ALERT, 'true');
                            runPicker();
                        }
                    }
                ]
            );
        } else {
            runPicker();
        }
    };

    const handleSelectionConfirm = (selected: Course[]) => {
        // Auto-expand max period if necessary
        const maxVal = Math.max(...selected.map(c => c.period));
        if (maxVal > settings.maxPeriod) {
            saveSettings({ ...settings, maxPeriod: Math.min(10, maxVal) });
        }

        // Filter out conflicting courses in the CURRENT term
        let currentCourses = [...courses];
        selected.forEach(newCourse => {
            // Assign term if missing
            const courseToAdd = { ...newCourse, term: currentTerm };

            // Do NOT remove conflicts based on day/period/term. Allow multiple courses (Split View).
            // Only remove if ID matches (prevent duplicate objects of same course instance)
            currentCourses = currentCourses.filter(c => c.id !== courseToAdd.id);
            currentCourses.push(courseToAdd);
        });

        saveData(currentCourses);
        setIsSelectionModalVisible(false);
        alert(`${selected.length}件の授業を追加しました！`);
    };

    const handleImportCourses = (imported: Course[]) => {
        const newCourses = imported.map(c => ({
            ...c,
            id: Math.random().toString(36).substr(2, 9), // Generate new ID
            term: currentTerm
        }));

        saveData([...courses, ...newCourses]);
        setIsImportModalVisible(false);
    };

    const toggleTheme = () => setIsDarkMode(prev => !prev);

    const getGreeting = () => {
        const hour = new Date().getHours();
        const t = translations[settings.language] || translations.ja;
        if (hour >= 5 && hour < 11) return t.goodMorning;
        if (hour >= 11 && hour < 18) return t.hello;
        return t.goodEvening;
    };

    const currentTermLabel = terms.find(t => t.id === currentTerm)?.label || currentTerm;

    const filteredCourses = courses.filter(c => c.term === currentTerm);

    const useImageBg = !!settings.backgroundImage;
    const bgColor = getBackgroundColor(settings.tableBackgroundColor, isDarkMode);
    const textPrimary = isDarkMode ? '#f8fafc' : '#1e293b';

    let Wrapper: any = View;
    let wrapperProps: any = { style: [styles.container, { backgroundColor: bgColor }] };

    if (useImageBg) {
        Wrapper = ImageBackground;
        wrapperProps = { source: { uri: settings.backgroundImage }, style: styles.container };
    } else if (Array.isArray(bgColor)) {
        Wrapper = LinearGradient;
        wrapperProps = { colors: bgColor, style: styles.container };
    }


    // Friend State
    const [friends, setFriends] = useState<import('./src/lib/types').Friend[]>([]);
    const [isFriendsListVisible, setIsFriendsListVisible] = useState(false);
    const [friendDetail, setFriendDetail] = useState<import('./src/lib/types').Friend | null>(null);
    const [isFriendNameModalVisible, setIsFriendNameModalVisible] = useState(false);
    const [tempImportedCourses, setTempImportedCourses] = useState<Course[]>([]);

    const FRIENDS_KEY = '@friends_v1';

    // Load Friends
    useEffect(() => {
        const loadFriends = async () => {
            try {
                const stored = await AsyncStorage.getItem(FRIENDS_KEY);
                if (stored) {
                    setFriends(JSON.parse(stored));
                }
            } catch (e) {
                console.error("Failed to load friends", e);
            }
        };
        loadFriends();
    }, []);

    const saveFriends = async (newFriends: import('./src/lib/types').Friend[]) => {
        try {
            await AsyncStorage.setItem(FRIENDS_KEY, JSON.stringify(newFriends));
            setFriends(newFriends);
        } catch (e) {
            console.error("Failed to save friends", e);
        }
    };

    const handleSaveAsFriend = (importedCourses: Course[]) => {
        setTempImportedCourses(importedCourses);
        setIsFriendNameModalVisible(true);
    };

    const handleConfirmFriendName = (name: string) => {
        setIsFriendNameModalVisible(false);
        const newFriend: import('./src/lib/types').Friend = {
            id: Math.random().toString(36).substr(2, 9),
            name: name,
            courses: tempImportedCourses,
            term: currentTerm,
            createdAt: new Date().toISOString()
        };
        saveFriends([...friends, newFriend]);
        setIsFriendsListVisible(true);
        setTempImportedCourses([]);
        Alert.alert("完了", `${name}さんの時間割を保存しました`);
    };

    const deleteFriend = (id: string) => {
        Alert.alert(
            "削除の確認",
            "この友達の時間割を削除しますか？",
            [
                { text: "キャンセル", style: "cancel" },
                {
                    text: "削除",
                    style: "destructive",
                    onPress: () => {
                        saveFriends(friends.filter(f => f.id !== id));
                    }
                }
            ]
        );
    };

    return (
        <SafeAreaProvider>
            <FontProvider settings={settings}>
                <Wrapper {...(wrapperProps as any)}>
                    <StatusBar style={isDarkMode ? "light" : "dark"} />
                    {useImageBg && (
                        <View style={[StyleSheet.absoluteFill, { backgroundColor: isDarkMode ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.6)' }]} />
                    )}

                    {isAnalyzing && (
                        <View style={styles.loadingOverlay}>
                            <ActivityIndicator size="large" color="#4f46e5" />
                            <Text style={styles.loadingText}>AI解析中...</Text>
                        </View>
                    )}

                    <OCRWebView
                        triggerScan={ocrTrigger}
                        onMessage={(dataString) => {
                            try {
                                const data = JSON.parse(dataString);

                                if (data.type === 'complete') {
                                    setOcrTrigger(null);
                                    const parsed = parseRawTextToCourses(data.payload);
                                    if (parsed.length > 0) {
                                        const coursesWithTerm = parsed.map(c => ({ ...c, term: currentTerm }));
                                        setScannedCourses(coursesWithTerm);
                                        setIsSelectionModalVisible(true);
                                    } else {
                                        alert("授業を検出できませんでした。");
                                    }
                                } else if (data.type === 'error') {
                                    console.error("[OCR Error]", data.payload);
                                    alert("OCR Error: " + data.payload);
                                    setOcrTrigger(null);
                                }
                            } catch (e) {
                                console.error("JSON Parse error from WebView", e);
                            }
                        }}
                    />

                    <SafeAreaView style={{ flex: 1 }}>
                        <View style={styles.header}>
                            <View>
                                <Text style={[styles.greeting, { color: isDarkMode ? '#94a3b8' : '#64748b', fontSize: 13, marginBottom: 4, fontWeight: '600' }]}>
                                    {currentTermLabel}
                                </Text>
                                <Text style={{ color: textPrimary, fontSize: 26, fontWeight: '800', letterSpacing: -0.5 }}>
                                    {getGreeting()}
                                </Text>
                                <Text style={[styles.date, { color: textPrimary, fontSize: 13, opacity: 0.7, marginTop: 4, fontWeight: '500' }]}>
                                    {new Date().toLocaleDateString('ja-JP', { month: 'long', day: 'numeric', weekday: 'short' })}
                                </Text>
                            </View>

                            <View style={styles.headerRight}>
                                <TouchableOpacity onPress={toggleTheme} style={styles.iconButton}>
                                    <Feather name={isDarkMode ? "sun" : "moon"} size={24} color={textPrimary} />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => setIsShareModalVisible(true)} style={styles.iconButton}>
                                    <Feather name="share" size={22} color={textPrimary} />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => setIsImportModalVisible(true)} style={styles.iconButton}>
                                    <Feather name="download" size={22} color={textPrimary} />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={pickImage}
                                    style={[styles.iconButton, { backgroundColor: '#4f46e5', padding: 8, borderRadius: 20 }]}
                                    ref={cameraBtnRef}
                                    onLayout={() => {
                                        if (showVisualTutorial) measureCameraBtn();
                                    }}
                                >
                                    <Feather name="camera" size={20} color="white" />
                                </TouchableOpacity>
                            </View>
                        </View>


                        <View style={{ flex: 1, position: 'relative' }}>
                            <ScrollView
                                ref={scrollViewRef}
                                horizontal
                                pagingEnabled
                                showsHorizontalScrollIndicator={false}
                                onMomentumScrollEnd={(e) => {
                                    const offsetX = e.nativeEvent.contentOffset.x;
                                    const pageIndex = Math.round(offsetX / SCREEN_WIDTH);
                                    if (pageIndex === 0 && activeTab !== 'schedule') setActiveTab('schedule');
                                    else if (pageIndex === 1 && activeTab !== 'timetable') setActiveTab('timetable');
                                    else if (pageIndex === 2 && activeTab !== 'settings') setActiveTab('settings');
                                }}
                                scrollEventThrottle={16}
                                style={{ flex: 1 }}
                                scrollEnabled={settings.enableSwipeNavigation}
                            >
                                <View style={{ width: SCREEN_WIDTH, flex: 1 }}>
                                    <NextClassView
                                        courses={filteredCourses}
                                        settings={settings}
                                        onCourseClick={(c) => { setDetailCourse(c); setIsDetailVisible(true); }}
                                        onUpdateCourse={updateCourse}
                                        isDarkMode={isDarkMode}
                                    />
                                </View>
                                <View style={{ width: SCREEN_WIDTH, flex: 1 }}>
                                    <TimetableGrid
                                        courses={filteredCourses}
                                        settings={settings}
                                        onCourseClick={(c) => { setDetailCourse(c); setIsDetailVisible(true); }}
                                        onEmptySlotClick={(d, p) => { setEditingCourse({ day: d, period: p }); setIsModalVisible(true); }}
                                        isDarkMode={isDarkMode}
                                    />
                                </View>
                                <View style={{ width: SCREEN_WIDTH, flex: 1 }}>
                                    <SettingsScreen
                                        settings={settings}
                                        onSave={saveSettings}
                                        isDarkMode={isDarkMode}
                                        currentTerm={currentTerm}
                                        onTermChange={handleTermChange}
                                        onClearCourses={clearCourses}
                                        terms={terms}
                                        onAddTerm={handleAddTerm}
                                        onDeleteTerm={handleDeleteTerm}
                                        onOpenShare={() => setIsShareModalVisible(true)}
                                        onOpenImport={() => setIsImportModalVisible(true)}
                                        onOpenFriendsList={() => setIsFriendsListVisible(true)}
                                    />
                                </View>
                            </ScrollView>

                            {/* TabBar Overlay: Positioned absolutely at the bottom of the content area */}
                            <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, alignItems: 'center', zIndex: 10 }}>
                                <View style={styles.tabBarContainer}>
                                    <View style={[styles.tabBar, { backgroundColor: isDarkMode ? 'rgba(30,41,59,0.9)' : 'white' }]}>
                                        <TouchableOpacity
                                            style={[styles.tabItem, activeTab === 'schedule' && { backgroundColor: isDarkMode ? '#334155' : '#f1f5f9' }]}
                                            onPress={() => setActiveTab('schedule')}
                                        >
                                            <Feather name="list" size={20} color={activeTab === 'schedule' ? '#4f46e5' : (isDarkMode ? '#94a3b8' : '#64748b')} />
                                            <Text style={[styles.tabText, activeTab === 'schedule' && styles.tabTextActive]}>予定</Text>
                                        </TouchableOpacity>

                                        <View style={styles.verticalDivider} />

                                        <TouchableOpacity
                                            style={[styles.tabItem, activeTab === 'timetable' && { backgroundColor: isDarkMode ? '#334155' : '#f1f5f9' }]}
                                            onPress={() => setActiveTab('timetable')}
                                        >
                                            <Feather name="calendar" size={20} color={activeTab === 'timetable' ? '#4f46e5' : (isDarkMode ? '#94a3b8' : '#64748b')} />
                                            <Text style={[styles.tabText, activeTab === 'timetable' && styles.tabTextActive]}>時間割</Text>
                                        </TouchableOpacity>

                                        <View style={styles.verticalDivider} />

                                        <TouchableOpacity
                                            style={[styles.tabItem, activeTab === 'settings' && { backgroundColor: isDarkMode ? '#334155' : '#f1f5f9' }]}
                                            onPress={() => setActiveTab('settings')}
                                        >
                                            <Feather name="settings" size={20} color={activeTab === 'settings' ? '#4f46e5' : (isDarkMode ? '#94a3b8' : '#64748b')} />
                                            <Text style={[styles.tabText, activeTab === 'settings' && styles.tabTextActive]}>設定</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                                {/* Spacer below TabBar for visual balance before Ad */}
                                <View style={{ height: 2 }} />
                            </View>
                        </View>

                        {/* AdBanner: Stays outside/below the flex container, taking up solid space */}
                        <View style={{ width: '100%', alignItems: 'center', backgroundColor: isDarkMode ? '#0f172a' : '#f1f5f9' }}>
                            <AdBanner />
                        </View>

                        <CourseDetailModal
                            visible={isDetailVisible}
                            course={detailCourse}
                            settings={settings}
                            onClose={() => setIsDetailVisible(false)}
                            onUpdate={updateCourse}
                            onEdit={(c) => {
                                setEditingCourse(c);
                                setIsModalVisible(true);
                            }}
                            onDelete={deleteCourse}
                            isDarkMode={isDarkMode}
                        />

                        <AddCourseModal
                            /* ... props ... */
                            visible={isModalVisible}
                            onClose={() => setIsModalVisible(false)}
                            onSave={(course) => {
                                addCourse(course);
                                setIsModalVisible(false);
                            }}
                            onDelete={deleteCourse}
                            initialData={editingCourse}
                            isDarkMode={isDarkMode}
                        />

                        <CourseSelectionModal
                            visible={isSelectionModalVisible}
                            scannedCourses={scannedCourses}
                            onClose={() => setIsSelectionModalVisible(false)}
                            onConfirm={handleSelectionConfirm}
                            isDarkMode={isDarkMode}
                        />

                        <ShareTimetableModal
                            visible={isShareModalVisible}
                            courses={filteredCourses}
                            onClose={() => setIsShareModalVisible(false)}
                            isDarkMode={isDarkMode}
                        />

                        <ImportTimetableModal
                            visible={isImportModalVisible}
                            onClose={() => setIsImportModalVisible(false)}
                            onImport={handleImportCourses}
                            onSaveAsFriend={handleSaveAsFriend}
                            isDarkMode={isDarkMode}
                        />

                        <FriendsListModal
                            visible={isFriendsListVisible}
                            friends={friends}
                            onClose={() => setIsFriendsListVisible(false)}
                            onSelectFriend={(f) => {
                                setIsFriendsListVisible(false);
                                setFriendDetail(f);
                            }}
                            onDeleteFriend={deleteFriend}
                            onAddFriend={() => {
                                setIsFriendsListVisible(false);
                                setIsImportModalVisible(true);
                            }}
                            isDarkMode={isDarkMode}
                        />

                        <FriendDetailModal
                            visible={!!friendDetail}
                            friend={friendDetail}
                            onClose={() => setFriendDetail(null)}
                            settings={settings}
                            isDarkMode={isDarkMode}
                        />

                        <FriendNameInputModal
                            visible={isFriendNameModalVisible}
                            onClose={() => setIsFriendNameModalVisible(false)}
                            onSave={handleConfirmFriendName}
                            isDarkMode={isDarkMode}
                        />




                        {/* AdBanner Removed from here, moved to Bottom Stack */}
                    </SafeAreaView>
                    {showVisualTutorial && cameraBtnLayout && (
                        <View style={styles.tutorialOverlay} pointerEvents="box-none">
                            <View
                                style={[
                                    styles.tutorialHighlight,
                                    {
                                        top: cameraBtnLayout.y - 10,
                                        left: cameraBtnLayout.x - 10,
                                        width: cameraBtnLayout.width + 20,
                                        height: cameraBtnLayout.height + 20,
                                        borderRadius: (cameraBtnLayout.width + 20) / 2
                                    }
                                ]}
                            />
                            <View style={[
                                styles.tutorialBubble,
                                {
                                    top: cameraBtnLayout.y + cameraBtnLayout.height + 15,
                                    right: SCREEN_WIDTH - (cameraBtnLayout.x + cameraBtnLayout.width) - 10 // Align near right edge
                                }
                            ]}>
                                <Text style={styles.tutorialText}>ここから時間割をスキャン登録できます</Text>
                                <View style={[styles.tutorialArrow, { right: 25 }]} />
                            </View>
                            <TouchableOpacity style={styles.tutorialDismiss} onPress={completeVisualTutorial} />
                        </View>
                    )}
                </Wrapper>
            </FontProvider>
        </SafeAreaProvider>
    );
} // Ending default export


const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    greeting: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    date: {
        fontSize: 14,
        marginTop: 4,
    },
    headerRight: {
        flexDirection: 'row',
        gap: 6,
        alignItems: 'center',
    },
    iconButton: {
        padding: 4,
    },
    tabBarContainer: {
        // Removed absolute positioning for strict stacking
        alignItems: 'center',
        paddingVertical: 10,
    },
    tabBar: {
        flexDirection: 'row',
        borderRadius: 32,
        padding: 6,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
    },
    tabItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 24,
        gap: 8,
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748b',
    },
    tabTextActive: {
        color: '#4f46e5',
    },
    verticalDivider: {
        width: 1,
        backgroundColor: '#e2e8f0',
        marginVertical: 10,
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 999,
    },
    loadingText: {
        color: 'white',
        marginTop: 16,
        fontSize: 16,
        fontWeight: 'bold',
    },
    tutorialOverlay: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 1000,
        backgroundColor: 'transparent', // Don't dim whole screen to allow interaction, or use dimming with hole
    },
    tutorialDismiss: {
        position: 'absolute', // Invisible closer
        top: 0, bottom: 0, left: 0, right: 0,
        zIndex: -1,
    },
    tutorialHighlight: {
        position: 'absolute',
        top: 60, // Approximate header position
        right: 15,
        width: 50,
        height: 50,
        borderRadius: 25,
        borderWidth: 2,
        borderColor: '#facc15', // Yellow highlight
        shadowColor: "#facc15",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 10,
        elevation: 10,
    },
    tutorialBubble: {
        position: 'absolute',
        top: 120,
        right: 20,
        backgroundColor: '#4f46e5',
        padding: 12,
        borderRadius: 8,
        maxWidth: 200,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    tutorialText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 14,
    },
    tutorialArrow: {
        position: 'absolute',
        top: -10,
        right: 20,
        width: 0,
        height: 0,
        backgroundColor: 'transparent',
        borderStyle: 'solid',
        borderLeftWidth: 10,
        borderRightWidth: 10,
        borderBottomWidth: 10,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        borderBottomColor: '#4f46e5',
    },
});
