import {
    View,
    Text,
    FlatList,
    Image,
    ActivityIndicator,
    RefreshControl,
    Pressable,
} from "react-native";
import React, { useEffect, useState, useRef, useCallback } from "react";
import { images } from "../constants";
import VideoCard from "./VideoCard";
import useGetData from "../hooks/useGetData";
import { useGlobalContext } from "../context/GlobalProvider";
import { useTranslation } from "react-i18next";
import { updateSavedCounts, updateSavedVideo } from "../lib/appwrite";
import star from "../assets/menu/star-solid.png";
import starThree from "../assets/menu/star3.png";
import closeIcon from "../assets/icons/close.png";

export default function SavedTab({ onMenuPress }) {
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [savedPostsData, setSavedPostsData] = useState([]);
    const { fetchSavedPosts } = useGetData({ setLoading, setSavedPostsData });
    const { user, setUser } = useGlobalContext();
    const { t } = useTranslation();

    useEffect(() => {
        if (user?.favorite) {
            setLoading(true);
            fetchSavedPosts(user.favorite).finally(() => setLoading(false));
        }
    }, [user?.favorite]);

    const handleRefresh = async () => {
        setRefreshing(true);
        if (user?.favorite) {
            await fetchSavedPosts(user.favorite);
        }
        setRefreshing(false);
    };

    return (
        <View className="flex-1 bg-primary">
            <FlatList
                data={loading ? [] : savedPostsData}
                directionalLockEnabled={true}
                keyExtractor={(item) => item.$id}
                contentContainerStyle={{ paddingBottom: 44, paddingTop: 16 }}
                renderItem={({ item }) => (
                    <VideoCard
                        post={item}
                        onMenuPress={() => onMenuPress(item.$id)}
                    />
                )}
                ListEmptyComponent={() => {
                    return loading ? (
                        <View className="flex-1 justify-center items-center bg-primary py-10">
                            <ActivityIndicator size="large" color="#000" />
                            <Text className="mt-3 text-black text-xl">
                                {t("Loading, please wait...")}
                            </Text>
                        </View>
                    ) : (
                        <View className="items-center py-10">
                            <Image
                                source={images.empty}
                                className="w-[200px] h-[160px]"
                                resizeMode="contain"
                            />
                            <Text className="mt-2 text-black font-psemibold text-lg">
                                {t("No Videos Saved")}
                            </Text>
                        </View>
                    );
                }}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
                }
            />
        </View>
    );
} 