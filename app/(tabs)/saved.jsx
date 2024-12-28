//cSpell:words psemibold appwrite
import { View, Text, FlatList, Image, ActivityIndicator, RefreshControl, Pressable } from 'react-native'
import React, { useEffect, useState, useRef } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { images } from '../../constants'
import SearchInput from '../../components/SearchInput'
import VideoCard from '../../components/VideoCard'
import useGetData from '../../hooks/useGetData'
import { StatusBar } from 'expo-status-bar'
import { useGlobalContext } from '../../context/GlobalProvider'
import { useTranslation } from "react-i18next";
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet'
import Toast from 'react-native-root-toast'
import { updateSavedCounts } from '../../lib/appwrite'
import star from '../../assets/menu/star-solid.png'
import starThree from '../../assets/menu/star3.png'
import closeIcon from '../../assets/icons/close.png'
import { useFocusEffect } from 'expo-router'

export default function Saved() {
  const insetTop = useSafeAreaInsets().top;
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [savedPostsData, setSavedPostsData] = useState([]);
  const { fetchSavedPosts } = useGetData({ setLoading, setSavedPostsData });
  const { user, setUser } = useGlobalContext();
  const { t } = useTranslation();
  const bottomSheetRef = useRef(null);
  const [showControlMenu, setShowControlMenu] = useState(false);
  const [selectedVideoId, setSelectedVideoId] = useState(null);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (showControlMenu) {
      bottomSheetRef.current?.expand()
    } else {
      bottomSheetRef.current?.close()
    }
  }, [showControlMenu])

  useFocusEffect(
    React.useCallback(() => {
      return () => {
        bottomSheetRef.current?.close()
      }
    }, [])
  )

  const handleAddSaved = async () => {
    try {
      let isIncrement
      if (!user?.favorite.includes(selectedVideoId)) {
        const newUser = JSON.parse(JSON.stringify(user))
        newUser.favorite.push(selectedVideoId)
        setUser((prev) => ({ ...prev, favorite: newUser.favorite }))
        setIsSaved(true)
        isIncrement = true
        Toast.show('Save successful', {
          duration: Toast.durations.SHORT,
          position: Toast.positions.CENTER
        });

      } else {
        const updatedItems = user?.favorite.filter((item) => item !== selectedVideoId)
        setUser((prev) => ({ ...prev, favorite: updatedItems }))
        setIsSaved(false)
        isIncrement = false
        Toast.show('Cancel save successfully', {
          duration: Toast.durations.SHORT,
          position: Toast.positions.CENTER
        });
      }
      await updateSavedCounts(selectedVideoId, isIncrement)
    } catch (error) {
      console.error('Error handling favorite:', error)
      Alert.alert('An error occurred while updating favorite count')
    }
  }

  const handleClickSave = () => {
    setShowControlMenu(false)
    handleAddSaved()
  }

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchSavedPosts(user?.favorite);
    setRefreshing(false);
  }

  useEffect(() => {
    fetchSavedPosts(user?.favorite);
  }, [user])

  return (
    <GestureHandlerRootView className='bg-primary h-full' style={{ marginTop: insetTop }}>
      <FlatList
        data={loading ? [] : savedPostsData}
        // item 是 data 数组中的每一项
        keyExtractor={(item) => item.$id}
        contentContainerStyle={{ paddingBottom: 44 }}
        ListHeaderComponent={() => {
          return (
            <View className='my-6 px-4'>

              <View className='flex-row justify-between items-center mt-4 h-[60px]'>
                <View >
                  <Text className='text-black text-2xl font-psemibold'>{t("Saved Videos")}</Text>
                </View>
                <Image
                  source={images.logoSmall}
                  className='w-9 h-10'
                  resizeMode='contain'
                />
              </View>

              <SearchInput containerStyle={'mt-6'} />

            </View>
          );
        }}
        // renderItem 接受一个对象参数，通常解构为 { item, index, separators }
        renderItem={({ item }) => {
          return (
            <VideoCard
              post={item}
              onMenuPress={(videoId) => {
                setSelectedVideoId(videoId)
                setIsSaved(user?.favorite.includes(videoId))
                setShowControlMenu((prev) => !prev)
              }}
            />
          )
        }}
        ListEmptyComponent={() => {
          return loading ? (
            <View className="flex-1 justify-center items-center bg-primary">
              <ActivityIndicator size="large" color="#000" />
              <Text className='mt-[10] text-black text-xl'>{t("Loading, please wait...")}</Text>
            </View>
          ) : (
            <View className='items-center'>
              <Image
                source={images.empty}
                className='w-[270px] h-[215px]'
                resizeMode='contain'
              />
              <Text className='mt-2 text-black font-psemibold text-xl'>{t("No Videos Saved")}</Text>
            </View>
          );
        }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      />

      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={[275]}
        enablePanDownToClose={true}
        onClose={() => setShowControlMenu(false)}
      >
        <BottomSheetView>
          <View className='relative bg-white w-full h-auto rounded-md z-10 px-6 py-0 space-y-1 mx-auto'>

            <Pressable
              onPress={() => setShowControlMenu(false)}
              className='z-20 items-end'
            >
              <Image
                source={closeIcon}
                className='w-6 h-6'
                resizeMode='contain'
              />
            </Pressable>

            <Pressable onPress={handleClickSave} className='w-full h-12 flex-row items-center'>
              <Image
                source={isSaved ? star : starThree}
                className='w-6 h-6 mr-8'
              />
              <Text className='text-[#333333] text-lg'>
                {isSaved ? 'Cancel save video' : 'Save video'}
              </Text>
            </Pressable>

          </View>
        </BottomSheetView>
      </BottomSheet>

      <StatusBar style='dark' />
    </GestureHandlerRootView>
  )
}





