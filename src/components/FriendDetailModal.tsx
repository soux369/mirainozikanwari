import React from 'react';
import { StyleSheet, View, Text, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Friend, Course, Settings } from '../lib/types';
import TimetableGrid from './TimetableGrid';
import { ThemedText } from './ThemedText';
import { translations } from '../lib/i18n';

interface FriendDetailModalProps {
    visible: boolean;
    friend: Friend | null;
    onClose: () => void;
    settings: Settings;
    isDarkMode?: boolean;
}

export const FriendDetailModal: React.FC<FriendDetailModalProps> = ({
    visible,
    friend,
    onClose,
    settings,
    isDarkMode = false,
}) => {
    if (!friend) return null;
    const t = translations[settings.language || 'ja'] as any;

    const bgBase = isDarkMode ? '#0f172a' : 'white';
    const textPrimary = isDarkMode ? '#f8fafc' : '#1e293b';

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <View style={[styles.container, { backgroundColor: bgBase }]}>
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={[styles.name, { color: textPrimary }]}>{t.friendTimetableTitle(friend.name)}</Text>
                        <Text style={{ fontSize: 12, color: isDarkMode ? '#94a3b8' : '#64748b' }}>
                            {t.classesCount(friend.courses.length)}
                        </Text>
                    </View>
                    <TouchableOpacity onPress={onClose} style={[styles.closeButton, { backgroundColor: isDarkMode ? '#334155' : '#f1f5f9' }]}>
                        <Feather name="x" size={24} color={textPrimary} />
                    </TouchableOpacity>
                </View>

                {/* Read-Only Grid */}
                <View style={{ flex: 1 }}>
                    <TimetableGrid
                        courses={friend.courses}
                        settings={settings}
                        onCourseClick={() => { }} // No Action for read-only
                        onEmptySlotClick={() => { }} // No Action
                        isDarkMode={isDarkMode}
                        readOnly
                    />
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
    },
    name: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    closeButton: {
        padding: 8,
        borderRadius: 20,
    }
});
