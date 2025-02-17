import React from "react";
import { View, Text, TextInput, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from "react-i18next";
import { createPost } from "../../services/postsService"

export default function CreatePost() {
  const router = useRouter();
  const { t } = useTranslation();

  const publishPost = async () => {
    try {
      await createPost(
        "New Post",
        "This is a new post",
        null
      );
      router.navigate("posts");
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
        />
      </View>
      <View className="mb-4">
        <Text className="mb-1 text-lg">{t("Content")}</Text>
        <TextInput
          placeholder={t("Enter content")}
          className="border border-gray-300 rounded p-2 h-40 text-top"
          multiline
        />
      </View>
      {/* 新增上传图片表单项 */}
      <View className="mb-4">
        <Text className="mb-1 text-lg">{t("Upload Image")}</Text>
        <Pressable className="border border-dashed border-gray-300 rounded p-4 justify-center items-center">
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
