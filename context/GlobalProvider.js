// cSpell:word appwrite
import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { getCurrentUser } from '../lib/appwrite';
import { syncDataToBackend } from '../lib/appwrite'; // 导入同步函数
import { useUser, useClerk } from '@clerk/clerk-expo';

export const GlobalContext = createContext();

const useGlobalContext = () => {
  return useContext(GlobalContext);
}

function GlobalProvider({ children }) {
  const { user: clerkUser, isLoaded } = useUser();
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const playDataRef = useRef({});

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

  const updatePlayData = async (video_ID, count) => {
    playDataRef.current[video_ID] = {
      count,
      lastPlayTime: Date.now(),
      synced: false,
    };
    // 立即同步数据到后端
    try {
      await syncDataToBackend(playDataRef);
      // console.log('播放数据同步成功');
    } catch (error) {
      console.error('同步播放数据失败:', error);
    }
  };

  return (
    <GlobalContext.Provider value={{
      user,
      setUser,
      isLoggedIn,
      setIsLoggedIn,
      isLoading,
      playDataRef,
      updatePlayData
    }}>
      {children}
    </GlobalContext.Provider>
  );
}

export { useGlobalContext, GlobalProvider };
