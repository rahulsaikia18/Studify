import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../stores/themeStore';
import { HapticsService } from '../../services/HapticsService';
import { AdBanner } from '../../components/AdBanner';

interface ToolCardItem {
  id: string;
  title: string;
  description: string;
  route: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  bgColor: string;
  badge?: string;
}

const TOOLS_LIST: ToolCardItem[] = [
  {
    id: 'cgpa',
    title: 'CGPA & SGPA Calculator',
    description: 'Calculate semester-wise SGPA, overall CGPA, percentage, and credit weighting with custom grading scales.',
    route: '/tools/cgpa',
    icon: 'calculator',
    color: '#2563EB',
    bgColor: '#DBEAFE',
    badge: 'Module A',
  },
  {
    id: 'attendance',
    title: 'Attendance Calculator',
    description: 'Instant bunk calculator: see how many classes you can miss or must attend to maintain your target 75% or 80%.',
    route: '/tools/attendance',
    icon: 'checkmark-circle',
    color: '#10B981',
    bgColor: '#D1FAE5',
    badge: 'Module B',
  },
  {
    id: 'pomodoro',
    title: 'Pomodoro Focus Timer',
    description: '25-minute focus sprints, customized breaks, background notifications, and daily statistics tracking.',
    route: '/tools/pomodoro',
    icon: 'timer',
    color: '#EF4444',
    bgColor: '#FEE2E2',
    badge: 'Module D',
  },
  {
    id: 'todos',
    title: 'To-Do & Task Manager',
    description: 'Daily priorities, deadlines, categorized checklists, and progress analytics.',
    route: '/tools/todos',
    icon: 'checkbox',
    color: '#8B5CF6',
    bgColor: '#EDE9FE',
    badge: 'Module F',
  },
  {
    id: 'exams',
    title: 'Exam Countdown & Syllabus',
    description: 'Days remaining countdown, multi-exam tracking, syllabus completion % and study alerts.',
    route: '/tools/exams',
    icon: 'alarm',
    color: '#F59E0B',
    bgColor: '#FEF3C7',
    badge: 'Module G',
  },
  {
    id: 'pdf',
    title: 'PDF Tools & Optimizer',
    description: 'Merge multiple PDFs, split pages, compress size, and extract pages without saving files on server.',
    route: '/tools/pdf',
    icon: 'layers',
    color: '#06B6D4',
    bgColor: '#CFFAFE',
    badge: 'Module H',
  },
  {
    id: 'quiz',
    title: 'Quiz Generator & Practice',
    description: 'Practice questions with instant scoring, timer, and detailed explanations for every option.',
    route: '/tools/quiz',
    icon: 'bulb',
    color: '#6366F1',
    bgColor: '#EEF2FF',
    badge: 'Module I',
  },
];

export default function ToolsHubScreen() {
  const router = useRouter();
  const { colors, isDark } = useThemeStore();

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>Academic Tools Hub</Text>
        <Text style={[styles.sub, { color: colors.textMuted }]}>
          Calculators, planners, document tools, and study utilities
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {TOOLS_LIST.map((tool) => (
          <TouchableOpacity
            key={tool.id}
            activeOpacity={0.7}
            style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => {
              HapticsService.light();
              router.push(tool.route as any);
            }}
          >
            <View style={[styles.iconWrapper, { backgroundColor: tool.bgColor }]}>
              <Ionicons name={tool.icon} size={28} color={tool.color} />
            </View>

            <View style={styles.cardInfo}>
              <View style={styles.cardHeaderRow}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>{tool.title}</Text>
                {tool.badge && (
                  <View style={[styles.badge, { backgroundColor: `${tool.color}15` }]}>
                    <Text style={[styles.badgeText, { color: tool.color }]}>{tool.badge}</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.cardDesc, { color: colors.textMuted }]}>{tool.description}</Text>
            </View>

            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} style={{ marginLeft: 8 }} />
          </TouchableOpacity>
        ))}

        <AdBanner placement="Tools Hub Footer" />
      </ScrollView>
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
  },
  title: { fontSize: 22, fontWeight: '800' },
  sub: { fontSize: 13, marginTop: 2 },
  scrollContent: { padding: 16, paddingBottom: 30 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  iconWrapper: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  cardInfo: { flex: 1 },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', flex: 1 },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 6,
  },
  badgeText: { fontSize: 9, fontWeight: '800' },
  cardDesc: { fontSize: 12, lineHeight: 17 },
});
