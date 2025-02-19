import React from "react";
import { View, Image, TouchableOpacity } from "react-native";
import Modal from "react-native-modal";

const ImageModal = ({ isVisible, imageSource, setIsVisible }) => {
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

        <Image
          source={imageSource}
          className="w-60 h-60"
          resizeMode="contain"
        />
      </View>
    </Modal>
  );
};

export default ImageModal;
