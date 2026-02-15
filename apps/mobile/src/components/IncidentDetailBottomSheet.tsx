import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import {
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetBackdrop,
} from '@gorhom/bottom-sheet';
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import type { Hazard } from '@/types/hazard';
import { getImageUrlForDevice } from '@/services/api';

function formatCreationDate(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleDateString('fr-FR', {
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
}

const IncidentDetailBottomSheet = forwardRef<
  IncidentDetailBottomSheetRef,
  IncidentDetailBottomSheetProps
>(function IncidentDetailBottomSheet({ hazard, onDismiss }, ref) {
  const bottomSheetRef = useRef<BottomSheetModal>(null);

  useImperativeHandle(ref, () => ({
    present: () => bottomSheetRef.current?.present(),
    dismiss: () => bottomSheetRef.current?.dismiss(),
  }));

  const handleDismiss = () => {
    onDismiss?.();
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
              <Text style={styles.label}>Description</Text>
              <Text style={styles.description}>
                {hazard.description?.trim() || 'Aucune description.'}
              </Text>
            </View>
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
});
