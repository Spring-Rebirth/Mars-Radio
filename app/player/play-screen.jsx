import {
    View,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Alert,
    TouchableOpacity,
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
// cSpell: ignore Millis

export default function PlayScreen() {
    const { user } = useGlobalContext();
    const { post, commentId, videoId } = useLocalSearchParams();
    const [videoData, setVideoData] = useState(null);
    const [isInvalidVideo, setIsInvalidVideo] = useState(false);
    const { $id: userId, avatar, username } = user;
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [safeAreaInsets, setSafeAreaInsets] = useState({ top: insets.top, bottom: insets.bottom });

    // 加载视频数据
    useEffect(() => {
        const fetchVideoData = async () => {
            try {
                // 如果直接传递了post对象，则直接使用
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

                // 如果传递了videoId，则通过API获取视频详情
                if (videoId) {
                    const videoDetails = await getVideoDetails(videoId);
                    if (videoDetails) {
                        setVideoData(videoDetails);
                        return;
                    } else {
                        console.error("无法获取视频详情，videoId:", videoId);
                    }
                }

                // 如果两种方式都失败了，标记视频为无效
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
            }
        };

        fetchVideoData();
    }, [post, videoId]);

    // 如果视频数据未加载且不是因为视频无效，显示加载状态
    // 如果是因为视频无效，返回一个简单的提示界面
    if (!videoData) {
        if (isInvalidVideo) {
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
                        onPress={() => router.back()}
                    >
                        <Ionicons name="arrow-back" size={28} color="#333" />
                    </TouchableOpacity>
                    <View style={{ padding: 20, backgroundColor: '#f8f8f8', borderRadius: 10 }}>
                        <View style={{ marginBottom: 15, alignItems: 'center' }}>
                            <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: '#e0e0e0', justifyContent: 'center', alignItems: 'center', marginBottom: 10 }}>
                                <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: '#c0c0c0' }} />
                            </View>
                            <View style={{ height: 24, width: 200, backgroundColor: '#e0e0e0', borderRadius: 4 }} />
                        </View>
                        <View style={{ height: 16, width: 250, backgroundColor: '#e0e0e0', borderRadius: 4, marginBottom: 8 }} />
                        <View style={{ height: 16, width: 200, backgroundColor: '#e0e0e0', borderRadius: 4 }} />
                    </View>
                </View>
            );
        }
        return null;
    }

    const parsedVideoUrl = videoData.video;
    const targetCommentId = commentId;
    const currentVideoId = videoData.$id;
    const videoCreator = videoData.creator;

    // 创建视频播放器实例
    const videoPlayer = useVideoPlayer(parsedVideoUrl, player => {
        // 初始化播放器
        player.play();
    });

    const { fullscreen, setFullscreen, toggleFullscreen } = useScreenOrientation();
    const [refreshFlag, setRefreshFlag] = useState(false);
    const [commentsDoc, setCommentsDoc] = useComments(currentVideoId, refreshFlag);

    const onCommentSubmitted = (newComment) => {
        setCommentsDoc((prevComments) => [newComment, ...prevComments]);
    };

    const memoizedCommentView = useMemo(() => {
        return (
            <CommentList
                userId={userId}
                videoId={currentVideoId}
                submitReply={submitReply}
                commentsDoc={commentsDoc}
                videoCreator={videoCreator}
                fetchReplies={fetchReplies}
                setRefreshFlag={setRefreshFlag}
                fetchCommentUser={fetchCommentUser}
                fetchUsername={fetchCommentUsername}
                scrollToComment={targetCommentId} // 传递用于滚动的评论ID
            />
        );
    }, [userId, currentVideoId, avatar, username, commentsDoc, fetchReplies, submitReply, targetCommentId]);

    return fullscreen ? (
        <View style={[styles.container, { backgroundColor: fullscreen ? "black" : "#F5F5F5" }]}>
            <VideoPlayer
                videoPlayer={videoPlayer}
                fullscreen={fullscreen}
                setFullscreen={setFullscreen}
                toggleFullscreen={toggleFullscreen}
                safeAreaInset={safeAreaInsets.top}
            />
        </View>
    ) : (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={0}
        >
            <TouchableOpacity
                style={{
                    position: 'absolute',
                    top: safeAreaInsets.top + 10,
                    left: 10,
                    zIndex: 10,
                    padding: 5,
                    backgroundColor: 'rgba(0,0,0,0.3)',
                    borderRadius: 20
                }}
                onPress={() => router.back()}
            >
                <Ionicons name="arrow-back" size={28} color="#fff" />
            </TouchableOpacity>

            <ScrollView style={[styles.container, { backgroundColor: fullscreen ? "black" : "#F5F5F5" }]}>
                <VideoPlayer
                    videoPlayer={videoPlayer}
                    fullscreen={fullscreen}
                    setFullscreen={setFullscreen}
                    toggleFullscreen={toggleFullscreen}
                    safeAreaInset={safeAreaInsets.top}
                />

                <View className="flex-1">
                    <View className="px-2">
                        <CommentInputBox
                            userId={userId}
                            videoId={currentVideoId}
                            videoCreator={videoCreator}
                            onCommentSubmitted={onCommentSubmitted}
                        />
                    </View>

                    <View className="flex-1">
                        {memoizedCommentView}
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
