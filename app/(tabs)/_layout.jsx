import { View, Text, Image, TouchableWithoutFeedback } from 'react-native'
import { Tabs } from 'expo-router'
import icons from '../../constants/icons'
import { useWindowDimensions } from 'react-native'
import { useTranslation } from 'react-i18next'
import * as ScreenOrientation from 'expo-screen-orientation';
import { useEffect } from 'react';

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

  // 全局锁定竖屏方向
  useEffect(() => {
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT);

    return () => {
      // 可选：在组件卸载时解锁方向
      ScreenOrientation.unlockAsync();
    };
  }, []);

  return (
    <Tabs screenOptions={{
      tabBarShowLabel: false,
      tabBarActiveTintColor: '#FFA001',
      tabBarInactiveTintColor: '#B0B0B0',
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