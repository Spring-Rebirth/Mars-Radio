import { useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useDataManager } from '../hooks/useDataManager';
import * as Updates from "expo-updates";
import { useTranslation } from "react-i18next";
import Toast from "react-native-toast-message";
import AsyncStorage from "@react-native-async-storage/async-storage";

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

    // 设置应用初始化标记
    useEffect(() => {
        const markAppInitialized = async () => {
            try {
                await AsyncStorage.setItem('appInitialized', 'true');
                console.log('应用初始化完成标记已设置');
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