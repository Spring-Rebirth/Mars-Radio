import React, { useState } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import ImagePicker from 'react-native-image-crop-picker';

interface ImageItem {
  uri: string;
  width?: number;
  height?: number;
  [key: string]: any;
}

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
    <View style={styles.itemContainer}>
      <Image source={{ uri: item.uri }} style={styles.image} resizeMode="cover" />
      <TouchableOpacity style={styles.editBtn} onPress={() => handleCrop(index)}>
        <Text style={styles.editTxt}>编辑</Text>
      </TouchableOpacity>
    </View>
  );

  if (!images.length) {
    return (
      <View style={styles.centerBox}>
        <Text>没有收到任何图片数据</Text>
      </View>
    );
  }

  return (
    <FlatList
      contentContainerStyle={styles.list}
      data={images}
      keyExtractor={(_, i) => String(i)}
      renderItem={renderItem}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    padding: 16,
  },
  itemContainer: {
    marginBottom: 24,
  },
  image: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 8,
  },
  editBtn: {
    marginTop: 8,
    alignSelf: 'flex-end',
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  editTxt: {
    color: '#fff',
    fontSize: 14,
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
