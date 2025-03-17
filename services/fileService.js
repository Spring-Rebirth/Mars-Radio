// 文件相关的服务函数

import { storage, handleError } from '../lib/appwrite';

export async function createFile(fileModel, setProgress, type) {
  const fileId = ID.unique(); // 自动生成唯一文件 ID
  try {
    const response = await storage.createFile(
      config.bucketId,
      fileId,
      fileModel,
      [],
      (progressEvent) => {
        if (typeof setProgress === 'function') {
          const progress = progressEvent.progress;
          const progressInt = Math.floor(progress);
          console.log(`上传进度：${progressInt}%`);
          setProgress({ type: type, percent: progressInt });
        }
      }
    );
    return { response, fileId };
  } catch (error) {
    console.log('Error in createFile:', error);
  }
}

// 其他与文件相关的函数... 