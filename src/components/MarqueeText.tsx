import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, ScrollView, StyleSheet, Text, View, TextStyle, ViewStyle } from 'react-native';

interface MarqueeTextProps {
    text: string;
    style?: TextStyle;
    containerStyle?: ViewStyle;
    durationPerChar?: number; // Speed control
    delay?: number;
}

export const MarqueeText: React.FC<MarqueeTextProps> = ({
    text,
    style,
    containerStyle,
    durationPerChar = 100,
    delay = 2000
}) => {
    const [containerWidth, setContainerWidth] = useState(0);
    const [textWidth, setTextWidth] = useState(0);
    const scrollX = useRef(new Animated.Value(0)).current;
    const animationRef = useRef<Animated.CompositeAnimation | null>(null);

    useEffect(() => {
        // Reset animation when text or widths change
        scrollX.setValue(0);
        if (animationRef.current) {
            animationRef.current.stop();
        }

        if (textWidth > containerWidth && containerWidth > 0) {
            const distance = textWidth - containerWidth + 20; // Extra padding
            const duration = distance * durationPerChar;

            const startAnimation = () => {
                scrollX.setValue(0);
                animationRef.current = Animated.sequence([
                    Animated.delay(delay),
                    Animated.timing(scrollX, {
                        toValue: -distance,
                        duration: duration,
                        easing: Easing.linear,
                        useNativeDriver: true,
                    }),
                    Animated.delay(delay),
                ]);

                animationRef.current.start(({ finished }) => {
                    if (finished) {
                        startAnimation();
                    }
                });
            };

            startAnimation();
        }

        return () => {
            if (animationRef.current) {
                animationRef.current.stop();
            }
        };
    }, [text, containerWidth, textWidth]);

    return (
        <View
            style={[styles.container, containerStyle]}
            onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
        >
            <Animated.View
                style={{
                    flexDirection: 'row',
                    transform: [{ translateX: scrollX }],
                }}
            >
                <Text
                    style={style}
                    onLayout={(e) => setTextWidth(e.nativeEvent.layout.width)}
                    numberOfLines={1}
                >
                    {text}
                </Text>
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        overflow: 'hidden',
        width: '100%',
    },
});
