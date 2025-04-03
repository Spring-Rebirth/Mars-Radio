import React from 'react';
import { View } from 'react-native';
import * as Animatable from 'react-native-animatable';

export default function VideoLoadingSkeleton() {
  return (
    <Animatable.View
      animation="fadeIn"
      duration={500}
      style={{ padding: 10 }}
    >
      {/* 视频缩略图骨架 */}
      <View
        style={{
          width: '100%',
          height: 200,
          borderRadius: 10,
          backgroundColor: '#B0B0B0',
          marginBottom: 16,
          overflow: 'hidden',
          shadowColor: '#000',
          shadowOpacity: 0.15,
          shadowOffset: { width: 0, height: 4 },
          shadowRadius: 10,
          elevation: 5
        }}
      >
        {/* 添加渐变效果的底部区域 */}
        <View style={{
          position: 'absolute',
          bottom: 0,
          width: '100%',
          height: '40%',
          backgroundColor: 'rgba(0, 0, 0, 0.1)',
        }}>
          {/* 模拟标题占位 */}
          <View style={{
            position: 'absolute',
            bottom: 36,
            left: 12,
            width: '60%',
            height: 16,
            backgroundColor: '#D0D0D0',
            borderRadius: 4
          }} />

          {/* 模拟子标题占位 */}
          <View style={{
            position: 'absolute',
            bottom: 12,
            left: 12,
            width: '50%',
            height: 12,
            backgroundColor: '#E0E0E0',
            borderRadius: 4
          }} />
        </View>

        {/* 模拟菜单按钮 */}
        <View style={{
          position: 'absolute',
          top: 12,
          right: 12,
          width: 32,
          height: 32,
          backgroundColor: 'rgba(255, 255, 255, 0.3)',
          borderRadius: 16,
        }} />
      </View>

      {/* 用户信息与标题骨架 */}
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {/* 用户头像骨架 */}
        <View style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: '#C0C0C0',
          marginRight: 12,
          borderWidth: 2,
          borderColor: '#E0E0E0'
        }} />

        <View style={{ flex: 1 }}>
          {/* 骨架1 - 标题 */}
          <View style={{
            width: '90%',
            height: 16,
            borderRadius: 4,
            backgroundColor: '#C0C0C0',
            marginBottom: 6
          }} />
          {/* 骨架2 - 副标题 */}
          <View style={{
            width: '90%',
            height: 14,
            borderRadius: 4,
            backgroundColor: '#D0D0D0',
            marginBottom: 6
          }} />
          {/* 骨架3 - 附加信息 */}
          <View style={{
            width: '40%',
            height: 14,
            borderRadius: 4,
            backgroundColor: '#E0E0E0'
          }} />
        </View>
      </View>
    </Animatable.View>
  );
}
