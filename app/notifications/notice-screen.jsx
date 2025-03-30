import { schedulePushNotification } from '../../functions/notifications';
import { SafeAreaView } from 'react-native-safe-area-context';
import NoticeItem from '../../components/NoticeItem';
import { useEffect, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import * as ScreenOrientation from 'expo-screen-orientation';
import { config, databases } from '../../services/postsService';
import { useTranslation } from 'react-i18next';
import { Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

function NoticeScreen() {
  const { data } = useLocalSearchParams();
  const [notificationsData, setNotificationsData] = useState(null);
  const { t } = useTranslation();

  useEffect(() => {
    const lockPortrait = async () => {
      try {
        await ScreenOrientation.lockAsync(
          ScreenOrientation.OrientationLock.PORTRAIT_UP
        );
      } catch (error) {
        console.error('Failed to lock orientation:', error);
      }
    };

    lockPortrait();
  }, []);

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
    const { userId, postId, commentId } = notificationsData.data;

    // 获取帖子信息
    const post = await databases.getDocument(
      config.databaseId,
      config.postColletionId, // 确保使用正确的集合 ID
      postId
    );

    router.push({
      pathname: 'post-details', // 跳转到帖子详情页面
      params: {
        post: JSON.stringify(post), // 将帖子数据传递给详情页面
        commentId: commentId,
      },
    });
  };

  return (
    <SafeAreaView>
      {/* 返回按钮和标题 */}
      <TouchableOpacity onPress={() => router.back()}
        className='absolute top-16 left-5 z-10'
      >
        <Ionicons name="arrow-back" size={24} color="black" />
      </TouchableOpacity>
      <View className='items-center mt-3'>
        <Text className='text-2xl font-bold'>{t('Notifications')}</Text>
      </View>

      <NoticeItem
        title={
          notificationsData?.title
            ? t(notificationsData.title, { defaultValue: notificationsData.title })
            : t('Do not have message')
        }
        content={notificationsData?.body || t('No message')}
        onPress={notificationsData ? handlePress : null}
      />
    </SafeAreaView>
  );
}

export default NoticeScreen;

// example
// <View
//   style={{
//     flex: 1,
//     alignItems: 'center',
//     justifyContent: 'space-around',
//   }}>
//   <Text>Your expo push token: {expoPushToken}</Text>
//   <Text>{`Channels: ${JSON.stringify(
//     channels.map(c => c.id),
//     null,
//     2
//   )}`}</Text>
//   <View style={{ alignItems: 'center', justifyContent: 'center' }}>
//     <Text>Title: {notification && notification.request.content.title} </Text>
//     <Text>Body: {notification && notification.request.content.body}</Text>
//     <Text>Data: {notification && JSON.stringify(notification.request.content.data)}</Text>
//   </View>
//   <Button
//     title="Press to schedule a notification"
//     onPress={async () => {
//       await schedulePushNotification();
//     }}
//   />
// </View>
