import "react-native-url-polyfill/auto";
import React, { useEffect, useState, useRef } from "react";
import { router, SplashScreen, Stack } from "expo-router";
import { useFonts } from "expo-font";
import { GlobalProvider, TabProvider } from "../context/GlobalProvider";
import * as Updates from "expo-updates";
import { I18nextProvider } from "react-i18next";
import i18n from "../i18n";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { View, Text, Platform } from "react-native";
import * as Notifications from "expo-notifications";
import { useTranslation } from "react-i18next";
import useNotificationStore from "../store/notificationStore";
import { ClerkProvider, ClerkLoaded } from "@clerk/clerk-expo";
import { tokenCache } from "../lib/clerk/auth";
import { fetchAdminData } from "../lib/appwrite";
import { useAdminStore } from "../store/adminStore";
import Toast from "react-native-toast-message";
import AppInitializer from "../components/AppInitializer";
import { Drawer } from "expo-router/drawer";
import "react-native-gesture-handler";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import CustomDrawerContent from "../components/drawer/CustomDrawerContent";
import DrawerNavigationProvider from "../context/drawerNavigationContext";

const originalWarn = console.warn;
console.warn = (message) => {
    if (message.includes("Clerk")) {
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

export default function RootLayout() {
    const [isReady, setIsReady] = useState(false);
    const { setChannels, setNotification } = useNotificationStore();
    const notificationListener = useRef();
    const responseListener = useRef();
    const setAdminList = useAdminStore((state) => state.setAdminList);
    const { t } = useTranslation();

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

    useEffect(() => {
        async function prepare() {
            try {
                // 确保字体已加载
                if (fontsLoaded && !fontsError) {
                    // 加载语言设置
                    const lang = await AsyncStorage.getItem("language");
                    if (lang) {
                        await i18n.changeLanguage(lang);
                    }

                    // 检查更新
                    const update = await Updates.checkForUpdateAsync();
                    if (update.isAvailable) {
                        await Updates.fetchUpdateAsync();
                        // 显示 Toast 提示
                        Toast.show({
                            text1: t("OTA update loaded, restarting soon."),
                            type: "info",
                            topOffset: 68,
                        });
                        // 等待N秒后重启
                        await new Promise((resolve) => setTimeout(resolve, 2500));
                        await Updates.reloadAsync();
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
                setTimeout(() => {
                    router.push({
                        pathname: "/notifications/notice-screen",
                        params: {
                            data: JSON.stringify(response.notification.request.content),
                        },
                    });
                }, 500); // 延迟 500 毫秒后跳转
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
        const addAdminData = async () => {
            await fetchAdminData()
                .then((data) => {
                    const adminArray = data.map((doc) => doc.account);
                    console.log("adminArray:", adminArray);
                    setAdminList(adminArray);
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
                    <GlobalProvider>
                        <TabProvider>
                            <DrawerNavigationProvider>
                                <AppInitializer>
                                    <GestureHandlerRootView style={{ flex: 1 }}>
                                        <Drawer
                                            screenOptions={{
                                                drawerContent: (props) => <CustomDrawerContent {...props} />,
                                                gestureEnabled: true,
                                                swipeEdgeWidth: 70,
                                                gestureHandlerProps: {
                                                    hitSlop: { left: 0, right: -20, top: 0, bottom: 0 }
                                                },
                                                headerShown: false
                                            }}
                                        >
                                            <Drawer.Screen
                                                name="index"
                                                options={{
                                                    drawerLabel: "首页"
                                                }}
                                            />
                                            <Drawer.Screen
                                                name="(tabs)"
                                                options={{
                                                    drawerLabel: "标签页"
                                                }}
                                            />
                                            <Drawer.Screen name="(auth)/sign-in" options={{ drawerItemStyle: { display: 'none' } }} />
                                            <Drawer.Screen name="(auth)/sign-up" options={{ drawerItemStyle: { display: 'none' } }} />
                                            <Drawer.Screen name="(auth)/pw-reset" options={{ drawerItemStyle: { display: 'none' } }} />
                                            <Drawer.Screen name='(auth)/user-info' options={{ drawerItemStyle: { display: 'none' } }} />
                                            <Drawer.Screen name="search/[query]" options={{ drawerItemStyle: { display: 'none' } }} />
                                            <Drawer.Screen name='player/play-screen' options={{ drawerItemStyle: { display: 'none' } }} />
                                            <Drawer.Screen name='notifications/notice-screen' options={{ drawerItemStyle: { display: 'none' } }} />
                                            <Drawer.Screen name='view-user/index' options={{ drawerItemStyle: { display: 'none' } }} />
                                            <Drawer.Screen name='screens/post-details' options={{ drawerItemStyle: { display: 'none' } }} />
                                            <Drawer.Screen name='screens/create-post' options={{ drawerItemStyle: { display: 'none' } }} />
                                        </Drawer>
                                    </GestureHandlerRootView>
                                </AppInitializer>
                            </DrawerNavigationProvider>
                        </TabProvider>
                    </GlobalProvider>
                </I18nextProvider>
            </ClerkLoaded>
            <Toast />
        </ClerkProvider>
    );
}
