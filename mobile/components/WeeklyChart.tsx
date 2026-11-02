import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useThemeStore } from '../stores/themeStore';
import { Ionicons } from '@expo/vector-icons';

interface DayData {
  day: string;
  date: string;
  plannedMinutes: number;
  actualMinutes: number;
}

interface WeeklyChartProps {
  chartData: DayData[];
  streak: number;
  productivityScore: number;
}

export const WeeklyChart: React.FC<WeeklyChartProps> = ({
  chartData = [],
  streak = 1,
  productivityScore = 75,
}) => {
  const { colors, isDark } = useThemeStore();

  const maxMinutes = Math.max(120, ...chartData.map((d) => Math.max(d.actualMinutes, d.plannedMinutes)));

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>Study Progress</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>Last 7 days focus time</Text>
        </View>

        <View style={styles.metricsRow}>
          {/* Streak Badge */}
          <View style={[styles.pillBadge, { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' }]}>
            <Ionicons name="flame" size={14} color="#D97706" />
            <Text style={[styles.pillText, { color: '#B45309' }]}>{streak}d Streak</Text>
          </View>

          {/* Productivity Score */}
          <View style={[styles.pillBadge, { backgroundColor: '#D1FAE5', borderColor: '#A7F3D0', marginLeft: 6 }]}>
            <Ionicons name="speedometer-outline" size={14} color="#059669" />
            <Text style={[styles.pillText, { color: '#047857' }]}>{productivityScore}% Score</Text>
          </View>
        </View>
      </View>

      {/* Bar Chart */}
      <View style={styles.barsContainer}>
        {chartData.map((item, index) => {
          const heightRatio = Math.min(1, item.actualMinutes / maxMinutes);
          const barHeight = Math.max(8, heightRatio * 110);
          const isToday = index === chartData.length - 1;

          return (
            <View key={item.date || index} style={styles.barCol}>
              <Text style={[styles.barHours, { color: colors.textMuted }]}>
                {item.actualMinutes > 0 ? `${Math.round(item.actualMinutes / 60 * 10) / 10}h` : ''}
              </Text>
              <View style={[styles.barTrack, { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' }]}>
                <View
                  style={[
                    styles.barFill,
                    {
                      height: barHeight,
                      backgroundColor: isToday ? '#2563EB' : '#60A5FA',
                    },
                  ]}
                />
              </View>
              <Text style={[styles.dayLabel, { color: isToday ? '#2563EB' : colors.textMuted, fontWeight: isToday ? '800' : '600' }]}>
                {item.day}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 10,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    gap: 3,
  },
  pillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  barsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 150,
    paddingTop: 10,
  },
  barCol: {
    alignItems: 'center',
    flex: 1,
  },
  barHours: {
    fontSize: 9,
    fontWeight: '700',
    marginBottom: 4,
    height: 14,
  },
  barTrack: {
    width: 14,
    height: 110,
    borderRadius: 7,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderRadius: 7,
  },
  dayLabel: {
    fontSize: 11,
    marginTop: 8,
  },
});
