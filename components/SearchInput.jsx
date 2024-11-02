import { View, TextInput, Image, TouchableOpacity, Alert } from 'react-native'
import { useState } from 'react'
import { icons } from '../constants'
import { router, usePathname } from 'expo-router';
import { useTranslation } from 'react-i18next'

export default function SearchInput({containerStyle }) {
    const [queryText, setQueryText] = useState('');
    const pathname = usePathname();
    const { t } = useTranslation();

    return (
        <View className={`w-full h-16 bg-[#1e1e2d] border-2 border-black-200 rounded-2xl \
                        focus:border-secondary relative flex-row items-center ${containerStyle}`}
        >
            <TextInput
                className={'flex-1 h-full px-4 text-white'}
                placeholder={t("Search by the beginning of the title")}
                placeholderTextColor={'#7f7f7f'}
                style={{ outline: 'none' }}
                value={queryText}
                onChangeText={(text) => { setQueryText(text) }}
            />

            <TouchableOpacity className='mr-4'
                onPress={
                    (!queryText)
                        ? () => { Alert.alert('Please enter your search keyword') }
                        : (pathname.startsWith('/search')
                            ? () => { router.setParams({ query: queryText }) }
                            : () => { router.push(`/search/${queryText}`) })
                }
            >
                <Image
                    source={icons.search}
                    className='w-5 h-5'
                />

            </TouchableOpacity>
        </View>

    )
}