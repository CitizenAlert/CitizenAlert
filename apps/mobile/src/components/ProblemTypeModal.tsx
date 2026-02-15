import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import {
  BottomSheetModal,
  BottomSheetView,
  BottomSheetFlatList,
} from '@gorhom/bottom-sheet';
import { ProblemType } from '@/services/hazardService';
import ProblemTypeIcon from './ProblemTypeIcon';

interface ProblemTypeModalProps {
  visible: boolean;
  problemTypes: ProblemType[];
  loading?: boolean;
  onSelect: (problemType: ProblemType) => void;
  onClose: () => void;
}

export default function ProblemTypeModal({
  visible,
  problemTypes,
  loading = false,
  onSelect,
  onClose,
}: ProblemTypeModalProps) {
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);

  const snapPoints = useMemo(() => ['40%', '70%'], []);

  useEffect(() => {
    if (visible) {
      bottomSheetModalRef.current?.present();
    } else {
      bottomSheetModalRef.current?.dismiss();
    }
  }, [visible]);

  const handleSelect = useCallback(
    (problemType: ProblemType) => {
      onSelect(problemType);
      bottomSheetModalRef.current?.dismiss();
      onClose();
    },
    [onSelect, onClose]
  );

  const handleDismiss = useCallback(() => {
    onClose();
  }, [onClose]);

  const handleSheetChanges = useCallback((_index: number) => {
    // Sheet position changes; onDismiss handles close
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: ProblemType }) => (
      <TouchableOpacity
        style={styles.typeItem}
        onPress={() => handleSelect(item)}
        activeOpacity={0.7}
      >
        <ProblemTypeIcon problemType={item} size={24} variant="list" />
        <Text style={styles.typeName}>{item.name}</Text>
      </TouchableOpacity>
    ),
    [handleSelect]
  );

  const keyExtractor = useCallback((item: ProblemType) => item.id, []);

  const listHeaderComponent = useMemo(
    () => (
      <View style={styles.header}>
        <Text style={styles.title}>Select Problem Type</Text>
        <TouchableOpacity
          onPress={() => {
            bottomSheetModalRef.current?.dismiss();
            onClose();
          }}
          style={styles.closeButton}
        >
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
      </View>
    ),
    [onClose]
  );

  const listEmptyComponent = useMemo(() => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3498db" />
          <Text style={styles.loadingText}>Loading problem types...</Text>
        </View>
      );
    }
    return null;
  }, [loading]);

  return (
    <BottomSheetModal
      ref={bottomSheetModalRef}
      snapPoints={snapPoints}
      onChange={handleSheetChanges}
      onDismiss={handleDismiss}
      enablePanDownToClose
      backgroundStyle={styles.sheetBackground}
      handleIndicatorStyle={styles.handleIndicator}
    >
      {loading ? (
        <BottomSheetView style={styles.contentContainer}>
          {listHeaderComponent}
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3498db" />
            <Text style={styles.loadingText}>Loading problem types...</Text>
          </View>
        </BottomSheetView>
      ) : (
        <BottomSheetFlatList
          data={problemTypes}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          ListHeaderComponent={listHeaderComponent}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={listEmptyComponent}
        />
      )}
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  sheetBackground: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  handleIndicator: {
    backgroundColor: '#c0c0c0',
    width: 40,
  },
  contentContainer: {
    flex: 1,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 15,
    backgroundColor: '#f0f0f0',
  },
  closeButtonText: {
    fontSize: 18,
    color: '#666',
    fontWeight: 'bold',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
  },
  listContainer: {
    paddingHorizontal: 10,
    paddingBottom: 20,
  },
  typeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginVertical: 4,
    marginHorizontal: 10,
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  typeName: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    marginLeft: 12,
  },
});
