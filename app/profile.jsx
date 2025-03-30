// 这是一个示例文件，演示如何从GlobalContext迁移到zustand store
import React from 'react';
import { View, Text, Button } from 'react-native';
// 旧导入
// import { useGlobalContext } from "../context/GlobalProvider";

// 新导入
import useUserStore from '../store/userStore';
import { useClerk } from '@clerk/clerk-expo';

export default function ProfileScreen() {
    // 旧用法
    // const { user, setUser, setIsLoggedIn, handleLogout } = useGlobalContext();

    // 新用法
    const user = useUserStore(state => state.user);
    const setUser = useUserStore(state => state.setUser);
    const setIsLoggedIn = useUserStore(state => state.setIsLoggedIn);
    const handleLogout = useUserStore(state => state.handleLogout);
    const { signOut } = useClerk();

    const logout = () => {
        // 旧用法
        // handleLogout();

        // 新用法
        handleLogout(signOut);
    };

    return (
        <View>
            <Text>用户名: {user?.username}</Text>
            <Button title="登出" onPress={logout} />
        </View>
    );
} 