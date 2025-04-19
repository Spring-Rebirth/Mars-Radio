import React, { useEffect, useState, useRef, useCallback } from "react";
import {
    View,
    TouchableOpacity,
    ActivityIndicator,
    Image,
    Text,
    Dimensions,
    Platform,
    TouchableWithoutFeedback,
} from "react-native";
import { VideoView } from "expo-video";
import { useEvent } from "expo";
import Slider from "@react-native-community/slider";
import useVideoControls from "../../hooks/useVideoControls";
import { formatTime } from "../../functions/format";
import replayIcon from "../../assets/icons/replay.png";
import playbackIcon from "../../assets/icons/playback.png";
import pauseIcon from "../../assets/icons/pause.png";
import fullscreenIcon from "../../assets/icons/fullscreen.png";
import exitFullscreenIcon from "../../assets/icons/exit-fullscreen.png";
import styles from "../../styles/player/styles";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const VideoPlayer = ({
    videoPlayer,
    fullscreen,
    setFullscreen,
    toggleFullscreen,
    safeAreaInset,
    onBackPress
}) => {
    const {
        setPlaying,
        loading,
        setLoading,
        isEnded,
        setIsEnded,
        showControls,
        setShowControls,
        replayVideo,
        handleClickedVideo,
        showControlsWithTimer,
        hideControlsTimer,
    } = useVideoControls();

    // 使用useEvent钩子监听播放状态变化
    const { isPlaying } = useEvent(videoPlayer, 'playingChange', { isPlaying: videoPlayer.playing });
    const { status, error } = useEvent(videoPlayer, 'statusChange', { status: videoPlayer.status });

    // 获取当前播放时间和总时长
    const { currentTime, bufferedPosition } = useEvent(videoPlayer, 'timeUpdate', {
        currentTime: videoPlayer.currentTime,
        bufferedPosition: videoPlayer.bufferedPosition
    });

    const router = useRouter();
    const videoRef = useRef(null);
    const videoContainerRef = useRef(null);
    const landscapeVideoHeight = (Dimensions.get("window").width * 9) / 16;
    const portraitVideoHeight = (Dimensions.get("window").width * 16) / 9;
    const [selectedVideoHeight, setSelectedVideoHeight] = useState(landscapeVideoHeight);
    const totalDuration = videoPlayer.duration || 1;
    const previousFullscreen = useRef(fullscreen);
    const ratioCheckAttempts = useRef(0);

    // 检测视频比例并设置合适的高度
    const checkVideoRatio = useCallback(async () => {
        if (!videoPlayer) return;

        try {
            console.log("检测视频比例，当前状态:", status);

            // 确保视频已加载并准备好
            if (status !== 'readyToPlay') {
                console.log("视频尚未准备好，使用默认高度");
                setSelectedVideoHeight(landscapeVideoHeight);
                return;
            }

            // 获取视频时长作为备用检测方法
            const duration = videoPlayer.duration;
            console.log("视频时长:", duration);

            try {
                // 尝试获取视频第一帧缩略图以确定视频真实尺寸
                console.log("尝试生成缩略图...");
                const thumbnails = await videoPlayer.generateThumbnailsAsync([0]);

                if (thumbnails && thumbnails.length > 0) {
                    const { width, height } = thumbnails[0];
                    console.log("获取到缩略图尺寸:", width, "x", height);

                    const ratio = width / height; // 计算宽高比
                    console.log("视频宽高比:", ratio);

                    if (ratio < 1) {
                        // 如果宽度小于高度，说明是竖屏视频
                        console.log("检测到竖屏视频，设置竖屏高度");
                        setSelectedVideoHeight(portraitVideoHeight);
                    } else {
                        // 横屏视频
                        console.log("检测到横屏视频，设置横屏高度");
                        setSelectedVideoHeight(landscapeVideoHeight);
                    }
                    // 成功检测到比例，重置尝试次数
                    ratioCheckAttempts.current = 0;
                    return;
                } else {
                    console.warn("未能获取到有效的缩略图");
                }
            } catch (thumbnailError) {
                console.warn("生成缩略图失败:", thumbnailError);
            }

            // 如果获取缩略图失败，尝试备用方法 - 检查视频原生尺寸属性
            if (videoPlayer.naturalSize && videoPlayer.naturalSize.width && videoPlayer.naturalSize.height) {
                const { width, height } = videoPlayer.naturalSize;
                console.log("使用原生尺寸:", width, "x", height);

                const ratio = width / height;
                console.log("原生尺寸宽高比:", ratio);

                if (ratio < 1) {
                    console.log("检测到竖屏视频(原生尺寸)，设置竖屏高度");
                    setSelectedVideoHeight(portraitVideoHeight);
                } else {
                    console.log("检测到横屏视频(原生尺寸)，设置横屏高度");
                    setSelectedVideoHeight(landscapeVideoHeight);
                }
                ratioCheckAttempts.current = 0;
                return;
            }

            // 如果都失败了且尝试次数小于3，计划稍后再次尝试
            if (ratioCheckAttempts.current < 3) {
                ratioCheckAttempts.current += 1;
                console.log(`未能检测到视频比例，将在1秒后重试 (${ratioCheckAttempts.current}/3)`);

                setTimeout(() => {
                    checkVideoRatio();
                }, 1000);
            } else {
                console.warn("多次尝试检测视频比例失败，使用默认横屏模式");
                setSelectedVideoHeight(landscapeVideoHeight);
                ratioCheckAttempts.current = 0;
            }
        } catch (error) {
            console.warn('检测视频尺寸完全失败:', error);
            // 默认使用横屏模式高度
            setSelectedVideoHeight(landscapeVideoHeight);
        }
    }, [videoPlayer, portraitVideoHeight, landscapeVideoHeight, status]);

    // 监听全屏状态变化，确保退出全屏时正确重置布局
    useEffect(() => {
        if (previousFullscreen.current && !fullscreen) {
            // 从全屏退出到竖屏，重新计算视频尺寸
            console.log("退出全屏，重新计算视频布局");
            ratioCheckAttempts.current = 0; // 重置尝试次数
            checkVideoRatio();

            // 如果在iOS上，可能需要额外延迟以确保布局正确更新
            if (Platform.OS === 'ios') {
                const timer = setTimeout(() => {
                    checkVideoRatio();
                }, 300); // 增加延迟时间
                return () => clearTimeout(timer);
            }
        }

        previousFullscreen.current = fullscreen;
    }, [fullscreen, checkVideoRatio]);

    // 添加视频尺寸检测，模拟原有onReadyForDisplay功能
    useEffect(() => {
        if (status === 'readyToPlay') {
            console.log("视频已准备好播放，开始检测视频比例");
            ratioCheckAttempts.current = 0; // 重置尝试次数
            checkVideoRatio();

            // 为确保视频比例检测成功，添加延迟后的再次检测
            const timer = setTimeout(() => {
                if (ratioCheckAttempts.current === 0) {
                    console.log("延迟检测视频比例");
                    checkVideoRatio();
                }
            }, 500);

            return () => clearTimeout(timer);
        }
    }, [status, checkVideoRatio]);

    // 监听状态变化
    useEffect(() => {
        if (status === 'loading' || status === 'idle') {
            setLoading(true);
        } else if (status === 'readyToPlay') {
            setLoading(false);
        } else if (status === 'error') {
            console.error('视频加载错误:', error);
        }
    }, [status, error]);

    // 监听播放状态变化
    useEffect(() => {
        setPlaying(isPlaying);
    }, [isPlaying]);

    // 监听播放结束事件
    useEffect(() => {
        const subscription = videoPlayer.addListener('playToEnd', () => {
            console.log("视频结束");
            setPlaying(false);
            setLoading(false);
            setIsEnded(true);
        });

        return () => {
            subscription.remove();
        };
    }, [videoPlayer]);

    useEffect(() => {
        // 设置播放器更新间隔
        videoPlayer.timeUpdateEventInterval = 0.5; // 0.5秒更新一次
    }, []);

    const changeVideoProgress = async (value) => {
        if (videoPlayer && status === 'readyToPlay') {
            videoPlayer.currentTime = value;
        }
    };

    // 手动处理视频点击
    const onVideoPress = () => {
        console.log("视频被点击，当前控件状态:", showControls, "视频结束状态:", isEnded);
        if (isEnded) {
            replayVideo(videoPlayer);
            return;
        }
        // 使用handleClickedVideo来切换控件显示/隐藏状态
        handleClickedVideo();
    };

    // 自定义全屏切换处理
    const handleToggleFullscreen = useCallback((e) => {
        e.stopPropagation();
        console.log("切换全屏状态:", !fullscreen);
        toggleFullscreen();
    }, [fullscreen, toggleFullscreen]);

    const videoHeight = fullscreen ? "100%" : selectedVideoHeight;

    // 视频容器样式，仅在非全屏模式下应用顶部安全区域
    const containerStyle = [
        styles.videoContainer,
        !fullscreen && { marginTop: safeAreaInset }
    ];

    return (
        <TouchableWithoutFeedback onPress={onVideoPress}>
            <View
                ref={videoContainerRef}
                style={containerStyle}
            >
                {/* 视频层 */}
                <View style={[styles.videoLayer, { height: videoHeight }]}>
                    <VideoView
                        ref={videoRef}
                        player={videoPlayer}
                        style={styles.video}
                        contentFit="contain"
                        nativeControls={false}
                        allowsFullscreen={true}
                        onFullscreenEnter={() => setFullscreen(true)}
                        onFullscreenExit={() => setFullscreen(false)}
                    />
                </View>

                {/* 控件层 - 绝对定位在视频上方 */}
                <View style={[styles.controlsLayer, { height: videoHeight }]}>
                    {loading && (
                        <ActivityIndicator
                            size="large"
                            color="#fff"
                            style={[
                                styles.activityIndicator,
                                { top: "50%", transform: [{ translateX: -20 }, { translateY: -20 }] },
                            ]}
                        />
                    )}

                    {isEnded && (
                        <TouchableOpacity
                            onPress={() => replayVideo(videoPlayer)}
                            style={
                                fullscreen ? styles.replayIconContainerFS : styles.replayIconContainer
                            }
                        >
                            <Image
                                source={replayIcon}
                                style={styles.replayIcon}
                                resizeMode="contain"
                            />
                        </TouchableOpacity>
                    )}

                    {showControls && !isEnded && (
                        <>
                            {/* 返回按钮 */}
                            <TouchableOpacity
                                onPress={onBackPress}
                                className="absolute top-4 left-4 z-10 p-2"
                            >
                                <Ionicons name="arrow-back" size={24} color="white" />
                            </TouchableOpacity>

                            {/* 播放/暂停按钮 */}
                            <TouchableOpacity
                                style={[styles.controlButton]}
                                onPress={(e) => {
                                    e.stopPropagation();
                                    if (isPlaying) {
                                        videoPlayer.pause();
                                    } else {
                                        videoPlayer.play();
                                    }
                                    showControlsWithTimer();
                                }}
                            >
                                <Image
                                    source={isPlaying ? pauseIcon : playbackIcon}
                                    style={{ width: "100%", height: "100%" }}
                                    resizeMode="contain"
                                />
                            </TouchableOpacity>

                            <View
                                style={[
                                    fullscreen ? styles.bottomBarFS : styles.bottomBar,
                                ]}
                            >
                                <Text style={fullscreen ? styles.timeTextFS : styles.timeText}>
                                    {formatTime(currentTime * 1000)}
                                    <Text
                                        style={
                                            fullscreen ? styles.totalTimeTextFS : styles.totalTimeText
                                        }
                                    >
                                        {" "}
                                        / {formatTime(totalDuration * 1000)}
                                    </Text>
                                </Text>

                                <Slider
                                    style={fullscreen ? styles.sliderFS : styles.slider}
                                    value={currentTime}
                                    minimumValue={0}
                                    maximumValue={totalDuration}
                                    minimumTrackTintColor="#87CEEB"
                                    maximumTrackTintColor="#FFFFFF"
                                    trackStyle={styles.trackStyle}
                                    thumbTouchSize={{ width: 40, height: 50 }}
                                    onSlidingStart={(e) => {
                                        // 用户开始滑动，显示控件并清除隐藏定时器
                                        if (hideControlsTimer.current) {
                                            clearTimeout(hideControlsTimer.current);
                                            hideControlsTimer.current = null;
                                        }
                                        setShowControls(true);
                                    }}
                                    onValueChange={changeVideoProgress}
                                    onSlidingComplete={() => {
                                        showControlsWithTimer();
                                    }}
                                />

                                <TouchableOpacity onPress={handleToggleFullscreen}>
                                    <Image
                                        source={fullscreen ? exitFullscreenIcon : fullscreenIcon}
                                        style={styles.fullscreenIcon}
                                        resizeMode="contain"
                                    />
                                </TouchableOpacity>
                            </View>
                        </>
                    )}
                </View>
            </View>
        </TouchableWithoutFeedback>
    );
};

export default VideoPlayer; 