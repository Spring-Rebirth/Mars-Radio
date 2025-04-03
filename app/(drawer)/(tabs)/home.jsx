//cSpell:words psemibold appwrite
import {
  View,
  Text,
  FlatList,
  Image,
  RefreshControl,
  Pressable,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  Animated,
} from "react-native";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { images } from "../../../constants";
import SearchInput from "../../../components/SearchInput";
import Trending from "../../../components/Trending";
import EmptyState from "../../../components/EmptyState";
import CustomButton from "../../../components/CustomButton";
import VideoCard from "../../../components/VideoCard";
import useGetData from "../../../hooks/useGetData";
import downIcon from "../../../assets/icons/down.png";
import { useGlobalContext, useTabContext } from "../../../context/GlobalProvider";
import { StatusBar } from "expo-status-bar";
import { updateSavedVideo } from "../../../lib/appwrite";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { fetchAdminData } from "../../../lib/appwrite";
import VideoLoadingSkeleton from "../../../components/loading-view/VideoLoadingSkeleton";
import { router } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { deleteVideoDoc, deleteVideoFiles } from "../../../lib/appwrite";
import { updateSavedCounts, getVideoDetails } from "../../../lib/appwrite";
import star from "../../../assets/menu/star-solid.png";
import starThree from "../../../assets/menu/star3.png";
import trash from "../../../assets/menu/trash-solid.png";
import Toast from "react-native-root-toast";
import closeIcon from "../../../assets/icons/close.png";
import { getPostsWithPagination } from "../../../services/videoService";
import Swiper from 'react-native-swiper';
import icons from "../../../constants/icons";

export default function Home() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const bottomSheetRef = useRef(null);
  const flatListRef = useRef(null);
  const [showControlMenu, setShowControlMenu] = useState(false);
  const insetTop = useSafeAreaInsets().top;
  const { user, setUser } = useGlobalContext();
  const { tabEvents } = useTabContext();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [adminList, setAdminList] = useState([]);
  const [isVideoCreator, setIsVideoCreator] = useState(false);
  const [popularData, setPopularData] = useState([]);
  const { fetchPosts, fetchPopularPosts } = useGetData({
    setLoading,
    setData,
    setPopularData,
  });
  let admin = adminList?.includes(user?.email);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedVideoId, setSelectedVideoId] = useState(null);
  const [isSaved, setIsSaved] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const swiperRef = useRef(null);
  const prevActiveTabRef = useRef(0);
  const [showSearch, setShowSearch] = useState(false);
  const searchAnimatedValue = useRef(new Animated.Value(0)).current;

  // 滚动到顶部方法
  const scrollToTop = useCallback(() => {
    console.log("滚动到顶部 - Home");
    if (flatListRef.current) {
      flatListRef.current.scrollToOffset({ offset: 0, animated: false });
    }
  }, [flatListRef]);

  // 监听homeTab点击事件
  useEffect(() => {
    // 当homeTab事件计数器变化时，执行滚动到顶部
    if (tabEvents.homeTab > 0) {
      scrollToTop();
    }
  }, [tabEvents.homeTab, scrollToTop]);

  // 添加admin数据
  useEffect(() => {
    const addAdminData = async () => {
      await fetchAdminData()
        .then((data) => {
          const adminArray = data.map((doc) => doc.account);
          console.log("adminArray:", adminArray);
          setAdminList(adminArray);
        })
        .catch((error) => {
          console.error("Error fetching admin data:", error);
        });
    };

    addAdminData();
  }, []);

  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState(null);
  const limit = 10;

  // 分页加载视频帖子数据
  const loadPosts = async () => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    try {
      const newPosts = await getPostsWithPagination(cursor, limit);
      // 提取所有 thumbnail URL
      const imageUrls = newPosts.map(post => post.thumbnail).filter(url => url);
      // 预加载图片
      await Promise.all(imageUrls.map(url => Image.prefetch(url)));
      setData(prevPosts => [...prevPosts, ...newPosts]);
      if (newPosts.length < limit) {
        setHasMore(false);
      } else {
        const lastPost = newPosts[newPosts.length - 1];
        setCursor(lastPost.$id);
      }
    } catch (error) {
      console.error('Failed to load posts:', error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    loadPosts();
    // console.log("data:", JSON.stringify(data, null, 2));
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
        await fetchPopularPosts();
      } catch (error) {
        console.error(error); // 处理错误
      } finally {
        setLoading(false); // 请求完成后设置 loading 为 false
      }
    };

    fetchDataAndUpdateVideo(); // 调用异步函数
  }, [user?.$id]);

  useEffect(() => {
    updateSavedVideo(user?.$id, { favorite: user?.favorite });
  }, [user?.favorite]);

  useEffect(() => {
    if (showControlMenu) {
      bottomSheetRef.current?.expand();
    } else {
      bottomSheetRef.current?.close();
    }
  }, [showControlMenu]);

  useFocusEffect(
    React.useCallback(() => {
      return () => {
        bottomSheetRef.current?.close();
      };
    }, [])
  );

  const toggleFullscreen = (fullscreen) => {
    setIsFullscreen(fullscreen);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchPosts();
    fetchPopularPosts();
    setRefreshing(false);
    console.log("user.favorite:", user?.favorite);
  };

  const handleAddSaved = async () => {
    try {
      let isIncrement;

      if (!user?.favorite.includes(selectedVideoId)) {
        // 深拷贝对象
        const newUser = JSON.parse(JSON.stringify(user));
        newUser.favorite.push(selectedVideoId);
        setUser((prev) => ({
          ...prev,
          favorite: newUser.favorite,
        }));
        setIsSaved((prevIsSaved) => {
          console.log("Saving, previous isSaved:", prevIsSaved);
          return true;
        });
        isIncrement = true;
        Toast.show(t("Save successful"), {
          duration: Toast.durations.SHORT,
          position: Toast.positions.CENTER,
        });
      } else {
        // 剔除已保存项的新数组
        const updatedItems = user?.favorite.filter(
          (item) => item !== selectedVideoId
        );
        setUser((prev) => ({
          ...prev,
          favorite: updatedItems,
        }));
        setIsSaved((prevIsSaved) => {
          console.log("Removing, previous isSaved:", prevIsSaved);
          return false;
        });
        isIncrement = false;
        Toast.show(t("Cancel save successfully"), {
          duration: Toast.durations.SHORT,
          position: Toast.positions.CENTER,
        });
      }
      await updateSavedCounts(selectedVideoId, isIncrement);
    } catch (error) {
      console.error("Error handling favorite:", error);
      Alert.alert("An error occurred while updating favorite count");
    }
  };

  const handleClickSave = () => {
    console.log("Before click, isSaved:", isSaved); // Debugging
    setShowControlMenu(false);
    handleAddSaved();
  };

  const handleDelete = async () => {
    setShowControlMenu(false);

    try {
      // 假设 getVideoDetails 从数据库获取视频详细信息
      const videoDetails = await getVideoDetails(selectedVideoId);
      const { image_ID, video_ID } = videoDetails;

      if (image_ID && video_ID) {
        await Promise.all([
          deleteVideoDoc(selectedVideoId), // 删除视频文档
          deleteVideoFiles(image_ID), // 删除图片文件
          deleteVideoFiles(video_ID), // 删除视频文件
        ]);
        console.log("删除成功");
        handleRefresh();
        Toast.show(t("Delete Success"), {
          duration: Toast.durations.SHORT,
          position: Toast.positions.CENTER,
        });
      } else {
        console.log("未找到与该视频关联的文件 ID");
        Alert.alert("Delete Failed, File ID not found");
      }
    } catch (error) {
      console.error("删除过程中出错:", error);
    }
  };

  useEffect(() => {
    if (prevActiveTabRef.current !== activeTab) {
      prevActiveTabRef.current = activeTab;
      if (swiperRef.current && swiperRef.current.scrollTo) {
        swiperRef.current.scrollTo(activeTab, true);
      }
    }
  }, [activeTab]);

  // 控制搜索框的显示/隐藏
  const toggleSearchBar = () => {
    const toValue = showSearch ? 0 : 1;
    Animated.spring(searchAnimatedValue, {
      toValue,
      useNativeDriver: false,
      friction: 8,
      tension: 40
    }).start();
    setShowSearch(!showSearch);
  };

  return (
    <GestureHandlerRootView
      className="bg-primary h-full"
      style={{ marginTop: insetTop }}
    >
      <View
        className={`flex-1 bg-primary ${isFullscreen ? "w-full h-full" : "h-full"}`}
      >
        {/* 更现代的头部设计 */}
        <View className="px-4 pt-2">
          {/* 顶部栏 */}
          <View className="flex-row justify-between items-center h-[50px]">
            {/* 左侧用户头像 */}
            <TouchableOpacity
              onPress={() => navigation.openDrawer()}
              className="w-10 h-10 rounded-full justify-center items-center overflow-hidden"
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.1,
                shadowRadius: 1.5,
                elevation: 2
              }}
            >
              <Image
                source={{ uri: user?.avatar }}
                className="w-10 h-10"
                resizeMode="cover"
              />
            </TouchableOpacity>

            {/* 中间Logo */}
            <Image
              source={images.logoSmall}
              className="w-9 h-10"
              resizeMode="contain"
            />

            {/* 右侧搜索按钮 */}
            <TouchableOpacity
              onPress={toggleSearchBar}
              className="w-10 h-10 bg-white rounded-full justify-center items-center"
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.1,
                shadowRadius: 1.5,
                elevation: 2
              }}
            >
              <Image
                source={icons.search}
                className="w-5 h-5"
                resizeMode="contain"
              />
            </TouchableOpacity>
          </View>

          {/* 搜索栏 - 使用动画控制显示/隐藏 */}
          <Animated.View
            style={{
              maxHeight: searchAnimatedValue.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 80]
              }),
              opacity: searchAnimatedValue,
              transform: [{
                translateY: searchAnimatedValue.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-10, 0]
                })
              }],
              marginTop: 8,
              overflow: 'hidden'
            }}
          >
            <SearchInput containerStyle="shadow-sm" />
          </Animated.View>

          {/* 标签页导航 - 美化样式 */}
          <View className="flex-row justify-center border-b border-gray-100 mx-1 mt-6">
            <TouchableOpacity
              className={`flex-1 pb-2 ${activeTab === 0 ? 'border-b-2 border-[#FFB300]' : ''}`}
              onPress={() => {
                setActiveTab(0);
              }}
            >
              <Text className={`text-center font-psemibold text-[15px] ${activeTab === 0 ? 'text-[#FFB300]' : 'text-gray-400'}`}>
                {t("Top Hits")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`flex-1 pb-2 ${activeTab === 1 ? 'border-b-2 border-[#FFB300]' : ''}`}
              onPress={() => {
                setActiveTab(1);
              }}
            >
              <Text className={`text-center font-psemibold text-[15px] ${activeTab === 1 ? 'text-[#FFB300]' : 'text-gray-400'}`}>
                {t("Latest")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 内容区域 */}
        <View className="flex-1">
          <Swiper
            ref={swiperRef}
            index={activeTab}
            onIndexChanged={(index) => {
              if (index !== activeTab) {
                setActiveTab(index);
              }
            }}
            loop={false}
            showsPagination={false}
            scrollEnabled={false} // 禁用滑动手势
          >
            {/* 热门视频标签页 */}
            <View className="flex-1 px-4">
              {popularData.length === 0 && !loading ? (
                <View className="items-center mt-4">
                  <Image
                    source={images.empty}
                    className="w-[75px] h-[60px]"
                    resizeMode="contain"
                  />
                  <Text className="text-sky-300 text-center font-psemibold">
                    {t("Play the video to help it")} {"\n"}
                    {t("become a popular one !")}
                  </Text>
                </View>
              ) : (
                  <View className="pt-4">
                    <Trending video={popularData} loading={loading} />
                  </View>
              )}
            </View>

            {/* 最新视频标签页 */}
            <View className="flex-1">
              <FlatList
                ref={flatListRef}
                directionalLockEnabled={true}
                contentContainerStyle={{ paddingBottom: 100 }}
                data={loading ? [] : data}
                keyExtractor={(item) => item.$id}
                renderItem={({ item }) => {
                  return (
                    <VideoCard
                      post={item}
                      handleRefresh={handleRefresh}
                      isFullscreen={isFullscreen}
                      adminList={adminList}
                      toggleFullscreen={toggleFullscreen}
                      setShowControlMenu={setShowControlMenu}
                      setIsVideoCreator={setIsVideoCreator}
                      onMenuPress={(videoId) => {
                        setSelectedVideoId(videoId);
                        setIsSaved(user?.favorite.includes(videoId));
                        setShowControlMenu((prev) => !prev);
                      }}
                    />
                  );
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
                        title={"Create Video"}
                        textStyle={"text-black"}
                        style={"h-16 my-5 mx-4"}
                        onPress={() => router.push("/create")}
                      />
                    </View>
                  );
                }}
                refreshControl={
                  <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
                }
                onEndReached={loadPosts}
                onEndReachedThreshold={0.3}
                initialNumToRender={5}
                maxToRenderPerBatch={10}
                windowSize={10}
                removeClippedSubviews={true}
                ListFooterComponent={() => {
                  return isLoadingMore ? (
                    <View className="items-center justify-center my-4">
                      <ActivityIndicator size="large" color="#FFB300" />
                    </View>
                  ) : hasMore ? (
                    <View className="items-center justify-center my-4 pb-10">
                      <ActivityIndicator size="small" color="#FFB300" />
                    </View>
                  ) : (
                    <View className="items-center justify-center my-4 pb-10">
                      <Text className="text-gray-400 text-sm">{t("No more videos")}</Text>
                    </View>
                  );
                }}
              />
            </View>
          </Swiper>
        </View>
      </View>

      {/* 视频弹出菜单 */}
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
              onPress={handleClickSave}
              className="w-full h-12 flex-row items-center"
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

            {isVideoCreator || admin === true ? (
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
            ) : null}
          </View>
        </BottomSheetView>
      </BottomSheet>

      <StatusBar style="dark" />
    </GestureHandlerRootView>
  );
}
