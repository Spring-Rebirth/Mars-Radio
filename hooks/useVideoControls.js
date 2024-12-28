import { useState, useRef } from 'react';

export default function useVideoControls(videoRef) {
  const [playing, setPlaying] = useState(true);
  const [loading, setLoading] = useState(true);
  const [isEnded, setIsEnded] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const hideControlsTimer = useRef(null);

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
    }, 5000);
  };

  const replayVideo = async (videoRef) => {
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
    hideControlsTimer
  };
}