//cSpell:words psemibold appwrite
import { View, Text, FlatList, Image, RefreshControl, ActivityIndicator } from 'react-native'
import { useEffect, useState } from 'react'
import { images } from '../../constants'
import SearchInput from '../../components/SearchInput'
import Trending from "../../components/Trending"
import EmptyState from '../../components/EmptyState'
import CustomButton from '../../components/CustomButton'
import VideoCard from '../../components/VideoCard'
import useGetData from '../../hooks/useGetData'
import downIcon from '../../assets/icons/down.png'
import { useGlobalContext } from '../../context/GlobalProvider'
import { StatusBar } from 'expo-status-bar'
import { updateSavedVideo } from '../../lib/appwrite'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import { fetchAdminData } from '../../lib/appwrite'
import VideoLoadingSkeleton from '../../components/loading-view/VideoLoadingSkeleton'

export default function Home() {
	const { t } = useTranslation();
	const { user } = useGlobalContext();
	const [data, setData] = useState([]);
	const [loading, setLoading] = useState(false);
	const [refreshing, setRefreshing] = useState(false);
	const [adminList, setAdminList] = useState([]);
	const [popularData, setPopularData] = useState([]);
	const { fetchPosts, fetchPopularPosts } = useGetData({ setLoading, setData, setPopularData });

	useEffect(() => {
		const addAdminData = async () => {
			await fetchAdminData()
				.then(data => {
					const adminArray = data.map(doc => doc.account);
					console.log('adminArray:', adminArray);
					setAdminList(adminArray);
				})
				.catch(error => {
					console.error("Error fetching admin data:", error);
				});
		}

		addAdminData();
	}, []);

	useEffect(() => {
		const fetchDataAndUpdateVideo = async () => {
			if (!user) return; // 如果 user 不存在，直接返回

			setLoading(true); // 开始加载

			try {
				// 获取用户信息，更新收藏视频
				const favorite = user.favorite || []; // 确保 favorite 至少是一个空数组
				await updateSavedVideo(user?.$id, { favorite });

				// 并行请求 fetchPosts 和 fetchPopularPosts
				await Promise.all([fetchPosts(), fetchPopularPosts()]);

			} catch (error) {
				console.error(error);  // 处理错误
			} finally {
				setLoading(false);  // 请求完成后设置 loading 为 false
			}
		};

		fetchDataAndUpdateVideo();  // 调用异步函数 	
	}, [user?.$id]);

	const toggleFullscreen = (fullscreen) => {
		setIsFullscreen(fullscreen);
	};

	const handleRefresh = () => {
		setRefreshing(true);
		fetchPosts();
		fetchPopularPosts();
		setRefreshing(false);
		console.log('user.favorite:', user?.favorite);
	}

	const [isFullscreen, setIsFullscreen] = useState(false);

	return (
		<SafeAreaView className="bg-primary h-full">
			<View className={`flex-1 bg-primary ${isFullscreen ? 'w-full h-full' : 'h-full'}`}>
				<StatusBar style='auto' />
				<FlatList
					data={loading ? [] : data}
					keyExtractor={(item) => item.$id}
					ListHeaderComponent={() => {
						return (
							<View className='my-6 px-4'>

								<View className='flex-row justify-between items-center mt-4 h-[60px]'>
									<View >
										<Text className='text-[#808080] text-lg'>{t('Welcome Back')}</Text>
										<Text className='text-[#FF6B6B] text-2xl font-psemibold '>{user?.username}</Text>
									</View>
									<Image
										source={images.logoSmall}
										className='w-9 h-10'
										resizeMode='contain'
									/>
								</View>

								<SearchInput containerStyle={'mt-6'} />

								<View className='mt-8'>
									<Text className=' mb-8 font-psemibold text-lg text-[#FFB300] text-center'>{t('Top  Hits')}</Text>
									{/* 头部视频 */}
									{popularData.length === 0 ? (
										<View className='items-center'>
											<Image
												source={images.empty}
												className='w-[75px] h-[60px]'
												resizeMode='contain'
											/>
											<Text className='text-sky-300 text-center font-psemibold'>
												{t("Play the video to help it")} {'\n'}{t('become a popular one !')}
											</Text>
										</View>
									) : (
										<Trending video={popularData} loading={loading} />
									)}

								</View>
								<View className='flex-row items-center justify-center mt-10'>
									<Image
										source={downIcon}
										resizeMode='contain'
										className='w-6 h-6'
									/>
									<Text className='text-[#FFB300]  font-psemibold text-lg text-center mx-12'>
										{t("Latest")}
									</Text>
									<Image
										source={downIcon}
										resizeMode='contain'
										className='w-6 h-6'
									/>
								</View>
							</View>
						);
					}}

					renderItem={({ item }) => {
						return (
							<VideoCard post={item} handleRefresh={handleRefresh} isFullscreen={isFullscreen}
								toggleFullscreen={toggleFullscreen} adminList={adminList}
							/>
						)
					}}
					ListEmptyComponent={() => {
						return loading ? (
							<>
								<VideoLoadingSkeleton />
								<VideoLoadingSkeleton />
								<VideoLoadingSkeleton />
							</>
						) : (
							<View>
								<EmptyState />
								<CustomButton
									title={'Create Video'}
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
			</View>
		</SafeAreaView>
	)
}