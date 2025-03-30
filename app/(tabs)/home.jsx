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
} from "react-native";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { images } from "../../constants";
import SearchInput from "../../components/SearchInput";
import Trending from "../../components/Trending";
import EmptyState from "../../components/EmptyState";
import CustomButton from "../../components/CustomButton";
import VideoCard from "../../components/VideoCard";
import useGetData from "../../hooks/useGetData";
import downIcon from "../../assets/icons/down.png";
import { useGlobalContext, useTabContext } from "../../context/GlobalProvider";
import { StatusBar } from "expo-status-bar";
import { updateSavedVideo } from "../../lib/appwrite";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { fetchAdminData } from "../../lib/appwrite";
import VideoLoadingSkeleton from "../../components/loading-view/VideoLoadingSkeleton";
import { router, usePathname } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { useFocusEffect, useIsFocused, useNavigation } from "@react-navigation/native";
import { deleteVideoDoc, deleteVideoFiles } from "../../lib/appwrite";
import { updateSavedCounts, getVideoDetails } from "../../lib/appwrite";
import star from "../../assets/menu/star-solid.png";
import starThree from "../../assets/menu/star3.png";
import trash from "../../assets/menu/trash-solid.png";
import Toast from "react-native-root-toast";
import closeIcon from "../../assets/icons/close.png";
import { getPostsWithPagination } from "../../services/videoService";
import { Ionicons } from "@expo/vector-icons";

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

  return (
    <GestureHandlerRootView
      className="bg-primary h-full"
      style={{ marginTop: insetTop }}
    >
      <View
        className={`flex-1 bg-primary ${isFullscreen ? "w-full h-full" : "h-full"}`}
      >
        <FlatList
          ref={flatListRef}
          contentContainerStyle={{ paddingBottom: 44 }}
          data={loading ? [] : data}
          keyExtractor={(item) => item.$id}
          ListHeaderComponent={() => {
            return (
              <View className="my-6 px-4">
                <View className="flex-row justify-between items-center mt-4 h-[60px]">
                  <View className="flex-row items-center">
                    <Pressable
                      onPress={() => navigation.openDrawer()}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      className="mr-3"
                    >
                      <Ionicons name="menu-outline" size={28} color="#808080" />
                    </Pressable>
                    <View className="ml-4">
                      <Text className="text-[#808080] text-lg">
                        {t("Welcome Back")}
                      </Text>
                      <Text className="text-[#FF6B6B] text-2xl font-psemibold ">
                        {user?.username}
                      </Text>
                    </View>
                  </View>
                  <Image
                    source={images.logoSmall}
                    className="w-9 h-10"
                    resizeMode="contain"
                  />
                </View>

                <SearchInput containerStyle={"mt-6"} />

                <View className="mt-8">
                  <Text className=" mb-8 font-psemibold text-lg text-[#FFB300] text-center">
                    {t("Top  Hits")}
                  </Text>
                  {/* 头部视频 */}
                  {popularData.length === 0 && !loading ? (
                    <View className="items-center">
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
                    <Trending video={popularData} loading={loading} />
                  )}
                </View>
                <View className="flex-row items-center justify-center mt-10 mb-4">
                  <Image
                    source={downIcon}
                    resizeMode="contain"
                    className="w-6 h-6"
                  />
                  <Text className="text-[#FFB300]  font-psemibold text-lg text-center mx-12">
                    {t("Latest")}
                  </Text>
                  <Image
                    source={downIcon}
                    resizeMode="contain"
                    className="w-6 h-6"
                  />
                </View>
              </View>
            );
          }}
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
          onEndReachedThreshold={0.5}
          ListFooterComponent={() => {
            return isLoadingMore ? (
              <View className="items-center justify-center my-4">
                <ActivityIndicator size="large" color="#FFB300" />
              </View>
            ) : null;
          }}
        />
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
