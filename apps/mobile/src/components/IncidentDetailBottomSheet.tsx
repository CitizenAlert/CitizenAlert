import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Alert } from 'react-native';
import {
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetBackdrop,
} from '@gorhom/bottom-sheet';
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import type { Hazard, HazardStatus } from '@/types/hazard';
import { getImageUrlForDevice } from '@/services/api';
import { useAuthStore } from '@/stores/authStore';
import { hazardService } from '@/services/hazardService';

function formatCreationDate(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoString;
  }
}

export interface IncidentDetailBottomSheetRef {
  present: () => void;
  dismiss: () => void;
}

interface IncidentDetailBottomSheetProps {
  hazard: Hazard | null;
  onDismiss?: () => void;
  onUpdate?: () => void;
}

const IncidentDetailBottomSheet = forwardRef<
  IncidentDetailBottomSheetRef,
  IncidentDetailBottomSheetProps
>(function IncidentDetailBottomSheet({ hazard, onDismiss, onUpdate }, ref) {
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const { user, isAuthenticated } = useAuthStore();

  useImperativeHandle(ref, () => ({
    present: () => bottomSheetRef.current?.present(),
    dismiss: () => bottomSheetRef.current?.dismiss(),
  }));

  const handleDismiss = () => {
    onDismiss?.();
  };

  const canEdit = hazard && isAuthenticated && (
    user?.role === 'municipality' || 
    user?.role === 'admin' || 
    hazard.userId === user?.id
  );

  const canDelete = hazard && isAuthenticated && (
    user?.role === 'municipality' || 
    user?.role === 'admin' || 
    hazard.userId === user?.id
  );

  const canChangeStatus = hazard && isAuthenticated && (
    user?.role === 'municipality' || 
    user?.role === 'admin'
  );

  const handleStatusChange = async (newStatus: HazardStatus) => {
    if (!hazard) return;

    try {
      await hazardService.updateStatus(hazard.id, newStatus);
      Alert.alert('Succès', 'Statut mis à jour avec succès');
      onUpdate?.();
      bottomSheetRef.current?.dismiss();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Échec de la mise à jour du statut';
      Alert.alert('Erreur', errorMessage);
    }
  };

  const handleDelete = () => {
    if (!hazard) return;

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
              await hazardService.delete(hazard.id);
              Alert.alert('Succès', 'Incident supprimé avec succès');
              onUpdate?.();
              bottomSheetRef.current?.dismiss();
            } catch (error: unknown) {
              const errorMessage = error instanceof Error ? error.message : 'Échec de la suppression de l\'incident';
              Alert.alert('Erreur', errorMessage);
            }
          },
        },
      ]
    );
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

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      snapPoints={['50%', '90%']}
      enablePanDownToClose
      onDismiss={handleDismiss}
      backdropComponent={(props: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop
          {...props}
          disappearsOnIndex={-1}
          appearsOnIndex={0}
        />
      )}
      handleIndicatorStyle={styles.handleIndicator}
    >
      <BottomSheetScrollView contentContainerStyle={styles.content}>
        {hazard && (
          <>
            {(() => {
              const imageUri = getImageUrlForDevice(hazard.imageUrl);
              return imageUri ? (
                <Image
                  source={{ uri: imageUri }}
                  style={styles.photo}
                  resizeMode="cover"
                />
              ) : (
              <View style={[styles.photo, styles.photoPlaceholder]}>
                <Text style={styles.photoPlaceholderText}>Aucune photo</Text>
              </View>
              );
            })()}
            <View style={styles.section}>
              <Text style={styles.label}>Date de création</Text>
              <Text style={styles.date}>{formatCreationDate(hazard.createdAt)}</Text>
            </View>
            <View style={styles.section}>
              <Text style={styles.label}>Statut</Text>
              <Text style={styles.status}>{getStatusLabel(hazard.status)}</Text>
            </View>
            <View style={styles.section}>
              <Text style={styles.label}>Description</Text>
              <Text style={styles.description}>
                {hazard.description?.trim() || 'Aucune description.'}
              </Text>
            </View>

            {isAuthenticated && (canEdit || canDelete || canChangeStatus) && (
              <View style={styles.actionsSection}>
                {canChangeStatus && (
                  <View style={styles.statusActions}>
                    <Text style={styles.label}>Changer le statut</Text>
                    <View style={styles.statusButtons}>
                      {hazard.status !== 'active' && (
                        <TouchableOpacity
                          style={[styles.statusButton, styles.statusButtonActive]}
                          onPress={() => handleStatusChange('active')}
                        >
                          <Text style={styles.statusButtonText}>Activer</Text>
                        </TouchableOpacity>
                      )}
                      {hazard.status !== 'resolved' && (
                        <TouchableOpacity
                          style={[styles.statusButton, styles.statusButtonResolved]}
                          onPress={() => handleStatusChange('resolved')}
                        >
                          <Text style={styles.statusButtonText}>Marquer résolu</Text>
                        </TouchableOpacity>
                      )}
                      {hazard.status !== 'archived' && (
                        <TouchableOpacity
                          style={[styles.statusButton, styles.statusButtonArchived]}
                          onPress={() => handleStatusChange('archived')}
                        >
                          <Text style={styles.statusButtonText}>Archiver</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                )}
                {canDelete && (
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={handleDelete}
                  >
                    <Text style={styles.deleteButtonText}>Supprimer l'incident</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </>
        )}
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
});

export default IncidentDetailBottomSheet;

const styles = StyleSheet.create({
  handleIndicator: {
    backgroundColor: '#cbd5e1',
    width: 40,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  photo: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: 12,
    backgroundColor: '#e2e8f0',
    marginBottom: 20,
  },
  photoPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoPlaceholderText: {
    fontSize: 14,
    color: '#94a3b8',
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  date: {
    fontSize: 16,
    color: '#1e293b',
  },
  description: {
    fontSize: 16,
    color: '#334155',
    lineHeight: 24,
  },
  status: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    textTransform: 'capitalize',
  },
  actionsSection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  statusActions: {
    marginBottom: 15,
  },
  statusButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 10,
  },
  statusButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  statusButtonActive: {
    backgroundColor: '#dbeafe',
  },
  statusButtonResolved: {
    backgroundColor: '#dcfce7',
  },
  statusButtonArchived: {
    backgroundColor: '#f3f4f6',
  },
  statusButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  deleteButton: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#fee2e2',
    alignItems: 'center',
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#dc2626',
  },
});
