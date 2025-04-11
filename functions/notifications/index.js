import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { updateUserInfo } from '../../services/userService';

async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      alert('Failed to get push token for push notification!');
      return;
    }
    // Learn more about projectId:
    // https://docs.expo.dev/push-notifications/push-notifications-setup/#configure-projectid
    // EAS projectId is used here.
    try {
      const projectId =
        Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
      if (!projectId) {
        throw new Error('Project ID not found');
      }
      token = (
        await Notifications.getExpoPushTokenAsync({
          projectId,
        })
      ).data;
      console.log('token :', token);
      return token;
    } catch (e) {
      token = `${e}`;
    }
  } else {
    alert('Must use physical device for Push Notifications');
  }
}

async function schedulePushNotification(type = 'welcome', customData = {}) {
  let notificationContent = {
    title: "欢迎使用 Mars Radio!",
    body: "感谢您使用我们的应用，探索更多功能并开始分享您的视频！",
    data: { type: 'welcome', ...customData },
  };

  // 根据不同类型设置不同内容
  switch (type) {
    case 'post':
      notificationContent = {
        title: "有人发布了新内容",
        body: "点击查看刚发布的新内容",
        data: {
          type: 'post',
          postId: customData.postId || '123456789',
          ...customData
        },
      };
      break;
    case 'comment':
      notificationContent = {
        title: "收到新评论",
        body: "有人评论了您的内容，点击查看",
        data: {
          type: 'comment',
          postId: customData.postId || '123456789',
          commentId: customData.commentId || '987654321',
          ...customData
        },
      };
      break;
    case 'like':
      notificationContent = {
        title: "获得了新赞",
        body: "您的内容收到了新的点赞，太棒了！",
        data: {
          type: 'like',
          postId: customData.postId || '123456789',
          ...customData
        },
      };
      break;
    case 'follow':
      notificationContent = {
        title: "有新粉丝关注了您",
        body: "点击查看是谁关注了您",
        data: {
          type: 'user',
          userId: customData.userId || '123456789',
          ...customData
        },
      };
      break;
    default:
      // 使用默认欢迎消息
      break;
  }

  await Notifications.scheduleNotificationAsync({
    content: notificationContent,
    trigger: { seconds: 2 },
  });
}

// 发送推送通知的函数
async function sendPushNotification(expoPushToken, title, body, data) {
  const message = {
    to: expoPushToken,
    sound: 'default',
    title: title,
    body: body,
    data: data,
  };

  try {
    // 使用 Expo Push API 发送通知
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
}

async function updatePushToken(user, expoPushToken) {
  registerForPushNotificationsAsync().then(async (token) => {
    if (token) {
      if (user) {
        if (user.expo_push_token === token) return;
        const content = { expo_push_token: token };

        try {
          console.log('进入向数据库发送token代码');
          const result = await updateUserInfo(user.$id, content);
          if (result) console.log('Update expo push token successful');
        } catch (error) {
          console.error('Error updating user info:', error);
        }

      }
    }
  });
}

export { registerForPushNotificationsAsync, schedulePushNotification, sendPushNotification, updatePushToken };