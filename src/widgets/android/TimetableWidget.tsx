import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';
import { Course } from '../../lib/types';

interface WidgetProps {
    courses: Course[];
    dateString: string; // e.g., "12/22 (Mon)"
    widgetSize?: 'small' | 'medium';
}

export function TimetableWidget({ courses = [], dateString = '', widgetSize = 'medium' }: WidgetProps) {
    const isSmall = widgetSize === 'small';
    const totalHeight = isSmall ? 160 : 180; // Approximate available height in dp
    const headerHeight = isSmall ? 32 : 40;
    const padding = isSmall ? 8 : 12;
    const availableContentHeight = totalHeight - headerHeight - (padding * 2);

    const itemCount = courses.length;
    // Calculate optimal item height
    // Standard comfortable height: ~40dp
    // Min height: ~24dp
    let itemHeight = 40;

    if (itemCount > 0) {
        itemHeight = Math.min(40, Math.max(22, availableContentHeight / itemCount));
    }

    // Dynamic Font Sizes based on itemHeight
    const periodFontSize = Math.min(14, Math.max(10, itemHeight * 0.4));
    const titleFontSize = Math.min(14, Math.max(10, itemHeight * 0.45));
    const roomFontSize = Math.min(11, Math.max(9, itemHeight * 0.35));
    const itemPadding = Math.min(8, itemHeight * 0.15);

    // Is it too cramped?
    const isCondensed = itemHeight < 30;

    return (
        <FlexWidget
            style={{
                height: 'match_parent',
                width: 'match_parent',
                backgroundColor: '#ffffff',
                padding: padding,
                flexDirection: 'column',
                justifyContent: 'flex-start',
                borderRadius: 16, // Rounded like iOS
            }}
        >
            {/* Header */}
            <FlexWidget style={{ height: headerHeight, justifyContent: 'center', marginBottom: 4 }}>
                <TextWidget
                    text={dateString}
                    style={{
                        fontSize: isSmall ? 13 : 15,
                        fontWeight: 'bold',
                        color: '#4f46e5',
                    }}
                />
            </FlexWidget>

            {/* List */}
            {courses.length === 0 ? (
                <FlexWidget
                    style={{
                        height: 'match_parent',
                        width: 'match_parent',
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}
                >
                    <TextWidget
                        text={isSmall ? "予定なし" : "今日の授業はありません"}
                        style={{ fontSize: 12, color: '#64748b' }}
                    />
                </FlexWidget>
            ) : (
                courses.map((course, index) => (
                    <FlexWidget
                        key={course.id}
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            marginBottom: Math.max(2, itemPadding),
                            backgroundColor: '#f8fafc', // Lighter background
                            borderRadius: 8,
                            paddingHorizontal: 6,
                            height: itemHeight,
                            width: 'match_parent'
                        }}
                    >
                        {/* Period Badge - Hide if too small and condensed */}
                        <FlexWidget
                            style={{
                                width: isCondensed ? 18 : 24,
                                height: isCondensed ? 18 : 24,
                                borderRadius: 12,
                                backgroundColor: isCondensed ? 'transparent' : '#e0e7ff',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginRight: 6,
                            }}
                        >
                            <TextWidget
                                text={`${course.period}`}
                                style={{
                                    fontSize: periodFontSize,
                                    fontWeight: 'bold',
                                    color: '#4f46e5',
                                }}
                            />
                        </FlexWidget>

                        {/* Content */}
                        <FlexWidget style={{ flexDirection: 'column', flex: 1, justifyContent: 'center' }}>
                            <TextWidget
                                text={course.name}
                                style={{
                                    fontSize: titleFontSize,
                                    fontWeight: 'bold',
                                    color: '#1e293b',
                                }}
                                maxLines={1}
                            />
                            {(!isCondensed || !isSmall) && (
                                <TextWidget
                                    text={course.room || '教室未定'}
                                    style={{
                                        fontSize: roomFontSize,
                                        color: '#64748b',
                                    }}
                                    maxLines={1}
                                />
                            )}
                        </FlexWidget>
                    </FlexWidget>
                ))
            )}
        </FlexWidget>
    );
}
