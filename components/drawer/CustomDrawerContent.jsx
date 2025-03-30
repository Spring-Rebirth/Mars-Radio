import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    TouchableOpacity,
    ScrollView,
} from 'react-native';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const CustomDrawerContent = (props) => {
    const router = useRouter();

    const menuItems = [
        {
            icon: 'home-outline',
            label: '首页',
            route: '/',
        },
        {
            icon: 'apps-outline',
            label: '标签页',
            route: '/(tabs)',
        },
        {
            icon: 'person-outline',
            label: '个人资料',
            route: '/(tabs)/profile',
        },
        {
            icon: 'settings-outline',
            label: '设置',
            route: '/(tabs)/settings',
        },
    ];

    return (
        <DrawerContentScrollView
            {...props}
            style={styles.container}
            contentContainerStyle={{ paddingHorizontal: 0 }}
            bounces={false}
        >
            {/* 用户信息区域 */}
            <View style={styles.userSection}>
                <Image
                    source={{ uri: 'https://placekitten.com/200/200' }}
                    style={styles.avatar}
                />
                <Text style={styles.username}>用户名</Text>
                <Text style={styles.email}>user@example.com</Text>
            </View>

            {/* 分割线 */}
            <View style={styles.divider} />

            {/* 菜单项 */}
            <ScrollView
                style={styles.menuSection}
                directionalLockEnabled={true}
                horizontal={false}
                showsVerticalScrollIndicator={false}
            >
                {menuItems.map((item, index) => (
                    <TouchableOpacity
                        key={index}
                        style={styles.menuItem}
                        onPress={() => {
                            router.push(item.route);
                            props.navigation.closeDrawer();
                        }}
                    >
                        <Ionicons name={item.icon} size={24} color="#333" />
                        <Text style={styles.menuItemText}>{item.label}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* 底部区域 */}
            <View style={styles.bottomSection}>
                <TouchableOpacity style={styles.logoutButton}>
                    <Ionicons name="log-out-outline" size={24} color="#FF4444" />
                    <Text style={styles.logoutText}>退出登录</Text>
                </TouchableOpacity>
            </View>
        </DrawerContentScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    userSection: {
        padding: 20,
        alignItems: 'center',
        marginTop: 20,
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        marginBottom: 10,
    },
    username: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        fontFamily: 'Poppins-SemiBold',
    },
    email: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
        fontFamily: 'Poppins-Regular',
    },
    divider: {
        height: 1,
        backgroundColor: '#E0E0E0',
        marginVertical: 10,
    },
    menuSection: {
        flex: 1,
        paddingTop: 10,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        paddingLeft: 20,
    },
    menuItemText: {
        marginLeft: 15,
        fontSize: 16,
        color: '#333',
        fontFamily: 'Poppins-Regular',
    },
    bottomSection: {
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0',
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 10,
    },
    logoutText: {
        color: '#FF4444',
        marginLeft: 10,
        fontSize: 16,
        fontFamily: 'Poppins-Medium',
    },
});

export default CustomDrawerContent; 