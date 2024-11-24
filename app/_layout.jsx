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

  const [appState, setAppState] = useState('loading'); // 'loading', 'updating', 'ready'

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Error loading fonts: {error.message}</Text>
      </View>
    );
  }

  useEffect(() => {
    async function checkForUpdates() {
      try {
        console.log('Checking for updates');
        const update = await Updates.checkForUpdateAsync();

        if (update.isAvailable) {
          console.log('Fetching update...');
          setAppState('updating');
          await Updates.fetchUpdateAsync();

          console.log('Reloading app...');
          await Updates.reloadAsync();
        } else {
          console.log('No updates available.');
          setAppState('ready');
        }
      } catch (e) {
        console.log('Error checking for updates:', e);
        setAppState('ready');
      }
    }

    if (fontsLoaded) {
      checkForUpdates();
    }

  }, [fontsLoaded]);

  useEffect(() => {
    if (fontsLoaded && appState === 'ready') {
      AsyncStorage.getItem('language').then((lang) => {
        if (lang) {
          i18n.changeLanguage(lang);
        }
      });
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, appState]);

  if (appState === 'updating') {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Updating...</Text>
      </View>
    );
  }

  if (appState === 'loading') {
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