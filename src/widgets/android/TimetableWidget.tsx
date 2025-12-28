import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';
import { Course } from '../../lib/types';

interface WidgetProps {
    courses: Course[];
    dateString: string; // e.g., "12/22 (Mon)"
}

export function TimetableWidget({ courses = [], dateString = '' }: WidgetProps) {
    return (
        <FlexWidget
            style={{
                height: 'match_parent',
                width: 'match_parent',
                backgroundColor: '#ffffff',
                padding: 12,
                flexDirection: 'column',
                justifyContent: 'flex-start',
            }}
        >
            <TextWidget
                text={dateString}
                style={{
                    fontSize: 16,
                    fontWeight: 'bold',
                    color: '#4f46e5',
                    marginBottom: 8,
                }}
            />

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
                        text="授業はありません"
                        style={{ fontSize: 14, color: '#64748b' }}
                    />
                </FlexWidget>
            ) : (
                courses.map((course, index) => (
                    <FlexWidget
                        key={course.id}
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            marginBottom: 6,
                            backgroundColor: '#f1f5f9',
                            borderRadius: 8,
                            padding: 8,
                        }}
                    >
                        <FlexWidget
                            style={{
                                width: 30,
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginRight: 8,
                            }}
                        >
                            <TextWidget
                                text={`${course.period}`}
                                style={{
                                    fontSize: 14,
                                    fontWeight: 'bold',
                                    color: '#4f46e5',
                                }}
                            />
                        </FlexWidget>

                        <FlexWidget style={{ flexDirection: 'column', flex: 1 }}>
                            <TextWidget
                                text={course.name}
                                style={{
                                    fontSize: 14,
                                    fontWeight: 'bold',
                                    color: '#1e293b',
                                }}
                                maxLines={1}
                            />
                            <TextWidget
                                text={course.room || '教室未定'}
                                style={{
                                    fontSize: 12,
                                    color: '#64748b',
                                }}
                                maxLines={1}
                            />
                        </FlexWidget>
                    </FlexWidget>
                ))
            )}
        </FlexWidget>
    );
}
