import { Stack } from 'expo-router';

export default function SettingsLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
                animation: 'slide_from_right',  // 添加滑动动画
            }}
        >
            <Stack.Screen name="index" />
            <Stack.Screen name="user-info" />
        </Stack>
    );
} 