import React from 'react';
import { StyleSheet, View, ViewProps, Platform } from 'react-native';
import { BlurView } from 'expo-blur';

interface GlassViewProps extends ViewProps {
    intensity?: number;
    tint?: 'light' | 'dark' | 'default';
    borderRadius?: number;
}

export const GlassView: React.FC<GlassViewProps> = ({
    children,
    style,
    intensity = 50,
    tint = 'light',
    borderRadius = 16,
    ...props
}) => {
    return (
        <View style={[styles.container, { borderRadius }, style]} {...props}>
            <BlurView intensity={intensity} tint={tint} style={StyleSheet.absoluteFill} />
            <View style={[styles.content]}>
                {children}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        overflow: 'hidden',
        backgroundColor: Platform.OS === 'ios' ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.8)', // Android fallback
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.4)',
    },
    content: {
        zIndex: 1,
    },
});
