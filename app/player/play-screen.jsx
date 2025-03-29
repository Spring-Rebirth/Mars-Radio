import {
    View,
    ScrollView,
} from "react-native";
import React, { useEffect, useMemo, useState } from "react";
import { useLocalSearchParams } from "expo-router";
import { useVideoPlayer } from "expo-video";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import CommentInputBox from "../../components/comment/CommentInputBox";
import CommentList from "../../components/comment/CommentList";
import { useGlobalContext } from "../../context/GlobalProvider";
import {
    fetchReplies,
    fetchCommentUser,
    fetchCommentUsername,
    submitReply,
} from "../../services/commentService";
import useComments from "../../hooks/useComments";
import VideoPlayer from "../../components/player/VideoPlayer";
import useScreenOrientation from "../../hooks/useScreenOrientation";
import styles from "../../styles/player/styles";
// cSpell: ignore Millis

export default function PlayScreen() {
    const { user } = useGlobalContext();
    const { post, commentId } = useLocalSearchParams();
    const parsedVideoUrl = post ? JSON.parse(post).video : null;
    const targetCommentId = commentId;
    const { $id: videoId, creator: videoCreator } = JSON.parse(post);
    const { $id: userId, avatar, username } = user;

    // 创建视频播放器实例
    const videoPlayer = useVideoPlayer(parsedVideoUrl, player => {
        // 初始化播放器
        player.play();
    });

    const { fullscreen, setFullscreen, toggleFullscreen } = useScreenOrientation();
    const [refreshFlag, setRefreshFlag] = useState(false);
    const [commentsDoc, setCommentsDoc] = useComments(videoId, refreshFlag);

    const [safeAreaInsets, setSafeAreaInsets] = useState({ top: 0, bottom: 0 });
    const insets = useSafeAreaInsets();

    useEffect(() => {
        // 初始化时仅设置一次
        setSafeAreaInsets({ top: insets.top, bottom: insets.bottom });
    }, []);

    const onCommentSubmitted = (newComment) => {
        setCommentsDoc((prevComments) => [newComment, ...prevComments]);
    };

    const memoizedCommentView = useMemo(() => {
        return (
            <CommentList
                userId={userId}
                videoId={videoId}
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
    }, [userId, videoId, avatar, username, commentsDoc, fetchReplies, submitReply, targetCommentId]);

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
                        videoId={videoId}
                        videoCreator={videoCreator}
                        onCommentSubmitted={onCommentSubmitted}
                    />
                </View>
                <View className="flex-1">{memoizedCommentView}</View>
            </View>
        </ScrollView>
    );
}
