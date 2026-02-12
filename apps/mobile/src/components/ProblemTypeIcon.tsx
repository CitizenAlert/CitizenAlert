import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ProblemType } from '@/services/hazardService';

/** Valid Ionicons names we use for hazard types (from backend iconShape). */
const VALID_ICON_NAMES = [
  'car-sport',
  'construct',
  'warning',
  'shield-checkmark',
  'ellipse',
] as const;

function getIconName(shape: string): (typeof VALID_ICON_NAMES)[number] {
  return VALID_ICON_NAMES.includes(shape as any) ? (shape as (typeof VALID_ICON_NAMES)[number]) : 'ellipse';
}

interface ProblemTypeIconProps {
  problemType: Partial<Pick<ProblemType, 'iconShape' | 'iconColor'>>;
  size?: number;
  /** For map marker: show as a colored bubble with white icon. For list: just icon with color. */
  variant?: 'marker' | 'list';
  style?: ViewStyle;
}

export default function ProblemTypeIcon({
  problemType,
  size = 24,
  variant = 'list',
  style,
}: ProblemTypeIconProps) {
  const iconName = getIconName(problemType.iconShape ?? 'ellipse');
  const iconColor = problemType.iconColor ?? '#95a5a6';

  if (variant === 'marker') {
    const bubbleSize = Math.max(size * 2, 36);
    return (
      <View
        style={[
          styles.markerBubble,
          {
            width: bubbleSize,
            height: bubbleSize,
            borderRadius: bubbleSize / 2,
            backgroundColor: iconColor,
          },
          style,
        ]}
      >
        <Ionicons name={iconName} size={size} color="#fff" />
      </View>
    );
  }

  return (
    <View style={[styles.listIcon, style]}>
      <Ionicons name={iconName} size={size} color={iconColor} />
    </View>
  );
}

const styles = StyleSheet.create({
  markerBubble: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  listIcon: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
