import {
  SafeAreaView,
  View,
  Text,
  Image,
  FlatList,
  Pressable,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { fetchUserData } from "../../services/userService";

export default function PostDetails() {
  const { post } = useLocalSearchParams();
  const parsedPost = post ? JSON.parse(post) : null; // 解析为对象
  const { t } = useTranslation();

  console.log("Parsed post:", parsedPost);

  // 模拟评论数据
  const comments = [
    { id: "1", author: "评论者1", text: "很赞哦！" },
    { id: "2", author: "评论者2", text: "期待更多内容。" },
  ];

  const [postCreator, setPostCreator] = useState(null);

  // 获取帖子的用户信息
  useEffect(() => {
    const getPostCreatorInfo = async () => {
      const postCreator = await fetchUserData(parsedPost.author);
      console.log("postCreator:", postCreator);
      setPostCreator(postCreator);
    };

    getPostCreatorInfo();
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-row items-center">
        {/* 顶部返回按钮 */}
        <Pressable onPress={() => router.back()} className="p-4">
          <Image
            source={require("../../assets/icons/back-arrow.png")}
            className="w-6 h-6"
          />
        </Pressable>
        {/* 用户信息 */}
        <Image
          source={{ uri: postCreator?.avatar }}
          className="w-6 h-6 rounded-full ml-2"
        />
        <Text className="ml-2">{postCreator?.username}</Text>
      </View>
      {/* 帖子详情 */}
      <View className="p-5 pt-0 border-b border-gray-300">
        <Image
          source={{ uri: parsedPost.image }}
          className="h-44 w-full mx-auto"
          resizeMode="contain"
        />
        <Text className="mt-3 text-2xl font-bold text-gray-900">
          {parsedPost?.title || "无法读取到标题文本"}
        </Text>
        <Text className="mt-2 text-base text-gray-600" numberOfLines={20}>
          {parsedPost?.content || "无法读取到内容文本"}
        </Text>
      </View>
      {/* 评论列表 */}
      <View className="p-4 flex-1">
        <Text className="mb-3 text-lg font-semibold text-gray-800">
          {t("Comments")}
        </Text>
        <FlatList
          data={comments}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View className="mb-4 p-3 border border-gray-200 rounded-lg">
              <Text className="font-bold text-gray-700">{item.author}</Text>
              <Text className="mt-1 text-gray-600">{item.text}</Text>
            </View>
          )}
        />
      </View>
    </SafeAreaView>
  );
}
