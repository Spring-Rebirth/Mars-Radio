import { View, Text, Image, TouchableWithoutFeedback } from "react-native";
import { Tabs, useSegments, usePathname } from "expo-router";
import icons from "../../../constants/icons";
import { useWindowDimensions } from "react-native";
import { useTranslation } from "react-i18next";
import { useEffect, useCallback } from "react";
import * as ScreenOrientation from "expo-screen-orientation";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTabContext } from "../../../context/GlobalProvider";

function TabIcon({ name, icon, color, focused }) {
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  return (
    <View className="justify-center items-center gap-1.5 mt-5 w-14">
      <Image
        source={icon}
        resizeMode="contain"
        tintColor={color}
        className="w-6 h-6"
      />
      {/* //cSpell:disable-next-line */}
      {!isLandscape && (
        <Text
          style={{ color: color }}
          className={`text-xs ${focused ? "font-psemibold" : "font-pregular"}`}
        >
          {name}
        </Text>
      )}
    </View>
  );
}

export default function TabsLayout() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const segments = useSegments();
  const pathname = usePathname();
  const { triggerTabPress } = useTabContext();

  useEffect(() => {
    const lockPortrait = async () => {
      try {
        await ScreenOrientation.lockAsync(
          ScreenOrientation.OrientationLock.PORTRAIT_UP
        );
      } catch (error) {
        console.error("Failed to lock orientation:", error);
      }
    };

    // 当路由在 (tabs) 下时，锁定竖屏
    if (segments[0] === "(tabs)") {
      lockPortrait();
    }
  }, [segments]);

  // 处理Tab点击事件
  const handleTabPress = useCallback((tabName) => {
    // 检查是否当前已经在该Tab上
    // 注意: usePathname() 返回的路径包含"/"前缀
    const currentTab = pathname.split('/').pop();
    if (currentTab === tabName) {
      // 当前已经在该Tab上，触发点击事件
      triggerTabPress(tabName + 'Tab');
    }
  }, [pathname, triggerTabPress]);

  return (
    <Tabs
      screenOptions={{
        tabBarShowLabel: false,
        tabBarActiveTintColor: "#FFA001",
        tabBarInactiveTintColor: "#B0B0B0",
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          backgroundColor: "#F5F5F5",
          borderTopWidth: 0,
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: t("Home"),
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              name={t("Home")}
              icon={icons.home}
              color={color}
              focused={focused}
            />
          ),
          tabBarButton: (props) => (
            <TouchableWithoutFeedback
              {...props}
              onPress={() => {
                props.onPress();
                handleTabPress('home');
              }}
            >
              <View {...props} />
            </TouchableWithoutFeedback>
          ),
        }}
      />
      <Tabs.Screen
        name="posts"
        options={{
          title: t("Posts"),
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              name={t("Posts")}
              icon={require("../../../assets/icons/post/post-icon.png")}
              color={color}
              focused={focused}
            />
          ),
          tabBarButton: (props) => (
            <TouchableWithoutFeedback
              {...props}
              onPress={() => {
                props.onPress();
                handleTabPress('posts');
              }}
            >
              <View {...props} />
            </TouchableWithoutFeedback>
          ),
        }}
      />

      <Tabs.Screen
        name="create"
        options={{
          title: t("Create"),
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              name={t("Create")}
              icon={icons.plus}
              color={color}
              focused={focused}
            />
          ),
          tabBarButton: (props) => (
            <TouchableWithoutFeedback {...props}>
              <View {...props} />
            </TouchableWithoutFeedback>
          ),
        }}
      />
      <Tabs.Screen
        name="notice"
        options={{
          title: t("Notice"),
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              name={t("Notice")}
              icon={require("../../../assets/menu/notify.png")}
              color={color}
              focused={focused}
            />
          ),
          tabBarButton: (props) => (
            <TouchableWithoutFeedback {...props}>
              <View {...props} />
            </TouchableWithoutFeedback>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t("Profile"),
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              name={t("Profile")}
              icon={icons.profile}
              color={color}
              focused={focused}
            />
          ),
          tabBarButton: (props) => (
            <TouchableWithoutFeedback {...props}>
              <View {...props} />
            </TouchableWithoutFeedback>
          ),
        }}
      />
    </Tabs>
  );
}
