// 帖子相关的服务函数

import { fetchData, handleError } from '../lib/appwrite';

export async function getAllPosts() {
  return await fetchData(
    config.databaseId,
    config.videosCollectionId,
    [Query.orderDesc('$createdAt')],
    'Failed to fetch all posts'
  );
}

export async function getPopularPosts() {
  return await fetchData(
    config.databaseId,
    config.videosCollectionId,
    [
      Query.greaterThanEqual("played_counts", 1),
      Query.orderDesc('played_counts'),
      Query.limit(10)
    ],
    'Failed to popular posts'
  );
}

export async function searchPosts(query) {
  try {
    return await fetchData(
      config.databaseId,
      config.videosCollectionId,
      [Query.search('title', query)],
      'Failed to search posts'
    );
  } catch (error) {
    console.warn('查询出错:', error);
  }
}

// 其他与帖子相关的函数... 