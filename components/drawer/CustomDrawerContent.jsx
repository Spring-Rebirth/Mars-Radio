import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    TouchableOpacity,
    Alert,
} from 'react-native';
import { DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import { useGlobalContext } from '../../context/GlobalProvider';
import { useTranslation } from 'react-i18next';
import LoadingModal from '../modal/LoadingModal';

export default function CustomDrawerContent(props) {
    const { user, handleLogout } = useGlobalContext();
    const [isLoading, setIsLoading] = useState(false);
    const { t } = useTranslation();

    // 处理退出登录
    const onLogout = () => {
        // 确认提示框
        Alert.alert(t('logout.title'), t('logout.message'), [
            { text: t('Cancel'), style: 'cancel' },
            {
                text: t('Confirm'), onPress: async () => {
                    // 执行退出登录时显示加载视图modal
                    setIsLoading(true);
                    await handleLogout();
                    setIsLoading(false);
                }
            },
        ]);
    };

    return (
        <DrawerContentScrollView
            {...props}
            style={styles.container}
            contentContainerStyle={{ paddingHorizontal: 0 }}
            bounces={false}
        >
            <LoadingModal isVisible={isLoading} loadingText={t('logout.loading')} />
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
            />

            {/* 底部区域 */}
            {user && (
                <View style={styles.bottomSection}>
                    <TouchableOpacity
                        style={styles.logoutButton}
                        onPress={onLogout}
                    >
                        <Ionicons name="log-out-outline" size={24} color="#FF4444" />
                        <Text style={styles.logoutText}>{t('Logout')}</Text>
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
