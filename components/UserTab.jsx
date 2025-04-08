import {
    View,
    Text,
    FlatList,
    Image,
    ActivityIndicator,
    RefreshControl,
    Pressable,
} from "react-native";
import React, { useState, useRef, useEffect, useCallback } from "react";
import VideoCard from "./VideoCard";
import EmptyState from "./EmptyState";
import CustomButton from "./CustomButton";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { getVideoDetails } from "../lib/appwrite";
import trash from "../assets/menu/trash-solid.png";
import closeIcon from "../assets/icons/close.png";

export default function UserTab({ userPostsData, loading, fetchUserPosts, userId, onMenuPress }) {
    const { t } = useTranslation();
    const [refreshing, setRefreshing] = useState(false);

    const handleRefresh = async () => {
        setRefreshing(true);
        if (fetchUserPosts) {
            await fetchUserPosts(userId);
        }
        setRefreshing(false);
    };

    return (
        <View className="flex-1 bg-primary">
            <FlatList
                data={loading ? [] : userPostsData}
                directionalLockEnabled={true}
                keyExtractor={(item) => item?.$id}
                contentContainerStyle={{ paddingBottom: 44, paddingTop: 16 }}
                renderItem={({ item }) => (
                    <VideoCard
                        post={item}
                        onMenuPress={() => onMenuPress(item.$id)}
                        handleRefresh={handleRefresh}
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
                        <View>
                            <EmptyState />
                            <CustomButton
                                title={t("Create Video")}
                                textStyle={"text-black"}
                                style={"h-16 my-5 mx-4"}
                                onPress={() => router.push("/create")}
                            />
                        </View>
                    );
                }}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                    />
                }
            />
        </View>
    );
} 