//cSpell:words psemibold appwrite
import { View, Text, FlatList, Image, ActivityIndicator, RefreshControl } from 'react-native'
import { useEffect, useState } from 'react'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { images } from '../../constants'
import SearchInput from '../../components/SearchInput'
import VideoCard from '../../components/VideoCard'
import useGetData from '../../hooks/useGetData'
import { StatusBar } from 'expo-status-bar'
import { useGlobalContext } from '../../context/GlobalProvider'
import { useTranslation } from "react-i18next";

export default function Saved() {
  const insetTop = useSafeAreaInsets().top;
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [savedPostsData, setSavedPostsData] = useState([]);
  const { fetchSavedPosts } = useGetData({ setLoading, setSavedPostsData });
  const { user } = useGlobalContext();
  const { t } = useTranslation();

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchSavedPosts(user?.favorite);
    setRefreshing(false);
  }

  useEffect(() => {
    fetchSavedPosts(user?.favorite);
  }, [user])

  return (
    <View className='bg-primary h-full' style={{ marginTop: insetTop }}>
      <FlatList
        data={loading ? [] : savedPostsData}
        // item 是 data 数组中的每一项
        keyExtractor={(item) => item.$id}
        contentContainerStyle={{
          flexGrow: 1,
          paddingBottom: 45
        }}
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
            <VideoCard post={item} />
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

      <StatusBar style='auto' />
    </View>
  )
}





