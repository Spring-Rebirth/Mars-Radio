import {
  FlatList,
  View,
  Text,
  Pressable,
  Image,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useEffect } from "react";
import PostItem from "../../components/post/PostItem";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { fetchAllPostsData } from "../../services/postsService";

export default function Posts() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    const getAllPosts = async () => {
      try {
        const allPosts = await fetchAllPostsData();
        console.log("allPosts:", JSON.stringify(allPosts, null, 2));
        setPosts(allPosts.documents);
      } finally {
        setLoading(false);
      }
    };

    getAllPosts();
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-[#fafafa]">
      <View className="p-5 bg-white border-b border-gray-300 mb-3">
        <Text className="text-2xl font-bold text-gray-800 text-center">
          {t("Featured Posts")}
        </Text>
      </View>

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#0ea5e9" />
          <Text className="mt-2 text-gray-600">{t("Loading")}</Text>
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.$id}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => {
                router.push({
                  pathname: "screens/post-details",
                  params: { post: JSON.stringify(item) },
                });
              }}
            >
              <PostItem {...item} />
            </Pressable>
          )}
          contentContainerStyle={{ padding: 16 }}
        />
      )}
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
