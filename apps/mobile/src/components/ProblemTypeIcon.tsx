import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ProblemType } from '@/services/hazardService';

/** Material Community Icons used for incident types (from backend iconShape). */
const VALID_ICON_NAMES = [
  'weather-pouring',
  'water',
  'tree',
  'trash-can',
  'road-variant',
  'lightbulb-off',
  'traffic-light-outline',
  'sidewalk',
  'bench',
  'rat',
] as const;

const DEFAULT_ICON = 'alert-circle-outline';

function getIconName(shape: string): (typeof VALID_ICON_NAMES)[number] | typeof DEFAULT_ICON {
  return VALID_ICON_NAMES.includes(shape as (typeof VALID_ICON_NAMES)[number])
    ? (shape as (typeof VALID_ICON_NAMES)[number])
    : DEFAULT_ICON;
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
  const iconName = getIconName(problemType.iconShape ?? DEFAULT_ICON);
  const iconColor = problemType.iconColor ?? '#64748b';

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
        <MaterialCommunityIcons name={iconName} size={size} color="#fff" />
      </View>
    );
  }

  return (
    <View style={[styles.listIcon, style]}>
      <MaterialCommunityIcons name={iconName} size={size} color={iconColor} />
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
