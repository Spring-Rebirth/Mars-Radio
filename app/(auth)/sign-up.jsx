import { View, Image, Text, ScrollView, Alert, ActivityIndicator, TextInput } from 'react-native';
import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import images from '../../constants/images';
import CustomForm from '../../components/CustomForm';
import CustomButton from '../../components/CustomButton';
import { StatusBar } from 'expo-status-bar';
import { Link, router } from 'expo-router';
import { registerUser } from '../../lib/appwrite';
import { useGlobalContext } from '../../context/GlobalProvider';
import { databases } from '../../lib/appwrite';
import { config } from '../../lib/appwrite';
import { ID } from 'react-native-appwrite';
import * as ScreenOrientation from 'expo-screen-orientation';
import { updatePushToken } from '../../functions/notifications/index';
import { useTranslation } from 'react-i18next';
import { useSignUp } from '@clerk/clerk-expo'
import CustomModal from '../../components/modal/CustomModal';
import CustomButtonTwo from '../../components/CustomButtonTwo';
import check from '../../assets/images/check.png'

export default function SignUp() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const [form, setForm] = useState({ username: '', email: '', password: '', confirmPassword: '' });
  const { setUser, setIsLoggedIn } = useGlobalContext();
  const [isSubmitting, setIsSubmitting] = useState(false);
  // const [isTransitioning, setIsTransitioning] = useState(false); // 新增状态控制页面跳转
  const [pendingVerification, setPendingVerification] = React.useState(false);
  const [verifySuccess, setVerifySuccess] = React.useState(false);
  const [code, setCode] = React.useState('');
  const { t } = useTranslation();

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

    lockPortrait();

    return () => {
      ScreenOrientation.unlockAsync().catch(console.error);
    };
  }, []);

  async function submit() {
    if (form.username === '' || form.email === '' || form.password === '' || form.confirmPassword === '') {
      Alert.alert('Error', t('Please fill in all the fields!'));
      return;
    }
    if (form.password !== form.confirmPassword) {
      Alert.alert(t('Error'), t('The password and confirm password do not match.'));
      return;
    }

    setIsSubmitting(true);

    if (!isLoaded) {
      return;
    }

    try {
      await signUp.create({
        emailAddress: form.email,
        password: form.password,
        username: form.username
      })

      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' })

      setPendingVerification(true);
      setIsSubmitting(false);
    } catch (err) {
      console.error(JSON.stringify(err, null, 2));

      if (err && err.errors && err.errors.length > 0) {
        // 提取第一个错误的 message
        const errorMessage = err.errors[0].message;
        Alert.alert('Registration Error', errorMessage);
      } else {
        // 如果错误格式未知，显示通用错误信息
        Alert.alert('Registration Error', 'An unknown error occurred, please try again.');
      }
    }

  }

  const onPressVerify = async () => {
    try {
      // 注册用户
      if (!isLoaded) {
        return
      }

      try {
        const completeSignUp = await signUp.attemptEmailAddressVerification({
          code,
        })

        if (completeSignUp.status === 'complete') {
          //  添加用户信息到本地存储
          try {
            await api.createUser({
              name: username,
              email: emailAddress,
              clerkId: completeSignUp.createdUserId
            });

          } catch (error) {
            console.error('Error creating user:', error);
            // 根据需要处理错误，例如显示错误消息或提示用户重试
          }

          setVerifySuccess(true);

          await setActive({ session: completeSignUp.createdSessionId });

        } else {
          console.error(JSON.stringify(completeSignUp, null, 2));
        }
      } catch (err) {
        // See https://clerk.com/docs/custom-flows/error-handling
        // for more info on error handling
        console.error(JSON.stringify(err, null, 2));
        Alert.alert(err);
      }

      // 创建用户文档
      const userDocument = await databases.createDocument(
        config.databaseId,
        config.usersCollectionId,
        ID.unique(),
        {
          accountId: newAccount.$id,
          email: newAccount.email,
          username: newAccount.name,
          avatar: avatarURL,
        }
      );

      // 更新全局用户状态
      setUser(userDocument);
      setIsLoggedIn(true);

      // 确保所有状态更新完成后再进行页面跳转
      setIsSubmitting(false);
      // setIsTransitioning(true); // 标记进入跳转状态

      // 更新推送令牌
      await updatePushToken();

      setTimeout(() => {
        router.replace('/home');
      }, 2000); // 延迟 100 毫秒以确保状态同步完成

    } catch (error) {
      Alert.alert('Error', error.message);
      setIsSubmitting(false);
    }
  }

  if (isSubmitting) {
    return (
      <View className="flex-1 justify-center items-center bg-primary">
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <>
      <SafeAreaView className='flex-1 bg-primary'>
        <ScrollView contentContainerStyle={{ height: '100%' }}>
          <View className='h-full justify-center px-6'>
            <View className='h-[85vh] justify-center'>

              <View className='flex-row items-center space-x-2'>
                <Image
                  source={images.logoSmall}
                  resizeMode='contain'
                  className='w-9 h-10'
                />
                <Text className='text-black text-4xl font-semibold'>MarsX</Text>
              </View>

              <Text className='text-black text-2xl font-psemibold mt-6'>Sign up</Text>

              <CustomForm title='User Name'
                handleChangeText={(text) => setForm({ ...form, username: text })}
                value={form.username}
                placeholder={'Give your account a catchy name'}
              />
              <CustomForm title='Email'
                handleChangeText={(text) => setForm({ ...form, email: text })}
                value={form.email}
                placeholder={'Enter your email address'}
              />
              <CustomForm title='Password'
                handleChangeText={(text) => setForm({ ...form, password: text })}
                value={form.password}
                placeholder={'Enter your new password'}
              />
              <CustomForm title='Confirm Password'
                handleChangeText={(text) => setForm({ ...form, confirmPassword: text })}
                value={form.confirmPassword}
                placeholder={'Enter your password to confirm'}
              />

              <CustomButton
                title='Sign Up'
                style='h-16 mt-6 py-3'
                textStyle={'text-lg text-[#F5F5F5]'}
                onPress={submit}
                isLoading={isSubmitting}
              />
              <View className='items-center mt-6'>
                <Text className='text-[#808080]'>
                  Already have an account ?&nbsp;&nbsp;
                  <Link
                    href='/sign-in'
                    className='text-secondary'>Sign in
                  </Link>
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>

        <CustomModal isVisible={pendingVerification}>
          <View className='w-full h-full px-8 justify-center'>

            <View className='mb-3 -mt-4'>
              <Text className='text-2xl font-bold'>
                Verification
              </Text>
              <Text>We sent a verification code to</Text>
              <Text>{form.email}</Text>
            </View>

            <Text className='text-xl font-semibold'>
              Code
            </Text>

            <TextInput
              className='bg-[#F6F8FA] my-3 h-12 rounded-full border border-sky-400
                                    py-1.5 text-center'
              keyboardType={'numeric'}
              placeholder='Enter Code'
              onChangeText={text => setCode(text)}
            />

            <CustomButtonTwo
              onPress={onPressVerify}
              containerStyle={'w-full mt-6 bg-green-500'}
              title={'Verify Email'}
            />
          </View>

        </CustomModal>

        <CustomModal isVisible={verifySuccess}>
          <View className='w-full h-full px-8 items-center justify-center'>
            <Image
              className='w-[100] h-[100] mb-10'
              source={check}
            />
            <Text className='text-xl font-bold mb-2 text-center'>
              Verification Successful
            </Text>

            <Text className='text-center text-gray-500 mb-10'>
              Auto-redirect to homepage after{'\n'} 2 seconds.
            </Text>
          </View>
        </CustomModal>

        <StatusBar style='dark' />

      </SafeAreaView>
    </>
  );
}
