import { StatusBar } from 'expo-status-bar';
import { Image, ScrollView, Text, View, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { images } from "../constants";
import CustomButton from '../components/CustomButton';
import { router } from 'expo-router';
import { useGlobalContext } from '../context/GlobalProvider';
import home from '../assets/images/home.png';
import { useEffect, useState } from 'react';
import * as ScreenOrientation from 'expo-screen-orientation';
// cSpell:word pregular appwrite
//cSpell:ignore Aora pregular
export default function Welcome() {

  const { isLoading, isLoggedIn } = useGlobalContext();
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    if (isLoggedIn) {
      setIsNavigating(true); // 防止 Welcome 页面继续渲染
      router.replace('/home');
    }
  }, [isLoggedIn]);

  useEffect(() => {
    const lockPortrait = async () => {
      try {
        await ScreenOrientation.lockAsync(
          ScreenOrientation.OrientationLock.PORTRAIT_UP
        );
      } catch (error) {
        console.error('Failed to lock orientation:', error);
      }
    };

    // 当路由在 (tabs) 下时，锁定竖屏
    lockPortrait();

    return () => {
      ScreenOrientation.unlockAsync().catch(console.error);
    };
  }, []);

  // 如果正在跳转或者正在加载登录状态，避免渲染 Welcome 页面内容
  if (isNavigating || isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-primary">
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <SafeAreaView className="bg-primary h-full">
      <StatusBar style='auto' backgroundColor='#F5F5F5' />
      <ScrollView contentContainerStyle={{ height: '100%' }}>
        <View className='justify-center items-center min-h-[85vh] px-4'>
          <View className='flex-row items-center space-x-2 mb-1'>
            <Image
              source={images.logoSmall}
              resizeMode='contain'
              className='w-9 h-10'
            />
            <Text className='text-black text-4xl font-semibold'>MarsX</Text>
          </View>
          <View className='w-80 h-48 rounded-2xl overflow-hidden my-8'>
            <Image
              source={home}
              resizeMode='cover'
              className='w-full h-full rounded-2xl'
            />
          </View>
          <View className='relative mt-1'>
            <Text className='text-black text-3xl font-bold text-center'>
              Discover Endless{'\n'}
              Possibilities with{' '}
              <Text className='text-secondary-200'>MarsX</Text>
            </Text>
            <Image
              source={images.path}
              className='w-[136] h-[15] absolute -bottom-2.5 right-[58]'
              resizeMode='contain'
            />
          </View>
          <Text className='text-[#808080] text-center mt-6 font-pregular text-sm'>
            Where Creativity Meets Innovation: Embark on a Journey of Limitless
            Exploration with MarsX
          </Text>

          {isLoading ? (
            <View className="w-full h-20 justify-center items-center bg-primary mt-6">
              <ActivityIndicator size="large" color="#000" />
              <Text className='mt-[10] text-black text-xl'>Identifying login status</Text>
            </View>
          ) : (
            <CustomButton
              onPress={() => { router.push('/sign-in') }}
              style={'w-full mt-6 py-3'}
              title={'Login to continue'}
              textStyle={'text-lg text-[#F5F5F5]'}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

