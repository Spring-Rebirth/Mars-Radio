import { useEffect } from 'react';
import { Alert } from 'react-native';
import { useUser } from '@clerk/clerk-expo';
import useUserStore from '../store/userStore';
import { getCurrentUser } from "../lib/appwrite";

/**
 * 处理用户认证逻辑的自定义hook
 * 在应用初始化时使用一次即可
 */
export function useAuth() {
    // 使用Clerk的用户hook
    const { user: clerkUser, isLoaded } = useUser();

    // 使用Zustand存储的用户和状态
    const setUser = useUserStore(state => state.setUser);
    const setIsLoggedIn = useUserStore(state => state.setIsLoggedIn);
    const setIsLoading = useUserStore(state => state.setIsLoading);

    // 加载用户数据
    useEffect(() => {
        const fetchUser = async () => {
            if (isLoaded) {
                if (clerkUser) {
                    try {
                        const res = await getCurrentUser(clerkUser.id);
                        if (res) {
                            setIsLoggedIn(true);
                            setUser(res);
                            console.log('User is logged in');
                        } else {
                            setIsLoggedIn(false);
                            setUser(null);
                            console.log('User is not logged in');
                        }
                    } catch (error) {
                        console.log("Error in fetching user:", error);
                        setIsLoggedIn(false);
                        setUser(null);
                        Alert.alert('错误', '无法获取用户信息，请稍后再试。');
                    } finally {
                        setIsLoading(false);
                    }
                } else {
                    // clerkUser 为 null，用户未登录
                    setIsLoggedIn(false);
                    setUser(null);
                    setIsLoading(false);
                    console.log('User is not logged in');
                }
            }
        };

        fetchUser();
    }, [isLoaded, clerkUser]);
} 