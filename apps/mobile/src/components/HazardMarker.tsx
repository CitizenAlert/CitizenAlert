import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Marker } from 'react-native-maps';
import { ProblemType, Hazard } from '@/services/hazardService';

const VALID_ICON_NAMES = [
  'weather-pouring', 'water', 'tree', 'trash-can', 'road-variant',
  'lightbulb-off', 'traffic-light-outline', 'walk', 'bench', 'bug',
] as const;

const DEFAULT_ICON = 'alert-circle-outline';

function getIconName(shape?: string): (typeof VALID_ICON_NAMES)[number] | typeof DEFAULT_ICON {
  if (!shape) return DEFAULT_ICON;
  return VALID_ICON_NAMES.includes(shape as any)
    ? (shape as (typeof VALID_ICON_NAMES)[number])
    : DEFAULT_ICON;
}

// ─── List variant ────────────────────────────────────────────────────────────

interface ProblemTypeIconProps {
  problemType: Partial<Pick<ProblemType, 'iconShape' | 'iconColor'>>;
  size?: number;
  style?: ViewStyle;
}

export function ProblemTypeIcon({ problemType, size = 24, style }: ProblemTypeIconProps) {
  const iconName = getIconName(problemType.iconShape);
  const iconColor = problemType.iconColor ?? '#64748b';

  return (
    <View style={[styles.listIcon, style]}>
      <MaterialCommunityIcons name={iconName as any} size={size} color={iconColor} />
    </View>
  );
}

// ─── Map marker variant ───────────────────────────────────────────────────────

interface HazardMarkerProps {
  problemType?: Partial<Pick<ProblemType, 'iconShape' | 'iconColor' | 'name'>>;
}

export function HazardMarker({ problemType }: HazardMarkerProps) {
  const iconName = getIconName(problemType?.iconShape);
  const iconColor = problemType?.iconColor ?? '#64748b';

  return (
    <View collapsable={false} style={styles.markerWrapper}>
      <View style={[styles.bubble]}>
        <View style={[styles.iconBubble, { backgroundColor: iconColor }]}>
          <MaterialCommunityIcons name={iconName as any} size={18} color="#fff" />
        </View>
      </View>
      <View style={[styles.tail]} />
    </View>
  );
}

// ─── Map marker with Marker wrapper ──────────────────────────────────────────

interface HazardMapMarkerProps {
  hazard: Hazard;
  problemType?: ProblemType;
  onPress?: (hazard: Hazard) => void;
}

export function HazardMapMarker({
  hazard,
  problemType,
  onPress,
}: HazardMapMarkerProps) {
  const [tracks, setTracks] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setTracks(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Marker
      coordinate={{
        latitude: Number(hazard.latitude),
        longitude: Number(hazard.longitude),
      }}
      onPress={() => onPress?.(hazard)}
      tracksViewChanges={tracks}
      anchor={{ x: 0.5, y: 1 }}
    >
      <HazardMarker problemType={problemType} />
    </Marker>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  listIcon: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  markerWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    padding: 2,
  },

  bubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
    padding: 3,
  },

  iconBubble: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },

  pill: {
    backgroundColor: '#6366f1',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
    marginLeft: 4,
    marginRight: 2,
  },

  pillText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
  },

  tail: {
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: 'rgba(255,255,255,0.4)',
    marginTop: -2,
  },
});
