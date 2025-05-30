import { useState, useRef } from "react";
import {
  View,
  Text,
  Image,
  Pressable,
  ImageBackground,
  ActivityIndicator,
  Alert,
  Dimensions,
} from "react-native";
import * as Animatable from "react-native-animatable";
import { useGlobalContext } from "../context/GlobalProvider";
import { updateSavedCounts } from "../lib/appwrite";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useTranslation } from "react-i18next";
import Toast from "react-native-toast-message";
import star from "../assets/menu/star-solid.png";
import starTwo from "../assets/menu/star2.png";
import usePlaybackStore from "../store/playbackStore";

export default function TrendingItem({ activeItem, item }) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const { user, setUser } = useGlobalContext();
  const { played_counts, $id, title } = item;
  const [isSaved, setIsSaved] = useState(user?.favorite.includes($id));
  const [playCount, setPlayCount] = useState(played_counts || 0);
  const updatePlaybackData = usePlaybackStore(state => state.updatePlaybackData);
  const playbackData = usePlaybackStore(state => state.playbackData);
  const { t } = useTranslation();

  // 用于跟踪触摸事件的状态
  const touchStartRef = useRef({ x: 0, y: 0 });
  const isTouchMovedRef = useRef(false);

  const zoomIn = {
    0: { scale: 1 },
    1: { scale: 1.02 },
  };
  const zoomOut = {
    0: { scale: 1.02 },
    1: { scale: 1 },
  };

  const handleAddSaved = async (e) => {
    // 阻止事件冒泡，避免触发卡片点击
    e.stopPropagation();

    try {
      let isIncrement;

      if (!user?.favorite.includes($id)) {
        // 深拷贝对象
        const newUser = JSON.parse(JSON.stringify(user));
        newUser.favorite.push($id);
        setUser((prev) => ({
          ...prev,
          favorite: newUser.favorite,
        }));
        setIsSaved(true);
        isIncrement = true;
        Toast.show({
          text1: t("Save successful"),
          type: "success",
          topOffset: 68,
        });
      } else {
        // 剔除已保存项的新数组
        const updatedItems = user?.favorite.filter((item) => item !== $id);
        setUser((prev) => ({
          ...prev,
          favorite: updatedItems,
        }));

        setIsSaved(false);
        isIncrement = false;

        Toast.show({
          text1: t("Cancel save successfully"),
          type: "success",
          topOffset: 68,
        });
      }
      await updateSavedCounts($id, isIncrement);
    } catch (error) {
      console.error("Error handling favorite:", error);
      Alert.alert("An error occurred while updating favorite count");
    }
  };

  const handlePlay = async () => {
    // 如果检测到滑动，不触发播放
    if (isTouchMovedRef.current) {
      return;
    }

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
      console.log("冷却时间未过，播放次数不增加");
    }

    router.push({
      pathname: "player/play-screen",
      params: {
        post: JSON.stringify(item),
      },
    });
  };

  // 记录触摸开始位置
  const handleTouchStart = (event) => {
    const { pageX, pageY } = event.nativeEvent;
    touchStartRef.current = { x: pageX, y: pageY };
    isTouchMovedRef.current = false;
  };

  // 判断是否滑动
  const handleTouchMove = (event) => {
    const { pageX, pageY } = event.nativeEvent;
    const { x, y } = touchStartRef.current;

    // 计算移动距离
    const deltaX = Math.abs(pageX - x);
    const deltaY = Math.abs(pageY - y);

    // 如果移动距离超过阈值，判定为滑动
    if (deltaX > 5 || deltaY > 5) {
      isTouchMovedRef.current = true;
    }
  };

  return (
    <Animatable.View
      animation={activeItem && activeItem.$id === item.$id ? zoomIn : zoomOut}
      duration={500}
      className="mx-4 relative rounded-[16px] overflow-hidden"
    >
      <Pressable
        onPress={handlePlay}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        delayPressIn={50}
        className="relative justify-center items-center w-full rounded-[16px] overflow-hidden shadow-md"
        style={{ height: 180 }}
      >
        {/* 渐变背景 */}
        <LinearGradient
          colors={["#FFA500", "#FF69B4"]}
          className="absolute w-full h-full rounded-[16px]"
        />

        {/* 图片容器 */}
        <ImageBackground
          source={{ uri: item.thumbnail }}
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

          {/* 标题 */}
          {title && (
            <View className="absolute bottom-3 left-3">
              <Text className="text-white font-psemibold text-base" numberOfLines={1}>
                {title}
              </Text>
              <Text className="text-gray-200 text-xs">
                {t("Played")}: {playCount}
              </Text>
            </View>
          )}

          {/* 收藏按钮 */}
          <Pressable
            onPress={handleAddSaved}
            className="absolute top-3 right-3 bg-[rgba(255,255,255,0.2)] p-2 rounded-full"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Image source={isSaved ? star : starTwo} className="w-5 h-5" />
          </Pressable>
        </ImageBackground>

        {/* 加载动画 */}
        {!imageLoaded && (
          <ActivityIndicator
            size="large"
            color="#fff"
            className="absolute"
          />
        )}
      </Pressable>
    </Animatable.View>
  );
}
