import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import ImagePicker from 'react-native-image-crop-picker';
import { MaterialIcons } from '@expo/vector-icons';

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
    <View style={styles.itemContainer}>
      <Image source={{ uri: item.uri }} style={styles.image} resizeMode="cover" />
      <TouchableOpacity style={styles.editIconWrap} onPress={() => handleCrop(index)}>
        <MaterialIcons name="edit" size={20} color="#fff" />
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
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerIcon} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>图片编辑</Text>
        {/* 占位保持标题居中 */}
        <View style={styles.headerIcon} />
      </View>

      {/* Grid */}
      <FlatList
        contentContainerStyle={styles.list}
        data={images}
        keyExtractor={(_, i) => String(i)}
        renderItem={renderItem}
        numColumns={COLUMN_COUNT}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderColor: '#e5e5e5',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  headerIcon: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    padding: GAP,
  },
  itemContainer: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    margin: GAP / 2,
    borderRadius: 8,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  editIconWrap: {
    position: 'absolute',
    right: 6,
    top: 6,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
    padding: 4,
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
