//cSpell:words psemibold appwrite
import { View, Text, FlatList, Image, ActivityIndicator, RefreshControl, Pressable } from 'react-native'
import { useEffect, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { images } from '../../constants'
import SearchInput from '../../components/SearchInput'
import EmptyState from '../../components/EmptyState'
import CustomButton from '../../components/CustomButton'
import VideoCard from '../../components/VideoCard'
import useGetData from '../../hooks/useGetData'
import { useLocalSearchParams, router } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useGlobalContext } from '../../context/GlobalProvider'
import { Ionicons } from '@expo/vector-icons'

export default function Search() {
  const { user } = useGlobalContext();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [queryData, setQueryData] = useState([]);
  const { fetchQueryPosts, fetchQuerySavedPosts } = useGetData({ setLoading, setQueryData });
  const { query, originRoute } = useLocalSearchParams();

  console.log('originRoute:', originRoute);

  const handleRefresh = () => {
    setRefreshing(true);
    if (originRoute === '/saved') {
      fetchQuerySavedPosts(query, user?.favorite ?? []);
    } else if (originRoute === '/home') {
      fetchQueryPosts(query);
    }
    setRefreshing(false);
  }

  useEffect(() => {
    if (originRoute === '/saved') {
      fetchQuerySavedPosts(query, user?.favorite ?? []);
    } else if (originRoute === '/home') {
      fetchQueryPosts(query);
    }
  }, [query])

  return (
    <SafeAreaView className='bg-primary h-full'>
      {/* 返回按钮 */}
      <Pressable onPress={() => router.back()}
        className='ml-4 mt-4'
      >
        <Ionicons name='arrow-back' size={24} color='black' />
      </Pressable>
      <FlatList
        data={loading ? [] : queryData}
        // item 是 data 数组中的每一项
        keyExtractor={(item) => item.$id}
        contentContainerStyle={{ paddingBottom: 40 }}
        ListHeaderComponent={() => {
          return (
            <View className='my-6 px-4'>

              <View className='flex-row justify-between items-center'>
                <View >
                  <Text className='text-[#808080] text-lg'>Search Result</Text>
                  <Text className='text-black text-2xl font-psemibold '>{query}</Text>
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
              <Text className='mt-[10] text-black text-xl'>Loading, please wait...</Text>
            </View>
          ) : (
            <View>
              <EmptyState />
              <CustomButton
                title={'Create Video'}
                textStyle={'text-black'}
                style={'h-16 my-5 mx-4'}
                onPress={() => router.push('(tabs)/create')}
              />
            </View>
          );
        }}

        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      />

      <StatusBar style='dark' />
    </SafeAreaView>
  )
}