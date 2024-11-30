//cSpell:words psemibold appwrite
import { View, Text, FlatList, Image, RefreshControl, Platform } from 'react-native'
import { useEffect, useRef, useState } from 'react'
import { images } from '../../constants'
import SearchInput from '../../components/SearchInput'
import Trending from "../../components/Trending"
import EmptyState from '../../components/EmptyState'
import CustomButton from '../../components/CustomButton'
import VideoCard from '../../components/VideoCard'
import useGetData from '../../hooks/useGetData'
import downIcon from '../../assets/icons/down.png'
import { useGlobalContext } from '../../context/GlobalProvider'
import { StatusBar } from 'expo-status-bar'
import { updateSavedVideo } from '../../lib/appwrite'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import { fetchAdminData } from '../../lib/appwrite'
import VideoLoadingSkeleton from '../../components/loading-view/VideoLoadingSkeleton'
import * as Notifications from 'expo-notifications';
import { registerForPushNotificationsAsync } from '../../functions/notifications';
import { router } from 'expo-router'
import { updateUserInfo } from '../../services/userService'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function Home() {
  const insetTop = useSafeAreaInsets().top;
  const { t } = useTranslation();
  const { user } = useGlobalContext();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [adminList, setAdminList] = useState([]);
  const [popularData, setPopularData] = useState([]);
  const { fetchPosts, fetchPopularPosts } = useGetData({ setLoading, setData, setPopularData });

  const [expoPushToken, setExpoPushToken] = useState('');
  const [channels, setChannels] = useState([]);
  const [notification, setNotification] = useState(undefined);
  const notificationListener = useRef();
  const responseListener = useRef();

  useEffect(() => {
    registerForPushNotificationsAsync().then(token => token && setExpoPushToken(token));

    if (Platform.OS === 'android') {
      Notifications.getNotificationChannelsAsync().then(value => setChannels(value ?? []));
    }
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      setNotification(notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log(response);
      setTimeout(() => {
        // router.push('/(tabs)/create');
        router.push('/notifications/notice-screen');
      }, 500); // 延迟 500 毫秒后跳转
    });

    return () => {
      notificationListener.current &&
        Notifications.removeNotificationSubscription(notificationListener.current);
      responseListener.current &&
        Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, []);

  useEffect(() => {
    const addAdminData = async () => {
      await fetchAdminData()
        .then(data => {
          const adminArray = data.map(doc => doc.account);
          console.log('adminArray:', adminArray);
          setAdminList(adminArray);
        })
        .catch(error => {
          console.error("Error fetching admin data:", error);
        });
    }

    addAdminData();
  }, []);

  useEffect(() => {
    const fetchDataAndUpdateVideo = async () => {
      if (!user) return; // 如果 user 不存在，直接返回

      setLoading(true); // 开始加载

      try {
        // 获取用户信息，更新收藏视频
        const favorite = user.favorite || []; // 确保 favorite 至少是一个空数组
        await updateSavedVideo(user?.$id, { favorite });

        // 并行请求 fetchPosts 和 fetchPopularPosts
        await Promise.all([fetchPosts(), fetchPopularPosts()]);

      } catch (error) {
        console.error(error);  // 处理错误
      } finally {
        setLoading(false);  // 请求完成后设置 loading 为 false
      }
    };

    fetchDataAndUpdateVideo();  // 调用异步函数 	
  }, [user?.$id]);

  useEffect(() => {
    const updatePushToken = async () => {
      if (user && expoPushToken) {
        console.log('expoPushToken:', expoPushToken);
        const content = { expo_push_token: expoPushToken };

        try {
          const result = await updateUserInfo(user.$id, content);
          if (result) console.log('Update expo push token successful');
        } catch (error) {
          console.error('Error updating user info:', error);
        }
      }
    };

    updatePushToken();
  }, [user, expoPushToken]);

  const toggleFullscreen = (fullscreen) => {
    setIsFullscreen(fullscreen);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchPosts();
    fetchPopularPosts();
    setRefreshing(false);
    console.log('user.favorite:', user?.favorite);
  }

  const [isFullscreen, setIsFullscreen] = useState(false);

  return (
    <View className="bg-primary h-full" style={{ marginTop: insetTop }}>
      <View className={`flex-1 bg-primary ${isFullscreen ? 'w-full h-full' : 'h-full'}`}>
        <StatusBar style='auto' />
        <FlatList
          contentContainerStyle={{ paddingBottom: 40 }}
          data={loading ? [] : data}
          keyExtractor={(item) => item.$id}
          ListHeaderComponent={() => {
            return (
              <View className='my-6 px-4'>

                <View className='flex-row justify-between items-center mt-4 h-[60px]'>
                  <View >
                    <Text className='text-[#808080] text-lg'>{t('Welcome Back')}</Text>
                    <Text className='text-[#FF6B6B] text-2xl font-psemibold '>{user?.username}</Text>
                  </View>
                  <Image
                    source={images.logoSmall}
                    className='w-9 h-10'
                    resizeMode='contain'
                  />
                </View>

                <SearchInput containerStyle={'mt-6'} />

                <View className='mt-8'>
                  <Text className=' mb-8 font-psemibold text-lg text-[#FFB300] text-center'>{t('Top  Hits')}</Text>
                  {/* 头部视频 */}
                  {popularData.length === 0 ? (
                    <View className='items-center'>
                      <Image
                        source={images.empty}
                        className='w-[75px] h-[60px]'
                        resizeMode='contain'
                      />
                      <Text className='text-sky-300 text-center font-psemibold'>
                        {t("Play the video to help it")} {'\n'}{t('become a popular one !')}
                      </Text>
                    </View>
                  ) : (
                    <Trending video={popularData} loading={loading} />
                  )}

                </View>
                <View className='flex-row items-center justify-center mt-10'>
                  <Image
                    source={downIcon}
                    resizeMode='contain'
                    className='w-6 h-6'
                  />
                  <Text className='text-[#FFB300]  font-psemibold text-lg text-center mx-12'>
                    {t("Latest")}
                  </Text>
                  <Image
                    source={downIcon}
                    resizeMode='contain'
                    className='w-6 h-6'
                  />
                </View>
              </View>
            );
          }}

          renderItem={({ item }) => {
            return (
              <VideoCard post={item} handleRefresh={handleRefresh} isFullscreen={isFullscreen}
                toggleFullscreen={toggleFullscreen} adminList={adminList}
              />
            )
          }}
          ListEmptyComponent={() => {
            return loading ? (
              <>
                <VideoLoadingSkeleton />
                <VideoLoadingSkeleton />
                <VideoLoadingSkeleton />
              </>
            ) : (
              <View>
                <EmptyState />
                <CustomButton
                  title={'Create Video'}
                  textStyle={'text-black'}
                  style={'h-16 my-5 mx-4'}
                  onPress={() => router.push('/create')}
                />
              </View>
            );
          }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        />
      </View>
    </View>
  )
}