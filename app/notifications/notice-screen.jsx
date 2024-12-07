import { Text, View, Button, FlatList } from 'react-native';
import { schedulePushNotification } from '../../functions/notifications';
import { SafeAreaView } from 'react-native-safe-area-context';
import NoticeItem from '../../components/NoticeItem';
import { useEffect, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import * as ScreenOrientation from 'expo-screen-orientation';

function NoticeScreen() {
  const { data } = useLocalSearchParams();
  const [notificationsData, setNotificationsData] = useState(null);

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

  const handlePress = () => {
    console.log('Notification clicked');
    // 在这里处理点击通知后的逻辑
  };

  return (
    <SafeAreaView>
      <NoticeItem
        title={notificationsData?.title || 'Do not have message'}
        content={notificationsData?.body || 'No message'}
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
