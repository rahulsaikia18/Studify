import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../stores/authStore';
import { useThemeStore } from '../../stores/themeStore';
import { HapticsService } from '../../services/HapticsService';
import { ApiClient } from '../../services/api';
import { RewardedAdModal } from '../../components/RewardedAdModal';
import { AdReward } from '../../services/AdManager';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { mode: themeMode, setThemeMode, colors, isDark } = useThemeStore();

  const [notifications, setNotifications] = useState({
    studyReminders: true,
    examAlerts: true,
    taskReminders: true,
    pomodoroSound: true,
  });

  const [isRewardModalVisible, setIsRewardModalVisible] = useState(false);
  const [unlockedPerk, setUnlockedPerk] = useState(false);

  const toggleNotification = (key: keyof typeof notifications) => {
    HapticsService.light();
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleExportData = async () => {
    HapticsService.medium();
    try {
      const data = await ApiClient.get('/users/export');
      Alert.alert(
        'Data Export Ready',
        `Your study profile, notes, attendance records, and CGPA history have been prepared.\n\nSummary:\n- User: ${user?.fullName}\n- Email: ${user?.email}\n- Date: ${new Date().toLocaleDateString()}`,
        [{ text: 'OK' }]
      );
    } catch {
      Alert.alert('Export Notice', 'Data export is available while connected to the Student Buddy server.');
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action is permanent and deletes all your study notes, calculations, and progress.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Permanently',
          style: 'destructive',
          onPress: async () => {
            try {
              await ApiClient.delete('/users/account');
            } catch {}
            await logout();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>Profile & Settings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* User Card */}
        <View style={[styles.userCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarInitial}>{user?.fullName?.charAt(0) || 'S'}</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={[styles.userName, { color: colors.text }]}>{user?.fullName || 'Student User'}</Text>
            <Text style={[styles.userEmail, { color: colors.textMuted }]}>{user?.email || 'student@buddy.edu'}</Text>
            <View style={styles.metaRow}>
              <View style={styles.levelBadge}>
                <Text style={styles.levelText}>{user?.educationLevel || 'University'}</Text>
              </View>
              {user?.semester && (
                <Text style={[styles.semesterText, { color: colors.textMuted }]}>• {user.semester}</Text>
              )}
            </View>
          </View>
        </View>

        {/* Academic Details Section */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Academic Information</Text>
        <View style={[styles.settingGroup, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.settingRow}>
            <Text style={[styles.settingLabel, { color: colors.textMuted }]}>Institution</Text>
            <Text style={[styles.settingValue, { color: colors.text }]}>{user?.institution || 'Not set'}</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.settingRow}>
            <Text style={[styles.settingLabel, { color: colors.textMuted }]}>Course / Program</Text>
            <Text style={[styles.settingValue, { color: colors.text }]}>{user?.courseName || 'B.Tech CS'}</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.settingRow}>
            <Text style={[styles.settingLabel, { color: colors.textMuted }]}>Academic Goal</Text>
            <Text style={[styles.settingValue, { color: colors.text, flex: 1, textAlign: 'right' }]} numberOfLines={2}>
              {user?.academicGoals || 'Achieve high marks and maintain consistency'}
            </Text>
          </View>
        </View>

        {/* Theme Settings */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Appearance & Theme</Text>
        <View style={[styles.settingGroup, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.themeSelector}>
            {(['light', 'dark', 'system'] as const).map((t) => {
              const isSelected = themeMode === t;
              return (
                <TouchableOpacity
                  key={t}
                  style={[
                    styles.themeOption,
                    isSelected && { backgroundColor: '#2563EB', borderColor: '#2563EB' },
                    !isSelected && { borderColor: colors.border },
                  ]}
                  onPress={() => {
                    HapticsService.light();
                    setThemeMode(t);
                  }}
                >
                  <Ionicons
                    name={t === 'light' ? 'sunny-outline' : t === 'dark' ? 'moon-outline' : 'phone-portrait-outline'}
                    size={18}
                    color={isSelected ? '#FFFFFF' : colors.text}
                  />
                  <Text style={[styles.themeText, { color: isSelected ? '#FFFFFF' : colors.text }]}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Rewarded Perks Card */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Bonus Student Perks</Text>
        <View style={[styles.perkCard, { backgroundColor: isDark ? '#1E293B' : '#EFF6FF', borderColor: '#BFDBFE' }]}>
          <View style={styles.perkHeader}>
            <View style={styles.perkIconBg}>
              <Ionicons name="sparkles" size={20} color="#2563EB" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.perkTitle, { color: colors.text }]}>
                {unlockedPerk ? '✨ 24h Pro Analytics Active' : 'Unlock Extra Practice & Analytics'}
              </Text>
              <Text style={[styles.perkSub, { color: colors.textMuted }]}>
                {unlockedPerk
                  ? 'Your rewarded perk is active! Unlimited access enabled.'
                  : 'Optional: watch a short sponsor video to unlock 24-hour bonus perks.'}
              </Text>
            </View>
          </View>
          {!unlockedPerk && (
            <TouchableOpacity
              style={styles.perkButton}
              onPress={() => setIsRewardModalVisible(true)}
            >
              <Text style={styles.perkButtonText}>Watch Sponsor Video to Unlock</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Notification Preferences */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Notifications</Text>
        <View style={[styles.settingGroup, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.switchRow}>
            <View>
              <Text style={[styles.switchLabel, { color: colors.text }]}>Study Reminders</Text>
              <Text style={[styles.switchSub, { color: colors.textMuted }]}>Alerts for scheduled study sessions</Text>
            </View>
            <Switch
              value={notifications.studyReminders}
              onValueChange={() => toggleNotification('studyReminders')}
              trackColor={{ false: '#94A3B8', true: '#2563EB' }}
            />
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.switchRow}>
            <View>
              <Text style={[styles.switchLabel, { color: colors.text }]}>Exam Alerts</Text>
              <Text style={[styles.switchSub, { color: colors.textMuted }]}>Countdown notifications before tests</Text>
            </View>
            <Switch
              value={notifications.examAlerts}
              onValueChange={() => toggleNotification('examAlerts')}
              trackColor={{ false: '#94A3B8', true: '#2563EB' }}
            />
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.switchRow}>
            <View>
              <Text style={[styles.switchLabel, { color: colors.text }]}>Pomodoro Haptics & Sound</Text>
              <Text style={[styles.switchSub, { color: colors.textMuted }]}>Ring bell & vibrate on interval end</Text>
            </View>
            <Switch
              value={notifications.pomodoroSound}
              onValueChange={() => toggleNotification('pomodoroSound')}
              trackColor={{ false: '#94A3B8', true: '#2563EB' }}
            />
          </View>
        </View>

        {/* Data & Privacy */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Data & Compliance</Text>
        <View style={[styles.settingGroup, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <TouchableOpacity style={styles.navRow} onPress={handleExportData}>
            <View style={styles.navRowLeft}>
              <Ionicons name="download-outline" size={20} color="#2563EB" style={{ marginRight: 10 }} />
              <Text style={[styles.navRowText, { color: colors.text }]}>Export All Student Data (JSON)</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <TouchableOpacity style={styles.navRow} onPress={() => router.push('/settings/privacy')}>
            <View style={styles.navRowLeft}>
              <Ionicons name="shield-checkmark-outline" size={20} color="#10B981" style={{ marginRight: 10 }} />
              <Text style={[styles.navRowText, { color: colors.text }]}>Privacy Policy & AdMob Disclosures</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Actions */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={18} color="#2563EB" style={{ marginRight: 6 }} />
            <Text style={styles.logoutText}>Sign Out</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.deleteBtn} onPress={handleDeleteAccount}>
            <Ionicons name="trash-outline" size={18} color="#EF4444" style={{ marginRight: 6 }} />
            <Text style={styles.deleteText}>Delete Account</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.versionText, { color: colors.textMuted }]}>
          Student Buddy v1.0.0 • Production Build
        </Text>
      </ScrollView>

      {/* Rewarded Ad Dialog */}
      <RewardedAdModal
        visible={isRewardModalVisible}
        rewardType="PREMIUM_UNLOCK_24H"
        onClose={() => setIsRewardModalVisible(false)}
        onRewardEarned={(reward: AdReward) => {
          setUnlockedPerk(true);
          Alert.alert('Perk Unlocked!', 'Congratulations! 24-hour bonus analytics and extra practice sets are now active.');
        }}
      />
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
  scrollContent: { padding: 16, paddingBottom: 40 },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 16,
  },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarInitial: { color: '#FFFFFF', fontSize: 24, fontWeight: '800' },
  userInfo: { flex: 1 },
  userName: { fontSize: 18, fontWeight: '800' },
  userEmail: { fontSize: 13, marginTop: 2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 6 },
  levelBadge: { backgroundColor: '#DBEAFE', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  levelText: { color: '#1D4ED8', fontSize: 11, fontWeight: '700' },
  semesterText: { fontSize: 11 },
  sectionTitle: { fontSize: 14, fontWeight: '800', marginTop: 14, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  settingGroup: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 4,
    marginBottom: 6,
  },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  settingLabel: { fontSize: 13, fontWeight: '600' },
  settingValue: { fontSize: 13, fontWeight: '700' },
  divider: { height: 1, width: '100%' },
  themeSelector: { flexDirection: 'row', gap: 8, paddingVertical: 10 },
  themeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  themeText: { fontSize: 12, fontWeight: '700' },
  perkCard: { padding: 14, borderRadius: 16, borderWidth: 1, marginBottom: 6 },
  perkHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  perkIconBg: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#DBEAFE', alignItems: 'center', justifyContent: 'center' },
  perkTitle: { fontSize: 14, fontWeight: '800' },
  perkSub: { fontSize: 12, marginTop: 2, lineHeight: 16 },
  perkButton: { backgroundColor: '#2563EB', paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  perkButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  switchLabel: { fontSize: 14, fontWeight: '700' },
  switchSub: { fontSize: 11, marginTop: 2 },
  navRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14 },
  navRowLeft: { flexDirection: 'row', alignItems: 'center' },
  navRowText: { fontSize: 13, fontWeight: '600' },
  actionButtons: { marginTop: 20, gap: 10 },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#3B82F6',
    borderRadius: 14,
    height: 46,
  },
  logoutText: { fontSize: 14, fontWeight: '700', color: '#2563EB' },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
    borderRadius: 14,
    height: 46,
  },
  deleteText: { fontSize: 14, fontWeight: '700', color: '#EF4444' },
  versionText: { textAlign: 'center', fontSize: 11, marginTop: 20 },
});
