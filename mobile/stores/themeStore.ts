import { create } from 'zustand';
import { Storage } from '../services/Storage';
import { Palette } from '../constants/Colors';
import { useColorScheme } from 'react-native';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeState {
  mode: ThemeMode;
  isDark: boolean;
  colors: typeof Palette.light;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  initTheme: () => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  mode: 'system',
  isDark: false,
  colors: Palette.light,

  initTheme: async () => {
    const saved = await Storage.getItem<ThemeMode>('sb_theme_mode');
    const mode = saved || 'system';
    const isDark = mode === 'dark';
    set({
      mode,
      isDark,
      colors: isDark ? Palette.dark : Palette.light,
    });
  },

  setThemeMode: async (mode) => {
    await Storage.setItem('sb_theme_mode', mode);
    const isDark = mode === 'dark';
    set({
      mode,
      isDark,
      colors: isDark ? Palette.dark : Palette.light,
    });
  },
}));
