// cSpell:ignore Pressable
import { View, Text, Image, TouchableOpacity, Pressable, Alert, ActivityIndicator } from 'react-native'
import { useEffect, useState, useContext } from 'react'
import { icons } from '../constants'
import star from '../assets/menu/star-solid.png'
import starThree from '../assets/menu/star3.png'
import trash from '../assets/menu/trash-solid.png'
import { GlobalContext, useGlobalContext } from '../context/GlobalProvider'
import { deleteVideoDoc, deleteVideoFiles } from '../lib/appwrite'
import { updateSavedCounts, getVideoDetails } from '../lib/appwrite';
import { StatusBar } from 'expo-status-bar';
import { formatNumberWithUnits, getRelativeTime } from '../utils/numberFormatter';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next'

export default function VideoCard({
  post,
  handleRefresh,
  isFullscreen,
  adminList
}) {
  const { t } = useTranslation();
  const { $id, $createdAt, title, thumbnail, creator: { $id: creatorId, accountId, username, avatar } } = post;

  const [showControlMenu, setShowControlMenu] = useState(false);

  const [isVideoCreator, setIsVideoCreator] = useState(false);
  const { user, setUser } = useGlobalContext();
  const [isSaved, setIsSaved] = useState(user?.favorite.includes($id));
  const [imageLoaded, setImageLoaded] = useState(false);

  const { updatePlayData, playDataRef } = useContext(GlobalContext);
  const [playCount, setPlayCount] = useState(post.played_counts || 0);

  // const route = useRoute();
  // const currentPath = route.name;
  let admin = adminList?.includes(user?.email);

  const handleAddSaved = async () => {
    try {
      let isIncrement;

      if (!user?.favorite.includes($id)) {
        // 深拷贝对象
        const newUser = JSON.parse(JSON.stringify(user));
        newUser.favorite.push($id);
        setUser(prev => ({
          ...prev,
          favorite: newUser.favorite
        }))
        setIsSaved(prevIsSaved => {
          console.log("Saving, previous isSaved:", prevIsSaved);
          return true;
        });
        isIncrement = true;
        Alert.alert('Save successful');
      } else {
        // 剔除已保存项的新数组
        const updatedItems = user?.favorite.filter(item => item !== $id);
        setUser(prev => ({
          ...prev,
          favorite: updatedItems
        }))
        setIsSaved(prevIsSaved => {
          console.log("Removing, previous isSaved:", prevIsSaved);
          return false;
        });
        isIncrement = false;
        Alert.alert('Cancel save successfully');
      }
      await updateSavedCounts($id, isIncrement);
    } catch (error) {
      console.error("Error handling favorite:", error);
      Alert.alert('An error occurred while updating favorite count');
    }
  }

  const handleClickSave = () => {
    console.log("Before click, isSaved:", isSaved); // Debugging
    setShowControlMenu(false);
    handleAddSaved();
  }

  const handleDelete = async () => {
    setShowControlMenu(false);

    try {
      // 假设 getVideoDetails 从数据库获取视频详细信息
      const videoDetails = await getVideoDetails($id);
      const { image_ID, video_ID } = videoDetails;

      if (image_ID && video_ID) {
        await Promise.all([
          deleteVideoDoc($id), // 删除视频文档
          deleteVideoFiles(image_ID), // 删除图片文件
          deleteVideoFiles(video_ID)  // 删除视频文件
        ]);
        console.log("删除成功");
        handleRefresh();
        Alert.alert('Delete Success');
      } else {
        console.log("未找到与该视频关联的文件 ID");
        Alert.alert('File ID not found');
      }
    } catch (error) {
      console.error("删除过程中出错:", error);
    }
  }

  useEffect(() => {
    if (accountId === user.accountId) {
      setIsVideoCreator(true);
    }
  }, [user.accountId, $id]);

  // cSpell:words cooldown
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
    <View className={`relative bg-primary ${isFullscreen ? 'flex-1 w-full h-full' : 'my-3 '}`}>
      {/* 在全屏模式下隐藏状态栏 */}
      {isFullscreen && <StatusBar hidden />}

      {/* 视频视图 */}
      <TouchableOpacity
        className='w-full h-56 justify-center items-center relative overflow-hidden mb-1.5' // 添加 overflow-hidden
        activeOpacity={0.7}
        onPress={handlePlay}
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

      </TouchableOpacity>

      {!isFullscreen && (
        <>
          {/* 菜单弹窗 */}
          {showControlMenu ? (
            <View
              className='absolute right-3 bottom-[63px] bg-primary w-40 h-auto rounded-md z-10 px-6 py-0'
            >
              <Pressable
                onPress={handleClickSave}
                className='w-full h-12 flex-row items-center'
              >
                <Image
                  source={isSaved ? star : starThree}
                  className='w-6 h-6 mr-3'
                />
                <Text className='text-[#333333] text-lg'>
                  {isSaved ? 'Saved' : 'Save'}
                </Text>
              </Pressable>

              {(isVideoCreator || admin === true) ? (
                <Pressable
                  onPress={handleDelete}
                  className='w-full h-12 flex-row items-center'
                >
                  <Image
                    source={trash}
                    className='w-5 h-5 mr-3'
                  />
                  <Text className='text-black text-lg'>Delete</Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}

          {/* 信息视图 */}
          <View className='flex-row mt-1 mx-2 bg-primary'>
            <TouchableOpacity onPress={() => {
              router.push({ pathname: 'view-user', params: { creatorId, accountId } });
            }}>
              <Image
                source={{ uri: avatar }}
                className='w-[40px] h-[40px] border border-secondary rounded-full ml-2 mt-0.5'
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handlePlay}
              className='gap-y-1 justify-center flex-1 ml-5'
            >
              <Text className='text-black font-psemibold text-sm' numberOfLines={2}>
                {title}
              </Text>
              <Text className='text-[#808080] font-pregular text-xs' numberOfLines={1}>
                {username}  ·  {formatNumberWithUnits(playCount, t)} {t("views")}  ·  {getRelativeTime($createdAt, t)}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setShowControlMenu(prev => !prev)}>
              <Image
                source={icons.menu}
                className='w-5 h-5 mr-2 ml-3'
                resizeMode='contain'
              />
            </TouchableOpacity>
          </View>
          {/* 一条适合在白色背景显示颜色很浅的的线 */}
          <View className='w-screen h-[1] bg-gray-200 absolute -bottom-3' />
        </>
      )}
    </View >
  )
}