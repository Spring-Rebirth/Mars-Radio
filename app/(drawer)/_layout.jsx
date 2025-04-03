import React from 'react';
import { Drawer } from 'expo-router/drawer';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { Dimensions } from 'react-native';
import CustomDrawerContent from '../../components/drawer/CustomDrawerContent';
import { usePathname } from 'expo-router';

export default function DrawerLayout() {
    const { t } = useTranslation();
    const screenWidth = Dimensions.get('window').width;
    const pathname = usePathname();

    // 检查当前路径是否为home或profile页面
    const isHomeOrProfile = pathname === '/home' || pathname === '/profile';

    return (
        <Drawer
            drawerContent={(props) => <CustomDrawerContent {...props} />}
            screenOptions={{
                configureGestureHandler: (gesture) => {
                    gesture.enabled(true);
                    return gesture;
                },
                swipeEdgeWidth: isHomeOrProfile ? screenWidth / 2 : screenWidth / 5,
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
