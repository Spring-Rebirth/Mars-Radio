import React, { useRef } from 'react';
import { Text, View, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NotificationItem as NotificationItemType, NotificationType } from '../../types/notification';
import { Swipeable, RectButton } from 'react-native-gesture-handler';

interface NotificationItemProps {
    item: NotificationItemType;
    onPress: (item: NotificationItemType) => Promise<void>;
    formatTime: (dateString: string) => string;
    onDelete: (id: string) => Promise<void>;
}

const NotificationItem = ({
    item,
    onPress,
    formatTime,
    onDelete
}: NotificationItemProps): JSX.Element => {
    const swipeableRef = useRef<Swipeable>(null);

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

    // 渲染右侧删除按钮
    const renderRightActions = (progress: Animated.AnimatedInterpolation<number>) => {
        // 滑动进度转化为透明度和位移
        const trans = progress.interpolate({
            inputRange: [0, 1],
            outputRange: [64, 0], // 从右侧64px位置滑入
        });

        return (
            <Animated.View style={{
                width: 64,
                transform: [{ translateX: trans }]
            }}>
                <RectButton
                    style={styles.deleteButton}
                    onPress={async () => {
                        swipeableRef.current?.close();
                        await onDelete(item.id);
                    }}
                >
                    <Ionicons name="trash-outline" size={22} color="white" />
                    <Text style={styles.deleteText}>删除</Text>
                </RectButton>
            </Animated.View>
        );
    };

    return (
        <View style={styles.itemContainer}>
            <Swipeable
                ref={swipeableRef}
                friction={2}
                rightThreshold={40}
                renderRightActions={renderRightActions}
            >
                <View className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <TouchableOpacity
                        onPress={() => onPress(item)}
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
                                    <Text className="text-gray-400 text-xs">
                                        {formatTime(item.createdAt)}
                                    </Text>
                                </View>
                                <Text className="text-gray-600 mt-1 text-sm pl-8" numberOfLines={2}>
                                    {item.body}
                                </Text>
                            </View>
                        </View>
                    </TouchableOpacity>
                </View>
            </Swipeable>
        </View>
    );
};

const styles = StyleSheet.create({
    itemContainer: {
        marginVertical: 6
    },
    deleteButton: {
        flex: 1,
        backgroundColor: '#EF4444',
        justifyContent: 'center',
        alignItems: 'center',
        borderTopRightRadius: 12,
        borderBottomRightRadius: 12
    },
    deleteText: {
        color: 'white',
        fontSize: 12,
        marginTop: 4
    }
});

export default NotificationItem; 