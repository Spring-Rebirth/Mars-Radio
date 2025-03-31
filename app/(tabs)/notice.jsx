import { schedulePushNotification } from '../../functions/notifications';
import { SafeAreaView } from 'react-native-safe-area-context';
import NoticeItem from '../../components/NoticeItem';
import { useEffect, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import * as ScreenOrientation from 'expo-screen-orientation';
import { config, databases } from '../../services/postsService';
import { useTranslation } from 'react-i18next';
import { Text, View, FlatList, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { images } from '../../constants';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

function NoticeScreen() {
    const { data } = useLocalSearchParams();
    const [notificationsData, setNotificationsData] = useState(null);
    const { t } = useTranslation();
    const insetTop = useSafeAreaInsets().top;

    useEffect(() => {
        if (data) {
            try {
                const parsedData = JSON.parse(data);
                setNotificationsData(parsedData);
                console.log('notificationsData:', parsedData);
            } catch (error) {
                console.error('Failed to parse notification data:', error);
                setNotificationsData(null);
            }
        }
    }, [data]);

    const handlePress = async () => {
        console.log('Notification clicked', notificationsData);
        // 在这里处理点击通知后的逻辑
        if (!notificationsData || !notificationsData.data) return;

        const { userId, postId, commentId } = notificationsData.data;

        if (!postId) return;

        // 获取帖子信息
        try {
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
        } catch (error) {
            console.error('Failed to get post details', error);
        }
    };

    return (
        <GestureHandlerRootView
            className="bg-primary h-full"
            style={{ marginTop: insetTop }}
        >
            <FlatList
                data={[]}
                directionalLockEnabled={true}
                ListHeaderComponent={() => {
                    return (
                        <View className="my-6 px-4">
                            <View className="flex-row justify-between items-center mt-4 h-[60px]">
                                <View>
                                    <Text className="text-black text-2xl font-psemibold">
                                        {t("Notifications")}
                                    </Text>
                                </View>
                                <Image
                                    source={images.logoSmall}
                                    className="w-9 h-10"
                                    resizeMode="contain"
                                />
                            </View>

                            {notificationsData ? (
                                <NoticeItem
                                    title={
                                        notificationsData?.title
                                            ? t(notificationsData.title, { defaultValue: notificationsData.title })
                                            : t('Do not have message')
                                    }
                                    content={notificationsData?.body || t('No message')}
                                    onPress={handlePress}
                                />
                            ) : (
                                <View className="items-center mt-10">
                                    <Image
                                        source={images.empty}
                                        className="w-[270px] h-[215px]"
                                        resizeMode="contain"
                                    />
                                    <Text className="mt-2 text-black font-psemibold text-xl">
                                        {t("No Notifications")}
                                    </Text>
                                </View>
                            )}
                        </View>
                    );
                }}
                renderItem={() => null}
            />
        </GestureHandlerRootView>
    );
}

export default NoticeScreen; 