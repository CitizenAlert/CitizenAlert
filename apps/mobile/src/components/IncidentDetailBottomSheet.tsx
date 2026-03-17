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
import { useTheme } from '@/hooks/useTheme';
import { hazardService } from '@/services/hazardService';
import HazardImage from './HazardImage';

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
  const theme = useTheme();
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
      handleIndicatorStyle={[styles.handleIndicator, { backgroundColor: theme.colors.textSecondary }]}
    >
      <BottomSheetScrollView contentContainerStyle={[styles.content, { backgroundColor: theme.colors.background }]}>
        {hazard && (
          <>
            <HazardImage
              imageUri={getImageUrlForDevice(hazard.imageUrl)}
              style={[styles.photo, { backgroundColor: theme.colors.inputBorder }]}
              placeholderStyle={styles.photoPlaceholder}
              placeholderTextStyle={[styles.photoPlaceholderText, { color: theme.colors.placeholder }]}
            />
            <View style={styles.section}>
              <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Date de création</Text>
              <Text style={[styles.date, { color: theme.colors.text }]}>{formatCreationDate(hazard.createdAt)}</Text>
            </View>
            <View style={styles.section}>
              <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Statut</Text>
              <Text style={[styles.status, { color: theme.colors.text }]}>{getStatusLabel(hazard.status)}</Text>
            </View>
            <View style={styles.section}>
              <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Description</Text>
              <Text style={[styles.description, { color: theme.colors.text }]}>
                {hazard.description?.trim() || 'Aucune description.'}
              </Text>
            </View>

            {isAuthenticated && (canEdit || canDelete || canChangeStatus) && (
              <View style={[styles.actionsSection, { borderTopColor: theme.colors.border }]}>
                {canChangeStatus && (
                  <View style={styles.statusActions}>
                    <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Changer le statut</Text>
                    <View style={styles.statusButtons}>
                      {hazard.status !== 'active' && (
                        <TouchableOpacity
                          style={[styles.statusButton, styles.statusButtonActive, { backgroundColor: theme.colors.primaryLight }]}
                          onPress={() => handleStatusChange('active')}
                        >
                          <Text style={[styles.statusButtonText, { color: theme.colors.text }]}>Activer</Text>
                        </TouchableOpacity>
                      )}
                      {hazard.status !== 'resolved' && (
                        <TouchableOpacity
                          style={[styles.statusButton, styles.statusButtonResolved, { backgroundColor: theme.colors.success }]}
                          onPress={() => handleStatusChange('resolved')}
                        >
                          <Text style={[styles.statusButtonText, { color: theme.colors.text }]}>Marquer résolu</Text>
                        </TouchableOpacity>
                      )}
                      {hazard.status !== 'archived' && (
                        <TouchableOpacity
                          style={[styles.statusButton, styles.statusButtonArchived, { backgroundColor: theme.colors.input }]}
                          onPress={() => handleStatusChange('archived')}
                        >
                          <Text style={[styles.statusButtonText, { color: theme.colors.text }]}>Archiver</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                )}
                {canDelete && (
                  <TouchableOpacity
                    style={[styles.deleteButton, { backgroundColor: theme.colors.error + '1A' }]}
                    onPress={handleDelete}
                  >
                    <Text style={[styles.deleteButtonText, { color: theme.colors.error }]}>Supprimer l'incident</Text>
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
    marginBottom: 20,
  },
  photoPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoPlaceholderText: {
    fontSize: 14,
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  date: {
    fontSize: 16,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
  },
  status: {
    fontSize: 16,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  actionsSection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
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
  },
  statusButtonActive: {
  },
  statusButtonResolved: {
  },
  statusButtonArchived: {
  },
  statusButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  deleteButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
