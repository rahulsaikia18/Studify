import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useThemeStore } from '../../stores/themeStore';
import { ApiClient } from '../../services/api';
import { HapticsService } from '../../services/HapticsService';
import { AdBanner } from '../../components/AdBanner';

interface SubjectRow {
  id: string;
  name: string;
  credits: number;
  gradePoint: number;
}

export default function CgpaCalculatorScreen() {
  const queryClient = useQueryClient();
  const { colors, isDark } = useThemeStore();

  const [activeTab, setActiveTab] = useState<'sgpa' | 'cgpa' | 'history'>('sgpa');
  const [multiplier, setMultiplier] = useState('9.5'); // Configurable university conversion factor

  // SGPA Subject entries (clean input for student)
  const [subjects, setSubjects] = useState<SubjectRow[]>([
    { id: '1', name: '', credits: 3, gradePoint: 0 },
  ]);

  // Semester SGPA entries for CGPA
  const [semesters, setSemesters] = useState([
    { semesterNumber: 1, sgpa: 0, totalCredits: 20 },
  ]);

  // SGPA Calculation
  const totalCredits = subjects.reduce((sum, s) => sum + s.credits, 0);
  const totalWeightedPoints = subjects.reduce((sum, s) => sum + s.credits * s.gradePoint, 0);
  const calculatedSgpa = totalCredits > 0 ? parseFloat((totalWeightedPoints / totalCredits).toFixed(2)) : 0;
  const sgpaPercentage = parseFloat((calculatedSgpa * (parseFloat(multiplier) || 9.5)).toFixed(2));

  // CGPA Calculation
  const totalCgpaCredits = semesters.reduce((sum, s) => sum + s.totalCredits, 0);
  const totalWeightedSgpa = semesters.reduce((sum, s) => sum + s.sgpa * s.totalCredits, 0);
  const calculatedCgpa = totalCgpaCredits > 0 ? parseFloat((totalWeightedSgpa / totalCgpaCredits).toFixed(2)) : 0;
  const cgpaPercentage = parseFloat((calculatedCgpa * (parseFloat(multiplier) || 9.5)).toFixed(2));

  // Calculation History
  const { data: history = [] } = useQuery({
    queryKey: ['cgpa-history'],
    queryFn: async () => {
      const res = await ApiClient.get('/cgpa/history');
      return res.data;
    },
  });

  const saveRecordMutation = useMutation({
    mutationFn: async (payload: any) => {
      return ApiClient.post('/cgpa/records', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cgpa-history'] });
      Alert.alert('Saved!', 'Academic record successfully saved to history.');
    },
  });

  const addSubject = () => {
    HapticsService.light();
    setSubjects((prev) => [
      ...prev,
      { id: Date.now().toString(), name: `Subject ${prev.length + 1}`, credits: 3, gradePoint: 8 },
    ]);
  };

  const removeSubject = (id: string) => {
    HapticsService.light();
    if (subjects.length <= 1) return;
    setSubjects((prev) => prev.filter((s) => s.id !== id));
  };

  const updateSubject = (id: string, field: 'name' | 'credits' | 'gradePoint', value: any) => {
    setSubjects((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  };

  const addSemester = () => {
    HapticsService.light();
    setSemesters((prev) => [
      ...prev,
      { semesterNumber: prev.length + 1, sgpa: 8.5, totalCredits: 20 },
    ]);
  };

  const handleSaveHistory = () => {
    HapticsService.medium();
    saveRecordMutation.mutate({
      title: `B.Tech CGPA Calculation (${semesters.length} Semesters)`,
      scaleType: '10_POINT',
      scaleConfig: { multiplier: parseFloat(multiplier) || 9.5 },
      semesters,
      cgpa: calculatedCgpa,
      percentage: cgpaPercentage,
      totalCredits: totalCgpaCredits,
    });
  };

  return (
    <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={styles.scrollContent}>
      {/* Tab Switcher */}
      <View style={[styles.tabBar, { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' }]}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'sgpa' && [styles.activeTab, { backgroundColor: colors.card }]]}
          onPress={() => {
            HapticsService.light();
            setActiveTab('sgpa');
          }}
        >
          <Text style={[styles.tabText, { color: activeTab === 'sgpa' ? '#2563EB' : colors.textMuted }]}>
            SGPA Calculator
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'cgpa' && [styles.activeTab, { backgroundColor: colors.card }]]}
          onPress={() => {
            HapticsService.light();
            setActiveTab('cgpa');
          }}
        >
          <Text style={[styles.tabText, { color: activeTab === 'cgpa' ? '#2563EB' : colors.textMuted }]}>
            CGPA Calculator
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'history' && [styles.activeTab, { backgroundColor: colors.card }]]}
          onPress={() => {
            HapticsService.light();
            setActiveTab('history');
          }}
        >
          <Text style={[styles.tabText, { color: activeTab === 'history' ? '#2563EB' : colors.textMuted }]}>
            Saved History
          </Text>
        </TouchableOpacity>
      </View>

      {/* Conversion Multiplier Config */}
      <View style={[styles.configCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.configLeft}>
          <Ionicons name="settings-outline" size={18} color="#2563EB" style={{ marginRight: 8 }} />
          <View>
            <Text style={[styles.configTitle, { color: colors.text }]}>University Conversion Multiplier</Text>
            <Text style={[styles.configSub, { color: colors.textMuted }]}>e.g. 9.5 (CBSE/VTU) or 10.0</Text>
          </View>
        </View>
        <TextInput
          style={[styles.multiplierInput, { color: colors.text, borderColor: colors.border }]}
          keyboardType="numeric"
          value={multiplier}
          onChangeText={setMultiplier}
        />
      </View>

      {/* Result Display Box */}
      <View style={styles.scoreBanner}>
        <View style={styles.scoreCol}>
          <Text style={styles.scoreLabel}>{activeTab === 'sgpa' ? 'YOUR SGPA' : 'OVERALL CGPA'}</Text>
          <Text style={styles.scoreVal}>{activeTab === 'sgpa' ? calculatedSgpa : calculatedCgpa}</Text>
          <Text style={styles.creditsSub}>
            Based on {activeTab === 'sgpa' ? totalCredits : totalCgpaCredits} Credits
          </Text>
        </View>
        <View style={styles.scoreDivider} />
        <View style={styles.scoreCol}>
          <Text style={styles.scoreLabel}>EQUIVALENT %</Text>
          <Text style={styles.scoreVal}>{activeTab === 'sgpa' ? `${sgpaPercentage}%` : `${cgpaPercentage}%`}</Text>
          <Text style={styles.creditsSub}>× {multiplier} Factor</Text>
        </View>
      </View>

      {activeTab === 'sgpa' && (
        <View>
          <View style={styles.subHeaderRow}>
            <Text style={[styles.sectionHeading, { color: colors.text }]}>Semester Subjects</Text>
            <TouchableOpacity style={styles.addSubjectBtn} onPress={addSubject}>
              <Ionicons name="add" size={16} color="#2563EB" />
              <Text style={styles.addSubjectText}>Add Subject</Text>
            </TouchableOpacity>
          </View>

          {subjects.map((sub, idx) => (
            <View key={sub.id} style={[styles.subjectCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.subTopRow}>
                <TextInput
                  style={[styles.subNameInput, { color: colors.text }]}
                  value={sub.name}
                  onChangeText={(val) => updateSubject(sub.id, 'name', val)}
                  placeholder="Subject Name"
                  placeholderTextColor={colors.textMuted}
                />
                <TouchableOpacity onPress={() => removeSubject(sub.id)}>
                  <Ionicons name="trash-outline" size={18} color="#EF4444" />
                </TouchableOpacity>
              </View>

              <View style={styles.subFieldsRow}>
                <View style={styles.fieldCol}>
                  <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Credits</Text>
                  <TextInput
                    style={[styles.fieldInput, { color: colors.text, borderColor: colors.border }]}
                    keyboardType="numeric"
                    value={sub.credits.toString()}
                    onChangeText={(val) => updateSubject(sub.id, 'credits', parseInt(val, 10) || 0)}
                  />
                </View>

                <View style={styles.fieldCol}>
                  <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Grade Point (0-10)</Text>
                  <TextInput
                    style={[styles.fieldInput, { color: colors.text, borderColor: colors.border }]}
                    keyboardType="numeric"
                    value={sub.gradePoint.toString()}
                    onChangeText={(val) => updateSubject(sub.id, 'gradePoint', parseFloat(val) || 0)}
                  />
                </View>
              </View>
            </View>
          ))}
        </View>
      )}

      {activeTab === 'cgpa' && (
        <View>
          <View style={styles.subHeaderRow}>
            <Text style={[styles.sectionHeading, { color: colors.text }]}>Semesters Breakdown</Text>
            <TouchableOpacity style={styles.addSubjectBtn} onPress={addSemester}>
              <Ionicons name="add" size={16} color="#2563EB" />
              <Text style={styles.addSubjectText}>Add Semester</Text>
            </TouchableOpacity>
          </View>

          {semesters.map((sem, idx) => (
            <View key={idx} style={[styles.subjectCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.semTitle, { color: colors.text }]}>Semester {sem.semesterNumber}</Text>
              <View style={styles.subFieldsRow}>
                <View style={styles.fieldCol}>
                  <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>SGPA Achieved</Text>
                  <TextInput
                    style={[styles.fieldInput, { color: colors.text, borderColor: colors.border }]}
                    keyboardType="numeric"
                    value={sem.sgpa.toString()}
                    onChangeText={(val) => {
                      const updated = [...semesters];
                      updated[idx].sgpa = parseFloat(val) || 0;
                      setSemesters(updated);
                    }}
                  />
                </View>

                <View style={styles.fieldCol}>
                  <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Semester Credits</Text>
                  <TextInput
                    style={[styles.fieldInput, { color: colors.text, borderColor: colors.border }]}
                    keyboardType="numeric"
                    value={sem.totalCredits.toString()}
                    onChangeText={(val) => {
                      const updated = [...semesters];
                      updated[idx].totalCredits = parseInt(val, 10) || 0;
                      setSemesters(updated);
                    }}
                  />
                </View>
              </View>
            </View>
          ))}

          <TouchableOpacity style={styles.saveHistoryBtn} onPress={handleSaveHistory}>
            <Ionicons name="save-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.saveHistoryText}>Save Calculation to History</Text>
          </TouchableOpacity>
        </View>
      )}

      {activeTab === 'history' && (
        <View>
          <Text style={[styles.sectionHeading, { color: colors.text }]}>Saved Records</Text>
          {history.length === 0 ? (
            <View style={[styles.emptyBox, { borderColor: colors.border }]}>
              <Ionicons name="archive-outline" size={44} color={colors.textMuted} />
              <Text style={[styles.emptyText, { color: colors.text }]}>No Saved CGPA Records</Text>
              <Text style={[styles.emptySub, { color: colors.textMuted }]}>
                Calculate your CGPA in the previous tab and tap Save to store records.
              </Text>
            </View>
          ) : (
            history.map((rec: any) => (
              <View key={rec.id} style={[styles.historyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.histTopRow}>
                  <Text style={[styles.histTitle, { color: colors.text }]}>{rec.title}</Text>
                  <View style={styles.histScoreBadge}>
                    <Text style={styles.histScoreText}>CGPA {rec.cgpa}</Text>
                  </View>
                </View>
                <Text style={[styles.histSub, { color: colors.textMuted }]}>
                  {rec.percentage}% • {rec.totalCredits} Total Credits • {new Date(rec.createdAt).toLocaleDateString()}
                </Text>
              </View>
            ))
          )}
        </View>
      )}

      <AdBanner placement="CGPA Calculator Footer" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 36 },
  tabBar: {
    flexDirection: 'row',
    borderRadius: 14,
    padding: 3,
    marginBottom: 14,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 12,
  },
  activeTab: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 2, elevation: 2 },
  tabText: { fontSize: 12, fontWeight: '700' },
  configCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 14,
  },
  configLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  configTitle: { fontSize: 12, fontWeight: '700' },
  configSub: { fontSize: 10, marginTop: 1 },
  multiplierInput: {
    borderWidth: 1,
    borderRadius: 8,
    width: 60,
    height: 36,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '800',
  },
  scoreBanner: {
    backgroundColor: '#1E40AF',
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
    shadowColor: '#1E40AF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  scoreCol: { flex: 1, alignItems: 'center' },
  scoreDivider: { width: 1, height: '70%', backgroundColor: 'rgba(255,255,255,0.2)' },
  scoreLabel: { color: '#93C5FD', fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  scoreVal: { color: '#FFFFFF', fontSize: 32, fontWeight: '900', marginVertical: 2 },
  creditsSub: { color: '#BFDBFE', fontSize: 11, fontWeight: '600' },
  subHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionHeading: { fontSize: 16, fontWeight: '800' },
  addSubjectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 4,
  },
  addSubjectText: { color: '#2563EB', fontSize: 12, fontWeight: '700' },
  subjectCard: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
  },
  subTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  subNameInput: { fontSize: 15, fontWeight: '700', flex: 1 },
  subFieldsRow: { flexDirection: 'row', gap: 12 },
  fieldCol: { flex: 1 },
  fieldLabel: { fontSize: 11, fontWeight: '600', marginBottom: 4 },
  fieldInput: {
    borderWidth: 1,
    borderRadius: 10,
    height: 40,
    paddingHorizontal: 12,
    fontSize: 14,
    fontWeight: '700',
  },
  semTitle: { fontSize: 15, fontWeight: '800', marginBottom: 8 },
  saveHistoryBtn: {
    backgroundColor: '#2563EB',
    height: 48,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
  },
  saveHistoryText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  historyCard: { padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 10 },
  histTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  histTitle: { fontSize: 14, fontWeight: '800' },
  histScoreBadge: { backgroundColor: '#DBEAFE', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  histScoreText: { color: '#1D4ED8', fontSize: 12, fontWeight: '800' },
  histSub: { fontSize: 11, marginTop: 4 },
  emptyBox: { borderWidth: 1, borderStyle: 'dashed', borderRadius: 16, padding: 30, alignItems: 'center' },
  emptyText: { fontSize: 15, fontWeight: '700', marginTop: 10 },
  emptySub: { fontSize: 12, textAlign: 'center', marginTop: 4 },
});
