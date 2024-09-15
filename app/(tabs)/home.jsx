//cSpell:words psemibold appwrite
import { View, Text, FlatList, Image, RefreshControl, Alert } from 'react-native'
import { useEffect, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { images } from '../../constants'
import SearchInput from '../../components/SearchInput'
import Trending from "../../components/Trending"
import EmptyState from '../../components/EmptyState'
import CustomButton from '../../components/CustomButton'
import VideoCard from '../../components/VideoCard'
import { getAllPosts, getLatestPosts } from '../../lib/appwrite'

export default function Home() {
	const [refreshing, setRefreshing] = useState(false);
	const [loading, setLoading] = useState(false);
	const [data, setData] = useState([]);
	const [latestData, setLatestData] = useState([]);

	const fetchPosts = () => {
		setLoading(true);
		getAllPosts()
			.then((res) => {
				setData(res);
			})
			.catch((error) => {
				Alert.alert('Failed to load data', error)
			})
			.finally(() => {
				setLoading(false);
			})
	}



	const handleRefresh = () => {
		setRefreshing(true);
		fetchPosts();
		// fetchLatestPosts();
		setRefreshing(false);
	}

	useEffect(() => {
		fetchPosts();
		// fetchLatestPosts();
	}, [])

	return (
		<SafeAreaView className='bg-primary h-full'>
			<FlatList
				data={data}
				// item 是 data 数组中的每一项
				keyExtractor={(item) => item.$id}

				ListHeaderComponent={() => {
					return (
						<View className='my-6 px-4'>

							<View className='flex-row justify-between items-center'>
								<View >
									<Text className='text-gray-100 text-lg'>Welcome Back</Text>
									<Text className='text-white text-2xl font-psemibold '>Myst Seed</Text>
								</View>
								<Image
									source={images.logoSmall}
									className='w-9 h-10'
									resizeMode='contain'
								/>
							</View>
							<SearchInput containerStyle={'mt-6'} />

							<View className='mt-8'>
								<Text className='text-white'>Trending Videos</Text>
								<Trending />
							</View>

						</View>
					);
				}}
				// renderItem 接受一个对象参数，通常解构为 { item, index, separators }
				renderItem={({ item }) => {
					return (
						<VideoCard video={item} />
					)
				}}
				ListEmptyComponent={() => {
					return (
						<View>
							<EmptyState />
							<CustomButton
								title={'Create Video'}
								textStyle={'text-black'}
								style={'h-16 my-5 mx-4'}
							/>
						</View>
					);
				}}
				refreshControl={
					<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
				}
			/>

		</SafeAreaView>
	)
}