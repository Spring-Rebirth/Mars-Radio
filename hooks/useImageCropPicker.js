import { useState, useCallback } from 'react';
import ImagePicker from 'react-native-image-crop-picker';
import { Alert, Platform } from 'react-native';

export const useImageCropPicker = () => {
  const [loading, setLoading] = useState(false);

  // 从相册选择多张图片（支持相册分类）
  const pickMultipleImages = useCallback(async (options = {}) => {
    setLoading(true);

    try {
      const defaultOptions = {
        multiple: true,
        maxFiles: 10,
        mediaType: 'photo',
        quality: 0.8,
        includeBase64: false,
        // iOS 智能相册类型
        smartAlbums: [
          'UserLibrary',      // 最近项目
          'PhotoStream',      // 照片流
          'Panoramas',        // 全景照片
          'Videos',           // 视频
          'Favorites',        // 收藏
          'Timelapses',       // 延时摄影
          'RecentlyAdded',    // 最近添加
          'Bursts',           // 连拍
          'SlomoVideos',      // 慢动作视频
          'SelfPortraits',    // 自拍
          'Screenshots',      // 截图
          'DepthEffect',      // 人像模式
          'LivePhotos',       // Live Photos
        ],
        ...options
      };

      const images = await ImagePicker.openPicker(defaultOptions);
      console.log('选中的图片:', images);

      return images.map(image => ({
        uri: image.path,
        name: image.filename || `image_${Date.now()}.jpg`,
        type: image.mime,
        size: image.size,
        width: image.width,
        height: image.height,
        originalPath: image.path,
      }));
    } catch (error) {
      if (error.code !== 'E_PICKER_CANCELLED') {
        console.error('选择图片失败:', error);
        Alert.alert('错误', '选择图片失败');
      }
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // 从相册选择视频
  const pickVideo = useCallback(async (options = {}) => {
    setLoading(true);

    try {
      const defaultOptions = {
        mediaType: 'video',
        quality: 'medium',
        includeBase64: false,
        smartAlbums: [
          'UserLibrary',
          'Videos',
          'SlomoVideos',
          'Timelapses',
        ],
        ...options
      };

      const video = await ImagePicker.openPicker(defaultOptions);
      console.log('选中的视频:', video);

      return {
        uri: video.path,
        name: video.filename || `video_${Date.now()}.mp4`,
        type: video.mime,
        size: video.size,
        width: video.width,
        height: video.height,
        duration: video.duration,
        originalPath: video.path,
      };
    } catch (error) {
      if (error.code !== 'E_PICKER_CANCELLED') {
        console.error('选择视频失败:', error);
        Alert.alert('错误', '选择视频失败');
      }
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // 混合选择（图片+视频）
  const pickMixed = useCallback(async (options = {}) => {
    setLoading(true);

    try {
      const defaultOptions = {
        multiple: true,
        maxFiles: 10,
        mediaType: 'any', // 'photo', 'video', 'any'
        quality: 0.8,
        smartAlbums: [
          'UserLibrary',
          'PhotoStream',
          'Videos',
          'Favorites',
          'RecentlyAdded',
          'Screenshots',
        ],
        ...options
      };

      const media = await ImagePicker.openPicker(defaultOptions);
      console.log('选中的媒体文件:', media);

      return Array.isArray(media) ? media.map(item => ({
        uri: item.path,
        name: item.filename || `media_${Date.now()}.${item.mime.split('/')[1]}`,
        type: item.mime,
        size: item.size,
        width: item.width,
        height: item.height,
        duration: item.duration || null,
        mediaType: item.mime.startsWith('video') ? 'video' : 'photo',
        originalPath: item.path,
      })) : [{
        uri: media.path,
        name: media.filename || `media_${Date.now()}.${media.mime.split('/')[1]}`,
        type: media.mime,
        size: media.size,
        width: media.width,
        height: media.height,
        duration: media.duration || null,
        mediaType: media.mime.startsWith('video') ? 'video' : 'photo',
        originalPath: media.path,
      }];
    } catch (error) {
      if (error.code !== 'E_PICKER_CANCELLED') {
        console.error('选择媒体文件失败:', error);
        Alert.alert('错误', '选择媒体文件失败');
      }
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // 拍照
  const openCamera = useCallback(async (mediaType = 'photo') => {
    setLoading(true);

    try {
      const options = {
        mediaType,
        quality: 0.8,
        includeBase64: false,
      };

      const media = await ImagePicker.openCamera(options);
      console.log('拍摄的媒体:', media);

      return {
        uri: media.path,
        name: media.filename || `camera_${Date.now()}.${media.mime.split('/')[1]}`,
        type: media.mime,
        size: media.size,
        width: media.width,
        height: media.height,
        duration: media.duration || null,
        originalPath: media.path,
      };
    } catch (error) {
      if (error.code !== 'E_PICKER_CANCELLED') {
        console.error('拍摄失败:', error);
        Alert.alert('错误', '拍摄失败');
      }
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // 清理临时文件
  const cleanupTempFiles = useCallback(async () => {
    try {
      await ImagePicker.clean();
      console.log('临时文件清理完成');
    } catch (error) {
      console.error('清理临时文件失败:', error);
    }
  }, []);

  return {
    loading,
    pickMultipleImages,
    pickVideo,
    pickMixed,
    openCamera,
    cleanupTempFiles,
  };
}; 
