import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../stores/themeStore';

interface QuickToolButtonProps {
  title: string;
  subtitle?: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  bgColor: string;
  onPress: () => void;
}

export const QuickToolButton: React.FC<QuickToolButtonProps> = ({
  title,
  subtitle,
  icon,
  color,
  bgColor,
  onPress,
}) => {
  const { colors } = useThemeStore();

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      style={[styles.button, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={onPress}
    >
      <View style={[styles.iconCircle, { backgroundColor: bgColor }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <Text numberOfLines={1} style={[styles.title, { color: colors.text }]}>{title}</Text>
      {subtitle && <Text numberOfLines={1} style={[styles.subtitle, { color: colors.textMuted }]}>{subtitle}</Text>}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    width: '23%',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  title: {
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 9,
    textAlign: 'center',
    marginTop: 1,
  },
});
