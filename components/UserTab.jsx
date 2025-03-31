import {
    View,
    Text,
    FlatList,
    Image,
    ActivityIndicator,
    RefreshControl,
    Pressable,
} from "react-native";
import React, { useState, useRef, useEffect } from "react";
import VideoCard from "./VideoCard";
import EmptyState from "./EmptyState";
import CustomButton from "./CustomButton";
import { router } from "expo-router";
import { useGlobalContext } from "../context/GlobalProvider";
import { useTranslation } from "react-i18next";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import Toast from "react-native-root-toast";
import { getVideoDetails } from "../lib/appwrite";
import trash from "../assets/menu/trash-solid.png";
import closeIcon from "../assets/icons/close.png";
import { deleteVideoDoc, deleteVideoFiles } from "../lib/appwrite";

export default function UserTab({ userPostsData, loading, fetchUserPosts, userId }) {
    const { user } = useGlobalContext();
    const { t } = useTranslation();
    const [refreshing, setRefreshing] = useState(false);
    const bottomSheetRef = useRef(null);
    const [showControlMenu, setShowControlMenu] = useState(false);
    const [selectedVideoId, setSelectedVideoId] = useState(null);

    useEffect(() => {
        if (showControlMenu) {
            bottomSheetRef.current?.expand();
        } else {
            bottomSheetRef.current?.close();
        }
    }, [showControlMenu]);

    const handleDelete = async () => {
        setShowControlMenu(false);
        try {
            const videoDetails = await getVideoDetails(selectedVideoId);
            const { image_ID, video_ID } = videoDetails;
            if (image_ID && video_ID) {
                await Promise.all([
                    deleteVideoDoc(selectedVideoId),
                    deleteVideoFiles(image_ID),
                    deleteVideoFiles(video_ID),
                ]);
                Toast.show(t("Delete Success"), {
                    duration: Toast.durations.SHORT,
                    position: Toast.positions.CENTER,
                });
                handleRefresh && handleRefresh();
            } else {
                Alert.alert("Delete Failed, File ID not found");
            }
        } catch (error) {
            console.error("删除出错:", error);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchUserPosts(userId);
        setRefreshing(false);
    };

    return (
        <View className="flex-1 bg-primary">
            <FlatList
                data={loading ? [] : userPostsData}
                directionalLockEnabled={true}
                keyExtractor={(item) => item?.$id}
                contentContainerStyle={{ paddingBottom: 44 }}
                renderItem={({ item }) => (
                    <VideoCard
                        post={item}
                        onMenuPress={(videoId) => {
                            setSelectedVideoId(videoId);
                            setShowControlMenu((prev) => !prev);
                        }}
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
                            onPress={handleDelete}
                            className="w-full h-12 flex-row items-center"
                        >
                            <Image source={trash} className="w-6 h-6 mr-8" />
                            <Text className="text-black text-lg">{t("Delete video")}</Text>
                        </Pressable>
                    </View>
                </BottomSheetView>
            </BottomSheet>
        </View>
    );
} 