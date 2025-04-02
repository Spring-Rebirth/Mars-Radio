import { Stack } from "expo-router";

export default function ScreensLayout() {
    return (
        <Stack>
            <Stack.Screen name="create-post" options={{ headerShown: false }} />
            <Stack.Screen name="post-detail" options={{ headerShown: false }} />
            <Stack.Screen name="user-info" options={{ headerShown: false }} />
        </Stack>
    );
}