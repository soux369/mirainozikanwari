import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, FlatList, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Term, Settings } from '../lib/types';
import { translations } from '../lib/i18n';

interface TermSelectionModalProps {
    visible: boolean;
    currentTermId: string;
    terms: Term[];
    onSelect: (termId: string) => void;
    onAddTerm: (label: string) => void;
    onDeleteTerm: (id: string) => void;
    onClose: () => void;
    isDarkMode?: boolean;
    settings: Settings;
}

export const TermSelectionModal: React.FC<TermSelectionModalProps> = ({
    visible,
    currentTermId,
    terms,
    onSelect,
    onAddTerm,
    onDeleteTerm,
    onClose,
    isDarkMode = false,
    settings
}) => {
    const t = translations[settings.language || 'ja'] as any;
    const [newTermLabel, setNewTermLabel] = useState('');

    const bg = isDarkMode ? '#1e293b' : 'white';
    const text = isDarkMode ? '#f8fafc' : '#1e293b';
    const subText = isDarkMode ? '#94a3b8' : '#64748b';
    const itemBg = isDarkMode ? '#334155' : '#f8fafc';
    const inputBg = isDarkMode ? '#0f172a' : '#f1f5f9';

    const handleAdd = () => {
        if (!newTermLabel.trim()) return;
        onAddTerm(newTermLabel.trim());
        setNewTermLabel('');
    };

    const handleDelete = (id: string) => {
        if (terms.length <= 1) {
            Alert.alert(t.cannotDeleteTerm, t.atLeastOneTermRequired);
            return;
        }
        if (id === currentTermId) {
            Alert.alert(t.cannotDeleteTerm, t.cannotDeleteActiveTerm);
            return;
        }

        Alert.alert(
            t.deleteTermTitle,
            t.deleteTermConfirm,
            [
                { text: t.cancel, style: "cancel" },
                {
                    text: t.delete,
                    style: "destructive",
                    onPress: () => onDeleteTerm(id)
                }
            ]
        );
    };

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.overlay}
            >
                <TouchableOpacity
                    style={StyleSheet.absoluteFill}
                    activeOpacity={1}
                    onPress={onClose}
                />

                <View style={[styles.container, { backgroundColor: bg }]}>
                    <Text style={[styles.title, { color: text }]}>{t.termSelectAdd}</Text>

                    {/* Add New Term */}
                    <View style={styles.addSection}>
                        <TextInput
                            style={[styles.input, { backgroundColor: inputBg, color: text }]}
                            placeholder={t.newTermPlaceholder}
                            placeholderTextColor={subText}
                            value={newTermLabel}
                            onChangeText={setNewTermLabel}
                        />
                        <TouchableOpacity
                            style={[styles.addButton, { backgroundColor: '#4f46e5', opacity: newTermLabel.trim() ? 1 : 0.5 }]}
                            onPress={handleAdd}
                            disabled={!newTermLabel.trim()}
                        >
                            <Feather name="plus" size={20} color="white" />
                        </TouchableOpacity>
                    </View>

                    <FlatList
                        data={terms}
                        keyExtractor={item => item.id}
                        contentContainerStyle={styles.list}
                        style={{ maxHeight: 400 }}
                        renderItem={({ item }) => {
                            const isSelected = item.id === currentTermId;
                            return (
                                <View
                                    style={[
                                        styles.itemContainer,
                                        { backgroundColor: itemBg },
                                        isSelected && { borderColor: '#4f46e5', borderWidth: 2 }
                                    ]}
                                >
                                    <TouchableOpacity
                                        style={styles.itemContent}
                                        onPress={() => {
                                            onSelect(item.id);
                                            onClose();
                                        }}
                                    >
                                        <Text style={[
                                            styles.itemText,
                                            { color: text },
                                            isSelected && { color: '#4f46e5', fontWeight: 'bold' }
                                        ]}>
                                            {item.label}
                                        </Text>
                                        {isSelected && <Feather name="check" size={20} color="#4f46e5" style={{ marginLeft: 8 }} />}
                                    </TouchableOpacity>

                                    {!isSelected && (
                                        <TouchableOpacity
                                            style={styles.deleteButton}
                                            onPress={() => handleDelete(item.id)}
                                        >
                                            <Feather name="trash-2" size={18} color="#ef4444" />
                                        </TouchableOpacity>
                                    )}
                                </View>
                            );
                        }}
                    />

                    <TouchableOpacity onPress={onClose} style={{ alignSelf: 'center', marginTop: 16 }}>
                        <Text style={{ color: subText }}>{t.close}</Text>
                    </TouchableOpacity>
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
        padding: 20,
    },
    container: {
        width: '100%',
        maxWidth: 400,
        borderRadius: 20,
        padding: 24,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    addSection: {
        flexDirection: 'row',
        marginBottom: 20,
        gap: 8,
    },
    input: {
        flex: 1,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 14,
    },
    addButton: {
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    list: {
        gap: 10,
    },
    itemContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        overflow: 'hidden',
    },
    itemContent: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
    },
    itemText: {
        fontSize: 15,
    },
    deleteButton: {
        padding: 16,
        borderLeftWidth: 1,
        borderLeftColor: 'rgba(0,0,0,0.05)',
    },
});
