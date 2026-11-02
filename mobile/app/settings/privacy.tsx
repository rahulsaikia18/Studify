import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../stores/themeStore';
import { HapticsService } from '../../services/HapticsService';

export default function PrivacyPolicyScreen() {
  const { colors, isDark } = useThemeStore();
  const [personalizedAds, setPersonalizedAds] = useState(false);
  const [analyticsConsent, setAnalyticsConsent] = useState(true);

  const handleResetConsent = () => {
    HapticsService.medium();
    Alert.alert(
      'Consent Preferences Reset',
      'Your privacy preferences and AdMob consent flags have been reset to default non-personalized settings.',
      [{ text: 'OK' }]
    );
  };

  return (
    <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={styles.scrollContent}>
      {/* Banner */}
      <View style={[styles.shieldBanner, { backgroundColor: isDark ? '#1E293B' : '#EFF6FF', borderColor: '#BFDBFE' }]}>
        <Ionicons name="shield-checkmark" size={32} color="#2563EB" />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={[styles.bannerTitle, { color: colors.text }]}>Privacy-First Student Utility</Text>
          <Text style={[styles.bannerSub, { color: colors.textMuted }]}>
            Studify adheres strictly to Google Play Families Policy, COPPA, and Google AdMob Advertising Standards.
          </Text>
        </View>
      </View>

      {/* Ad Consent Settings */}
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Advertising Consent & Controls</Text>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.switchRow}>
          <View style={{ flex: 1, marginRight: 12 }}>
            <Text style={[styles.switchTitle, { color: colors.text }]}>Personalized Advertisements</Text>
            <Text style={[styles.switchDesc, { color: colors.textMuted }]}>
              When turned off, ads served through Google AdMob will be non-personalized contextual ads only.
            </Text>
          </View>
          <Switch
            value={personalizedAds}
            onValueChange={(val) => {
              HapticsService.light();
              setPersonalizedAds(val);
            }}
            trackColor={{ false: '#94A3B8', true: '#2563EB' }}
          />
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <View style={styles.switchRow}>
          <View style={{ flex: 1, marginRight: 12 }}>
            <Text style={[styles.switchTitle, { color: colors.text }]}>Anonymous Usage Diagnostics</Text>
            <Text style={[styles.switchDesc, { color: colors.textMuted }]}>
              Helps detect calculation crashes, performance bottlenecks, and sync failures without identifying you.
            </Text>
          </View>
          <Switch
            value={analyticsConsent}
            onValueChange={(val) => {
              HapticsService.light();
              setAnalyticsConsent(val);
            }}
            trackColor={{ false: '#94A3B8', true: '#2563EB' }}
          />
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <TouchableOpacity style={styles.resetConsentBtn} onPress={handleResetConsent}>
          <Ionicons name="refresh-outline" size={16} color="#2563EB" style={{ marginRight: 6 }} />
          <Text style={styles.resetConsentText}>Reset Consent Choices (UMP Dialog)</Text>
        </TouchableOpacity>
      </View>

      {/* AdMob Policy Commitments */}
      <Text style={[styles.sectionTitle, { color: colors.text }]}>AdMob Policy Compliance</Text>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.policyPoint}>
          <Ionicons name="checkmark-done" size={18} color="#10B981" style={styles.checkIcon} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.pointHeading, { color: colors.text }]}>Non-Intrusive Banner Placement</Text>
            <Text style={[styles.pointBody, { color: colors.textMuted }]}>
              Adaptive banners are anchored only in dedicated scroll areas and never overlap navigation tabs, action buttons, or interactive forms.
            </Text>
          </View>
        </View>

        <View style={styles.policyPoint}>
          <Ionicons name="checkmark-done" size={18} color="#10B981" style={styles.checkIcon} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.pointHeading, { color: colors.text }]}>Milestone Interstitials Only</Text>
            <Text style={[styles.pointBody, { color: colors.textMuted }]}>
              Full-screen interstitial ads are restricted to natural resting transitions (such as completing a quiz). They are strictly prohibited during active study sessions, Pomodoro timers, or calculations.
            </Text>
          </View>
        </View>

        <View style={styles.policyPoint}>
          <Ionicons name="checkmark-done" size={18} color="#10B981" style={styles.checkIcon} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.pointHeading, { color: colors.text }]}>Optional User-Initiated Rewarded Ads</Text>
            <Text style={[styles.pointBody, { color: colors.textMuted }]}>
              All core tools are 100% free. Users can optionally watch sponsor videos for bonus practice questions. Rewards are granted exclusively upon verified completion.
            </Text>
          </View>
        </View>
      </View>

      {/* Document & Data Privacy */}
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Document Safety & Data Protection</Text>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.policyPoint}>
          <Ionicons name="lock-closed" size={18} color="#2563EB" style={styles.checkIcon} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.pointHeading, { color: colors.text }]}>Zero Server File Storage</Text>
            <Text style={[styles.pointBody, { color: colors.textMuted }]}>
              PDF merging, splitting, and compression execute inside on-device memory or volatile temporary buffers. Student study documents are never stored or retained on remote servers.
            </Text>
          </View>
        </View>

        <View style={styles.policyPoint}>
          <Ionicons name="download" size={18} color="#2563EB" style={styles.checkIcon} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.pointHeading, { color: colors.text }]}>Full Data Portability & Deletion</Text>
            <Text style={[styles.pointBody, { color: colors.textMuted }]}>
              You have the unconditional right to export your complete academic history in JSON format at any time or trigger instant permanent account deletion from your Profile tab.
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  shieldBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 16,
  },
  bannerTitle: { fontSize: 16, fontWeight: '800' },
  bannerSub: { fontSize: 12, marginTop: 4, lineHeight: 17 },
  sectionTitle: { fontSize: 13, fontWeight: '800', marginTop: 14, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 8,
  },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  switchTitle: { fontSize: 14, fontWeight: '700' },
  switchDesc: { fontSize: 11, marginTop: 2, lineHeight: 16 },
  divider: { height: 1, width: '100%', marginVertical: 10 },
  resetConsentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 6,
  },
  resetConsentText: { fontSize: 12, fontWeight: '700', color: '#2563EB' },
  policyPoint: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14 },
  checkIcon: { marginRight: 10, marginTop: 2 },
  pointHeading: { fontSize: 13, fontWeight: '700' },
  pointBody: { fontSize: 11, marginTop: 2, lineHeight: 16 },
});
