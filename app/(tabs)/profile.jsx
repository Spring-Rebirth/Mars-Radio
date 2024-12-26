import { View, Text, FlatList, Image, ActivityIndicator, TouchableOpacity, RefreshControl, Alert, Pressable } from 'react-native'
import { useEffect, useState, useRef } from 'react'
import useGetData from '../../hooks/useGetData'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { useGlobalContext } from '../../context/GlobalProvider'
import EmptyState from '../../components/EmptyState'
import CustomButton from '../../components/CustomButton'
import VideoCard from '../../components/VideoCard'
import { icons } from '../../constants'
import { router } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { getCurrentUser } from '../../lib/appwrite'
import settingIcon from '../../assets/menu/setting.png'
import SettingModal from '../../components/modal/SettingModal'
import { useTranslation } from "react-i18next";
import notifyIcon from '../../assets/menu/notify.png'
import editIcon from '../../assets/icons/edit.png'
import { useAuth } from '@clerk/clerk-expo'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet'
import Toast from 'react-native-root-toast'
import { updateSavedCounts, getVideoDetails } from '../../lib/appwrite'
import star from '../../assets/menu/star-solid.png'
import starThree from '../../assets/menu/star3.png'
import trash from '../../assets/menu/trash-solid.png'
import { deleteVideoDoc, deleteVideoFiles } from '../../lib/appwrite'

export default function profile() {
  const insetTop = useSafeAreaInsets().top;
  const { userId } = useAuth();
  const [userPostsData, setUserPostsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const { fetchUserPosts } = useGetData({ setLoading, setUserPostsData });
  const { user, setUser, setIsLoggedIn, handleLogout } = useGlobalContext();
  const [refreshing, setRefreshing] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [settingModalVisible, setSettingModalVisible] = useState(false);
  const { t } = useTranslation();
  const bottomSheetRef = useRef(null)
  const [showControlMenu, setShowControlMenu] = useState(false)
  const [selectedVideoId, setSelectedVideoId] = useState(null)

  useEffect(() => {
    setLoading(true);

    if (user?.$id) {
      fetchUserPosts(user.$id)
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }

  }, [user?.$id, user?.avatar])

  useEffect(() => {
    if (showControlMenu) {
      bottomSheetRef.current?.expand()
    } else {
      bottomSheetRef.current?.close()
    }
  }, [showControlMenu])

  const handleSignOut = async () => {
    try {
      setIsTransitioning(true); // 设置跳转状态，防止渲染未准备好的页面

      await handleLogout();

      // 更新状态
      setUser(null);
      setIsLoggedIn(false);
    } catch (error) {
      console.error('Sign out failed:', error);
      Alert.alert('Error', 'Failed to sign out. Please try again.');
      setIsTransitioning(false); // 如果出错，重置跳转状态
    }
  };

  const handleDelete = async () => {
    setShowControlMenu(false)
    try {
      const videoDetails = await getVideoDetails(selectedVideoId)
      const { image_ID, video_ID } = videoDetails
      if (image_ID && video_ID) {
        await Promise.all([
          deleteVideoDoc(selectedVideoId),
          deleteVideoFiles(image_ID),
          deleteVideoFiles(video_ID)
        ])
        Toast.show('Delete Success', {
          duration: Toast.durations.SHORT,
          position: Toast.positions.CENTER
        });
        handleRefresh && handleRefresh()
      } else {
        Alert.alert('Delete Failed, File ID not found')
      }
    } catch (error) {
      console.error('删除出错:', error)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchUserPosts(user?.$id);

    if (userId) {
      await getCurrentUser(userId)
        .then(res => setUser(res))
        .catch(error => {
          console.error('getCurrentUser() failed:', error);
        });
    }

    setRefreshing(false);
  }

  if (isTransitioning) {
    return (
      <View className="flex-1 justify-center items-center bg-primary">
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView className='bg-primary h-full' style={{ marginTop: insetTop }}>
      <SettingModal
        showModal={settingModalVisible}
        setModalVisible={setSettingModalVisible}
        signOut={handleSignOut}
      />
      <FlatList
        data={loading ? [] : userPostsData}
        // item 是 data 数组中的每一项
        keyExtractor={(item) => item?.$id}
        contentContainerStyle={{ paddingBottom: 44 }}
        ListHeaderComponent={() => {
          return (
            <View className='my-6 px-4 mb-2 relative'>
              <View className='flex-row items-center justify-between'>
                <TouchableOpacity onPress={() => { setSettingModalVisible(true) }}
                  className='w-6 h-6'
                >
                  <Image
                    source={settingIcon}
                    className='w-6 h-6'
                    resizeMode='contain'
                  />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => { router.navigate('/notifications/notice-screen') }}>
                  <Image
                    source={notifyIcon}
                    className='w-6 h-6'
                    resizeMode='contain'
                  />
                </TouchableOpacity>
              </View>
              <View className='justify-between items-center mt-10'>

                <View
                  className='w-[56px] h-[56px] border-2 border-secondary rounded-full overflow-hidden justify-center'
                >
                  <Image
                    source={{ uri: user?.avatar }}
                    className='w-full h-full'
                    resizeMode='cover'
                  />
                </View>

                <Text className='text-black text-xl font-psemibold mt-2.5'>{user?.username}</Text>

                <TouchableOpacity onPress={() => { router.navigate('/user-info') }}
                  className='w-10 h-10 justify-center items-center'
                >
                  <Image
                    source={editIcon}
                    className='w-6 h-6'
                    resizeMode='contain'
                  />
                </TouchableOpacity>
              </View>
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
                setShowControlMenu((prev) => !prev)
              }}
              handleRefresh={handleRefresh}
              setIsVideoCreator={() => true}
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
            <View>
              <EmptyState />
              <CustomButton
                title={t('Create Video')}
                textStyle={'text-black'}
                style={'h-16 my-5 mx-4'}
                onPress={() => router.push('/create')}
              />
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
        snapPoints={['50%']}
        enablePanDownToClose={true}
        onClose={() => setShowControlMenu(false)}
      >
        <BottomSheetView>
          <View className='bg-white w-full rounded-md px-6 py-0'>
            <Pressable onPress={handleDelete} className='w-full h-12 flex-row items-center'>
              <Image source={trash} className='w-6 h-6 mr-8' />
              <Text className='text-black text-lg'>Delete</Text>
            </Pressable>
          </View>
        </BottomSheetView>
      </BottomSheet>

      <StatusBar style='dark' />

    </GestureHandlerRootView>
  )
}
