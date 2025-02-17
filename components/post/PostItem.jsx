import React from "react";
import { View, Text } from "react-native";

export default function PostItem({ title, content, author, time }) {
  return (
    <View className="bg-white rounded-xl p-5 mb-5 border border-gray-300 shadow">
      <Text className="text-xl font-extrabold mb-2.5 text-gray-900">
        {title}
      </Text>
      <Text className="text-base text-gray-600 leading-6 mb-4">{content}</Text>
      <View className="flex-row justify-between">
        <Text className="text-sm text-gray-500">{author}</Text>
        <Text className="text-sm text-gray-500">{time}</Text>
      </View>
    </View>
  );
}
