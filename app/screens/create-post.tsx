import React, { useState } from "react";
import { View, Text, TextInput, Pressable, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from "react-i18next";
import { createPost } from "../../services/postsService"
import { useGlobalContext } from "../../context/GlobalProvider";
import { usePickFile } from "../../hooks/usePickFile";
import * as FileSystem from 'expo-file-system';
import mime from 'mime';

export default function CreatePost() {
  const router = useRouter();
  const { t } = useTranslation();
  const { user } = useGlobalContext();
  const [form, setForm] = React.useState({
    title: "",
    content: "",
    image: null,
    author: user?.$id,
  });
  const [imageFile, setImageFile] = useState<object | null>(null);

  const publishPost = async () => {
    try {
      await createPost(form);
      router.navigate("posts");
    } catch (error) {
      console.error(error);
    }
  }

  const { pickImage } = usePickFile();

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
      const fileSize = fileInfo.exists && 'size' in fileInfo ? fileInfo.size : 0;
      let mimeType: any;
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

  const handleUploadImages = async () => {
    try {
      await handlePickImage();
      if (imageFile) {
        setForm({ ...form, image: imageFile });
      }
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-white px-5 pt-5 pb-5">
      {/* 头部区域：包含返回图标 */}
      <View className="flex-row items-center mb-5">
        <Pressable onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </Pressable>
        <Text className="text-2xl font-bold ml-3">{t("Create Post")}</Text>
      </View>
      {/* 表单区域 */}
      <View className="mb-4">
        <Text className="mb-1 text-lg">{t("Title")} *</Text>
        <TextInput
          placeholder={t("Enter title")}
          className="border border-gray-300 rounded p-2"
          onChangeText={(text) => setForm({ ...form, title: text })}
        />
      </View>
      <View className="mb-4">
        <Text className="mb-1 text-lg">{t("Content")}</Text>
        <TextInput
          placeholder={t("Enter content")}
          className="border border-gray-300 rounded p-2 h-40 text-top"
          onChangeText={(text) => setForm({ ...form, content: text })}
          multiline
        />
      </View>
      {/* 新增上传图片表单项 */}
      <View className="mb-4">
        <Text className="mb-1 text-lg">{t("Upload Image")}</Text>
        <Pressable onPress={() => { handleUploadImages() }}
          className="border border-dashed border-gray-300 rounded p-4 justify-center items-center"
        >
          <Ionicons name="image-outline" size={24} color="gray" />
          <Text className="text-gray-500 mt-2">{t("Click to select image")}</Text>
        </Pressable>
      </View>
      <Pressable
        onPress={() => { publishPost() }}
        className="bg-blue-500 p-4 rounded justify-center items-center"
      >
        <Text className="text-white font-bold">{t("Publish")}</Text>
      </Pressable>
    </SafeAreaView>
  );
}
