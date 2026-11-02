import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useThemeStore } from '../stores/themeStore';
import { useAuthStore } from '../stores/authStore';
import { useTimerStore } from '../stores/timerStore';
import { AppState, AppStateStatus, View, ActivityIndicator } from 'react-native';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const { initTheme, isDark } = useThemeStore();
  const { initAuth, isAuthenticated, isLoading } = useAuthStore();
  const { syncBackgroundTime, tick, isRunning } = useTimerStore();

  useEffect(() => {
    initTheme();
    initAuth();
  }, []);

  // Strict Auth Guard: Never bypass authentication
  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      // User is not authenticated -> redirect to login immediately
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      // Authenticated user on login/register -> redirect to main app
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isLoading, segments]);

  // Listen for AppState changes to guarantee background Pomodoro accuracy
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        syncBackgroundTime();
      }
    });
    return () => subscription.remove();
  }, []);

  // Timer 1-second interval loop
  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      tick();
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning]);

  if (isLoading) {
    return (
      <SafeAreaProvider>
        <View style={{ flex: 1, backgroundColor: isDark ? '#0F172A' : '#F8FAFC', alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="tools/cgpa"
            options={{
              headerShown: true,
              title: 'CGPA & SGPA Calculator',
              headerBackTitle: 'Back',
            }}
          />
          <Stack.Screen
            name="tools/attendance"
            options={{
              headerShown: true,
              title: 'Attendance Calculator',
              headerBackTitle: 'Back',
            }}
          />
          <Stack.Screen
            name="tools/pomodoro"
            options={{
              headerShown: true,
              title: 'Pomodoro Focus Timer',
              headerBackTitle: 'Back',
            }}
          />
          <Stack.Screen
            name="tools/todos"
            options={{
              headerShown: true,
              title: 'To-Do Manager',
              headerBackTitle: 'Back',
            }}
          />
          <Stack.Screen
            name="tools/exams"
            options={{
              headerShown: true,
              title: 'Exam Countdown',
              headerBackTitle: 'Back',
            }}
          />
          <Stack.Screen
            name="tools/pdf"
            options={{
              headerShown: true,
              title: 'PDF Tools & Optimizer',
              headerBackTitle: 'Back',
            }}
          />
          <Stack.Screen
            name="tools/quiz"
            options={{
              headerShown: true,
              title: 'Quiz Generator',
              headerBackTitle: 'Back',
            }}
          />
          <Stack.Screen
            name="settings/privacy"
            options={{
              headerShown: true,
              title: 'Privacy & Ad Policies',
              headerBackTitle: 'Back',
            }}
          />
        </Stack>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
