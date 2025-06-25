import { View, Text, TextInput, Image, TouchableOpacity } from 'react-native'
import React from 'react'
import { icons } from '../constants'

export default function CustomForm({ title, handleChangeText, value, placeholder }) {
  const [showPassword, setShowPassword] = React.useState(false)

  // 根据 title 动态设置输入框属性
  const getInputProps = () => {
    const baseProps = {
      autoCorrect: false,
      autoComplete: 'off',
      spellCheck: false,
    }

    if (title === 'Email') {
      return {
        ...baseProps,
        keyboardType: 'email-address',
        autoCapitalize: 'none',
        textContentType: 'emailAddress',
      }
    } else if (title === 'Password' || title === 'Confirm Password') {
      return {
        ...baseProps,
        textContentType: 'password',
        autoCapitalize: 'none',
      }
    } else {
      return {
        ...baseProps,
        textContentType: 'none',
      }
    }
  }

  return (
    <View className={`mt-4 space-y-2`}>
      <Text className={`text-[#808080] text-lg`}>{title}</Text>

      <View className='w-full h-16 bg-[#F0F0F0] border-2 border-black-200 rounded-2xl
                            focus:border-secondary relative'

      >

        <TextInput
          className='w-full h-full px-4 text-black'
          placeholder={` ${placeholder}`}
          placeholderTextColor='#7f7f7f'
          style={{ outline: 'none' }}
          secureTextEntry={(title === 'Password' || title === 'Confirm Password') && !showPassword}
          value={value}
          onChangeText={handleChangeText}
          {...getInputProps()}
        />
        {/* Show password icon */}
        {
          (title === 'Password' || title === 'Confirm Password')
            ? (
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}
                className='absolute right-4 top-4'
              >
                <Image
                  source={showPassword ? icons.eye : icons.eyeHide}
                  resizeMode='contain'
                  className='w-6 h-6'
                />
              </TouchableOpacity>
            )
            : null
        }

      </View>
    </View>
  )
}