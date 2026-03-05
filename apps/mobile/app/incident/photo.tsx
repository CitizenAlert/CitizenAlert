import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useIncidentDraftStore } from '@/stores/incidentDraftStore';
import { Ionicons } from '@expo/vector-icons';

export default function IncidentPhotoScreen() {
  const router = useRouter();
  const { photoUri, setPhoto } = useIncidentDraftStore();
  const [loading, setLoading] = useState(false);

  const requestPermissions = async (type: 'camera' | 'library') => {
    if (type === 'camera') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission requise',
          'L\'accès à la caméra est nécessaire pour prendre une photo de l\'incident.'
        );
        return false;
      }
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission requise',
          'L\'accès à la galerie photo est nécessaire pour choisir une photo.'
        );
        return false;
      }
    }
    return true;
  };

  const takePhoto = async () => {
    const ok = await requestPermissions('camera');
    if (!ok) return;
    setLoading(true);
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) {
        setPhoto(result.assets[0].uri);
      }
    } catch (e) {
      Alert.alert('Erreur', 'Impossible de prendre la photo. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const pickFromGallery = async () => {
    const ok = await requestPermissions('library');
    if (!ok) return;
    setLoading(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) {
        setPhoto(result.assets[0].uri);
      }
    } catch (e) {
      Alert.alert('Erreur', 'Impossible de sélectionner la photo. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const goToRecap = () => {
    if (!photoUri) {
      Alert.alert('Photo requise', 'Veuillez prendre ou choisir une photo avant de continuer.');
      return;
    }
    router.push('/incident/recap');
  };

  const goBackToMap = () => {
    router.replace('/(tabs)/map');
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={goBackToMap} activeOpacity={0.7}>
        <Ionicons name="arrow-back" size={24} color="#1e293b" />
        <Text style={styles.backButtonText}>Back to map</Text>
      </TouchableOpacity>

      <Text style={styles.instruction}>
        Take a photo of the incident or choose one from your gallery.
      </Text>

      {photoUri ? (
        <View style={styles.previewContainer}>
          <Image source={{ uri: photoUri }} style={styles.preview} resizeMode="cover" />
          <TouchableOpacity
            style={styles.changePhotoButton}
            onPress={() => setPhoto(null)}
          >
            <Text style={styles.changePhotoText}>Change photo</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={takePhoto}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="camera" size={28} color="#fff" />
                <Text style={styles.primaryButtonText}>Take photo</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={pickFromGallery}
            disabled={loading}
          >
            <Ionicons name="images" size={28} color="#2563eb" />
            <Text style={styles.secondaryButtonText}>Choose from gallery</Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity
        style={[styles.continueButton, !photoUri && styles.continueButtonDisabled]}
        onPress={goToRecap}
        disabled={!photoUri}
      >
        <Text style={styles.continueButtonText}>Continue to recap</Text>
        <Ionicons name="arrow-forward" size={20} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#f8fafc',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
    paddingVertical: 8,
    paddingRight: 12,
    alignSelf: 'flex-start',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  instruction: {
    fontSize: 16,
    color: '#475569',
    marginBottom: 24,
    lineHeight: 24,
  },
  previewContainer: {
    flex: 1,
    marginBottom: 16,
  },
  preview: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: 12,
    backgroundColor: '#e2e8f0',
  },
  changePhotoButton: {
    marginTop: 12,
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  changePhotoText: {
    fontSize: 16,
    color: '#2563eb',
    fontWeight: '600',
  },
  actions: {
    gap: 16,
    marginBottom: 24,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 20,
    borderRadius: 12,
    minHeight: 56,
  },
  primaryButton: {
    backgroundColor: '#2563eb',
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  secondaryButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#2563eb',
  },
  secondaryButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2563eb',
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#2563eb',
    padding: 16,
    borderRadius: 12,
  },
  continueButtonDisabled: {
    backgroundColor: '#94a3b8',
    opacity: 0.8,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
