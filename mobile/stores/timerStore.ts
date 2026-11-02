import { create } from 'zustand';
import { HapticsService } from '../services/HapticsService';
import { NotificationService } from '../services/NotificationService';
import { ApiClient } from '../services/api';
import { AppState, AppStateStatus } from 'react-native';

export type PomodoroMode = 'FOCUS' | 'SHORT_BREAK' | 'LONG_BREAK';

interface TimerSettings {
  focusDuration: number;     // in minutes (default 25)
  shortBreakDuration: number; // in minutes (default 5)
  longBreakDuration: number;  // in minutes (default 15)
  longBreakInterval: number;  // cycles before long break (default 4)
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

interface TimerState {
  mode: PomodoroMode;
  timeLeftSeconds: number;
  isRunning: boolean;
  cyclesCompleted: number;
  targetEndTime: number | null;
  settings: TimerSettings;
  sessionStartTime: string | null;

  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;
  switchMode: (mode: PomodoroMode) => void;
  tick: () => void;
  updateSettings: (newSettings: Partial<TimerSettings>) => void;
  syncBackgroundTime: () => void;
  completeSession: () => Promise<void>;
}

const DEFAULT_SETTINGS: TimerSettings = {
  focusDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  longBreakInterval: 4,
  soundEnabled: true,
  vibrationEnabled: true,
};

export const useTimerStore = create<TimerState>((set, get) => ({
  mode: 'FOCUS',
  timeLeftSeconds: 25 * 60,
  isRunning: false,
  cyclesCompleted: 0,
  targetEndTime: null,
  settings: DEFAULT_SETTINGS,
  sessionStartTime: null,

  startTimer: () => {
    const { timeLeftSeconds, isRunning, mode, settings } = get();
    if (isRunning) return;

    const now = Date.now();
    const targetEndTime = now + timeLeftSeconds * 1000;

    if (settings.vibrationEnabled) {
      HapticsService.medium();
    }

    if (mode === 'FOCUS') {
      NotificationService.schedulePomodoroDone(Math.ceil(timeLeftSeconds / 60));
    }

    set({
      isRunning: true,
      targetEndTime,
      sessionStartTime: get().sessionStartTime || new Date().toISOString(),
    });
  },

  pauseTimer: () => {
    const { targetEndTime, settings } = get();
    if (!targetEndTime) return;

    const remainingMs = Math.max(0, targetEndTime - Date.now());
    const timeLeftSeconds = Math.ceil(remainingMs / 1000);

    if (settings.vibrationEnabled) {
      HapticsService.light();
    }

    set({
      isRunning: false,
      targetEndTime: null,
      timeLeftSeconds,
    });
  },

  resetTimer: () => {
    const { mode, settings } = get();
    let seconds = settings.focusDuration * 60;
    if (mode === 'SHORT_BREAK') seconds = settings.shortBreakDuration * 60;
    if (mode === 'LONG_BREAK') seconds = settings.longBreakDuration * 60;

    set({
      isRunning: false,
      targetEndTime: null,
      timeLeftSeconds: seconds,
      sessionStartTime: null,
    });
  },

  switchMode: (mode: PomodoroMode) => {
    const { settings } = get();
    let seconds = settings.focusDuration * 60;
    if (mode === 'SHORT_BREAK') seconds = settings.shortBreakDuration * 60;
    if (mode === 'LONG_BREAK') seconds = settings.longBreakDuration * 60;

    set({
      mode,
      isRunning: false,
      targetEndTime: null,
      timeLeftSeconds: seconds,
      sessionStartTime: null,
    });
  },

  tick: () => {
    const { isRunning, targetEndTime, completeSession } = get();
    if (!isRunning || !targetEndTime) return;

    const remainingMs = targetEndTime - Date.now();
    if (remainingMs <= 0) {
      set({ timeLeftSeconds: 0 });
      completeSession();
    } else {
      set({ timeLeftSeconds: Math.ceil(remainingMs / 1000) });
    }
  },

  syncBackgroundTime: () => {
    const { isRunning, targetEndTime, completeSession } = get();
    if (!isRunning || !targetEndTime) return;

    const remainingMs = targetEndTime - Date.now();
    if (remainingMs <= 0) {
      set({ timeLeftSeconds: 0 });
      completeSession();
    } else {
      set({ timeLeftSeconds: Math.ceil(remainingMs / 1000) });
    }
  },

  updateSettings: (newSettings) => {
    set((state) => {
      const merged = { ...state.settings, ...newSettings };
      let updatedSeconds = state.timeLeftSeconds;
      if (!state.isRunning) {
        if (state.mode === 'FOCUS') updatedSeconds = merged.focusDuration * 60;
        else if (state.mode === 'SHORT_BREAK') updatedSeconds = merged.shortBreakDuration * 60;
        else if (state.mode === 'LONG_BREAK') updatedSeconds = merged.longBreakDuration * 60;
      }
      return {
        settings: merged,
        timeLeftSeconds: updatedSeconds,
      };
    });
  },

  completeSession: async () => {
    const { mode, cyclesCompleted, settings, sessionStartTime } = get();

    if (settings.vibrationEnabled) {
      HapticsService.success();
    }

    // Log to backend if focus session completed
    if (mode === 'FOCUS') {
      try {
        await ApiClient.post('/pomodoro/log', {
          sessionType: 'FOCUS',
          durationMinutes: settings.focusDuration,
          completed: true,
          startedAt: sessionStartTime || new Date(Date.now() - settings.focusDuration * 60000).toISOString(),
          endedAt: new Date().toISOString(),
        });
      } catch (e) {
        console.warn('Failed to sync pomodoro log to server:', e);
      }
    }

    const nextCycles = mode === 'FOCUS' ? cyclesCompleted + 1 : cyclesCompleted;
    let nextMode: PomodoroMode = 'FOCUS';

    if (mode === 'FOCUS') {
      if (nextCycles % settings.longBreakInterval === 0) {
        nextMode = 'LONG_BREAK';
      } else {
        nextMode = 'SHORT_BREAK';
      }
    } else {
      nextMode = 'FOCUS';
    }

    let nextSeconds = settings.focusDuration * 60;
    if (nextMode === 'SHORT_BREAK') nextSeconds = settings.shortBreakDuration * 60;
    if (nextMode === 'LONG_BREAK') nextSeconds = settings.longBreakDuration * 60;

    set({
      mode: nextMode,
      isRunning: false,
      targetEndTime: null,
      timeLeftSeconds: nextSeconds,
      cyclesCompleted: nextCycles,
      sessionStartTime: null,
    });
  },
}));
