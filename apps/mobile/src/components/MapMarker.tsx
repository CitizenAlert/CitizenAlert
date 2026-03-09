// components/MapMarker.tsx
import React, { useState, useEffect } from 'react';
import { Marker } from 'react-native-maps';

interface MapMarkerProps {
  coordinate: { latitude: number; longitude: number };
  title?: string;
  description?: string;
  onPress?: () => void;
  children: React.ReactNode;
}

export function MapMarker({ coordinate, title, description, onPress, children }: MapMarkerProps) {
  const [tracksViewChanges, setTracksViewChanges] = useState(true);

  useEffect(() => {
    // Stop tracking after a short delay to allow the view to render
    const timer = setTimeout(() => {
      setTracksViewChanges(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Marker
      coordinate={coordinate}
      title={title}
      description={description}
      onPress={onPress}
      tracksViewChanges={tracksViewChanges}
    >
      {children}
    </Marker>
  );
}
