import {
  View,
  Text,
  FlatList,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Pressable,
  StyleSheet,
} from "react-native";
import React, { useEffect, useState, useRef } from "react";
import useGetData from "../../hooks/useGetData";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useGlobalContext } from "../../context/GlobalProvider";
import EmptyState from "../../components/EmptyState";
import CustomButton from "../../components/CustomButton";
import VideoCard from "../../components/VideoCard";
import { router, useFocusEffect } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { getCurrentUser } from "../../lib/appwrite";
import settingIcon from "../../assets/menu/setting.png";
import { useTranslation } from "react-i18next";
import notifyIcon from "../../assets/menu/notify.png";
import editIcon from "../../assets/icons/edit.png";
import { useAuth } from "@clerk/clerk-expo";
import {
  GestureHandlerRootView,
  PanGestureHandler,
} from "react-native-gesture-handler";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import Toast from "react-native-root-toast";
import { getVideoDetails } from "../../lib/appwrite";
import trash from "../../assets/menu/trash-solid.png";
import closeIcon from "../../assets/icons/close.png";
import { deleteVideoDoc, deleteVideoFiles } from "../../lib/appwrite";
import backIcon from "../../assets/icons/left-arrow.png";
import arrowRightIcon from "../../assets/icons/arrow-one.png";
import { Animated } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import ImageModal from "../../components/modal/ImageModal";

export default function Profile() {
  const insetTop = useSafeAreaInsets().top;
  const { userId } = useAuth();
  const [userPostsData, setUserPostsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const { fetchUserPosts } = useGetData({ setLoading, setUserPostsData });
  const { user, setUser, setIsLoggedIn, handleLogout } = useGlobalContext();
  const [refreshing, setRefreshing] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const { t, i18n } = useTranslation();
  const bottomSheetRef = useRef(null);
  const flatListRef = useRef(null);
  const [showControlMenu, setShowControlMenu] = useState(false);
  const [selectedVideoId, setSelectedVideoId] = useState(null);
  const [isImageModalVisible, setIsImageModalVisible] = useState(false);
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [viewLevel, setViewLevel] = useState(1); // 控制当前视图层级

  const translateX = useRef(new Animated.Value(0)).current;

  const onGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: translateX } }],
    { useNativeDriver: false }
  );

  const [switchLangResult, setSwitchLangResult] = useState("");

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

  useEffect(() => {
    if (showControlMenu) {
      bottomSheetRef.current?.expand();
    } else {
      bottomSheetRef.current?.close();
    }
  }, [showControlMenu]);

  useFocusEffect(
    React.useCallback(() => {
      goToPreviousLevel();

      return () => {
        bottomSheetRef.current?.close();
      };
    }, [])
  );

  const changeLanguage = async (lang) => {
    try {
      await i18n.changeLanguage(lang);
      await AsyncStorage.setItem("language", lang);
      const newLangText = lang === "en" ? "English" : "中文";
      setSwitchLangResult(t("Selected language") + " " + newLangText);
    } catch (error) {
      setSwitchLangResult(t("Failed to switch language"));
      console.error("Failed to switch language:", error);
    } finally {
      setSwitchLangResult("");
    }
  };

  const goToNextLevel = () => {
    setViewLevel(2); // 切换到二级视图
  };

  const goToPreviousLevel = () => {
    setViewLevel(1); // 切换回一级视图
  };

  const handleSignOut = async () => {
    try {
      setIsTransitioning(true); // 设置跳转状态，防止渲染未准备好的页面

      await handleLogout();

      // 更新状态
      setUser(null);
      setIsLoggedIn(false);
    } catch (error) {
      console.error("Sign out failed:", error);
      Alert.alert("Error", "Failed to sign out. Please try again.");
      setIsTransitioning(false); // 如果出错，重置跳转状态
    }
  };

  const handleDelete = async () => {
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
        Toast.show("Delete Success", {
          duration: Toast.durations.SHORT,
          position: Toast.positions.CENTER,
        });
        handleRefresh && handleRefresh();
      } else {
        Alert.alert("Delete Failed, File ID not found");
      }
    } catch (error) {
      console.error("删除出错:", error);
    }
  };

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

  if (isTransitioning) {
    return (
      <View className="flex-1 justify-center items-center bg-primary">
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView
      className="bg-primary h-full"
      style={{ marginTop: insetTop }}
    >
      <PanGestureHandler
        onGestureEvent={onGestureEvent}
        onHandlerStateChange={onHandlerStateChange}
        activeOffsetX={[-10, 10]} // 仅响应水平滑动
        simultaneousHandlers={flatListRef}
      >
        <Animated.View style={{ flex: 1 }}>
          <View style={{ marginTop: 28 }}>
            <FlatList
              ref={flatListRef}
              data={loading ? [] : userPostsData}
              // item 是 data 数组中的每一项
              keyExtractor={(item) => item?.$id}
              contentContainerStyle={{ paddingBottom: 44 }}
              ListHeaderComponent={() => {
                return (
                  <View className="mb-2 px-4 relative">
                    <View className="items-end">
                      <TouchableOpacity
                        onPress={() => {
                          router.navigate("/notifications/notice-screen");
                        }}
                      >
                        <Image
                          source={notifyIcon}
                          className="w-6 h-6"
                          resizeMode="contain"
                        />
                      </TouchableOpacity>
                    </View>
                    <View className="justify-between items-center mt-3">
                      <View className="w-[56px] h-[56px] border-2 border-secondary rounded-full overflow-hidden justify-center">
                        <Image
                          source={{ uri: user?.avatar }}
                          className="w-full h-full"
                          resizeMode="cover"
                        />
                      </View>

                      <Text className="text-black text-xl font-psemibold mt-2.5">
                        {user?.username}
                      </Text>
                      <Text className="text-[#999999] text-base font-psemibold">
                        {"#" + user?.email.split("@")[0]}
                      </Text>

                      <TouchableOpacity
                        onPress={() => {
                          router.navigate("/user-info");
                        }}
                        className="w-10 h-10 justify-center items-center"
                      >
                        <Image
                          source={editIcon}
                          className="w-6 h-6"
                          resizeMode="contain"
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              }}
              // renderItem 接受一个对象参数，通常解构为 { item, index, separators }
              renderItem={({ item }) => {
                return (
                  <VideoCard
                    post={item}
                    onMenuPress={(videoId) => {
                      setSelectedVideoId(videoId);
                      setShowControlMenu((prev) => !prev);
                    }}
                    handleRefresh={handleRefresh}
                  />
                );
              }}
              ListEmptyComponent={() => {
                return loading ? (
                  <View className="flex-1 justify-center items-center bg-primary">
                    <ActivityIndicator size="large" color="#000" />
                    <Text className="mt-[10] text-black text-xl">
                      {t("Loading, please wait...")}
                    </Text>
                  </View>
                ) : (
                  <View>
                    <EmptyState />
                    <CustomButton
                      title={t("Create Video")}
                      textStyle={"text-black"}
                      style={"h-16 my-5 mx-4"}
                      onPress={() => router.push("/create")}
                    />
                  </View>
                );
              }}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={handleRefresh}
                />
              }
            />
          </View>
        </Animated.View>
      </PanGestureHandler>
      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={[275]}
        enablePanDownToClose={true}
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
              onPress={handleDelete}
              className="w-full h-12 flex-row items-center"
            >
              <Image source={trash} className="w-6 h-6 mr-8" />
              <Text className="text-black text-lg">{t("Delete video")}</Text>
            </Pressable>
          </View>
        </BottomSheetView>
      </BottomSheet>

      <ImageModal
        isVisible={isImageModalVisible}
        imageSource={require("../../assets/images/ali-pay.jpg")}
        setIsVisible={setIsImageModalVisible}
      />

      <StatusBar style="dark" />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  drawerContent: {
    position: "relative",
    backgroundColor: "white",
    paddingVertical: 15,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20,
    marginTop: 50,
    textAlign: "center",
  },
});
