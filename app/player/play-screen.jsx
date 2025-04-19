import {
    View,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Alert,
    TouchableOpacity,
    Text,
    ActivityIndicator
} from "react-native";
import React, { useEffect, useMemo, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useVideoPlayer } from "expo-video";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from '@expo/vector-icons';
import CommentInputBox from "../../components/comment/CommentInputBox";
import CommentList from "../../components/comment/CommentList";
import { useGlobalContext } from "../../context/GlobalProvider";
import {
    fetchReplies,
    fetchCommentUser,
    fetchCommentUsername,
    submitReply,
} from "../../services/commentService";
import { getVideoDetails } from "../../lib/appwrite";
import useComments from "../../hooks/useComments";
import VideoPlayer from "../../components/player/VideoPlayer";
import useScreenOrientation from "../../hooks/useScreenOrientation";
import styles from "../../styles/player/styles";

export default function PlayScreen() {
    const { user } = useGlobalContext();
    const { post, commentId, videoId } = useLocalSearchParams();
    const [videoData, setVideoData] = useState(null);
    const [isInvalidVideo, setIsInvalidVideo] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { fullscreen, setFullscreen, toggleFullscreen } = useScreenOrientation();
    const [refreshFlag, setRefreshFlag] = useState(false);

    const videoPlayer = useVideoPlayer(videoData?.video || '', player => {
        if (player && videoData?.video) {
            player.play();
        }
    });

    useEffect(() => {
        const fetchVideoData = async () => {
            setIsLoading(true);
            try {
                if (post) {
                    try {
                        const parsedPost = JSON.parse(post);
                        if (parsedPost) {
                            setVideoData(parsedPost);
                            return;
                        }
                    } catch (parseError) {
                        console.error("解析post对象失败:", parseError);
                    }
                }

                if (videoId) {
                    const videoDetails = await getVideoDetails(videoId);
                    if (videoDetails) {
                        setVideoData(videoDetails);
                        return;
                    } else {
                        console.error("无法获取视频详情，videoId:", videoId);
                    }
                }

                setIsInvalidVideo(true);
                Alert.alert(
                    "视频已失效",
                    "抱歉，您请求的视频内容已失效或不存在",
                    [{ text: "确定", style: "default" }]
                );
            } catch (error) {
                console.error("加载视频数据失败:", error);
                setIsInvalidVideo(true);
                Alert.alert(
                    "视频加载失败",
                    "抱歉，视频加载失败，请稍后再试",
                    [{ text: "确定", style: "default" }]
                );
            } finally {
                setIsLoading(false);
            }
        };

        fetchVideoData();
    }, [post, videoId]);

    useEffect(() => {
        if (videoData !== null && user !== null) {
            setIsLoading(false);
        } else if (isInvalidVideo) {
            setIsLoading(false);
        }
    }, [videoData, user, isInvalidVideo]);

    const currentVideoId = videoData?.$id || null;
    const [commentsDoc, setCommentsDoc] = useComments(currentVideoId, refreshFlag);

    const onCommentSubmitted = (newComment) => {
        setCommentsDoc((prevComments) => [newComment, ...prevComments]);
    };

    const userId = user?.$id;

    const memoizedCommentView = useMemo(() => {
        if (!videoData || !user) return null;

        return (
            <CommentList
                userId={userId}
                videoId={videoData.$id}
                submitReply={submitReply}
                commentsDoc={commentsDoc}
                videoCreator={videoData.creator}
                fetchReplies={fetchReplies}
                setRefreshFlag={setRefreshFlag}
                fetchCommentUser={fetchCommentUser}
                fetchUsername={fetchCommentUsername}
                scrollToComment={commentId}
            />
        );
    }, [userId, videoData, commentId, commentsDoc, fetchReplies, submitReply]);

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#FF9C01" />
            </View>
        );
    }

    const handleBackPress = () => {
        if (router.canGoBack()) {
            router.back();
        } else {
            router.replace('/(drawer)/(tabs)/home');
        }
    };

    if (isInvalidVideo || !videoData) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                <TouchableOpacity
                    style={{
                        position: 'absolute',
                        top: insets.top + 10,
                        left: 10,
                        zIndex: 10,
                        padding: 5
                    }}
                    onPress={handleBackPress}
                >
                    <Ionicons name="arrow-back" size={28} color="#333" />
                </TouchableOpacity>
                <View style={{ padding: 20, backgroundColor: '#f8f8f8', borderRadius: 10 }}>
                    <Text>视频加载失败或已失效</Text>
                </View>
            </View>
        );
    }

    const videoCreator = videoData.creator;

    return fullscreen ? (
        <View style={[styles.container, { backgroundColor: fullscreen ? "black" : "#F5F5F5" }]}>
            <VideoPlayer
                videoPlayer={videoPlayer}
                fullscreen={fullscreen}
                setFullscreen={setFullscreen}
                toggleFullscreen={toggleFullscreen}
                safeAreaInset={insets.top}
                onBackPress={handleBackPress}
            />
        </View>
    ) : (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={0}
        >
            <ScrollView style={[styles.container, { backgroundColor: fullscreen ? "black" : "#F5F5F5" }]}>
                <VideoPlayer
                    videoPlayer={videoPlayer}
                    fullscreen={fullscreen}
                    setFullscreen={setFullscreen}
                    toggleFullscreen={toggleFullscreen}
                    safeAreaInset={insets.top}
                    onBackPress={handleBackPress}
                />

                <View className="flex-1">
                    <View className="px-2">
                        {user ? (
                            <CommentInputBox
                                userId={userId}
                                videoId={currentVideoId}
                                videoCreator={videoCreator}
                                onCommentSubmitted={onCommentSubmitted}
                            />
                        ) : (
                            <View style={{ padding: 10, alignItems: 'center' }}>
                                <Text>请登录后发表评论</Text>
                            </View>
                        )}
                    </View>

                    <View className="flex-1">
                        {memoizedCommentView}
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
