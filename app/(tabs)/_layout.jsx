import { View, Text, Image, TouchableWithoutFeedback } from 'react-native'
import { Tabs, useSegments } from 'expo-router'
import icons from '../../constants/icons'
import { useWindowDimensions } from 'react-native'
import { useTranslation } from 'react-i18next'
import { useEffect } from 'react'
import * as ScreenOrientation from 'expo-screen-orientation'

function TabIcon({ name, icon, color, focused }) {
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  return (
    <View className='justify-center items-center gap-1.5 mt-5 w-14'>
      <Image
        source={icon}
        resizeMode='contain'
        tintColor={color}
        className='w-6 h-6'
      />
      {/* //cSpell:disable-next-line */}
      {!isLandscape && (
        <Text
          style={{ color: color }}
          className={`text-xs ${focused ? 'font-psemibold' : 'font-pregular'}`}
        >
          {name}
        </Text>
      )}
    </View >
  )
}

export default function TabsLayout() {
  const { t } = useTranslation();

  const segments = useSegments();

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
    if (segments[0] === '(tabs)') {
      lockPortrait();
    }

  }, [segments]);

  return (
    <Tabs screenOptions={{
      tabBarShowLabel: false,
      tabBarActiveTintColor: '#FFA001',
      tabBarInactiveTintColor: '#B0B0B0',
      tabBarHideOnKeyboard: true,
      tabBarStyle: {
        backgroundColor: '#F5F5F5',
        borderTopWidth: 0,
        height: 60,
      }
    }}>
      <Tabs.Screen
        name='home'
        options={{
          title: t('Home'),
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              name={t('Home')}
              icon={icons.home}
              color={color}
              focused={focused} />
          ),
          tabBarButton: (props) => (
            <TouchableWithoutFeedback {...props}>
              <View {...props} />
            </TouchableWithoutFeedback>
          ),
        }}
      />
      <Tabs.Screen
        name='create'
        options={{
          title: t('Create'),
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              name={t('Create')}
              icon={icons.plus}
              color={color}
              focused={focused} />
          ),
          tabBarButton: (props) => (
            <TouchableWithoutFeedback {...props}>
              <View {...props} />
            </TouchableWithoutFeedback>
          ),
        }}
      />
      <Tabs.Screen
        name='saved'
        options={{
          title: t('Saved'),
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              name={t('Saved')}
              icon={icons.bookmark}
              color={color}
              focused={focused} />
          ),
          tabBarButton: (props) => (
            <TouchableWithoutFeedback {...props}>
              <View {...props} />
            </TouchableWithoutFeedback>
          ),
        }}
      />
      <Tabs.Screen
        name='profile'
        options={{
          title: t('Profile'),
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              name={t('Profile')}
              icon={icons.profile}
              color={color}
              focused={focused} />
          ),
          tabBarButton: (props) => (
            <TouchableWithoutFeedback {...props}>
              <View {...props} />
            </TouchableWithoutFeedback>
          ),
        }}
      />
    </Tabs>
  )
}