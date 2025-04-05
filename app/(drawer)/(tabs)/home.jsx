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
    ScrollView,
} from "react-native";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { images } from "../../../constants";
import SearchInput from "../../../components/SearchInput";
import Trending from "../../../components/Trending";
import EmptyState from "../../../components/EmptyState";
import CustomButton from "../../../components/CustomButton";
import VideoCard from "../../../components/VideoCard";
import { useGlobalContext, useTabContext } from "../../../context/GlobalProvider";
import { StatusBar } from "expo-status-bar";
import { updateSavedVideo } from "../../../lib/appwrite";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { fetchAdminData } from "../../../lib/appwrite";
import VideoLoadingSkeleton from "../../../components/loading-view/VideoLoadingSkeleton";
import { router } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import BottomSheet, { BottomSheetView, BottomSheetBackdrop } from "@gorhom/bottom-sheet";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { deleteVideoDoc, deleteVideoFiles } from "../../../lib/appwrite";
import { updateSavedCounts, getVideoDetails } from "../../../lib/appwrite";
import star from "../../../assets/menu/star-solid.png";
import starThree from "../../../assets/menu/star3.png";
import trash from "../../../assets/menu/trash-solid.png";
import Toast from "react-native-toast-message";
import closeIcon from "../../../assets/icons/close.png";
import { getPostsWithPagination, getPopularPosts } from "../../../lib/appwrite";
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
    let admin = adminList?.includes(user?.email);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [selectedVideoId, setSelectedVideoId] = useState(null);
    const [isSaved, setIsSaved] = useState(false);
    const [activeTab, setActiveTab] = useState(1);
    const swiperRef = useRef(null);
    const prevActiveTabRef = useRef(0);
    const [showSearch, setShowSearch] = useState(false);
    const searchAnimatedValue = useRef(new Animated.Value(0)).current;
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [cursor, setCursor] = useState(null);
    const limit = 10;
    const [isInitialLatestLoading, setIsInitialLatestLoading] = useState(true);

    // Define the backdrop component using useCallback
    const renderBackdrop = useCallback(
        props => (
            <BottomSheetBackdrop
                {...props}
                appearsOnIndex={0} // Show backdrop when index is 0 or higher
                disappearsOnIndex={-1} // Hide backdrop when index is -1
                pressBehavior='close' // Close sheet on press
            />
        ),
        []
    );

    // 滚动到顶部方法
    const scrollToTop = useCallback(() => {
        console.log("滚动到顶部 - Home");
        if (flatListRef.current) {
            flatListRef.current.scrollToOffset({ offset: 0, animated: false });
        }
    }, [flatListRef]);

    // 监听homeTab点击事件
    useEffect(() => {
        if (tabEvents.homeTab > 0) {
            scrollToTop();
        }
    }, [tabEvents.homeTab, scrollToTop]);

    // Fetch initial data (Latest, Popular, Admin, User Saved)
    useEffect(() => {
        const loadInitialData = async () => {
            setLoading(true); // Start loading indicator
            setCursor(null);  // Reset pagination cursor
            setHasMore(true); // Assume there's more data initially

            try {
                const promises = [];

                // Reset initial latest loading state
                setIsInitialLatestLoading(true);

                // 1. Fetch Latest Posts (Page 1)
                promises.push(
                    (async () => {
                        try {
                            const initialPosts = await getPostsWithPagination(null, limit);
                            const imageUrls = initialPosts.map(post => post.thumbnail).filter(url => url);
                            await Promise.all(imageUrls.map(url => Image.prefetch(url)));
                            setData(initialPosts); // Set data first
                            if (initialPosts.length < limit) {
                                setHasMore(false);
                            } else {
                                const lastPost = initialPosts[initialPosts.length - 1];
                                setCursor(lastPost.$id);
                            }
                            setIsInitialLatestLoading(false); // Mark as done *after* setting data/hasMore
                        } catch (error) {
                            console.error('Initial loadPosts failed:', error);
                            setData([]);
                            setHasMore(false);
                            setIsInitialLatestLoading(false); // Mark as done even on error
                        }
                    })()
                );

                // 2. Fetch Admin Data
                promises.push(
                    (async () => {
                        try {
                            const adminData = await fetchAdminData();
                            const adminArray = adminData.map((doc) => doc.account);
                            setAdminList(adminArray);
                        } catch (error) {
                            console.error("Error fetching admin data:", error);
                            setAdminList([]);
                        }
                    })()
                );

                // 3. Fetch Popular Posts (if user exists, adjust if needed for guests)
                if (user?.$id) { // Assuming popular posts require user context or similar logic
                    promises.push(
                        (async () => {
                            try {
                                // Assuming getPopularPosts service exists
                                const popular = await getPopularPosts();
                                setPopularData(popular || []);
                            } catch (error) {
                                console.error("Error fetching popular posts:", error);
                                setPopularData([]);
                            }
                        })()
                    );

                    // 4. Update Saved Video (less critical for initial display, maybe optional?)
                    // This doesn't fetch data for display but updates based on user context
                    // Can run in parallel but doesn't directly contribute to initial content display states (data, popularData)
                    promises.push(
                        (async () => {
                            try {
                                const favorite = user.favorite || [];
                                await updateSavedVideo(user.$id, { favorite });
                            } catch (error) {
                                console.error("Error updating saved video on initial load:", error);
                            }
                        })()
                    );

                } else {
                    // Handle case where user is not logged in (e.g., show default popular posts or empty)
                    setPopularData([]); // Clear popular data if no user
                }


                await Promise.all(promises); // Wait for all essential initial fetches

            } catch (error) {
                console.error("Error during initial data load setup:", error);
                // Ensure states reflect error scenario if needed
                setData([]);
                setPopularData([]);
                setAdminList([]);
                setHasMore(false);
            } finally {
                setLoading(false); // Stop loading indicator *after* all fetches complete
            }
        };

        loadInitialData();

        // Rerun this effect if the user logs in/out (user ID changes)
    }, [user?.$id]);

    // Update user's saved list in backend when local user.favorite changes
    useEffect(() => {
        // Avoid running on initial load if logic is already in the main useEffect
        // This should only react to *changes* in user.favorite after initial load
        if (!loading && user?.$id && user?.favorite) { // Check loading state? Or use a flag?
            updateSavedVideo(user.$id, { favorite: user.favorite })
                .catch(error => console.error("Error updating saved video on favorite change:", error));
        }
    }, [user?.favorite]); // Keep dependency on user.favorite


    // Handle Bottom Sheet visibility
    useEffect(() => {
        if (showControlMenu) {
            bottomSheetRef.current?.expand();
        } else {
            bottomSheetRef.current?.close();
        }
    }, [showControlMenu]);

    // Close bottom sheet on screen blur
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

    // Refresh Handler
    const handleRefresh = async () => {
        setRefreshing(true);
        setCursor(null); // Reset cursor for latest posts
        setHasMore(true); // Reset hasMore for latest posts
        setIsInitialLatestLoading(true); // Mark latest as loading during refresh

        try {
            const promises = [];

            // 1. Fetch Latest Posts (Page 1)
            promises.push(
                (async () => {
                    try {
                        const refreshedPosts = await getPostsWithPagination(null, limit);
                        const imageUrls = refreshedPosts.map(post => post.thumbnail).filter(url => url);
                        await Promise.all(imageUrls.map(url => Image.prefetch(url)));
                        setData(refreshedPosts); // Replace data
                        if (refreshedPosts.length < limit) {
                            setHasMore(false);
                        } else {
                            const lastPost = refreshedPosts[refreshedPosts.length - 1];
                            setCursor(lastPost.$id);
                            setHasMore(true);
                        }
                        setIsInitialLatestLoading(false); // Mark as done *after* setting data/hasMore
                    } catch (error) {
                        console.error('Refresh loadPosts failed:', error);
                        setData([]);
                        setHasMore(false);
                        setIsInitialLatestLoading(false); // Mark as done even on error
                    }
                })()
            );

            // 2. Fetch Popular Posts
            if (user?.$id) { // Check user context again for refresh
                promises.push(
                    (async () => {
                        try {
                            const popular = await getPopularPosts();
                            setPopularData(popular || []);
                        } catch (error) {
                            console.error("Error refreshing popular posts:", error);
                            setPopularData([]);
                        }
                    })()
                );
            } else {
                setPopularData([]); // Clear popular if user logs out during session
            }


            await Promise.all(promises); // Wait for all refresh fetches

        } catch (error) {
            console.error("Error during refresh:", error);
        } finally {
            setRefreshing(false); // Stop refresh indicator
        }
    };

    // Load More Posts for Pagination (Latest Tab)
    const loadMorePosts = async () => {
        if (isLoadingMore || !hasMore || cursor === null) {
            console.log("Load more condition not met:", { isLoadingMore, hasMore, cursor });
            return;
        }
        console.log("Loading more posts with cursor:", cursor);
        setIsLoadingMore(true);
        try {
            const newPosts = await getPostsWithPagination(cursor, limit);
            console.log("Fetched new posts:", newPosts.length);
            const imageUrls = newPosts.map(post => post.thumbnail).filter(url => url);
            await Promise.all(imageUrls.map(url => Image.prefetch(url)));
            // Use functional update to correctly append
            setData(prevPosts => [...prevPosts, ...newPosts]);
            if (newPosts.length < limit) {
                setHasMore(false);
                console.log("No more posts to load.");
            } else {
                const lastPost = newPosts[newPosts.length - 1];
                setCursor(lastPost.$id);
                console.log("New cursor set:", lastPost.$id);
            }
        } catch (error) {
            console.error('Failed to load more posts:', error);
        } finally {
            setIsLoadingMore(false);
        }
    };


    // Handle Add/Remove Saved Video
    const handleAddSaved = async () => {
        if (!user || !selectedVideoId) return; // Guard against missing user or video ID

        try {
            let isIncrement;
            const currentFavorites = user.favorite || [];
            let updatedFavorites;

            if (!currentFavorites.includes(selectedVideoId)) {
                // Add to favorites
                updatedFavorites = [...currentFavorites, selectedVideoId];
                isIncrement = true;
                Toast.show({
                    text1: t("Save successful"),
                    type: "success",
                    topOffset: 68,
                });
                setIsSaved(true); // Update local state immediately
            } else {
                // Remove from favorites
                updatedFavorites = currentFavorites.filter(item => item !== selectedVideoId);
                isIncrement = false;
                Toast.show({
                    text1: t("Cancel save successfully"),
                    type: "success",
                    topOffset: 68,
                });
                setIsSaved(false); // Update local state immediately
            }

            // Update user context optimistically
            setUser(prevUser => ({
                ...prevUser,
                favorite: updatedFavorites,
            }));


            // Update backend (both user document and video counts)
            // Note: The useEffect listening to user.favorite will also trigger an updateSavedVideo call.
            // Consider if this double-updates or if the useEffect is sufficient.
            // For immediate count update, call updateSavedCounts here.
            await updateSavedCounts(selectedVideoId, isIncrement);
            // The useEffect on user.favorite handles the user document update.

        } catch (error) {
            console.error("Error handling favorite:", error);
            Alert.alert("An error occurred while updating favorites.");
            // Optionally revert optimistic UI update here if needed
        }
    };

    const handleClickSave = () => {
        setShowControlMenu(false); // Close menu first
        handleAddSaved();
    };

    // Handle Delete Video
    const handleDelete = async () => {
        if (!selectedVideoId) return;
        setShowControlMenu(false); // Close menu

        try {
            const videoDetails = await getVideoDetails(selectedVideoId);
            const { image_ID, video_ID } = videoDetails;

            if (image_ID && video_ID) {
                await Promise.all([
                    deleteVideoDoc(selectedVideoId),
                    deleteVideoFiles(image_ID),
                    deleteVideoFiles(video_ID),
                ]);
                console.log("删除成功");
                Toast.show({
                    text1: t("Delete Success"),
                    type: "success",
                    topOffset: 68,
                });
                // Refresh data after deletion
                handleRefresh(); // Trigger a full refresh
            } else {
                console.log("未找到与该视频关联的文件 ID");
                Alert.alert("Delete Failed", "File ID not found.");
            }
        } catch (error) {
            console.error("删除过程中出错:", error);
            Alert.alert("Delete Failed", "An error occurred during deletion.");
        }
    };

    // Switch Tabs via Swiper Index
    useEffect(() => {
        if (prevActiveTabRef.current !== activeTab) {
            prevActiveTabRef.current = activeTab;
            if (swiperRef.current && swiperRef.current.scrollTo) {
                swiperRef.current.scrollTo(activeTab, true);
            }
        }
    }, [activeTab]);

    // Toggle Search Bar Animation
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
                className={`flex-1 bg-primary ${isFullscreen ? "w-full h-full" : ""}`} // Removed h-full when not fullscreen to allow content scroll
            >
                {/* Header */}
                <View className="px-4 pt-2">
                    {/* Top Bar */}
                    <View className="flex-row justify-between items-center h-[50px]">
                        {/* Left User Avatar */}
                        <TouchableOpacity
                            onPress={() => navigation.openDrawer()}
                            className="w-10 h-10 rounded-full justify-center items-center overflow-hidden"
                            style={{ /* Shadow styles */ }}
                        >
                            {user?.avatar ? (
                                <Image
                                    source={{ uri: user.avatar }}
                                    className="w-10 h-10"
                                    resizeMode="cover"
                                />
                            ) : (
                                <View className="w-10 h-10 bg-gray-300 rounded-full" /> // Placeholder
                            )}
                        </TouchableOpacity>

                        {/* Center Logo */}
                        <Image
                            source={images.logoSmall}
                            className="w-9 h-10"
                            resizeMode="contain"
                        />

                        {/* Right Search Button */}
                        <TouchableOpacity
                            onPress={toggleSearchBar}
                            className="w-10 h-10 bg-white rounded-full justify-center items-center"
                            style={{ /* Shadow styles */ }}
                        >
                            <Image
                                source={icons.search}
                                className="w-5 h-5"
                                resizeMode="contain"
                            />
                        </TouchableOpacity>
                    </View>

                    {/* Animated Search Bar */}
                    <Animated.View
                        style={{
                            maxHeight: searchAnimatedValue.interpolate({ inputRange: [0, 1], outputRange: [0, 80] }),
                            opacity: searchAnimatedValue,
                            transform: [{ translateY: searchAnimatedValue.interpolate({ inputRange: [0, 1], outputRange: [-10, 0] }) }],
                            marginTop: 8,
                            overflow: 'hidden'
                        }}
                    >
                        <SearchInput containerStyle="shadow-sm" />
                    </Animated.View>

                    {/* Tab Navigation */}
                    <View className="flex-row justify-center border-b border-gray-100 mx-1 mt-6">
                        <TouchableOpacity
                            className={`flex-1 pb-2 ${activeTab === 0 ? 'border-b-2 border-[#FFB300]' : ''}`}
                            onPress={() => setActiveTab(0)}
                        >
                            <Text className={`text-center font-psemibold text-[15px] ${activeTab === 0 ? 'text-[#FFB300]' : 'text-gray-400'}`}>
                                {t("Top Hits")}
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            className={`flex-1 pb-2 ${activeTab === 1 ? 'border-b-2 border-[#FFB300]' : ''}`}
                            onPress={() => setActiveTab(1)}
                        >
                            <Text className={`text-center font-psemibold text-[15px] ${activeTab === 1 ? 'text-[#FFB300]' : 'text-gray-400'}`}>
                                {t("Latest")}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Content Area - Conditional Rendering based on initial load */}
                <View className="flex-1 mt-2">
                    <Swiper
                        ref={swiperRef}
                        index={activeTab}
                        onIndexChanged={(index) => setActiveTab(index)}
                        loop={false}
                        showsPagination={false}
                        scrollEnabled={true}
                    >
                        {/* Popular Videos Tab */}
                        <View className="flex-1 px-4">

                            {popularData.length === 0 ? (
                                <View className="items-center justify-center flex-1">
                                    <Image
                                        source={images.empty}
                                        className="w-[75px] h-[60px]"
                                        resizeMode="contain"
                                    />
                                    <Text className="text-gray-400 text-center font-psemibold mt-2">
                                        {t("No popular videos yet.")} {"\n"}
                                        {t("Watch some to make them popular!")}
                                    </Text>
                                </View>
                            ) : (
                                <View className="pt-4 flex-1">
                                    <Trending
                                        video={popularData}
                                        loading={refreshing}
                                    />
                                </View>
                            )}
                        </View>

                        {/* Latest Videos Tab */}
                        <View className="flex-1">
                            {isInitialLatestLoading ? (
                                <View>
                                    <VideoLoadingSkeleton />
                                    <VideoLoadingSkeleton />
                                    <VideoLoadingSkeleton />
                                </View>
                            ) : data.length === 0 ? (
                                <View className="mt-10 items-center">
                                    <EmptyState title={t("No Videos Found")} subtitle={t("Be the first one to upload a video!")} />
                                    <CustomButton
                                        title={t("Create Video")}
                                        textStyle={"text-black"}
                                        style={"h-16 my-5 mx-4 w-[90%]"}
                                        onPress={() => router.push("/create")}
                                    />
                                </View>
                            ) : (
                                <FlatList
                                    ref={flatListRef}
                                    directionalLockEnabled={true}
                                    contentContainerStyle={{ paddingTop: 16, paddingBottom: 100 }}
                                    data={data}
                                    keyExtractor={(item) => item.$id}
                                    renderItem={({ item }) => (
                                        <VideoCard
                                            post={item}
                                            adminList={adminList}
                                            onMenuPress={(videoId) => {
                                                setSelectedVideoId(videoId);
                                                setIsSaved(user?.favorite?.includes(videoId) ?? false);
                                                setIsVideoCreator(user?.$id === item?.creator?.$id);
                                                setShowControlMenu(true);
                                            }}
                                        />
                                    )}
                                    ListEmptyComponent={null}
                                    refreshControl={
                                        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={["#FFB300"]} />
                                    }
                                    onEndReached={loadMorePosts}
                                    onEndReachedThreshold={0.5}
                                    initialNumToRender={5}
                                    maxToRenderPerBatch={10}
                                    windowSize={10}
                                    removeClippedSubviews={true}
                                    ListFooterComponent={() => {
                                        if (isLoadingMore) {
                                            return (
                                                <View className="items-center justify-center my-4">
                                                    <ActivityIndicator size="large" color="#FFB300" />
                                                </View>
                                            );
                                        } else if (!hasMore && data.length > 0) {
                                            return (
                                                <View className="items-center justify-center my-4 pb-10">
                                                    <Text className="text-gray-400 text-sm">{t("No more videos")}</Text>
                                                </View>
                                            );
                                        } else {
                                            return null;
                                        }
                                    }}
                                />
                            )}
                        </View>
                    </Swiper>
                </View>
            </View>

            {/* Video Control Bottom Sheet */}
            <BottomSheet
                ref={bottomSheetRef}
                index={-1}
                snapPoints={[isVideoCreator || admin ? 220 : 160]}
                enablePanDownToClose={true}
                backdropComponent={renderBackdrop}
                handleIndicatorStyle={{ backgroundColor: '#999' }}
                backgroundStyle={{ backgroundColor: 'white' }}
                onClose={() => setShowControlMenu(false)}
            >
                <BottomSheetView style={{ paddingHorizontal: 24, paddingTop: 8, paddingBottom: 24 }}>
                    <Pressable
                        onPress={handleClickSave}
                        className="w-full h-12 flex-row items-center mb-2"
                    >
                        <Image
                            source={isSaved ? star : starThree}
                            className="w-6 h-6 mr-6"
                            resizeMode="contain"
                        />
                        <Text className="text-[#333333] text-lg font-pmedium">
                            {isSaved ? t("Cancel save video") : t("Save video")}
                        </Text>
                    </Pressable>

                    {(isVideoCreator || admin) && (
                        <Pressable
                            onPress={handleDelete}
                            className="w-full h-12 flex-row items-center"
                        >
                            <Image
                                source={trash}
                                className="w-6 h-6 mr-6"
                                resizeMode="contain"
                            />
                            <Text className="text-red-500 text-lg font-pmedium">{t("Delete video")}</Text>
                        </Pressable>
                    )}
                </BottomSheetView>
            </BottomSheet>

            <StatusBar style="dark" />
        </GestureHandlerRootView>
    );
}
