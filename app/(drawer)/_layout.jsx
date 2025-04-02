import React from 'react';
import { Drawer } from 'expo-router/drawer';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import CustomDrawerContent from '../../components/drawer/CustomDrawerContent';

export default function DrawerLayout() {
    const { t } = useTranslation();

    return (
        <Drawer
            drawerContent={(props) => <CustomDrawerContent {...props} />}
            screenOptions={{
                configureGestureHandler: (gesture) => {
                    gesture.enabled(false);
                    return gesture;
                },
                swipeEdgeWidth: 120,
                gestureHandlerProps: {
                    hitSlop: { left: 0, right: -20, top: 0, bottom: 0 }
                },
                headerShown: false,
                gestureEnabled: false
            }}
        >
            <Drawer.Screen
                name="(tabs)"
                options={{
                    configureGestureHandler: (gesture) => {
                        gesture.enabled(true);
                        return gesture;
                    },
                    drawerLabel: t("Home"),
                    drawerIcon: ({ color }) => (
                        <Ionicons name="home-outline" size={24} color={color} />
                    ),
                    headerShown: false
                }}
            />
            <Drawer.Screen
                name="settings"
                options={{
                    drawerLabel: t("Settings"),
                    drawerIcon: ({ color }) => (
                        <Ionicons name="settings-outline" size={24} color={color} />
                    )
                }}
            />
        </Drawer>
    );
} 