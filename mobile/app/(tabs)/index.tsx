import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../stores/authStore';
import { useThemeStore } from '../../stores/themeStore';
import { ApiClient } from '../../services/api';
import { StatCard } from '../../components/StatCard';
import { WeeklyChart } from '../../components/WeeklyChart';
import { MotivationalBanner } from '../../components/MotivationalBanner';
import { QuickToolButton } from '../../components/QuickToolButton';
import { AdBanner } from '../../components/AdBanner';
import { HapticsService } from '../../services/HapticsService';

export default function HomeDashboard() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { colors, isDark } = useThemeStore();
  const [refreshing, setRefreshing] = useState(false);

  // Determine Greeting based on current local time
  const currentHour = new Date().getHours();
  let greeting = 'Good morning';
  if (currentHour >= 12 && currentHour < 17) {
    greeting = 'Good afternoon';
  } else if (currentHour >= 17) {
    greeting = 'Good evening';
  }

  // Current formatted date
  const dateFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  // Fetch Study Progress
  const { data: progressData, refetch: refetchProgress } = useQuery({
    queryKey: ['weekly-progress'],
    queryFn: async () => {
      const res = await ApiClient.get('/study/weekly-progress');
      return res.data;
    },
    initialData: {
      chartData: [
        { day: 'Mon', date: '1', plannedMinutes: 60, actualMinutes: 50 },
        { day: 'Tue', date: '2', plannedMinutes: 90, actualMinutes: 80 },
        { day: 'Wed', date: '3', plannedMinutes: 120, actualMinutes: 110 },
        { day: 'Thu', date: '4', plannedMinutes: 45, actualMinutes: 45 },
        { day: 'Fri', date: '5', plannedMinutes: 90, actualMinutes: 90 },
        { day: 'Sat', date: '6', plannedMinutes: 60, actualMinutes: 30 },
        { day: 'Sun', date: '7', plannedMinutes: 120, actualMinutes: 135 },
      ],
      todayHours: 2.2,
      todayMinutes: 135,
      completedTasks: 3,
      pendingTasks: 2,
      studyStreak: 5,
      productivityScore: 88,
    },
  });

  // Fetch Motivation Quote
  const { data: quoteData } = useQuery({
    queryKey: ['motivation-quote'],
    queryFn: async () => {
      const res = await ApiClient.get('/motivation');
      return res.data;
    },
    initialData: {
      quote: "The beautiful thing about learning is that nobody can take it away from you.",
      author: "B.B. King",
    },
  });

  // Fetch upcoming exams
  const { data: examsData, refetch: refetchExams } = useQuery({
    queryKey: ['upcoming-exams'],
    queryFn: async () => {
      const res = await ApiClient.get('/exams');
      return res.data;
    },
    initialData: [],
  });

  const nextExam = examsData && examsData.length > 0 ? examsData[0] : null;

  const onRefresh = async () => {
    setRefreshing(true);
    HapticsService.light();
    await Promise.all([refetchProgress(), refetchExams()]);
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563EB" />}
      >
        {/* A. Header & Greeting */}
        <View style={styles.topBar}>
          <View>
            <Text style={[styles.dateText, { color: colors.textMuted }]}>{dateFormatted}</Text>
            <Text style={[styles.greetingText, { color: colors.text }]}>
              {greeting}, {user?.fullName?.split(' ')[0] || 'Scholar'} 👋
            </Text>
            {user?.courseName && (
              <Text style={[styles.courseSub, { color: '#2563EB' }]}>
                {user.courseName} • {user.semester || 'Academic Year'}
              </Text>
            )}
          </View>
          <TouchableOpacity
            style={[styles.avatarButton, { backgroundColor: '#DBEAFE', borderColor: '#BFDBFE' }]}
            onPress={() => router.push('/(tabs)/profile')}
          >
            <Ionicons name="person" size={20} color="#1D4ED8" />
          </TouchableOpacity>
        </View>

        {/* E. Daily Motivation Quote */}
        <MotivationalBanner quote={quoteData?.quote} author={quoteData?.author} />

        {/* B. Daily Overview Metrics */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Today's Overview</Text>
        </View>
        <View style={styles.statsGrid}>
          <StatCard
            title="Study Time"
            value={`${progressData?.todayHours || 0} hrs`}
            subtitle="Today's focused learning"
            icon="time-outline"
            iconColor="#2563EB"
            iconBg="#DBEAFE"
            badge="Focus"
            onPress={() => router.push('/tools/pomodoro')}
          />
          <StatCard
            title="Tasks Status"
            value={`${progressData?.completedTasks || 0} / ${(progressData?.completedTasks || 0) + (progressData?.pendingTasks || 0)}`}
            subtitle={`${progressData?.pendingTasks || 0} pending to complete`}
            icon="checkbox-outline"
            iconColor="#10B981"
            iconBg="#D1FAE5"
            badge="Daily"
            badgeColor="#10B981"
            onPress={() => router.push('/tools/todos')}
          />
          <StatCard
            title="Next Exam"
            value={nextExam ? `${nextExam.daysRemaining} days` : 'None'}
            subtitle={nextExam ? nextExam.title : 'No upcoming exam'}
            icon="alarm-outline"
            iconColor="#F59E0B"
            iconBg="#FEF3C7"
            badge="Countdown"
            badgeColor="#F59E0B"
            onPress={() => router.push('/tools/exams')}
          />
          <StatCard
            title="Attendance"
            value="82.5%"
            subtitle="Safe: Can miss 2 classes"
            icon="checkmark-done-circle-outline"
            iconColor="#8B5CF6"
            iconBg="#EDE9FE"
            badge="On Track"
            badgeColor="#8B5CF6"
            onPress={() => router.push('/tools/attendance')}
          />
        </View>

        {/* D. Study Progress & Streak */}
        <WeeklyChart
          chartData={progressData?.chartData || []}
          streak={progressData?.studyStreak || 1}
          productivityScore={progressData?.productivityScore || 80}
        />

        {/* C. Quick Tools Grid */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Academic Tools</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/tools')}>
            <Text style={styles.seeAll}>All Tools →</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.quickToolsGrid}>
          <QuickToolButton
            title="CGPA"
            subtitle="Calculator"
            icon="calculator-outline"
            color="#2563EB"
            bgColor="#DBEAFE"
            onPress={() => router.push('/tools/cgpa')}
          />
          <QuickToolButton
            title="Attendance"
            subtitle="Calculator"
            icon="school-outline"
            color="#10B981"
            bgColor="#D1FAE5"
            onPress={() => router.push('/tools/attendance')}
          />
          <QuickToolButton
            title="Pomodoro"
            subtitle="Timer"
            icon="timer-outline"
            color="#EF4444"
            bgColor="#FEE2E2"
            onPress={() => router.push('/tools/pomodoro')}
          />
          <QuickToolButton
            title="Notes"
            subtitle="Manager"
            icon="document-text-outline"
            color="#F59E0B"
            bgColor="#FEF3C7"
            onPress={() => router.push('/(tabs)/notes')}
          />
          <QuickToolButton
            title="To-Do List"
            subtitle="Planner"
            icon="list-outline"
            color="#8B5CF6"
            bgColor="#EDE9FE"
            onPress={() => router.push('/tools/todos')}
          />
          <QuickToolButton
            title="Exams"
            subtitle="Countdown"
            icon="hourglass-outline"
            color="#EC4899"
            bgColor="#FCE7F3"
            onPress={() => router.push('/tools/exams')}
          />
          <QuickToolButton
            title="PDF Tools"
            subtitle="Merge/Split"
            icon="layers-outline"
            color="#06B6D4"
            bgColor="#CFFAFE"
            onPress={() => router.push('/tools/pdf')}
          />
          <QuickToolButton
            title="Quiz AI"
            subtitle="Generator"
            icon="bulb-outline"
            color="#6366F1"
            bgColor="#EEF2FF"
            onPress={() => router.push('/tools/quiz')}
          />
        </View>

        {/* F. Google AdMob Adaptive Banner */}
        <AdBanner placement="Home Dashboard Footer" />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 8,
    paddingBottom: 24,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    marginBottom: 8,
  },
  dateText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  greetingText: {
    fontSize: 22,
    fontWeight: '900',
    marginTop: 2,
  },
  courseSub: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  avatarButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    marginTop: 14,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  seeAll: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563EB',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 10,
  },
  quickToolsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 4,
  },
});
