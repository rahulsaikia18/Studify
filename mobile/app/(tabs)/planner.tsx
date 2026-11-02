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
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useThemeStore } from '../../stores/themeStore';
import { ApiClient } from '../../services/api';
import { HapticsService } from '../../services/HapticsService';
import { AdBanner } from '../../components/AdBanner';

interface SessionItem {
  id: string;
  subject: string;
  topic?: string;
  plannedMinutes: number;
  actualMinutes: number;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  completed: boolean;
  scheduledDate: string;
}

export default function PlannerScreen() {
  const queryClient = useQueryClient();
  const { colors, isDark } = useThemeStore();
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [selectedDayOffset, setSelectedDayOffset] = useState(0); // 0 = today
  const [isModalVisible, setIsModalVisible] = useState(false);

  // New session form
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [plannedMinutes, setPlannedMinutes] = useState('60');
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');

  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + selectedDayOffset);
  const dateStr = targetDate.toISOString().split('T')[0];

  const { data: sessions = [], isLoading } = useQuery<SessionItem[]>({
    queryKey: ['study-sessions', dateStr],
    queryFn: async () => {
      const res = await ApiClient.get(`/study/sessions?date=${dateStr}`);
      return res.data;
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, completed, plannedMinutes }: { id: string; completed: boolean; plannedMinutes: number }) => {
      return ApiClient.patch(`/study/sessions/${id}`, {
        completed,
        actualMinutes: completed ? plannedMinutes : 0,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['study-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['weekly-progress'] });
    },
  });

  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      return ApiClient.post('/study/sessions', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['study-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['weekly-progress'] });
      setIsModalVisible(false);
      setSubject('');
      setTopic('');
    },
  });

  const handleCreate = () => {
    if (!subject.trim()) {
      Alert.alert('Required', 'Please enter a subject name');
      return;
    }
    createMutation.mutate({
      subject,
      topic,
      plannedMinutes: parseInt(plannedMinutes, 10) || 60,
      priority,
      scheduledDate: targetDate.toISOString(),
      completed: false,
    });
  };

  const totalPlanned = sessions.reduce((acc, s) => acc + s.plannedMinutes, 0);
  const totalActual = sessions.reduce((acc, s) => acc + s.actualMinutes, 0);

  // 7 days calendar tabs
  const daysRow = [-2, -1, 0, 1, 2, 3, 4].map((offset) => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return {
      offset,
      dayName: d.toLocaleDateString('en-US', { weekday: 'narrow' }),
      dayNum: d.getDate(),
      isToday: offset === 0,
    };
  });

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Top Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>Study Planner</Text>
          <Text style={[styles.sub, { color: colors.textMuted }]}>
            {targetDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => {
            HapticsService.light();
            setIsModalVisible(true);
          }}
        >
          <Ionicons name="add" size={22} color="#FFFFFF" />
          <Text style={styles.addBtnText}>Plan Session</Text>
        </TouchableOpacity>
      </View>

      {/* Calendar Day Picker */}
      <View style={[styles.daysStrip, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        {daysRow.map((item) => {
          const isSelected = selectedDayOffset === item.offset;
          return (
            <TouchableOpacity
              key={item.offset}
              style={[
                styles.dayTab,
                isSelected && { backgroundColor: '#2563EB', borderColor: '#2563EB' },
                !isSelected && { backgroundColor: isDark ? '#1E293B' : '#F8FAFC', borderColor: colors.border },
              ]}
              onPress={() => {
                HapticsService.light();
                setSelectedDayOffset(item.offset);
              }}
            >
              <Text style={[styles.dayTabName, { color: isSelected ? '#BFDBFE' : colors.textMuted }]}>
                {item.dayName}
              </Text>
              <Text style={[styles.dayTabNum, { color: isSelected ? '#FFFFFF' : colors.text }]}>
                {item.dayNum}
              </Text>
              {item.isToday && !isSelected && <View style={styles.todayDot} />}
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Daily Stats Summary */}
        <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.summaryCol}>
            <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Planned</Text>
            <Text style={[styles.summaryVal, { color: colors.text }]}>
              {Math.round(totalPlanned / 60 * 10) / 10} hrs
            </Text>
          </View>
          <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
          <View style={styles.summaryCol}>
            <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Completed</Text>
            <Text style={[styles.summaryVal, { color: '#10B981' }]}>
              {Math.round(totalActual / 60 * 10) / 10} hrs
            </Text>
          </View>
          <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
          <View style={styles.summaryCol}>
            <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Sessions</Text>
            <Text style={[styles.summaryVal, { color: colors.text }]}>
              {sessions.filter((s) => s.completed).length} / {sessions.length}
            </Text>
          </View>
        </View>

        {/* Sessions List */}
        <Text style={[styles.sectionHeading, { color: colors.text }]}>Scheduled Study Blocks</Text>

        {sessions.length === 0 ? (
          <View style={[styles.emptyBox, { borderColor: colors.border }]}>
            <Ionicons name="calendar-outline" size={44} color={colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No Study Sessions Planned</Text>
            <Text style={[styles.emptySub, { color: colors.textMuted }]}>
              Tap "+ Plan Session" above to schedule subjects for this day.
            </Text>
          </View>
        ) : (
          sessions.map((item) => {
            const isHigh = item.priority === 'HIGH';
            const priorityColor = isHigh ? '#EF4444' : item.priority === 'MEDIUM' ? '#F59E0B' : '#10B981';

            return (
              <View
                key={item.id}
                style={[
                  styles.sessionCard,
                  { backgroundColor: colors.card, borderColor: item.completed ? '#10B981' : colors.border },
                ]}
              >
                <TouchableOpacity
                  style={[
                    styles.checkCircle,
                    {
                      borderColor: item.completed ? '#10B981' : colors.textMuted,
                      backgroundColor: item.completed ? '#10B981' : 'transparent',
                    },
                  ]}
                  onPress={() => {
                    HapticsService.light();
                    toggleMutation.mutate({
                      id: item.id,
                      completed: !item.completed,
                      plannedMinutes: item.plannedMinutes,
                    });
                  }}
                >
                  {item.completed && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
                </TouchableOpacity>

                <View style={styles.sessionInfo}>
                  <View style={styles.titleRow}>
                    <Text
                      style={[
                        styles.sessionSubject,
                        { color: colors.text, textDecorationLine: item.completed ? 'line-through' : 'none' },
                      ]}
                    >
                      {item.subject}
                    </Text>
                    <View style={[styles.priorityBadge, { backgroundColor: `${priorityColor}15` }]}>
                      <Text style={[styles.priorityText, { color: priorityColor }]}>{item.priority}</Text>
                    </View>
                  </View>

                  {item.topic && (
                    <Text style={[styles.sessionTopic, { color: colors.textMuted }]}>{item.topic}</Text>
                  )}

                  <View style={styles.timeRow}>
                    <Ionicons name="time-outline" size={14} color={colors.textMuted} />
                    <Text style={[styles.timeText, { color: colors.textMuted }]}>
                      {item.plannedMinutes} mins planned
                      {item.completed ? ` • Finished (${item.actualMinutes}m)` : ''}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })
        )}

        <AdBanner placement="Planner Screen" />
      </ScrollView>

      {/* Add Session Modal */}
      <Modal visible={isModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Add Study Session</Text>
              <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.inputLabel, { color: colors.text }]}>Subject</Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: isDark ? '#1E293B' : '#F8FAFC', color: colors.text, borderColor: colors.border }]}
              placeholder="e.g. Mathematics, Operating Systems"
              placeholderTextColor={colors.textMuted}
              value={subject}
              onChangeText={setSubject}
            />

            <Text style={[styles.inputLabel, { color: colors.text, marginTop: 12 }]}>Topic (Optional)</Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: isDark ? '#1E293B' : '#F8FAFC', color: colors.text, borderColor: colors.border }]}
              placeholder="e.g. Calculus Chapter 3, LeetCode Trees"
              placeholderTextColor={colors.textMuted}
              value={topic}
              onChangeText={setTopic}
            />

            <Text style={[styles.inputLabel, { color: colors.text, marginTop: 12 }]}>Planned Duration (Minutes)</Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: isDark ? '#1E293B' : '#F8FAFC', color: colors.text, borderColor: colors.border }]}
              placeholder="60"
              keyboardType="number-pad"
              placeholderTextColor={colors.textMuted}
              value={plannedMinutes}
              onChangeText={setPlannedMinutes}
            />

            <Text style={[styles.inputLabel, { color: colors.text, marginTop: 12 }]}>Priority</Text>
            <View style={styles.prioritySelector}>
              {(['LOW', 'MEDIUM', 'HIGH'] as const).map((p) => {
                const isSelected = priority === p;
                return (
                  <TouchableOpacity
                    key={p}
                    style={[
                      styles.priorityOption,
                      isSelected && { backgroundColor: '#2563EB', borderColor: '#2563EB' },
                      !isSelected && { borderColor: colors.border },
                    ]}
                    onPress={() => setPriority(p)}
                  >
                    <Text style={[styles.priorityOptText, { color: isSelected ? '#FFFFFF' : colors.text }]}>{p}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity style={styles.modalSaveBtn} onPress={handleCreate}>
              <Text style={styles.modalSaveText}>Save Study Plan</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    paddingTop: 12,
    paddingHorizontal: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: { fontSize: 22, fontWeight: '800' },
  sub: { fontSize: 13, marginTop: 2 },
  addBtn: {
    backgroundColor: '#2563EB',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    gap: 4,
  },
  addBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  daysStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  dayTab: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 1,
    minWidth: 42,
  },
  dayTabName: { fontSize: 11, fontWeight: '700' },
  dayTabNum: { fontSize: 14, fontWeight: '800', marginTop: 2 },
  todayDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#2563EB', marginTop: 3 },
  scrollContent: { padding: 16, paddingBottom: 30 },
  summaryCard: {
    flexDirection: 'row',
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 16,
  },
  summaryCol: { flex: 1, alignItems: 'center' },
  summaryLabel: { fontSize: 11, fontWeight: '600' },
  summaryVal: { fontSize: 16, fontWeight: '800', marginTop: 3 },
  summaryDivider: { width: 1, height: '80%', alignSelf: 'center' },
  sectionHeading: { fontSize: 16, fontWeight: '800', marginBottom: 12 },
  emptyBox: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', marginTop: 10 },
  emptySub: { fontSize: 13, marginTop: 4, textAlign: 'center' },
  sessionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
  },
  checkCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  sessionInfo: { flex: 1 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sessionSubject: { fontSize: 15, fontWeight: '700' },
  priorityBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  priorityText: { fontSize: 9, fontWeight: '800' },
  sessionTopic: { fontSize: 12, marginTop: 2 },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  timeText: { fontSize: 11, fontWeight: '600' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 36,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: '800' },
  inputLabel: { fontSize: 12, fontWeight: '700', marginBottom: 6 },
  modalInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 46,
    fontSize: 14,
  },
  prioritySelector: { flexDirection: 'row', gap: 8, marginTop: 4 },
  priorityOption: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  priorityOptText: { fontSize: 12, fontWeight: '700' },
  modalSaveBtn: {
    backgroundColor: '#2563EB',
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  modalSaveText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});
