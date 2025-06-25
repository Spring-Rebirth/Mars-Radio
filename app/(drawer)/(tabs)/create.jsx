// cSpell:words appwrite psemibold
import { useState, useEffect } from 'react'
import { View, Text, Image, TouchableOpacity, ScrollView, Alert, ActivityIndicator, TextInput } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { icons } from '../../../constants'
import { VideoView, useVideoPlayer } from 'expo-video'
import { useGlobalContext } from '../../../context/GlobalProvider'
import { useUploadFile } from '../../../hooks/useUploadFile'
import { fetchFileUrl, uploadData } from '../../../lib/appwrite'
import { StatusBar } from 'expo-status-bar'
import { images } from '../../../constants'
import closeY from '../../../assets/icons/close.png'
import * as VideoThumbnails from 'expo-video-thumbnails';
import * as FileSystem from 'expo-file-system';
import * as Progress from 'react-native-progress';
import { useTranslation } from "react-i18next";
import Toast from 'react-native-root-toast';
import VideoPlayButton from '../../../components/VideoPlayButton';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons'
import { useImageCropPicker } from '../../../hooks/useImageCropPicker';

export default function Create() {
  const insetTop = useSafeAreaInsets().top;
  const { user } = useGlobalContext();
  const [form, setForm] = useState({ title: '' });
  const [uploading, setUploading] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [videoFile, setVideoFile] = useState(null);
  const isImageSelected = imageFile?.uri != null;
  const isVideoSelected = videoFile?.uri != null;
  const [progress, setProgress] = useState({ type: '', percent: 0 });
  const { t } = useTranslation();
  const [isPlaying, setIsPlaying] = useState(false);

  const videoPlayer = useVideoPlayer(videoFile?.uri);

  const {
    pickMultipleImages,
    pickVideo: pickVideoFromCropPicker,
    pickMixed,
    openCamera,
    cleanupTempFiles
  } = useImageCropPicker();

  // 处理图片选择
  const handlePickImage = async () => {
    try {
      const images = await pickMultipleImages({
        maxFiles: 10,
        cropping: true, // 可以开启裁剪
        compressImageQuality: 0.8,
      });

      if (images.length > 0) {
        setImageFile(images[0]);
        console.log('选中的图片:', images[0]);
      }
    } catch (error) {
      console.error('选择图片失败:', error);
      Alert.alert('错误', '选择图片失败');
    }
  };

  // 处理视频选择
  const handlePickVideo = async () => {
    try {
      const video = await pickVideoFromCropPicker({
        compressVideoPreset: 'MediumQuality',
      });

      if (video) {
        setVideoFile(video);
        console.log('选中的视频:', video);
      }
    } catch (error) {
      console.error('选择视频失败:', error);
      Alert.alert('错误', '选择视频失败');
    }
  };

  // 混合选择
  const handlePickMixed = async () => {
    try {
      const media = await pickMixed({
        maxFiles: 5,
        mediaType: 'any',
      });

      console.log('选中的媒体文件:', media);
      // 处理混合媒体选择结果
    } catch (error) {
      console.error('选择媒体失败:', error);
    }
  };

  // 拍照
  const handleOpenCamera = async (type = 'photo') => {
    try {
      const media = await openCamera(type);

      if (media) {
        if (type === 'photo') {
          setImageFile(media);
        } else {
          setVideoFile(media);
        }
      }
    } catch (error) {
      console.error('拍摄失败:', error);
    }
  };

  // 组件卸载时清理临时文件
  useEffect(() => {
    return () => {
      cleanupTempFiles();
    };
  }, [cleanupTempFiles]);

  // 生成视频缩略图
  const generateThumbnailFromVideo = async () => {
    if (!videoFile || !videoFile?.uri) {
      Alert.alert(t('Please select a video first'));
      return;
    }

    console.log('videoFile:', videoFile);
    console.log('videoFile.uri:', videoFile?.uri);

    try {
      const { uri: thumbnailUri } = await VideoThumbnails.getThumbnailAsync(
        videoFile.uri,
        {
          time: 0, // 获取视频的第一帧
          quality: 1
        }
      );

      const fileInfo = await FileSystem.getInfoAsync(thumbnailUri);
      const fileSize = fileInfo.size;
      console.log('Thumbnail URI:', thumbnailUri);
      console.log('Thumbnail Size:', fileSize, 'bytes');

      setImageFile({ uri: thumbnailUri, name: 'thumbnail.jpg', type: 'image/jpeg', size: fileSize });

    } catch (err) {
      console.log('Failed to generate thumbnail:', err);
      Alert.alert('Error', 'There was an error generating the thumbnail');
    }
  };

  const handleUpload = async () => {
    setUploading(true);
    console.log('imageFile:', imageFile, '\n', 'videoFile', videoFile);
    try {
      if (form.title === '' || !isImageSelected || !isVideoSelected) {
        Alert.alert(t('Please fill in all required content'));
        setUploading(false);
        return;
      }

      // 上传文件
      const [imageUpload, videoUpload] = await Promise.all([
        useUploadFile(imageFile, setProgress, 'Image'),
        useUploadFile(videoFile, setProgress, 'Video'),
      ]);

      if (!imageUpload || !videoUpload) {
        throw new Error('One or more files failed to upload');
      }

      // 有时候可能因为网络的问题没有上传成功
      const { fileId: image_ID } = imageUpload;
      const { fileId: video_ID } = videoUpload;
      console.log(`image_ID: ${image_ID} \n video_ID: ${video_ID}`);

      // 获取数据库的图片和视频URI
      const StorageImageUrl = await fetchFileUrl(image_ID);
      const StorageVideoUrl = await fetchFileUrl(video_ID);
      console.log(`StorageImageUrl: ${StorageImageUrl} \n 'StorageVideoUrl:' ${StorageVideoUrl}`);


      const formData = {
        title: form.title,
        thumbnail: StorageImageUrl,
        video: StorageVideoUrl,
        creator: user.$id,
        image_ID,                     // 存储 image_ID
        video_ID,                     // 存储 video_ID
      }
      // 修改这里URI为从数据库获取
      const videoResult = await uploadData(formData);

      Toast.show(t('Upload Success !'), {
        duration: 1500,
        position: Toast.positions.CENTER
      });

      console.log('Upload Success  videoResult:', JSON.stringify(videoResult, null, 2));

      setForm({ title: '' });
      setImageFile(null);
      setVideoFile(null);
    } catch (e) {
      console.error(t("Upload Failed"), e);
      Alert.alert(t('File upload failed', 'Please try again.'));
    } finally {
      setUploading(false);
      setProgress({ type: '', percent: 0 });
    }
  };

  const handleCancelSelected = (type) => {
    if (type === 'image') {
      setImageFile(null);
    } else if (type === 'video') {
      setVideoFile(null);
      // 同时清除缩略图
      setImageFile(null);
    }
  };

  // 控制视频播放状态
  const togglePlayback = () => {
    if (!videoPlayer) return;

    if (isPlaying) {
      videoPlayer.pause();
    } else {
      videoPlayer.play();
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <View className='bg-primary h-full px-4 ' style={{ marginTop: insetTop }}>
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Upload Video */}
        <View className='relative mb-1'>
          <LinearGradient
            colors={['#3498db', '#8e44ad']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            className='h-[80px] rounded-2xl justify-center px-5 mt-5'
          >
            <View className='flex-row justify-between items-center'>
              <Text className='text-white text-2xl font-psemibold'>{t("Upload Video")}</Text>
              <View className='bg-white/20 p-2 rounded-full'>
                <Image
                  source={images.logoSmall}
                  className='w-9 h-10'
                  resizeMode='contain'
                />
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* 自定义标题输入组件 */}
        <View className="mt-4">
          <Text className="text-[#808080] text-lg mb-2">{t('Title')}</Text>
          <View className="relative">
            <LinearGradient
              colors={['#d1e3fa', '#b6d3f9']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="rounded-xl overflow-hidden"
            >
              <View className="border-[1px] border-blue-200 rounded-xl overflow-hidden">
                <TextInput
                  className="w-full h-16 px-4 text-gray-800 text-base"
                  placeholder={t('Catchy titles get more clicks !')}
                  placeholderTextColor="#6b7eaa"
                  value={form.title}
                  onChangeText={(text) => setForm({ ...form, title: text })}
                />
              </View>
            </LinearGradient>
            {form.title.length > 0 && (
              <TouchableOpacity
                className="absolute right-3 top-[21px]"
                onPress={() => setForm({ ...form, title: '' })}
              >
                <View className="w-6 h-6 bg-blue-400 rounded-full flex justify-center items-center">
                  <Text className="text-white text-xs font-bold">×</Text>
                </View>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Upload Video */}
        <Text className='text-[#808080] mt-5 text-lg'>{t('Video')}</Text>
        {/* 视频选择区域 */}
        {!isVideoSelected ? (
          <TouchableOpacity onPress={handlePickVideo}>
            <LinearGradient
              colors={['#2c3e50', '#34495e']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className='w-full h-48 rounded-2xl mt-2 justify-center items-center overflow-hidden'
            >
              <View className='w-16 h-16 bg-white/20 rounded-full justify-center items-center'>
                <Image
                  source={icons.upload}
                  className='w-8 h-8'
                  tintColor="#fff"
                />
              </View>
              <Text className='text-white mt-3 font-medium'>{t('Tap to select video')}</Text>
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <View className='w-full h-56 rounded-2xl mt-2 justify-center items-center relative overflow-hidden shadow-lg'>
            {videoPlayer && (
              <VideoView
                player={videoPlayer}
                className='w-full h-full rounded-xl'
                contentFit="cover"
                nativeControls={false}
                loop={true}
              />
            )}

            <LinearGradient
              colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 0.5 }}
              className='absolute top-0 left-0 right-0 h-16'
            />

            <VideoPlayButton
              onPress={togglePlayback}
              isPlaying={isPlaying}
            />

            <TouchableOpacity
              onPress={() => handleCancelSelected('video')}
              className='absolute top-2 right-2 z-10 w-8 h-8 bg-black/30 rounded-full justify-center items-center'
            >
              <Image
                source={closeY}
                className='w-5 h-5'
              />
            </TouchableOpacity>
          </View>
        )}

        {/* Thumbnail Image */}
        <Text className='text-[#808080] mt-5 text-lg'>{t("Thumbnail")}</Text>

        {!isImageSelected ? (
          <View className='flex-row w-full justify-around mt-4 mb-8'>
            <TouchableOpacity onPress={handlePickImage}>
              <LinearGradient
                colors={['#3498db', '#2980b9']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className='w-40 h-16 rounded-xl flex-row justify-center items-center px-4 shadow-sm'
              >
                <Image
                  source={icons.upload}
                  className='w-5 h-5 mr-2'
                  tintColor="#fff"
                />
                <Text className='text-white font-medium'>{t("Choose File")}</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity onPress={generateThumbnailFromVideo}>
              <LinearGradient
                colors={['#9b59b6', '#8e44ad']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className='w-40 h-16 rounded-xl flex-row justify-center items-center px-4 shadow-sm'
              >
                <Image
                  source={icons.upload}
                  className='w-5 h-5 mr-2'
                  tintColor="#fff"
                />
                <Text className='text-white font-medium'>{t("Auto Generate")}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : (
          <View className='w-full h-56 rounded-2xl mt-2 mb-8 flex-row justify-center items-center overflow-hidden relative shadow-lg'>
            <Image
              source={{ uri: imageFile?.uri }}
              className='w-full h-full'
              resizeMode='cover'
            />

            <LinearGradient
              colors={['rgba(0,0,0,0.4)', 'rgba(0,0,0,0)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 0.5 }}
              className='absolute top-0 left-0 right-0 h-16'
            />

            <TouchableOpacity
              onPress={() => handleCancelSelected('image')}
              className='absolute top-2 right-2 z-10 w-8 h-8 bg-black/30 rounded-full justify-center items-center'
            >
              <Image
                source={closeY}
                className='w-5 h-5'
              />
            </TouchableOpacity>
          </View>
        )}

        {uploading ? (
          <View className="w-full rounded-xl p-4 justify-center items-center bg-gray-50 mb-4 shadow-sm">
            {progress.type !== 'Video' ? (
              <>
                <ActivityIndicator size="small" color="#8e44ad" />
                <Text className='text-gray-700 text-base text-center mt-2'>
                  {t("Thumbnail Uploading")}
                </Text>
              </>
            ) : (
              <>
                <Progress.Bar
                  color="#8e44ad" unfilledColor='#e0e0e0' borderColor="#8e44ad"
                  progress={progress.percent / 100} width={230} borderWidth={0.5}
                  height={8} borderRadius={4}
                />
                <Text className='text-gray-700 text-base text-center mt-2'>
                  {progress.percent}% {t("Completed")}
                </Text>
              </>
            )}
          </View>
        ) : null}

        {/* submit button */}
        <TouchableOpacity
          onPress={() => { handleUpload() }}
          disabled={uploading}
          className="mb-8 shadow-md"
        >
          <LinearGradient
            colors={['#4a6cf7', '#3b82f6', '#2563eb']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            className='h-16 rounded-xl flex-row justify-center items-center'
          >
            {uploading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name='paper-plane' size={24} color='white' style={{ marginRight: 8 }} />
                <Text className='text-white font-psemibold text-lg'>
                  {t('Submit & Publish')}
                </Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>

      <StatusBar style='dark' />
    </View>
  )
}