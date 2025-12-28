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
import * as Location from 'expo-location';
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
    onOpenFriendsList
}) => {
    const [localSettings, setLocalSettings] = useState<Settings>(settings);

    // Sync local state with props (critical for async storage loading)
    React.useEffect(() => {
        setLocalSettings(settings);
    }, [settings]);
    const [isTermModalVisible, setIsTermModalVisible] = useState(false);
    const [showStartDatePicker, setShowStartDatePicker] = useState(false);
    const [showEndDatePicker, setShowEndDatePicker] = useState(false);
    const [showDurationModal, setShowDurationModal] = useState(false);
    const [durationDay, setDurationDay] = useState<string | null>(null); // null = global, 'Mon' = Monday

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
            }
        } catch (e) {
            Alert.alert('Error', 'Failed to pick image');
        }
    };

    const handleClearCourses = () => {
        Alert.alert(
            t.deleteConfirmTitle,
            t.deleteConfirmMessage,
            [
                { text: t.cancel, style: "cancel" },
                { text: t.delete, style: "destructive", onPress: onClearCourses }
            ]
        );
    };

    const textPrimary = isDarkMode ? '#f8fafc' : '#1e293b';
    const textSecondary = isDarkMode ? '#94a3b8' : '#64748b';
    const sectionBg = isDarkMode ? '#1e293b' : '#ffffff';
    const pageBg = isDarkMode ? '#0f172a' : '#f1f5f9';
    const borderColor = isDarkMode ? '#334155' : '#e2e8f0';
    const sectionTitleColor = textSecondary;
    const cardBg = sectionBg;

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

                    {/* Visible Days */}
                    <View style={[styles.row, { flexDirection: 'column', alignItems: 'flex-start', borderBottomWidth: 0, paddingVertical: 16 }]}>
                        <ThemedText style={[styles.label, { color: textPrimary, marginBottom: 12 }]}>{t.visibleDays}</ThemedText>
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
                                    ]}>{DAY_LABELS[day]}</ThemedText>
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
                    {[
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
                    ))}

                    {/* Custom Period Durations Button */}
                    <TouchableOpacity
                        style={[styles.row, { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: borderColor, justifyContent: 'center', paddingVertical: 12 }]}
                        onPress={() => setShowDurationModal(true)}
                    >
                        <Text style={{ color: '#4f46e5', fontWeight: '600' }}>各時限の時間を個別に設定</Text>
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

                        {localSettings.holidayModeEnabled && (
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
                                                // Update manually to avoid race conditions or complex logic
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
                                            const next = { ...localSettings, holidayStart: null, holidayEnd: null };
                                            setLocalSettings(next);
                                            onSave(next);
                                        }}
                                    >
                                        <Text style={{ color: '#ef4444', fontSize: 13 }}>{t.clearSettings}</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        )}
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
                                alert(t.testNotificationDone, t.testNotificationMessage);
                            }}
                        >
                            <Feather name="send" size={16} color="#4f46e5" />
                            <Text style={{ color: '#4f46e5', fontWeight: 'bold', fontSize: 14 }}>{t.sendTestNotification}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View >

            {/* Data Sharing */}
            < View style={styles.sectionContainer} >
                {renderSectionHeader(t.dataSharing, "share-2")}
                < View style={[styles.card, { backgroundColor: sectionBg }]} >
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
                </View >
            </View >

            {/* Appearance */}
            < View style={styles.sectionContainer} >
                {renderSectionHeader(t.appearance, "image")}
                < View style={[styles.card, { backgroundColor: sectionBg }]} >
                    <View style={[styles.row, { borderBottomColor: borderColor, borderBottomWidth: 0, paddingBottom: 4 }]}>
                        <Text style={[styles.label, { color: textPrimary }]}>{t.backgroundImage}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                            {localSettings.backgroundImage && (
                                <TouchableOpacity onPress={() => updateSetting('backgroundImage', null)}>
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
                    <View style={[styles.row, { flexDirection: 'column', alignItems: 'flex-start', borderBottomWidth: 0, paddingVertical: 16 }]}>
                        <Text style={[styles.label, { color: textPrimary, marginBottom: 12 }]}>{t.backgroundTheme}</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
                            {THEME_PRESETS.map((theme) => {
                                const gradient = isDarkMode ? theme.darkGradient : theme.lightGradient;
                                const bgColor = isDarkMode ? theme.dark : theme.light;
                                const isSelected = localSettings.tableBackgroundColor === theme.id;

                                return (
                                    <TouchableOpacity
                                        key={theme.id}
                                        style={[
                                            styles.colorCircle,
                                            !gradient && { backgroundColor: bgColor },
                                            isSelected && { borderColor: '#4f46e5', borderWidth: 2 }
                                        ]}
                                        onPress={() => updateSetting('tableBackgroundColor', theme.id)}
                                    >
                                        {gradient && (
                                            <LinearGradient
                                                colors={gradient}
                                                style={[StyleSheet.absoluteFill, { borderRadius: 22 }]}
                                            />
                                        )}
                                        {isSelected && (
                                            <Feather name="check" size={16} color={isDarkMode ? "white" : "black"} />
                                        )}
                                    </TouchableOpacity>
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
                                    onPress={() => updateSetting('fontFamily', f.value)}
                                    style={{
                                        paddingHorizontal: 12,
                                        paddingVertical: 8,
                                        backgroundColor: isSelected ? '#4f46e5' : (isDarkMode ? '#334155' : '#f1f5f9'),
                                        borderRadius: 8,
                                        borderWidth: 1,
                                        borderColor: isSelected ? '#4f46e5' : 'transparent'
                                    }}
                                >
                                    <ThemedText style={{
                                        color: isSelected ? 'white' : (isDarkMode ? '#e2e8f0' : '#1e293b'),
                                        fontSize: 13,
                                        fontWeight: isSelected ? '600' : '400',
                                        fontFamily: f.value === 'System' ? undefined : f.value
                                    }}>
                                        {f.label}
                                    </ThemedText>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View >
            </View >



            {/* Beta Features */}
            < View style={styles.sectionContainer} >
                <View style={styles.sectionHeader}>
                    <Feather name="cpu" size={14} color={sectionTitleColor} />
                    <Text style={[styles.sectionTitle, { color: sectionTitleColor }]}>実験的機能 (Beta)</Text>
                </View>

                <View style={[styles.card, { backgroundColor: cardBg }]}>
                    {/* Disclaimer */}
                    <View style={{ padding: 16, backgroundColor: isDarkMode ? 'rgba(234, 179, 8, 0.1)' : '#fefce8', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: borderColor }}>
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                            <Feather name="alert-triangle" size={18} color="#eab308" style={{ marginTop: 2 }} />
                            <Text style={{ flex: 1, fontSize: 13, color: isDarkMode ? '#fef08a' : '#854d0e', lineHeight: 22 }}>
                                {t.betaDisclaimer}
                            </Text>
                        </View>
                    </View>

                    {/* Ad Inspector Button (Dev Only) */}
                    {__DEV__ && (
                        <View style={[styles.row, { borderBottomColor: borderColor }]}>
                            <View>
                                <Text style={[styles.label, { color: textPrimary }]}>{t.adDebug}</Text>
                                <Text style={{ fontSize: 12, color: textSecondary, marginTop: 2 }}>{t.adDebugDescription}</Text>
                            </View>
                            <TouchableOpacity
                                onPress={async () => {
                                    try {
                                        const { MobileAds } = require('react-native-google-mobile-ads');
                                        await MobileAds().openAdInspector();
                                    } catch (e) {
                                        Alert.alert("エラー", `AdMob SDKが利用できません\n詳細: ${e}`);
                                    }
                                }}
                                style={{ backgroundColor: '#e0e7ff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 }}
                            >
                                <Text style={{ color: '#4f46e5', fontSize: 12, fontWeight: 'bold' }}>開く</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Auto Attendance Toggle */}
                    <View style={[styles.row, { borderBottomColor: borderColor }]}>
                        <View>
                            <Text style={[styles.label, { color: textPrimary }]}>{t.autoAttendance}</Text>
                            <Text style={{ fontSize: 12, color: textSecondary, marginTop: 2 }}>{t.autoAttendanceDescription}</Text>
                        </View>
                        <Switch
                            value={localSettings.autoAttendanceEnabled}
                            onValueChange={async (val) => {
                                if (val) {
                                    // User wants to enable. Request permission first.
                                    const { status } = await Location.requestForegroundPermissionsAsync();
                                    if (status === 'granted') {
                                        updateSetting('autoAttendanceEnabled', true);
                                    } else {
                                        Alert.alert(
                                            t.locationPermissionReq,
                                            t.locationPermissionDesc,
                                            [{ text: t.ok }]
                                        );
                                        updateSetting('autoAttendanceEnabled', false);
                                    }
                                } else {
                                    updateSetting('autoAttendanceEnabled', false);
                                }
                            }}
                            trackColor={{ false: '#767577', true: '#818cf8' }}
                            thumbColor={localSettings.autoAttendanceEnabled ? '#4f46e5' : '#f4f3f4'}
                        />
                    </View>

                    {/* SSID Input */}
                    {localSettings.autoAttendanceEnabled && (
                        <View style={[styles.row, { borderBottomColor: borderColor, flexDirection: 'column', alignItems: 'stretch', gap: 8 }]}>
                            <Text style={[styles.label, { color: textPrimary, fontSize: 14 }]}>{t.schoolWifiSSID}</Text>
                            <TextInput
                                style={[styles.input, {
                                    textAlign: 'left',
                                    backgroundColor: isDarkMode ? '#1e293b' : '#f1f5f9',
                                    paddingHorizontal: 12,
                                    paddingVertical: 10,
                                    borderRadius: 8,
                                    color: textPrimary
                                }]}
                                placeholder="例: University_WiFi"
                                placeholderTextColor={textSecondary}
                                value={localSettings.schoolWifiSSID}
                                onChangeText={(val) => updateSetting('schoolWifiSSID', val)}
                                autoCapitalize="none"
                                autoCorrect={false}
                            />
                        </View>
                    )}
                </View>
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
                            <Text style={{ fontSize: 18, fontWeight: 'bold', color: textPrimary }}>授業時間の個別設定</Text>
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
                                    <Text style={{ color: durationDay === null ? 'white' : textSecondary, fontWeight: 'bold' }}>共通</Text>
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
                                        <Text style={{ color: durationDay === day ? 'white' : textSecondary, fontWeight: 'bold' }}>{DAY_LABELS[day]}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            <Text style={{ fontSize: 13, color: textSecondary, marginBottom: 16 }}>
                                {durationDay ? `${DAY_LABELS[durationDay as Day]}曜日の` : '共通の'}時限を個別に設定します。
                                {durationDay && ' (未設定の場合は共通設定が適用されます)'}
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
                                            <Text style={{ color: textSecondary }}>分</Text>

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
                            onPress={() => setShowDurationModal(false)}
                        >
                            <Text style={{ color: 'white', fontWeight: 'bold' }}>完了</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
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
        width: 44,
        height: 44,
        borderRadius: 22,
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
