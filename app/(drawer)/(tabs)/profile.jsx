import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Alert,
  Dimensions,
  Share,
  Pressable,
} from "react-native";
import React, { useEffect, useState, useRef, useCallback } from "react";
import useGetData from "../../../hooks/useGetData";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useGlobalContext } from "../../../context/GlobalProvider";
import { StatusBar } from "expo-status-bar";
import { useTranslation } from "react-i18next";
import {
  GestureHandlerRootView,
  PanGestureHandler,
} from "react-native-gesture-handler";
import { Animated } from "react-native";
import ImageModal from "../../../components/modal/ImageModal";
import { Ionicons } from '@expo/vector-icons';
import Swiper from 'react-native-swiper';
import UserTab from "../../../components/UserTab";
import SavedTab from "../../../components/SavedTab";
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import BottomSheet, { BottomSheetView, BottomSheetBackdrop } from "@gorhom/bottom-sheet";
import Toast from "react-native-toast-message";
import {
  updateSavedCounts,
  updateSavedVideo,
  getVideoDetails,
  deleteVideoDoc,
  deleteVideoFiles,
} from "../../../lib/appwrite";
import star from "../../../assets/menu/star-solid.png";
import starThree from "../../../assets/menu/star3.png";
import trash from "../../../assets/menu/trash-solid.png";
import closeIcon from "../../../assets/icons/close.png";
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';

const TopTab = createMaterialTopTabNavigator();
const { width } = Dimensions.get('window');

export default function Profile() {
  const insetTop = useSafeAreaInsets().top;
  const [userPostsData, setUserPostsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const { fetchUserPosts } = useGetData({ setLoading, setUserPostsData });
  const { user, setUser } = useGlobalContext();
  const { t } = useTranslation();
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [isImageModalVisible, setIsImageModalVisible] = useState(false);
  const navigation = useNavigation();

  const bottomSheetRef = useRef(null);
  const [showControlMenu, setShowControlMenu] = useState(false);
  const [selectedVideoId, setSelectedVideoId] = useState(null);
  const [isSaved, setIsSaved] = useState(false);
  const [menuSourceTab, setMenuSourceTab] = useState('');

  const renderBackdrop = useCallback(
    props => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        pressBehavior='close'
        opacity={0.5}
      />
    ),
    []
  );

  useEffect(() => {
    if (showControlMenu) {
      bottomSheetRef.current?.expand();
    } else {
      setTimeout(() => bottomSheetRef.current?.close(), 50);
    }
  }, [showControlMenu]);

  const handleAddSaved = async () => {
    if (!user || !selectedVideoId) return;
    try {
      let isIncrement;
      const currentFavorites = user.favorite || [];
      const isCurrentlySaved = currentFavorites.includes(selectedVideoId);

      if (!isCurrentlySaved) {
        const updatedFavorites = [...currentFavorites, selectedVideoId];
        setUser(prev => ({ ...prev, favorite: updatedFavorites }));
        setIsSaved(true);
        isIncrement = true;
        Toast.show({
          text1: t("Save successful"),
          type: "success",
          topOffset: 68,
        });
        await updateSavedVideo(user.$id, { favorite: updatedFavorites });
      } else {
        const updatedFavorites = currentFavorites.filter(item => item !== selectedVideoId);
        setUser(prev => ({ ...prev, favorite: updatedFavorites }));
        setIsSaved(false);
        isIncrement = false;
        Toast.show({
          text1: t("Cancel save successfully"),
          type: "success",
          topOffset: 68,
        });
        await updateSavedVideo(user.$id, { favorite: updatedFavorites });
      }
      await updateSavedCounts(selectedVideoId, isIncrement);

    } catch (error) {
      console.error("Error handling favorite:", error);
      Alert.alert(t("Error"), t("An error occurred while updating favorite count"));
      setIsSaved(prev => !prev);
      setUser(prev => {
        const currentFavorites = prev.favorite || [];
        const isCurrentlySaved = currentFavorites.includes(selectedVideoId);
        return isCurrentlySaved ? { ...prev, favorite: currentFavorites.filter(item => item !== selectedVideoId) } : { ...prev, favorite: [...currentFavorites, selectedVideoId] };
      });
    }
  };

  const handleClickSave = () => {
    setShowControlMenu(false);
    handleAddSaved();
  };

  const handleDelete = async () => {
    if (!selectedVideoId) return;
    setShowControlMenu(false);
    try {
      const videoDetails = await getVideoDetails(selectedVideoId);
      const { image_ID, video_ID } = videoDetails;

      if (image_ID && video_ID) {
        await Promise.all([
          deleteVideoDoc(selectedVideoId),
          deleteVideoFiles(image_ID),
          deleteVideoFiles(video_ID),
        ]);
        Toast.show({
          text1: t("Delete Success"),
          type: "success",
          topOffset: 68,
        });
        if (user?.$id) {
          setLoading(true);
          fetchUserPosts(user.$id).finally(() => setLoading(false));
        }
      } else {
        Alert.alert(t("Delete Failed"), t("File ID not found"));
      }
    } catch (error) {
      console.error("删除出错:", error);
      Alert.alert(t("Error"), t("An error occurred during deletion"));
    }
  };

  const openMenu = (videoId, sourceTab) => {
    setSelectedVideoId(videoId);
    setIsSaved(user?.favorite?.includes(videoId) ?? false);
    setMenuSourceTab(sourceTab);
    setShowControlMenu(true);
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
  }, [user?.$id]);

  const shareProfile = async () => {
    try {
      const result = await Share.share({
        message: `查看${user?.username || '用户'}的个人主页 | Mars Radio`,
        url: `https://mars-radio.app/user/${user?.$id}`,
        title: `${user?.username || '用户'}的个人主页`,
      });

      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          console.log('Shared with activity type of: ', result.activityType);
        } else {
          console.log('Shared successfully');
        }
      } else if (result.action === Share.dismissedAction) {
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
      <Animated.View style={{ flex: 1 }}>
        <View className="relative">
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

          <View className="mx-4 bg-white rounded-2xl p-5 mt-4 shadow-md">
            <View className="flex-row">
              <View className="w-[80px] h-[80px] border-2 border-secondary rounded-full overflow-hidden mr-4">
                <Image
                  source={{ uri: user?.avatar }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
              </View>

              <View className="flex-1 justify-center">
                <Text className="text-black text-xl font-psemibold">
                  {user?.username}
                </Text>
                <Text className="text-[#999999] text-sm font-pregular">
                  {"#" + user?.email?.split("@")[0]}
                </Text>

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
        </View>

        <View className="flex-1 mt-4">
          <TopTab.Navigator
            initialRouteName={t('My Videos')}
            screenListeners={{
              state: (e) => {
                const currentIndex = e.data?.state?.index;
                if (typeof currentIndex === 'number') {
                  setActiveTabIndex(currentIndex);
                }
              },
            }}
            screenOptions={{
              tabBarLabelStyle: { fontSize: 14, fontFamily: 'Poppins-SemiBold', textTransform: 'none' },
              tabBarIndicatorStyle: { backgroundColor: '#FF9C01' },
              tabBarStyle: { backgroundColor: 'white', elevation: 0, shadowOpacity: 0 },
              tabBarActiveTintColor: '#000000',
              tabBarInactiveTintColor: '#CDCDE0',
              swipeEnabled: true,
            }}
          >
            <TopTab.Screen
              name={t('My Videos')}
            >
              {() => (
                <UserTab
                  userPostsData={userPostsData}
                  loading={loading}
                  fetchUserPosts={fetchUserPosts}
                  userId={user?.$id}
                  onMenuPress={(videoId) => openMenu(videoId, 'user')}
                />
              )}
            </TopTab.Screen>
            <TopTab.Screen
              name={t('Saved')}
            >
              {() => (
                <SavedTab
                  onMenuPress={(videoId) => openMenu(videoId, 'saved')}
                />
              )}
            </TopTab.Screen>
          </TopTab.Navigator>
        </View>
      </Animated.View>

      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={[275]}
        enablePanDownToClose={true}
        backdropComponent={renderBackdrop}
        handleIndicatorStyle={{ backgroundColor: '#999' }}
        backgroundStyle={{ backgroundColor: 'white' }}
        onClose={() => setShowControlMenu(false)}
      >
        <BottomSheetView>
          <View className="relative bg-white w-full h-auto rounded-md z-10 px-6 py-0 space-y-1 mx-auto">
            <Pressable
              onPress={() => setShowControlMenu(false)}
              className="z-20 items-end"
            >
              <Image
                source={closeIcon}
                className="w-6 h-6"
                resizeMode="contain"
              />
            </Pressable>

            <Pressable
              onPress={handleClickSave}
              className="w-full h-12 flex-row items-center mt-6"
            >
              <Image
                source={isSaved ? star : starThree}
                className="w-6 h-6 mr-8"
                resizeMode="contain"
              />
              <Text className="text-[#333333] text-lg">
                {isSaved ? t("Cancel save video") : t("Save video")}
              </Text>
            </Pressable>

            {menuSourceTab === 'user' && (
              <Pressable
                onPress={handleDelete}
                className="w-full h-12 flex-row items-center"
              >
                <Image
                  source={trash}
                  className="w-6 h-6 mr-8"
                  resizeMode="contain"
                />
                <Text className="text-black text-lg">{t("Delete video")}</Text>
              </Pressable>
            )}
          </View>
        </BottomSheetView>
      </BottomSheet>

      <ImageModal
        isVisible={isImageModalVisible}
        imageSource={require("../../../assets/images/ali-pay.jpg")}
        setIsVisible={setIsImageModalVisible}
      />

      <StatusBar style="dark" />
    </GestureHandlerRootView>
  );
}
