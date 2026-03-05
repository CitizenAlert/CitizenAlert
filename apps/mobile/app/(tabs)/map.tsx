import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import ProblemTypeModal from '@/components/ProblemTypeModal';
import ProblemTypeIcon from '@/components/ProblemTypeIcon';
import IncidentDetailBottomSheet, {
  type IncidentDetailBottomSheetRef,
} from '@/components/IncidentDetailBottomSheet';
import { hazardService, ProblemType } from '@/services/hazardService';
import { useIncidentDraftStore } from '@/stores/incidentDraftStore';
import { useAuthStore } from '@/stores/authStore';
import { useMapStore } from '@/stores/mapStore';
import type { Hazard } from '@/types/hazard';

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
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const insets = useSafeAreaInsets();
  const { userLocation, hasInitialized, setUserLocation } = useMapStore();
  const mapRef = useRef<MapView>(null);
  const [placedMarkers, setPlacedMarkers] = useState<PlacedMarker[]>([]);
  const [problemTypes, setProblemTypes] = useState<ProblemType[]>([]);
  const [loadingTypes, setLoadingTypes] = useState(false);
  const [hazardsFromApi, setHazardsFromApi] = useState<Hazard[]>([]);
  const [loadingHazards, setLoadingHazards] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [pendingMarker, setPendingMarker] = useState<{ latitude: number; longitude: number } | null>(null);
  const [selectedHazard, setSelectedHazard] = useState<Hazard | null>(null);
  const incidentSheetRef = useRef<IncidentDetailBottomSheetRef>(null);
  const markerPressHandledRef = useRef(false);

  const fetchHazards = useCallback(async (lat: number, lon: number, radius: number = 50) => {
    try {
      setLoadingHazards(true);
      const list = await hazardService.getNearby(lat, lon, radius);
      setHazardsFromApi(list);
    } catch (error) {
      console.error('Error fetching hazards:', error);
    } finally {
      setLoadingHazards(false);
    }
  }, []);

  const fetchHazardsForRegion = useCallback(async (region: { latitude: number; longitude: number; latitudeDelta: number; longitudeDelta: number }) => {
    // Calculate radius based on region size (approximate)
    const radiusKm = Math.max(region.latitudeDelta, region.longitudeDelta) * 111; // 1 degree ≈ 111km
    const clampedRadius = Math.min(Math.max(radiusKm, 1), 50); // Between 1km and 50km
    
    await fetchHazards(region.latitude, region.longitude, clampedRadius);
  }, [fetchHazards]);

  // Load hazards when user location is first available
  useEffect(() => {
    if (userLocation && hazardsFromApi.length === 0) {
      fetchHazards(userLocation.latitude, userLocation.longitude);
    }
  }, [userLocation?.latitude, userLocation?.longitude]);

  // Refetch hazards when screen is focused (e.g. after creating an incident or returning to the tab)
  useFocusEffect(
    useCallback(() => {
      if (userLocation) {
        fetchHazards(userLocation.latitude, userLocation.longitude);
      }
    }, [userLocation, fetchHazards])
  );

  // When returning from incident recap with "Create incident", add the marker when map gains focus
  useFocusEffect(
    useCallback(() => {
      const state = useIncidentDraftStore.getState();
      if (!state.pendingAddToMap || !state.problemType) return;
      const newMarker: PlacedMarker = {
        id: Date.now().toString(),
        latitude: state.latitude,
        longitude: state.longitude,
        problemType: state.problemType,
      };
      setPlacedMarkers((prev) => [...prev, newMarker]);
      useIncidentDraftStore.getState().reset();
    }, [])
  );

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

  // Initialize map and get user location (only once globally, persisted across navigation)
  useEffect(() => {
    // Skip if already initialized
    if (hasInitialized) return;

    let isMounted = true;
    
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

        if (!isMounted) return;

        const userLoc = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };

        setUserLocation(userLoc);

        // Animate camera to user location only on first load
        setTimeout(() => {
          if (isMounted && mapRef.current) {
            mapRef.current.animateCamera(
              {
                center: userLoc,
                zoom: 15,
                heading: 0,
                pitch: 45,
              },
              { duration: 1000 }
            );
          }
        }, 100);
      } catch (error) {
        console.error('Error getting location:', error);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [hasInitialized, setUserLocation]);

  const handleMapPress = (event: any) => {
    if (markerPressHandledRef.current) {
      markerPressHandledRef.current = false;
      return;
    }
    
    // Only allow placing markers if authenticated
    if (!isAuthenticated) {
      return;
    }

    const { latitude, longitude } = event.nativeEvent.coordinate;
    setPendingMarker({ latitude, longitude });
    setModalVisible(true);
  };

  const handleProblemTypeSelect = (problemType: ProblemType) => {
    if (pendingMarker) {
      useIncidentDraftStore.getState().setDraft({
        latitude: pendingMarker.latitude,
        longitude: pendingMarker.longitude,
        problemType,
      });
      setModalVisible(false);
      setPendingMarker(null);
      router.push('/incident/photo');
    }
  };

  const handleModalClose = () => {
    setModalVisible(false);
    setPendingMarker(null);
  };

  const handleRemoveMarker = (markerId: string) => {
    setPlacedMarkers(placedMarkers.filter((m: PlacedMarker) => m.id !== markerId));
  };

  const getProblemTypeForHazard = (typeId: string): ProblemType | undefined =>
    problemTypes.find((t) => t.id === typeId);

  const handleHazardMarkerPress = (hazard: Hazard) => {
    markerPressHandledRef.current = true;
    setSelectedHazard(hazard);
    setTimeout(() => incidentSheetRef.current?.present(), 0);
  };

  const handleIncidentSheetDismiss = () => {
    setSelectedHazard(null);
  };

  const handleIncidentUpdate = () => {
    // Refresh hazards when an incident is updated
    if (userLocation) {
      fetchHazards(userLocation.latitude, userLocation.longitude);
    }
  };

  return (
    <View style={styles.container}>
      {userLocation ? (
        <>
          <MapView
            ref={mapRef}
            style={[styles.map, { marginTop: insets.top }]}
            provider={PROVIDER_GOOGLE}
            initialRegion={{
              latitude: userLocation.latitude,
              longitude: userLocation.longitude,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            }}
            minZoomLevel={10}
            maxZoomLevel={18}
            rotateEnabled={true}
            pitchEnabled={true}
            zoomEnabled={true}
            scrollEnabled={true}
            showsUserLocation={true}
            followsUserLocation={false}
            showsMyLocationButton={true}
            onPress={handleMapPress}
            onRegionChangeComplete={fetchHazardsForRegion}
          >
            <Marker
              coordinate={userLocation}
              title="Ma position"
              description="Votre position actuelle"
              pinColor="#3498db"
            />
            {hazardsFromApi.map((hazard) => {
              const problemType = getProblemTypeForHazard(hazard.type);
              return (
                <Marker
                  key={hazard.id}
                  coordinate={{
                    latitude: Number(hazard.latitude),
                    longitude: Number(hazard.longitude),
                  }}
                  title={problemType?.name || hazard.type}
                  description={hazard.description || undefined}
                  onPress={() => handleHazardMarkerPress(hazard)}
                  tracksViewChanges={false}
                >
                  {problemType ? (
                    <ProblemTypeIcon
                      problemType={problemType}
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
              );
            })}
            {placedMarkers.map((marker: PlacedMarker) => (
              <Marker
                key={`local-${marker.id}`}
                coordinate={{
                  latitude: marker.latitude,
                  longitude: marker.longitude,
                }}
                title={marker.problemType?.name || 'Emplacement du problème'}
                description="Appuyez pour supprimer ce marqueur"
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
              {hazardsFromApi.length} {hazardsFromApi.length === 1 ? 'incident visible' : 'incidents visibles'}
              {placedMarkers.length > 0 ? ` (+ ${placedMarkers.length} local)` : ''}
            </Text>
          </View>

          {isAuthenticated && (
            <View style={[styles.instructionContainer, { top: insets.top + 16 }]}>
              <Text style={styles.instructionText}>Appuyez sur la carte pour signaler un incident</Text>
            </View>
          )}

          <ProblemTypeModal
            visible={modalVisible}
            problemTypes={problemTypes}
            loading={loadingTypes}
            onSelect={handleProblemTypeSelect}
            onClose={handleModalClose}
          />

          <IncidentDetailBottomSheet
            ref={incidentSheetRef}
            hazard={selectedHazard}
            onDismiss={handleIncidentSheetDismiss}
            onUpdate={handleIncidentUpdate}
          />
        </>
      ) : (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Chargement de la carte...</Text>
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
