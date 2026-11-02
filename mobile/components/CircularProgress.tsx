import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

interface CircularProgressProps {
  size: number;
  strokeWidth: number;
  progress: number; // 0 to 1
  color: string;
  backgroundColor: string;
  children?: React.ReactNode;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
  size,
  strokeWidth,
  progress,
  color,
  backgroundColor,
  children,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - Math.min(1, Math.max(0, progress)) * circumference;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={styles.svg}>
        {/* Background Track */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Progress Arc */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <View style={styles.childContainer}>{children}</View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  svg: {
    position: 'absolute',
  },
  childContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
