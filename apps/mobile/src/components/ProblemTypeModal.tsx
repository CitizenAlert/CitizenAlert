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
import { ProblemTypeIcon } from './HazardMarker';
import { useTheme } from '@/hooks/useTheme';

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
  const theme = useTheme();
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
        style={[styles.typeItem, { backgroundColor: theme.colors.input, borderColor: theme.colors.border }]}
        onPress={() => handleSelect(item)}
        activeOpacity={0.7}
      >
        <ProblemTypeIcon problemType={item} size={24} />
        <Text style={[styles.typeName, { color: theme.colors.text }]}>{item.name}</Text>
      </TouchableOpacity>
    ),
    [handleSelect, theme]
  );

  const keyExtractor = useCallback((item: ProblemType) => item.id, []);

  const listHeaderComponent = useMemo(
    () => (
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Select Problem Type</Text>
        <TouchableOpacity
          onPress={() => {
            bottomSheetModalRef.current?.dismiss();
            onClose();
          }}
          style={[styles.closeButton, { backgroundColor: theme.colors.input }]}
        >
          <Text style={[styles.closeButtonText, { color: theme.colors.textSecondary }]}>✕</Text>
        </TouchableOpacity>
      </View>
    ),
    [onClose, theme]
  );

  const listEmptyComponent = useMemo(() => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>Loading problem types...</Text>
        </View>
      );
    }
    return null;
  }, [loading, theme]);

  return (
    <BottomSheetModal
      ref={bottomSheetModalRef}
      snapPoints={snapPoints}
      onChange={handleSheetChanges}
      onDismiss={handleDismiss}
      enablePanDownToClose
      backgroundStyle={[styles.sheetBackground, { backgroundColor: theme.colors.surface }]}
      handleIndicatorStyle={[styles.handleIndicator, { backgroundColor: theme.colors.textSecondary }]}
    >
      {loading ? (
        <BottomSheetView style={styles.contentContainer}>
          {listHeaderComponent}
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>Loading problem types...</Text>
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
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  handleIndicator: {
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
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 15,
  },
  closeButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
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
    borderRadius: 10,
    borderWidth: 1,
  },
  typeName: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 12,
  },
});
