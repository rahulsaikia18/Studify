import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useThemeStore } from '../../stores/themeStore';
import { ApiClient } from '../../services/api';
import { HapticsService } from '../../services/HapticsService';
import { AdManager } from '../../services/AdManager';
import { RewardedAdModal } from '../../components/RewardedAdModal';
import { AdBanner } from '../../components/AdBanner';

type QuizStep = 'config' | 'playing' | 'results';

interface Question {
  id: string;
  question: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
  selectedOptionIndex?: number | null;
  isCorrect?: boolean;
}

const SUBJECTS = [
  'Computer Science', 'Mathematics', 'Physics', 'Chemistry',
  'Biology', 'History', 'Geography', 'Economics', 'General',
];

const DIFFICULTIES = ['EASY', 'MEDIUM', 'HARD'];

export default function QuizGeneratorScreen() {
  const queryClient = useQueryClient();
  const { colors, isDark } = useThemeStore();

  const [step, setStep] = useState<QuizStep>('config');
  const [selectedSubject, setSelectedSubject] = useState('Computer Science');
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('MEDIUM');
  const [questionCount, setQuestionCount] = useState('5');

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number | null>>({});
  const [quizStartTime, setQuizStartTime] = useState<number>(0);
  const [resultData, setResultData] = useState<any>(null);
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [bonusUnlocked, setBonusUnlocked] = useState(false);

  // Fetch quiz history
  const { data: historyData = [] } = useQuery({
    queryKey: ['quiz-history'],
    queryFn: async () => {
      const res = await ApiClient.get('/quiz/history');
      return res.data;
    },
  });

  // Generate quiz
  const generateMutation = useMutation({
    mutationFn: async () => {
      return ApiClient.post('/quiz/generate', {
        subject: selectedSubject,
        topic: topic || selectedSubject,
        difficulty,
        count: parseInt(questionCount, 10) || 5,
      });
    },
    onSuccess: (data) => {
      const qs: Question[] = data.data.questions.map((q: any) => ({
        ...q,
        selectedOptionIndex: null,
        isCorrect: null,
      }));
      setQuestions(qs);
      setAnswers({});
      setCurrentQuestionIndex(0);
      setQuizStartTime(Date.now());
      setStep('playing');
    },
    onError: (err: any) => {
      Alert.alert('Generation Failed', err.message || 'Could not generate quiz questions.');
    },
  });

  // Submit quiz
  const submitMutation = useMutation({
    mutationFn: async () => {
      const timeTaken = Math.round((Date.now() - quizStartTime) / 1000);
      const userAnswers = questions.map((q) => ({
        questionId: q.id,
        selectedOptionIndex: answers[q.id] ?? null,
      }));

      return ApiClient.post('/quiz/submit', {
        subject: selectedSubject,
        topic: topic || selectedSubject,
        difficulty,
        userAnswers,
        questions,
        timeTakenSeconds: timeTaken,
      });
    },
    onSuccess: (data) => {
      setResultData(data.data);
      setStep('results');
      HapticsService.success();

      // Show interstitial ad at natural transition (quiz completed)
      AdManager.registerUserAction();
      AdManager.showInterstitialAtTransition('QuizCompleted', () => {
        // Interstitial closed, quiz result fully visible
      });
    },
    onError: (err: any) => {
      Alert.alert('Submission Error', err.message);
    },
  });

  const handleSelectOption = (questionId: string, optionIndex: number) => {
    HapticsService.light();
    setAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      HapticsService.light();
      setCurrentQuestionIndex((i) => i + 1);
    } else {
      // Submit
      submitMutation.mutate();
    }
  };

  const handlePrev = () => {
    if (currentQuestionIndex > 0) {
      HapticsService.light();
      setCurrentQuestionIndex((i) => i - 1);
    }
  };

  const handleReset = () => {
    setStep('config');
    setQuestions([]);
    setAnswers({});
    setResultData(null);
    setCurrentQuestionIndex(0);
    queryClient.invalidateQueries({ queryKey: ['quiz-history'] });
  };

  // ── CONFIG SCREEN ──────────────────────────────────────────────────
  if (step === 'config') {
    return (
      <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.pageTitle, { color: colors.text }]}>Configure Your Practice Quiz</Text>
        <Text style={[styles.pageSub, { color: colors.textMuted }]}>
          Questions generated from our curated academic bank and AI
        </Text>

        {/* Subject Selector */}
        <Text style={[styles.sectionLabel, { color: colors.text }]}>Select Subject</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.subjectScroll} contentContainerStyle={styles.subjectScrollContent}>
          {SUBJECTS.map((subj) => {
            const isSelected = selectedSubject === subj;
            return (
              <TouchableOpacity
                key={subj}
                style={[
                  styles.subjectChip,
                  isSelected && { backgroundColor: '#2563EB', borderColor: '#2563EB' },
                  !isSelected && { borderColor: colors.border, backgroundColor: colors.card },
                ]}
                onPress={() => {
                  HapticsService.light();
                  setSelectedSubject(subj);
                }}
              >
                <Text style={[styles.subjectText, { color: isSelected ? '#FFFFFF' : colors.text }]}>
                  {subj}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Topic Input */}
        <Text style={[styles.sectionLabel, { color: colors.text }]}>Specific Topic (Optional)</Text>
        <View style={[styles.inputBox, { backgroundColor: isDark ? '#1E293B' : '#F8FAFC', borderColor: colors.border }]}>
          <Ionicons name="search-outline" size={18} color={colors.textMuted} style={{ marginRight: 8 }} />
          <TextInput
            style={[styles.inputText, { color: colors.text }]}
            placeholder="e.g. Binary Search Trees, Calculus Limits"
            placeholderTextColor={colors.textMuted}
            value={topic}
            onChangeText={setTopic}
          />
        </View>

        {/* Difficulty Selector */}
        <Text style={[styles.sectionLabel, { color: colors.text }]}>Difficulty Level</Text>
        <View style={styles.difficultyRow}>
          {DIFFICULTIES.map((d) => {
            const isSelected = difficulty === d;
            const dColor = d === 'EASY' ? '#10B981' : d === 'MEDIUM' ? '#F59E0B' : '#EF4444';
            return (
              <TouchableOpacity
                key={d}
                style={[
                  styles.diffChip,
                  isSelected && { backgroundColor: dColor, borderColor: dColor },
                  !isSelected && { borderColor: colors.border, backgroundColor: colors.card },
                ]}
                onPress={() => {
                  HapticsService.light();
                  setDifficulty(d);
                }}
              >
                <Text style={[styles.diffText, { color: isSelected ? '#FFFFFF' : colors.textMuted }]}>
                  {d}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Question Count */}
        <Text style={[styles.sectionLabel, { color: colors.text }]}>Number of Questions</Text>
        <View style={styles.countRow}>
          {['3', '5', '10', '15', '20'].map((c) => {
            const isSelected = questionCount === c;
            const isBonus = parseInt(c, 10) > 10;
            return (
              <TouchableOpacity
                key={c}
                style={[
                  styles.countChip,
                  isSelected && { backgroundColor: '#2563EB', borderColor: '#2563EB' },
                  !isSelected && { borderColor: colors.border, backgroundColor: colors.card },
                  isBonus && !bonusUnlocked && !isSelected && { opacity: 0.5 },
                ]}
                onPress={() => {
                  if (isBonus && !bonusUnlocked) {
                    Alert.alert(
                      'Bonus Quantity Locked',
                      'Watch a short sponsor video to unlock 15 and 20-question practice sets.',
                      [
                        { text: 'Not Now', style: 'cancel' },
                        { text: 'Unlock Free', onPress: () => setShowRewardModal(true) },
                      ]
                    );
                    return;
                  }
                  HapticsService.light();
                  setQuestionCount(c);
                }}
              >
                <Text style={[styles.countText, { color: isSelected ? '#FFFFFF' : colors.text }]}>{c}</Text>
                {isBonus && !bonusUnlocked && (
                  <Ionicons name="gift-outline" size={12} color={isSelected ? '#FFFFFF' : '#3B82F6'} style={{ marginLeft: 4 }} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Start Button */}
        <TouchableOpacity
          style={[styles.startBtn, generateMutation.isPending && styles.btnDisabled]}
          onPress={() => {
            HapticsService.medium();
            AdManager.registerUserAction();
            generateMutation.mutate();
          }}
          disabled={generateMutation.isPending}
        >
          {generateMutation.isPending ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="play-circle" size={22} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.startBtnText}>Start {questionCount}-Question Practice Quiz</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Recent Quiz History */}
        {historyData.length > 0 && (
          <View style={styles.historySection}>
            <Text style={[styles.sectionLabel, { color: colors.text }]}>Recent Quiz Performance</Text>
            {historyData.slice(0, 4).map((rec: any) => {
              const pct = Math.round((rec.score / rec.totalQuestions) * 100);
              const pctColor = pct >= 80 ? '#10B981' : pct >= 60 ? '#F59E0B' : '#EF4444';
              return (
                <View key={rec.id} style={[styles.histCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.histSubject, { color: colors.text }]}>{rec.subject} — {rec.topic}</Text>
                    <Text style={[styles.histMeta, { color: colors.textMuted }]}>
                      {new Date(rec.createdAt).toLocaleDateString()} • {rec.difficulty} • {Math.round(rec.timeTakenSeconds / 60)}m {rec.timeTakenSeconds % 60}s
                    </Text>
                  </View>
                  <View style={[styles.histScore, { backgroundColor: `${pctColor}15` }]}>
                    <Text style={[styles.histScoreText, { color: pctColor }]}>{pct}%</Text>
                    <Text style={[styles.histScoreSub, { color: pctColor }]}>{rec.score}/{rec.totalQuestions}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        <AdBanner placement="Quiz Generator Config" />

        <RewardedAdModal
          visible={showRewardModal}
          rewardType="EXTRA_QUIZ"
          onClose={() => setShowRewardModal(false)}
          onRewardEarned={() => {
            setBonusUnlocked(true);
            setShowRewardModal(false);
            Alert.alert('Unlocked!', '15 and 20-question quiz sets are now available.');
          }}
        />
      </ScrollView>
    );
  }

  // ── PLAYING SCREEN ─────────────────────────────────────────────────
  if (step === 'playing') {
    const q = questions[currentQuestionIndex];
    const selectedAnswer = answers[q.id] ?? null;
    const answeredCount = Object.keys(answers).length;

    return (
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        {/* Progress Header */}
        <View style={[styles.quizHeader, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <TouchableOpacity
            onPress={() => {
              Alert.alert('Quit Quiz', 'Are you sure you want to abandon this quiz?', [
                { text: 'Continue Quiz', style: 'cancel' },
                { text: 'Quit', style: 'destructive', onPress: handleReset },
              ]);
            }}
          >
            <Ionicons name="close" size={24} color={colors.textMuted} />
          </TouchableOpacity>

          <View style={styles.quizProgressCenter}>
            <Text style={[styles.quizProgressText, { color: colors.textMuted }]}>
              {currentQuestionIndex + 1} / {questions.length}
            </Text>
            {/* Progress bar */}
            <View style={[styles.progressBarTrack, { backgroundColor: isDark ? '#1E293B' : '#E2E8F0' }]}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` },
                ]}
              />
            </View>
          </View>

          <Text style={[styles.answeredBadge, { color: colors.textMuted }]}>
            {answeredCount}/{questions.length} answered
          </Text>
        </View>

        <ScrollView contentContainerStyle={styles.quizScrollContent}>
          {/* Question Number + Subject */}
          <View style={[styles.qBadgeRow]}>
            <View style={[styles.difficultyBadge, { backgroundColor: difficulty === 'EASY' ? '#D1FAE5' : difficulty === 'HARD' ? '#FEE2E2' : '#FEF3C7' }]}>
              <Text style={[styles.diffBadgeText, { color: difficulty === 'EASY' ? '#065F46' : difficulty === 'HARD' ? '#991B1B' : '#92400E' }]}>
                {difficulty}
              </Text>
            </View>
            <Text style={[styles.qSubjectLabel, { color: colors.textMuted }]}>
              {selectedSubject} • Q{currentQuestionIndex + 1}
            </Text>
          </View>

          {/* Question Text */}
          <Text style={[styles.questionText, { color: colors.text }]}>{q.question}</Text>

          {/* Options */}
          <View style={styles.optionsContainer}>
            {q.options.map((option, optionIdx) => {
              const isSelected = selectedAnswer === optionIdx;
              return (
                <TouchableOpacity
                  key={optionIdx}
                  style={[
                    styles.optionBtn,
                    { backgroundColor: colors.card, borderColor: colors.border },
                    isSelected && { backgroundColor: '#EFF6FF', borderColor: '#2563EB', borderWidth: 2 },
                  ]}
                  onPress={() => handleSelectOption(q.id, optionIdx)}
                >
                  <View
                    style={[
                      styles.optionLabel,
                      isSelected ? { backgroundColor: '#2563EB' } : { backgroundColor: isDark ? '#2A364F' : '#F1F5F9' },
                    ]}
                  >
                    <Text style={[styles.optionLabelText, { color: isSelected ? '#FFFFFF' : colors.textMuted }]}>
                      {String.fromCharCode(65 + optionIdx)}
                    </Text>
                  </View>
                  <Text style={[styles.optionText, { color: colors.text, fontWeight: isSelected ? '700' : '500' }]}>
                    {option}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Navigation buttons */}
          <View style={styles.navRow}>
            <TouchableOpacity
              style={[styles.navBtn, { borderColor: colors.border, opacity: currentQuestionIndex === 0 ? 0.3 : 1 }]}
              onPress={handlePrev}
              disabled={currentQuestionIndex === 0}
            >
              <Ionicons name="arrow-back" size={20} color={colors.text} />
              <Text style={[styles.navBtnText, { color: colors.text }]}>Prev</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.nextBtn,
                {
                  backgroundColor: currentQuestionIndex === questions.length - 1
                    ? (submitMutation.isPending ? '#64748B' : '#10B981')
                    : '#2563EB',
                },
                submitMutation.isPending && styles.btnDisabled,
              ]}
              onPress={handleNext}
              disabled={submitMutation.isPending}
            >
              {submitMutation.isPending ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Text style={styles.nextBtnText}>
                    {currentQuestionIndex === questions.length - 1 ? 'Submit Quiz' : 'Next'}
                  </Text>
                  <Ionicons
                    name={currentQuestionIndex === questions.length - 1 ? 'checkmark-circle' : 'arrow-forward'}
                    size={20}
                    color="#FFFFFF"
                  />
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  // ── RESULTS SCREEN ─────────────────────────────────────────────────
  if (step === 'results' && resultData) {
    const { score, totalQuestions, percentage, evaluatedQuestions } = resultData;
    const resultColor = percentage >= 80 ? '#10B981' : percentage >= 60 ? '#F59E0B' : '#EF4444';
    const timeTaken = Math.round((Date.now() - quizStartTime) / 1000);

    return (
      <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={styles.scrollContent}>
        {/* Score Summary Card */}
        <View style={[styles.resultCard, { backgroundColor: resultColor }]}>
          <Text style={styles.resultEmoji}>
            {percentage >= 80 ? '🏆' : percentage >= 60 ? '📚' : '💪'}
          </Text>
          <Text style={styles.resultScore}>{score} / {totalQuestions}</Text>
          <Text style={styles.resultPct}>{percentage}% Correct</Text>
          <Text style={styles.resultSub}>
            {selectedSubject} • {difficulty} • {Math.round(timeTaken / 60)}m {timeTaken % 60}s
          </Text>
        </View>

        {/* Try Again / New Quiz Buttons */}
        <View style={styles.resultBtnsRow}>
          <TouchableOpacity
            style={[styles.retryBtn, { borderColor: colors.border }]}
            onPress={() => {
              setStep('playing');
              setAnswers({});
              setCurrentQuestionIndex(0);
              setQuizStartTime(Date.now());
            }}
          >
            <Ionicons name="refresh" size={18} color={colors.text} style={{ marginRight: 6 }} />
            <Text style={[styles.retryText, { color: colors.text }]}>Retry Same Quiz</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.newQuizBtn} onPress={handleReset}>
            <Ionicons name="add-circle" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.newQuizText}>New Quiz</Text>
          </TouchableOpacity>
        </View>

        {/* Detailed Answer Review */}
        <Text style={[styles.sectionLabel, { color: colors.text }]}>Answer Explanations</Text>
        {evaluatedQuestions.map((q: any, idx: number) => (
          <View key={idx} style={[styles.reviewCard, { backgroundColor: colors.card, borderColor: q.isCorrect ? '#10B981' : '#EF4444' }]}>
            <View style={styles.reviewHeader}>
              <View style={[styles.reviewBadge, { backgroundColor: q.isCorrect ? '#D1FAE5' : '#FEE2E2' }]}>
                <Ionicons
                  name={q.isCorrect ? 'checkmark-circle' : 'close-circle'}
                  size={16}
                  color={q.isCorrect ? '#059669' : '#DC2626'}
                />
                <Text style={[styles.reviewBadgeText, { color: q.isCorrect ? '#059669' : '#DC2626' }]}>
                  {q.isCorrect ? 'Correct' : 'Incorrect'}
                </Text>
              </View>
              <Text style={[styles.reviewQNum, { color: colors.textMuted }]}>Q{idx + 1}</Text>
            </View>

            <Text style={[styles.reviewQuestion, { color: colors.text }]}>{q.question}</Text>

            {/* Show selected vs correct */}
            {q.selectedOptionIndex !== null && q.selectedOptionIndex !== q.correctOptionIndex && (
              <View style={styles.wrongAnswerRow}>
                <Text style={styles.wrongLabel}>Your Answer:</Text>
                <Text style={styles.wrongText}>{q.options[q.selectedOptionIndex]}</Text>
              </View>
            )}

            <View style={styles.correctAnswerRow}>
              <Text style={styles.correctLabel}>Correct Answer:</Text>
              <Text style={styles.correctText}>{q.options[q.correctOptionIndex]}</Text>
            </View>

            {/* Explanation */}
            <View style={[styles.explanationBox, { backgroundColor: isDark ? '#1E293B' : '#F8FAFC' }]}>
              <Ionicons name="bulb-outline" size={16} color="#6366F1" style={{ marginRight: 8, marginTop: 1 }} />
              <Text style={[styles.explanationText, { color: colors.text }]}>{q.explanation}</Text>
            </View>
          </View>
        ))}

        <AdBanner placement="Quiz Results Screen" />
      </ScrollView>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  pageTitle: { fontSize: 22, fontWeight: '900', marginBottom: 4 },
  pageSub: { fontSize: 13, marginBottom: 18 },
  sectionLabel: { fontSize: 14, fontWeight: '800', marginTop: 16, marginBottom: 10 },
  subjectScroll: { marginBottom: 0 },
  subjectScrollContent: { gap: 8, paddingBottom: 8 },
  subjectChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  subjectText: { fontSize: 13, fontWeight: '700' },
  inputBox: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 14, paddingHorizontal: 12, height: 46 },
  inputText: { flex: 1, fontSize: 14 },
  difficultyRow: { flexDirection: 'row', gap: 10 },
  diffChip: { flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
  diffText: { fontSize: 13, fontWeight: '800' },
  countRow: { flexDirection: 'row', gap: 8 },
  countChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  countText: { fontSize: 14, fontWeight: '800' },
  startBtn: {
    backgroundColor: '#2563EB',
    height: 52,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 8,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  btnDisabled: { opacity: 0.6 },
  startBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  historySection: { marginTop: 8 },
  histCard: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 8 },
  histSubject: { fontSize: 14, fontWeight: '700' },
  histMeta: { fontSize: 11, marginTop: 2 },
  histScore: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 12, alignItems: 'center', minWidth: 56 },
  histScoreText: { fontSize: 18, fontWeight: '900' },
  histScoreSub: { fontSize: 10, fontWeight: '700', marginTop: 1 },
  // PLAYING
  quizHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 54 : 32,
    paddingBottom: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  quizProgressCenter: { flex: 1 },
  quizProgressText: { fontSize: 12, fontWeight: '700', textAlign: 'center', marginBottom: 6 },
  progressBarTrack: { height: 6, borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#2563EB', borderRadius: 3 },
  answeredBadge: { fontSize: 11, fontWeight: '700' },
  quizScrollContent: { padding: 16, paddingBottom: 40 },
  qBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  difficultyBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  diffBadgeText: { fontSize: 10, fontWeight: '800' },
  qSubjectLabel: { fontSize: 12, fontWeight: '600' },
  questionText: { fontSize: 17, fontWeight: '800', lineHeight: 25, marginBottom: 20 },
  optionsContainer: { gap: 10, marginBottom: 24 },
  optionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  optionLabel: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  optionLabelText: { fontSize: 13, fontWeight: '800' },
  optionText: { flex: 1, fontSize: 14, lineHeight: 20 },
  navRow: { flexDirection: 'row', gap: 12 },
  navBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 13,
    borderRadius: 14,
    borderWidth: 1,
    gap: 6,
  },
  navBtnText: { fontSize: 14, fontWeight: '700' },
  nextBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 14,
    gap: 6,
  },
  nextBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  // RESULTS
  resultCard: {
    padding: 28,
    borderRadius: 24,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  resultEmoji: { fontSize: 48, marginBottom: 8 },
  resultScore: { color: '#FFFFFF', fontSize: 38, fontWeight: '900' },
  resultPct: { color: 'rgba(255,255,255,0.9)', fontSize: 18, fontWeight: '800', marginTop: 4 },
  resultSub: { color: 'rgba(255,255,255,0.75)', fontSize: 12, marginTop: 6 },
  resultBtnsRow: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  retryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  retryText: { fontSize: 13, fontWeight: '700' },
  newQuizBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    borderRadius: 14,
  },
  newQuizText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  reviewCard: { borderRadius: 18, borderWidth: 1.5, padding: 16, marginBottom: 12 },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  reviewBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, gap: 4 },
  reviewBadgeText: { fontSize: 12, fontWeight: '800' },
  reviewQNum: { fontSize: 12, fontWeight: '700' },
  reviewQuestion: { fontSize: 14, fontWeight: '700', lineHeight: 20, marginBottom: 10 },
  wrongAnswerRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  wrongLabel: { fontSize: 11, fontWeight: '700', color: '#DC2626' },
  wrongText: { fontSize: 11, color: '#DC2626', flex: 1 },
  correctAnswerRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  correctLabel: { fontSize: 11, fontWeight: '700', color: '#059669' },
  correctText: { fontSize: 11, color: '#059669', flex: 1, fontWeight: '700' },
  explanationBox: { flexDirection: 'row', alignItems: 'flex-start', padding: 12, borderRadius: 12 },
  explanationText: { fontSize: 12, lineHeight: 18, flex: 1 },
});
