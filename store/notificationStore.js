import { create } from 'zustand'
import AsyncStorage from '@react-native-async-storage/async-storage'

const NOTIFICATIONS_STORAGE_KEY = 'mars_radio_notifications'
const NOTIFICATION_EXPIRY_DAYS = 30

const useNotificationStore = create((set, get) => ({
  // 状态
  channels: [],          // 通知频道列表
  notification: undefined, // 当前通知
  savedNotifications: [], // 已保存的通知列表

  // 操作方法
  setChannels: (channels) => set({ channels }),
  setNotification: (notification) => set({ notification }),

  // 清除通知
  clearNotification: () => set({ notification: undefined }),

  // 保存通知到本地存储
  saveNotification: async (notificationItem) => {
    try {
      // 添加到状态
      const currentSaved = get().savedNotifications;
      const updatedNotifications = [notificationItem, ...currentSaved];

      set({ savedNotifications: updatedNotifications });

      // 保存到AsyncStorage
      await AsyncStorage.setItem(
        NOTIFICATIONS_STORAGE_KEY,
        JSON.stringify(updatedNotifications)
      );

      return true;
    } catch (error) {
      console.error('保存通知失败:', error);
      return false;
    }
  },

  // 加载保存的通知
  loadSavedNotifications: async () => {
    try {
      const storedNotifications = await AsyncStorage.getItem(NOTIFICATIONS_STORAGE_KEY);

      if (storedNotifications) {
        const parsedNotifications = JSON.parse(storedNotifications);

        // 过滤掉超过30天的通知
        const now = new Date();
        const thirtyDaysAgo = new Date(now.setDate(now.getDate() - NOTIFICATION_EXPIRY_DAYS));

        const validNotifications = parsedNotifications.filter(notification => {
          const notificationDate = new Date(notification.createdAt);
          return notificationDate >= thirtyDaysAgo;
        });

        // 如果有过期的通知，更新存储
        if (validNotifications.length !== parsedNotifications.length) {
          await AsyncStorage.setItem(
            NOTIFICATIONS_STORAGE_KEY,
            JSON.stringify(validNotifications)
          );
        }

        set({ savedNotifications: validNotifications });
        return validNotifications;
      }

      return [];
    } catch (error) {
      console.error('加载通知失败:', error);
      set({ savedNotifications: [] });
      return [];
    }
  },

  // 将通知标记为已读
  markNotificationAsRead: async (notificationId) => {
    try {
      const { savedNotifications } = get();

      const updatedNotifications = savedNotifications.map(notification =>
        notification.id === notificationId
          ? { ...notification, read: true }
          : notification
      );

      set({ savedNotifications: updatedNotifications });

      await AsyncStorage.setItem(
        NOTIFICATIONS_STORAGE_KEY,
        JSON.stringify(updatedNotifications)
      );

      return true;
    } catch (error) {
      console.error('标记通知已读失败:', error);
      return false;
    }
  },

  // 标记所有通知为已读
  markAllNotificationsAsRead: async () => {
    try {
      const { savedNotifications } = get();

      const updatedNotifications = savedNotifications.map(notification => ({
        ...notification,
        read: true
      }));

      set({ savedNotifications: updatedNotifications });

      await AsyncStorage.setItem(
        NOTIFICATIONS_STORAGE_KEY,
        JSON.stringify(updatedNotifications)
      );

      return true;
    } catch (error) {
      console.error('标记所有通知已读失败:', error);
      return false;
    }
  },

  // 清除所有通知
  clearAllSavedNotifications: async () => {
    try {
      set({ savedNotifications: [] });
      await AsyncStorage.removeItem(NOTIFICATIONS_STORAGE_KEY);
      return true;
    } catch (error) {
      console.error('清除所有通知失败:', error);
      return false;
    }
  },

  // 重置所有状态
  reset: () => set({
    channels: [],
    notification: undefined,
    savedNotifications: []
  }),
}))

export default useNotificationStore
