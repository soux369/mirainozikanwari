import React, { useState } from 'react';
import { StyleSheet, Text, View, Switch, TouchableOpacity, ScrollView, TextInput, Platform, Alert, Image, Modal } from 'react-native';
import { Settings, DAYS, DAY_LABELS, Day, THEME_PRESETS, Period, Term, FONT_OPTIONS } from '../lib/types';
import { ThemedText } from './ThemedText';
import { TermSelectionModal } from './TermSelectionModal';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { sendTestNotification } from '../lib/notificationManager';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useSubscription } from '../context/SubscriptionContext';

import { translations, LanguageCode } from '../lib/i18n';

interface SettingsScreenProps {
    settings: Settings;
    onSave: (newSettings: Settings) => void;
    currentTerm: string;
    onTermChange: (termId: string) => void;
    onClearCourses: () => void;
    isDarkMode?: boolean;
    terms: Term[];
    onAddTerm: (label: string) => void;
    onDeleteTerm: (id: string) => void;
    onOpenShare?: () => void;
    onOpenImport?: () => void;
    onOpenFriendsList?: () => void;
    onOpenSubscription?: () => void;
    onClose?: () => void;
    isPremium?: boolean;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
    settings,
    onSave,
    currentTerm,
    onTermChange,
    onClearCourses,
    isDarkMode = false,
    terms,
    onAddTerm,
    onDeleteTerm,
    onOpenShare,
    onOpenImport,
    onOpenFriendsList,
    onOpenSubscription,
    onClose,
    isPremium: isPremiumProp
}) => {
    const {
        isPremium: isPremiumStatus,
        isInitializing,
        packages,
        purchasePackage,
        restorePurchases,
        presentPaywall,
        presentCustomerCenter,
        debugLogs,
        presentCodeRedemptionSheet
    } = useSubscription();
    const isPremium = isPremiumProp !== undefined ? isPremiumProp : isPremiumStatus;
    const [localSettings, setLocalSettings] = useState<Settings>(settings);

    // Sync local state with props (critical for async storage loading)
    React.useEffect(() => {
        setLocalSettings(settings);
    }, [settings]);

    const [isTermModalVisible, setIsTermModalVisible] = useState(false);
    const [showStartDatePicker, setShowStartDatePicker] = useState(false);
    const [showEndDatePicker, setShowEndDatePicker] = useState(false);
    const [showDurationModal, setShowDurationModal] = useState(false);
    const [durationDay, setDurationDay] = useState<string | null>(null);

    const updateSetting = (key: keyof Settings, value: any) => {
        const next = { ...localSettings, [key]: value };
        setLocalSettings(next);
        onSave(next);
    };

    const toggleDay = (day: Day) => {
        const current = localSettings.visibleDays;
        const nextDays = current.includes(day)
            ? current.filter(d => d !== day)
            : [...current, day].sort((a, b) => DAYS.indexOf(a) - DAYS.indexOf(b));
        updateSetting('visibleDays', nextDays);
    };

    const pickBackgroundImage = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [9, 19.5],
                quality: 0.8,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                updateSetting('backgroundImage', result.assets[0].uri);
                Alert.alert(t.done, t.imageSetDone);
            }
        } catch (e) {
            Alert.alert('Error', 'Failed to pick image');
        }
    };

    const openLink = (url: string) => {
        const { Linking } = require('react-native');
        Linking.openURL(url).catch((err: any) => console.error("Couldn't load page", err));
    };

    const handleClearCourses = () => {
        Alert.alert(
            translations[localSettings.language]?.deleteConfirmTitle || translations.ja.deleteConfirmTitle,
            translations[localSettings.language]?.deleteConfirmMessage || translations.ja.deleteConfirmMessage,
            [
                { text: translations[localSettings.language]?.cancel || translations.ja.cancel, style: "cancel" },
                { text: translations[localSettings.language]?.delete || translations.ja.delete, style: "destructive", onPress: onClearCourses }
            ]
        );
    };

    const textPrimary = isDarkMode ? '#f8fafc' : '#1e293b';
    const textSecondary = isDarkMode ? '#94a3b8' : '#64748b';
    const sectionBg = isDarkMode ? '#1e293b' : '#ffffff';
    const borderColor = isDarkMode ? '#334155' : '#e2e8f0';

    const currentTermLabel = terms.find(t => t.id === currentTerm)?.label || currentTerm;
    const t = translations[localSettings.language] || translations.ja;

    const renderSectionHeader = (title: string, icon: keyof typeof Feather.glyphMap) => (
        <View style={styles.sectionHeader}>
            <Feather name={icon} size={16} color={textSecondary} />
            <ThemedText style={[styles.sectionTitle, { color: textSecondary }]}>{title}</ThemedText>
        </View>
    );

    return (
        <ScrollView style={[styles.container, { backgroundColor: 'transparent' }]} contentContainerStyle={{ paddingBottom: 100 }}>


            {/* Term Settings */}
            <View style={styles.sectionContainer}>
                {renderSectionHeader(t.term, "calendar")}
                <View style={[styles.card, { backgroundColor: sectionBg }]}>
                    <TouchableOpacity
                        style={[styles.row, { borderBottomWidth: 0 }]}
                        onPress={() => setIsTermModalVisible(true)}
                    >
                        <ThemedText style={[styles.label, { color: textPrimary }]}>{t.currentTerm}</ThemedText>
                        <View style={styles.rowRight}>
                            <ThemedText style={[styles.valueText, { color: '#4f46e5' }]}>{currentTermLabel}</ThemedText>
                            <Feather name="chevron-right" size={16} color={textSecondary} />
                        </View>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Subscription Settings */}
            <View style={styles.sectionContainer}>
                {renderSectionHeader(t.proPlanSection, "star")}
                <View style={[styles.card, { backgroundColor: sectionBg }]}>
                    <View style={[styles.row, { borderBottomWidth: 0, paddingVertical: 16 }]}>
                        <View style={{ flex: 1 }}>
                            <ThemedText style={[styles.label, { color: textPrimary, fontSize: 16, fontWeight: '700' }]}>
                                {isPremium ? t.proPlanStatusActive : t.proPlanSection}
                            </ThemedText>
                            <Text style={{ fontSize: 12, color: textSecondary, marginTop: 4 }}>
                                {isPremium
                                    ? t.proPlanDescriptionActive
                                    : t.proPlanDescriptionInactive}
                            </Text>
                        </View>
                        {isPremium ? (
                            <TouchableOpacity
                                style={{ backgroundColor: '#10b981', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, flexDirection: 'row', alignItems: 'center' }}
                                onPress={presentCustomerCenter}
                            >
                                <Feather name="settings" size={14} color="white" style={{ marginRight: 4 }} />
                                <Text style={{ color: 'white', fontWeight: '700', fontSize: 13 }}>{t.manageSubscription}</Text>
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity
                                style={{ backgroundColor: '#4f46e5', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 }}
                                onPress={presentPaywall}
                            >
                                <Text style={{ color: 'white', fontWeight: '700', fontSize: 13 }}>{t.viewDetails}</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                    {!isPremium && (
                        <View style={{ borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: borderColor }}>
                            <TouchableOpacity
                                style={{ paddingVertical: 12, alignItems: 'center' }}
                                onPress={restorePurchases}
                            >
                                <Text style={{ fontSize: 12, color: textSecondary }}>{t.restorePurchases}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={{ paddingVertical: 12, alignItems: 'center', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: borderColor }}
                                onPress={presentCodeRedemptionSheet}
                            >
                                <Text style={{ fontSize: 12, color: textSecondary }}>{t.redeemCode}</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </View>

            {/* Display Settings */}
            <View style={styles.sectionContainer}>
                {renderSectionHeader(t.display, "layout")}
                <View style={[styles.card, { backgroundColor: sectionBg }]}>

                    {/* Language Setting */}
                    <View style={[styles.row, { borderBottomColor: borderColor }]}>
                        <ThemedText style={[styles.label, { color: textPrimary }]}>{t.language}</ThemedText>
                        <View style={{ flexDirection: 'row', backgroundColor: isDarkMode ? '#334155' : '#f1f5f9', borderRadius: 8, padding: 2 }}>
                            {(['ja', 'en'] as const).map((lang) => (
                                <TouchableOpacity
                                    key={lang}
                                    style={{
                                        paddingHorizontal: 12,
                                        paddingVertical: 6,
                                        backgroundColor: localSettings.language === lang ? (isDarkMode ? '#475569' : 'white') : 'transparent',
                                        borderRadius: 6,
                                        shadowColor: localSettings.language === lang ? "#000" : "transparent",
                                        shadowOffset: { width: 0, height: 1 },
                                        shadowOpacity: localSettings.language === lang ? 0.1 : 0,
                                        shadowRadius: 1,
                                    }}
                                    onPress={() => updateSetting('language', lang)}
                                >
                                    <ThemedText style={{ fontSize: 13, fontWeight: '600', color: localSettings.language === lang ? textPrimary : textSecondary }}>
                                        {lang === 'ja' ? '日本語' : 'English'}
                                    </ThemedText>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Max Periods */}
                    <View style={[styles.row, { borderBottomColor: borderColor }]}>
                        <ThemedText style={[styles.label, { color: textPrimary }]}>{t.maxPeriods}</ThemedText>
                        <View style={styles.periodSelector}>
                            {[3, 4, 5, 6, 7].map(num => (
                                <TouchableOpacity
                                    key={num}
                                    style={[
                                        styles.periodChip,
                                        localSettings.maxPeriod === num && { backgroundColor: '#4f46e5' }
                                    ]}
                                    onPress={() => updateSetting('maxPeriod', num)}
                                >
                                    <ThemedText style={[
                                        styles.periodText,
                                        { color: localSettings.maxPeriod === num ? 'white' : textSecondary }
                                    ]}>{num}</ThemedText>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Lates Equivalent to Absence */}
                    <View style={[styles.row, { borderBottomColor: borderColor }]}>
                        <View>
                            <ThemedText style={[styles.label, { color: textPrimary }]}>{t.lateCountSetting}</ThemedText>
                            <Text style={{ fontSize: 11, color: textSecondary }}>{t.lateCountDescription}</Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                            <TouchableOpacity
                                style={[styles.periodChip, { backgroundColor: isDarkMode ? '#334155' : '#e2e8f0', width: 28, height: 28 }]}
                                onPress={() => {
                                    const current = localSettings.latesEquivalentToAbsence || 3;
                                    if (current > 1) updateSetting('latesEquivalentToAbsence', current - 1);
                                }}
                            >
                                <Feather name="minus" size={16} color={textPrimary} />
                            </TouchableOpacity>
                            <ThemedText style={{ fontSize: 16, fontWeight: 'bold', minWidth: 20, textAlign: 'center' }}>
                                {localSettings.latesEquivalentToAbsence || 3}
                            </ThemedText>
                            <TouchableOpacity
                                style={[styles.periodChip, { backgroundColor: isDarkMode ? '#334155' : '#e2e8f0', width: 28, height: 28 }]}
                                onPress={() => {
                                    const current = localSettings.latesEquivalentToAbsence || 3;
                                    if (current < 10) updateSetting('latesEquivalentToAbsence', current + 1);
                                }}
                            >
                                <Feather name="plus" size={16} color={textPrimary} />
                            </TouchableOpacity>
                        </View>
                    </View >

                    {/* Visible Days */}
                    <View style={[styles.row, { flexDirection: 'column', alignItems: 'flex-start', borderBottomWidth: 0, paddingVertical: 16 }]}>
                        <View style={styles.daysGrid}>
                            {DAYS.map(day => (
                                <TouchableOpacity
                                    key={day}
                                    style={[
                                        styles.dayChip,
                                        localSettings.visibleDays.includes(day) && { backgroundColor: '#4f46e5' }
                                    ]}
                                    onPress={() => toggleDay(day)}
                                >
                                    <ThemedText style={[
                                        styles.dayText,
                                        { color: localSettings.visibleDays.includes(day) ? 'white' : textSecondary }
                                    ]}>{t[day]}</ThemedText>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </View>
            </View>

            {/* Time Settings */}
            <View style={styles.sectionContainer}>
                {renderSectionHeader(t.timeDetails, "clock")}
                <View style={[styles.card, { backgroundColor: sectionBg }]}>
                    {
                        [
                            { label: t.firstPeriodStart, value: localSettings.firstPeriodStart, key: 'firstPeriodStart', placeholder: '09:00', keyboard: 'numbers-and-punctuation' },
                            { label: t.thirdPeriodStart, value: localSettings.thirdPeriodStart, key: 'thirdPeriodStart', placeholder: '13:00', keyboard: 'numbers-and-punctuation' },
                            { label: t.classDuration, value: localSettings.periodDuration.toString(), key: 'periodDuration', keyboard: 'numeric' },
                            { label: t.breakDuration, value: localSettings.breakDuration.toString(), key: 'breakDuration', keyboard: 'numeric' }
                        ].map((item, idx, arr) => (
                            <View key={item.key} style={[styles.row, idx === arr.length - 1 && { borderBottomWidth: 0 }, { borderBottomColor: borderColor }]}>
                                <ThemedText style={[styles.label, { color: textPrimary }]}>{item.label}</ThemedText>
                                <TextInput
                                    style={[styles.input, { color: textPrimary }]}
                                    value={item.value}
                                    onChangeText={(val) => updateSetting(item.key as keyof Settings, item.keyboard === 'numeric' ? (parseInt(val) || 0) : val)}
                                    placeholder={item.placeholder}
                                    placeholderTextColor={textSecondary}
                                    keyboardType={item.keyboard as any}
                                />
                            </View>
                        ))
                    }

                    {/* Custom Period Durations Button */}
                    <TouchableOpacity
                        style={[styles.row, { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: borderColor, justifyContent: 'center', paddingVertical: 12 }]}
                        onPress={() => setShowDurationModal(true)}
                    >
                        <Text style={{ color: '#4f46e5', fontWeight: '600' }}>{t.customPeriodSettings}</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Notification Settings */}
            <View style={styles.sectionContainer}>
                {renderSectionHeader(t.notifications, "bell")}
                <View style={[styles.card, { backgroundColor: sectionBg }]}>
                    {/* Master Switch */}
                    <View style={[styles.row, { borderBottomColor: borderColor }]}>
                        <Text style={[styles.label, { color: textPrimary }]}>{t.enableNotifications}</Text>
                        <Switch
                            value={localSettings.notificationsEnabled ?? true}
                            onValueChange={(val) => updateSetting('notificationsEnabled', val)}
                            trackColor={{ false: "#767577", true: "#4f46e5" }}
                        />
                    </View>

                    {/* Holiday Setting */}
                    <View style={[styles.row, { flexDirection: 'column', alignItems: 'stretch', borderBottomColor: borderColor, paddingVertical: 16 }]}>
                        <Text style={[styles.label, { color: textPrimary, marginBottom: 8 }]}>{t.holidaySettings}</Text>
                        <Text style={{ fontSize: 12, color: textSecondary, marginBottom: 12 }}>
                            {t.holidayDescription}
                        </Text>

                        {/* Holiday Mode Toggle */}
                        <View style={[styles.row, { borderBottomWidth: 0, paddingHorizontal: 0, marginBottom: 12 }]}>
                            <Text style={[styles.label, { color: textPrimary, fontSize: 13 }]}>{t.enableHoliday}</Text>
                            <Switch
                                value={localSettings.holidayModeEnabled ?? true}
                                onValueChange={(val) => updateSetting('holidayModeEnabled', val)}
                                trackColor={{ false: "#767577", true: "#4f46e5" }}
                            />
                        </View>

                        {
                            localSettings.holidayModeEnabled && (
                                <View style={{ gap: 8 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                        <TouchableOpacity
                                            onPress={() => setShowStartDatePicker(true)}
                                            style={{ flex: 1, padding: 12, backgroundColor: isDarkMode ? '#334155' : '#f1f5f9', borderRadius: 8, alignItems: 'center' }}
                                        >
                                            <Text style={{ fontSize: 12, color: textSecondary, marginBottom: 2 }}>{t.startDate}</Text>
                                            <Text style={{ color: textPrimary, fontWeight: 'bold' }}>
                                                {localSettings.holidayStart ? new Date(localSettings.holidayStart).toLocaleDateString() : '未設定'}
                                            </Text>
                                        </TouchableOpacity>
                                        <Feather name="arrow-right" size={16} color={textSecondary} />
                                        <TouchableOpacity
                                            onPress={() => setShowEndDatePicker(true)}
                                            style={{ flex: 1, padding: 12, backgroundColor: isDarkMode ? '#334155' : '#f1f5f9', borderRadius: 8, alignItems: 'center' }}
                                        >
                                            <Text style={{ fontSize: 12, color: textSecondary, marginBottom: 2 }}>{t.endDate}</Text>
                                            <Text style={{ color: textPrimary, fontWeight: 'bold' }}>
                                                {localSettings.holidayEnd ? new Date(localSettings.holidayEnd).toLocaleDateString() : '未設定'}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>

                                    {showStartDatePicker && (
                                        <DateTimePicker
                                            testID="startDatePicker"
                                            value={localSettings.holidayStart ? new Date(localSettings.holidayStart) : new Date()}
                                            mode="date"
                                            display="default"
                                            onChange={(event, date) => {
                                                setShowStartDatePicker(false);
                                                if (date) {
                                                    const currentEnd = localSettings.holidayEnd ? new Date(localSettings.holidayEnd) : new Date();
                                                    const newStart = date.toISOString();
                                                    const newEnd = (date > currentEnd ? date : currentEnd).toISOString();
                                                    const next = { ...localSettings, holidayStart: newStart, holidayEnd: newEnd };
                                                    setLocalSettings(next);
                                                    onSave(next);
                                                }
                                            }}
                                        />
                                    )}
                                    {showEndDatePicker && (
                                        <DateTimePicker
                                            testID="endDatePicker"
                                            value={localSettings.holidayEnd ? new Date(localSettings.holidayEnd) : new Date()}
                                            mode="date"
                                            display="default"
                                            onChange={(event, date) => {
                                                setShowEndDatePicker(false);
                                                if (date) {
                                                    const currentStart = localSettings.holidayStart ? new Date(localSettings.holidayStart) : new Date();
                                                    const newEnd = date.toISOString();
                                                    const newStart = (date < currentStart ? date : currentStart).toISOString();
                                                    const next = { ...localSettings, holidayStart: newStart, holidayEnd: newEnd };
                                                    setLocalSettings(next);
                                                    onSave(next);
                                                }
                                            }}
                                        />
                                    )}
                                    {(localSettings.holidayStart || localSettings.holidayEnd) && (
                                        <TouchableOpacity
                                            style={{ marginTop: 12, alignSelf: 'flex-end' }}
                                            onPress={() => {
                                                Alert.alert(
                                                    "設定を解除",
                                                    "長期休暇の設定を解除しますか？",
                                                    [
                                                        { text: "キャンセル", style: "cancel" },
                                                        {
                                                            text: "解除する",
                                                            style: "destructive",
                                                            onPress: () => {
                                                                const next = { ...localSettings, holidayStart: null, holidayEnd: null };
                                                                setLocalSettings(next);
                                                                onSave(next);
                                                            }
                                                        }
                                                    ]
                                                );
                                            }}
                                        >
                                            <Text style={{ color: '#ef4444', fontSize: 13 }}>{t.clearSettings}</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            )
                        }
                    </View>

                    <View style={[styles.row, { borderBottomColor: borderColor }]}>
                        <Text style={[styles.label, { color: textPrimary }]}>最初の授業 (分前)</Text>
                        <TextInput
                            style={[styles.input, { color: textPrimary }]}
                            value={(localSettings.notificationFirstClassMinutes ?? 10).toString()}
                            onChangeText={(val) => updateSetting('notificationFirstClassMinutes', parseInt(val) || 0)}
                            placeholder="10"
                            placeholderTextColor={textSecondary}
                            keyboardType="numeric"
                        />
                    </View>
                    <View style={[styles.row, { borderBottomColor: borderColor }]}>
                        <Text style={[styles.label, { color: textPrimary }]}>その他の授業 (分前)</Text>
                        <TextInput
                            style={[styles.input, { color: textPrimary }]}
                            value={(localSettings.notificationOtherClassMinutes ?? 10).toString()}
                            onChangeText={(val) => updateSetting('notificationOtherClassMinutes', parseInt(val) || 0)}
                            placeholder="10"
                            placeholderTextColor={textSecondary}
                            keyboardType="numeric"
                        />
                    </View>
                    <View style={[styles.row, { borderBottomWidth: 0, justifyContent: 'center', paddingVertical: 16 }]}>
                        <TouchableOpacity
                            style={{
                                flexDirection: 'row', alignItems: 'center', gap: 8,
                                backgroundColor: isDarkMode ? 'rgba(79, 70, 229, 0.2)' : '#e0e7ff',
                                paddingHorizontal: 16, paddingVertical: 10, borderRadius: 24
                            }}
                            onPress={async () => {
                                await sendTestNotification();
                                Alert.alert(t.testNotificationDone, t.testNotificationMessage);
                            }}
                        >
                            <Feather name="send" size={16} color="#4f46e5" />
                            <Text style={{ color: '#4f46e5', fontWeight: 'bold', fontSize: 14 }}>{t.sendTestNotification}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            {/* Data Sharing */}
            <View style={styles.sectionContainer}>
                {renderSectionHeader(t.dataSharing, "share-2")}
                <View style={[styles.card, { backgroundColor: sectionBg }]}>
                    <TouchableOpacity
                        style={[styles.row, { borderBottomColor: borderColor }]}
                        onPress={onOpenShare}
                    >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                            <View style={[styles.colorCircle, { width: 36, height: 36, borderRadius: 18, backgroundColor: isDarkMode ? '#334155' : '#f1f5f9', borderWidth: 0 }]}>
                                <Feather name="share" size={18} color={isDarkMode ? '#94a3b8' : '#64748b'} />
                            </View>
                            <View>
                                <Text style={[styles.label, { color: textPrimary }]}>{t.shareTimetable}</Text>
                                <Text style={{ fontSize: 11, color: textSecondary }}>{t.shareQrDescription}</Text>
                            </View>
                        </View>
                        <Feather name="chevron-right" size={16} color={textSecondary} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.row, { borderBottomColor: borderColor }]}
                        onPress={onOpenFriendsList}
                    >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                            <View style={[styles.colorCircle, { width: 36, height: 36, borderRadius: 18, backgroundColor: isDarkMode ? '#334155' : '#f1f5f9', borderWidth: 0 }]}>
                                <Feather name="users" size={18} color={isDarkMode ? '#94a3b8' : '#64748b'} />
                            </View>
                            <View>
                                <Text style={[styles.label, { color: textPrimary }]}>{t.friendsTimetable}</Text>
                                <Text style={{ fontSize: 11, color: textSecondary }}>{t.friendsTimetableDescription}</Text>
                            </View>
                        </View>
                        <Feather name="chevron-right" size={16} color={textSecondary} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.row, { borderBottomColor: borderColor }]}
                        onPress={onOpenImport}
                    >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                            <View style={[styles.colorCircle, { width: 36, height: 36, borderRadius: 18, backgroundColor: isDarkMode ? '#334155' : '#f1f5f9', borderWidth: 0 }]}>
                                <Feather name="download" size={18} color={isDarkMode ? '#94a3b8' : '#64748b'} />
                            </View>
                            <View>
                                <Text style={[styles.label, { color: textPrimary }]}>{t.importTimetable}</Text>
                                <Text style={{ fontSize: 11, color: textSecondary }}>{t.importDescription}</Text>
                            </View>
                        </View>
                        <Feather name="chevron-right" size={16} color={textSecondary} />
                    </TouchableOpacity>

                    <View style={[styles.row, { borderBottomWidth: 0 }]}>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.label, { color: textPrimary }]}>{t.swipeNavigation}</Text>
                            <Text style={{ fontSize: 11, color: textSecondary, marginTop: 2 }}>
                                {t.swipeNavigationDescription}
                            </Text>
                        </View>
                        <Switch
                            value={localSettings.enableSwipeNavigation ?? true}
                            onValueChange={(value) => updateSetting('enableSwipeNavigation', value)}
                            trackColor={{ false: "#767577", true: "#4f46e5" }}
                        />
                    </View>
                </View>
            </View>

            {/* Appearance */}
            <View style={styles.sectionContainer}>
                {renderSectionHeader(t.appearance, "image")}
                <View style={[styles.card, { backgroundColor: sectionBg }]}>
                    <View style={[styles.row, { borderBottomColor: borderColor, borderBottomWidth: 0, paddingBottom: 4 }]}>
                        <Text style={[styles.label, { color: textPrimary }]}>{t.backgroundImage}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                            {localSettings.backgroundImage && (
                                <TouchableOpacity onPress={() => {
                                    Alert.alert(
                                        t.backgroundImageDelete,
                                        "",
                                        [
                                            { text: t.cancel, style: "cancel" },
                                            {
                                                text: t.delete,
                                                style: "destructive",
                                                onPress: () => {
                                                    updateSetting('backgroundImage', null);
                                                    Alert.alert(t.done, t.imageDeleteDone);
                                                }
                                            }
                                        ]
                                    );
                                }}>
                                    <Feather name="trash-2" size={18} color="#ef4444" />
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity onPress={pickBackgroundImage}>
                                <Text style={{ color: '#4f46e5', fontWeight: '600' }}>{localSettings.backgroundImage ? t.change : t.select}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                    <View style={{ paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: borderColor }}>
                        <Text style={{ fontSize: 11, color: textSecondary }}>
                            {t.backgroundImageDescription}
                        </Text>
                    </View>

                    {/* Theme Colors */}
                    <View style={[styles.row, { flexDirection: 'column', alignItems: 'flex-start', borderBottomWidth: 0, paddingTop: 16, paddingBottom: 8, paddingHorizontal: 0 }]}>
                        <Text style={[styles.label, { color: textPrimary, marginBottom: 16, paddingHorizontal: 16 }]}>{t.backgroundTheme}</Text>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={{ paddingHorizontal: 16, gap: 12, paddingBottom: 8 }}
                        >
                            {THEME_PRESETS.map((theme) => {
                                const gradient = isDarkMode ? theme.darkGradient : theme.lightGradient;
                                const bgColor = isDarkMode ? theme.dark : theme.light;
                                const isSelected = localSettings.tableBackgroundColor === theme.id;

                                return (
                                    <View key={theme.id} style={{ alignItems: 'center', width: 68 }}>
                                        <TouchableOpacity
                                            style={[
                                                styles.colorCircle,
                                                { width: 56, height: 56, borderRadius: 28 },
                                                !gradient && { backgroundColor: bgColor },
                                                isSelected && { borderColor: '#4f46e5', borderWidth: 2.5 }
                                            ]}
                                            onPress={() => {
                                                if (theme.isPremiumOnly && !isPremium) {
                                                    Alert.alert(t.premiumFunction, t.premiumThemeOnly);
                                                    return;
                                                }
                                                updateSetting('tableBackgroundColor', theme.id);
                                            }}
                                        >
                                            {gradient && (
                                                <LinearGradient
                                                    colors={gradient}
                                                    style={[StyleSheet.absoluteFill, { borderRadius: 26 }]}
                                                />
                                            )}
                                            {isSelected && (
                                                <View style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center' }]}>
                                                    <View style={{ backgroundColor: 'rgba(79, 70, 229, 0.2)', padding: 4, borderRadius: 12 }}>
                                                        <Feather name="check" size={20} color={isDarkMode ? "white" : "#4f46e5"} />
                                                    </View>
                                                </View>
                                            )}
                                            {theme.isPremiumOnly && !isPremium && (
                                                <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 26, justifyContent: 'center', alignItems: 'center' }]}>
                                                    <Feather name="lock" size={16} color="white" />
                                                </View>
                                            )}
                                        </TouchableOpacity>
                                        <Text
                                            numberOfLines={1}
                                            style={{
                                                marginTop: 6,
                                                fontSize: 10,
                                                fontWeight: isSelected ? '700' : '500',
                                                color: isSelected ? '#4f46e5' : textSecondary,
                                                textAlign: 'center',
                                                width: '100%'
                                            }}
                                        >
                                            {theme.label}
                                        </Text>
                                    </View>
                                );
                            })}
                        </ScrollView>
                    </View>
                </View >
            </View >

            {/* Font Settings */}
            < View style={styles.sectionContainer} >
                {renderSectionHeader(t.fonts, "type")}
                < View style={[styles.card, { backgroundColor: sectionBg, padding: 16 }]} >
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                        {FONT_OPTIONS.map((f) => {
                            const isSelected = localSettings.fontFamily === f.value || (!localSettings.fontFamily && f.value === 'System');
                            return (
                                <TouchableOpacity
                                    key={f.value}
                                    onPress={() => {
                                        // casting 'any' here as we added isPremiumOnly to the underlying type but the mapping here might be generic
                                        if ((f as any).isPremiumOnly && !isPremium) {
                                            Alert.alert(t.premiumFunction, t.premiumFontOnly);
                                            return;
                                        }
                                        updateSetting('fontFamily', f.value);
                                    }}
                                    style={{
                                        paddingHorizontal: 12,
                                        paddingVertical: 8,
                                        backgroundColor: isSelected ? '#4f46e5' : (isDarkMode ? '#334155' : '#f1f5f9'),
                                        borderRadius: 8,
                                        borderWidth: 1,
                                        borderColor: isSelected ? '#4f46e5' : 'transparent',
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        gap: 4
                                    }}
                                >
                                    <ThemedText
                                        numberOfLines={1}
                                        style={{
                                            color: isSelected ? 'white' : (isDarkMode ? '#e2e8f0' : '#1e293b'),
                                            fontSize: 13,
                                            fontWeight: isSelected ? '600' : '400',
                                            fontFamily: f.value === 'System' ? undefined : f.value
                                        }}
                                    >
                                        {f.label}
                                    </ThemedText>
                                    {(f as any).isPremiumOnly && !isPremium && (
                                        <Feather name="lock" size={10} color={isDarkMode ? '#94a3b8' : '#64748b'} />
                                    )}
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View >
            </View >






            {/* Support & Legal */}
            < View style={styles.sectionContainer} >
                {renderSectionHeader(t.legal, "info")}
                < View style={[styles.card, { backgroundColor: sectionBg }]} >
                    <TouchableOpacity
                        style={[styles.row, { borderBottomWidth: 0 }]}
                        onPress={() => openLink('https://soux369.github.io/mirainozikanwari/privacy.html')}
                        onLongPress={async () => {
                            try {
                                const { MobileAds } = require('react-native-google-mobile-ads');
                                await MobileAds().openAdInspector();
                            } catch (e) {
                                Alert.alert("Debug", "Ad Inspector not available: " + e);
                            }
                        }}
                        delayLongPress={2000}
                    >
                        <ThemedText style={[styles.label, { color: textPrimary }]}>{t.privacyPolicy}</ThemedText>
                        <Feather name="external-link" size={16} color={textSecondary} />
                    </TouchableOpacity>
                </View >
            </View >

            {/* Danger Zone */}
            < View style={[styles.sectionContainer, { marginTop: 20 }]} >
                <TouchableOpacity
                    style={[styles.card, {
                        backgroundColor: isDarkMode ? 'rgba(239, 68, 68, 0.1)' : '#fee2e2',
                        alignItems: 'center', paddingVertical: 14, flexDirection: 'row', justifyContent: 'center', gap: 8
                    }]}
                    onPress={handleClearCourses}
                >
                    <Feather name="trash-2" size={18} color="#ef4444" />
                    <Text style={{ color: '#ef4444', fontWeight: 'bold', fontSize: 16 }}>{t.deleteAllData}</Text>
                </TouchableOpacity>
            </View >

            <TermSelectionModal
                visible={isTermModalVisible}
                currentTermId={currentTerm}
                settings={settings}
                onSelect={onTermChange}
                onClose={() => setIsTermModalVisible(false)}
                isDarkMode={isDarkMode}
                terms={terms}
                onAddTerm={onAddTerm}
                onDeleteTerm={onDeleteTerm}
            />

            <Modal
                visible={showDurationModal}
                transparent
                animationType="slide"
                onRequestClose={() => setShowDurationModal(false)}
            >
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 }}>
                    <View style={{ backgroundColor: sectionBg, borderRadius: 16, padding: 20, maxHeight: '80%' }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <Text style={{ fontSize: 18, fontWeight: 'bold', color: textPrimary }}>{t.customPeriodSettings}</Text>
                            <TouchableOpacity onPress={() => setShowDurationModal(false)}>
                                <Feather name="x" size={24} color={textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <View style={{ marginBottom: 16 }}>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                                <TouchableOpacity
                                    style={[
                                        styles.dayChip,
                                        { backgroundColor: durationDay === null ? '#4f46e5' : (isDarkMode ? '#334155' : '#f1f5f9') }
                                    ]}
                                    onPress={() => setDurationDay(null)}
                                >
                                    <Text style={{ color: durationDay === null ? 'white' : textSecondary, fontWeight: 'bold' }}>{t.common}</Text>
                                </TouchableOpacity>
                                {DAYS.map(day => (
                                    <TouchableOpacity
                                        key={day}
                                        style={[
                                            styles.dayChip,
                                            { backgroundColor: durationDay === day ? '#4f46e5' : (isDarkMode ? '#334155' : '#f1f5f9') }
                                        ]}
                                        onPress={() => setDurationDay(day)}
                                    >
                                        <Text style={{ color: durationDay === day ? 'white' : textSecondary, fontWeight: 'bold' }}>{t[day]}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            <Text style={{ fontSize: 13, color: textSecondary, marginBottom: 16 }}>
                                {durationDay ? t.customPeriodDescriptionDay(t[durationDay as Day]) : t.customPeriodDescriptionCommon}
                            </Text>

                            {Array.from({ length: localSettings.maxPeriod }).map((_, i) => {
                                const p = i + 1;
                                const key = durationDay ? `${durationDay}-${p}` : `${p}`;
                                const customDuration = localSettings.customPeriodDurations?.[key];
                                const isCustom = customDuration !== undefined;

                                // Display logic
                                let displayValue = localSettings.periodDuration;
                                if (isCustom) {
                                    displayValue = customDuration;
                                } else if (durationDay) {
                                    const globalCustom = localSettings.customPeriodDurations?.[`${p}`];
                                    if (globalCustom !== undefined) displayValue = globalCustom;
                                }

                                return (
                                    <View key={key} style={[styles.row, { borderBottomColor: borderColor }]}>
                                        <Text style={[styles.label, { color: textPrimary }]}>{p}限</Text>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                            <TextInput
                                                style={[
                                                    styles.input,
                                                    { color: isCustom ? '#4f46e5' : textSecondary, fontWeight: isCustom ? 'bold' : 'normal' },
                                                    { backgroundColor: isDarkMode ? '#1e293b' : '#f1f5f9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }
                                                ]}
                                                value={displayValue.toString()}
                                                onChangeText={(val) => {
                                                    const num = parseInt(val);
                                                    const newMap = { ...(localSettings.customPeriodDurations || {}) };
                                                    if (isNaN(num)) {
                                                        // ignore
                                                    } else {
                                                        newMap[key] = num;
                                                        updateSetting('customPeriodDurations', newMap);
                                                    }
                                                }}
                                                placeholder={localSettings.periodDuration.toString()}
                                                placeholderTextColor={textSecondary}
                                                keyboardType="numeric"
                                            />
                                            <Text style={{ color: textSecondary }}>{t.minutes}</Text>

                                            {isCustom && (
                                                <TouchableOpacity
                                                    onPress={() => {
                                                        const newMap = { ...localSettings.customPeriodDurations };
                                                        delete newMap[key];
                                                        updateSetting('customPeriodDurations', newMap);
                                                    }}
                                                    style={{ marginLeft: 4 }}
                                                >
                                                    <Feather name="rotate-ccw" size={16} color={textSecondary} />
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                    </View>
                                );
                            })}
                        </ScrollView>
                        <TouchableOpacity
                            style={{ backgroundColor: '#4f46e5', padding: 14, borderRadius: 12, alignItems: 'center', marginTop: 16 }}
                            onPress={() => {
                                Alert.alert(t.done, t.customPeriodDone);
                                setShowDurationModal(false);
                            }}
                        >
                            <Text style={{ color: 'white', fontWeight: 'bold' }}>{t.done}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>



            <View style={{ height: 40 }} />
        </ScrollView >
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
    },

    sectionContainer: {
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 8,
        paddingHorizontal: 4,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    card: {
        borderRadius: 12,
        overflow: 'hidden',
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    label: {
        fontSize: 16,
        fontWeight: '500',
    },
    valueText: {
        fontSize: 16,
    },
    rowRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    input: {
        fontSize: 16,
        textAlign: 'right',
        minWidth: 100,
    },
    periodSelector: {
        flexDirection: 'row',
        gap: 4,
    },
    periodChip: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.05)',
    },
    periodText: {
        fontSize: 14,
        fontWeight: '600',
    },
    daysGrid: {
        flexDirection: 'row',
        gap: 8,
        flexWrap: 'wrap',
    },
    dayChip: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        backgroundColor: 'rgba(0,0,0,0.05)',
        minWidth: 44,
        alignItems: 'center',
    },
    dayText: {
        fontWeight: '600',
        fontSize: 14,
    },
    colorCircle: {
        // width/height/radius handled inline by theme grid
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    stepperBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
    }
});
