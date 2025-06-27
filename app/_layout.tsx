import "react-native-url-polyfill/auto";
import React, { useEffect, useState, useRef } from "react";
import { router, SplashScreen, Stack } from "expo-router";
import { useFonts } from "expo-font";
import CombinedProvider from "../context/CombinedProvider";
import { I18nextProvider } from "react-i18next";
import i18n from "../i18n";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { View, Text, Platform, Linking } from "react-native";
import * as Notifications from "expo-notifications";
import { EventSubscription } from "expo-modules-core";
import useNotificationStore from "../store/notificationStore";
import { ClerkProvider, ClerkLoaded } from "@clerk/clerk-expo";
import { tokenCache } from "../lib/clerk/auth";
import { fetchAdminData } from "../lib/appwrite";
import { useAdminStore } from "../store/adminStore";
import Toast from "react-native-toast-message";
import AppInitializer from "../components/AppInitializer";
import "react-native-gesture-handler";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const originalWarn = console.warn;
console.warn = (message: any) => {
    if (typeof message === 'string' && message.includes("Clerk")) {
        return;
    }
    originalWarn(message);
};

const clerkPublishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

if (!clerkPublishableKey) {
    throw new Error(
        "Missing Publishable Key. Please set EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in your .env"
    );
}

// 防止自动隐藏 SplashScreen
SplashScreen.preventAutoHideAsync();

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
    }),
});

const queryClient = new QueryClient();

export default function RootLayout(): React.ReactNode {
    const [isReady, setIsReady] = useState<boolean>(false);
    const { setChannels, setNotification } = useNotificationStore();
    const notificationListener = useRef<EventSubscription>();
    const responseListener = useRef<EventSubscription>();
    const setAdminList = useAdminStore((state) => state.setAdminList);
    const [pendingDeepLink, setPendingDeepLink] = useState<{ path: string, queryParams: Record<string, string> } | null>(null);

    // 加载字体
    const [fontsLoaded, fontsError] = useFonts({
        "Poppins-Black": require("../assets/fonts/Poppins-Black.ttf"),
        "Poppins-Bold": require("../assets/fonts/Poppins-Bold.ttf"),
        "Poppins-ExtraBold": require("../assets/fonts/Poppins-ExtraBold.ttf"),
        "Poppins-ExtraLight": require("../assets/fonts/Poppins-ExtraLight.ttf"),
        "Poppins-Light": require("../assets/fonts/Poppins-Light.ttf"),
        "Poppins-Medium": require("../assets/fonts/Poppins-Medium.ttf"),
        "Poppins-Regular": require("../assets/fonts/Poppins-Regular.ttf"),
        "Poppins-SemiBold": require("../assets/fonts/Poppins-SemiBold.ttf"),
        "Poppins-Thin": require("../assets/fonts/Poppins-Thin.ttf"),
    });

    // URL解析辅助函数
    const parseURL = (url: string) => {
        // 移除自定义协议前缀(如 marsx://)
        const cleanUrl = url.includes('://') ?
            'https://' + url.split('://')[1] :
            url;

        try {
            const parsedURL = new URL(cleanUrl);
            const path = parsedURL.pathname;
            const queryParams: Record<string, string> = {};

            // 解析查询参数
            parsedURL.searchParams.forEach((value, key) => {
                queryParams[key] = value;
            });

            return { path, queryParams };
        } catch (error) {
            console.error("URL解析失败:", error);
            return { path: '', queryParams: {} };
        }
    };

    // 导航到深度链接目标
    const navigateToDeepLinkDestination = (path: string, queryParams: Record<string, string>) => {
        console.log("导航到深度链接目标:", path, queryParams);

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

    // 处理深度链接
    const handleDeepLink = (url: string | null) => {
        if (!url) return;
        console.log("处理深度链接:", url);

        // 解析URL获取参数
        const { path, queryParams } = parseURL(url);

        // 检查应用是否已初始化
        AsyncStorage.getItem('appInitialized').then((initialized) => {
            if (initialized === 'true') {
                // 应用已初始化，直接导航
                navigateToDeepLinkDestination(path, queryParams);
            } else {
                // 应用未初始化，存储导航意图并延迟执行
                console.log("应用未初始化，延迟深度链接处理");
                AsyncStorage.setItem('pendingDeepLink', JSON.stringify({ path, queryParams }));

                // 设置状态标记有待处理的深度链接
                setPendingDeepLink({ path, queryParams });
            }
        }).catch(error => {
            console.error("检查应用初始化状态失败:", error);
        });
    };

    // 设置深度链接监听器
    useEffect(() => {
        // 创建深度链接监听器
        const subscription = Linking.addEventListener('url', ({ url }) => {
            handleDeepLink(url);
        });

        // 处理应用启动时的深度链接
        Linking.getInitialURL().then((url) => {
            if (url) {
                handleDeepLink(url);
            }
        });

        return () => subscription.remove();
    }, []);

    // 在应用初始化完成后处理待定的深度链接
    useEffect(() => {
        if (isReady) {
            AsyncStorage.getItem('appInitialized').then((initialized) => {
                if (initialized === 'true') {
                    // 检查是否有待处理的深度链接
                    AsyncStorage.getItem('pendingDeepLink').then((pendingLink) => {
                        if (pendingLink) {
                            try {
                                const { path, queryParams } = JSON.parse(pendingLink);
                                navigateToDeepLinkDestination(path, queryParams);
                                // 处理完后清除
                                AsyncStorage.removeItem('pendingDeepLink');
                                setPendingDeepLink(null);
                            } catch (error) {
                                console.error("解析待定深度链接失败:", error);
                                AsyncStorage.removeItem('pendingDeepLink');
                            }
                        } else if (pendingDeepLink) {
                            // 使用状态中的待定深度链接
                            navigateToDeepLinkDestination(pendingDeepLink.path, pendingDeepLink.queryParams);
                            setPendingDeepLink(null);
                        }
                    }).catch(error => {
                        console.error("获取待定深度链接失败:", error);
                    });
                }
            }).catch(error => {
                console.error("检查应用初始化状态失败:", error);
            });
        }
    }, [isReady, pendingDeepLink]);

    useEffect(() => {
        async function prepare(): Promise<void> {
            try {
                // 确保字体已加载
                if (fontsLoaded && !fontsError) {
                    // 加载语言设置
                    const lang = await AsyncStorage.getItem("language");
                    if (lang) {
                        await i18n.changeLanguage(lang);
                    }
                }

                // 检查是否有字体加载错误
                if (fontsError) {
                    throw fontsError;
                }
            } catch (e) {
                console.log(e);
            } finally {
                setIsReady(true);
            }
        }

        prepare();
    }, [fontsLoaded, fontsError]);

    useEffect(() => {
        if (isReady && !fontsError) {
            SplashScreen.hideAsync();
        }
    }, [isReady, fontsError]);

    // 如果字体加载出错，显示字体加载错误信息
    if (fontsError) {
        return (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                <Text style={{ fontSize: 16, color: "red" }}>
                    字体加载错误: {fontsError.message}
                </Text>
            </View>
        );
    }

    useEffect(() => {
        if (Platform.OS === "android") {
            Notifications.getNotificationChannelsAsync().then((value) =>
                setChannels(value ?? [])
            ); // 使用 Zustand 的 setChannels
        }

        notificationListener.current =
            Notifications.addNotificationReceivedListener((notification) => {
                setNotification(notification); // 使用 Zustand 的 setNotification
            });

        responseListener.current =
            Notifications.addNotificationResponseReceivedListener((response) => {
                console.log(response);
                // 不使用setTimeout，避免时机问题
                try {
                    // 检查应用是否已初始化
                    AsyncStorage.getItem('appInitialized').then((initialized) => {
                        const notificationContent = response.notification.request.content;
                        if (initialized === 'true') {
                            // 应用已初始化，可以安全导航
                            router.push({
                                pathname: "(drawer)/(tabs)/notice",
                                params: {
                                    data: notificationContent ? JSON.stringify(notificationContent) : '',
                                }
                            });
                        } else {
                            // 应用未初始化，延迟导航
                            console.log("应用未初始化，延迟通知处理");
                            setTimeout(() => {
                                router.push({
                                    pathname: "(drawer)/(tabs)/notice",
                                    params: {
                                        data: notificationContent ? JSON.stringify(notificationContent) : '',
                                    }
                                });
                            }, 1500); // 延长等待时间到1.5秒
                        }
                    }).catch(error => {
                        console.error("检查应用初始化状态失败:", error);
                    });
                } catch (error) {
                    console.error("通知导航错误:", error);
                }
            });

        return () => {
            notificationListener.current &&
                Notifications.removeNotificationSubscription(
                    notificationListener.current
                );
            responseListener.current &&
                Notifications.removeNotificationSubscription(responseListener.current);
        };
    }, []);

    useEffect(() => {
        const addAdminData = async (): Promise<void> => {
            await fetchAdminData()
                .then((data) => {
                    if (data) {
                        const adminArray = data.map((doc) => doc.account);
                        console.log("adminArray:", adminArray);
                        setAdminList(adminArray);
                    }
                })
                .catch((error) => {
                    console.error("Error fetching admin data:", error);
                });
        };

        addAdminData();
    }, []);

    // 如果应用未准备好，保持 SplashScreen 可见
    if (!isReady) {
        return null;
    }

    // 应用准备好后，渲染主要内容
    return (
        <ClerkProvider publishableKey={clerkPublishableKey} tokenCache={tokenCache}>
            <ClerkLoaded>
                <I18nextProvider i18n={i18n}>
                    <QueryClientProvider client={queryClient}>
                        <CombinedProvider>
                            <AppInitializer>
                                <GestureHandlerRootView style={{ flex: 1 }}>
                                    <Stack>
                                        {/* 不需要 Drawer 的路由 */}
                                        <Stack.Screen name="index" options={{ headerShown: false }} />
                                        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                                        <Stack.Screen name="player" options={{ headerShown: false }} />
                                        <Stack.Screen name="screens" options={{ headerShown: false }} />
                                        <Stack.Screen name="search/[query]" options={{ headerShown: false }} />
                                        <Stack.Screen name="view-user/index" options={{ headerShown: false }} />
                                        {/* 包含 Drawer 的路由组 */}
                                        <Stack.Screen
                                            name="(drawer)"
                                            options={{ headerShown: false }}
                                        />
                                    </Stack>
                                </GestureHandlerRootView>
                            </AppInitializer>
                        </CombinedProvider>
                    </QueryClientProvider>
                </I18nextProvider>
            </ClerkLoaded>
            <Toast />
        </ClerkProvider>
    );
} 