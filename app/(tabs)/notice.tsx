import { schedulePushNotification } from '../../functions/notifications';
import { useEffect, useState, useRef } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { config, databases } from '../../services/postsService';
import { useTranslation } from 'react-i18next';
import {
    Text,
    View,
    FlatList,
    Image,
    TouchableOpacity,
    Animated,
    RefreshControl,
    Alert,
    ScrollView,
    ListRenderItem
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { images } from '../../constants';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import useNotificationStore from '../../store/notificationStore';
import { useGlobalContext } from '../../context/GlobalProvider';
import {
    NotificationType,
    NotificationData,
    NotificationItem,
    NotificationStats,
    ParsedNotificationData
} from '../../types/notification';
import NotificationModal from '../../components/modal/NotificationModal';
import NotificationItemComponent from '../../components/items/NotificationItem';

function NoticeScreen(): JSX.Element {
    // URL参数和状态
    const { data } = useLocalSearchParams<{ data?: string }>();
    const [notificationsData, setNotificationsData] = useState<ParsedNotificationData | null>(null);
    const [notifications, setNotifications] = useState<NotificationItem[]>([
        // 样本通知数据 - 实际中应从API或存储中获取
        {
            id: '1',
            title: '欢迎使用 Mars Radio!',
            body: '感谢您使用我们的应用，探索更多功能并开始分享您的视频！',
            createdAt: new Date(Date.now() - 3600000).toISOString(),
            read: true,
            type: 'welcome',
            data: {}
        }
    ]);
    const [refreshing, setRefreshing] = useState<boolean>(false);
    const [selectedNotification, setSelectedNotification] = useState<NotificationItem | null>(null);
    const [modalVisible, setModalVisible] = useState<boolean>(false);
    const [notificationStats, setNotificationStats] = useState<NotificationStats>({
        total: 1,
        unread: 0,
        today: 0
    });
    const { t } = useTranslation();
    const insetTop = useSafeAreaInsets().top;
    const fadeAnim = useRef<Animated.Value>(new Animated.Value(0)).current;
    const { notification, setNotification, clearNotification } = useNotificationStore();
    const { user } = useGlobalContext();

    // 加载动画
    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true
        }).start();
    }, []);

    // 解析URL参数中的通知数据并添加到列表
    useEffect(() => {
        if (data) {
            try {
                const parsedData: ParsedNotificationData = JSON.parse(data);
                setNotificationsData(parsedData);

                // 确定通知类型
                let notificationType: NotificationType = 'general';
                if (parsedData.data) {
                    if (parsedData.data.postId) notificationType = 'post';
                    else if (parsedData.data.commentId) notificationType = 'comment';
                    else if (parsedData.data.userId) notificationType = 'user';
                }

                // 构建新通知对象
                const newNotification: NotificationItem = {
                    id: Date.now().toString(),
                    title: parsedData.title || t('New Notification'),
                    body: parsedData.body || '',
                    createdAt: new Date().toISOString(),
                    read: false,
                    type: notificationType,
                    data: parsedData.data || {}
                };

                // 添加到通知列表并更新统计
                setNotifications(prev => [newNotification, ...prev]);
                updateNotificationStats([newNotification, ...notifications]);

                // 自动显示此通知详情
                setSelectedNotification(newNotification);
                setModalVisible(true);
            } catch (error) {
                console.error('Failed to parse notification data:', error);
            }
        }
    }, [data]);

    // 处理从通知商店获取的通知
    useEffect(() => {
        if (notification) {
            const { title, body, data } = notification.request.content;

            // 确定通知类型
            let notificationType: NotificationType = 'general';
            if (data) {
                if (data.postId) notificationType = 'post';
                else if (data.commentId) notificationType = 'comment';
                else if (data.userId) notificationType = 'user';
            }

            // 将通知添加到通知列表
            const newNotification: NotificationItem = {
                id: Date.now().toString(),
                title: title as string || t('New Notification'),
                body: body as string || '',
                createdAt: new Date().toISOString(),
                read: false,
                type: notificationType,
                data: data as NotificationData || {}
            };

            const updatedNotifications = [newNotification, ...notifications];
            setNotifications(updatedNotifications);
            updateNotificationStats(updatedNotifications);

            // 清除通知商店中的当前通知
            clearNotification();
        }
    }, [notification]);

    // 刷新通知列表
    const handleRefresh = async (): Promise<void> => {
        setRefreshing(true);
        // 这里应有获取最新通知的网络请求
        // 模拟延迟加载
        setTimeout(() => {
            // 更新通知统计
            updateNotificationStats(notifications);
            setRefreshing(false);
        }, 1000);
    };

    // 更新通知统计信息
    const updateNotificationStats = (notificationsList: NotificationItem[]): void => {
        const now = new Date();
        const todayStart = new Date(now.setHours(0, 0, 0, 0));

        // 计算统计数据
        const stats: NotificationStats = {
            total: notificationsList.length,
            unread: notificationsList.filter(n => !n.read).length,
            today: notificationsList.filter(n => new Date(n.createdAt) >= todayStart).length
        };

        setNotificationStats(stats);
    };

    // 处理通知点击事件
    const handleNoticePress = async (item: NotificationItem): Promise<void> => {
        // 显示通知详情
        setSelectedNotification(item);
        setModalVisible(true);

        // 如果未读，标记为已读
        if (!item.read) {
            const updatedNotifications = notifications.map(n =>
                n.id === item.id ? { ...n, read: true } : n
            );
            setNotifications(updatedNotifications);
            updateNotificationStats(updatedNotifications);
        }
    };

    // 从详情跳转到相关内容
    const navigateToContent = async (): Promise<void> => {
        if (!selectedNotification || !selectedNotification.data) return;

        setModalVisible(false);

        try {
            const { postId, commentId, userId } = selectedNotification.data;

            if (postId) {
                // 导航到帖子详情
                const post = await databases.getDocument(
                    config.databaseId,
                    config.postColletionId,
                    postId
                );

                router.push({
                    pathname: 'screens/post-details',
                    params: {
                        post: JSON.stringify(post),
                        commentId: commentId,
                    },
                });
            } else if (userId) {
                // 导航到用户资料
                router.push({
                    pathname: 'view-user/index',
                    params: { userId }
                });
            }
        } catch (error) {
            console.error('Navigation error:', error);
            Alert.alert(t('Error'), t('Could not navigate to content'));
        }
    };

    // 发送测试通知
    const sendTestNotification = async (): Promise<void> => {
        try {
            await schedulePushNotification();
            Alert.alert(
                t('Success'),
                t('Test notification sent. You should receive it shortly.'),
                [{ text: t('OK'), onPress: () => console.log('OK Pressed') }]
            );
        } catch (error) {
            Alert.alert(
                t('Error'),
                t('Failed to send test notification.'),
                [{ text: t('OK'), onPress: () => console.log('OK Pressed') }]
            );
            console.error('Failed to send test notification:', error);
        }
    };

    // 标记所有通知为已读
    const markAllAsRead = (): void => {
        if (notifications.some(n => !n.read)) {
            const updatedNotifications = notifications.map(n => ({ ...n, read: true }));
            setNotifications(updatedNotifications);
            updateNotificationStats(updatedNotifications);
            Alert.alert(t('Success'), t('All notifications marked as read'));
        }
    };

    // 清空所有通知
    const clearAllNotifications = (): void => {
        Alert.alert(
            t('Clear All Notifications'),
            t('Are you sure you want to delete all notifications?'),
            [
                { text: t('Cancel'), style: 'cancel' },
                {
                    text: t('Clear All'),
                    style: 'destructive',
                    onPress: () => {
                        setNotifications([]);
                        updateNotificationStats([]);
                    }
                }
            ]
        );
    };

    // 格式化时间
    const formatTime = (dateString: string): string => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return t('Just now');
        if (diffMins < 60) return `${diffMins} ${t('minutes ago')}`;
        if (diffHours < 24) return `${diffHours} ${t('hours ago')}`;
        if (diffDays < 7) return `${diffDays} ${t('days ago')}`;

        return date.toLocaleDateString();
    };

    // 渲染单个通知项
    const renderNotificationItem: ListRenderItem<NotificationItem> = ({ item }) => (
        <NotificationItemComponent
            item={item}
            onPress={handleNoticePress}
            formatTime={formatTime}
        />
    );

    return (
        <GestureHandlerRootView
            className="bg-primary h-full"
            style={{ marginTop: insetTop }}
        >
            <Animated.View style={{ opacity: fadeAnim }}>
                {/* 页面顶部 */}
                <LinearGradient
                    colors={['#FF9800', '#FFA726', '#FFB74D']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    className="pb-4 pt-2"
                >
                    <View className="flex-row justify-between items-center px-4">
                        <Text className="text-white text-xl font-psemibold">
                            {t("Notifications")}
                        </Text>
                        <View className="flex-row">
                            <TouchableOpacity
                                onPress={markAllAsRead}
                                className="mr-4 bg-white/20 rounded-full p-2"
                            >
                                <Ionicons name="checkmark-done-outline" size={20} color="#fff" />
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={sendTestNotification}
                                className="mr-4 bg-white/20 rounded-full p-2"
                            >
                                <Ionicons name="notifications-outline" size={20} color="#fff" />
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={clearAllNotifications}
                                className="bg-white/20 rounded-full p-2"
                            >
                                <Ionicons name="trash-outline" size={20} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* 通知统计 */}
                    <View className="flex-row justify-between px-5 mt-3">
                        <View className="items-center">
                            <Text className="text-white font-psemibold text-base">
                                {notificationStats.total}
                            </Text>
                            <Text className="text-white/80 text-xs">
                                {t('Total')}
                            </Text>
                        </View>
                        <View className="items-center">
                            <Text className="text-white font-psemibold text-base">
                                {notificationStats.unread}
                            </Text>
                            <Text className="text-white/80 text-xs">
                                {t('Unread')}
                            </Text>
                        </View>
                        <View className="items-center">
                            <Text className="text-white font-psemibold text-base">
                                {notificationStats.today}
                            </Text>
                            <Text className="text-white/80 text-xs">
                                {t('Today')}
                            </Text>
                        </View>
                        {user && (
                            <View className="items-center">
                                <Text className="text-white font-psemibold text-base">
                                    {user.username?.charAt(0) || '?'}
                                </Text>
                                <Text className="text-white/80 text-xs">
                                    {t('My Account')}
                                </Text>
                            </View>
                        )}
                    </View>
                </LinearGradient>

                {/* 通知列表 */}
                <FlatList<NotificationItem>
                    data={notifications}
                    keyExtractor={(item) => item.id}
                    renderItem={renderNotificationItem}
                    contentContainerStyle={{ padding: 16 }}
                    showsVerticalScrollIndicator={false}
                    directionalLockEnabled={true}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={handleRefresh}
                            colors={['#FFA726']}
                            tintColor={'#FFA726'}
                        />
                    }
                    ListEmptyComponent={() => (
                        <View className="items-center justify-center mt-10">
                            <Image
                                source={images.empty}
                                className="w-[200px] h-[150px]"
                                resizeMode="contain"
                            />
                            <Text className="mt-4 text-gray-500 font-psemibold text-base text-center">
                                {t("No Notifications Yet")}
                            </Text>
                            <Text className="mt-2 text-gray-400 text-sm text-center">
                                {t("We'll notify you when something important happens")}
                            </Text>
                        </View>
                    )}
                />

                {/* 通知详情模态框 */}
                <NotificationModal
                    visible={modalVisible}
                    onClose={() => setModalVisible(false)}
                    notification={selectedNotification}
                    onNavigateToContent={navigateToContent}
                    formatTime={formatTime}
                />
            </Animated.View>
        </GestureHandlerRootView>
    );
}

export default NoticeScreen; 