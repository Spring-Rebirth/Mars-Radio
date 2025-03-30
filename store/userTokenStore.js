import { create } from 'zustand';
import { updatePushToken } from '../functions/notifications';

const useUserTokenStore = create((set) => ({
    // 更新用户推送token
    updateUserPushToken: async (user) => {
        if (user && user.expo_push_token) {
            try {
                await updatePushToken(user, user.expo_push_token);
                console.log('token 更新成功');
            } catch (error) {
                console.error('更新token失败:', error);
            }
        }
    }
}));

export default useUserTokenStore; 