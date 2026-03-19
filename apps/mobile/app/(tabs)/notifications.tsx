import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/authStore';
import { useTheme } from '@/hooks/useTheme';
import { notificationService } from '@/services/notificationService';
import { pushNotificationService } from '@/services/pushNotificationService';
import { useNotificationStore } from '@/stores/notificationStore';
import { webSocketService } from '@/services/webSocketService';
import type { Notification as NotificationType } from '@/types/notification';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';

function formatDate(isoString: string): string {
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;

    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
    });
  } catch {
    return isoString;
  }
}

function getNotificationIcon(type: string): keyof typeof Ionicons.glyphMap {
  switch (type) {
    case 'hazard_created':
      return 'checkmark-circle';
    case 'hazard_status_changed':
      return 'sync-circle';
    case 'hazard_nearby':
      return 'location';
    case 'hazard_comment':
      return 'chatbubble';
    default:
      return 'notifications';
  }
}

function getNotificationColor(type: string): string {
  switch (type) {
    case 'hazard_created':
      return '#4CAF50';
    case 'hazard_status_changed':
      return '#2196F3';
    case 'hazard_nearby':
      return '#FF9800';
    case 'hazard_comment':
      return '#9C27B0';
    default:
      return '#757575';
  }
}

export default function NotificationsScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const notifications = useNotificationStore((state) => state.notifications);
  const addNotificationFromWS = useNotificationStore((state) => state.addNotification);
  const markAsReadInStore = useNotificationStore((state) => state.markAsRead);
  const markAllAsReadInStore = useNotificationStore((state) => state.markAllAsRead);
  const setNotificationsInStore = useNotificationStore((state) => state.setNotifications);
  const [loading, setLoading] = useState(false);

  // Fetch initial notifications from REST API
  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) {
      setNotificationsInStore([]);
      return;
    }
    setLoading(true);
    try {
      const fetchedNotifications = await notificationService.getAll();
      setNotificationsInStore(
        fetchedNotifications.map((n) => ({
          ...n,
          isRead: n.read,
          hazardId: n.hazardId || '',
          city: n.city || 'Unknown',
          location: n.location || { latitude: 0, longitude: 0 },
        }))
      );
    } catch (error) {
      console.error('Erreur lors de la récupération des notifications :', error);
      Alert.alert('Erreur', 'Échec de la récupération des notifications.');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, setNotificationsInStore]);

  // Initialize WebSocket listeners (always active)
  useEffect(() => {
    // Clear badge count and fetch initial notifications on screen focus
    pushNotificationService.clearBadge();
    if (isAuthenticated) {
      fetchNotifications();
    }

    // Listen for real-time hazard notifications from WebSocket (no auth needed)
    const unsubscribeHazard = webSocketService.on('hazard:new', (hazard) => {
      console.log('[Notifications] Received new hazard via WebSocket:', hazard);
      addNotificationFromWS(hazard);
    });

    // Listen for connection events
    const unsubscribeConnected = webSocketService.on('connected', () => {
      console.log('[Notifications] WebSocket connected');
    });

    const unsubscribeError = webSocketService.on('error', (error) => {
      console.log('[Notifications] WebSocket error:', error);
    });

    return () => {
      unsubscribeHazard();
      unsubscribeConnected();
      unsubscribeError();
    };
  }, [isAuthenticated, fetchNotifications, addNotificationFromWS]);

  const handleNotificationPress = async (notification: any) => {
    // Mark as read
    if (!notification.isRead) {
      try {
        await notificationService.markAsRead(notification.id);
        markAsReadInStore(notification.id);
      } catch (error) {
        console.error('Erreur lors du marquage de la notification comme lue :', error);
      }
    }

    // Navigate to hazard if available
    if (notification.hazardId) {
      // For now, just navigate to map - could be improved to show specific hazard
      router.push('/(tabs)/map');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      markAllAsReadInStore();
      Alert.alert('Succès', 'Toutes les notifications ont été marquées comme lues.');
    } catch (error) {
      Alert.alert('Erreur', 'Échec du marquage des notifications.');
    }
  };

  const handleDeleteNotification = async (id: string) => {
    Alert.alert(
      'Supprimer la notification',
      'Êtes-vous sûr de vouloir supprimer cette notification ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await notificationService.delete(id);
              // Note: Store doesn't have delete method yet, would need to add it
              // For now, just remove from UI after successful deletion
              Alert.alert('Succès', 'Notification supprimée.');
            } catch (error) {
              Alert.alert('Erreur', 'Échec de la suppression de la notification.');
            }
          },
        },
      ]
    );
  };

  const renderNotificationItem = ({ item }: { item: any }) => {
    const iconName = getNotificationIcon(item.type);
    const iconColor = getNotificationColor(item.type);

    return (
      <TouchableOpacity
        style={[
          styles.notificationCard,
          { backgroundColor: theme.colors.surface },
          !item.isRead && { borderLeftColor: theme.colors.primary, borderLeftWidth: 4 },
        ]}
        onPress={() => handleNotificationPress(item)}
        activeOpacity={0.7}
      >
        <View style={[styles.iconContainer, { backgroundColor: iconColor + '20' }]}>
          <Ionicons name={iconName} size={24} color={iconColor} />
        </View>
        <View style={styles.contentContainer}>
          <View style={styles.headerRow}>
            <Text style={[styles.title, { color: theme.colors.text }, !item.isRead && styles.unreadText]}>
              {item.description || item.type}
            </Text>
            {!item.isRead && <View style={[styles.unreadDot, { backgroundColor: theme.colors.primary }]} />}
          </View>
          <Text style={[styles.message, { color: theme.colors.textSecondary }]} numberOfLines={2}>
            {item.city}
          </Text>
          <Text style={[styles.date, { color: theme.colors.textTertiary }]}>{formatDate(item.timestamp)}</Text>
        </View>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteNotification(item.id)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="trash-outline" size={20} color={theme.colors.textTertiary} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={[styles.centeredMessage, { backgroundColor: theme.colors.background }]} edges={['top']}>
        <Ionicons name="notifications-off-outline" size={64} color={theme.colors.textTertiary} />
        <Text style={[styles.messageText, { color: theme.colors.textSecondary }]}>Veuillez vous connecter pour voir vos notifications.</Text>
        <TouchableOpacity style={[styles.loginButton, { backgroundColor: theme.colors.primary }]} onPress={() => router.push('/auth/login')}>
          <Text style={styles.loginButtonText}>Se connecter</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background, paddingTop: insets.top + 16 }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.divider }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.push('/(tabs)/map')}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Notifications</Text>
        {notifications.some((n) => !n.isRead) && (
          <TouchableOpacity onPress={handleMarkAllAsRead} style={styles.markAllButton}>
            <Text style={[styles.markAllButtonText, { color: theme.colors.primary }]}>Tout marquer comme lu</Text>
          </TouchableOpacity>
        )}
      </View>
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderNotificationItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={fetchNotifications} tintColor={theme.colors.primary} />
        }
        ListEmptyComponent={
          <View style={styles.emptyList}>
            <Ionicons name="notifications-outline" size={64} color={theme.colors.textTertiary} />
            <Text style={[styles.emptyListText, { color: theme.colors.textSecondary }]}>Aucune notification pour le moment.</Text>
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
  centeredMessage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  messageText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  loginButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  markAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  markAllButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
  },
  notificationCard: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  unreadCard: {
    borderLeftWidth: 4,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contentContainer: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  unreadText: {
    fontWeight: 'bold',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
  message: {
    fontSize: 14,
    marginBottom: 4,
  },
  date: {
    fontSize: 12,
  },
  deleteButton: {
    padding: 8,
    justifyContent: 'center',
  },
  emptyList: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyListText: {
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
});
