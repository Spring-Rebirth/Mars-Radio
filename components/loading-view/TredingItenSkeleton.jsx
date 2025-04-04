import React from 'react';
import { View } from 'react-native';
import * as Animatable from 'react-native-animatable';

function TrendingItemSkeleton() {
  return (
    <Animatable.View
      animation="fadeIn"
      duration={500}
      style={{ borderRadius: 16, overflow: 'hidden', marginHorizontal: 16, marginBottom: 16 }}
      className='relative'
    >
      {/* 骨架视图容器 */}
      <View
        className="relative w-full rounded-[16px] overflow-hidden shadow-lg"
        style={{
          backgroundColor: '#E0E0E0', // 骨架背景色
          height: 180,
          shadowColor: '#000',
          shadowOpacity: 0.15,
          shadowOffset: { width: 0, height: 4 },
          shadowRadius: 10,
        }}
      >
        {/* 图片占位 */}
        <View style={{
          width: '100%',
          height: '100%',
          backgroundColor: '#B0B0B0',
        }} />

        {/* 底部标题占位 */}
        <View style={{
          position: 'absolute',
          bottom: 0,
          width: '100%',
          height: '40%',
          backgroundColor: 'rgba(0, 0, 0, 0.1)',
        }}>
          <View style={{
            position: 'absolute',
            bottom: 12,
            left: 12,
            width: '60%',
            height: 16,
            backgroundColor: '#D0D0D0',
            borderRadius: 4
          }} />

          <View style={{
            position: 'absolute',
            bottom: 36,
            left: 12,
            width: '40%',
            height: 20,
            backgroundColor: '#C0C0C0',
            borderRadius: 4
          }} />
        </View>
      </View>
    </Animatable.View>
  );
}

export default TrendingItemSkeleton;
