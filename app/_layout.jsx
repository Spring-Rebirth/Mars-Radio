import 'react-native-url-polyfill/auto';
import React, { useEffect, useState, useRef } from 'react';
import { router, SplashScreen } from "expo-router";
import { useFonts } from 'expo-font';
import { GlobalProvider } from '../context/GlobalProvider';
import * as Updates from 'expo-updates';
import AppContent from '../context/AppContent';
import { I18nextProvider } from 'react-i18next';
import i18n from '../i18n';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, Text, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { RootSiblingParent } from 'react-native-root-siblings';
import Toast from 'react-native-root-toast';
import { useTranslation } from 'react-i18next';
import useNotificationStore from '../store/notificationStore';
import { ClerkProvider, ClerkLoaded } from '@clerk/clerk-expo';
import { tokenCache } from '../lib/clerk/auth'

const originalWarn = console.warn;
console.warn = (message) => {
  if (message.includes('Clerk')) {
    return;
  }
  originalWarn(message);
};

const clerkPublishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

if (!clerkPublishableKey) {
  throw new Error(
    'Missing Publishable Key. Please set EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in your .env',
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
  const [error, setError] = useState(null);
  const { setChannels, setNotification } = useNotificationStore();
  const notificationListener = useRef();
  const responseListener = useRef();
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
          const lang = await AsyncStorage.getItem('language');
          if (lang) {
            await i18n.changeLanguage(lang);
          }

          // 检查更新
          const update = await Updates.checkForUpdateAsync();
          if (update.isAvailable) {
            await Updates.fetchUpdateAsync();
            // 显示 Toast 提示
            Toast.show(t('OTA update loaded, restarting soon.'), {
              duration: 2500,
              position: Toast.positions.CENTER,
              shadow: true,
              animation: true,
              hideOnPress: true,
              delay: 0,
            });
            // 等待N秒后重启
            await new Promise(resolve => setTimeout(resolve, 2500));
            await Updates.reloadAsync();
          }
        }

        // 检查是否有字体加载错误
        if (fontsError) {
          throw fontsError;
        }
      } catch (e) {
        console.warn('Initialization error:', e);
        setError(e);
      } finally {
        setIsReady(true);
      }

    }

    prepare();

  }, [fontsLoaded, fontsError]);

  useEffect(() => {
    if (isReady && !fontsError && !error) {
      SplashScreen.hideAsync();
    }
  }, [isReady, fontsError, error]);

  // 如果发生初始化错误，显示错误信息
  if (error) {
    Toast.show(`初始化错误: ${error.message || '未知错误'}`, {
      duration: 2500,
      position: Toast.positions.CENTER
    })
  }

  // 如果字体加载出错，显示字体加载错误信息
  if (fontsError) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontSize: 16, color: 'red' }}>字体加载错误: {fontsError.message}</Text>
      </View>
    );
  }

  useEffect(() => {
    if (Platform.OS === 'android') {
      Notifications.getNotificationChannelsAsync()
        .then(value => setChannels(value ?? [])); // 使用 Zustand 的 setChannels
    }

    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      setNotification(notification); // 使用 Zustand 的 setNotification
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log(response);
      setTimeout(() => {
        router.push({
          pathname: '/notifications/notice-screen',
          params: { data: JSON.stringify(response.notification.request.content) },
        });
      }, 500); // 延迟 500 毫秒后跳转
    });

    return () => {
      notificationListener.current &&
        Notifications.removeNotificationSubscription(notificationListener.current);
      responseListener.current &&
        Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, []);

  // 如果应用未准备好，保持 SplashScreen 可见
  if (!isReady) {
    return null;
  }

  // 应用准备好后，渲染主要内容
  return (
    <ClerkProvider publishableKey={clerkPublishableKey} tokenCache={tokenCache}>
      <ClerkLoaded>
        <RootSiblingParent>
          <I18nextProvider i18n={i18n}>
            <GlobalProvider>
              <AppContent />
            </GlobalProvider>
          </I18nextProvider>
        </RootSiblingParent>
      </ClerkLoaded>
    </ClerkProvider>
  );
}
