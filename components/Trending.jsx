// cSpell:ignore Pressable
import { useState, useContext } from 'react'
import * as Animatable from 'react-native-animatable'
import star from '../assets/menu/star-solid.png'
import starThree from '../assets/menu/star3.png'
import { useGlobalContext } from '../context/GlobalProvider'
import { updateSavedCounts } from '../lib/appwrite';
import { PlayDataContext } from '../context/PlayDataContext';
import {
    FlatList, ImageBackground, Text, TouchableOpacity, View, Image, ActivityIndicator,
    Alert
} from 'react-native'
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next'

function TrendingItem({ activeItem, item }) {
    const [imageLoaded, setImageLoaded] = useState(false);
    const { user, setUser } = useGlobalContext();
    const { played_counts, $id } = item;
    const [isSaved, setIsSaved] = useState(user?.favorite.includes($id));
    const [playCount, setPlayCount] = useState(played_counts || 0);
    const { updatePlayData, playDataRef } = useContext(PlayDataContext);

    const zoomIn = {
        0: {
            scale: 0.9,
        },
        1: {
            scale: 1,
        }
    }
    const zoomOut = {
        0: {
            scale: 1,
        },
        1: {
            scale: 0.9,
        }
    }

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
                setIsSaved(true);
                isIncrement = true;
                Alert.alert('Save successful');
            } else {
                // 剔除已保存项的新数组
                const updatedItems = user?.favorite.filter(item => item !== $id);
                setUser(prev => ({
                    ...prev,
                    favorite: updatedItems
                }))
                setIsSaved(false);
                isIncrement = false;
                Alert.alert('Cancel save successfully');
            }
            await updateSavedCounts($id, isIncrement);
        } catch (error) {
            console.error("Error handling favorite:", error);
            Alert.alert('An error occurred while updating favorite count');
        }
    }

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

        // 继续播放视频
        // setPlaying(true);
        // setLoading(true);
        router.push({
            pathname: 'player/play-screen',
            params: {
                post: JSON.stringify(item)
            }
        });
    };


    return (
        <Animatable.View
            animation={activeItem.$id === item.$id ? zoomIn : zoomOut}
            duration={500}
            style={{ borderRadius: 16, overflow: 'hidden' }} // 使用样式直接设置圆角
            className='mr-2 relative'
        >
            <TouchableOpacity onPress={handleAddSaved} className='absolute z-10 top-3 right-3'>
                {/* 星标图标（右上角） */}
                <View style={{
                    position: 'absolute',
                    top: 10,
                    right: 10,
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    padding: 5,
                    borderRadius: 12,
                    shadowColor: '#fff',
                    shadowOpacity: 0.8,
                    shadowRadius: 6,
                }}>
                    <Image source={isSaved ? star : starThree} style={{ width: 20, height: 20 }} />
                </View>
            </TouchableOpacity>

            <TouchableOpacity
                onPress={handlePlay}
                className="relative justify-center items-center w-[208px] h-[332px] rounded-[24px] overflow-hidden shadow-lg"
                style={{
                    backgroundColor: '#33466C', // 背景色设置为深蓝
                    shadowColor: '#000',
                    shadowOpacity: 0.15, // 更柔和的阴影效果
                    shadowOffset: { width: 0, height: 4 },
                    shadowRadius: 10,
                }}
            >
                {/* 渐变背景 */}
                <LinearGradient
                    colors={['#6A0DAD', '#2E86DE']}
                    style={{
                        position: 'absolute',
                        width: '100%',
                        height: '100%',
                        borderRadius: 24,
                    }}
                />

                {/* 图片容器，增加内边距和圆角 */}
                <View style={{
                    width: '100%',
                    height: '45%',
                    backgroundColor: '#2C3E5C',
                    paddingVertical: 5, // 内边距
                }}>
                    <ImageBackground
                        source={{ uri: item.thumbnail }}
                        style={{
                            width: '100%',
                            height: '100%',
                        }}
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
                    colors={['transparent', 'rgba(0, 0, 0, 0.5)']}
                    style={{
                        position: 'absolute',
                        bottom: 0,
                        width: '100%',
                        height: '40%',
                        borderBottomLeftRadius: 24,
                        borderBottomRightRadius: 24,
                    }}
                />

                {/* 加载动画 */}
                {!imageLoaded && (
                    <ActivityIndicator
                        size="large"
                        color="#fff"
                        style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: [{ translateX: -20 }, { translateY: -20 }],
                        }}
                    />
                )}
            </TouchableOpacity>
        </Animatable.View>
    )
}

export default function Trending({ video, loading }) {
    // cSpell: words viewability
    const viewabilityConfig = { itemVisiblePercentThreshold: 70 }; // 配置可见性百分比
    const [activeItem, setActiveItem] = useState(video && video.length > 0 ? video[0] : null); // 设置默认 activeItem

    const { t } = useTranslation();

    const handleViewableItemsChanged = ({ viewableItems }) => {
        if (viewableItems && viewableItems.length > 0) {
            setActiveItem(viewableItems[0].item); // 访问每个可见项的实际 item
        }
    };

    return loading ? (
        <View className="flex-1 justify-center items-center bg-primary mt-12">
            <ActivityIndicator size="large" color="#ffffff" />
            <Text className='mt-[10] text-white text-xl'>{t('Loading, please wait...')}</Text>
        </View>
    ) : (
        <FlatList
            horizontal
            className=''
            data={loading || video.length === 0 ? [] : video}
            keyExtractor={(item) => item.$id}
            renderItem={({ item }) => (
                <TrendingItem item={item} activeItem={activeItem} />
            )}
            onViewableItemsChanged={handleViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
            showsHorizontalScrollIndicator={false}
            decelerationRate="fast"
            directionalLockEnabled={false}
        />
    )
}
