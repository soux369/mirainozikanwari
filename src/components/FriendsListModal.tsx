import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Friend, Course } from '../lib/types';
import { ThemedText } from './ThemedText';
import { LinearGradient } from 'expo-linear-gradient';

interface FriendsListModalProps {
    visible: boolean;
    friends: Friend[];
    onClose: () => void;
    onSelectFriend: (friend: Friend) => void;
    onDeleteFriend: (id: string) => void;
    onAddFriend: () => void; // Trigger Import Flow
    isDarkMode?: boolean;
}

export const FriendsListModal: React.FC<FriendsListModalProps> = ({
    visible,
    friends,
    onClose,
    onSelectFriend,
    onDeleteFriend,
    onAddFriend,
    isDarkMode = false
}) => {
    const textPrimary = isDarkMode ? '#f8fafc' : '#1e293b';
    const textSecondary = isDarkMode ? '#94a3b8' : '#64748b';
    const bgBase = isDarkMode ? '#0f172a' : 'white';
    const cardBg = isDarkMode ? '#1e293b' : '#f8fafc';
    const borderColor = isDarkMode ? '#334155' : '#e2e8f0';

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <View style={[styles.container, { backgroundColor: bgBase }]}>
                {/* Header */}
                <View style={[styles.header, { borderBottomColor: borderColor }]}>
                    <Text style={[styles.headerTitle, { color: textPrimary }]}>友達の時間割</Text>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <Feather name="x" size={24} color={textSecondary} />
                    </TouchableOpacity>
                </View>

                <ScrollView contentContainerStyle={styles.content}>
                    {friends.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Feather name="users" size={48} color={textSecondary} />
                            <Text style={[styles.emptyTitle, { color: textPrimary }]}>友達がいません</Text>
                            <Text style={[styles.emptyText, { color: textSecondary }]}>
                                友達の時間割をQRコードや画像から読み込んで保存できます。
                            </Text>
                            <TouchableOpacity
                                style={styles.addButton}
                                onPress={onAddFriend}
                            >
                                <Feather name="plus" size={20} color="white" />
                                <Text style={styles.addButtonText}>友達を追加する</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={{ gap: 12 }}>
                            {friends.map(friend => (
                                <View
                                    key={friend.id}
                                    style={[styles.friendCard, { backgroundColor: cardBg, borderColor }]}
                                >
                                    <TouchableOpacity
                                        style={styles.cardContent}
                                        onPress={() => onSelectFriend(friend)}
                                    >
                                        <View style={[styles.avatar, { backgroundColor: isDarkMode ? '#334155' : '#e0e7ff' }]}>
                                            <Text style={{ fontSize: 18, color: '#4f46e5', fontWeight: 'bold' }}>
                                                {friend.name.charAt(0)}
                                            </Text>
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={[styles.friendName, { color: textPrimary }]}>{friend.name}</Text>
                                            <Text style={{ fontSize: 12, color: textSecondary }}>
                                                {friend.courses.length} 授業登録済み
                                            </Text>
                                        </View>
                                        <Feather name="chevron-right" size={20} color={textSecondary} />
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={styles.deleteButton}
                                        onPress={() => onDeleteFriend(friend.id)}
                                    >
                                        <Feather name="trash-2" size={18} color="#ef4444" />
                                    </TouchableOpacity>
                                </View>
                            ))}

                            <TouchableOpacity
                                style={[styles.addButton, { marginTop: 16 }]}
                                onPress={onAddFriend}
                            >
                                <Feather name="plus" size={20} color="white" />
                                <Text style={styles.addButtonText}>友達を追加する</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </ScrollView>
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
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: '600',
    },
    closeButton: {
        position: 'absolute',
        right: 16,
    },
    content: {
        padding: 20,
    },
    emptyState: {
        alignItems: 'center',
        marginTop: 60,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 16,
        marginBottom: 8,
    },
    emptyText: {
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 20,
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#4f46e5',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 24,
        gap: 8,
    },
    addButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    friendCard: {
        borderRadius: 12,
        borderWidth: 1,
        overflow: 'hidden',
        flexDirection: 'row',
        alignItems: 'center',
    },
    cardContent: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        gap: 12,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    friendName: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    deleteButton: {
        padding: 16,
        justifyContent: 'center',
        alignItems: 'center',
    }
});
