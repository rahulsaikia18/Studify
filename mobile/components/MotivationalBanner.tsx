import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../stores/themeStore';

interface MotivationalBannerProps {
  quote?: string;
  author?: string;
}

export const MotivationalBanner: React.FC<MotivationalBannerProps> = ({
  quote = "Small disciplines repeated with consistency every day lead to great achievements.",
  author = "Daily Inspiration",
}) => {
  const { colors, isDark } = useThemeStore();

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#161F30' : '#EEF2FF', borderColor: isDark ? '#2A364F' : '#C7D2FE' }]}>
      <View style={styles.quoteRow}>
        <Ionicons name="sparkles-sharp" size={18} color="#6366F1" style={styles.icon} />
        <Text style={[styles.heading, { color: '#4F46E5' }]}>DAILY MOTIVATION</Text>
      </View>
      <Text style={[styles.quoteText, { color: colors.text }]}>"{quote}"</Text>
      {author && (
        <Text style={[styles.authorText, { color: colors.textMuted }]}>— {author}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 10,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  quoteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  icon: {
    marginRight: 6,
  },
  heading: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  quoteText: {
    fontSize: 14,
    fontStyle: 'italic',
    lineHeight: 20,
    fontWeight: '500',
  },
  authorText: {
    fontSize: 12,
    marginTop: 6,
    textAlign: 'right',
    fontWeight: '600',
  },
});
