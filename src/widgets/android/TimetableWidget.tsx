import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';
import { Course } from '../../lib/types';

interface WidgetProps {
    courses: Course[];
    dateString: string; // e.g., "12/22 (Mon)"
    widgetSize?: 'small' | 'medium';
    isPremium?: boolean;
}

export function TimetableWidget({ courses = [], dateString = '', widgetSize = 'medium', isPremium = false }: WidgetProps) {
    const isSmall = widgetSize === 'small';
    const totalHeight = isSmall ? 160 : 180; // Approximate available height in dp
    const headerHeight = isSmall ? 32 : 40;
    const padding = isSmall ? 8 : 12;
    const availableContentHeight = totalHeight - headerHeight - (padding * 2);

    const itemCount = courses.length;
    let itemHeight = 40;

    if (itemCount > 0) {
        itemHeight = Math.min(40, Math.max(22, availableContentHeight / itemCount));
    }

    const periodFontSize = Math.min(14, Math.max(10, itemHeight * 0.4));
    const titleFontSize = Math.min(14, Math.max(10, itemHeight * 0.45));
    const roomFontSize = Math.min(11, Math.max(9, itemHeight * 0.35));
    const itemPadding = Math.min(8, itemHeight * 0.15);

    const isCondensed = itemHeight < 30;

    const premiumColor = '#9333ea';
    const standardColor = '#4f46e5';

    return (
        <FlexWidget
            style={{
                backgroundColor: '#ffffff',
                padding: padding,
                flexDirection: 'column',
                justifyContent: 'flex-start',
                borderRadius: 16,
                borderWidth: isPremium ? 2 : 0,
                borderColor: premiumColor,
            }}
        >
            {/* Header */}
            <FlexWidget style={{ height: headerHeight, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <TextWidget
                    text={dateString}
                    style={{
                        fontSize: isSmall ? 13 : 15,
                        fontWeight: 'bold',
                        color: isPremium ? premiumColor : standardColor,
                    }}
                />
                {isPremium && !isSmall && (
                    <TextWidget
                        text="PREMIUM"
                        style={{
                            fontSize: 10,
                            fontWeight: 'bold',
                            color: '#ffffff',
                            backgroundColor: premiumColor,
                            paddingHorizontal: 4,
                            paddingVertical: 1,
                            borderRadius: 4,
                        }}
                    />
                )}
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
                            backgroundColor: isPremium ? '#f5f3ff' : '#f8fafc',
                            borderRadius: 8,
                            paddingHorizontal: 6,
                            height: itemHeight,
                            width: 'match_parent'
                        }}
                    >
                        {/* Period Badge */}
                        <FlexWidget
                            style={{
                                width: isCondensed ? 18 : 24,
                                height: isCondensed ? 18 : 24,
                                borderRadius: 12,
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginRight: 6,
                                backgroundColor: isPremium ? premiumColor : '#e0e7ff',
                            }}
                        >
                            <TextWidget
                                text={`${course.period}`}
                                style={{
                                    fontSize: periodFontSize,
                                    fontWeight: 'bold',
                                    color: isPremium ? '#ffffff' : standardColor,
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
                                    color: isPremium ? '#4338ca' : '#1e293b',
                                }}
                                maxLines={1}
                            />
                            {(!isCondensed || !isSmall) && (
                                <TextWidget
                                    text={course.room || '教室未定'}
                                    style={{
                                        fontSize: roomFontSize,
                                        color: isPremium ? '#6366f1' : '#64748b',
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
