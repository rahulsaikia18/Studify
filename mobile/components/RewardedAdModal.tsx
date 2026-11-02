import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../stores/themeStore';
import { AdManager, AdReward } from '../services/AdManager';
import { AdConfig } from '../constants/AdConfig';
import { HapticsService } from '../services/HapticsService';

interface RewardedAdModalProps {
  visible: boolean;
  rewardType: 'EXTRA_QUIZ' | 'PREMIUM_UNLOCK_24H' | 'BONUS_ANALYTICS';
  onClose: () => void;
  onRewardEarned: (reward: AdReward) => void;
}

export const RewardedAdModal: React.FC<RewardedAdModalProps> = ({
  visible,
  rewardType,
  onClose,
  onRewardEarned,
}) => {
  const { colors, isDark } = useThemeStore();
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const rewardInfo = AdConfig.rewards[rewardType] || {
    title: 'Bonus Student Perk',
    description: 'Watch a short sponsored video to unlock bonus practice questions.',
  };

  const handleWatchAd = async () => {
    HapticsService.medium();
    setLoading(true);
    setStatusMessage('Loading sponsored video...');

    await AdManager.showRewardedAd(
      rewardType,
      (reward) => {
        setLoading(false);
        setStatusMessage(null);
        HapticsService.success();
        onRewardEarned(reward);
        onClose();
      },
      (error) => {
        setLoading(false);
        setStatusMessage(`Could not display sponsor ad: ${error}. Reward granted for your patience!`);
        setTimeout(() => {
          onRewardEarned({
            type: rewardType,
            transactionId: `fallback_${Date.now()}`,
            grantedAt: new Date().toISOString(),
          });
          onClose();
        }, 1200);
      }
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            disabled={loading}
          >
            <Ionicons name="close" size={22} color={colors.textMuted} />
          </TouchableOpacity>

          <View style={styles.giftIconContainer}>
            <Ionicons name="gift" size={36} color="#3B82F6" />
          </View>

          <Text style={[styles.title, { color: colors.text }]}>{rewardInfo.title}</Text>
          <Text style={[styles.description, { color: colors.textMuted }]}>
            {rewardInfo.description}
          </Text>

          <View style={[styles.disclosureBox, { backgroundColor: isDark ? '#1E293B' : '#F8FAFC' }]}>
            <Ionicons name="information-circle-outline" size={16} color="#3B82F6" style={{ marginRight: 6 }} />
            <Text style={[styles.disclosureText, { color: colors.textMuted }]}>
              Watching this advertisement is completely optional. Essential core features are always available.
            </Text>
          </View>

          {statusMessage && (
            <Text style={styles.statusMessage}>{statusMessage}</Text>
          )}

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.cancelBtn, { borderColor: colors.border }]}
              onPress={onClose}
              disabled={loading}
            >
              <Text style={[styles.cancelText, { color: colors.textMuted }]}>Not Now</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.confirmBtn, loading && styles.btnDisabled]}
              onPress={handleWatchAd}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Ionicons name="play-circle" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.confirmText}>Watch & Unlock</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 6,
  },
  giftIconContainer: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  disclosureBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    marginBottom: 20,
    width: '100%',
  },
  disclosureText: {
    fontSize: 11,
    lineHeight: 16,
    flex: 1,
  },
  statusMessage: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '600',
  },
  confirmBtn: {
    flex: 1.4,
    backgroundColor: '#2563EB',
    paddingVertical: 13,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDisabled: {
    opacity: 0.6,
  },
  confirmText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
