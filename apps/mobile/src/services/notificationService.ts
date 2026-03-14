import { api } from './api';
import { Notification } from '@/types/notification';

export const notificationService = {
  async getAll(): Promise<Notification[]> {
    try {
      const response = await api.get<Notification[]>('/notifications');
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 401) {
        return [];
      }
      throw error;
    }
  },

  async getUnread(): Promise<Notification[]> {
    try {
      const response = await api.get<Notification[]>('/notifications/unread');
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 401) {
        return [];
      }
      throw error;
    }
  },

  async getUnreadCount(): Promise<number> {
    try {
      const response = await api.get<number>('/notifications/unread/count');
      return response.data;
    } catch (error: any) {
      // Silently handle 401 (not authenticated) - just return 0
      if (error.response?.status === 401) {
        return 0;
      }
      throw error;
    }
  },

  async markAsRead(id: string): Promise<Notification> {
    const response = await api.patch<Notification>(`/notifications/${id}/read`);
    return response.data;
  },

  async markAllAsRead(): Promise<void> {
    await api.post('/notifications/mark-all-read');
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/notifications/${id}`);
  },

  async deleteAll(): Promise<void> {
    await api.delete('/notifications');
  },
};
