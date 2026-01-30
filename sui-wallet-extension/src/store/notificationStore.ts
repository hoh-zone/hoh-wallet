import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

export enum NotificationType {
  transaction = 'transaction',
  price = 'price',
  reminder = 'reminder',
}

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: any;
  isRead: boolean;
  timestamp: number;
}

export interface NotificationPreferences {
  enabled: boolean;
  priceAlerts: boolean;
  transactionAlerts: boolean;
  reminderAlerts: boolean;
}

export interface NotificationState {
  notifications: Notification[];
  notificationPreferences: NotificationPreferences;
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  markAsRead: (notificationId: string) => void;
  removeNotification: (notificationId: string) => void;
  clearAll: () => void;
  updatePreferences: (preferences: Partial<NotificationPreferences>) => void;
  getNotifications: () => Notification[];
}

export const useNotificationStore = create<NotificationState>()(
  subscribeWithSelector((set, get) => ({
    notifications: JSON.parse(localStorage.getItem('hoh_notifications') || '[]'),
    notificationPreferences: JSON.parse(localStorage.getItem('hoh_notification_prefs') || JSON.stringify({
      enabled: true,
      priceAlerts: true,
      transactionAlerts: true,
      reminderAlerts: false,
    })),

    addNotification: (notification) => {
      const { notifications } = get();
      const newNotification = {
        ...notification,
        id: `not_${Date.now()}`,
        isRead: false,
        timestamp: Date.now(),
      };

      const newNotifications = [newNotification, ...notifications].slice(0, 50);
      localStorage.setItem('hoh_notifications', JSON.stringify(newNotifications));
      set({ notifications: newNotifications });

      // Request notification permission if not granted
      if (notification.type === 'transaction' && 'Notification' in window) {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            console.log('Notification permission granted');
            new Notification(newNotification.title, { body: newNotification.message });
          } else {
            console.log('Notification permission denied');
          }
        }).catch(error => {
          console.error('Failed to request notification permission:', error);
        });
      }
    },

    markAsRead: (notificationId) => {
      const { notifications } = get();
      const newNotifications = notifications.map(n =>
        n.id === notificationId ? { ...n, isRead: true } : n
      );
      localStorage.setItem('hoh_notifications', JSON.stringify(newNotifications));
      set({ notifications: newNotifications });
    },

    removeNotification: (notificationId) => {
      const { notifications } = get();
      const newNotifications = notifications.filter(n => n.id !== notificationId);
      localStorage.setItem('hoh_notifications', JSON.stringify(newNotifications));
      set({ notifications: newNotifications });
    },

    clearAll: () => {
      localStorage.setItem('hoh_notifications', JSON.stringify([]));
      set({ notifications: [] });
    },

    updatePreferences: (preferences) => {
      const { notificationPreferences } = get();
      const newPreferences = { ...notificationPreferences, ...preferences };
      localStorage.setItem('hoh_notification_prefs', JSON.stringify(newPreferences));
      set({ notificationPreferences: newPreferences });
    },

    getNotifications: () => {
      return get().notifications;
    },
  }))
);
