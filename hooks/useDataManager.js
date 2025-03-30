import { useEffect } from 'react';
import usePlaybackStore from '../store/playbackStore';
import useUserTokenStore from '../store/userTokenStore';
import useUserStore from '../store/userStore';

/**
 * 处理数据加载和同步的自定义hook
 * 在应用初始化时使用一次即可
 */
export function useDataManager() {
    // 引入播放数据和token管理
    const loadPlaybackData = usePlaybackStore((state) => state.loadPlaybackData);
    const updateUserPushToken = useUserTokenStore((state) => state.updateUserPushToken);
    const user = useUserStore(state => state.user);

    // 用户Token相关的effect
    useEffect(() => {
        if (user !== null) {
            updateUserPushToken(user);
        }
    }, [user]);

    // 加载播放数据
    useEffect(() => {
        loadPlaybackData();
    }, []);
} 