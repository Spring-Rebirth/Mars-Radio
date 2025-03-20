// 帖子相关的服务函数
import { Query } from 'react-native-appwrite';
import { config, databases } from '../lib/appwrite';

export async function getPostsWithPagination(cursor = null, limit = 10) {
  let queries = [Query.orderDesc('$createdAt'), Query.limit(limit)];
  if (cursor) {
    queries.push(Query.cursorAfter(cursor));
  }
  try {
    const response = await databases.listDocuments(
      config.databaseId,
      config.videosCollectionId,
      queries
    );
    return response.documents; // 返回 documents 数组
  } catch (error) {
    console.error('Error fetching posts:', error);
    throw error;
  }
}
