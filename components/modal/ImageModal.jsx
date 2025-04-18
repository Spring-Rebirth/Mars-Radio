import React from "react";
import { View, Image, TouchableOpacity, Alert } from "react-native";
import Modal from "react-native-modal";
import * as FileSystem from "expo-file-system";
import * as MediaLibrary from "expo-media-library";
import { Text } from "react-native";

const ImageModal = ({ isVisible, imageSource, setIsVisible }) => {
  const downloadImage = async () => {
    try {
      // 请求权限
      const { status } = await MediaLibrary.requestPermissionsAsync();

      if (status !== "granted") {
        Alert.alert("权限拒绝", "需要存储权限来保存图片");
        return;
      }

      // 获取图片URI
      const uri = typeof imageSource === 'number'
        ? Image.resolveAssetSource(imageSource).uri
        : imageSource.uri;

      // 创建临时文件
      const fileUri = FileSystem.documentDirectory + "temp_image.jpg";
      await FileSystem.downloadAsync(uri, fileUri);

      // 保存到相册
      const asset = await MediaLibrary.createAssetAsync(fileUri);
      await MediaLibrary.createAlbumAsync("Mars-Radio", asset, false);

      Alert.alert("成功", "图片已保存到相册");
    } catch (error) {
      console.error(error);
      Alert.alert("错误", "保存图片失败");
    }
  };

  return (
    <Modal
      isVisible={isVisible}
      animationIn="zoomIn"
      animationOut="zoomOut"
      animationInTiming={400}
      animationOutTiming={400}
      backdropTransitionInTiming={400}
      backdropTransitionOutTiming={400}
      useNativeDriver={true}
      style={{ justifyContent: "center", marginTop: "-10%" }}
      onBackButtonPress={() => setIsVisible(false)}
      onBackdropPress={() => setIsVisible(false)}
    >
      <View className="bg-white p-6 rounded-lg items-center justify-center">
        <TouchableOpacity
          onPress={() => setIsVisible(false)}
          className="absolute right-2 top-2 z-10 p-1"
        >
          <Image
            source={require("../../assets/menu/close-fang.png")}
            className="w-6 h-6"
          />
        </TouchableOpacity>

        <Text className="mt-4 text-gray-500 text-base text-center px-2">
          如果你喜欢这个App, 请考虑赞助我。
        </Text>

        <Text className="text-gray-500 text-base text-center px-2">
          非常感谢你的支持！
        </Text>

        <Image
          source={imageSource}
          className="w-60 h-60"
          resizeMode="contain"
        />

        <TouchableOpacity
          onPress={downloadImage}
          className="mt-4 bg-blue-500 px-4 py-2 rounded-lg"
        >
          <Text className="text-white font-semibold">保存到相册</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

export default ImageModal;
