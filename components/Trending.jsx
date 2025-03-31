// cSpell:ignore Pressable cooldown
import {
  FlatList, View
} from 'react-native'
import { useState } from 'react'
import TrendingItemSkeleton from './loading-view/TredingItenSkeleton'
import TrendingItem from './TrendingItem'

export default function Trending({ video, loading }) {
  // cSpell: words viewability
  const viewabilityConfig = { itemVisiblePercentThreshold: 70 }; // 配置可见性百分比
  const [activeItem, setActiveItem] = useState(video && video.length > 0 ? video[0] : null); // 设置默认 activeItem

  const handleViewableItemsChanged = ({ viewableItems }) => {
    if (viewableItems && viewableItems.length > 0) {
      setActiveItem(viewableItems[0].item); // 访问每个可见项的实际 item
    }
  };

  return loading ? (
    <View className='flex-row'>
      <TrendingItemSkeleton />
      <TrendingItemSkeleton />
      <TrendingItemSkeleton />
    </View>
  ) : (
    <FlatList
      horizontal
      data={loading || video.length === 0 ? [] : video}
      keyExtractor={(item) => item.$id}
      renderItem={({ item }) => (
        <TrendingItem item={item} activeItem={activeItem} />
      )}
      onViewableItemsChanged={handleViewableItemsChanged}
      viewabilityConfig={viewabilityConfig}
      showsHorizontalScrollIndicator={false}
      decelerationRate="fast"
        directionalLockEnabled={true}
    />
  )
}
