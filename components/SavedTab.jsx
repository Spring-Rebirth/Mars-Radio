import {
    View,
    Text,
    FlatList,
    Image,
    ActivityIndicator,
    RefreshControl,
    Pressable,
} from "react-native";
import React, { useEffect, useState, useRef } from "react";
import { images } from "../constants";
import VideoCard from "./VideoCard";
import useGetData from "../hooks/useGetData";
import { useGlobalContext } from "../context/GlobalProvider";
import { useTranslation } from "react-i18next";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import Toast from "react-native-root-toast";
import { updateSavedCounts, updateSavedVideo } from "../lib/appwrite";
import star from "../assets/menu/star-solid.png";
import starThree from "../assets/menu/star3.png";
import closeIcon from "../assets/icons/close.png";

export default function SavedTab() {
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [savedPostsData, setSavedPostsData] = useState([]);
    const { fetchSavedPosts } = useGetData({ setLoading, setSavedPostsData });
    const { user, setUser } = useGlobalContext();
    const { t } = useTranslation();
    const bottomSheetRef = useRef(null);
    const [showControlMenu, setShowControlMenu] = useState(false);
    const [selectedVideoId, setSelectedVideoId] = useState(null);
    const [isSaved, setIsSaved] = useState(false);

    useEffect(() => {
        if (showControlMenu) {
            bottomSheetRef.current?.expand();
        } else {
            bottomSheetRef.current?.close();
        }
    }, [showControlMenu]);

    useEffect(() => {
        updateSavedVideo(user?.$id, { favorite: user?.favorite });
    }, [user?.favorite]);

    useEffect(() => {
        fetchSavedPosts(user?.favorite);
    }, [user]);

    useEffect(() => {
        return () => {
            if (bottomSheetRef.current) {
                bottomSheetRef.current.close();
            }
        };
    }, []);

    const handleAddSaved = async () => {
        try {
            let isIncrement;
            if (!user?.favorite.includes(selectedVideoId)) {
                const newUser = JSON.parse(JSON.stringify(user));
                newUser.favorite.push(selectedVideoId);
                setUser((prev) => ({ ...prev, favorite: newUser.favorite }));
                setIsSaved(true);
                isIncrement = true;
                Toast.show(t("Save successful"), {
                    duration: Toast.durations.SHORT,
                    position: Toast.positions.CENTER,
                });
            } else {
                const updatedItems = user?.favorite.filter(
                    (item) => item !== selectedVideoId
                );
                setUser((prev) => ({ ...prev, favorite: updatedItems }));
                setIsSaved(false);
                isIncrement = false;
                Toast.show(t("Cancel save successfully"), {
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
        setShowControlMenu(false);
        handleAddSaved();
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchSavedPosts(user?.favorite);
        setRefreshing(false);
    };

    return (
        <View className="flex-1 bg-primary">
            <FlatList
                data={loading ? [] : savedPostsData}
                directionalLockEnabled={true}
                keyExtractor={(item) => item.$id}
                contentContainerStyle={{ paddingBottom: 44 }}
                renderItem={({ item }) => (
                    <VideoCard
                        post={item}
                        onMenuPress={(videoId) => {
                            setSelectedVideoId(videoId);
                            setIsSaved(user?.favorite.includes(videoId));
                            setShowControlMenu((prev) => !prev);
                        }}
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
                            />
                            <Text className="text-[#333333] text-lg">
                                {isSaved ? t("Cancel save video") : t("Save video")}
                            </Text>
                        </Pressable>
                    </View>
                </BottomSheetView>
            </BottomSheet>
        </View>
    );
} 