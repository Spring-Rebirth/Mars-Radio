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

                {/* 模拟用户头像 */}
                <View style={{
                    position: 'absolute',
                    top: 12,
                    left: 12,
                    width: 32,
                    height: 32,
                    backgroundColor: 'rgba(255, 255, 255, 0.3)',
                    borderRadius: 16,
                }} />
            </View>
        </Animatable.View>
    );
}
