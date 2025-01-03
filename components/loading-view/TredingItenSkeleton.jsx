import React from 'react';
import { View, TouchableOpacity, Image } from 'react-native';
import * as Animatable from 'react-native-animatable';
import star from '../../assets/menu/star-solid.png';
import starThree from '../../assets/menu/star3.png';

function TrendingItemSkeleton() {
  return (
    <Animatable.View
      animation="fadeIn"
      duration={500}
      style={{ borderRadius: 16, overflow: 'hidden' }}
      className='mr-2 relative'
    >
      <TouchableOpacity className='absolute z-10 top-3 right-3'>
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
          <Image source={starThree} style={{ width: 20, height: 20 }} />
        </View>
      </TouchableOpacity>

      {/* 骨架视图容器 */}
      <View
        className="relative justify-center items-center w-[290px] h-[332px] rounded-[24px] overflow-hidden shadow-lg"
        style={{
          backgroundColor: '#E0E0E0', // 骨架背景色
          shadowColor: '#000',
          shadowOpacity: 0.15,
          shadowOffset: { width: 0, height: 4 },
          shadowRadius: 10,
        }}
      >
        {/* 顶部图片占位 */}
        <View style={{
          width: '100%',
          height: '50%',
          backgroundColor: '#B0B0B0',
        }} />

        {/* 底部占位覆盖层
                <View style={{
                    position: 'absolute',
                    bottom: 0,
                    width: '100%',
                    height: '40%',
                    backgroundColor: '#D0D0D0',
                    borderBottomLeftRadius: 24,
                    borderBottomRightRadius: 24,
                }} /> */}
      </View>
    </Animatable.View>
  );
}

export default TrendingItemSkeleton;
