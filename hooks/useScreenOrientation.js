import { useState, useEffect } from 'react';
import * as ScreenOrientation from "expo-screen-orientation";
import { StatusBar } from 'react-native';

export default function useScreenOrientation() {
    const [fullscreen, setFullscreen] = useState(false);

    const toggleFullscreen = async () => {
        try {
            if (fullscreen) {
                // 退出全屏
                await ScreenOrientation.lockAsync(
                    ScreenOrientation.OrientationLock.PORTRAIT_UP
                );
                // 强制更新界面状态
                setFullscreen(false);
                // iOS特定：确保视频容器样式更新
                await new Promise((resolve) => setTimeout(resolve, 100));
            } else {
                // 进入全屏
                await ScreenOrientation.lockAsync(
                    ScreenOrientation.OrientationLock.LANDSCAPE_RIGHT
                );
                setFullscreen(true);
            }
        } catch (error) {
            console.error("切换全屏失败:", error);
            // 回滚状态
            setFullscreen((prevState) => !prevState);
        }
    };

    useEffect(() => {
        // 清理函数：确保退出组件时恢复竖屏
        return () => {
            const lockPortrait = async () => {
                try {
                    await ScreenOrientation.lockAsync(
                        ScreenOrientation.OrientationLock.PORTRAIT_UP
                    );
                } catch (error) {
                    console.error("锁定竖屏方向失败:", error);
                }
            };

            lockPortrait();
        };
    }, []);

    useEffect(() => {
        const subscribe = async () => {
            try {
                await ScreenOrientation.unlockAsync();
                const subscription = ScreenOrientation.addOrientationChangeListener(
                    (event) => {
                        const orientation = event.orientationInfo.orientation;

                        if (
                            orientation === ScreenOrientation.Orientation.LANDSCAPE_LEFT ||
                            orientation === ScreenOrientation.Orientation.LANDSCAPE_RIGHT
                        ) {
                            setFullscreen(true);
                        } else if (
                            orientation === ScreenOrientation.Orientation.PORTRAIT_UP
                        ) {
                            setFullscreen(false);
                        }
                    }
                );

                return () => {
                    try {
                        if (subscription?.remove) {
                            subscription.remove();
                        }
                        // 确保退出时锁定为竖屏
                        ScreenOrientation.lockAsync(
                            ScreenOrientation.OrientationLock.PORTRAIT_UP
                        );
                    } catch (error) {
                        console.error("清理屏幕方向监听器失败:", error);
                    }
                };
            } catch (error) {
                console.error("初始化屏幕方向监听器失败:", error);
            }
        };

        subscribe();
    }, []);

    useEffect(() => {
        const updateStatusBar = () => {
            StatusBar.setHidden(fullscreen);
        };

        updateStatusBar();
        return () => StatusBar.setHidden(false);
    }, [fullscreen]);

    return { fullscreen, setFullscreen, toggleFullscreen };
} 