import { create } from 'zustand'

const useNotificationStore = create((set) => ({
  // 状态
  channels: [],          // 通知频道列表
  notification: undefined, // 当前通知

  // 操作方法
  setChannels: (channels) => set({ channels }),
  setNotification: (notification) => set({ notification }),

  // 清除通知
  clearNotification: () => set({ notification: undefined }),

  // 重置所有状态
  reset: () => set({
    channels: [],
    notification: undefined
  }),
}))

export default useNotificationStore
