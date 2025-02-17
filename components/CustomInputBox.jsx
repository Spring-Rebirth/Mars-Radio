import { View, Text, TextInput, Image, TouchableOpacity } from "react-native";
import React, { useState, useRef, useEffect } from "react";
import eyecrosslIcon from "../assets/icons/eyecross.png";
import { useTranslation } from "react-i18next";

export default function CustomInputBox({
  title,
  isSecure = false, // 是否为安全输入
  icon,
  onChangeText,
  textVisibleControl = null, // 外部传入是否显示文本的控制
  onVisibilityToggle = () => {}, // 外部控制显示/隐藏密码的回调
  className = "", // 外部自定义容器样式
  inputClassName = "", // 外部自定义 TextInput 样式
  placeholder = "",
  editable,
  titleStyle,
  focus,
  initialText = "",
}) {
  const [isFocused, setIsFocused] = useState(false);
  const [textVisible, setTextVisible] = useState(false);
  const textInputRef = useRef(null);
  const [text, setText] = useState(initialText);
  const { t } = useTranslation();

  // 打开模态框时，自动聚焦输入框
  useEffect(() => {
    if (focus) {
      setTimeout(() => {
        textInputRef.current.focus();
      }, 100);
    }
  }, [focus]);

  // 使用外部控制逻辑（如果传入 textVisibleControl），否则使用组件内部的状态
  const isTextVisible =
    textVisibleControl !== null ? textVisibleControl : textVisible;

  const handleVisibilityToggle = () => {
    // 切换显示/隐藏状态
    if (textVisibleControl === null) {
      setTextVisible((prev) => !prev); // 使用内部状态
    }
    onVisibilityToggle(); // 触发外部传入的回调
  };

  const handleTextChange = (text) => {
    setText(text);
    onChangeText(text);
  };

  return (
    <View className={`w-full items-center mb-4 ${className}`}>
      <Text className={`self-start ml-5 mb-1 font-semibold ${titleStyle}`}>
        {title}
      </Text>
      <View
        className={`w-11/12 h-12 rounded-full bg-[#F6F8FA] flex-row items-center px-4 relative ${
          isFocused ? "border border-[#3B82F6]" : ""
        } ${inputClassName}`}
      >
        {icon && (
          <Image className="w-5 h-5 mr-2" source={icon} resizeMode="contain" />
        )}
        <TextInput
          ref={textInputRef}
          value={text}
          className="flex-1 ml-2"
          secureTextEntry={isSecure && !isTextVisible} // 如果是安全输入且 textVisible 为 false，则隐藏文本
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onChangeText={handleTextChange}
          placeholder={t(placeholder)}
          editable={editable}
        />
        {isSecure && (
          <TouchableOpacity onPress={handleVisibilityToggle} className="p-2">
            <Image
              className="w-5 h-5"
              source={eyecrosslIcon} // 默认显示/隐藏图标
              resizeMode="contain"
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
