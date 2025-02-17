import {
  SafeAreaView,
  FlatList,
  View,
  Text,
  Pressable,
  Image,
} from "react-native";
import { useState, useEffect } from "react";
import PostItem from "../../components/post/PostItem";
import { useRouter } from "expo-router";
import { mockPosts } from "../../constants/posts";
import { useTranslation } from "react-i18next";

export default function Posts() {
  const [posts, setPosts] = useState([]);
  const router = useRouter();
  const { t } = useTranslation();

  useEffect(() => {
    // 模拟加载数据
    setPosts(mockPosts);
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-[#fafafa]">
      <View className="p-5 bg-white border-b border-gray-300 mb-3">
        <Text className="text-2xl font-bold text-gray-800 text-center">
          {t("Featured Posts")}
        </Text>
      </View>
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => {
              router.push({
                pathname: "screens/post-details",
                params: { post: item },
              });
            }}
          >
            <PostItem {...item} />
          </Pressable>
        )}
        contentContainerStyle={{ padding: 16 }}
      />
      <Pressable
        onPress={() => router.push("screens/create-post")}
        className="absolute bottom-5 right-5 bg-sky-500 w-14 h-14 rounded-full justify-center items-center"
      >
        <Image
          source={require("../../assets/icons/post/plus.png")}
          className="w-8 h-8"
        />
      </Pressable>
    </SafeAreaView>
  );
}
