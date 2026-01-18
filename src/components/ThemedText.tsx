import React from 'react';
import { Text, TextProps, StyleSheet, Platform } from 'react-native';

import { useFont } from '../lib/FontContext';

interface ThemedTextProps extends TextProps {
    fontFamily?: string;
}

export const ThemedText: React.FC<ThemedTextProps> = ({ style, fontFamily: propFontFamily, ...props }) => {
    const { currentFont } = useFont();

    // Prop overrides context
    const familyToUse = propFontFamily || currentFont;

    // If "System", let RN handle it (pass undefined or empty). 
    // Otherwise pass the specific font name.
    // FIX: On Android, "System" often defaults to a CJK font that looks weird. Force Noto Sans JP if available.
    let finalFont = familyToUse;
    if ((!finalFont || finalFont === 'System') && Platform.OS === 'android') {
        finalFont = 'Noto Sans JP';
    }

    const familyStyle = finalFont && finalFont !== 'System' ? { fontFamily: finalFont } : {};

    const androidStyle: any = Platform.OS === 'android' ? { includeFontPadding: false, textAlignVertical: 'center' } : {};

    return (
        <Text style={[androidStyle, style, familyStyle]} {...props} />
    );
};
