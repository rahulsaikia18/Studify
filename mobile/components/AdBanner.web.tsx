import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useThemeStore } from '../stores/themeStore';
import { Ionicons } from '@expo/vector-icons';

interface AdBannerProps {
  placement?: string;
}

export const AdBanner: React.FC<AdBannerProps> = ({ placement = 'Dashboard' }) => {
  const { colors, isDark } = useThemeStore();

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#161F30' : '#EFF6FF', borderColor: isDark ? '#2A364F' : '#BFDBFE' }]}>
      <View style={styles.contentRow}>
        <View style={styles.iconCircle}>
          <Ionicons name="sparkles" size={16} color="#3B82F6" />
        </View>
        <View style={styles.textContainer}>
          <View style={styles.labelRow}>
            <Text style={styles.adBadge}>AD • Google AdMob Test (Web Mode)</Text>
            <Text style={[styles.adPlacement, { color: isDark ? '#94A3B8' : '#64748B' }]}>{placement}</Text>
          </View>
          <Text style={[styles.adTitle, { color: colors.text }]}>Study Smarter with Student Buddy Pro</Text>
          <Text style={[styles.adSub, { color: colors.textMuted }]}>Compliant adaptive banner slot • Zero navigation overlap</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 10,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  textContainer: {
    flex: 1,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  adBadge: {
    fontSize: 9,
    fontWeight: '800',
    color: '#3B82F6',
    letterSpacing: 0.5,
  },
  adPlacement: {
    fontSize: 10,
  },
  adTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  adSub: {
    fontSize: 11,
    marginTop: 1,
  },
});
