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
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../stores/authStore';
import { useThemeStore } from '../../stores/themeStore';
import { HapticsService } from '../../services/HapticsService';

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuthStore();
  const { colors, isDark } = useThemeStore();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleNext = async () => {
    if (!fullName.trim() || !email.trim() || !password) {
      setErrorMsg('Please fill in all required fields.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    HapticsService.light();
    // Navigate to onboarding with credentials
    router.push({
      pathname: '/(auth)/onboarding',
      params: { fullName, email, password },
    });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Create Account</Text>
          <Text style={[styles.sub, { color: colors.textMuted }]}>
            Join thousands of students boosting their academic grades
          </Text>
        </View>

        {/* Card Form */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {errorMsg && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={18} color="#EF4444" style={{ marginRight: 6 }} />
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          )}

          <Text style={[styles.label, { color: colors.text }]}>Full Name *</Text>
          <View style={[styles.inputWrapper, { backgroundColor: isDark ? '#111827' : '#F8FAFC', borderColor: colors.border }]}>
            <Ionicons name="person-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="e.g. Alex Johnson"
              placeholderTextColor={colors.textMuted}
              value={fullName}
              onChangeText={setFullName}
            />
          </View>

          <Text style={[styles.label, { color: colors.text, marginTop: 12 }]}>Email Address *</Text>
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

          <Text style={[styles.label, { color: colors.text, marginTop: 12 }]}>Password *</Text>
          <View style={[styles.inputWrapper, { backgroundColor: isDark ? '#111827' : '#F8FAFC', borderColor: colors.border }]}>
            <Ionicons name="lock-closed-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="At least 6 characters"
              placeholderTextColor={colors.textMuted}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>

          <TouchableOpacity style={styles.continueBtn} onPress={handleNext}>
            <Text style={styles.continueBtnText}>Continue to Student Profile</Text>
            <Ionicons name="arrow-forward" size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
          </TouchableOpacity>
        </View>

        <View style={styles.footerRow}>
          <Text style={[styles.footerText, { color: colors.textMuted }]}>Already have an account?</Text>
          <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
            <Text style={styles.loginLink}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {
    padding: 24,
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  header: { marginBottom: 24 },
  title: { fontSize: 26, fontWeight: '800' },
  sub: { fontSize: 13, marginTop: 6, lineHeight: 18 },
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
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    padding: 10,
    borderRadius: 12,
    marginBottom: 16,
  },
  errorText: { fontSize: 12, color: '#EF4444', flex: 1, fontWeight: '600' },
  label: { fontSize: 13, fontWeight: '700', marginBottom: 6 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 48,
  },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, fontSize: 14 },
  continueBtn: {
    backgroundColor: '#2563EB',
    height: 48,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  continueBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
    gap: 6,
  },
  footerText: { fontSize: 13 },
  loginLink: { fontSize: 13, fontWeight: '700', color: '#2563EB' },
});
