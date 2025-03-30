// app/settings.tsx
import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Switch,
    TouchableOpacity,
    ScrollView,
    Image,
    Alert
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useGlobalContext } from '../../context/GlobalProvider';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

type SettingItemProps = {
    icon: string;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    rightElement?: React.ReactNode;
};

const SettingItem: React.FC<SettingItemProps> = ({
    icon,
    title,
    subtitle,
    onPress,
    rightElement
}) => {
    return (
        <TouchableOpacity
            style={styles.settingItem}
            onPress={onPress}
            disabled={!onPress}
        >
            <View style={styles.settingIconContainer}>
                <Ionicons name={icon as any} size={24} color="#FF6B6B" />
            </View>
            <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>{title}</Text>
                {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
            </View>
            {rightElement || (
                <Ionicons name="chevron-forward" size={20} color="#999" />
            )}
        </TouchableOpacity>
    );
};

export default function Settings() {
    const insets = useSafeAreaInsets();
    const { t, i18n } = useTranslation();
    const { user, handleLogout } = useGlobalContext();
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [darkModeEnabled, setDarkModeEnabled] = useState(false);

    const toggleNotifications = () => {
        setNotificationsEnabled(previous => !previous);
    };

    const toggleDarkMode = () => {
        setDarkModeEnabled(previous => !previous);
    };

    const changeLanguage = async (lang: string) => {
        try {
            await i18n.changeLanguage(lang);
            await AsyncStorage.setItem('language', lang);
            Alert.alert(t('Success'), t('Language changed successfully'));
        } catch (error) {
            console.error('Failed to change language:', error);
            Alert.alert(t('Error'), t('Failed to change language'));
        }
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.navigate('/(tabs)/home')}
                >
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('Settings')}</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView style={styles.scrollView}>
                {/* 用户信息部分 */}
                <View style={styles.profileSection}>
                    <Image
                        source={{ uri: user?.avatar }}
                        style={styles.profileImage}
                    />
                    <Text style={styles.profileName}>{user?.username || t('Guest')}</Text>
                    <Text style={styles.profileEmail}>{user?.email || ''}</Text>

                    {user && (
                        <TouchableOpacity
                            style={styles.editProfileButton}
                            onPress={() => router.push('/(auth)/user-info')}
                        >
                            <Text style={styles.editProfileButtonText}>{t('Edit Profile')}</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* 设置分组 */}
                <View style={styles.settingGroup}>
                    <Text style={styles.settingGroupTitle}>{t('Preferences')}</Text>

                    <SettingItem
                        icon="notifications-outline"
                        title={t('Notifications')}
                        subtitle={t('Receive push notifications')}
                        rightElement={
                            <Switch
                                value={notificationsEnabled}
                                onValueChange={toggleNotifications}
                                trackColor={{ false: '#D9D9D9', true: '#FFB300' }}
                                thumbColor={notificationsEnabled ? '#FFA001' : '#f4f3f4'}
                            />
                        }
                    />

                    <SettingItem
                        icon="moon-outline"
                        title={t('Dark Mode')}
                        subtitle={t('Change app appearance')}
                        rightElement={
                            <Switch
                                value={darkModeEnabled}
                                onValueChange={toggleDarkMode}
                                trackColor={{ false: '#D9D9D9', true: '#FFB300' }}
                                thumbColor={darkModeEnabled ? '#FFA001' : '#f4f3f4'}
                            />
                        }
                    />

                    <SettingItem
                        icon="language-outline"
                        title={t('Language')}
                        subtitle={i18n.language === 'zh' ? '中文' : 'English'}
                        onPress={() => {
                            const newLang = i18n.language === 'zh' ? 'en' : 'zh';
                            changeLanguage(newLang);
                        }}
                    />
                </View>

                <View style={styles.settingGroup}>
                    <Text style={styles.settingGroupTitle}>{t('Account')}</Text>

                    <SettingItem
                        icon="lock-closed-outline"
                        title={t('Privacy')}
                        onPress={() => Alert.alert(t('Privacy'), t('Privacy settings coming soon'))}
                    />

                    <SettingItem
                        icon="shield-outline"
                        title={t('Security')}
                        onPress={() => Alert.alert(t('Security'), t('Security settings coming soon'))}
                    />

                    {user && (
                        <SettingItem
                            icon="log-out-outline"
                            title={t('Sign Out')}
                            onPress={handleLogout}
                        />
                    )}
                </View>

                <View style={styles.settingGroup}>
                    <Text style={styles.settingGroupTitle}>{t('About')}</Text>

                    <SettingItem
                        icon="information-circle-outline"
                        title={t('About App')}
                        subtitle={t('Version 1.0.0')}
                        onPress={() => Alert.alert(t('About App'), t('Mars Radio - Your Galactic Audio Platform'))}
                    />

                    <SettingItem
                        icon="help-circle-outline"
                        title={t('Help & Support')}
                        onPress={() => Alert.alert(t('Help & Support'), t('Contact us at support@marsradio.com'))}
                    />
                </View>
            </ScrollView>

            <StatusBar style="dark" />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        height: 56,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        fontFamily: 'Poppins-SemiBold',
        color: '#333',
    },
    scrollView: {
        flex: 1,
    },
    profileSection: {
        padding: 24,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    profileImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
        marginBottom: 12,
    },
    profileName: {
        fontSize: 20,
        fontWeight: 'bold',
        fontFamily: 'Poppins-SemiBold',
        color: '#333',
        marginBottom: 4,
    },
    profileEmail: {
        fontSize: 14,
        color: '#666',
        fontFamily: 'Poppins-Regular',
        marginBottom: 16,
    },
    editProfileButton: {
        paddingHorizontal: 20,
        paddingVertical: 8,
        backgroundColor: '#FFB300',
        borderRadius: 20,
    },
    editProfileButtonText: {
        color: '#FFF',
        fontFamily: 'Poppins-Medium',
        fontSize: 14,
    },
    settingGroup: {
        marginBottom: 24,
    },
    settingGroupTitle: {
        fontSize: 16,
        fontFamily: 'Poppins-SemiBold',
        color: '#FF6B6B',
        marginLeft: 16,
        marginTop: 16,
        marginBottom: 8,
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        backgroundColor: '#fff',
    },
    settingIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 107, 107, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    settingContent: {
        flex: 1,
    },
    settingTitle: {
        fontSize: 16,
        fontFamily: 'Poppins-Regular',
        color: '#333',
    },
    settingSubtitle: {
        fontSize: 13,
        fontFamily: 'Poppins-Regular',
        color: '#999',
        marginTop: 2,
    },
});