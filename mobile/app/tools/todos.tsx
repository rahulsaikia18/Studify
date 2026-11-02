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

const CATEGORIES = ['All', 'Assignment', 'Exam Prep', 'Project', 'Reading', 'General'];

export default function TodosScreen() {
  const queryClient = useQueryClient();
  const { colors, isDark } = useThemeStore();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Assignment');
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');
  const [daysDue, setDaysDue] = useState('1'); // days from today

  const { data: todosData } = useQuery({
    queryKey: ['todos', selectedCategory],
    queryFn: async () => {
      const url = selectedCategory !== 'All' ? `/todos?category=${selectedCategory}` : '/todos';
      const res = await ApiClient.get(url);
      return res.data;
    },
  });

  const tasks = todosData?.all || [];
  const dailyTasks = todosData?.dailyTasks || [];
  const upcomingTasks = todosData?.upcomingTasks || [];

  const toggleMutation = useMutation({
    mutationFn: async (id: string) => {
      return ApiClient.patch(`/todos/${id}/toggle`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
      queryClient.invalidateQueries({ queryKey: ['weekly-progress'] });
    },
  });

  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      return ApiClient.post('/todos', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
      queryClient.invalidateQueries({ queryKey: ['weekly-progress'] });
      setIsModalOpen(false);
      setTitle('');
      setDescription('');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return ApiClient.delete(`/todos/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    },
  });

  const handleCreate = () => {
    if (!title.trim()) {
      Alert.alert('Required', 'Please enter a task title');
      return;
    }
    const due = new Date();
    due.setDate(due.getDate() + (parseInt(daysDue, 10) || 1));

    createMutation.mutate({
      title,
      description,
      category,
      priority,
      dueDate: due.toISOString(),
      isCompleted: false,
    });
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {/* Category Filter Chips */}
      <View style={[styles.filterStrip, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterContent}>
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.filterChip,
                  isSelected && { backgroundColor: '#2563EB', borderColor: '#2563EB' },
                  !isSelected && { backgroundColor: isDark ? '#1E293B' : '#F8FAFC', borderColor: colors.border },
                ]}
                onPress={() => {
                  HapticsService.light();
                  setSelectedCategory(cat);
                }}
              >
                <Text style={[styles.filterText, { color: isSelected ? '#FFFFFF' : colors.text }]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Progress summary banner */}
        <View style={[styles.progressCard, { backgroundColor: isDark ? '#1E293B' : '#EFF6FF', borderColor: '#BFDBFE' }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.progressTitle, { color: colors.text }]}>Tasks Overview</Text>
            <Text style={[styles.progressSub, { color: colors.textMuted }]}>
              {todosData?.completedCount || 0} completed • {todosData?.pendingCount || 0} pending
            </Text>
          </View>
          <TouchableOpacity
            style={styles.addTaskBtn}
            onPress={() => {
              HapticsService.light();
              setIsModalOpen(true);
            }}
          >
            <Ionicons name="add" size={18} color="#FFFFFF" />
            <Text style={styles.addTaskBtnText}>Add Task</Text>
          </TouchableOpacity>
        </View>

        {/* Daily Tasks */}
        <Text style={[styles.groupHeading, { color: colors.text }]}>Due Today & Overdue</Text>
        {dailyTasks.length === 0 ? (
          <Text style={[styles.emptyGroupText, { color: colors.textMuted }]}>No tasks due today. You are caught up!</Text>
        ) : (
          dailyTasks.map((t: any) => renderTaskItem(t))
        )}

        {/* Upcoming Tasks */}
        <Text style={[styles.groupHeading, { color: colors.text, marginTop: 18 }]}>Upcoming & Later</Text>
        {upcomingTasks.length === 0 ? (
          <Text style={[styles.emptyGroupText, { color: colors.textMuted }]}>No upcoming tasks scheduled.</Text>
        ) : (
          upcomingTasks.map((t: any) => renderTaskItem(t))
        )}

        <AdBanner placement="To-Do Manager Screen" />
      </ScrollView>

      {/* Add Task Modal */}
      <Modal visible={isModalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Create Academic Task</Text>
              <TouchableOpacity onPress={() => setIsModalOpen(false)}>
                <Ionicons name="close" size={24} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.label, { color: colors.text }]}>Task Title *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: isDark ? '#1E293B' : '#F8FAFC', color: colors.text, borderColor: colors.border }]}
              placeholder="e.g. Finish Operating Systems Assignment"
              placeholderTextColor={colors.textMuted}
              value={title}
              onChangeText={setTitle}
            />

            <Text style={[styles.label, { color: colors.text, marginTop: 10 }]}>Description</Text>
            <TextInput
              style={[styles.input, { backgroundColor: isDark ? '#1E293B' : '#F8FAFC', color: colors.text, borderColor: colors.border }]}
              placeholder="Details or specific questions to solve"
              placeholderTextColor={colors.textMuted}
              value={description}
              onChangeText={setDescription}
            />

            <Text style={[styles.label, { color: colors.text, marginTop: 10 }]}>Category</Text>
            <View style={styles.catChipsRow}>
              {CATEGORIES.filter((c) => c !== 'All').map((c) => {
                const isSelected = category === c;
                return (
                  <TouchableOpacity
                    key={c}
                    style={[
                      styles.catChip,
                      isSelected && { backgroundColor: '#2563EB', borderColor: '#2563EB' },
                      !isSelected && { borderColor: colors.border },
                    ]}
                    onPress={() => setCategory(c)}
                  >
                    <Text style={{ fontSize: 11, fontWeight: '700', color: isSelected ? '#FFFFFF' : colors.text }}>
                      {c}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[styles.label, { color: colors.text, marginTop: 10 }]}>Due in how many days?</Text>
            <TextInput
              style={[styles.input, { backgroundColor: isDark ? '#1E293B' : '#F8FAFC', color: colors.text, borderColor: colors.border }]}
              keyboardType="numeric"
              placeholder="1"
              placeholderTextColor={colors.textMuted}
              value={daysDue}
              onChangeText={setDaysDue}
            />

            <TouchableOpacity style={styles.saveBtn} onPress={handleCreate}>
              <Text style={styles.saveBtnText}>Save Task</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );

  function renderTaskItem(t: any) {
    const isPriorityHigh = t.priority === 'HIGH';
    return (
      <View key={t.id} style={[styles.taskCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <TouchableOpacity
          style={[
            styles.checkCircle,
            {
              borderColor: t.isCompleted ? '#10B981' : colors.textMuted,
              backgroundColor: t.isCompleted ? '#10B981' : 'transparent',
            },
          ]}
          onPress={() => {
            HapticsService.light();
            toggleMutation.mutate(t.id);
          }}
        >
          {t.isCompleted && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <Text
            style={[
              styles.taskTitle,
              { color: colors.text, textDecorationLine: t.isCompleted ? 'line-through' : 'none' },
            ]}
          >
            {t.title}
          </Text>
          {t.description && (
            <Text style={[styles.taskDesc, { color: colors.textMuted }]}>{t.description}</Text>
          )}

          <View style={styles.taskMetaRow}>
            <View style={styles.catBadge}>
              <Text style={styles.catBadgeText}>{t.category}</Text>
            </View>
            {t.dueDate && (
              <Text style={[styles.taskDueDate, { color: colors.textMuted }]}>
                📅 {new Date(t.dueDate).toLocaleDateString()}
              </Text>
            )}
          </View>
        </View>

        <TouchableOpacity
          onPress={() => {
            Alert.alert('Delete Task', 'Remove this task?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate(t.id) },
            ]);
          }}
          style={{ padding: 4 }}
        >
          <Ionicons name="trash-outline" size={18} color="#EF4444" />
        </TouchableOpacity>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  filterStrip: { borderBottomWidth: 1, paddingVertical: 10 },
  filterContent: { paddingHorizontal: 16, gap: 8 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  filterText: { fontSize: 12, fontWeight: '700' },
  scrollContent: { padding: 16, paddingBottom: 36 },
  progressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 16,
  },
  progressTitle: { fontSize: 16, fontWeight: '800' },
  progressSub: { fontSize: 12, marginTop: 2 },
  addTaskBtn: {
    backgroundColor: '#2563EB',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 4,
  },
  addTaskBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  groupHeading: { fontSize: 15, fontWeight: '800', marginBottom: 10 },
  emptyGroupText: { fontSize: 13, fontStyle: 'italic', marginBottom: 10 },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  taskTitle: { fontSize: 14, fontWeight: '700' },
  taskDesc: { fontSize: 12, marginTop: 2 },
  taskMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  catBadge: { backgroundColor: '#EDE9FE', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  catBadgeText: { fontSize: 10, fontWeight: '700', color: '#8B5CF6' },
  taskDueDate: { fontSize: 11 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 36 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '800' },
  label: { fontSize: 12, fontWeight: '700', marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 12, height: 44, paddingHorizontal: 12, fontSize: 14 },
  catChipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  catChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
  saveBtn: { backgroundColor: '#2563EB', height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 18 },
  saveBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});
