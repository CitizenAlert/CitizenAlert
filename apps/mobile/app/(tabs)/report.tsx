import React, { useCallback, useState } from 'react';
import { View, StyleSheet, Text, FlatList, TouchableOpacity, Image, RefreshControl, Alert } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/authStore';
import { useTheme } from '@/hooks/useTheme';
import { hazardService } from '@/services/hazardService';
import { getImageUrlForDevice } from '@/services/api';
import type { Hazard, HazardStatus } from '@/types/hazard';

export default function ReportScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuthStore();
  const theme = useTheme();
  const [myHazards, setMyHazards] = useState<Hazard[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const isMunicipalityOrAdmin = user?.role === 'municipality' || user?.role === 'admin';

  const fetchMyHazards = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      let filtered: Hazard[];
      
      if (isMunicipalityOrAdmin) {
        // Municipality and admin see all hazards
        const allHazards = await hazardService.getAll();
        // Sort by creation date (newest first)
        filtered = allHazards.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      } else {
        // Regular users see only their own hazards
        filtered = await hazardService.getMyHazards();
      }
      
      setMyHazards(filtered);
      console.log(`[Report] Fetched ${filtered.length} hazards for user ${user.id}`, filtered);
    } catch (error) {
      console.error('Error fetching hazards:', error);
    } finally {
      setLoading(false);
    }
  }, [user, isMunicipalityOrAdmin]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchMyHazards();
    setRefreshing(false);
  }, [fetchMyHazards]);

  useFocusEffect(
    useCallback(() => {
      fetchMyHazards();
    }, [fetchMyHazards])
  );

  const handleStatusChange = async (hazardId: string, newStatus: HazardStatus) => {
    try {
      await hazardService.updateStatus(hazardId, newStatus);
      Alert.alert('Succès', 'Statut mis à jour avec succès');
      fetchMyHazards();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Échec de la mise à jour du statut';
      Alert.alert('Erreur', errorMessage);
    }
  };

  const handleDelete = (hazardId: string) => {
    Alert.alert(
      'Supprimer l\'incident',
      'Êtes-vous sûr de vouloir supprimer cet incident ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await hazardService.delete(hazardId);
              Alert.alert('Succès', 'Incident supprimé avec succès');
              fetchMyHazards();
            } catch (error: unknown) {
              const errorMessage = error instanceof Error ? error.message : 'Échec de la suppression de l\'incident';
              Alert.alert('Erreur', errorMessage);
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status: HazardStatus) => {
    switch (status) {
      case 'active':
        return '#3b82f6';
      case 'resolved':
        return '#22c55e';
      case 'archived':
        return '#6b7280';
      default:
        return '#6b7280';
    }
  };

  const getStatusLabel = (status: HazardStatus) => {
    switch (status) {
      case 'active':
        return 'Actif';
      case 'resolved':
        return 'Résolu';
      case 'archived':
        return 'Archivé';
      default:
        return status;
    }
  };

  const renderHazardItem = ({ item }: { item: Hazard }) => {
    const imageUri = getImageUrlForDevice(item.imageUrl);
    const isOwner = item.userId === user?.id;

    return (
      <View style={[styles.hazardCard, { backgroundColor: theme.colors.surface }]}>
        {imageUri && (
          <Image source={{ uri: imageUri }} style={styles.hazardImage} resizeMode="cover" />
        )}
        <View style={styles.hazardContent}>
          <View style={styles.hazardHeader}>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
              <Text style={styles.statusBadgeText}>{getStatusLabel(item.status)}</Text>
            </View>
            <Text style={[styles.hazardDate, { color: theme.colors.textSecondary }]}>
              {new Date(item.createdAt).toLocaleDateString()}
            </Text>
          </View>
          
          <Text style={[styles.hazardType, { color: theme.colors.text }]}>{item.type.replace(/_/g, ' ')}</Text>
          <Text style={[styles.hazardDescription, { color: theme.colors.textSecondary }]} numberOfLines={2}>
            {item.description || 'Aucune description'}
          </Text>
          
          {isMunicipalityOrAdmin && (
            <View style={styles.statusActions}>
              <Text style={styles.actionsLabel}>Changer le statut :</Text>
              <View style={styles.statusButtons}>
                {item.status !== 'active' && (
                  <TouchableOpacity
                    style={[styles.statusButton, { backgroundColor: '#dbeafe' }]}
                    onPress={() => handleStatusChange(item.id, 'active')}
                  >
                    <Text style={styles.statusButtonText}>Actif</Text>
                  </TouchableOpacity>
                )}
                {item.status !== 'resolved' && (
                  <TouchableOpacity
                    style={[styles.statusButton, { backgroundColor: '#dcfce7' }]}
                    onPress={() => handleStatusChange(item.id, 'resolved')}
                  >
                    <Text style={styles.statusButtonText}>Résolu</Text>
                  </TouchableOpacity>
                )}
                {item.status !== 'archived' && (
                  <TouchableOpacity
                    style={[styles.statusButton, { backgroundColor: '#f3f4f6' }]}
                    onPress={() => handleStatusChange(item.id, 'archived')}
                  >
                    <Text style={styles.statusButtonText}>Archiver</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          {(isOwner || isMunicipalityOrAdmin) && (
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDelete(item.id)}
            >
              <Text style={styles.deleteButtonText}>Supprimer</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  if (!user) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>Veuillez vous connecter pour voir vos signalements</Text>
      </SafeAreaView>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background, paddingTop: insets.top + 16 }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.divider }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          {isMunicipalityOrAdmin ? 'Tous les Signalements' : 'Mes Signalements'}
        </Text>
      </View>

      <FlatList
        data={myHazards}
        renderItem={renderHazardItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              {isMunicipalityOrAdmin ? 'Aucun incident signalé pour le moment' : 'Vous n\'avez signalé aucun incident pour le moment'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingLeft: 0,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
  },
  listContent: {
    padding: 16,
  },
  hazardCard: {
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  hazardImage: {
    width: '100%',
    height: 200,
  },
  hazardContent: {
    padding: 16,
  },
  hazardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  hazardDate: {
    fontSize: 12,
  },
  hazardType: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'capitalize',
  },
  hazardDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  statusActions: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  actionsLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  statusButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  statusButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1e293b',
  },
  deleteButton: {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#fee2e2',
    alignItems: 'center',
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#dc2626',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
});
