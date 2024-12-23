import { Text, View, FlatList, TouchableOpacity, ActivityIndicator, Image } from 'react-native'
import React, { useEffect, useState } from 'react'
import { useLocalSearchParams } from 'expo-router'
import { t } from 'i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useGetData from '../../hooks/useGetData';
import { StatusBar } from 'expo-status-bar'
import { config, databases } from '../../lib/appwrite';
import { Query } from 'react-native-appwrite';
import EmptyState from '../../components/EmptyState';
import VideoCard from '../../components/VideoCard';

export default function UserProfile() {
  const insetTop = useSafeAreaInsets().top;
  const { creatorId, accountId } = useLocalSearchParams();

  const [loading, setLoading] = useState(true);
  const [userPostsData, setUserPostsData] = useState([]);
  const { fetchUserPosts } = useGetData({ setLoading, setUserPostsData });
  const [user, setUser] = useState(null);

  async function getCurrentUser() {
    try {
      const currentUserData = await databases.getDocument(
        config.databaseId,
        config.usersCollectionId,
        creatorId
      );

      return currentUserData;

    } catch (error) {
      console.log('Error in getCurrentUser', error);
      return null;
    }
  }

  useEffect(() => {
    setLoading(true);

    getCurrentUser()
      .then((res) => {
        if (res) {
          setUser(res);
        } else {
          setUser(null);
        }
      })
      .catch((error) => {
        console.log("Error in fetching user:", error);
        setUser(null);
      })

    if (creatorId) {
      fetchUserPosts(creatorId)
        .finally(() => {
          setLoading(false);  // 确保只有在 fetchUserPosts 完成后才更新 loading 状态
        });
    } else {
      setLoading(false); // 如果没有 creatorId，也需要设置 loading 为 false
    }
  }, [creatorId])

  return (
    <View className='bg-primary h-full' style={{ marginTop: insetTop }}>
      <FlatList
        data={loading ? [] : userPostsData}
        // item 是 data 数组中的每一项
        keyExtractor={(item) => item?.$id}
        contentContainerStyle={{ paddingBottom: 44 }}
        ListHeaderComponent={() => {
          return (
            <View className='my-6 px-4 mb-2 relative'>
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

              </View>
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
            <View>
              <EmptyState />
            </View>
          );
        }}
      />

      <StatusBar style='dark' />

    </View>
  )
}