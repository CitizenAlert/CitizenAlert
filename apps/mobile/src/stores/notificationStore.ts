import { create } from 'zustand';
import { HazardNotification } from '../services/webSocketService';

export interface Notification {
  id: string;
  hazardId: string;
  type: string;
  description: string;
  city: string;
  location: {
    latitude: number;
    longitude: number;
  };
  timestamp: string;
  isRead: boolean;
}

interface NotificationStore {
  notifications: Notification[];
  unreadCount: number;

  // Real-time updates
  addNotification: (notification: HazardNotification) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;

  // This is called when network reconnects to sync
  setNotifications: (notifications: Notification[]) => void;
  setUnreadCount: (count: number) => void;
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],
  unreadCount: 0,

  addNotification: (hazardNotification: HazardNotification) => {
    const notification: Notification = {
      id: hazardNotification.hazardId,
      hazardId: hazardNotification.hazardId,
      type: hazardNotification.type,
      description: hazardNotification.description,
      city: hazardNotification.city,
      location: hazardNotification.location,
      timestamp: hazardNotification.timestamp,
      isRead: false,
    };

    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    }));
  },

  markAsRead: (id: string) => {
    set((state) => {
      const notification = state.notifications.find((n) => n.id === id);
      if (!notification || notification.isRead) return state;

      return {
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, isRead: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      };
    });
  },

  markAllAsRead: () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({
        ...n,
        isRead: true,
      })),
      unreadCount: 0,
    }));
  },

  clearNotifications: () => {
    set({
      notifications: [],
      unreadCount: 0,
    });
  },

  setNotifications: (notifications: Notification[]) => {
    const unreadCount = notifications.filter((n) => !n.isRead).length;
    set({
      notifications,
      unreadCount,
    });
  },

  setUnreadCount: (count: number) => {
    set({
      unreadCount: Math.max(0, count),
    });
  },
}));
