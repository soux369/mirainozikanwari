import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';

interface AssignmentData {
    id: string;
    title: string;
    deadline?: string;
    courseName: string;
    daysRemaining: number;
    timeString?: string;
}

interface WidgetProps {
    assignments: AssignmentData[];
    lastUpdated: string;
    widgetSize?: 'small' | 'medium';
}

export function CountdownWidget({ assignments = [], lastUpdated = '', widgetSize = 'medium' }: WidgetProps) {
    const isSmall = widgetSize === 'small';
    const totalHeight = isSmall ? 160 : 180;
    const headerHeight = isSmall ? 28 : 32;
    const padding = isSmall ? 8 : 12;
    const availableContentHeight = totalHeight - headerHeight - (padding * 2);

    const itemCount = assignments.length;
    // Standard height ~44dp
    // Min height ~28dp
    let itemHeight = 44;
    if (itemCount > 0) {
        itemHeight = Math.min(44, Math.max(28, availableContentHeight / itemCount));
    }

    const titleFontSize = Math.min(13, Math.max(10, itemHeight * 0.35));
    const subFontSize = Math.min(11, Math.max(9, itemHeight * 0.3));
    const badgeFontSize = Math.min(12, Math.max(9, itemHeight * 0.3));
    const itemPadding = Math.min(8, itemHeight * 0.15);

    const isCondensed = itemHeight < 34;

    return (
        <FlexWidget
            style={{
                height: 'match_parent',
                width: 'match_parent',
                backgroundColor: '#ffffff',
                padding: padding,
                flexDirection: 'column',
                justifyContent: 'flex-start',
                borderRadius: 16,
            }}
        >
            <FlexWidget style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4, alignItems: 'center', height: headerHeight }}>
                <TextWidget
                    text="課題"
                    style={{
                        fontSize: isSmall ? 13 : 15,
                        fontWeight: 'bold',
                        color: '#4f46e5',
                    }}
                />
                {!isSmall && <TextWidget text={lastUpdated} style={{ fontSize: 9, color: '#94a3b8' }} />}
            </FlexWidget>

            {assignments.length === 0 ? (
                <FlexWidget
                    style={{
                        height: 'match_parent',
                        width: 'match_parent',
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}
                >
                    <TextWidget
                        text="課題なし"
                        style={{ fontSize: 12, color: '#64748b' }}
                    />
                    <TextWidget
                        text="🎉"
                        style={{ fontSize: 20, marginTop: 4 }}
                    />
                </FlexWidget>
            ) : (
                assignments.map((item, index) => (
                    <FlexWidget
                        key={item.id}
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            marginBottom: Math.max(2, itemPadding),
                            backgroundColor: item.daysRemaining <= 3 ? '#fef2f2' : '#f8fafc',
                            borderRadius: 8,
                            paddingHorizontal: 8,
                            paddingVertical: 0,
                            height: itemHeight,
                            borderWidth: 1,
                            borderColor: item.daysRemaining <= 3 ? '#fecaca' : '#e2e8f0',
                        }}
                    >
                        <FlexWidget style={{ flexDirection: 'column', flex: 1, marginRight: 4, justifyContent: 'center' }}>
                            <TextWidget
                                text={item.title}
                                style={{
                                    fontSize: titleFontSize,
                                    fontWeight: 'bold',
                                    color: '#1e293b',
                                }}
                                maxLines={1}
                            />
                            {(!isCondensed || !isSmall) && (
                                <TextWidget
                                    text={`${item.courseName}${item.timeString ? ` • ${item.timeString}まで` : ''}`}
                                    style={{
                                        fontSize: subFontSize,
                                        color: '#64748b',
                                    }}
                                    maxLines={1}
                                />
                            )}
                        </FlexWidget>

                        <FlexWidget
                            style={{
                                backgroundColor: item.daysRemaining <= 1 ? '#ef4444' : (item.daysRemaining <= 3 ? '#f59e0b' : '#3b82f6'),
                                borderRadius: 12,
                                paddingHorizontal: 6,
                                paddingVertical: 2,
                                justifyContent: 'center',
                                alignItems: 'center'
                            }}
                        >
                            <TextWidget
                                text={`あと${item.daysRemaining}日`}
                                style={{
                                    fontSize: badgeFontSize,
                                    color: '#ffffff',
                                    fontWeight: 'bold',
                                }}
                            />
                        </FlexWidget>
                    </FlexWidget>
                ))
            )}
        </FlexWidget>
    );
}
