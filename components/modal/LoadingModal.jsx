import React from "react";
import { View, Text, ActivityIndicator } from "react-native";
import Modal from "react-native-modal";
import { useTranslation } from "react-i18next";

const LoadingModal = ({ isVisible, loadingText }) => {
  const { t } = useTranslation();

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
    >
      <View className="bg-white p-6 rounded-lg items-center justify-center">
        <ActivityIndicator size="large" color="#0000ff" />
        <Text className="mt-3 text-gray-600">
          {loadingText || t("Loading...")}
        </Text>
      </View>
    </Modal>
  );
};

export default LoadingModal;
