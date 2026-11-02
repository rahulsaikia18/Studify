import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../stores/authStore';
import { useThemeStore } from '../../stores/themeStore';
import { HapticsService } from '../../services/HapticsService';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuthStore();
  const { colors, isDark } = useThemeStore();

  const [email, setEmail] = useState('student@buddy.edu');
  const [password, setPassword] = useState('Password123!');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email || !password) {
      setErrorMsg('Please enter both email and password');
      return;
    }

    HapticsService.light();
    setLoading(true);
    setErrorMsg(null);

    try {
      await login(email, password);
      router.replace('/(tabs)');
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = async () => {
    setEmail('student@buddy.edu');
    setPassword('Password123!');
    HapticsService.medium();
    setLoading(true);
    try {
      await login('student@buddy.edu', 'Password123!');
      router.replace('/(tabs)');
    } catch (e: any) {
      setErrorMsg(e.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    Alert.alert(
      'Reset Password',
      'A reset code has been sent to your student email. For demo purposes, use code: STUDENT-8842',
      [{ text: 'OK' }]
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* App Logo & Header */}
        <View style={styles.header}>
          <View style={styles.logoBadge}>
            <Ionicons name="school" size={40} color="#2563EB" />
          </View>
          <Text style={[styles.appName, { color: colors.text }]}>Studify</Text>
          <Text style={[styles.tagline, { color: colors.textMuted }]}>
            Your all-in-one academic productivity companion
          </Text>
        </View>

        {/* Card Form */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Welcome Back</Text>
          <Text style={[styles.cardSub, { color: colors.textMuted }]}>
            Sign in to continue your study journey
          </Text>

          {errorMsg && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={18} color="#EF4444" style={{ marginRight: 6 }} />
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          )}

          {/* Email input */}
          <Text style={[styles.label, { color: colors.text }]}>Email Address</Text>
          <View style={[styles.inputWrapper, { backgroundColor: isDark ? '#111827' : '#F8FAFC', borderColor: colors.border }]}>
            <Ionicons name="mail-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="e.g. alex@university.edu"
              placeholderTextColor={colors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          {/* Password input */}
          <View style={styles.passwordHeader}>
            <Text style={[styles.label, { color: colors.text }]}>Password</Text>
            <TouchableOpacity onPress={handleForgotPassword}>
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>
          </View>
          <View style={[styles.inputWrapper, { backgroundColor: isDark ? '#111827' : '#F8FAFC', borderColor: colors.border }]}>
            <Ionicons name="lock-closed-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="••••••••"
              placeholderTextColor={colors.textMuted}
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
              <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Login Button */}
          <TouchableOpacity
            style={[styles.loginBtn, loading && styles.btnDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.loginBtnText}>Sign In</Text>
            )}
          </TouchableOpacity>

          {/* 1-Tap Demo Button */}
          <TouchableOpacity
            style={[styles.demoBtn, { borderColor: '#3B82F6', backgroundColor: isDark ? '#1E293B' : '#EFF6FF' }]}
            onPress={handleQuickDemoLogin}
            disabled={loading}
          >
            <Ionicons name="flash" size={16} color="#3B82F6" style={{ marginRight: 6 }} />
            <Text style={styles.demoBtnText}>1-Tap Demo Student Login</Text>
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            <Text style={[styles.dividerText, { color: colors.textMuted }]}>OR</Text>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          </View>

          {/* Google Sign-In */}
          <TouchableOpacity
            style={[styles.googleBtn, { borderColor: colors.border }]}
            onPress={() => {
              handleQuickDemoLogin();
            }}
          >
            <Ionicons name="logo-google" size={18} color="#EA4335" style={{ marginRight: 8 }} />
            <Text style={[styles.googleText, { color: colors.text }]}>Sign in with Google</Text>
          </TouchableOpacity>
        </View>

        {/* Footer Register link */}
        <View style={styles.footerRow}>
          <Text style={[styles.footerText, { color: colors.textMuted }]}>Don't have an account?</Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
            <Text style={styles.registerLink}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoBadge: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  appName: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 13,
    marginTop: 4,
    textAlign: 'center',
  },
  card: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  cardSub: {
    fontSize: 13,
    marginTop: 4,
    marginBottom: 18,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    padding: 10,
    borderRadius: 12,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    flex: 1,
    fontWeight: '600',
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
  },
  passwordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  forgotText: {
    fontSize: 12,
    color: '#2563EB',
    fontWeight: '600',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 48,
    marginBottom: 10,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
  },
  eyeBtn: {
    padding: 6,
  },
  loginBtn: {
    backgroundColor: '#2563EB',
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  loginBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  demoBtn: {
    flexDirection: 'row',
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  demoBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2563EB',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 18,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 11,
    fontWeight: '700',
    marginHorizontal: 10,
  },
  googleBtn: {
    flexDirection: 'row',
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleText: {
    fontSize: 13,
    fontWeight: '600',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
    gap: 6,
  },
  footerText: {
    fontSize: 13,
  },
  registerLink: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2563EB',
  },
});
