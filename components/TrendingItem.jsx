import { useState, useContext } from "react";
import {
  View,
  Image,
  Pressable,
  ImageBackground,
  ActivityIndicator,
  Alert,
} from "react-native";
import * as Animatable from "react-native-animatable";
import { GlobalContext, useGlobalContext } from "../context/GlobalProvider";
import { updateSavedCounts } from "../lib/appwrite";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useTranslation } from "react-i18next";
import Toast from "react-native-root-toast";
import star from "../assets/menu/star-solid.png";
import starTwo from "../assets/menu/star2.png";

export default function TrendingItem({ activeItem, item }) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const { user, setUser } = useGlobalContext();
  const { played_counts, $id } = item;
  const [isSaved, setIsSaved] = useState(user?.favorite.includes($id));
  const [playCount, setPlayCount] = useState(played_counts || 0);
  const { updatePlayData, playDataRef } = useContext(GlobalContext);
  const { t } = useTranslation();

  const zoomIn = {
    0: { scale: 1 },
    1: { scale: 1 },
  };
  const zoomOut = {
    0: { scale: 1 },
    1: { scale: 1 },
  };

  const handleAddSaved = async () => {
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
        Toast.show(t("Save successful"), {
          duration: Toast.durations.SHORT,
          position: Toast.positions.CENTER,
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

        Toast.show(t("Cancel save successfully"), {
          duration: Toast.durations.SHORT,
          position: Toast.positions.CENTER,
        });
      }
      await updateSavedCounts($id, isIncrement);
    } catch (error) {
      console.error("Error handling favorite:", error);
      Alert.alert("An error occurred while updating favorite count");
    }
  };

  const handlePlay = async () => {
    const currentTime = Date.now();
    const cooldownPeriod = 5 * 60 * 1000; // 5分钟

    const lastPlayTime = playDataRef.current[$id]?.lastPlayTime || 0;

    if (currentTime - lastPlayTime > cooldownPeriod) {
      // 冷却时间已过，递增播放次数
      const newCount = playCount + 1;
      setPlayCount(newCount);

      // 更新播放数据并同步到后端
      updatePlayData($id, newCount);
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

  return (
    <Animatable.View
      animation={activeItem.$id === item.$id ? zoomIn : zoomOut}
      duration={500}
      className="mr-4 relative rounded-4 overflow-hidden"
    >
      <Pressable
        onPress={handleAddSaved}
        className="absolute z-10 top-3 right-3"
      >
        {/* 星标图标（右上角） */}
        <View className="absolute top-2.5 right-2.5 bg-[rgba(255,255,255,0.1)] p-1.25 rounded-[12px]">
          <Image source={isSaved ? star : starTwo} className="w-6 h-6" />
        </View>
      </Pressable>

      <Pressable
        onPress={handlePlay}
        className="relative justify-center items-center w-[290px] h-[332px] rounded-[24px] overflow-hidden"
      >
        {/* 渐变背景 */}
        <LinearGradient
          colors={["#FFA500", "#FF69B4"]}
          className="absolute w-full h-full rounded-[24px]"
        />

        {/* 图片容器 */}
        <View className="w-full h-[50%] bg-[#2C3E5C]">
          <ImageBackground
            source={{ uri: item.thumbnail }}
            className="w-full h-full"
            resizeMode="cover"
            onLoad={() => setImageLoaded(true)}
            onError={() => {
              setImageLoaded(false);
              console.log("Failed to load image.");
            }}
          />
        </View>

        {/* 底部渐变覆盖层 */}
        <LinearGradient
          colors={["transparent", "rgba(0, 0, 0, 0.5)"]}
          className="absolute bottom-0 w-full h-[40%] rounded-b-[24px]"
        />

        {/* 加载动画 */}
        {!imageLoaded && (
          <ActivityIndicator
            size="large"
            color="#000"
            className="absolute top-1/2 left-1/2 -translate-x-5 -translate-y-5"
          />
        )}
      </Pressable>
    </Animatable.View>
  );
}
