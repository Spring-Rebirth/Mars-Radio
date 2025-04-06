import React from 'react';
import { Drawer } from 'expo-router/drawer';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import CustomDrawerContent from '../../components/drawer/CustomDrawerContent';
import useFocusStatusStore from '../../store/focusStatusStore';
import { Dimensions } from 'react-native';
export default function DrawerLayout() {
    const { t } = useTranslation();
    const { homeActiveTabIndex, profileActiveTabIndex } = useFocusStatusStore();
    const { width: screenWidth } = Dimensions.get('window');

    return (
        <Drawer
            drawerContent={(props) => <CustomDrawerContent {...props} />}
            screenOptions={{
                swipeEdgeWidth: screenWidth,
                headerShown: false,
            }}
        >
            <Drawer.Screen
                name="(tabs)"
                options={{
                    configureGestureHandler: (gesture) => {
                        if (homeActiveTabIndex === 0 || profileActiveTabIndex === 0) {
                            gesture.enabled(true);
                        } else {
                            gesture.enabled(false);
                        }

                        return gesture;
                    },
                    drawerLabel: t("Home"),
                    drawerIcon: ({ color }) => (
                        <Ionicons name="home-outline" size={24} color={color} />
                    ),
                }}
            />
            <Drawer.Screen
                name="settings"
                options={{
                    drawerLabel: t("Settings"),
                    drawerIcon: ({ color }) => (
                        <Ionicons name="settings-outline" size={24} color={color} />
                    ),
                }}
            />
        </Drawer>
    );
}
