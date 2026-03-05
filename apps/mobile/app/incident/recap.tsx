import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useIncidentDraftStore } from '@/stores/incidentDraftStore';
import { hazardService, ProblemType } from '@/services/hazardService';
import ProblemTypeModal from '@/components/ProblemTypeModal';
import ProblemTypeIcon from '@/components/ProblemTypeIcon';
import { Ionicons } from '@expo/vector-icons';

export default function IncidentRecapScreen() {
  const router = useRouter();
  const {
    latitude,
    longitude,
    problemType,
    photoUri,
    description,
    setProblemType,
    setDescription,
    setPendingAddToMap,
  } = useIncidentDraftStore();

  const [problemTypes, setProblemTypes] = useState<ProblemType[]>([]);
  const [loadingTypes, setLoadingTypes] = useState(true);
  const [typeModalVisible, setTypeModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchTypes = async () => {
      try {
        const types = await hazardService.getTypes();
        setProblemTypes(types);
      } catch (e) {
        console.error('Failed to load problem types', e);
      } finally {
        setLoadingTypes(false);
      }
    };
    fetchTypes();
  }, []);

  const handleChangePhoto = () => {
    router.push('/incident/photo');
  };

  const handleCreateIncident = async () => {
    if (!problemType || !photoUri) {
      Alert.alert('Informations manquantes', 'Veuillez vous assurer d\'avoir sélectionné un type et ajouté une photo.');
      return;
    }
    setSubmitting(true);
    try {
      await hazardService.createIncident(photoUri, {
        type: problemType.id,
        description: description || '',
        latitude,
        longitude,
      });
      setPendingAddToMap(true);
      router.replace('/(tabs)/map');
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Échec de la création de l\'incident. Veuillez réessayer.';
      Alert.alert('Erreur', message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSelectType = (type: ProblemType) => {
    setProblemType(type);
    setTypeModalVisible(false);
  };

  if (!problemType) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Type d'incident manquant. Veuillez revenir en arrière et sélectionner un type.</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
      >
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Incident type</Text>
        <TouchableOpacity
          style={styles.typeRow}
          onPress={() => setTypeModalVisible(true)}
          activeOpacity={0.7}
        >
          <ProblemTypeIcon problemType={problemType} size={28} variant="list" />
          <Text style={styles.typeName}>{problemType.name}</Text>
          <Ionicons name="chevron-forward" size={22} color="#94a3b8" />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Photo</Text>
        {photoUri ? (
          <View style={styles.photoBlock}>
            <Image source={{ uri: photoUri }} style={styles.photo} resizeMode="cover" />
            <TouchableOpacity style={styles.changeButton} onPress={handleChangePhoto}>
              <Ionicons name="camera" size={18} color="#2563eb" />
              <Text style={styles.changeButtonText}>Change photo</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.addPhotoBlock} onPress={handleChangePhoto}>
            <Ionicons name="images-outline" size={40} color="#94a3b8" />
            <Text style={styles.addPhotoText}>Add a photo</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Description (optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="Add details about the incident..."
          placeholderTextColor="#94a3b8"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.coordsText}>
          Location: {latitude.toFixed(5)}, {longitude.toFixed(5)}
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.createButton, submitting && styles.createButtonDisabled]}
        onPress={handleCreateIncident}
        disabled={submitting}
      >
        <Ionicons name="checkmark-circle" size={24} color="#fff" />
        <Text style={styles.createButtonText}>
          {submitting ? 'Creating…' : 'Create incident'}
        </Text>
      </TouchableOpacity>

      <ProblemTypeModal
        visible={typeModalVisible}
        problemTypes={problemTypes}
        loading={loadingTypes}
        onSelect={handleSelectType}
        onClose={() => setTypeModalVisible(false)}
      />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 24,
    paddingBottom: 380,
  },
  errorText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    margin: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  typeName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#1e293b',
    marginLeft: 12,
  },
  photoBlock: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  photo: {
    width: '100%',
    aspectRatio: 4 / 3,
    backgroundColor: '#e2e8f0',
  },
  changeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 14,
  },
  changeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2563eb',
  },
  addPhotoBlock: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPhotoText: {
    fontSize: 16,
    color: '#94a3b8',
    marginTop: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 14,
    fontSize: 16,
    color: '#1e293b',
    minHeight: 100,
  },
  coordsText: {
    fontSize: 13,
    color: '#94a3b8',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#2563eb',
    padding: 18,
    borderRadius: 12,
    marginTop: 8,
  },
  createButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  createButtonDisabled: {
    opacity: 0.7,
  },
});