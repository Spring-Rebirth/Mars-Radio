import { View, Text, Dimensions, ActivityIndicator, StyleSheet, Image, TouchableOpacity } from 'react-native'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useLocalSearchParams } from "expo-router";
import { Video, ResizeMode } from 'expo-av';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import CommentInputBox from "../../components/comment/CommentInputBox";
import CommentList from "../../components/comment/CommentList";
import { config, databases } from "../../lib/appwrite";
import { Query } from "react-native-appwrite";
import { ID } from 'react-native-appwrite';
import { useGlobalContext } from '../../context/GlobalProvider';
import replayIcon from '../../assets/icons/replay.png';
import fullscreenIcon from '../../assets/icons/fullscreen.png';
import * as ScreenOrientation from 'expo-screen-orientation';

export default function PlayScreen() {
    const { user } = useGlobalContext();
    const { post } = useLocalSearchParams();
    const parsedVideoUrl = post ? JSON.parse(post).video : null;
    const { $id: videoId } = JSON.parse(post);
    const { $id: userId, avatar, username } = user;

    const screenHeight = Dimensions.get('window').width * 9 / 16;
    const [playing, setPlaying] = useState(false);
    const [loading, setLoading] = useState(true);
    const videoRef = useRef(null);
    const [isEnded, setIsEnded] = useState(false);
    const [commentsDoc, setCommentsDoc] = useState([]);
    const [refreshFlag, setRefreshFlag] = useState(false);
    const [fullscreen, setFullscreen] = useState(false);

    const insets = useSafeAreaInsets();
    const safeAreaInset = -insets.top / 2;
    console.log('headerInset:', safeAreaInset);
    const handleEnterFullscreen = async () => {
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
        setFullscreen(true);
    };

    const handleExitFullscreen = async () => {
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT);
    };

    useEffect(() => {
        const fetchComments = async () => {
            try {
                const result = await databases.listDocuments(
                    config.databaseId,
                    config.commentsCollectionId,
                    [
                        Query.equal('video_ID', videoId),
                        Query.equal('parent_comment_ID', ""),
                        Query.orderDesc('$createdAt')
                    ],
                );
                if (result.documents) {
                    setCommentsDoc(result.documents);
                }
            } catch (error) {
                console.error('Error fetching comments:', error);
            }
        }

        fetchComments();
    }, [refreshFlag]);

    const fetchCommentUsername = async (userId) => {
        try {
            const user = await databases.getDocument(
                config.databaseId,
                config.usersCollectionId,
                userId
            );
            return user.username;
        } catch (error) {
            console.error('Failed to fetch username:', error);
        }
    }
    const fetchReplies = async (parentCommentId) => {
        try {
            const replies = await databases.listDocuments(
                config.databaseId,
                config.commentsCollectionId,
                [
                    Query.equal("parent_comment_ID", parentCommentId)
                ]
            );
            return replies.documents; // 返回子评论数组
        } catch (error) {
            console.error("Failed to fetch replies:", error);
            return [];
        }
    };

    const fetchCommentUser = async (userId) => {
        try {
            const user = await databases.getDocument(
                config.databaseId,
                config.usersCollectionId,
                userId
            );
            return user;
        } catch (error) {
            console.error('Failed to fetch user:', error);
        }
    }

    const submitReply = async (content, parentCommentId) => {
        try {
            await databases.createDocument(
                config.databaseId,
                config.commentsCollectionId,
                ID.unique(),
                {
                    content: content,
                    parent_comment_ID: parentCommentId,
                    user_ID: userId,
                    video_ID: videoId,
                }
            );
            console.log('Reply submitted successfully');
        } catch (error) {
            console.error('Failed to submit reply:', error);
        }
    };

    const onCommentSubmitted = (newComment) => {
        setCommentsDoc((prevComments) => [newComment, ...prevComments]);
    };

    const memoizedCommentView = useMemo(() => {
        return (
            <CommentList
                userId={userId}
                videoId={videoId}
                commentsDoc={commentsDoc}
                fetchUsername={fetchCommentUsername}
                fetchReplies={fetchReplies}
                submitReply={submitReply}
                setRefreshFlag={setRefreshFlag}
                fetchCommentUser={fetchCommentUser}
            />
        );
    }, [userId, videoId, avatar, username, commentsDoc, fetchReplies, submitReply]);

    const handlePlaybackStatusUpdate = (status) => {
        if (status.isLoaded) {
            setLoading(false);
        }
        if (status.didJustFinish) {
            console.log("视频结束");
            setPlaying(false);
            setLoading(false);
            setIsEnded(true);
        }

    };

    const replayVideo = async () => {
        if (videoRef.current) {
            await videoRef.current.replayAsync(); // 重播视频
            setIsEnded(false); // 重置状态
            setLoading(false); // 重置 loading 状态
            setPlaying(true); // 设置播放状态
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={[styles.container, { backgroundColor: fullscreen ? 'black' : '#161622' }]}>
                {loading && (
                    <>
                        <ActivityIndicator size="large" color="#fff" style={styles.activityIndicator} />
                        {!playing && (
                            <Text style={styles.loadingText}>Loading</Text>
                        )}
                    </>
                )}
                {isEnded && (
                    <TouchableOpacity onPress={replayVideo} style={styles.replayIconContainer}>
                        <Image
                            source={replayIcon}
                            style={styles.replayIcon}
                            resizeMode="contain"
                        />
                    </TouchableOpacity>
                )}

                <Video
                    ref={videoRef}
                    source={{ uri: parsedVideoUrl }}
                    style={[
                        styles.video,
                        { height: fullscreen ? '100%' : screenHeight },
                        { marginLeft: fullscreen ? safeAreaInset : 0 }
                    ]}
                    resizeMode={ResizeMode.CONTAIN}
                    useNativeControls={false}
                    shouldPlay
                    onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
                />

                <TouchableOpacity
                    onPress={handleEnterFullscreen}
                    className='absolute top-44 right-4'
                >
                    <Image
                        source={fullscreenIcon}
                        style={styles.fullscreenIcon}
                        resizeMode="contain"
                    />
                </TouchableOpacity>

                <View className={'mt-4'}>
                    <View className='px-6'>
                        <CommentInputBox
                            userId={userId}
                            videoId={videoId}
                            onCommentSubmitted={onCommentSubmitted}
                        />
                    </View>
                    {memoizedCommentView}
                </View>
            </View>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#161622', // adjust for your bg-primary color
    },
    container: {
        width: '100%',
        height: '100%'
    },
    activityIndicator: {
        position: 'absolute',
        top: '10%',
        left: '50%',
        transform: [{ translateX: -20 }, { translateY: -20 }],
    },
    loadingText: {
        color: '#fff',
        fontSize: 20,
        position: 'absolute',
        top: '3%',
        left: '50%',
        transform: [{ translateX: -40 }, { translateY: -10 }],
    },
    replayIconContainer: {
        position: 'absolute',
        top: '10%',
        left: '50%',
        zIndex: 1, // 确保图标在最前面
        transform: [{ translateX: -15 }, { translateY: 0 }],
    },
    replayIcon: {
        width: 30,
        height: 30,
    },
    fullscreenIcon: {
        width: 20,
        height: 20,
    },
    video: {
        width: '100%',
    }
});