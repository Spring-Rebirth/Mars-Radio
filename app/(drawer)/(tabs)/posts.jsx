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
import { LinearGradient } from "expo-linear-gradient";

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
            console.log('newPosts', JSON.stringify(newPosts, null, 2));
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
        <SafeAreaView className="flex-1 bg-[#f8f9fa]" edges={['top', 'left', 'right']}>
            {/* 标题栏 */}
            <LinearGradient
                colors={['#FFB800', '#FF6B6B', '#FFA001']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
            >
                <View className="py-5 px-4">
                    <Text className="text-2xl font-bold text-white text-center">
                        {t("Featured Posts")}
                    </Text>
                </View>
            </LinearGradient>

            {initialLoading ? (
                <View className="flex-1 justify-center items-center">
                    <ActivityIndicator size="large" color="#FF6B6B" />
                    <Text className="mt-3 text-gray-600 font-medium">{t("Loading posts...")}</Text>
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
                            className="mx-4"
                        >
                            <PostItem {...item} />
                        </Pressable>
                    )}
                    contentContainerStyle={{ paddingTop: 16, paddingBottom: 40 }}
                    onRefresh={onRefresh}
                    refreshing={refreshing}
                    onEndReached={handleLoadMore}
                    onEndReachedThreshold={0.3}
                    ListEmptyComponent={() => (
                        <View className="flex-1 justify-center items-center py-10">
                            <Image
                                source={require("../../../assets/images/empty.png")}
                                className="w-20 h-20 opacity-50 mb-4"
                            />
                            <Text className="text-gray-400 text-lg">{t("No posts yet")}</Text>
                        </View>
                    )}
                    ListFooterComponent={() => {
                        if (loadingMore) {
                            return (
                                <View className="items-center justify-center my-6">
                                    <ActivityIndicator size="small" color="#FF6B6B" />
                                </View>
                            );
                        } else if (!hasMore && posts.length > 0) {
                            return (
                                <View className="items-center justify-center my-6">
                                    <Text className="text-gray-400">{t("No more posts")}</Text>
                                </View>
                            );
                        }
                        return null;
                    }}
                />
            )}

            {/* 创建按钮 */}
            <LinearGradient
                colors={['#3498db', '#8e44ad']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="absolute bottom-6 right-6 w-14 h-14 rounded-full justify-center items-center shadow-lg"
                style={{
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 5,
                    elevation: 6
                }}
            >
                <Pressable
                    onPress={() => router.push("screens/create-post")}
                    className="w-full h-full rounded-full justify-center items-center"
                >
                    <Image
                        source={require("../../../assets/icons/post/plus.png")}
                        className="w-8 h-8"
                        style={{ tintColor: 'white' }}
                    />
                </Pressable>
            </LinearGradient>
        </SafeAreaView>
    );
}
