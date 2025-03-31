import React from 'react';
import {
    Text,
    View,
    TouchableOpacity,
    Modal,
    ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { NotificationItem, NotificationType } from '../../types/notification';

interface NotificationModalProps {
    visible: boolean;
    onClose: () => void;
    notification: NotificationItem | null;
    onNavigateToContent: () => Promise<void>;
    formatTime: (dateString: string) => string;
}

const NotificationModal = ({
    visible,
    onClose,
    notification,
    onNavigateToContent,
    formatTime
}: NotificationModalProps): JSX.Element => {
    const { t } = useTranslation();

    // 获取通知图标
    const getNotificationIcon = (type: NotificationType): JSX.Element => {
        switch (type) {
            case 'post':
                return <Ionicons name="play-circle-outline" size={22} color="#FF9800" />;
            case 'comment':
                return <Ionicons name="chatbubble-outline" size={22} color="#4CAF50" />;
            case 'user':
                return <Ionicons name="person-outline" size={22} color="#2196F3" />;
            case 'welcome':
                return <Ionicons name="heart-outline" size={22} color="#F44336" />;
            default:
                return <Ionicons name="notifications-outline" size={22} color="#757575" />;
        }
    };

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View className="flex-1 bg-black/50 justify-end">
                <View className="bg-white rounded-t-3xl pt-6 pb-10 px-4 h-2/3">
                    {/* 标题栏 */}
                    <View className="flex-row justify-between items-center mb-5">
                        <Text className="text-xl font-psemibold text-black">
                            {t('Notification Details')}
                        </Text>
                        <TouchableOpacity
                            onPress={onClose}
                            className="rounded-full p-2 bg-gray-100"
                        >
                            <Ionicons name="close" size={20} color="#333" />
                        </TouchableOpacity>
                    </View>

                    {/* 内容区域 */}
                    {notification && (
                        <ScrollView className="flex-1">
                            {/* 通知类型和时间 */}
                            <View className="flex-row justify-between items-center mb-4">
                                <View className="flex-row items-center">
                                    <View className="mr-2">
                                        {getNotificationIcon(notification.type)}
                                    </View>
                                    <Text className="text-gray-500 capitalize">
                                        {t(notification.type)}
                                    </Text>
                                </View>
                                <Text className="text-gray-400">
                                    {formatTime(notification.createdAt)}
                                </Text>
                            </View>

                            {/* 标题 */}
                            <Text className="text-xl font-psemibold text-black mb-3">
                                {notification.title}
                            </Text>

                            {/* 内容 */}
                            <Text className="text-gray-700 mb-6 leading-6">
                                {notification.body}
                            </Text>

                            {/* 关联数据 */}
                            {notification.data && Object.keys(notification.data).length > 0 && (
                                <View className="mb-6 bg-gray-50 p-3 rounded-lg">
                                    <Text className="text-gray-500 mb-2 font-psemibold">
                                        {t('Related Information')}
                                    </Text>
                                    {Object.entries(notification.data).map(([key, value]) => (
                                        <View key={key} className="flex-row">
                                            <Text className="text-gray-500 font-medium w-20">
                                                {key}:
                                            </Text>
                                            <Text className="text-gray-700 ml-2">
                                                {value?.toString()}
                                            </Text>
                                        </View>
                                    ))}
                                </View>
                            )}

                            {/* 操作按钮 */}
                            {(notification.data &&
                                (notification.data.postId || notification.data.userId)) && (
                                    <TouchableOpacity
                                        onPress={onNavigateToContent}
                                        className="bg-orange-400 rounded-lg py-3 items-center mb-4"
                                    >
                                        <Text className="text-white font-psemibold">
                                            {notification.data.postId
                                                ? t('View Post')
                                                : t('View Profile')}
                                        </Text>
                                    </TouchableOpacity>
                                )}
                        </ScrollView>
                    )}
                </View>
            </View>
        </Modal>
    );
};

export default NotificationModal; 