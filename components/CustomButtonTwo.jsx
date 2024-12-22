import { Text, TouchableOpacity } from 'react-native'
import React from 'react'

export default function CustomButton({ containerStyle, titleStyle, title, onPress, disabled }) {
  return (
    <TouchableOpacity
      className={`w-full h-12 rounded-full ${disabled ? 'bg-gray-400' : 'bg-[#0286FF]'}  justify-center \
             items-center ${containerStyle}`}
      onPress={onPress}
      disabled={disabled}
    >
      <Text className={`text-white font-bold ${titleStyle}`}>
        {disabled ? 'Confirmed' : title}
      </Text>
    </TouchableOpacity>
  )
}