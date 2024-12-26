import React from 'react';
import { View } from 'react-native';

export default function VideoLoadingSkeleton() {
  return (
    <View style={{ padding: 10 }}>
      {/* 视频缩略图骨架 */}
      <View style={{
        width: '100%',
        height: 200,
        borderRadius: 10,
        backgroundColor: '#E1E9EE',
        marginBottom: 16
      }} />

      {/* 用户信息与标题骨架 */}
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {/* 用户头像骨架 */}
        <View style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: '#E1E9EE',
          marginRight: 12
        }} />

        <View style={{ flex: 1 }}>
          {/* 骨架1 */}
          <View style={{
            width: '90%',
            height: 16,
            borderRadius: 4,
            backgroundColor: '#E1E9EE',
            marginBottom: 6
          }} />
          {/* 骨架2 */}
          <View style={{
            width: '90%',
            height: 14,
            borderRadius: 4,
            backgroundColor: '#E1E9EE',
            marginBottom: 6
          }} />
          {/* 骨架3 */}
          <View style={{
            width: '40%',
            height: 14,
            borderRadius: 4,
            backgroundColor: '#E1E9EE'
          }} />
        </View>
      </View>
    </View>
  );
}
