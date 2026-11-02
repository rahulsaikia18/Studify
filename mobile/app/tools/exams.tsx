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
import { NotificationService } from '../../services/NotificationService';
import { AdBanner } from '../../components/AdBanner';

export default function ExamsCountdownScreen() {
  const queryClient = useQueryClient();
  const { colors, isDark } = useThemeStore();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [daysFromNow, setDaysFromNow] = useState('14');
  const [subjectsStr, setSubjectsStr] = useState('');
  const [notes, setNotes] = useState('');

  const { data: exams = [] } = useQuery({
    queryKey: ['exams'],
    queryFn: async () => {
      const res = await ApiClient.get('/exams');
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      return ApiClient.post('/exams', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exams'] });
      queryClient.invalidateQueries({ queryKey: ['upcoming-exams'] });
      setIsModalOpen(false);
      setTitle('');
      setSubjectsStr('');
    },
  });

  const updateProgressMutation = useMutation({
    mutationFn: async ({ id, syllabusProgress }: { id: string; syllabusProgress: number }) => {
      return ApiClient.patch(`/exams/${id}`, { syllabusProgress });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exams'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return ApiClient.delete(`/exams/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exams'] });
      queryClient.invalidateQueries({ queryKey: ['upcoming-exams'] });
    },
  });

  const handleCreate = async () => {
    if (!title.trim()) {
      Alert.alert('Required', 'Please enter an examination title.');
      return;
    }

    const examDate = new Date();
    const days = parseInt(daysFromNow, 10) || 7;
    examDate.setDate(examDate.getDate() + days);

    // Schedule notification alert 1 day before
    const alertDate = new Date(examDate);
    alertDate.setDate(alertDate.getDate() - 1);
    await NotificationService.scheduleStudyReminder(
      `Upcoming Exam: ${title}`,
      `Your examination is in 1 day! Review your revision notes now.`,
      alertDate
    );

    createMutation.mutate({
      title,
      examDate: examDate.toISOString(),
      subjects: subjectsStr ? subjectsStr.split(',').map((s) => s.trim()) : ['General Syllabus'],
      syllabusProgress: 10,
      priority: 'HIGH',
      notes,
    });
  };

  return (
    <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={styles.scrollContent}>
      {/* Header Banner */}
      <View style={styles.topRow}>
        <View>
          <Text style={[styles.heading, { color: colors.text }]}>Exam Countdown & Tracker</Text>
          <Text style={[styles.sub, { color: colors.textMuted }]}>
            Stay on top of deadlines and track revision progress
          </Text>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => {
            HapticsService.light();
            setIsModalOpen(true);
          }}
        >
          <Ionicons name="add" size={18} color="#FFFFFF" />
          <Text style={styles.addBtnText}>Add Exam</Text>
        </TouchableOpacity>
      </View>

      {exams.length === 0 ? (
        <View style={[styles.emptyBox, { borderColor: colors.border }]}>
          <Ionicons name="alarm-outline" size={48} color={colors.textMuted} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No Upcoming Exams</Text>
          <Text style={[styles.emptySub, { color: colors.textMuted }]}>
            Tap "+ Add Exam" to track test dates, syllabus progress, and countdowns.
          </Text>
        </View>
      ) : (
        exams.map((exam: any) => {
          const isUrgent = exam.daysRemaining <= 3;
          return (
            <View key={exam.id} style={[styles.examCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {/* Countdown badge & Title */}
              <View style={styles.examCardTop}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.examTitle, { color: colors.text }]}>{exam.title}</Text>
                  <Text style={[styles.examDate, { color: colors.textMuted }]}>
                    📅 {new Date(exam.examDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </Text>
                </View>

                <View style={[styles.countdownBadge, { backgroundColor: isUrgent ? '#FEE2E2' : '#EFF6FF' }]}>
                  <Text style={[styles.countdownNum, { color: isUrgent ? '#DC2626' : '#2563EB' }]}>
                    {exam.daysRemaining}
                  </Text>
                  <Text style={[styles.countdownLabel, { color: isUrgent ? '#DC2626' : '#2563EB' }]}>
                    DAYS LEFT
                  </Text>
                </View>
              </View>

              {/* Syllabus Progress */}
              <View style={styles.progressContainer}>
                <View style={styles.progressLabelRow}>
                  <Text style={[styles.progressLabel, { color: colors.textMuted }]}>Syllabus Preparation</Text>
                  <Text style={[styles.progressVal, { color: colors.text }]}>{exam.syllabusProgress}%</Text>
                </View>
                <View style={[styles.progressBarTrack, { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' }]}>
                  <View style={[styles.progressBarFill, { width: `${exam.syllabusProgress}%` }]} />
                </View>

                {/* Progress adjust buttons */}
                <View style={styles.stepperRow}>
                  <TouchableOpacity
                    style={[styles.stepperBtn, { borderColor: colors.border }]}
                    onPress={() => {
                      HapticsService.light();
                      updateProgressMutation.mutate({
                        id: exam.id,
                        syllabusProgress: Math.max(0, exam.syllabusProgress - 10),
                      });
                    }}
                  >
                    <Text style={[styles.stepperText, { color: colors.text }]}>- 10%</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.stepperBtn, { borderColor: colors.border }]}
                    onPress={() => {
                      HapticsService.light();
                      updateProgressMutation.mutate({
                        id: exam.id,
                        syllabusProgress: Math.min(100, exam.syllabusProgress + 10),
                      });
                    }}
                  >
                    <Text style={[styles.stepperText, { color: '#2563EB' }]}>+ 10% Progress</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.trashBtn}
                    onPress={() => {
                      Alert.alert('Delete Exam', 'Remove this examination?', [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate(exam.id) },
                      ]);
                    }}
                  >
                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Topics / Subjects */}
              {Array.isArray(exam.subjects) && exam.subjects.length > 0 && (
                <View style={styles.subjectsRow}>
                  {exam.subjects.map((sub: string, i: number) => (
                    <View key={i} style={[styles.subChip, { backgroundColor: isDark ? '#1E293B' : '#F8FAFC' }]}>
                      <Text style={[styles.subChipText, { color: colors.textMuted }]}>{sub}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          );
        })
      )}

      <AdBanner placement="Exam Countdown Footer" />

      {/* Add Exam Modal */}
      <Modal visible={isModalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Add Examination</Text>
              <TouchableOpacity onPress={() => setIsModalOpen(false)}>
                <Ionicons name="close" size={24} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.label, { color: colors.text }]}>Examination Name *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: isDark ? '#1E293B' : '#F8FAFC', color: colors.text, borderColor: colors.border }]}
              placeholder="e.g. Finals: Database Systems"
              placeholderTextColor={colors.textMuted}
              value={title}
              onChangeText={setTitle}
            />

            <Text style={[styles.label, { color: colors.text, marginTop: 10 }]}>Days from today *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: isDark ? '#1E293B' : '#F8FAFC', color: colors.text, borderColor: colors.border }]}
              keyboardType="numeric"
              placeholder="14"
              placeholderTextColor={colors.textMuted}
              value={daysFromNow}
              onChangeText={setDaysFromNow}
            />

            <Text style={[styles.label, { color: colors.text, marginTop: 10 }]}>Subjects / Modules (comma separated)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: isDark ? '#1E293B' : '#F8FAFC', color: colors.text, borderColor: colors.border }]}
              placeholder="Module 1, SQL, Transactions, Normalization"
              placeholderTextColor={colors.textMuted}
              value={subjectsStr}
              onChangeText={setSubjectsStr}
            />

            <TouchableOpacity style={styles.modalSaveBtn} onPress={handleCreate}>
              <Text style={styles.modalSaveText}>Save Examination</Text>
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
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  heading: { fontSize: 20, fontWeight: '800' },
  sub: { fontSize: 12, marginTop: 2 },
  addBtn: {
    backgroundColor: '#2563EB',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 4,
  },
  addBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  emptyBox: { borderWidth: 1, borderStyle: 'dashed', borderRadius: 16, padding: 36, alignItems: 'center' },
  emptyTitle: { fontSize: 16, fontWeight: '700', marginTop: 10 },
  emptySub: { fontSize: 13, marginTop: 4, textAlign: 'center' },
  examCard: { padding: 16, borderRadius: 20, borderWidth: 1, marginBottom: 14 },
  examCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  examTitle: { fontSize: 16, fontWeight: '800' },
  examDate: { fontSize: 12, marginTop: 2 },
  countdownBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    alignItems: 'center',
    minWidth: 70,
  },
  countdownNum: { fontSize: 22, fontWeight: '900' },
  countdownLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  progressContainer: { marginBottom: 12 },
  progressLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressLabel: { fontSize: 12, fontWeight: '600' },
  progressVal: { fontSize: 12, fontWeight: '800' },
  progressBarTrack: { height: 8, borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#2563EB', borderRadius: 4 },
  stepperRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 },
  stepperBtn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1 },
  stepperText: { fontSize: 11, fontWeight: '700' },
  trashBtn: { marginLeft: 'auto', padding: 4 },
  subjectsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  subChip: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  subChipText: { fontSize: 11, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 36 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '800' },
  label: { fontSize: 12, fontWeight: '700', marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 12, height: 46, paddingHorizontal: 12, fontSize: 14 },
  modalSaveBtn: { backgroundColor: '#2563EB', height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 18 },
  modalSaveText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});
