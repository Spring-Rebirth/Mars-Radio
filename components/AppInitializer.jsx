import { useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useDataManager } from '../hooks/useDataManager';
import * as Updates from "expo-updates";
import { useTranslation } from "react-i18next";
import Toast from "react-native-toast-message";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";

/**
 * 应用初始化组件
 * 使用自定义hooks初始化应用所需的所有数据和状态
 * 接收children作为prop并渲染它们，而不是返回空JSX
 */
export default function AppInitializer({ children }) {
    const { t } = useTranslation();

    // 使用自定义hook处理认证
    useAuth();

    // 使用自定义hook处理数据管理
    useDataManager();

    // 导航到深度链接目标
    const navigateToDeepLinkDestination = (path, queryParams) => {
        console.log("AppInitializer - 导航到深度链接目标:", path, queryParams);

        // 根据路径和参数决定导航目标
        if (path.includes('player/play-screen') || path.includes('play-screen')) {
            router.push({
                pathname: "player/play-screen",
                params: {
                    videoId: queryParams.videoId
                }
            });
        }
        // 添加其他深度链接路由处理...
    };

    // 设置应用初始化标记
    useEffect(() => {
        const markAppInitialized = async () => {
            try {
                await AsyncStorage.setItem('appInitialized', 'true');
                console.log('应用初始化完成标记已设置');

                // 处理待定的深度链接
                try {
                    const pendingDeepLink = await AsyncStorage.getItem('pendingDeepLink');
                    if (pendingDeepLink) {
                        const { path, queryParams } = JSON.parse(pendingDeepLink);
                        console.log('处理待定深度链接:', path, queryParams);

                        // 导航到目标页面
                        navigateToDeepLinkDestination(path, queryParams);

                        // 清除待定深度链接
                        await AsyncStorage.removeItem('pendingDeepLink');
                    }
                } catch (deepLinkError) {
                    console.error('处理待定深度链接失败:', deepLinkError);
                    // 尝试清除可能损坏的深度链接数据
                    await AsyncStorage.removeItem('pendingDeepLink');
                }
            } catch (error) {
                console.error('设置应用初始化标记失败:', error);
            }
        };

        markAppInitialized();

        return () => {
            // 清理函数
        };
    }, []);

    // 检查更新的逻辑单独放在一个useEffect中
    useEffect(() => {
        async function checkForUpdates() {
            try {
                const update = await Updates.checkForUpdateAsync();
                if (update.isAvailable) {
                    await Updates.fetchUpdateAsync();
                    // 显示 Toast 提示
                    Toast.show({
                        text1: t("OTA update loaded, restarting soon."),
                        type: "info",
                        topOffset: 68,
                    });
                    // 使用setTimeout而不是Promise.setTimeout更可靠
                    setTimeout(async () => {
                        try {
                            await Updates.reloadAsync();
                        } catch (reloadError) {
                            console.error('重启应用失败:', reloadError);
                        }
                    }, 2500);
                }
            } catch (error) {
                console.error('检查更新失败:', error);
            }
        }

        // 应用初始化后检查更新
        checkForUpdates();
    }, []);

    // 不返回null，而是返回children
    return children;
} 