import { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';

interface UserLocation {
  latitude: number;
  longitude: number;
}

export default function MapScreen() {
  const mapRef = useRef<MapView>(null);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);

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
          >
            <Marker
              coordinate={userLocation}
              title="My Location"
              description="Your current position"
              pinColor="#3498db"
            />
          </MapView>
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
});
