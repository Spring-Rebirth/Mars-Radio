import {
  View,
  Text,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Pressable,
  ImageBackground,
  Dimensions,
  StyleSheet,
  Share,
} from "react-native";
import React, { useEffect, useState, useRef } from "react";
import useGetData from "../../hooks/useGetData";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useGlobalContext } from "../../context/GlobalProvider";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { getCurrentUser } from "../../lib/appwrite";
import { useTranslation } from "react-i18next";
import notifyIcon from "../../assets/menu/notify.png";
import { useAuth } from "@clerk/clerk-expo";
import {
  GestureHandlerRootView,
  PanGestureHandler,
} from "react-native-gesture-handler";
import { Animated } from "react-native";
import ImageModal from "../../components/modal/ImageModal";
import { Ionicons } from '@expo/vector-icons';
import Swiper from 'react-native-swiper';
import UserTab from "../../components/UserTab";
import SavedTab from "../../components/SavedTab";
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

export default function Profile() {
  const insetTop = useSafeAreaInsets().top;
  const { userId } = useAuth();
  const [userPostsData, setUserPostsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const { fetchUserPosts } = useGetData({ setLoading, setUserPostsData });
  const { user, setUser } = useGlobalContext();
  const [refreshing, setRefreshing] = useState(false);
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState(0);
  const [isImageModalVisible, setIsImageModalVisible] = useState(false);
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const navigation = useNavigation();

  const translateX = useRef(new Animated.Value(0)).current;

  const onGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: translateX } }],
    { useNativeDriver: false }
  );

  const onHandlerStateChange = (event) => {
    if (event.nativeEvent.translationX > 50) {
      setIsDrawerVisible(true);
    } else if (event.nativeEvent.translationX < -50 && isDrawerVisible) {
      setIsDrawerVisible(false);
    }
  };

  useEffect(() => {
    setLoading(true);

    if (user?.$id) {
      fetchUserPosts(user.$id).finally(() => {
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [user?.$id, user?.avatar]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchUserPosts(user?.$id);

    if (userId) {
      await getCurrentUser(userId)
        .then((res) => setUser(res))
        .catch((error) => {
          console.error("getCurrentUser() failed:", error);
        });
    }

    setRefreshing(false);
  };

  // 添加分享个人主页的函数
  const shareProfile = async () => {
    try {
      const result = await Share.share({
        message: `查看${user?.username || '用户'}的个人主页 | Mars Radio`,
        url: `https://mars-radio.app/user/${user?.$id}`,
        title: `${user?.username || '用户'}的个人主页`,
      });

      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          // 分享成功并且有活动类型
          console.log('Shared with activity type of: ', result.activityType);
        } else {
          // 分享成功
          console.log('Shared successfully');
        }
      } else if (result.action === Share.dismissedAction) {
        // 用户取消分享
        console.log('Share dismissed');
      }
    } catch (error) {
      Alert.alert('分享失败', error.message);
    }
  };

  return (
    <GestureHandlerRootView
      className="bg-primary h-full"
      style={{ marginTop: insetTop }}
    >
      <PanGestureHandler
        onGestureEvent={onGestureEvent}
        onHandlerStateChange={onHandlerStateChange}
        activeOffsetX={[-10, 10]} // 仅响应水平滑动
      >
        <Animated.View style={{ flex: 1 }}>
          {/* 个人资料头部 */}
          <View className="relative">
            {/* 背景部分 */}
            <LinearGradient
              colors={['#FFB800', '#FF6B6B', '#FFA001']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                height: 120,
                width: width,
                position: 'absolute',
                top: 0,
                borderBottomLeftRadius: 25,
                borderBottomRightRadius: 25,
              }}
            />

            {/* 顶部工具栏 */}
            <View className="flex-row justify-between items-center px-4 pt-2">
              <TouchableOpacity
                onPress={() => navigation.openDrawer()}
                className="w-10 h-10 bg-white/20 rounded-full items-center justify-center"
              >
                <Ionicons name="menu-outline" size={22} color="#fff" />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={shareProfile}
                className="w-10 h-10 bg-white/20 rounded-full items-center justify-center"
              >
                <Ionicons name="share-social-outline" size={20} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* 个人信息卡片 */}
            <View className="mx-4 bg-white rounded-2xl p-5 mt-4 shadow-md">
              <View className="flex-row">
                {/* 头像 */}
                <View className="w-[80px] h-[80px] border-2 border-secondary rounded-full overflow-hidden mr-4">
                  <Image
                    source={{ uri: user?.avatar }}
                    className="w-full h-full"
                    resizeMode="cover"
                  />
                </View>

                {/* 用户信息和统计 */}
                <View className="flex-1 justify-center">
                  <Text className="text-black text-xl font-psemibold">
                    {user?.username}
                  </Text>
                  <Text className="text-[#999999] text-sm font-pregular">
                    {"#" + user?.email?.split("@")[0]}
                  </Text>

                  {/* 统计数据 */}
                  <View className="flex-row mt-3 justify-between pr-4">
                    <View className="items-center">
                      <Text className="text-black font-psemibold">{userPostsData?.length || 0}</Text>
                      <Text className="text-gray-500 text-xs">{t('Videos')}</Text>
                    </View>
                    <View className="items-center">
                      <Text className="text-black font-psemibold">{user?.favorite?.length || 0}</Text>
                      <Text className="text-gray-500 text-xs">{t('Saved')}</Text>
                    </View>
                    <View className="items-center">
                      <Text className="text-black font-psemibold">0</Text>
                      <Text className="text-gray-500 text-xs">{t('Following')}</Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>

            {/* 标签页导航 */}
            <View className="flex-row border-b border-gray-200 mx-4 mt-4">
              <TouchableOpacity
                className={`flex-1 pb-2 ${activeTab === 0 ? 'border-b-2 border-secondary' : ''}`}
                onPress={() => setActiveTab(0)}
              >
                <Text className={`text-center font-psemibold ${activeTab === 0 ? 'text-black' : 'text-gray-500'}`}>
                  {t('My Videos')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={`flex-1 pb-2 ${activeTab === 1 ? 'border-b-2 border-secondary' : ''}`}
                onPress={() => setActiveTab(1)}
              >
                <Text className={`text-center font-psemibold ${activeTab === 1 ? 'text-black' : 'text-gray-500'}`}>
                  {t('Saved')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 内容区域 */}
          <View className="flex-1 mt-2">
            <Swiper
              index={activeTab}
              onIndexChanged={(index) => setActiveTab(index)}
              loop={false}
              showsPagination={false}
              scrollEnabled={true}
            >
              {/* 我的视频 */}
              <UserTab
                userPostsData={userPostsData}
                loading={loading}
                fetchUserPosts={fetchUserPosts}
                userId={user?.$id}
              />

              {/* 收藏视频 */}
              <SavedTab />
            </Swiper>
          </View>
        </Animated.View>
      </PanGestureHandler>

      <ImageModal
        isVisible={isImageModalVisible}
        imageSource={require("../../assets/images/ali-pay.jpg")}
        setIsVisible={setIsImageModalVisible}
      />

      <StatusBar style="light" />
    </GestureHandlerRootView>
  );
}


