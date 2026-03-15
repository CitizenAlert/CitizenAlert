import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Text, Platform, Alert, TouchableOpacity } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import * as Sentry from '@sentry/react-native';
import { Ionicons } from '@expo/vector-icons';
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
import { MapMarker } from '@/components/MapMarker';

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

const NANTES_DEFAULT_LOCATION = {
  latitude: 47.2184,
  longitude: -1.5536,
};

export default function MapScreen() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
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
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [apiUnreachable, setApiUnreachable] = useState(false);
  const [hasAnimatedToUserLocation, setHasAnimatedToUserLocation] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const incidentSheetRef = useRef<IncidentDetailBottomSheetRef>(null);
  const markerPressHandledRef = useRef(false);

  useEffect(() => {
    if (apiUnreachable) {
      Alert.alert(
        'Serveur inaccessible',
        'Impossible de contacter le serveur. La carte reste disponible mais les incidents ne peuvent pas être chargés.',
        [{ text: 'OK', onPress: () => setApiUnreachable(false) }]
      );
    }
  }, [apiUnreachable]);

  useEffect(() => {
    Sentry.addBreadcrumb({
      category: 'map',
      message: 'MapScreen mounted',
      level: 'info',
      data: { platform: Platform.OS, provider: 'google' },
    });

    const timeout = setTimeout(() => {
      if (!mapRef.current) {
        Sentry.captureMessage('MapView still not rendered after 15s — possible load failure', 'error');
      }
    }, 15000);
    return () => clearTimeout(timeout);
  }, []);

  const handleMapReady = useCallback(() => {
    setMapReady(true);
    Sentry.addBreadcrumb({
      category: 'map',
      message: 'MapView onMapReady fired — map loaded successfully',
      level: 'info',
    });
    Sentry.captureMessage('MapView loaded successfully', 'info');
  }, []);

  // Animate to user location once map is ready and we have the location
  useEffect(() => {
    if (!mapReady || !userLocation || hasAnimatedToUserLocation) return;

    setHasAnimatedToUserLocation(true);
    
    setTimeout(() => {
      if (mapRef.current) {
        mapRef.current.animateCamera(
          { center: userLocation, zoom: 15, heading: 0, pitch: 0 },
          { duration: 1000 }
        );
        Sentry.addBreadcrumb({
          category: 'map',
          message: 'Animated to user location after map ready',
          level: 'info',
          data: userLocation,
        });
      }
    }, 300); // Increased delay to ensure map is fully rendered
  }, [mapReady, userLocation, hasAnimatedToUserLocation]);

  const handleMapError = useCallback((error: any) => {
    const errorMsg = error?.nativeEvent?.error || error?.message || 'Unknown map error';
    setMapError(errorMsg);
    Sentry.captureException(new Error(`MapView error: ${errorMsg}`), {
      tags: { component: 'MapView', provider: 'google' },
      extra: { nativeEvent: error?.nativeEvent },
    });
  }, []);

  const fetchHazards = useCallback(async (lat: number, lon: number, radius: number = 50) => {
    try {
      setLoadingHazards(true);
      const list = await hazardService.getNearby(lat, lon, radius);
      setHazardsFromApi(list);
      Sentry.addBreadcrumb({
        category: 'map',
        message: `Fetched ${list.length} hazards`,
        level: 'info',
        data: { lat, lon, count: list.length },
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { action: 'fetchHazards' },
        extra: { lat, lon },
      });
      console.error('Error fetching hazards:', error);
      const isNetworkError = (error as any).request && !(error as any).response;
      if (isNetworkError) setApiUnreachable(true);
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

  // When returning from incident recap with "Create incident", refresh hazards to get the new incident with imageUrl
  useFocusEffect(
    useCallback(() => {
      const state = useIncidentDraftStore.getState();
      if (!state.pendingAddToMap || !state.problemType) return;
      
      // Fetch hazards to get the newly created incident with imageUrl from backend
      if (userLocation) {
        fetchHazards(userLocation.latitude, userLocation.longitude);
      }
      useIncidentDraftStore.getState().reset();
    }, [userLocation, fetchHazards])
  );

  useEffect(() => {
    const fetchProblemTypes = async () => {
      try {
        setLoadingTypes(true);
        const types = await hazardService.getTypes();
        setProblemTypes(types);
        Sentry.addBreadcrumb({
          category: 'map',
          message: `Fetched ${types.length} problem types`,
          level: 'info',
        });
      } catch (error) {
        Sentry.captureException(error, {
          tags: { action: 'fetchProblemTypes' },
        });
        console.error('Error fetching problem types:', error);
        const isNetworkError = (error as any).request && !(error as any).response;
        if (isNetworkError) setApiUnreachable(true);
      } finally {
        setLoadingTypes(false);
      }
    };

    fetchProblemTypes();
  }, []);

  const handleRecenterMap = useCallback(() => {
    if (userLocation && mapRef.current) {
      mapRef.current.animateCamera(
        { center: userLocation, zoom: 15, heading: 0, pitch: 0 },
        { duration: 500 }
      );
    }
  }, [userLocation]);

  const handleOpenProfile = useCallback(() => {
    router.push('/(tabs)/profile');
  }, [router]);

  const handleOpenNotifications = useCallback(() => {
    if (!isAuthenticated) {
      Alert.alert('Connexion requise', 'Veuillez vous connecter pour voir les notifications');
      router.push('/(tabs)/profile');
      return;
    }
    router.push('/(tabs)/notifications');
  }, [isAuthenticated, router]);

  const handleOpenReports = useCallback(() => {
    if (!isAuthenticated) {
      Alert.alert('Connexion requise', 'Veuillez vous connecter pour voir vos rapports');
      router.push('/(tabs)/profile');
      return;
    }
    router.push('/(tabs)/report');
  }, [isAuthenticated, router]);

  const getIncidentCountColor = (count: number): string => {
    if (count >= 10) return '#ef4444'; // Red for 10+
    if (count > 5) return '#f97316';   // Orange for 5-10
    return '#2563eb';                  // Blue for 1-5
  };

  // Load unread notification count
  useEffect(() => {
    if (isAuthenticated) {
      const { notificationService } = require('@/services/notificationService');
      notificationService.getUnreadCount().then(setUnreadCount).catch(() => setUnreadCount(0));

      const interval = setInterval(() => {
        notificationService.getUnreadCount().then(setUnreadCount).catch(() => setUnreadCount(0));
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  // Initialize map and get user location (only once globally, persisted across navigation)
  useEffect(() => {
    if (hasInitialized) return;

    let isMounted = true;

    (async () => {
      try {
        Sentry.addBreadcrumb({
          category: 'map',
          message: 'Requesting location permission',
          level: 'info',
        });

        const { status } = await Location.requestForegroundPermissionsAsync();
        Sentry.addBreadcrumb({
          category: 'map',
          message: `Location permission: ${status}`,
          level: status === 'granted' ? 'info' : 'warning',
        });

        if (status !== 'granted') {
          Sentry.captureMessage('Location permission denied', 'warning');
          setUserLocation(NANTES_DEFAULT_LOCATION);
          return;
        }

        // Step 1: Try last known position for instant result
        let initialLocation: UserLocation | null = null;
        try {
          const lastKnown = await Location.getLastKnownPositionAsync({
            maxAge: 5 * 60 * 1000, // 5 minutes
            requiredAccuracy: 100,
          });

          if (lastKnown && isMounted) {
            initialLocation = {
              latitude: lastKnown.coords.latitude,
              longitude: lastKnown.coords.longitude,
            };

            Sentry.addBreadcrumb({
              category: 'map',
              message: 'Last known location obtained',
              level: 'info',
              data: initialLocation,
            });

            setUserLocation(initialLocation);
          }
        } catch {
          // No last known position, continue
        }

        // Step 2: Get precise position in background
        try {
          const location = await Promise.race([
            Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.Balanced,
            }),
            new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error('Location timeout')), 10000)
            ),
          ]);

          if (!isMounted) return;

          const userLoc: UserLocation = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          };

          Sentry.addBreadcrumb({
            category: 'map',
            message: 'Precise user location obtained',
            level: 'info',
            data: userLoc,
          });

          setUserLocation(userLoc);
        } catch (error: any) {
          const isExpected =
            error?.code === 'ERR_CURRENT_LOCATION_IS_UNAVAILABLE' ||
            error?.message === 'Location timeout';

          if (isExpected) {
            console.warn('Could not get precise location:', error.message);
            // If we never got a last known position either, fall back to default
            if (!initialLocation && isMounted) {
              setUserLocation(NANTES_DEFAULT_LOCATION);
            }
          } else {
            Sentry.captureException(error, { tags: { action: 'getCurrentPosition' } });
            console.error('Error getting precise location:', error);
            if (!initialLocation && isMounted) {
              setUserLocation(NANTES_DEFAULT_LOCATION);
            }
          }
        }
      } catch (error) {
        Sentry.captureException(error, { tags: { action: 'getLocation' } });
        console.error('Error getting location:', error);
        if (isMounted) {
          setUserLocation(NANTES_DEFAULT_LOCATION);
        }
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
      {
        (() => {
          const displayLocation = userLocation || NANTES_DEFAULT_LOCATION;
          return (
            <>
              <MapView
                ref={mapRef}
                style={styles.map}
                provider={PROVIDER_GOOGLE}
                initialRegion={{
                  latitude: displayLocation.latitude,
                  longitude: displayLocation.longitude,
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
                showsMyLocationButton={false}
                onMapReady={handleMapReady}
                onPress={handleMapPress}
                onRegionChangeComplete={fetchHazardsForRegion}
              >
                {userLocation && (
                  <Marker
                    coordinate={userLocation}
                    title="Ma position"
                    description="Votre position actuelle"
                    pinColor="#3498db"
                  />
                )}
                {hazardsFromApi.map((hazard) => {
                  const problemType = getProblemTypeForHazard(hazard.type);
                  const isUserHazard = isAuthenticated && hazard.userId === user?.id;
                  return (
                    <MapMarker
                      key={hazard.id}
                      coordinate={{
                        latitude: Number(hazard.latitude),
                        longitude: Number(hazard.longitude),
                      }}
                      title={problemType?.name || hazard.type}
                      description={hazard.description || undefined}
                      onPress={() => handleHazardMarkerPress(hazard)}
                    >
                      <View style={[styles.markerContainer, isUserHazard && styles.userHazardMarker]}>
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
                        {isUserHazard && (
                          <View style={styles.userHazardBadge}>
                            <Text style={styles.userHazardBadgeText}>MY</Text>
                          </View>
                        )}
                      </View>
                    </MapMarker>
                  );
                })}
                {placedMarkers.map((marker: PlacedMarker) => (
                  <MapMarker
                    key={`local-${marker.id}`}
                    coordinate={{
                      latitude: marker.latitude,
                      longitude: marker.longitude,
                    }}
                    title={marker.problemType?.name || 'Emplacement du problème'}
                    description="Appuyez pour supprimer ce marqueur"
                    onPress={() => handleRemoveMarker(marker.id)}
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
                  </MapMarker>
                ))}
              </MapView>

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

              {/* Floating Action Buttons */}
              <View 
                style={StyleSheet.absoluteFillObject} 
                pointerEvents="box-none"
              >
                {/* Top-Left: Recenter Button */}
                <TouchableOpacity
                  style={[styles.fab, styles.fabTopLeft, { top: insets.top + 16, left: 16 }]}
                  onPress={handleRecenterMap}
                  activeOpacity={0.7}
                >
                  <Ionicons name="compass" size={24} color="#fff" />
                </TouchableOpacity>

                {/* Top-Right: Notifications + Reports + Profile */}
                <View 
                  style={[styles.fabGroup, { top: insets.top + 16, right: 16 }]} 
                  pointerEvents="box-none"
                >
                  {isAuthenticated && (
                    <TouchableOpacity
                      style={styles.fab}
                      onPress={handleOpenNotifications}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="notifications" size={24} color="#fff" />
                      {unreadCount > 0 && (
                        <View style={styles.badge}>
                          <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  )}

                  {isAuthenticated && (
                    <TouchableOpacity
                      style={[styles.fab, { marginLeft: 12 }]}
                      onPress={handleOpenReports}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="document-text" size={24} color="#fff" />
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={[styles.fab, { marginLeft: isAuthenticated ? 12 : 0 }]}
                    onPress={handleOpenProfile}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="person" size={24} color="#fff" />
                  </TouchableOpacity>
                </View>

                {/* Bottom-Left: Incident Count Badge */}
                <View
                  style={[
                    styles.incidentCountBadge,
                    { bottom: insets.bottom + 24, left: 16, borderLeftColor: getIncidentCountColor(hazardsFromApi.length), borderLeftWidth: 4 }
                  ]}
                >
                  <Text style={[styles.incidentCountText, { color: getIncidentCountColor(hazardsFromApi.length) }]}>
                    {hazardsFromApi.length}
                  </Text>
                  <Text style={styles.incidentCountLabel}>incidents</Text>
                </View>
              </View>
            </>
          );
        })()
      }
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
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
  markerContainer: {
    position: 'relative',
  },
  userHazardMarker: {
    borderWidth: 3,
    borderColor: '#2563eb',
    borderRadius: 24,
    padding: 2,
  },
  userHazardBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#2563eb',
    borderRadius: 12,
    width: 22,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  userHazardBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2563eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  fabTopLeft: {
    position: 'absolute',
    zIndex: 20,
  },
  fabBottomRight: {
    position: 'absolute',
    zIndex: 20,
  },
  fabGroup: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start', // ✅ shrinks to content, no invisible area
    zIndex: 20,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#ef4444',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  incidentCountBadge: {
    position: 'absolute',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    paddingLeft: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    alignItems: 'center',
    zIndex: 15,
  },
  incidentCountText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  incidentCountLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
});
