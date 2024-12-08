import { View, Dimensions, ActivityIndicator, StyleSheet, Image, TouchableOpacity, StatusBar, TouchableWithoutFeedback } from 'react-native'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useLocalSearchParams } from "expo-router";
import { Video, ResizeMode } from 'expo-av';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CommentInputBox from "../../components/comment/CommentInputBox";
import CommentList from "../../components/comment/CommentList";
import { useGlobalContext } from '../../context/GlobalProvider';
import * as ScreenOrientation from 'expo-screen-orientation';
import replayIcon from '../../assets/icons/replay.png';
import playbackIcon from '../../assets/icons/playback.png';
import pauseIcon from '../../assets/icons/pause.png';
import Slider from '@react-native-community/slider';
import { fetchReplies, fetchCommentUser, fetchCommentUsername, submitReply } from '../../services/commentService';
import useVideoControls from '../../hooks/useVideoControls';
import useComments from '../../hooks/useComments';
import fullscreenIcon from '../../assets/icons/fullscreen.png';
import exitFullscreenIcon from '../../assets/icons/exit-fullscreen.png';
// cSpell: ignore Millis

export default function PlayScreen() {
  const { user } = useGlobalContext();
  const { post, commentId } = useLocalSearchParams();
  const parsedVideoUrl = post ? JSON.parse(post).video : null;
  const targetCommentId = commentId;
  const { $id: videoId, creator: videoCreator } = JSON.parse(post);
  const { $id: userId, avatar, username } = user;

  const { playing, setPlaying, loading, setLoading, isEnded, setIsEnded, showControls,
    setShowControls, replayVideo, handleClickedVideo, showControlsWithTimer, hideControlsTimer
  } = useVideoControls(videoRef);

  const videoRef = useRef(null);
  const screenHeight = Dimensions.get('window').width * 9 / 16;
  const [refreshFlag, setRefreshFlag] = useState(false);
  const [commentsDoc, setCommentsDoc] = useComments(videoId, refreshFlag);
  const [fullscreen, setFullscreen] = useState(false);
  const [playbackStatus, setPlaybackStatus] = useState({});
  const currentProgress = playbackStatus.positionMillis || 0; // 当前播放位置（毫秒）
  const totalDuration = playbackStatus.durationMillis || 1;    // 视频总时长（毫秒）

  const [safeAreaInsets, setSafeAreaInsets] = useState({ top: 0, bottom: 0, left: 0, right: 0 });
  const insets = useSafeAreaInsets();
  const safeAreaInset = safeAreaInsets.top;

  const handlePlaybackStatusUpdate = () => {
    if (playbackStatus.isLoaded) {
      // 当视频已加载时，根据是否正在缓冲更新 loading 状态
      setLoading(false);
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

  const toggleFullscreen = async () => {
    if (fullscreen) {
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT);
      setFullscreen(false);
    } else {
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
      setFullscreen(true);
    }
  }

  useEffect(() => {
    return () => {
      const lockPortrait = async () => {
        try {
          await ScreenOrientation.lockAsync(
            ScreenOrientation.OrientationLock.PORTRAIT_UP
          );
        } catch (error) {
          console.error('Failed to lock orientation to portrait:', error);
        }
      };

      lockPortrait();
    };
  }, []);

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
    const subscribe = async () => {
      await ScreenOrientation.unlockAsync(); // 解锁屏幕方向限制
      const subscription = ScreenOrientation.addOrientationChangeListener((event) => {
        const orientation = event.orientationInfo.orientation;

        if (
          orientation === ScreenOrientation.Orientation.LANDSCAPE_LEFT ||
          orientation === ScreenOrientation.Orientation.LANDSCAPE_RIGHT
        ) {
          setFullscreen(true);
        } else if (
          orientation === ScreenOrientation.Orientation.PORTRAIT_UP ||
          orientation === ScreenOrientation.Orientation.PORTRAIT_DOWN
        ) {
          setFullscreen(false);
        }
      });

      // 清理监听器
      return () => {
        if (subscription && subscription.remove) {
          subscription.remove(); // 新版本推荐的移除方式
        } else {
          ScreenOrientation.removeOrientationChangeListeners(); // 旧版本移除方式
        }
      };
    };

    subscribe(); // 注册订阅
  }, []);

  useEffect(() => {
    const updateStatusBar = () => {
      StatusBar.setHidden(fullscreen);
    };
    updateStatusBar();

    return () => StatusBar.setHidden(false);
  }, [fullscreen]);

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
        scrollToComment={targetCommentId} // 传递用于滚动的评论ID
      />
    );
  }, [userId, videoId, avatar, username, commentsDoc, fetchReplies, submitReply, targetCommentId]);

  return (
    <View style={[styles.container, {
      backgroundColor: fullscreen ? 'black' : '#F5F5F5'
    }]}>

      <View className='relative' style={{ marginTop: fullscreen ? 0 : safeAreaInset }}>
        <TouchableWithoutFeedback onPress={handleClickedVideo}>
          <Video
            ref={videoRef}
            source={{ uri: parsedVideoUrl }}
            style={[
              styles.video,
              { height: fullscreen ? '100%' : screenHeight },
            ]}
            resizeMode={ResizeMode.CONTAIN}
            useNativeControls={false}
            shouldPlay={playing}
            isLooping={false}
            onPlaybackStatusUpdate={status => setPlaybackStatus(() => status)}
          />
        </TouchableWithoutFeedback>

        {loading && (
          <ActivityIndicator
            size="large"
            color="#000"
            style={[
              styles.activityIndicator,
              {
                top: '50%',
                transform: [{ translateX: -20 }, { translateY: -20 }]
              }
            ]}
          />
        )}

        {isEnded && (
          <TouchableOpacity onPress={() => replayVideo(videoRef)}
            style={fullscreen ? styles.replayIconContainerFS : styles.replayIconContainer}
          >
            <Image
              source={replayIcon}
              style={styles.replayIcon}
              resizeMode="contain"
            />
          </TouchableOpacity>
        )}

        {showControls && (
          <>
            {/* 播放/暂停按钮 */}
            <TouchableOpacity
              style={[styles.controlButton]} // 根据 fullscreen 状态调整样式
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

            <View
              style={[
                fullscreen ? styles.bottomBarFS : styles.bottomBar,
                !fullscreen && { bottom: '5%', left: 0 },
              ]}
            >
              <Slider
                style={fullscreen ? styles.sliderFS : styles.slider}
                value={currentProgress}
                onValueChange={() => { }} // value => 控制视频进度(value)
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
              <TouchableOpacity onPress={toggleFullscreen}>
                <Image
                  source={fullscreen ? exitFullscreenIcon : fullscreenIcon}
                  className={`${fullscreen
                    ? 'w-6 h-6 mr-3'
                    : 'w-4 h-4 mr-4'
                    }`}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>

      <View className={'flex-1 mt-4'}>
        <View className='px-6'>
          <CommentInputBox
            userId={userId}
            videoId={videoId}
            videoCreator={videoCreator}
            onCommentSubmitted={onCommentSubmitted}
          />
        </View>
        <View className='flex-1'>
          {memoizedCommentView}
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
  },
  activityIndicator: {
    zIndex: 10,
    position: 'absolute',
    left: '50%',
  },
  replayIconContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    zIndex: 1, // 确保图标在最前面
    transform: [{ translateX: -15 }, { translateY: -15 }],
  },
  replayIconContainerFS: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    zIndex: 1, // 确保图标在最前面
    transform: [{ translateX: -15 }, { translateY: -15 }],
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
    top: '50%',
    left: '50%',
    zIndex: 10, // 确保按钮在视频之上
    transform: [{ translateX: -20 }, { translateY: -20 }],
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
    width: '78%',
    position: 'absolute',
    marginHorizontal: '11%',
    bottom: 10, // 距底部的距离
    height: 40, // 固定高度
    paddingHorizontal: 15, // 左右内边距
    zIndex: 10, // 确保在视频上方
    flexDirection: 'row', // 水平布局
    gap: 5, // 间距
    borderRadius: 20,
    alignItems: 'center', // 垂直居中
    justifyContent: 'center', // 水平居中
  },
  sliderFS: {
    flex: 1,  // 设置Slider的宽度
    height: 40,  // 设置Slider的高度
    marginVertical: 10, // 可选，调整Slider的上下间距
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