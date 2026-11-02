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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useThemeStore } from '../../stores/themeStore';
import { useTimerStore, PomodoroMode } from '../../stores/timerStore';
import { CircularProgress } from '../../components/CircularProgress';
import { HapticsService } from '../../services/HapticsService';
import { ApiClient } from '../../services/api';
import { AdBanner } from '../../components/AdBanner';

export default function PomodoroScreen() {
  const { colors, isDark } = useThemeStore();
  const {
    mode,
    timeLeftSeconds,
    isRunning,
    cyclesCompleted,
    settings,
    startTimer,
    pauseTimer,
    resetTimer,
    switchMode,
    updateSettings,
  } = useTimerStore();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [focusInput, setFocusInput] = useState(settings.focusDuration.toString());
  const [shortBreakInput, setShortBreakInput] = useState(settings.shortBreakDuration.toString());
  const [longBreakInput, setLongBreakInput] = useState(settings.longBreakDuration.toString());

  // Fetch Pomodoro Stats
  const { data: statsData } = useQuery({
    queryKey: ['pomodoro-stats'],
    queryFn: async () => {
      const res = await ApiClient.get('/pomodoro/stats');
      return res.data;
    },
  });

  const minutes = Math.floor(timeLeftSeconds / 60);
  const seconds = timeLeftSeconds % 60;
  const timeFormatted = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  const totalSessionSeconds =
    mode === 'FOCUS'
      ? settings.focusDuration * 60
      : mode === 'SHORT_BREAK'
      ? settings.shortBreakDuration * 60
      : settings.longBreakDuration * 60;

  const progress = 1 - timeLeftSeconds / (totalSessionSeconds || 1);

  const getModeColor = () => {
    if (mode === 'FOCUS') return '#EF4444';
    if (mode === 'SHORT_BREAK') return '#10B981';
    return '#3B82F6';
  };

  const handleSaveSettings = () => {
    updateSettings({
      focusDuration: parseInt(focusInput, 10) || 25,
      shortBreakDuration: parseInt(shortBreakInput, 10) || 5,
      longBreakDuration: parseInt(longBreakInput, 10) || 15,
    });
    setIsSettingsOpen(false);
  };

  return (
    <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={styles.scrollContent}>
      {/* Mode Selector Chips */}
      <View style={[styles.modeBar, { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' }]}>
        {(['FOCUS', 'SHORT_BREAK', 'LONG_BREAK'] as PomodoroMode[]).map((m) => {
          const isSelected = mode === m;
          const label = m === 'FOCUS' ? 'Focus (25m)' : m === 'SHORT_BREAK' ? 'Short Break' : 'Long Break';
          return (
            <TouchableOpacity
              key={m}
              style={[styles.modeTab, isSelected && [styles.activeModeTab, { backgroundColor: colors.card }]]}
              onPress={() => {
                HapticsService.light();
                switchMode(m);
              }}
            >
              <Text
                style={[
                  styles.modeTabText,
                  { color: isSelected ? getModeColor() : colors.textMuted },
                ]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Circular Timer Ring */}
      <View style={styles.timerContainer}>
        <CircularProgress
          size={260}
          strokeWidth={14}
          progress={progress}
          color={getModeColor()}
          backgroundColor={isDark ? '#1E293B' : '#E2E8F0'}
        >
          <View style={styles.timerInner}>
            <Text style={[styles.timerDigits, { color: colors.text }]}>{timeFormatted}</Text>
            <Text style={[styles.modeLabel, { color: getModeColor() }]}>
              {mode === 'FOCUS' ? 'STAY FOCUSED' : 'REST & RECHARGE'}
            </Text>
            <View style={styles.cycleBadge}>
              <Ionicons name="flame" size={12} color="#F59E0B" />
              <Text style={styles.cycleText}>Cycle #{cyclesCompleted + 1}</Text>
            </View>
          </View>
        </CircularProgress>
      </View>

      {/* Control Buttons */}
      <View style={styles.controlsRow}>
        <TouchableOpacity
          style={[styles.controlSecondaryBtn, { borderColor: colors.border }]}
          onPress={() => {
            HapticsService.light();
            resetTimer();
          }}
        >
          <Ionicons name="refresh" size={22} color={colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.playBtn, { backgroundColor: getModeColor() }]}
          onPress={() => {
            if (isRunning) {
              pauseTimer();
            } else {
              startTimer();
            }
          }}
        >
          <Ionicons name={isRunning ? 'pause' : 'play'} size={32} color="#FFFFFF" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlSecondaryBtn, { borderColor: colors.border }]}
          onPress={() => setIsSettingsOpen(true)}
        >
          <Ionicons name="options-outline" size={22} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Today's Focus Stats */}
      <View style={[styles.statsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.statsTitle, { color: colors.text }]}>Focus Activity Statistics</Text>
        <View style={styles.statsRow}>
          <View style={styles.statCol}>
            <Text style={[styles.statVal, { color: '#EF4444' }]}>
              {statsData?.todayFocusMinutes || 0}m
            </Text>
            <Text style={[styles.statLbl, { color: colors.textMuted }]}>Today's Focus</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statCol}>
            <Text style={[styles.statVal, { color: '#2563EB' }]}>
              {statsData?.todaySessionsCount || 0}
            </Text>
            <Text style={[styles.statLbl, { color: colors.textMuted }]}>Sessions Done</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statCol}>
            <Text style={[styles.statVal, { color: '#10B981' }]}>
              {Math.round((statsData?.totalFocusMinutes || 0) / 60 * 10) / 10}h
            </Text>
            <Text style={[styles.statLbl, { color: colors.textMuted }]}>All-Time Focus</Text>
          </View>
        </View>
      </View>

      <AdBanner placement="Pomodoro Screen Footer" />

      {/* Timer Settings Modal */}
      <Modal visible={isSettingsOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.card }]}>
            <View style={styles.modalTopRow}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Custom Timer Settings</Text>
              <TouchableOpacity onPress={() => setIsSettingsOpen(false)}>
                <Ionicons name="close" size={24} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={styles.settingField}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>Focus Duration (minutes)</Text>
              <TextInput
                style={[styles.settingInput, { color: colors.text, borderColor: colors.border }]}
                keyboardType="numeric"
                value={focusInput}
                onChangeText={setFocusInput}
              />
            </View>

            <View style={styles.settingField}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>Short Break (minutes)</Text>
              <TextInput
                style={[styles.settingInput, { color: colors.text, borderColor: colors.border }]}
                keyboardType="numeric"
                value={shortBreakInput}
                onChangeText={setShortBreakInput}
              />
            </View>

            <View style={styles.settingField}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>Long Break (minutes)</Text>
              <TextInput
                style={[styles.settingInput, { color: colors.text, borderColor: colors.border }]}
                keyboardType="numeric"
                value={longBreakInput}
                onChangeText={setLongBreakInput}
              />
            </View>

            <TouchableOpacity style={styles.saveSettingsBtn} onPress={handleSaveSettings}>
              <Text style={styles.saveSettingsText}>Apply Settings</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scrollContent: { padding: 18, alignItems: 'center', paddingBottom: 36 },
  modeBar: {
    flexDirection: 'row',
    borderRadius: 14,
    padding: 3,
    marginBottom: 24,
    width: '100%',
  },
  modeTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 12,
  },
  activeModeTab: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 2, elevation: 2 },
  modeTabText: { fontSize: 12, fontWeight: '700' },
  timerContainer: {
    marginVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerDigits: {
    fontSize: 54,
    fontWeight: '900',
    letterSpacing: -1,
  },
  modeLabel: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: 2,
  },
  cycleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 3,
    marginTop: 8,
  },
  cycleText: { fontSize: 11, fontWeight: '700', color: '#D97706' },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    marginVertical: 20,
    width: '100%',
  },
  controlSecondaryBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playBtn: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  statsCard: {
    width: '100%',
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginTop: 10,
    marginBottom: 10,
  },
  statsTitle: { fontSize: 14, fontWeight: '800', marginBottom: 12 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  statCol: { flex: 1, alignItems: 'center' },
  statVal: { fontSize: 20, fontWeight: '900' },
  statLbl: { fontSize: 11, fontWeight: '600', marginTop: 2 },
  statDivider: { width: 1, height: '70%', alignSelf: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 36 },
  modalTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '800' },
  settingField: { marginBottom: 14 },
  settingLabel: { fontSize: 13, fontWeight: '700', marginBottom: 6 },
  settingInput: { borderWidth: 1, borderRadius: 12, height: 46, paddingHorizontal: 12, fontSize: 15, fontWeight: '700' },
  saveSettingsBtn: { backgroundColor: '#2563EB', height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  saveSettingsText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});
