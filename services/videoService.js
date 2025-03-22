// 帖子相关的服务函数
import { Query } from 'react-native-appwrite';
import { config, databases, storage } from '../lib/appwrite';

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
    const documents = response.documents;

    // 优化每个文档的 thumbnail URL
    const optimizedDocs = await Promise.all(
      documents.map(async (doc) => {
        if (doc.thumbnail) {
          doc.thumbnail = await getOptimizedImageUrl(doc.thumbnail);
        }
        return doc;
      })
    );

    return optimizedDocs; // 返回优化后的文档数组
  } catch (error) {
    console.error('Error fetching posts:', error);
    throw error;
  }
}

// 提取 bucketId 和 fileId
function extractBucketAndFileId(url) {
  const regex = /buckets\/([^\/]+)\/files\/([^\/]+)/;
  const match = url.match(regex);
  if (match) {
    return { bucketId: match[1], fileId: match[2] };
  }
  return null;
}

// 生成优化后的图片 URL
async function getOptimizedImageUrl(originalUrl, width = 525, height = 300, quality = 40) {
  const ids = extractBucketAndFileId(originalUrl);
  if (!ids) return originalUrl;

  try {
    const preview = storage.getFilePreview(
      ids.bucketId,
      ids.fileId,
      width,
      height,
      undefined, // gravity，可选参数
      quality
    );
    return preview.href; // 返回优化后的 URL
  } catch (error) {
    console.error('Error generating preview URL:', error);
    return originalUrl; // 出错时回退到原始 URL
  }
}
