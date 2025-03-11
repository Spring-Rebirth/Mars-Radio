// cSpell:word appwrite
import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { getCurrentUser } from '../lib/appwrite';
import { syncDataToBackend } from '../lib/appwrite';
import { useUser, useClerk } from '@clerk/clerk-expo';
import { router } from 'expo-router';
import { Alert } from 'react-native';

export const GlobalContext = createContext();

const useGlobalContext = () => {
  return useContext(GlobalContext);
}

function GlobalProvider({ children }) {
  const { user: clerkUser, isLoaded } = useUser();
  const { signOut } = useClerk();
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const playbackDataRef = useRef({});

  useEffect(() => {
    const fetchUser = async () => {
      if (isLoaded) {
        if (clerkUser) {
          try {
            const res = await getCurrentUser(clerkUser.id); // 确保 getCurrentUser 接受 userId
            if (res) {
              setIsLoggedIn(true);
              setUser(res);
              console.log('User is logged in');
            } else {
              setIsLoggedIn(false);
              setUser(null);
              console.log('User is not logged in');
            }
          } catch (error) {
            console.log("Error in fetching user:", error);
            setIsLoggedIn(false);
            setUser(null);
            Alert.alert('错误', '无法获取用户信息，请稍后再试。');
          } finally {
            setIsLoading(false);
          }
        } else {
          // clerkUser 为 null，用户未登录
          setIsLoggedIn(false);
          setUser(null);
          setIsLoading(false);
          console.log('User is not logged in');
        }
      }
    };

    fetchUser();
  }, [isLoaded, clerkUser]);

  const updatePlaybackData = async (video_ID, count) => {
    playbackDataRef.current[video_ID] = {
      count,
      lastPlaybackTime: Date.now(),
      synced: false,
    };

    try {
      await syncDataToBackend(playbackDataRef);
    } catch (error) {
      console.error('同步播放数据失败:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      setIsLoggedIn(false);
      setUser(null);
      router.replace('/sign-in');
    } catch (error) {
      console.log('Error logging out:', error);
      Alert.alert('注销错误', '无法注销，请稍后再试。');
    }
  };

  return (
    <GlobalContext.Provider value={{
      user,
      setUser,
      isLoggedIn,
      setIsLoggedIn,
      isLoading,
      playbackDataRef,
      updatePlaybackData,
      handleLogout
    }}>
      {children}
    </GlobalContext.Provider>
  );
}

export { useGlobalContext, GlobalProvider };
