import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';

interface AssignmentData {
    id: string;
    title: string;
    deadline?: string;
    courseName: string;
    daysRemaining: number;
}

interface WidgetProps {
    assignments: AssignmentData[];
    lastUpdated: string;
}

export function CountdownWidget({ assignments = [], lastUpdated = '' }: WidgetProps) {
    return (
        <FlexWidget
            style={{
                height: 'match_parent',
                width: 'match_parent',
                backgroundColor: '#ffffff',
                padding: 12,
                flexDirection: 'column',
                justifyContent: 'flex-start',
                borderRadius: 16,
            }}
        >
            <FlexWidget style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8, alignItems: 'center' }}>
                <TextWidget
                    text="課題カウントダウン"
                    style={{
                        fontSize: 16,
                        fontWeight: 'bold',
                        color: '#4f46e5',
                    }}
                />
                <TextWidget text={lastUpdated} style={{ fontSize: 10, color: '#94a3b8' }} />
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
                        text="期限の近い課題はありません"
                        style={{ fontSize: 14, color: '#64748b' }}
                    />
                    <TextWidget
                        text="🎉"
                        style={{ fontSize: 24, marginTop: 8 }}
                    />
                </FlexWidget>
            ) : (
                assignments.slice(0, 4).map((item, index) => (
                    <FlexWidget
                        key={item.id}
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            marginBottom: 6,
                            backgroundColor: item.daysRemaining <= 3 ? '#fef2f2' : '#f8fafc',
                            borderRadius: 8,
                            padding: 8,
                            borderWidth: 1,
                            borderColor: item.daysRemaining <= 3 ? '#fecaca' : '#e2e8f0',
                        }}
                    >
                        <FlexWidget style={{ flexDirection: 'column', flex: 1, marginRight: 8 }}>
                            <TextWidget
                                text={item.title}
                                style={{
                                    fontSize: 14,
                                    fontWeight: 'bold',
                                    color: '#1e293b',
                                }}
                                maxLines={1}
                            />
                            <TextWidget
                                text={item.courseName}
                                style={{
                                    fontSize: 10,
                                    color: '#64748b',
                                }}
                                maxLines={1}
                            />
                        </FlexWidget>

                        <FlexWidget
                            style={{
                                backgroundColor: item.daysRemaining <= 1 ? '#ef4444' : (item.daysRemaining <= 3 ? '#f59e0b' : '#3b82f6'),
                                borderRadius: 12,
                                paddingHorizontal: 8,
                                paddingVertical: 4,
                            }}
                        >
                            <TextWidget
                                text={`あと${item.daysRemaining}日`}
                                style={{
                                    fontSize: 12,
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
