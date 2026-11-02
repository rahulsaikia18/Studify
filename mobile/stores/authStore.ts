import { create } from 'zustand';
import { Storage } from '../services/Storage';
import { ApiClient } from '../services/api';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  educationLevel?: string;
  institution?: string;
  courseName?: string;
  semester?: string;
  academicGoals?: string;
  theme?: string;
  notificationPrefs?: Record<string, boolean>;
}

interface AuthState {
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  hasCompletedOnboarding: boolean;
  initAuth: () => Promise<void>;
  setUser: (user: UserProfile | null) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: any) => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  logout: () => Promise<void>;
  setOnboardingCompleted: (completed: boolean) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  hasCompletedOnboarding: false,

  initAuth: async () => {
    try {
      const token = await Storage.getAccessToken();
      const onboardingStatus = await Storage.getItem<boolean>('sb_onboarding_done');

      if (!token) {
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          hasCompletedOnboarding: onboardingStatus ?? false,
        });
        return;
      }

      const res = await ApiClient.get('/users/profile');
      if (res.success && res.data) {
        set({
          user: res.data,
          isAuthenticated: true,
          isLoading: false,
          hasCompletedOnboarding: onboardingStatus ?? (res.data.educationLevel ? true : false),
        });
      } else {
        set({ user: null, isAuthenticated: false, isLoading: false });
      }
    } catch {
      // Offline fallback: load cached user profile
      const cached = await Storage.getItem<UserProfile>('sb_cached_user');
      if (cached) {
        set({ user: cached, isAuthenticated: true, isLoading: false });
      } else {
        set({ user: null, isAuthenticated: false, isLoading: false });
      }
    }
  },

  setUser: (user) => set({ user, isAuthenticated: !!user }),

  login: async (email, password) => {
    const res = await ApiClient.post('/auth/login', { email, password }, { skipAuth: true });
    if (res.success && res.data) {
      const { user, tokens } = res.data;
      await Storage.saveTokens(tokens.accessToken, tokens.refreshToken);
      await Storage.setItem('sb_cached_user', user);
      const isDone = !!(user.educationLevel || user.courseName);
      await Storage.setItem('sb_onboarding_done', isDone);
      set({ user, isAuthenticated: true, hasCompletedOnboarding: isDone });
    }
  },

  register: async (payload) => {
    const res = await ApiClient.post('/auth/register', payload, { skipAuth: true });
    if (res.success && res.data) {
      const { user, tokens } = res.data;
      await Storage.saveTokens(tokens.accessToken, tokens.refreshToken);
      await Storage.setItem('sb_cached_user', user);
      set({ user, isAuthenticated: true, hasCompletedOnboarding: true });
      await Storage.setItem('sb_onboarding_done', true);
    }
  },

  updateProfile: async (data) => {
    const res = await ApiClient.patch('/users/profile', data);
    if (res.success && res.data) {
      set({ user: res.data });
      await Storage.setItem('sb_cached_user', res.data);
    }
  },

  setOnboardingCompleted: async (completed) => {
    await Storage.setItem('sb_onboarding_done', completed);
    set({ hasCompletedOnboarding: completed });
  },

  logout: async () => {
    try {
      await ApiClient.post('/auth/logout');
    } catch {}
    await Storage.clearTokens();
    await Storage.removeItem('sb_cached_user');
    set({ user: null, isAuthenticated: false });
  },
}));
