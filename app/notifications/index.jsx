import { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Button } from 'react-native';
import * as Notifications from 'expo-notifications';

const notificationsData = [
  { id: '1', title: 'Notification 1', message: 'This is the first notification' },
  { id: '2', title: 'Notification 2', message: 'This is the second notification' },
  { id: '3', title: 'Notification 3', message: 'This is the third notification' },
];

const NotificationItem = ({ title, message }) => (
  <View style={styles.notificationItem}>
    <Text style={styles.title}>{title}</Text>
    <Text style={styles.message}>{message}</Text>
  </View>
);

const NotificationScreen = () => {
  useEffect(() => {
    requestNotificationPermissions();
    setupNotificationListeners();
  }, []);

  const requestNotificationPermissions = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      alert('You need to enable notifications to use this feature');
    }
  };

  const setupNotificationListeners = () => {
    Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
    });

    Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification clicked:', response);
    });
  };

  const handleGetPushToken = async () => {
    const token = await Notifications.getExpoPushTokenAsync();
    console.log('Expo Push Token:', token.data);
    // 保存 token 以便发送推送通知
  };

  // 推送通知
  const sendPushNotification = async (expoPushToken) => {
    const message = {
      to: expoPushToken,
      sound: 'default',
      title: 'New Message',
      body: 'You have a new notification!',
      data: { extraData: 'any extra data' },
    };

    try {
      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });

      const responseJson = await response.json();
      console.log('Push notification sent:', responseJson);
    } catch (error) {
      console.error('Error sending push notification:', error);
    }
  };


  return (
    <View style={styles.container}>
      <FlatList
        data={notificationsData}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <NotificationItem title={item.title} message={item.message} />
        )}
      />

      <Button title="Get Push Token" onPress={handleGetPushToken} />

      <Button
        title="Send Push Notification"
        onPress={() => sendPushNotification('ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]')}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  notificationItem: {
    padding: 15,
    marginVertical: 8,
    backgroundColor: '#f9f9f9',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  message: {
    fontSize: 14,
    color: '#555',
  },
});

export default NotificationScreen;