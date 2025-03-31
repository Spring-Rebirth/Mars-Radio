import React from 'react';
import { Text, View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NotificationItem as NotificationItemType, NotificationType } from '../../types/notification';

interface NotificationItemProps {
    item: NotificationItemType;
    onPress: (item: NotificationItemType) => Promise<void>;
    formatTime: (dateString: string) => string;
}

const NotificationItem = ({
    item,
    onPress,
    formatTime
}: NotificationItemProps): JSX.Element => {
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
        <TouchableOpacity
            onPress={() => onPress(item)}
            className="bg-white rounded-xl shadow-sm my-1.5 overflow-hidden"
        >
            <View className={`border-l-4 ${item.read ? 'border-gray-200' : 'border-orange-400'}`}>
                <View className="px-4 py-3">
                    <View className="flex-row justify-between items-center">
                        <View className="flex-row items-center flex-1">
                            <View className="mr-3">
                                {getNotificationIcon(item.type)}
                            </View>
                            <Text className="text-black font-psemibold text-base flex-1">
                                {item.title}
                            </Text>
                        </View>
                        <Text className="text-gray-400 text-xs ml-2">
                            {formatTime(item.createdAt)}
                        </Text>
                    </View>
                    <Text className="text-gray-600 mt-1 text-sm pl-8" numberOfLines={2}>
                        {item.body}
                    </Text>
                </View>
            </View>
        </TouchableOpacity>
    );
};

export default NotificationItem; 