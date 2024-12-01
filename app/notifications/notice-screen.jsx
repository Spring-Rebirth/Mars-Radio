import { Text, View, Button, FlatList } from 'react-native';
import { schedulePushNotification } from '../../functions/notifications';
import { SafeAreaView } from 'react-native-safe-area-context';
import NoticeItem from '../../components/NoticeItem';
import { useEffect } from 'react';
import { useLocalSearchParams } from 'expo-router';

function NoticeScreen() {
  const { data } = useLocalSearchParams();

  if (data) {
    const notificationsData = JSON.parse(data);
    console.log('notificationsData:', notificationsData);
  }

  const handlePress = () => {
    console.log('Notification clicked');
    // 在这里处理点击通知后的逻辑
  };

  return (
    <SafeAreaView>
      {data ? (
        <NoticeItem
          title={notificationsData.title}
          content={notificationsData.body}
          onPress={() => handlePress()}
        />
      ) : (
        <NoticeItem
          title={'Do not have message'}
          content={'No message'}
          onPress={() => { }}
        />
      )}

      {/* <FlatList
        data={notificationsData}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <NoticeItem
            title={item.title}
            content={item.content}
            onPress={() => handlePress(item.id)} // 传递点击事件
          />
        )}
      /> */}
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
