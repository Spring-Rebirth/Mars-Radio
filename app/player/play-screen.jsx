import { View, Text, Dimensions, ActivityIndicator, StyleSheet } from 'react-native'
import React, { useEffect, useMemo, useState } from 'react'
import { useLocalSearchParams } from "expo-router";
import { Video, ResizeMode } from 'expo-av';
import { SafeAreaView } from 'react-native-safe-area-context';
import CommentInputBox from "../../components/comment/CommentInputBox";
import CommentView from "../../components/comment/CommentView";
import { config, databases } from "../../lib/appwrite";
import { Query } from "react-native-appwrite";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ID } from 'react-native-appwrite';
import { useGlobalContext } from '../../context/GlobalProvider';

export default function PlayScreen() {
    const { user } = useGlobalContext();
    const { post } = useLocalSearchParams();
    const parsedVideoUrl = post ? JSON.parse(post).video : null;
    const { $id: videoId } = JSON.parse(post);
    const { $id: userId, avatar, username } = user;

    const screenHeight = Dimensions.get('window').width * 9 / 16;
    const [playing, setPlaying] = useState(false);
    const [loading, setLoading] = useState(true);
    const [commentsDoc, setCommentsDoc] = useState([]);
    const [refreshFlag, setRefreshFlag] = useState(false);

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
            <CommentView
                userId={userId}
                videoId={videoId}
                avatar={avatar}
                username={username}
                commentsDoc={commentsDoc}
                fetchReplies={fetchReplies}
                submitReply={submitReply}
                setRefreshFlag={setRefreshFlag}
            />
        );
    }, [userId, videoId, avatar, username, commentsDoc, fetchReplies, submitReply]);

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.container}>
                    {loading && (
                        <>
                            <ActivityIndicator size="large" color="#fff" style={styles.activityIndicator} />
                            {!playing && (
                                <Text style={styles.loadingText}>Loading</Text>
                            )}
                        </>
                    )}
                    <Video
                        source={{ uri: parsedVideoUrl }}
                        style={[styles.video, { height: screenHeight }]}
                        resizeMode={ResizeMode.CONTAIN}
                        useNativeControls
                        shouldPlay
                        onPlaybackStatusUpdate={async (status) => {
                            if (status.isLoaded) {
                                setLoading(false);
                            }
                            if (status.didJustFinish) {
                                setPlaying(false);
                                setLoading(true);
                            }
                        }}
                    />
                    <View className={'px-6 mt-4'}>
                        <CommentInputBox
                            userId={userId}
                            videoId={videoId}
                            onCommentSubmitted={onCommentSubmitted}
                        />
                        {memoizedCommentView}
                    </View>
                </View>
            </SafeAreaView>
        </GestureHandlerRootView>
    )
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#161622', // adjust for your bg-primary color
    },
    container: {
        width: '100%',
        height: '100%',
        backgroundColor: '#161622', // adjust for your bg-primary color
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
        top: '5%',
        left: '50%',
        transform: [{ translateX: -40 }, { translateY: -10 }],
    },
    video: {
        width: '100%',
    },
});