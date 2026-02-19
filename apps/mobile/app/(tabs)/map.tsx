import { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import ProblemTypeModal from '@/components/ProblemTypeModal';
import ProblemTypeIcon from '@/components/ProblemTypeIcon';
import { hazardService, ProblemType } from '@/services/hazardService';

interface UserLocation {
  latitude: number;
  longitude: number;
}

interface PlacedMarker {
  id: string;
  latitude: number;
  longitude: number;
  problemType?: ProblemType;
}

export default function MapScreen() {
  const mapRef = useRef<MapView>(null);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [placedMarkers, setPlacedMarkers] = useState<PlacedMarker[]>([]);
  const [problemTypes, setProblemTypes] = useState<ProblemType[]>([]);
  const [loadingTypes, setLoadingTypes] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [pendingMarker, setPendingMarker] = useState<{ latitude: number; longitude: number } | null>(null);

  // Fetch problem types on mount
  useEffect(() => {
    const fetchProblemTypes = async () => {
      try {
        setLoadingTypes(true);
        const types = await hazardService.getTypes();
        setProblemTypes(types);
      } catch (error) {
        console.error('Error fetching problem types:', error);
      } finally {
        setLoadingTypes(false);
      }
    };

    fetchProblemTypes();
  }, []);

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
    // Store the marker location and show modal to select problem type
    setPendingMarker({ latitude, longitude });
    setModalVisible(true);
  };

  const handleProblemTypeSelect = (problemType: ProblemType) => {
    if (pendingMarker) {
      const newMarker: PlacedMarker = {
        id: Date.now().toString(),
        latitude: pendingMarker.latitude,
        longitude: pendingMarker.longitude,
        problemType,
      };
      setPlacedMarkers([...placedMarkers, newMarker]);
      setPendingMarker(null);
    }
  };

  const handleModalClose = () => {
    setModalVisible(false);
    setPendingMarker(null);
  };

  const handleRemoveMarker = (markerId: string) => {
    setPlacedMarkers(placedMarkers.filter((m: PlacedMarker) => m.id !== markerId));
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
            {placedMarkers.map((marker: PlacedMarker) => (
              <Marker
                key={marker.id}
                coordinate={{
                  latitude: marker.latitude,
                  longitude: marker.longitude,
                }}
                title={marker.problemType?.name || 'Problem Location'}
                description="Tap to remove this marker"
                onPress={() => handleRemoveMarker(marker.id)}
                tracksViewChanges={false}
              >
                {marker.problemType ? (
                  <ProblemTypeIcon
                    problemType={marker.problemType}
                    size={18}
                    variant="marker"
                  />
                ) : (
                  <View
                    style={[
                      styles.fallbackMarker,
                      { backgroundColor: '#e74c3c' },
                    ]}
                  />
                )}
              </Marker>
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

          <ProblemTypeModal
            visible={modalVisible}
            problemTypes={problemTypes}
            loading={loadingTypes}
            onSelect={handleProblemTypeSelect}
            onClose={handleModalClose}
          />
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
  fallbackMarker: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#fff',
  },
});
