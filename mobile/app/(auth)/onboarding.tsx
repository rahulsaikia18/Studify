import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../stores/authStore';
import { useThemeStore } from '../../stores/themeStore';
import { HapticsService } from '../../services/HapticsService';

const EDUCATION_LEVELS = ['School', 'College', 'University', 'Competitive Exam'];

export default function OnboardingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { register } = useAuthStore();
  const { colors, isDark } = useThemeStore();

  const [educationLevel, setEducationLevel] = useState('University');
  const [institution, setInstitution] = useState('');
  const [courseName, setCourseName] = useState('');
  const [semester, setSemester] = useState('Semester 1');
  const [academicGoals, setAcademicGoals] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFinish = async (skipOptional: boolean = false) => {
    HapticsService.medium();
    setLoading(true);
    setErrorMsg(null);

    const email = (params.email as string)?.trim().toLowerCase();
    const password = params.password as string;
    const fullName = (params.fullName as string)?.trim() || 'Student';

    if (!email || !password) {
      setErrorMsg('Account credentials missing. Please go back to the Register screen.');
      setLoading(false);
      return;
    }

    try {
      await register({
        fullName,
        email,
        password,
        educationLevel: skipOptional ? null : educationLevel,
        institution: skipOptional ? null : institution,
        courseName: skipOptional ? null : courseName,
        semester: skipOptional ? null : semester,
        academicGoals: skipOptional ? null : academicGoals,
      });

      router.replace('/(tabs)');
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.scrollContent}>
      {/* Skip button header */}
      <View style={styles.topRow}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleFinish(true)} disabled={loading}>
          <Text style={styles.skipText}>Skip for now</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Customize Your Study Experience</Text>
        <Text style={[styles.sub, { color: colors.textMuted }]}>
          Help Studify personalize your tools, calculators, and reminders.
        </Text>
      </View>

      {errorMsg && (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle" size={18} color="#EF4444" style={{ marginRight: 6 }} />
          <Text style={styles.errorText}>{errorMsg}</Text>
        </View>
      )}

      {/* Education Level Selector */}
      <Text style={[styles.label, { color: colors.text }]}>Education Level</Text>
      <View style={styles.levelRow}>
        {EDUCATION_LEVELS.map((lvl) => {
          const isSelected = educationLevel === lvl;
          return (
            <TouchableOpacity
              key={lvl}
              style={[
                styles.levelChip,
                {
                  backgroundColor: isSelected ? '#2563EB' : colors.card,
                  borderColor: isSelected ? '#2563EB' : colors.border,
                },
              ]}
              onPress={() => {
                HapticsService.light();
                setEducationLevel(lvl);
              }}
            >
              <Text style={[styles.levelText, { color: isSelected ? '#FFFFFF' : colors.text }]}>
                {lvl}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Institution Name (Optional) */}
      <Text style={[styles.label, { color: colors.text, marginTop: 14 }]}>
        Institution / School / University <Text style={styles.optional}>(Optional)</Text>
      </Text>
      <View style={[styles.inputWrapper, { backgroundColor: isDark ? '#111827' : '#FFFFFF', borderColor: colors.border }]}>
        <Ionicons name="business-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
        <TextInput
          style={[styles.input, { color: colors.text }]}
          placeholder="e.g. Stanford University or Delhi Public School"
          placeholderTextColor={colors.textMuted}
          value={institution}
          onChangeText={setInstitution}
        />
      </View>

      {/* Course / Program Name */}
      <Text style={[styles.label, { color: colors.text, marginTop: 14 }]}>Course or Stream</Text>
      <View style={[styles.inputWrapper, { backgroundColor: isDark ? '#111827' : '#FFFFFF', borderColor: colors.border }]}>
        <Ionicons name="book-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
        <TextInput
          style={[styles.input, { color: colors.text }]}
          placeholder="e.g. B.Tech Computer Science or Pre-Med"
          placeholderTextColor={colors.textMuted}
          value={courseName}
          onChangeText={setCourseName}
        />
      </View>

      {/* Semester / Class */}
      <Text style={[styles.label, { color: colors.text, marginTop: 14 }]}>Semester / Year / Grade</Text>
      <View style={[styles.inputWrapper, { backgroundColor: isDark ? '#111827' : '#FFFFFF', borderColor: colors.border }]}>
        <Ionicons name="calendar-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
        <TextInput
          style={[styles.input, { color: colors.text }]}
          placeholder="e.g. Semester 5 or Grade 12"
          placeholderTextColor={colors.textMuted}
          value={semester}
          onChangeText={setSemester}
        />
      </View>

      {/* Academic Goals */}
      <Text style={[styles.label, { color: colors.text, marginTop: 14 }]}>Academic Goals & Aspirations</Text>
      <View style={[styles.textAreaWrapper, { backgroundColor: isDark ? '#111827' : '#FFFFFF', borderColor: colors.border }]}>
        <TextInput
          style={[styles.textArea, { color: colors.text }]}
          placeholder="e.g. Achieve CGPA > 9.0, Master Data Structures, crack entrance exam"
          placeholderTextColor={colors.textMuted}
          multiline
          numberOfLines={3}
          value={academicGoals}
          onChangeText={setAcademicGoals}
        />
      </View>

      {/* Submit Button */}
      <TouchableOpacity
        style={[styles.finishBtn, loading && styles.btnDisabled]}
        onPress={() => handleFinish(false)}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <>
            <Text style={styles.finishBtnText}>Complete Setup</Text>
            <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" style={{ marginLeft: 6 }} />
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {
    padding: 24,
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 40,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#3B82F6',
  },
  header: { marginBottom: 20 },
  title: { fontSize: 24, fontWeight: '800' },
  sub: { fontSize: 13, marginTop: 6, lineHeight: 18 },
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
  optional: { fontSize: 12, fontWeight: '400', color: '#94A3B8' },
  levelRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 6,
  },
  levelChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  levelText: { fontSize: 13, fontWeight: '600' },
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
  textAreaWrapper: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    height: 84,
  },
  textArea: { flex: 1, fontSize: 14, textAlignVertical: 'top' },
  finishBtn: {
    backgroundColor: '#2563EB',
    height: 50,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 26,
  },
  btnDisabled: { opacity: 0.6 },
  finishBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
