export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'ai';
  timestamp: string;
  read: boolean;
  actionUrl?: string;
  actionData?: any;
}

export interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
}
