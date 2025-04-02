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
                    gesture.enabled(true);
                    return gesture;
                },
                swipeEdgeWidth: 120,
                headerShown: false,
            }}
        >
            <Drawer.Screen
                name="(tabs)"
                options={{
                    drawerLabel: t("Home"),
                    drawerIcon: ({ color }) => (
                        <Ionicons name="home-outline" size={24} color={color} />
                    ),
                }}
            />
            <Drawer.Screen
                name="settings/index"
                options={{
                    drawerLabel: t("Settings"),
                    drawerIcon: ({ color }) => (
                        <Ionicons name="settings-outline" size={24} color={color} />
                    ),
                }}
            />
            <Drawer.Screen
                name="settings/user-info"
                options={{
                    drawerItemStyle: {
                        display: 'none',
                    },
                }}
            />
        </Drawer>
    );
}
