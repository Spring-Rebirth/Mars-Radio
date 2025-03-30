import { create } from 'zustand';
import { router } from 'expo-router';
import { Alert } from 'react-native';

const useUserStore = create((set) => ({
    user: null,
    isLoggedIn: false,
    isLoading: true,

    // 设置用户信息
    setUser: (userData) => set({
        user: userData,
        isLoggedIn: !!userData
    }),

    // 设置登录状态
    setIsLoggedIn: (status) => set({ isLoggedIn: status }),

    // 设置加载状态
    setIsLoading: (status) => set({ isLoading: status }),

    // 清除用户信息
    clearUser: () => set({
        user: null,
        isLoggedIn: false
    }),

    // 处理登出
    handleLogout: async (signOut) => {
        try {
            await signOut();
            set({
                user: null,
                isLoggedIn: false
            });
            router.replace('/sign-in');
        } catch (error) {
            console.log('Error logging out:', error);
            Alert.alert('注销错误', '无法注销，请稍后再试。');
        }
    }
}));

export default useUserStore; 