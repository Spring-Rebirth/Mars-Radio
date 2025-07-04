import React, { useState } from "react";
import { View, Text, TextInput, Pressable, Alert, Image, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { createPost, fetchFileUrl } from "../../services/postsService";
import { useGlobalContext } from "../../context/GlobalProvider";
import { useImageCropPicker } from "../../hooks/useImageCropPicker";
import { useUploadFileForPost } from "../../hooks/useUploadFile";
import LoadingModal from "../../components/modal/LoadingModal";
import Toast from "react-native-toast-message";
import DraggableFlatList from "react-native-draggable-flatlist";

export default function CreatePost() {
  const router = useRouter();
  const { t } = useTranslation();
  const { user } = useGlobalContext();
  const [form, setForm] = React.useState({
    title: "",
    content: "",
    author: user?.$id,
    author_name: user?.username,
  });
  // 存储多张图片
  const [imageFiles, setImageFiles] = useState([]);
  const { pickMultipleImages } = useImageCropPicker();
  const [onPublish, setOnPublish] = useState(false);

  const handlePickImage = async () => {
    try {
      const results = await pickMultipleImages();

      if (!results || results.length === 0) {
        // 用户取消选择
        return;
      }

      console.log("handlePickImage results:", results);

      // 为每张图片生成唯一 key 方便拖拽排序
      const resultsWithId = results.map((img, idx) => ({ ...img, key: `${Date.now()}_${idx}` }));

      // 若已选择过图片，则追加；否则直接覆盖
      setImageFiles(prev => [...prev, ...resultsWithId]);
    } catch (err) {
      console.log("Image selection failed:", err);
      Alert.alert("Error", "There was an error selecting the image");
    }
  };

  // 删除指定索引的图片
  const handleDeleteImage = (index) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handlePublishPost = async () => {
    if (form.title == "") {
      Toast.show({
        type: "error",
        topOffset: "80",
        visibilityTime: 5000,
        text1: t("Title is required"),
      });
      return;
    }
    setOnPublish(true);
    try {
      if (imageFiles.length > 0) {
        const imageUrls = [];
        const uploadedFileIds = [];
        try {
          for (const file of imageFiles) {
            const imageUpload = await useUploadFileForPost(file);
            if (!imageUpload) throw new Error('Image upload failed');

            const { fileId: image_ID } = imageUpload;
            uploadedFileIds.push(image_ID);

            const storageImageUrl = await fetchFileUrl(image_ID);
            imageUrls.push(storageImageUrl);
          }

          const fileModel = {
            title: form.title.trim(),
            content: form.content.trim(),
            author: form.author,
            author_name: form.author_name,
            images: imageUrls,
            image: imageUrls[0]
          };

          await createPost(fileModel);
        } catch (err) {
          // 上传过程中有失败，回滚已上传文件
          for (const id of uploadedFileIds) {
            try { await storage.deleteFile(config.bucketId, id); } catch (_) { }
          }
          throw err;
        }
        console.log("发布成功");
        router.navigate("posts");
        Toast.show({
          type: "success",
          topOffset: "80",
          text1: t("Publish Successful"),
        });
      } else {
        const fileModel = {
          title: form.title.trim(),
          content: form.content.trim(),
          author: form.author,
          author_name: form.author_name,
        };

        await createPost(fileModel);
        console.log("发布成功");
        router.navigate("posts");
        Toast.show({
          type: "success",
          topOffset: "80",
          text1: t("Publish Successful"),
        });
      }
    } catch (error) {
      console.error(error);
      Toast.show({
        type: "error",
        topOffset: "80",
        text1: t("Publish Failed"),
      });
    } finally {
      setOnPublish(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white px-5">
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
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
            className="border border-gray-300 rounded p-2 h-40"
            onChangeText={(text) => setForm({ ...form, content: text })}
            multiline
            textAlignVertical="top"
          />
        </View>
        {/* 新增上传图片表单项 */}
        <View className="mb-4">
          <Text className="mb-1 text-lg">{t("Upload Image")}</Text>
          {imageFiles.length === 0 ? (
            <Pressable
              onPress={() => {
                handlePickImage();
              }}
              className="border border-dashed border-gray-300 rounded p-3 flex justify-center items-center"
            >
              <Ionicons name="image-outline" size={24} color="gray" />
              <Text className="text-gray-500 mt-2">
                {t("Click to select image")}
              </Text>
            </Pressable>
          ) : (
            <View className="w-full border-2 border-sky-500 rounded overflow-hidden">
              {/* 网格预览 & 拖拽排序 (DraggableFlatList) */}
              <DraggableFlatList
                data={imageFiles}
                keyExtractor={(item) => item.key}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingVertical: 4 }}
                onDragEnd={({ data }) => setImageFiles(data)}
                renderItem={({ item, index, drag, isActive }) => (
                  <Pressable
                    onLongPress={drag}
                    disabled={isActive}
                    className="m-1.5 relative"
                    style={{ width: 100 }}
                  >
                    <Image
                      source={{ uri: item.uri }}
                      style={{ width: 100, height: 100, borderRadius: 6, opacity: isActive ? 0.8 : 1 }}
                      resizeMode="cover"
                    />
                    <Pressable
                      onPress={() => handleDeleteImage(index)}
                      className="absolute -top-2 -right-2 bg-black/60 rounded-full p-1"
                    >
                      <Ionicons name="close" size={14} color="white" />
                    </Pressable>
                  </Pressable>
                )}
              />
            </View>
          )}

          <View className="flex-row justify-between mt-8 mb-2">
            {/* 继续添加图片按钮 - 总是在网格下方展示 */}
            {imageFiles.length > 0 && (
              <>
                <Pressable
                  onPress={handlePickImage}
                  className="flex-row items-center p-2"
                >
                  <Ionicons name="add-circle-outline" size={20} color="gray" />
                  <Text className="text-gray-500 ml-1">{t("Add more")}</Text>
                </Pressable>

                <Pressable
                  onPress={() => setImageFiles([])}
                  className="flex-row items-center ml-4 p-2"
                >
                  <Ionicons name="trash-outline" size={20} color="gray" />
                  <Text className="text-gray-500 ml-1">{t("Clear all")}</Text>
                </Pressable>
              </>
            )}
          </View>
        </View>
        <Pressable
          onPress={() => {
            handlePublishPost();
          }}
          className="bg-blue-500 p-4 rounded justify-center items-center"
        >
          <Text className="text-white font-bold">{t("Publish")}</Text>
        </Pressable>
        <LoadingModal
          isVisible={onPublish}
          loadingText={t("Publishing post...")}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
