import { api } from './api';
import { Notification } from '@/types/notification';

export const notificationService = {
  async getAll(): Promise<Notification[]> {
    const response = await api.get<Notification[]>('/notifications');
    return response.data;
  },

  async getUnread(): Promise<Notification[]> {
    const response = await api.get<Notification[]>('/notifications/unread');
    return response.data;
  },

  async getUnreadCount(): Promise<number> {
    const response = await api.get<number>('/notifications/unread/count');
    return response.data;
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
