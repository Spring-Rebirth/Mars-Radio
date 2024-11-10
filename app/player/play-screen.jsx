import { View, Text, Dimensions, ActivityIndicator, StyleSheet, Image, TouchableOpacity, StatusBar, TouchableWithoutFeedback } from 'react-native'
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
import * as ScreenOrientation from 'expo-screen-orientation';
import replayIcon from '../../assets/icons/replay.png';
import fullscreenIcon from '../../assets/icons/fullscreen.png';
import exitFullscreenIcon from '../../assets/icons/exit-fullscreen.png';
import playbackIcon from '../../assets/icons/playback.png';
import pauseIcon from '../../assets/icons/pause.png';
import Slider from '@react-native-community/slider';

export default function PlayScreen() {
    const { user } = useGlobalContext();
    const { post } = useLocalSearchParams();
    const parsedVideoUrl = post ? JSON.parse(post).video : null;
    const { $id: videoId } = JSON.parse(post);
    const { $id: userId, avatar, username } = user;

    const videoRef = useRef(null);
    const screenHeight = Dimensions.get('window').width * 9 / 16;
    const [playing, setPlaying] = useState(true);
    const [loading, setLoading] = useState(true);
    const [isEnded, setIsEnded] = useState(false);
    const [commentsDoc, setCommentsDoc] = useState([]);
    const [refreshFlag, setRefreshFlag] = useState(false);
    const [fullscreen, setFullscreen] = useState(false);
    const [playbackStatus, setPlaybackStatus] = useState({});
    const currentProgress = playbackStatus.positionMillis || 0; // 当前播放位置（毫秒）
    const totalDuration = playbackStatus.durationMillis || 1;    // 视频总时长（毫秒）
    const [showControls, setShowControls] = useState(false);
    const hideControlsTimer = useRef(null);

    const [safeAreaInsets, setSafeAreaInsets] = useState({ top: 0, bottom: 0, left: 0, right: 0 });
    const insets = useSafeAreaInsets();
    const safeAreaInset = -safeAreaInsets.top / 2;

    const handleEnterFullscreen = async () => {
        try {
            await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
            setFullscreen(true);
        } catch (error) {
            console.error('Error in handleEnterFullscreen:', error);
        }
    };

    const handleExitFullscreen = async () => {
        try {
            await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT);
            setFullscreen(false);
        } catch (error) {
            console.error('Error in handleExitFullscreen:', error);
        }
    };

    const handlePlaybackStatusUpdate = () => {
        if (playbackStatus.isLoaded) {
            // 当视频已加载时，根据是否正在缓冲更新 loading 状态
            setLoading(playbackStatus.isBuffering);
        } else {
            // 视频尚未加载，保持 loading 为 true
            setLoading(true);
        }

        if (playbackStatus.didJustFinish) {
            console.log("视频结束");
            setPlaying(false);
            setLoading(false);
            setIsEnded(true);
        }
        // 您可以在这里添加更多对 playbackStatus 的处理
    };

    useEffect(() => {
        if (playbackStatus) {
            handlePlaybackStatusUpdate();
        }
    }, [playbackStatus]);

    useEffect(() => {
        // 初始化时仅设置一次
        setSafeAreaInsets({
            top: insets.top,
            bottom: insets.bottom,
            left: insets.left,
            right: insets.right
        });
    }, []);

    useEffect(() => {
        const lockOrientation = async () => {
            try {
                await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT);
            } catch (error) {
                console.error('Error locking orientation:', error);
            }
        };

        lockOrientation();

        return () => {
            const unlockOrientation = async () => {
                try {
                    await ScreenOrientation.unlockAsync();
                } catch (error) {
                    console.error('Error unlocking orientation:', error);
                }
            };

            unlockOrientation();
        };
    }, []);

    useEffect(() => {
        const updateStatusBar = () => {
            StatusBar.setHidden(fullscreen);
        };
        updateStatusBar();

        return () => StatusBar.setHidden(false);
    }, [fullscreen]);

    useEffect(() => {
        let isMounted = true;

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
                if (isMounted && result.documents) {
                    setCommentsDoc(result.documents);
                }
            } catch (error) {
                if (isMounted) {
                    console.error('Error fetching comments:', error);
                }
            }
        };

        fetchComments();

        return () => {
            isMounted = false;
        };
    }, [refreshFlag]);

    const showControlsWithTimer = () => {
        // 显示控件
        setShowControls(true);

        // 如果已经存在定时器，清除它
        if (hideControlsTimer.current) {
            clearTimeout(hideControlsTimer.current);
        }

        // 启动新的定时器
        hideControlsTimer.current = setTimeout(() => {
            setShowControls(false);
            hideControlsTimer.current = null; // 清除引用
        }, 3000);
    };


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

    const replayVideo = async () => {
        if (videoRef.current) {
            try {
                await videoRef.current.replayAsync();
                setIsEnded(false);
                setLoading(false);
                setPlaying(true);
            } catch (error) {
                console.error('Error in replayVideo:', error);
            }
        }
    };

    const handleClickedVideo = () => {
        if (showControls) {
            // 如果控件正在显示，点击时隐藏控件并清除定时器
            setShowControls(false);
            if (hideControlsTimer.current) {
                clearTimeout(hideControlsTimer.current);
                hideControlsTimer.current = null;
            }
        } else {
            // 如果控件未显示，调用 showControlsWithTimer() 显示控件并启动定时器
            showControlsWithTimer();
        }
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={[styles.container, { backgroundColor: fullscreen ? 'black' : '#F5F5F5' }]}>
                {loading && (
                    <ActivityIndicator
                        size="large"
                        color="#fff"
                        style={[
                            styles.activityIndicator,
                            {
                                top: fullscreen ? '50%' : '10%',
                                transform: fullscreen ? [{ translateX: -34 }, { translateY: -20 }] : [{ translateX: -20 }]
                            }
                        ]}
                    />
                )}

                {isEnded && (
                    <TouchableOpacity onPress={replayVideo}
                        style={fullscreen ? styles.replayIconContainerFS : styles.replayIconContainer}
                    >
                        <Image
                            source={replayIcon}
                            style={styles.replayIcon}
                            resizeMode="contain"
                        />
                    </TouchableOpacity>
                )}
                <TouchableWithoutFeedback onPress={handleClickedVideo}>
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
                        shouldPlay={playing}
                        onPlaybackStatusUpdate={status => setPlaybackStatus(() => status)}
                    />
                </TouchableWithoutFeedback>

                {fullscreen ? (
                    showControls && (
                        <>
                            {/* 播放/暂停按钮 */}
                            <TouchableOpacity
                                style={[styles.controlButton, {
                                    top: '50%', left: '50%', transform: [{ translateX: -34 }, { translateY: -20 }]
                                }]} // 定位到视频上方
                                onPress={() => {
                                    setPlaying(prev => !prev);
                                    showControlsWithTimer();
                                }} // 添加点击事件来控制播放暂停
                            >
                                <Image
                                    source={playing ? pauseIcon : playbackIcon}
                                    style={{ width: '100%', height: '100%' }}
                                    resizeMode="contain"
                                />
                            </TouchableOpacity>

                            <View style={[styles.bottomBarFS, { left: safeAreaInset }]}>
                                <Slider
                                    style={styles.sliderFS}
                                    value={currentProgress}
                                    onValueChange={() => { }}  // value => 控制视频进度(value)
                                    minimumValue={0}
                                    maximumValue={totalDuration}
                                    minimumTrackTintColor="#87CEEB"
                                    maximumTrackTintColor="#FFFFFF"
                                    trackStyle={styles.trackStyle}
                                    thumbTouchSize={{ width: 40, height: 50 }}
                                    onSlidingStart={() => {
                                        // 用户开始滑动，显示控件并清除隐藏定时器
                                        if (hideControlsTimer.current) {
                                            clearTimeout(hideControlsTimer.current);
                                            hideControlsTimer.current = null;
                                        }
                                        setShowControls(true);
                                    }}
                                    onSlidingComplete={async value => {
                                        if (videoRef.current != null && playbackStatus.isLoaded) {
                                            await videoRef.current.setPositionAsync(value);
                                        }
                                        showControlsWithTimer();
                                    }}
                                />
                                <TouchableOpacity onPress={handleExitFullscreen}
                                    className='justify-center items-center w-14 h-14'
                                >
                                    <Image
                                        source={exitFullscreenIcon}
                                        style={{ width: 20, height: 20 }}
                                        resizeMode="contain"
                                    />
                                </TouchableOpacity>
                            </View>
                        </>
                    )
                ) : (
                    showControls && (
                        <>
                            {/* 播放/暂停按钮 */}
                            <TouchableOpacity
                                style={[styles.controlButton, { top: '10%', left: '50%' }]} // 定位到视频上方
                                onPress={() => {
                                    setPlaying(prev => !prev);
                                    showControlsWithTimer();
                                }} // 添加点击事件来控制播放暂停
                            >
                                <Image
                                    source={playing ? pauseIcon : playbackIcon}
                                    style={{ width: '100%', height: '100%' }}
                                    resizeMode="contain"
                                />
                            </TouchableOpacity>

                            <View style={[styles.bottomBar, { top: '20.0%', left: 0 }]}>
                                <Slider
                                    style={styles.slider}
                                    value={currentProgress}
                                    onValueChange={() => { }}  // value => 控制视频进度(value)
                                    minimumValue={0}
                                    maximumValue={totalDuration}
                                    minimumTrackTintColor="#87CEEB"
                                    maximumTrackTintColor="#FFFFFF"
                                    trackStyle={styles.trackStyle}
                                    thumbTouchSize={{ width: 40, height: 50 }}
                                    onSlidingStart={() => {
                                        // 用户开始滑动，显示控件并清除隐藏定时器
                                        if (hideControlsTimer.current) {
                                            clearTimeout(hideControlsTimer.current);
                                            hideControlsTimer.current = null;
                                        }
                                        setShowControls(true);
                                    }}
                                    onSlidingComplete={async value => {
                                        if (videoRef.current != null && playbackStatus.isLoaded) {
                                            await videoRef.current.setPositionAsync(value);
                                        }
                                        showControlsWithTimer();
                                    }}
                                />
                                <TouchableOpacity onPress={handleEnterFullscreen}
                                    className='justify-center items-center w-10 h-10'
                                >
                                    <Image
                                        source={fullscreenIcon}
                                        style={{ width: 15, height: 15 }}
                                        resizeMode="contain"
                                    />
                                </TouchableOpacity>
                            </View>
                        </>
                    )
                )
                }

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
        backgroundColor: '#F5F5F5', // adjust for your bg-primary color
    },
    container: {
        width: '100%',
        height: '100%',
    },
    activityIndicator: {
        zIndex: 10,
        position: 'absolute',
        left: '50%',
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
    replayIconContainerFS: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        zIndex: 1, // 确保图标在最前面
        transform: [{ translateX: -15 - 14 }, { translateY: -15 }],
    },
    replayIcon: {
        width: 30,
        height: 30,
    },
    fullscreenIcon: {
        width: 20,
        height: 20,
        marginLeft: 10, // 添加适当的间距
    },
    exitFullscreenIcon: {
        width: 20,
        height: 20,
    },
    video: {
        width: '100%',
    },
    // 增加一半的偏移量
    controlButton: {
        position: 'absolute', // 让按钮浮动在视频上
        zIndex: 10, // 确保按钮在视频之上
        transform: [{ translateX: -20 }],
        backgroundColor: 'white',
        width: 40,
        height: 40,
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 0,
        justifyContent: 'center',
        alignItems: 'center',
    },
    bottomBar: {
        backgroundColor: 'rgba(50, 50, 50, 0.7)',
        width: '95%',
        position: 'absolute',
        zIndex: 20,
        flexDirection: 'row',
        alignItems: 'center', // 垂直居中
        justifyContent: 'center', // 水平居中
        paddingHorizontal: 5, // 左右内边距
        gap: 5,
        borderRadius: 20,
        marginHorizontal: '2.5%',
    },
    bottomBarFS: {
        backgroundColor: 'rgba(50, 50, 50, 0.7)',
        width: '90%',
        position: 'absolute',
        bottom: 15, // 距底部的距离
        right: 0,
        height: 40, // 固定高度
        alignItems: 'center', // 垂直居中
        justifyContent: 'center', // 水平居中
        paddingHorizontal: 15, // 左右内边距
        zIndex: 10, // 确保在视频上方
        flexDirection: 'row', // 水平布局
        gap: 5, // 间距
        borderRadius: 20,
        marginHorizontal: '5%', // 左右外边距
    },
    sliderFS: {
        flex: 1,  // 设置Slider的宽度
        height: 40,  // 设置Slider的高度
        marginVertical: 10, // 可选，调整Slider的上下间距
        marginLeft: -15,
    },
    slider: {
        flex: 1,  // 设置Slider的宽度
        height: 10,  // 设置Slider的高度
        marginVertical: 10, // 可选，调整Slider的上下间距
    },
    trackStyle: {
        height: 4, // 设置进度条的高度
        borderRadius: 2, // 圆角效果
    },
});