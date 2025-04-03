// cSpell:words appwrite psemibold
import { useState } from 'react'
import { View, Text, Image, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import CustomForm from '../../../components/CustomForm'
import CustomButton from '../../../components/CustomButton'
import { icons } from '../../../constants'
import { usePickFile } from '../../../hooks/usePickFile'

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
import mime from 'mime';
import { useTranslation } from "react-i18next";
import Toast from 'react-native-root-toast';
import VideoPlayButton from '../../../components/VideoPlayButton';
import { LinearGradient } from 'expo-linear-gradient';

export default function Create() {
  const insetTop = useSafeAreaInsets().top;
  const { user } = useGlobalContext();
  const [form, setForm] = useState({ title: '' });
  const { pickImage, pickVideo } = usePickFile();
  const [uploading, setUploading] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [videoFile, setVideoFile] = useState(null);
  const isImageSelected = imageFile?.uri != null;
  const isVideoSelected = videoFile?.uri != null;
  const [progress, setProgress] = useState({ type: '', percent: 0 });
  const { t } = useTranslation();
  const [videoRef, setVideoRef] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const videoPlayer = useVideoPlayer(videoFile?.uri);

  // 处理图片选择
  const handlePickImage = async () => {
    try {
      const result = await pickImage();

      if (!result) {
        // 用户可能取消了选择
        return;
      }

      console.log('handlePickImage result:', result);
      const { uri, name } = result;
      const fileInfo = await FileSystem.getInfoAsync(uri);
      const fileSize = fileInfo.size;
      let mimeType;
      if (fileInfo.exists) {
        mimeType = mime.getType(uri);
        console.log(`File MIME type: ${mimeType}`);

      }
      const fileModel = { uri, name, type: mimeType, size: fileSize }

      setImageFile(fileModel);

    } catch (err) {
      console.log('Image selection failed:', err);
      Alert.alert('Error', 'There was an error selecting the image');
    }
  };

  const handlePickVideo = async () => {
    try {
      const result = await pickVideo();

      if (!result) {
        // 用户可能取消了选择
        return;
      }

      console.log('handlePickVideo result:', result);
      setVideoFile(result);

    } catch (err) {
      console.log('Video selection failed:', err);
      Alert.alert('Error', 'There was an error selecting the video');
    }
  };

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
        Alert.alert(t('Please fill in all required fields'));
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
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {/* Upload Video */}
        <View className='flex-row justify-between items-center mt-10 h-[60px]'>
          <Text className='text-black text-2xl font-psemibold'>{t("Upload Video")}</Text>
          <Image
            source={images.logoSmall}
            className='w-9 h-10'
            resizeMode='contain'
          />
        </View>

        <CustomForm
          title={t('Title')}
          handleChangeText={(text) => setForm({ ...form, title: text })}
          value={form.title}
          placeholder={t('Catchy titles get more clicks !')}
        />

        {/* Upload Video */}
        <Text className='text-[#808080] mt-5 text-lg'>{t('Video')}</Text>
        {/* TODO：视频存在则显示视频 */}
        {!isVideoSelected ? (
          <TouchableOpacity onPress={handlePickVideo}>
            <View className='w-full h-44 bg-[#D9D9D9] rounded-2xl mt-2 justify-center items-center'>
              <View className='w-14 h-14 border border-dashed border-secondary-100
                               justify-center items-center'>
                <Image
                  source={icons.upload}
                  className='w-1/2 h-1/2'
                />
              </View>
            </View>
          </TouchableOpacity>
        ) : (
          <View className='w-full h-56 bg-[#1e1e2d] rounded-2xl mt-2 justify-center items-center relative'>
            {videoPlayer && (
              <VideoView
                ref={ref => setVideoRef(ref)}
                player={videoPlayer}
                className='w-full h-full rounded-xl'
                contentFit="cover"
                nativeControls={false}
                loop={true}
              />
            )}

            <VideoPlayButton
              onPress={togglePlayback}
              isPlaying={isPlaying}
            />

            <TouchableOpacity
              onPress={() => handleCancelSelected('video')}
              className='absolute top-0 right-0 z-10 w-16 h-16 justify-start items-end py-1.5 px-2'
            >
              <Image
                source={closeY}
                className='w-6 h-6'
              />
            </TouchableOpacity>
          </View>
        )}

        {/* Thumbnail Image */}
        <Text className='text-[#808080] mt-5 text-lg'>{t("Thumbnail")}</Text>
        {/* TODO：图片存在则显示图片 */}
        {!isImageSelected ? (
          <View className='flex-row w-full justify-around mt-6 mb-8'>
            <TouchableOpacity onPress={handlePickImage}>
              <LinearGradient
                colors={['#3498db', '#8e44ad']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className='w-36 h-16 rounded-3xl flex-row justify-center items-center px-4'
              >
                <Text className='text-white'>{t("Choose File")}</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity onPress={generateThumbnailFromVideo}>
              <LinearGradient
                colors={['#2980b9', '#9b59b6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className='w-36 h-16 rounded-3xl flex-row justify-center items-center px-4'
              >
                <Text className='text-white'>{t("Auto Generate")}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : (
          <View className='w-full h-56 bg-[#1e1e2d] rounded-2xl mt-2 mb-8 flex-row justify-center items-center overflow-hidden relative'>
            <Image
              source={{ uri: imageFile?.uri }}
              className='w-full h-full'
              resizeMode='cover'
            />
            <TouchableOpacity
              onPress={() => handleCancelSelected('image')}
              className='absolute top-0 right-0 z-10 w-16 h-16 justify-start items-end py-1.5 px-2'
            >
              <Image
                source={closeY}
                className='w-6 h-6'
              />
            </TouchableOpacity>
          </View>
        )}

        {uploading ? (
          <View className="w-full h-20 justify-center items-center bg-primary mb-4">

            {progress.type !== 'Video' ? (
              <>
                <ActivityIndicator size="small" color="#000" />
                <Text className='text-black text-xl text-center mt-2'>
                  {t("Thumbnail Uploading")}
                </Text>
              </>
            ) : (
              <>
                <Progress.Bar
                  color="#02C2CC" unfilledColor='#fff'
                  progress={progress.percent / 100} width={230} borderWidth={1}
                />
                <Text className=' text-black text-xl text-center mt-2'>
                  {progress.percent} %
                </Text>
              </>
            )}
          </View>

        ) : false}

        {/* submit button */}
        <TouchableOpacity 
          onPress={() => { handleUpload() }}
          disabled={uploading}
        >
          <LinearGradient
            colors={['#FFB800', '#FF6B6B', '#FFA001']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            className='h-16 mb-8 rounded-xl flex-row justify-center items-center'
          >
            {uploading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text className='text-white font-psemibold text-lg'>{t('Submit & Publish')}</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>

      <StatusBar style='dark' />
    </View>
  )
}