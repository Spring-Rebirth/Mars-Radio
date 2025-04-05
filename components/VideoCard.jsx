// cSpell:ignore Pressable
import { View, Text, Image, TouchableOpacity, Pressable, Alert, ActivityIndicator, Dimensions, ImageBackground } from 'react-native'
import { useEffect, useState, useRef } from 'react'
import { icons } from '../constants'
import { useGlobalContext } from '../context/GlobalProvider'
import { StatusBar } from 'expo-status-bar';
import { formatNumberWithUnits, getRelativeTime } from '../utils/numberFormatter';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next'
import usePlaybackStore from '../store/playbackStore';
import { TapGestureHandler, State } from 'react-native-gesture-handler';
import * as Animatable from "react-native-animatable";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from '@expo/vector-icons';

export default function VideoCard({
  post,
  isFullscreen,
  setIsVideoCreator,
  onMenuPress
}) {
  const thumbnailHeight = Dimensions.get('screen').width * 9 / 16;
  const { t } = useTranslation();
  const { $id, $createdAt, title, thumbnail, creator: { $id: creatorId, accountId, username, avatar } } = post;

  const { user } = useGlobalContext();
  const [imageLoaded, setImageLoaded] = useState(false);
  const updatePlaybackData = usePlaybackStore(state => state.updatePlaybackData);
  const playbackData = usePlaybackStore(state => state.playbackData);
  const [playCount, setPlayCount] = useState(post.played_counts || 0);

  useEffect(() => {
    if (setIsVideoCreator) {
      if (accountId === user?.accountId) {
        setIsVideoCreator(true);
      }
    }
  }, [user?.accountId, $id]);

  // cSpell:words cooldown
  const handlePlay = async () => {
    const currentTime = Date.now();
    const cooldownPeriod = 5 * 60 * 1000; // 5分钟

    const lastPlaybackTime = playbackData[$id]?.lastPlaybackTime || 0;

    if (currentTime - lastPlaybackTime > cooldownPeriod) {
      // 冷却时间已过，递增播放次数
      const newCount = playCount + 1;
      setPlayCount(newCount);

      // 更新播放数据并同步到后端
      updatePlaybackData($id, newCount);
    } else {
      console.log('冷却时间未过，播放次数不增加');
    }

    router.push({
      pathname: 'player/play-screen',
      params: {
        post: JSON.stringify(post)
      }
    });
  };

  return (
    <Animatable.View
      className={`relative bg-primary mx-4 ${isFullscreen ? 'flex-1 w-full h-full' : 'mb-7'}`}
    >
      {/* 在全屏模式下隐藏状态栏 */}
      {isFullscreen && <StatusBar hidden />}

      {/* 视频视图 */}
      <TapGestureHandler
        onHandlerStateChange={({ nativeEvent }) => {
          if (nativeEvent.state === State.ACTIVE) {
            handlePlay();
          }
        }}
        maxDist={10}
      >
        <View
          className="relative justify-center items-center w-full rounded-[16px] overflow-hidden shadow-md"
          style={{ height: thumbnailHeight }}
        >
          {/* 渐变背景 */}
          <LinearGradient
            colors={["#FFA500", "#FF69B4"]}
            className="absolute w-full h-full rounded-[16px]"
          />

          {/* 图片容器 */}
          <ImageBackground
            source={{ uri: thumbnail }}
            className="w-full h-full"
            resizeMode="cover"
            onLoad={() => setImageLoaded(true)}
            onError={() => {
              setImageLoaded(false);
              console.log("Failed to load image.");
            }}
          >
            {/* 底部渐变覆盖层 */}
            <LinearGradient
              colors={["transparent", "rgba(0, 0, 0, 0.7)"]}
              className="absolute bottom-0 w-full h-[40%]"
            />

            {/* 标题和视频信息 */}
            <View className="absolute bottom-3 left-3">
              <Text className="text-white font-psemibold text-base" numberOfLines={1}>
                {title}
              </Text>
              <View className="flex-row items-center">
                <Text className="text-gray-200 text-xs">
                  {username} · {formatNumberWithUnits(playCount, t)} {t("views")} · {getRelativeTime($createdAt, t)}
                </Text>
              </View>
            </View>
          </ImageBackground>

          {/* 加载动画 */}
          {!imageLoaded && (
            <ActivityIndicator
              size="large"
              color="#fff"
              className="absolute"
            />
          )}
        </View>
      </TapGestureHandler>

      {/* 用户头像 - 移到Pressable外部，防止点击事件冲突 */}
      <TapGestureHandler
        onHandlerStateChange={({ nativeEvent }) => {
          if (nativeEvent.state === State.ACTIVE) {
            router.push({ pathname: 'view-user', params: { creatorId, accountId } });
          }
        }}
        maxDist={10} // 限制最大移动距离，超过则不触发
        maxDurationMs={300} // 限制最大点击时间
      >
        <View className="absolute top-3 left-3 z-10">
          <Image
            source={{ uri: avatar }}
            className="w-[36px] h-[36px] border-2 border-white rounded-full"
          />
        </View>
      </TapGestureHandler>

      {/* 右上角操作按钮 - 移到Pressable外部，防止点击事件冲突 */}
      <TapGestureHandler
        onHandlerStateChange={({ nativeEvent }) => {
          if (nativeEvent.state === State.ACTIVE) {
            onMenuPress($id);
          }
        }}
        maxDist={10} // 限制最大移动距离，超过则不触发
        maxDurationMs={300} // 限制最大点击时间
      >
        <View className="absolute top-3 right-3 z-10 bg-[rgba(255,255,255,0.2)] p-2 rounded-full">
          <Ionicons name="ellipsis-vertical" size={20} color="#FFFFFF" />
        </View>
      </TapGestureHandler>
    </Animatable.View>
  )
}