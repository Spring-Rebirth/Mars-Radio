import { Text, TouchableOpacity, View } from 'react-native'
import React from 'react'

export default function NoticeItem({ title, content, onPress }) {
  return (
    <TouchableOpacity
      className="m-4 p-4 rounded-lg bg-gray-100 border border-gray-300 shadow-lg"
      onPress={onPress}
    >
      <View className="pl-2">
        <Text className="text-sm font-bold text-gray-800">{title}</Text>
        <Text className="text-sm text-gray-600 mt-1">{content}</Text>
      </View>
    </TouchableOpacity>
  )
}