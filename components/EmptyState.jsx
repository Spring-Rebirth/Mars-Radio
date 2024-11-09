import { View, Text } from 'react-native'
import React from 'react'
import { Image } from 'react-native'
import { images } from '../constants'
import { useTranslation } from 'react-i18next'

//cSpell:words psemibold

export default function EmptyState() {
    const { t } = useTranslation()

    return (
        <View className='items-center '>
            <Image
                source={images.empty}
                className='w-[270px] h-[215px]'
                resizeMode='contain'
            />
            <Text className='mt-2 text-white font-psemibold text-xl'>{t("No Videos Found")}</Text>
            <Text className='text-gray-100'>{t("Be the first one to upload a video")}</Text>
        </View>
    )
}