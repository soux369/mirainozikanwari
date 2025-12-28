import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';

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
    const familyStyle = familyToUse && familyToUse !== 'System' ? { fontFamily: familyToUse } : {};

    return (
        <Text style={[style, familyStyle]} {...props} />
    );
};
