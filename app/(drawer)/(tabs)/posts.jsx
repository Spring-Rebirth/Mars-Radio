import {
  FlatList,
  View,
  Text,
  Pressable,
  Image,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useEffect, useCallback, useRef } from "react";
import PostItem from "../../../components/post/PostItem";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { fetchPostsWithPagination } from "../../../services/postsService";
import Toast from "react-native-toast-message";
import { useTabContext } from "../../../context/GlobalProvider";

export default function Posts() {
  const [posts, setPosts] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { t } = useTranslation();
  const limit = 10;
  const flatListRef = useRef(null);
  const { tabEvents } = useTabContext();

  // 滚动到顶部方法
  const scrollToTop = useCallback(() => {
    console.log("滚动到顶部 - Posts");
    if (flatListRef.current) {
      flatListRef.current.scrollToOffset({ offset: 0, animated: false });
    }
  }, [flatListRef]);

  // 监听postsTab点击事件
  useEffect(() => {
    // 当postsTab事件计数器变化时，执行滚动到顶部
    if (tabEvents.postsTab > 0) {
      scrollToTop();
    }
  }, [tabEvents.postsTab, scrollToTop]);

  const loadPosts = async (isLoadMore = false) => {
    const offset = isLoadMore ? posts.length : 0;
    try {
      const newPosts = await fetchPostsWithPagination(offset, limit);
      if (isLoadMore) {
        setPosts(prev => [...prev, ...newPosts]);
      } else {
        setPosts(newPosts);
      }
      if (newPosts.length < limit) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    }
  };

  useEffect(() => {
    const fetchInitialPosts = async () => {
      try {
        setInitialLoading(true);
        await loadPosts();
      } catch (error) {
        console.error('Initial load failed:', error);
      } finally {
        setInitialLoading(false);
      }
    };
    fetchInitialPosts();
  }, []);

  const onRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      await loadPosts(false, true);
      Toast.show({
        text1: t('Refresh Successful'),
        type: 'success',
        topOffset: 68,
      });
    } catch (error) {
      console.error('Refresh failed:', error);
      Toast.show({
        text1: t('Refresh Failed'),
        type: 'danger',
        topOffset: 68,
      });
    } finally {
      setRefreshing(false);
    }
  }, []);

  const handleLoadMore = async () => {
    if (loadingMore || !hasMore) return;
    try {
      setLoadingMore(true);
      await loadPosts(true);
    } catch (error) {
      console.error('Load more failed:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#fafafa]">
      <View className="p-5 bg-white border-b border-gray-300 mb-3">
        <Text className="text-2xl font-bold text-gray-800 text-center">
          {t("Featured Posts")}
        </Text>
      </View>

      {initialLoading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#0ea5e9" />
          <Text className="mt-2 text-gray-600">{t("Loading")}</Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={posts}
          directionalLockEnabled={true}
          keyExtractor={(item) => item.$id}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => {
                router.push({
                  pathname: "screens/post-detail",
                  params: { post: JSON.stringify(item) },
                });
              }}
            >
              <PostItem {...item} />
            </Pressable>
          )}
          contentContainerStyle={{ padding: 16, paddingBottom: 80 }}
          onRefresh={onRefresh}
          refreshing={refreshing}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={() => {
            return loadingMore ? (
              <View className="items-center justify-center my-4">
                <ActivityIndicator size="large" color="#FFB300" />
              </View>
            ) : null;
          }}
        />
      )}
      <Pressable
        onPress={() => router.push("screens/create-post")}
        className="absolute bottom-5 right-5 bg-sky-500 w-14 h-14 rounded-full justify-center items-center"
      >
        <Image
          source={require("../../../assets/icons/post/plus.png")}
          className="w-8 h-8"
        />
      </Pressable>
    </SafeAreaView>
  );
}
