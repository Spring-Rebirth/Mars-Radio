import { useEffect } from 'react';
import * as ScreenOrientation from 'expo-screen-orientation';

const useForcePortrait = () => {
  useEffect(() => {
    const checkAndLockOrientation = async () => {
      try {
        // 获取当前屏幕方向
        const currentOrientation = await ScreenOrientation.getOrientationAsync();

        // 如果是横屏模式，强制切换到竖屏
        if (currentOrientation === ScreenOrientation.Orientation.LANDSCAPE_LEFT ||
          currentOrientation === ScreenOrientation.Orientation.LANDSCAPE_RIGHT) {
          await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
        }
      } catch (error) {
        console.error('Failed to lock screen orientation:', error);
      }
    };

    checkAndLockOrientation();

    // 清理函数 - 可选，如果需要在组件卸载时解除锁定
    return () => {
      ScreenOrientation.unlockAsync().catch(console.error);
    };
  }, []);
};

export default useForcePortrait;