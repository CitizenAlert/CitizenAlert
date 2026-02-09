import { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';

interface UserLocation {
  latitude: number;
  longitude: number;
}

interface PlacedMarker {
  id: string;
  latitude: number;
  longitude: number;
}

export default function MapScreen() {
  const mapRef = useRef<MapView>(null);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [placedMarkers, setPlacedMarkers] = useState<PlacedMarker[]>([]);

  // Initialize map and get user location
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          console.error('Permission to access location was denied');
          return;
        }

        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

        const userLoc = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };

        setUserLocation(userLoc);

        // Animate camera to user location
        mapRef.current?.animateCamera(
          {
            center: userLoc,
            zoom: 15,
            heading: 0,
            pitch: 45,
          },
          { duration: 1000 }
        );
      } catch (error) {
        console.error('Error getting location:', error);
      }
    })();
  }, []);

  const handleMapPress = (event: any) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    const newMarker: PlacedMarker = {
      id: Date.now().toString(),
      latitude,
      longitude,
    };
    setPlacedMarkers([...placedMarkers, newMarker]);
  };

  const handleRemoveMarker = (markerId: string) => {
    setPlacedMarkers(placedMarkers.filter((marker) => marker.id !== markerId));
  };

  return (
    <View style={styles.container}>
      {userLocation ? (
        <>
          <MapView
            ref={mapRef}
            style={styles.map}
            provider={PROVIDER_GOOGLE}
            initialRegion={{
              latitude: userLocation.latitude,
              longitude: userLocation.longitude,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            }}
            rotateEnabled={true}
            pitchEnabled={true}
            zoomEnabled={true}
            scrollEnabled={true}
            showsUserLocation={true}
            followsUserLocation={false}
            showsMyLocationButton={true}
            onPress={handleMapPress}
          >
            <Marker
              coordinate={userLocation}
              title="My Location"
              description="Your current position"
              pinColor="#3498db"
            />
            {placedMarkers.map((marker) => (
              <Marker
                key={marker.id}
                coordinate={{
                  latitude: marker.latitude,
                  longitude: marker.longitude,
                }}
                title="Problem Location"
                description="Tap to remove this marker"
                pinColor="#e74c3c"
                onPress={() => handleRemoveMarker(marker.id)}
              />
            ))}
          </MapView>

          {/* Marker Controls */}
          <View style={styles.markerControlsContainer}>
            <Text style={styles.markerCountText}>
              Markers: {placedMarkers.length}
            </Text>
          </View>

          <View style={styles.instructionContainer}>
            <Text style={styles.instructionText}>Tap on the map to place markers</Text>
          </View>
        </>
      ) : (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading map...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  map: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  markerControlsContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  markerCountText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
    marginBottom: 8,
  },
  instructionContainer: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(52, 152, 219, 0.9)',
    borderRadius: 8,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  instructionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});
