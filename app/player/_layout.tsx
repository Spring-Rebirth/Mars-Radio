import { Stack } from "expo-router";

export default function PlayerLayout() {
    return (
        <Stack>
            <Stack.Screen name="play-screen" options={{ headerShown: false }} />
        </Stack>
    );
}