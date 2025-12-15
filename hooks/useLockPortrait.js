import { useEffect } from 'react';
import * as ScreenOrientation from "expo-screen-orientation";

export default function useLockPortrait() {

    useEffect(() => {
        const lockPortrait = async () => {
            try {
                await ScreenOrientation.lockAsync(
                    ScreenOrientation.OrientationLock.PORTRAIT_UP
                );
            } catch (error) {
                console.error("Failed to lock orientation:", error);
            }
        };

        lockPortrait();

        return () => {
            ScreenOrientation.unlockAsync().catch(console.error);
        };
    }, []);
}