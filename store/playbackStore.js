import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { syncDataToBackend } from '../lib/appwrite';

const usePlaybackStore = create((set, get) => ({
    playbackData: {},

    // 加载播放数据
    loadPlaybackData: async () => {
        try {
            const storedData = await AsyncStorage.getItem('playbackData');
            if (storedData) {
                set({ playbackData: JSON.parse(storedData) });
            }
        } catch (error) {
            console.error('加载播放数据失败:', error);
        }
    },

    // 更新播放数据
    updatePlaybackData: async (video_ID, count) => {
        const newData = {
            ...get().playbackData,
            [video_ID]: {
                count,
                lastPlaybackTime: Date.now(),
                synced: false,
            }
        };

        set({ playbackData: newData });

        // 保存到 AsyncStorage
        try {
            await AsyncStorage.setItem('playbackData', JSON.stringify(newData));
        } catch (error) {
            console.error('保存播放数据失败:', error);
        }

        // 同步到后端
        try {
            await syncDataToBackend(newData);
        } catch (error) {
            console.error('同步播放数据失败:', error);
        }
    }
}));

export default usePlaybackStore; 