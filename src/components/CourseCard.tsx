import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Course } from '../lib/types';
import { ThemedText } from './ThemedText';

interface CourseCardProps {
    course: Course;
    onClick: (course: Course) => void;
}

const CourseCard: React.FC<CourseCardProps> = ({ course, onClick }) => {
    return (
        <TouchableOpacity
            style={[styles.card, { backgroundColor: course.color || '#e0f2fe', shadowColor: course.color || '#000' }]}
            onPress={() => onClick(course)}
            activeOpacity={0.8}
        >
            <View style={styles.content}>
                <ThemedText style={styles.courseName} numberOfLines={3} ellipsizeMode="tail">
                    {course.name}
                </ThemedText>

                {(course.room || course.code) && (
                    <View style={styles.footer}>
                        {course.room && (
                            <ThemedText style={styles.roomText}>{course.room}</ThemedText>
                        )}
                        {/* Optional: Show Code if room is missing, or both */}
                        {!course.room && course.code && (
                            <ThemedText style={styles.roomText}>{course.code}</ThemedText>
                        )}
                    </View>
                )}
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        flex: 1,
        borderRadius: 16,
        padding: 8,
        justifyContent: 'center',
        alignItems: 'center',
        // Slight shadow
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 2,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
    },
    courseName: {
        fontSize: 11,
        fontWeight: '700',
        color: '#1e293b',
        textAlign: 'center',
        marginBottom: 4,
        lineHeight: 14,
    },
    footer: {
        marginTop: 2,
    },
    roomText: {
        fontSize: 9,
        fontWeight: '800',
        color: 'rgba(30, 41, 59, 0.6)',
        textAlign: 'center',
    },
});

export default CourseCard;
