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

interface NoteItem {
  id: string;
  title: string;
  content: string;
  subject?: string;
  tags?: string;
  isPinned: boolean;
  createdAt: string;
}

export default function NotesScreen() {
  const queryClient = useQueryClient();
  const { colors, isDark } = useThemeStore();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'notes' | 'todos'>('notes');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<NoteItem | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [subject, setSubject] = useState('');
  const [tags, setTags] = useState('');
  const [isPinned, setIsPinned] = useState(false);

  // Fetch Notes
  const { data: notes = [], isLoading } = useQuery<NoteItem[]>({
    queryKey: ['notes', search],
    queryFn: async () => {
      const url = search ? `/notes?search=${encodeURIComponent(search)}` : '/notes';
      const res = await ApiClient.get(url);
      return res.data;
    },
  });

  // Fetch Todos
  const { data: todosData, refetch: refetchTodos } = useQuery({
    queryKey: ['todos'],
    queryFn: async () => {
      const res = await ApiClient.get('/todos');
      return res.data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: any) => {
      if (editingNote) {
        return ApiClient.patch(`/notes/${editingNote.id}`, payload);
      } else {
        return ApiClient.post('/notes', payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      closeModal();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return ApiClient.delete(`/notes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    },
  });

  const togglePinMutation = useMutation({
    mutationFn: async ({ id, isPinned }: { id: string; isPinned: boolean }) => {
      return ApiClient.patch(`/notes/${id}`, { isPinned });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    },
  });

  const toggleTodoMutation = useMutation({
    mutationFn: async (id: string) => {
      return ApiClient.patch(`/todos/${id}/toggle`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
      queryClient.invalidateQueries({ queryKey: ['weekly-progress'] });
    },
  });

  const openCreateModal = () => {
    setEditingNote(null);
    setTitle('');
    setContent('');
    setSubject('');
    setTags('');
    setIsPinned(false);
    setIsModalOpen(true);
  };

  const openEditModal = (note: NoteItem) => {
    setEditingNote(note);
    setTitle(note.title);
    setContent(note.content);
    setSubject(note.subject || '');
    setTags(note.tags || '');
    setIsPinned(note.isPinned);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingNote(null);
  };

  const handleSaveNote = () => {
    if (!title.trim()) {
      Alert.alert('Required', 'Please enter a note title.');
      return;
    }
    HapticsService.light();
    saveMutation.mutate({
      title,
      content,
      subject: subject || null,
      tags: tags || null,
      isPinned,
    });
  };

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={styles.headerTop}>
          <Text style={[styles.title, { color: colors.text }]}>Study Workspace</Text>
          <TouchableOpacity style={styles.newBtn} onPress={openCreateModal}>
            <Ionicons name="add" size={20} color="#FFFFFF" />
            <Text style={styles.newBtnText}>New Note</Text>
          </TouchableOpacity>
        </View>

        {/* Tab Switcher: Notes vs Tasks */}
        <View style={[styles.tabBar, { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' }]}>
          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'notes' && [styles.activeTab, { backgroundColor: colors.card }]]}
            onPress={() => {
              HapticsService.light();
              setActiveTab('notes');
            }}
          >
            <Ionicons
              name="document-text"
              size={16}
              color={activeTab === 'notes' ? '#2563EB' : colors.textMuted}
              style={{ marginRight: 6 }}
            />
            <Text style={[styles.tabText, { color: activeTab === 'notes' ? '#2563EB' : colors.textMuted }]}>
              Notes ({notes.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'todos' && [styles.activeTab, { backgroundColor: colors.card }]]}
            onPress={() => {
              HapticsService.light();
              setActiveTab('todos');
            }}
          >
            <Ionicons
              name="checkbox"
              size={16}
              color={activeTab === 'todos' ? '#2563EB' : colors.textMuted}
              style={{ marginRight: 6 }}
            />
            <Text style={[styles.tabText, { color: activeTab === 'todos' ? '#2563EB' : colors.textMuted }]}>
              To-Do Tasks ({todosData?.pendingCount || 0})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        {activeTab === 'notes' && (
          <View style={[styles.searchBox, { backgroundColor: isDark ? '#111827' : '#F8FAFC', borderColor: colors.border }]}>
            <Ionicons name="search" size={18} color={colors.textMuted} style={{ marginRight: 8 }} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Search notes by subject, title or tag..."
              placeholderTextColor={colors.textMuted}
              value={search}
              onChangeText={setSearch}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Ionicons name="close-circle" size={18} color={colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {activeTab === 'notes' ? (
          notes.length === 0 ? (
            <View style={[styles.emptyBox, { borderColor: colors.border }]}>
              <Ionicons name="document-outline" size={48} color={colors.textMuted} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No Notes Found</Text>
              <Text style={[styles.emptySub, { color: colors.textMuted }]}>
                {search ? 'Try another search query' : 'Create your first study note to organize topics and formulas.'}
              </Text>
            </View>
          ) : (
            notes.map((note) => (
              <TouchableOpacity
                key={note.id}
                activeOpacity={0.8}
                style={[styles.noteCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => openEditModal(note)}
              >
                <View style={styles.noteTopRow}>
                  <View style={styles.subjectPill}>
                    <Text style={styles.subjectText}>{note.subject || 'General'}</Text>
                  </View>
                  <View style={styles.actionsRow}>
                    <TouchableOpacity
                      onPress={() => {
                        HapticsService.light();
                        togglePinMutation.mutate({ id: note.id, isPinned: !note.isPinned });
                      }}
                      style={styles.iconBtn}
                    >
                      <Ionicons
                        name={note.isPinned ? 'pin' : 'pin-outline'}
                        size={18}
                        color={note.isPinned ? '#2563EB' : colors.textMuted}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => {
                        Alert.alert('Delete Note', 'Are you sure you want to delete this note?', [
                          { text: 'Cancel', style: 'cancel' },
                          { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate(note.id) },
                        ]);
                      }}
                      style={styles.iconBtn}
                    >
                      <Ionicons name="trash-outline" size={18} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>

                <Text style={[styles.noteTitle, { color: colors.text }]}>{note.title}</Text>
                <Text style={[styles.noteSnippet, { color: colors.textMuted }]} numberOfLines={3}>
                  {note.content}
                </Text>

                {note.tags && (
                  <View style={styles.tagsRow}>
                    {note.tags.split(',').map((t, i) => (
                      <View key={i} style={[styles.tagBadge, { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' }]}>
                        <Text style={[styles.tagText, { color: colors.textMuted }]}>#{t.trim()}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </TouchableOpacity>
            ))
          )
        ) : (
          /* To-Dos Tab */
          <View>
            <Text style={[styles.sectionHeading, { color: colors.text }]}>Pending Tasks</Text>
            {(todosData?.all || []).map((task: any) => (
              <View
                key={task.id}
                style={[styles.todoItem, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <TouchableOpacity
                  style={[
                    styles.todoCheckbox,
                    {
                      borderColor: task.isCompleted ? '#10B981' : colors.textMuted,
                      backgroundColor: task.isCompleted ? '#10B981' : 'transparent',
                    },
                  ]}
                  onPress={() => {
                    HapticsService.light();
                    toggleTodoMutation.mutate(task.id);
                  }}
                >
                  {task.isCompleted && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
                </TouchableOpacity>

                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.todoTitle,
                      { color: colors.text, textDecorationLine: task.isCompleted ? 'line-through' : 'none' },
                    ]}
                  >
                    {task.title}
                  </Text>
                  {task.description && (
                    <Text style={[styles.todoDesc, { color: colors.textMuted }]}>{task.description}</Text>
                  )}
                  <View style={styles.todoMetaRow}>
                    <View style={[styles.categoryBadge, { backgroundColor: '#EDE9FE' }]}>
                      <Text style={{ fontSize: 10, fontWeight: '700', color: '#8B5CF6' }}>{task.category}</Text>
                    </View>
                    {task.dueDate && (
                      <Text style={[styles.dueText, { color: colors.textMuted }]}>
                        Due: {new Date(task.dueDate).toLocaleDateString()}
                      </Text>
                    )}
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        <AdBanner placement="Notes & Tasks Footer" />
      </ScrollView>

      {/* Note Editor Modal */}
      <Modal visible={isModalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.card }]}>
            <View style={styles.modalTopRow}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {editingNote ? 'Edit Study Note' : 'Create New Note'}
              </Text>
              <TouchableOpacity onPress={closeModal}>
                <Ionicons name="close" size={24} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={[styles.titleInput, { color: colors.text, borderBottomColor: colors.border }]}
              placeholder="Note Title..."
              placeholderTextColor={colors.textMuted}
              value={title}
              onChangeText={setTitle}
            />

            <View style={styles.noteInputsRow}>
              <TextInput
                style={[styles.smallInput, { backgroundColor: isDark ? '#1E293B' : '#F8FAFC', color: colors.text, borderColor: colors.border }]}
                placeholder="Subject (e.g. Physics)"
                placeholderTextColor={colors.textMuted}
                value={subject}
                onChangeText={setSubject}
              />
              <TextInput
                style={[styles.smallInput, { backgroundColor: isDark ? '#1E293B' : '#F8FAFC', color: colors.text, borderColor: colors.border }]}
                placeholder="Tags (comma separated)"
                placeholderTextColor={colors.textMuted}
                value={tags}
                onChangeText={setTags}
              />
            </View>

            <TextInput
              style={[styles.contentInput, { backgroundColor: isDark ? '#1E293B' : '#F8FAFC', color: colors.text, borderColor: colors.border }]}
              placeholder="Write your note, formulas, summary or key concepts here..."
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={8}
              value={content}
              onChangeText={setContent}
            />

            <TouchableOpacity
              style={styles.pinToggle}
              onPress={() => setIsPinned(!isPinned)}
            >
              <Ionicons name={isPinned ? 'checkbox' : 'square-outline'} size={18} color="#2563EB" />
              <Text style={[styles.pinText, { color: colors.text }]}>Pin to top of list</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveNote}>
              <Text style={styles.saveBtnText}>Save Note</Text>
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
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  title: { fontSize: 22, fontWeight: '800' },
  newBtn: {
    backgroundColor: '#2563EB',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 4,
  },
  newBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  tabBar: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 3,
    marginBottom: 10,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 10,
  },
  activeTab: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 2, elevation: 2 },
  tabText: { fontSize: 13, fontWeight: '700' },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 42,
  },
  searchInput: { flex: 1, fontSize: 13 },
  scrollContent: { padding: 16, paddingBottom: 30 },
  emptyBox: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 16,
    padding: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', marginTop: 12 },
  emptySub: { fontSize: 13, marginTop: 4, textAlign: 'center' },
  noteCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  noteTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  subjectPill: { backgroundColor: '#DBEAFE', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  subjectText: { color: '#1D4ED8', fontSize: 11, fontWeight: '700' },
  actionsRow: { flexDirection: 'row', gap: 6 },
  iconBtn: { padding: 4 },
  noteTitle: { fontSize: 16, fontWeight: '800', marginBottom: 4 },
  noteSnippet: { fontSize: 13, lineHeight: 18, marginBottom: 8 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tagBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  tagText: { fontSize: 10, fontWeight: '600' },
  sectionHeading: { fontSize: 16, fontWeight: '800', marginBottom: 12 },
  todoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  todoCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  todoTitle: { fontSize: 14, fontWeight: '700' },
  todoDesc: { fontSize: 12, marginTop: 2 },
  todoMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  categoryBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  dueText: { fontSize: 11 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 36,
  },
  modalTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '800' },
  titleInput: { fontSize: 18, fontWeight: '700', paddingVertical: 8, borderBottomWidth: 1, marginBottom: 12 },
  noteInputsRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  smallInput: { flex: 1, borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, height: 40, fontSize: 12 },
  contentInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    height: 140,
    textAlignVertical: 'top',
    fontSize: 14,
    marginBottom: 12,
  },
  pinToggle: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 },
  pinText: { fontSize: 13, fontWeight: '600' },
  saveBtn: {
    backgroundColor: '#2563EB',
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});
