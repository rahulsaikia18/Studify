import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../stores/themeStore';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBg: string;
  badge?: string;
  badgeColor?: string;
  onPress?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  iconColor,
  iconBg,
  badge,
  badgeColor = '#3B82F6',
  onPress,
}) => {
  const { colors } = useThemeStore();

  return (
    <TouchableOpacity
      activeOpacity={onPress ? 0.7 : 1}
      onPress={onPress}
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
    >
      <View style={styles.header}>
        <View style={[styles.iconWrapper, { backgroundColor: iconBg }]}>
          <Ionicons name={icon} size={20} color={iconColor} />
        </View>
        {badge && (
          <View style={[styles.badge, { backgroundColor: `${badgeColor}15` }]}>
            <Text style={[styles.badgeText, { color: badgeColor }]}>{badge}</Text>
          </View>
        )}
      </View>
      <Text style={[styles.value, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.title, { color: colors.textMuted }]}>{title}</Text>
      {subtitle && <Text style={[styles.subtitle, { color: colors.textMuted }]}>{subtitle}</Text>}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: '45%',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    margin: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  iconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  value: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 2,
  },
  title: {
    fontSize: 12,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 10,
    marginTop: 2,
  },
});
