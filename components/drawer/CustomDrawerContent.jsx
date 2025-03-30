import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    TouchableOpacity,
} from 'react-native';
import { DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import { useDrawerNavigation } from '../../context/drawerNavigationContext';
import { useGlobalContext } from '../../context/GlobalProvider';

export default function CustomDrawerContent(props) {
    const { menuItems } = useDrawerNavigation();
    const { user, handleLogout } = useGlobalContext();

    // 处理退出登录
    const onLogout = () => {
        props.navigation.closeDrawer();
        // 延迟执行退出操作，确保抽屉关闭后再执行
        setTimeout(() => {
            handleLogout();
        }, 300);
    };

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
                    source={{ uri: user?.avatar }}
                    style={styles.avatar}
                />
                <Text style={styles.username}>{user?.username || '游客'}</Text>
                {user?.email && <Text style={styles.email}>{user.email}</Text>}
            </View>

            {/* 菜单项 */}
            <DrawerItemList
                {...props}
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
                            props.navigation.navigate(item.route);
                            props.navigation.closeDrawer();
                        }}
                    >
                        <Ionicons name={item.icon} size={24} color="#333" />
                        <Text style={styles.menuItemText}>{item.label}</Text>
                    </TouchableOpacity>
                ))}
            </DrawerItemList>

            {/* 底部区域 */}
            {user && (
                <View style={styles.bottomSection}>
                    <TouchableOpacity
                        style={styles.logoutButton}
                        onPress={onLogout}
                    >
                        <Ionicons name="log-out-outline" size={24} color="#FF4444" />
                        <Text style={styles.logoutText}>退出登录</Text>
                    </TouchableOpacity>
                </View>
            )}
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
