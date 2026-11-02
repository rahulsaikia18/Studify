import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useThemeStore } from '../../stores/themeStore';
import { ApiClient } from '../../services/api';
import { HapticsService } from '../../services/HapticsService';
import { AdBanner } from '../../components/AdBanner';

export default function AttendanceCalculatorScreen() {
  const queryClient = useQueryClient();
  const { colors, isDark } = useThemeStore();

  // Instant Calculator States
  const [totalClasses, setTotalClasses] = useState('');
  const [attendedClasses, setAttendedClasses] = useState('');
  const [targetPercentage, setTargetPercentage] = useState('75');

  // Add course modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCourseName, setNewCourseName] = useState('');
  const [newTotal, setNewTotal] = useState('0');
  const [newAttended, setNewAttended] = useState('0');
  const [newTarget, setNewTarget] = useState('75');

  const total = parseInt(totalClasses, 10) || 0;
  const attended = parseInt(attendedClasses, 10) || 0;
  const target = parseFloat(targetPercentage) || 75;

  // Instant Math Calculations
  const percentage = total > 0 ? parseFloat(((attended / total) * 100).toFixed(1)) : 100;
  const isOnTrack = percentage >= target;

  // Classes can miss consecutively: floor((100*Attended - Target*Total) / Target)
  const classesCanMiss = Math.max(0, Math.floor((100 * attended - target * total) / target));

  // Consecutive classes needed to reach target: ceil((Target*Total - 100*Attended) / (100 - Target))
  const classesNeeded = 100 - target > 0 ? Math.max(0, Math.ceil((target * total - 100 * attended) / (100 - target))) : 0;

  // Fetch Courses
  const { data: attendanceData } = useQuery({
    queryKey: ['attendance-courses'],
    queryFn: async () => {
      const res = await ApiClient.get('/attendance/courses');
      return res.data;
    },
  });

  const courses = attendanceData?.courses || [];

  const logMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return ApiClient.post(`/attendance/courses/${id}/log`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance-courses'] });
    },
  });

  const createCourseMutation = useMutation({
    mutationFn: async (payload: any) => {
      return ApiClient.post('/attendance/courses', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance-courses'] });
      setIsModalOpen(false);
      setNewCourseName('');
    },
  });

  const handleCreateCourse = () => {
    if (!newCourseName.trim()) {
      Alert.alert('Required', 'Please enter a course name.');
      return;
    }
    createCourseMutation.mutate({
      courseName: newCourseName,
      totalClasses: parseInt(newTotal, 10) || 0,
      attendedClasses: parseInt(newAttended, 10) || 0,
      targetPercentage: parseFloat(newTarget) || 75,
    });
  };

  return (
    <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={styles.scrollContent}>
      {/* Instant Calculator Card */}
      <View style={[styles.calcCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.calcHeader}>
          <Ionicons name="flash-outline" size={20} color="#2563EB" />
          <Text style={[styles.calcTitle, { color: colors.text }]}>Instant Bunk & Target Calculator</Text>
        </View>

        <View style={styles.inputsRow}>
          <View style={styles.inputCol}>
            <Text style={[styles.inputLabel, { color: colors.textMuted }]}>Attended</Text>
            <TextInput
              style={[styles.calcInput, { color: colors.text, borderColor: colors.border }]}
              keyboardType="numeric"
              value={attendedClasses}
              onChangeText={setAttendedClasses}
            />
          </View>

          <View style={styles.inputCol}>
            <Text style={[styles.inputLabel, { color: colors.textMuted }]}>Total Held</Text>
            <TextInput
              style={[styles.calcInput, { color: colors.text, borderColor: colors.border }]}
              keyboardType="numeric"
              value={totalClasses}
              onChangeText={setTotalClasses}
            />
          </View>

          <View style={styles.inputCol}>
            <Text style={[styles.inputLabel, { color: colors.textMuted }]}>Target %</Text>
            <TextInput
              style={[styles.calcInput, { color: colors.text, borderColor: colors.border }]}
              keyboardType="numeric"
              value={targetPercentage}
              onChangeText={setTargetPercentage}
            />
          </View>
        </View>

        {/* Live Calculation Output Result */}
        <View style={[styles.resultBanner, { backgroundColor: isOnTrack ? '#D1FAE5' : '#FEE2E2' }]}>
          <View style={styles.resultTop}>
            <Text style={[styles.currentPercent, { color: isOnTrack ? '#065F46' : '#991B1B' }]}>
              {percentage}%
            </Text>
            <View style={[styles.statusChip, { backgroundColor: isOnTrack ? '#10B981' : '#EF4444' }]}>
              <Text style={styles.statusText}>{isOnTrack ? 'ELIGIBLE' : 'SHORTAGE'}</Text>
            </View>
          </View>

          <Text style={[styles.verdictText, { color: isOnTrack ? '#065F46' : '#991B1B' }]}>
            {isOnTrack
              ? classesCanMiss > 0
                ? `🎉 You can safely bunk ${classesCanMiss} ${classesCanMiss === 1 ? 'class' : 'classes'} and stay above ${target}%.`
                : `⚡ You are exactly on track! Do not miss the next class.`
              : `⚠️ Attendance shortage! You must attend the next ${classesNeeded} ${classesNeeded === 1 ? 'class' : 'classes'} consecutively to reach ${target}%.`}
          </Text>
        </View>
      </View>

      {/* Course-Wise Attendance Tracker */}
      <View style={styles.coursesHeaderRow}>
        <Text style={[styles.sectionHeading, { color: colors.text }]}>Course-Wise Attendance</Text>
        <TouchableOpacity
          style={styles.addCourseBtn}
          onPress={() => {
            HapticsService.light();
            setIsModalOpen(true);
          }}
        >
          <Ionicons name="add" size={16} color="#FFFFFF" />
          <Text style={styles.addCourseText}>Add Course</Text>
        </TouchableOpacity>
      </View>

      {courses.map((course: any) => {
        const stats = course.stats;
        const isCourseSafe = stats.status === 'ON_TRACK';

        return (
          <View key={course.id} style={[styles.courseCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.courseTop}>
              <View>
                <Text style={[styles.courseName, { color: colors.text }]}>{course.courseName}</Text>
                {course.courseCode && (
                  <Text style={[styles.courseCode, { color: colors.textMuted }]}>{course.courseCode}</Text>
                )}
              </View>
              <View style={styles.courseScoreBox}>
                <Text style={[styles.coursePercent, { color: isCourseSafe ? '#10B981' : '#EF4444' }]}>
                  {stats.percentage}%
                </Text>
                <Text style={[styles.courseRatio, { color: colors.textMuted }]}>
                  {course.attendedClasses} / {course.totalClasses}
                </Text>
              </View>
            </View>

            {/* Quick action buttons: Attended / Missed */}
            <View style={styles.logButtonsRow}>
              <TouchableOpacity
                style={[styles.logBtn, { backgroundColor: '#D1FAE5' }]}
                onPress={() => {
                  HapticsService.light();
                  logMutation.mutate({ id: course.id, status: 'ATTENDED' });
                }}
              >
                <Ionicons name="checkmark-circle" size={16} color="#059669" />
                <Text style={[styles.logBtnText, { color: '#065F46' }]}>Attended (+1)</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.logBtn, { backgroundColor: '#FEE2E2' }]}
                onPress={() => {
                  HapticsService.light();
                  logMutation.mutate({ id: course.id, status: 'MISSED' });
                }}
              >
                <Ionicons name="close-circle" size={16} color="#DC2626" />
                <Text style={[styles.logBtnText, { color: '#991B1B' }]}>Missed (+1)</Text>
              </TouchableOpacity>
            </View>

            {/* Message */}
            <Text style={[styles.courseMessage, { color: isCourseSafe ? '#059669' : '#DC2626' }]}>
              {stats.message}
            </Text>
          </View>
        );
      })}

      <AdBanner placement="Attendance Screen Footer" />

      {/* Add Course Modal */}
      <Modal visible={isModalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.card }]}>
            <View style={styles.modalTopRow}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Add New Course</Text>
              <TouchableOpacity onPress={() => setIsModalOpen(false)}>
                <Ionicons name="close" size={24} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.inputLabel, { color: colors.text }]}>Course Name</Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: isDark ? '#1E293B' : '#F8FAFC', color: colors.text, borderColor: colors.border }]}
              placeholder="e.g. Operating Systems"
              placeholderTextColor={colors.textMuted}
              value={newCourseName}
              onChangeText={setNewCourseName}
            />

            <View style={styles.modalInputsRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.inputLabel, { color: colors.text, marginTop: 10 }]}>Total Held</Text>
                <TextInput
                  style={[styles.modalInput, { backgroundColor: isDark ? '#1E293B' : '#F8FAFC', color: colors.text, borderColor: colors.border }]}
                  keyboardType="numeric"
                  value={newTotal}
                  onChangeText={setNewTotal}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.inputLabel, { color: colors.text, marginTop: 10 }]}>Attended</Text>
                <TextInput
                  style={[styles.modalInput, { backgroundColor: isDark ? '#1E293B' : '#F8FAFC', color: colors.text, borderColor: colors.border }]}
                  keyboardType="numeric"
                  value={newAttended}
                  onChangeText={setNewAttended}
                />
              </View>
            </View>

            <TouchableOpacity style={styles.modalSaveBtn} onPress={handleCreateCourse}>
              <Text style={styles.modalSaveText}>Save Course</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 36 },
  calcCard: {
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 20,
  },
  calcHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 14 },
  calcTitle: { fontSize: 16, fontWeight: '800' },
  inputsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  inputCol: { flex: 1 },
  inputLabel: { fontSize: 11, fontWeight: '700', marginBottom: 4 },
  calcInput: {
    borderWidth: 1,
    borderRadius: 12,
    height: 44,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '800',
  },
  resultBanner: {
    padding: 16,
    borderRadius: 16,
  },
  resultTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  currentPercent: { fontSize: 28, fontWeight: '900' },
  statusChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { color: '#FFFFFF', fontSize: 10, fontWeight: '800' },
  verdictText: { fontSize: 13, lineHeight: 18, fontWeight: '700' },
  coursesHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionHeading: { fontSize: 16, fontWeight: '800' },
  addCourseBtn: {
    backgroundColor: '#2563EB',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    gap: 4,
  },
  addCourseText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  courseCard: { padding: 16, borderRadius: 18, borderWidth: 1, marginBottom: 12 },
  courseTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  courseName: { fontSize: 15, fontWeight: '800' },
  courseCode: { fontSize: 11, marginTop: 2 },
  courseScoreBox: { alignItems: 'flex-end' },
  coursePercent: { fontSize: 20, fontWeight: '900' },
  courseRatio: { fontSize: 11, fontWeight: '600', marginTop: 1 },
  logButtonsRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  logBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  logBtnText: { fontSize: 12, fontWeight: '700' },
  courseMessage: { fontSize: 12, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 36 },
  modalTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '800' },
  modalInput: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, height: 46, fontSize: 14 },
  modalInputsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  modalSaveBtn: { backgroundColor: '#2563EB', height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  modalSaveText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});
