import {
  Text,
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Pressable,
} from "react-native";
import React, { useEffect, useRef, useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { t } from "i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import useGetData from "../../hooks/useGetData";
import { StatusBar } from "expo-status-bar";
import {
  config,
  databases,
  fetchAdminData,
  getVideoDetails,
} from "../../lib/appwrite";
import EmptyState from "../../components/EmptyState";
import VideoCard from "../../components/VideoCard";
import backArrowIcon from "../../assets/icons/back-arrow.png";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import Toast from "react-native-root-toast";
import closeIcon from "../../assets/icons/close.png";
import star from "../../assets/menu/star-solid.png";
import starThree from "../../assets/menu/star3.png";
import trash from "../../assets/menu/trash-solid.png";

export default function UserProfile() {
  const insetTop = useSafeAreaInsets().top;
  const { creatorId, accountId } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [userPostsData, setUserPostsData] = useState([]);
  const { fetchUserPosts } = useGetData({ setLoading, setUserPostsData });
  const [user, setUser] = useState(null);
  const [selectedVideoId, setSelectedVideoId] = useState(null);
  const [isSaved, setIsSaved] = useState(false);
  const [showControlMenu, setShowControlMenu] = useState(false);
  const [adminList, setAdminList] = useState([]);
  let admin = adminList?.includes(user?.email);
  const bottomSheetRef = useRef(null);

  async function getCurrentUser() {
    try {
      const currentUserData = await databases.getDocument(
        config.databaseId,
        config.usersCollectionId,
        creatorId
      );

      return currentUserData;
    } catch (error) {
      console.log("Error in getCurrentUser", error);
      return null;
    }
  }

  useEffect(() => {
    setLoading(true);

    getCurrentUser()
      .then((res) => {
        if (res) {
          setUser(res);
        } else {
          setUser(null);
        }
      })
      .catch((error) => {
        console.log("Error in fetching user:", error);
        setUser(null);
      });

    if (creatorId) {
      fetchUserPosts(creatorId).finally(() => {
        setLoading(false); // 确保只有在 fetchUserPosts 完成后才更新 loading 状态
      });
    } else {
      setLoading(false); // 如果没有 creatorId，也需要设置 loading 为 false
    }
  }, [creatorId]);

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

  useEffect(() => {
    if (showControlMenu) {
      bottomSheetRef.current?.expand();
    } else {
      bottomSheetRef.current?.close();
    }
  }, [showControlMenu]);

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
        Toast.show("Save successful", {
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
        Toast.show("Cancel save successfully", {
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
        Toast.show("Delete Success", {
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
      <FlatList
        data={loading ? [] : userPostsData}
        // item 是 data 数组中的每一项
        keyExtractor={(item) => item?.$id}
        contentContainerStyle={{ paddingBottom: 44 }}
        ListHeaderComponent={() => {
          return (
            <View className="my-6 px-4 mb-2 relative">
              <TouchableOpacity
                onPress={() => router.back()}
                className="w-12 h-12 justify-center items-center -ml-2"
              >
                <Image
                  source={backArrowIcon}
                  style={{ width: 25, height: 25 }}
                />
              </TouchableOpacity>

              <View className="justify-between items-center">
                <View className="w-[56px] h-[56px] border-2 border-secondary rounded-full overflow-hidden justify-center">
                  {user?.avatar && (
                    <Image
                      source={{ uri: user?.avatar }}
                      className="w-full h-full"
                      resizeMode="cover"
                    />
                  )}
                </View>

                <Text className="text-black text-xl font-psemibold mt-2.5">
                  {user?.username}
                </Text>
                <Text className="text-[#999999] text-sm mt-1">
                  {"#" + user?.email.split("@")[0]}
                </Text>
              </View>
            </View>
          );
        }}
        ListHeaderComponentStyle={{ marginBottom: 20 }}
        // renderItem 接受一个对象参数，通常解构为 { item, index, separators }
        renderItem={({ item }) => {
          return (
            <VideoCard
              post={item}
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
            <View className="flex-1 justify-center items-center bg-primary">
              <ActivityIndicator size="large" color="#000" />
              <Text className="mt-[10] text-black text-xl">
                {t("Loading, please wait...")}
              </Text>
            </View>
          ) : (
            <View>
              <EmptyState />
            </View>
          );
        }}
      />

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
                {isSaved ? "Cancel save video" : "Save video"}
              </Text>
            </Pressable>

            {admin === true ? (
              <Pressable
                onPress={handleDelete}
                className="w-full h-12 flex-row items-center"
              >
                <Image
                  source={trash}
                  className="w-6 h-6 mr-8"
                  resizeMode="contain"
                />
                <Text className="text-black text-lg">Delete video</Text>
              </Pressable>
            ) : null}
          </View>
        </BottomSheetView>
      </BottomSheet>

      <StatusBar style="dark" />
    </GestureHandlerRootView>
  );
}
