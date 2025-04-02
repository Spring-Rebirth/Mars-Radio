// cSpell:ignore Pressable
import { View, Text, Image, TouchableOpacity, Pressable, Alert, ActivityIndicator, Dimensions } from 'react-native'
import { useEffect, useState } from 'react'
import { icons } from '../constants'
import { useGlobalContext } from '../context/GlobalProvider'
import { StatusBar } from 'expo-status-bar';
import { formatNumberWithUnits, getRelativeTime } from '../utils/numberFormatter';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next'
import usePlaybackStore from '../store/playbackStore';
import { TapGestureHandler, State } from 'react-native-gesture-handler';

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
    <View className={`relative bg-primary ${isFullscreen ? 'flex-1 w-full h-full' : 'mb-7'}`}>
      {/* 在全屏模式下隐藏状态栏 */}
      {isFullscreen && <StatusBar hidden />}

      {/* 视频视图 */}
      <TapGestureHandler onHandlerStateChange={({ nativeEvent }) => {
        if (nativeEvent.state === State.ACTIVE) {
          handlePlay();
        }
      }}>
        <View
          className='w-full justify-center items-center relative overflow-hidden mb-2.5'
          style={{ height: thumbnailHeight }}
        >
          <Image
            source={{ uri: thumbnail }}
            className='w-full h-full'
            resizeMode={'cover'}
            onLoad={() => setImageLoaded(true)}
            onError={() => {
              setImageLoaded(false);
              console.log("Failed to load image.");
            }}
          />

          {!imageLoaded && (
            <ActivityIndicator size="large" color="#000" style={{
              position: 'absolute', top: '50%', left: '50%', transform: [{ translateX: -20 }, { translateY: -20 }]
            }} />
          )}
        </View>
      </TapGestureHandler>

      {/* 信息视图 */}
      <View className='flex-row mx-2 bg-primary'>
        <TapGestureHandler onHandlerStateChange={({ nativeEvent }) => {
          if (nativeEvent.state === State.ACTIVE) {
            router.push({ pathname: 'view-user', params: { creatorId, accountId } });
          }
        }}>
          <View>
            <Image
              source={{ uri: avatar }}
              className='w-[36px] h-[36px] border border-secondary rounded-full ml-2 mt-0.5'
            />
          </View>
        </TapGestureHandler>

        <TapGestureHandler onHandlerStateChange={({ nativeEvent }) => {
          if (nativeEvent.state === State.ACTIVE) {
            handlePlay();
          }
        }}>
          <View className='gap-y-1 justify-center flex-1 ml-5'>
            <Text className='text-black font-psemibold text-sm' numberOfLines={2}>
              {title}
            </Text>
            <Text className='text-[#808080] font-pregular text-xs' numberOfLines={2}>
              {username}  ·  {formatNumberWithUnits(playCount, t)} {t("views")}  ·  {getRelativeTime($createdAt, t)}
            </Text>
          </View>
        </TapGestureHandler>

        <TapGestureHandler onHandlerStateChange={({ nativeEvent }) => {
          if (nativeEvent.state === State.ACTIVE) {
            onMenuPress($id);
          }
        }}>
          <View>
            <Image
              source={icons.menu}
              className='w-5 h-5 mr-2 ml-3'
              resizeMode='contain'
            />
          </View>
        </TapGestureHandler>
      </View>

    </View >
  )
}