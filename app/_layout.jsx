import 'react-native-url-polyfill/auto';
import React, { useEffect, useState } from 'react';
import { SplashScreen } from "expo-router";
import { useFonts } from 'expo-font';
import { GlobalProvider } from '../context/GlobalProvider';
import * as Updates from 'expo-updates';
import AppContent from '../context/AppContent';
import { I18nextProvider } from 'react-i18next';
import i18n from '../i18n';
import AsyncStorage from '@react-native-async-storage/async-storage';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [appState, setAppState] = useState('loading');
  const [hasCheckedUpdates, setHasCheckedUpdates] = useState(false);
  const [isLanguageLoaded, setIsLanguageLoaded] = useState(false);

  const [fontsLoaded, error] = useFonts({
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
    async function checkForUpdates() {
      if (hasCheckedUpdates) return;

      try {
        setHasCheckedUpdates(true);
        const update = await Updates.checkForUpdateAsync();

        if (update.isAvailable) {
          setAppState('updating');
          await Updates.fetchUpdateAsync();
          await Updates.reloadAsync();
        } else {
          setAppState('ready');
        }
      } catch (e) {
        console.error('Update error:', e);
        setAppState('ready');
      }
    }

    if (fontsLoaded && !error) {
      checkForUpdates();
    }
  }, [fontsLoaded, error]);

  useEffect(() => {
    async function loadLanguage() {
      try {
        const lang = await AsyncStorage.getItem('language');
        if (lang) {
          await i18n.changeLanguage(lang);
        }
        setIsLanguageLoaded(true);
      } catch (e) {
        console.error('Language loading error:', e);
        setIsLanguageLoaded(true); // 即使失败也继续
      }
    }

    if (appState === 'ready') {
      loadLanguage();
    }
  }, [appState]);

  useEffect(() => {
    if (fontsLoaded && appState === 'ready' && isLanguageLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, appState, isLanguageLoaded]);

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Font loading error: {error.message}</Text>
      </View>
    );
  }

  if (appState === 'updating') {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Updating...</Text>
      </View>
    );
  }

  if (appState === 'loading' || !isLanguageLoaded) {
    return null;
  }

  return (
    <I18nextProvider i18n={i18n}>
      <GlobalProvider>
        <AppContent />
      </GlobalProvider>
    </I18nextProvider>
  );
}