// cSpell:word appwrite
import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { getCurrentUser } from '../lib/appwrite';
import { syncDataToBackend } from '../lib/appwrite'; // 导入同步函数

export const GlobalContext = createContext();

const useGlobalContext = () => {
    return useContext(GlobalContext);
}

function GlobalProvider({ children }) {
    const [user, setUser] = useState(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const playDataRef = useRef({});

    useEffect(() => {
        getCurrentUser()
            .then((res) => {
                if (res) {
                    setIsLoggedIn(true);
                    setUser(res);
                    console.log('User is logged in');
                } else {
                    setIsLoading(false);
                    setUser(null);
                    console.log('User is not logged in');
                }
            })
            .catch((error) => {
                console.log("Error in fetching user:", error);
                setIsLoggedIn(false);
                setUser(null);
            })
            .finally(() => {
                setIsLoading(false);
            })
    }, []);

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
