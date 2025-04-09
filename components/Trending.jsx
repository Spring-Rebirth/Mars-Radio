// cSpell:ignore Pressable cooldown
import { FlatList, View, Dimensions, ScrollView } from 'react-native'
import { useState, useEffect } from 'react'
import TrendingItemSkeleton from './loading-view/TredingItenSkeleton'
import TrendingItem from './TrendingItem'

const { width } = Dimensions.get('window');

export default function Trending({ video, loading, refreshControl }) {
    // cSpell: words viewability
    const viewabilityConfig = { itemVisiblePercentThreshold: 70 }; // 配置可见性百分比
    const [activeItem, setActiveItem] = useState(null);

    // 当视频数据加载完成后更新activeItem
    useEffect(() => {
        if (video && video.length > 0) {
            setActiveItem(video[0]);
        }
    }, [video]);

    const handleViewableItemsChanged = ({ viewableItems }) => {
        if (viewableItems && viewableItems.length > 0) {
            setActiveItem(viewableItems[0].item); // 访问每个可见项的实际 item
        }
    };

    return loading ? (
        <ScrollView style={{ paddingTop: 16 }}>
            <TrendingItemSkeleton />
            <TrendingItemSkeleton />
            <TrendingItemSkeleton />
        </ScrollView>
    ) : (
        <FlatList
            data={loading || video.length === 0 ? [] : video}
            keyExtractor={(item) => item.$id}
            renderItem={({ item }) => (
                <TrendingItem item={item} activeItem={activeItem} />
            )}
            onViewableItemsChanged={handleViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
            showsVerticalScrollIndicator={false}
            decelerationRate="fast"
            directionalLockEnabled={true}
            contentContainerStyle={{ paddingBottom: 80, paddingTop: 16 }}
            ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
            refreshControl={refreshControl}
        />
    )
}
