export enum NotificationType {
  HAZARD_CREATED = 'hazard_created',
  HAZARD_STATUS_CHANGED = 'hazard_status_changed',
  HAZARD_NEARBY = 'hazard_nearby',
  HAZARD_COMMENT = 'hazard_comment',
}

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  userId: string;
  hazardId?: string;
  data?: Record<string, any>;
  createdAt: string;
}

export interface NotificationResponse {
  notifications: Notification[];
  unreadCount: number;
}
