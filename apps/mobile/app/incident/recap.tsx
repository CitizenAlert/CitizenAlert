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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIncidentDraftStore } from '@/stores/incidentDraftStore';
import { hazardService, ProblemType } from '@/services/hazardService';
import ProblemTypeModal from '@/components/ProblemTypeModal';
import { ProblemTypeIcon } from '@/components/HazardMarker';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';

export default function IncidentRecapScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
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

  const goBackToMap = () => {
    router.replace('/(tabs)/map');
  };

  if (!problemType) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background, paddingTop: insets.top + 16 }]}>
        <Text style={[styles.errorText, { color: theme.colors.textSecondary }]}>Type d'incident manquant. Veuillez revenir en arrière et sélectionner un type.</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background, paddingTop: insets.top + 16 }]}
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
      <TouchableOpacity style={styles.backButton} onPress={goBackToMap} activeOpacity={0.7}>
        <Ionicons name="arrow-back" size={24} color={theme.colors.primary} />
        <Text style={[styles.backButtonText, { color: theme.colors.primary }]}>Back to map</Text>
      </TouchableOpacity>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>Incident type</Text>
        <TouchableOpacity
          style={[styles.typeRow, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
          onPress={() => setTypeModalVisible(true)}
          activeOpacity={0.7}
        >
          <ProblemTypeIcon problemType={problemType} size={28} variant="list" />
          <Text style={[styles.typeName, { color: theme.colors.text }]}>{problemType.name}</Text>
          <Ionicons name="chevron-forward" size={22} color={theme.colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>Photo</Text>
        {photoUri ? (
          <View style={[styles.photoBlock, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <Image source={{ uri: photoUri }} style={[styles.photo, { backgroundColor: theme.colors.inputBorder }]} resizeMode="cover" />
            <TouchableOpacity style={styles.changeButton} onPress={handleChangePhoto}>
              <Ionicons name="camera" size={18} color={theme.colors.primary} />
              <Text style={[styles.changeButtonText, { color: theme.colors.primary }]}>Change photo</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={[styles.addPhotoBlock, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]} onPress={handleChangePhoto}>
            <Ionicons name="images-outline" size={40} color={theme.colors.textSecondary} />
            <Text style={[styles.addPhotoText, { color: theme.colors.textSecondary }]}>Add a photo</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>Description (optional)</Text>
        <TextInput
          style={[styles.input, { backgroundColor: theme.colors.surface, borderColor: theme.colors.inputBorder, color: theme.colors.text }]}
          placeholder="Add details about the incident..."
          placeholderTextColor={theme.colors.placeholder}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      </View>

      <View style={styles.section}>
        <Text style={[styles.coordsText, { color: theme.colors.textSecondary }]}>
          Location: {latitude.toFixed(5)}, {longitude.toFixed(5)}
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.createButton, { backgroundColor: theme.colors.primary }, submitting && styles.createButtonDisabled]}
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
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 24,
    paddingBottom: 380,
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
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    margin: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  typeName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 12,
  },
  photoBlock: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
  },
  photo: {
    width: '100%',
    aspectRatio: 4 / 3,
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
  },
  addPhotoBlock: {
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPhotoText: {
    fontSize: 16,
    marginTop: 8,
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    fontSize: 16,
    minHeight: 100,
  },
  coordsText: {
    fontSize: 13,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
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