import React, { useEffect, useState, useRef } from "react";
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

const VideoPlayer = ({
    videoPlayer,
    fullscreen,
    setFullscreen,
    toggleFullscreen,
    safeAreaInset
}) => {
    const {
        playing,
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
    } = useVideoControls(videoPlayer);

    // 使用useEvent钩子监听播放状态变化
    const { isPlaying } = useEvent(videoPlayer, 'playingChange', { isPlaying: videoPlayer.playing });
    const { status, error } = useEvent(videoPlayer, 'statusChange', { status: videoPlayer.status });

    // 获取当前播放时间和总时长
    const { currentTime, bufferedPosition } = useEvent(videoPlayer, 'timeUpdate', {
        currentTime: videoPlayer.currentTime,
        bufferedPosition: videoPlayer.bufferedPosition
    });

    const videoRef = useRef(null);
    const videoContainerRef = useRef(null);
    const landscapeVideoHeight = (Dimensions.get("window").width * 9) / 16;
    const portraitVideoHeight = (Dimensions.get("window").width * 16) / 9;
    const [selectedVideoHeight, setSelectedVideoHeight] = useState(landscapeVideoHeight);
    const totalDuration = videoPlayer.duration || 1;

    // 添加视频尺寸检测，模拟原有onReadyForDisplay功能
    useEffect(() => {
        if (status === 'readyToPlay') {
            // 可以使用generateThumbnailsAsync获取一帧视频以检测尺寸比例
            const checkVideoRatio = async () => {
                try {
                    // 获取视频第一帧缩略图以确定视频真实尺寸
                    const thumbnails = await videoPlayer.generateThumbnailsAsync([0]);
                    if (thumbnails && thumbnails.length > 0) {
                        const { width, height } = thumbnails[0];
                        const ratio = width / height; // 计算宽高比
                        if (ratio < 1) {
                            // 如果宽度小于高度，说明是竖屏视频
                            setSelectedVideoHeight(portraitVideoHeight);
                        }
                    }
                } catch (error) {
                    console.error('检测视频尺寸失败:', error);
                }
            };

            checkVideoRatio();
        }
    }, [status, portraitVideoHeight]);

    // 监听状态变化
    useEffect(() => {
        if (status === 'loading') {
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

    const videoHeight = fullscreen ? "100%" : selectedVideoHeight;

    return (
        <TouchableWithoutFeedback onPress={onVideoPress}>
            <View
                ref={videoContainerRef}
                style={[
                    styles.videoContainer,
                    !fullscreen && { marginTop: safeAreaInset }
                ]}
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
                            color="#000"
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

                                <TouchableOpacity
                                    onPress={(e) => {
                                        e.stopPropagation();
                                        toggleFullscreen();
                                    }}
                                >
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