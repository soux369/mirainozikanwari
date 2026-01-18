import React, { useState } from 'react';
import { StyleSheet, View, Text, Modal, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { translations } from '../lib/i18n';
import { Settings } from '../lib/types';

interface FriendNameInputModalProps {
    visible: boolean;
    onClose: () => void;
    onSave: (name: string) => void;
    isDarkMode?: boolean;
    settings: Settings;
}

export const FriendNameInputModal: React.FC<FriendNameInputModalProps> = ({
    visible,
    onClose,
    onSave,
    isDarkMode = false,
    settings
}) => {
    const t = translations[settings.language || 'ja'] as any;
    const [name, setName] = useState('');

    const handleSave = () => {
        if (name.trim()) {
            onSave(name.trim());
            setName('');
        }
    };

    const bgBase = isDarkMode ? '#1e293b' : 'white';
    const textPrimary = isDarkMode ? '#f8fafc' : '#1e293b';
    const textSecondary = isDarkMode ? '#94a3b8' : '#64748b';
    const inputBg = isDarkMode ? '#334155' : '#f1f5f9';

    if (!visible) return null;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.overlay}
            >
                <View style={[styles.container, { backgroundColor: bgBase }]}>
                    <Text style={[styles.title, { color: textPrimary }]}>{t.friendNameTitle}</Text>
                    <Text style={[styles.subtitle, { color: textSecondary }]}>
                        {t.friendNameSubtitle}
                    </Text>

                    <TextInput
                        style={[styles.input, { backgroundColor: inputBg, color: textPrimary }]}
                        value={name}
                        onChangeText={setName}
                        placeholder={t.namePlaceholder}
                        placeholderTextColor={textSecondary}
                        autoFocus
                    />

                    <View style={styles.buttonRow}>
                        <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={onClose}>
                            <Text style={styles.cancelText}>{t.cancel}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.button, styles.saveButton]} onPress={handleSave}>
                            <Text style={styles.saveText}>{t.save}</Text>
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
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
    },
    container: {
        width: '100%',
        maxWidth: 320,
        borderRadius: 16,
        padding: 20,
        alignItems: 'center'
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 8
    },
    subtitle: {
        fontSize: 14,
        marginBottom: 20,
        textAlign: 'center'
    },
    input: {
        width: '100%',
        padding: 12,
        borderRadius: 8,
        marginBottom: 20,
        fontSize: 16
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 12,
        width: '100%'
    },
    button: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center'
    },
    cancelButton: {
        backgroundColor: 'transparent'
    },
    saveButton: {
        backgroundColor: '#4f46e5'
    },
    cancelText: {
        color: '#64748b',
        fontWeight: '600'
    },
    saveText: {
        color: 'white',
        fontWeight: 'bold'
    }
});
