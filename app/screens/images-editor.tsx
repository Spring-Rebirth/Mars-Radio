import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import ImagePicker from 'react-native-image-crop-picker';
import { MaterialIcons } from '@expo/vector-icons';
import { useEditedImagesStore } from '../../store/editedImagesStore';

interface ImageItem {
  uri: string;
  width?: number;
  height?: number;
  [key: string]: any;
}

// ---------------
// 布局常量
// ---------------
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const COLUMN_COUNT = 3;
const GAP = 10;
const ITEM_SIZE = (SCREEN_WIDTH - GAP * (COLUMN_COUNT + 1)) / COLUMN_COUNT;

export default function ImagesEditor() {
  const params = useLocalSearchParams<{ images?: string }>();
  const initialImages: ImageItem[] = params.images ? JSON.parse(params.images as string) : [];
  const [images, setImages] = useState<ImageItem[]>(initialImages);

  const handleCrop = async (index: number) => {
    try {
      const target = images[index];
      const result = await ImagePicker.openCropper({
        mediaType: 'photo',
        path: target.uri,
        width: target.width || 800,
        height: target.height || 800,
        cropping: true,
        freeStyleCropEnabled: true,
      });

      const updatedItem: ImageItem = {
        ...target,
        uri: result.path,
        width: result.width,
        height: result.height,
      };
      setImages(prev => {
        const next = [...prev];
        next[index] = updatedItem;
        return next;
      });
    } catch (error) {
      // 用户取消裁剪等情况
      console.log('裁剪取消或失败', error);
    }
  };

  const renderItem = ({ item, index }: { item: ImageItem; index: number }) => (
    <View
      className="rounded-lg overflow-hidden"
      style={{ width: ITEM_SIZE, height: ITEM_SIZE, margin: GAP / 2 }}
    >
      <Image source={{ uri: item.uri }} className="w-full h-full" resizeMode="cover" />
      <TouchableOpacity
        className="absolute right-1.5 top-1.5 bg-black/60 rounded-full p-1"
        onPress={() => handleCrop(index)}
      >
        <MaterialIcons name="edit" size={20} color="#fff" />
      </TouchableOpacity>
    </View>
  );

  if (!images.length) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text>没有收到任何图片数据</Text>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center justify-between px-3 py-2 border-b border-gray-200">
        <TouchableOpacity className="w-6 h-6 items-center justify-center" onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text className="text-lg font-semibold text-black">图片编辑</Text>
        {/* 占位保持标题居中 */}
        <View className="w-6 h-6" />
      </View>

      {/* Grid */}
      <FlatList
        contentContainerStyle={{ padding: GAP }}
        data={images}
        keyExtractor={(_, i) => String(i)}
        renderItem={renderItem}
        numColumns={COLUMN_COUNT}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={() => (
          <View className="flex-row items-center justify-center mt-4">
            <TouchableOpacity
              className="bg-blue-500 p-2 rounded-md w-11/12 h-12 items-center justify-center"
              onPress={() => {
                useEditedImagesStore.getState().setImages(images);
                router.back();
              }}>
              <Text className="text-white">完成</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </SafeAreaView>
  );
}
