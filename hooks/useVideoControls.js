import { useState, useRef, useEffect, useCallback } from 'react';

export default function useVideoControls() {
  const [playing, setPlaying] = useState(true);
  const [loading, setLoading] = useState(true);
  const [isEnded, setIsEnded] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const hideControlsTimer = useRef(null);

  const cleanupTimer = useCallback(() => {
    console.log("清理定时器");
    if (hideControlsTimer.current) {
      clearTimeout(hideControlsTimer.current);
      hideControlsTimer.current = null;
    }
  }, []);

  const showControlsWithTimer = useCallback(() => {
    console.log("显示控件并设置定时器");
    // 显示控件
    setShowControls(true);

    // 如果已经存在定时器，清除它
    cleanupTimer();

    // 启动新的定时器
    hideControlsTimer.current = setTimeout(() => {
      console.log("定时器执行：隐藏控件");
      setShowControls(false);
      hideControlsTimer.current = null; // 清除引用
    }, 5000);
  }, [cleanupTimer]);

  const replayVideo = useCallback(async (videoPlayer) => {
    if (videoPlayer) {
      try {
        console.log("重播视频");
        // 使用 expo-video 的 seekTo 和 play 方法
        videoPlayer.currentTime = 0;
        videoPlayer.play();

        setIsEnded(false);
        setLoading(false);
        setPlaying(true);
        showControlsWithTimer();
      } catch (error) {
        console.error('Error in replayVideo:', error);
      }
    }
  }, [showControlsWithTimer]);

  const handleClickedVideo = useCallback(() => {
    console.log("处理视频点击，当前控件状态:", showControls);

    // 处理点击显示-隐藏逻辑
    if (showControls) {
      // 如果控件正在显示，点击时隐藏控件并清除定时器
      console.log("隐藏控件");
      setShowControls(false);
      cleanupTimer();
    } else {
      // 如果控件未显示，显示控件并启动定时器
      console.log("显示控件");
      showControlsWithTimer();
    }
  }, [showControls, cleanupTimer, showControlsWithTimer]);

  return {
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
    cleanupTimer
  };
}