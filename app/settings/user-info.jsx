import {
  ActivityIndicator,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import CustomInputBox from "../../components/CustomInputBox";
import * as ImagePicker from "expo-image-picker";
import { fetchFileUrl, updateAvatar } from "../../lib/appwrite";
import { createFile } from "../../lib/appwrite";
import { useGlobalContext } from "../../context/GlobalProvider";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import CustomModal from "../../components/modal/CustomModal";
import CustomButton from "../../components/CustomButton";
import { updateUserInfo } from "../../services/userService";
import Toast from "react-native-toast-message";
import backArrowIcon from "../../assets/icons/back-arrow.png";
import { useRouter } from "expo-router";

const UserInfo = () => {
  const router = useRouter();
  const { t } = useTranslation();
  const { user, setUser } = useGlobalContext();
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [showEditNameModal, setShowEditNameModal] = useState(false);
  const [PressedUpload, setPressedUpload] = useState(false);
  const [newName, setNewName] = useState("");

  const handleAvatarUpload = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted) {
      const pickerResult = await ImagePicker.launchImageLibraryAsync();
      console.log("pickerResult:", pickerResult);
      if (!pickerResult.canceled) {
        setAvatarUploading(true);
        // 数据参数模型转换
        const { fileName, mimeType, fileSize, uri } = pickerResult.assets[0];
        const fileModel = {
          name: fileName,
          type: mimeType,
          size: fileSize,
          uri: uri,
        };
        console.log("fileModel:", fileModel);
        try {
          let file;
          await createFile(fileModel)
            .then((res) => {
              file = res;
            })
            .catch((err) => {
              console.warn("还没读取到创建的文件:", err);
              Alert.alert("Network error, please try again.");
            });

          if (file) {
            const { response, fileId } = file;

            console.log("createFile response:", response, fileId);

            const StorageAvatarUrl = await fetchFileUrl(fileId);

            console.log(`StorageAvatarUrl: ${StorageAvatarUrl}`);
            const result = await updateAvatar(StorageAvatarUrl, user?.$id);
            console.log("updateAvatar result:", result);
            setUser(result);
            if (result) {
              Toast.show({
                text1: t("Avatar uploaded successfully"),
                type: "success",
                topOffset: 68,
              });
            }
          }
        } catch (error) {
          console.error(error);
        } finally {
          setAvatarUploading(false);
        }
      }
    }
  };

  const changeUsername = async () => {
    setPressedUpload(true);

    const newUserInfo = await updateUserInfo(user.$id, { username: newName });

    if (newUserInfo) {
      setUser(newUserInfo);
      setShowEditNameModal(false);
      setPressedUpload(false);

      Toast.show(t("Username updated successfully"), {
        duration: 2500,
        position: Toast.positions.CENTER,
      });
    } else {
      setPressedUpload(false);

      Toast.show(t("Failed to update username.\n Please try again."), {
        duration: 2500,
        position: Toast.positions.CENTER,
      });
    }
  };

  return (
    <SafeAreaView className="flex-1">
      <ScrollView
        className="px-5"
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        <View className="flex-row items-center space-x-1">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-12 h-12 justify-center items-center -ml-2"
          >
            <Image source={backArrowIcon} style={{ width: 25, height: 25 }} />
          </TouchableOpacity>
          <Text className="text-xl font-JakartaBold my-5">
            {t("Edit Profile")}
          </Text>
        </View>

        <View className="flex relative items-center justify-center my-5">
          {avatarUploading ? (
            <View
              className="rounded-full h-[110px] w-[110px] border-[3px] border-white shadow-sm shadow-neutral-300
                        items-center justify-center"
            >
              <ActivityIndicator size="large" color="#000" />
            </View>
          ) : (
            <TouchableOpacity onPress={handleAvatarUpload}>
              <View className="relative border-4 border-gray-400 rounded-full p-1">
                <Image
                  source={require("../../assets/icons/change-avatar.png")}
                  className="w-10 h-10 absolute top-1/2 left-1/2 -mt-4 -ml-4 z-20"
                  resizeMode={"contain"}
                />
                <Image
                  source={{
                    uri: user?.avatar,
                  }}
                  style={{ width: 110, height: 110, borderRadius: 110 / 2 }}
                  className="rounded-full h-[110px] w-[110px] border-[3px] border-white shadow-sm shadow-neutral-300 opacity-60"
                />
              </View>
            </TouchableOpacity>
          )}
        </View>

        <View className="flex flex-col items-start justify-center bg-white rounded-lg shadow-sm shadow-neutral-300 px-5 py-3">
          <View className="flex flex-col items-start justify-start w-full">
            <View className="relative w-full">
              <CustomInputBox
                title={t("Name")}
                placeholder={user?.username || t("NotFound")}
                containerStyle="w-full"
                inputStyle="p-3.5"
                titleStyle=" mb-2"
                editable={false}
              />
              <TouchableOpacity
                onPress={() => setShowEditNameModal(true)}
                className="absolute right-7 bottom-[20] w-10 h-10 justify-center items-center"
              >
                <Image
                  source={require("../../assets/icons/pen.png")}
                  style={{ width: 25, height: 25 }}
                />
              </TouchableOpacity>
            </View>

            <CustomInputBox
              title={t("Email")}
              placeholder={user?.email || t("NotFound")}
              containerStyle="w-full"
              inputStyle="p-3.5"
              titleStyle="mb-2"
              editable={false}
            />

            <CustomInputBox
              title={t("Phone")}
              placeholder={t("NotFound")}
              containerStyle="w-full"
              inputStyle="p-3.5"
              titleStyle="mb-2"
              editable={false}
            />

            <CustomInputBox
              title={t("User Type")}
              placeholder={t("Regular")}
              containerStyle="w-full"
              inputStyle="p-3.5"
              titleStyle="mb-2"
              editable={false}
            />
          </View>
        </View>
      </ScrollView>

      <CustomModal
        isVisible={showEditNameModal}
        contentStyle={{
          height: 200,
          position: "absolute", // 让 Modal 固定位置
          bottom: 0, // 距离底部的距离
          left: 0,
          right: 0,
        }}
        onClose={() => setShowEditNameModal(false)}
      >
        <View className="w-full h-full py-4 items-center justify-start">
          <CustomInputBox
            title="Name"
            placeholder={"Type new name"}
            containerStyle="w-full"
            inputStyle="p-3.5"
            titleStyle=" mb-2"
            editable={true}
            focus={true}
            onChangeText={(text) => setNewName(text)}
            initialText={user?.username}
          />

          <CustomButton
            title="Save"
            onPress={changeUsername}
            textStyle={"text-white"}
            style={"w-11/12 h-12 mt-6"}
            isLoading={PressedUpload}
          />
        </View>
      </CustomModal>
    </SafeAreaView>
  );
};

export default UserInfo;
