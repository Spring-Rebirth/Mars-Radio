import { Client, Account, ID, Avatars, Databases, Query, Storage } from 'react-native-appwrite';

export const config = {
  endpoint: 'https://cloud.appwrite.io/v1',
  platform: 'com.mystseed.aora',
  projectId: '66e00f73002ee6e0e71f',
  databaseId: '66e0120d0001cf7791eb',
  postColletionId: '67b36cdf001dac351bc2',
  commentColletionId: '67b36d4b0022869e7da5',
  bucketId: '67b3725e003728e3505b'
};

const client = new Client();
client.setEndpoint(config.endpoint).setProject(config.projectId).setPlatform(config.platform);

export const account = new Account(client);
export const databases = new Databases(client);
const avatars = new Avatars(client);
const storage = new Storage(client);

const fetchAllPostsData = async () => {
  try {
    const posts = await databases.listDocuments(
      config.databaseId,
      config.postColletionId
    );
    return posts;
  } catch (error) {
    console.error('Error fetching all posts:', error);
  }

}

const fetchPostData = async (postId) => {
  try {
    const post = await databases.getDocument(
      config.databaseId,
      config.postColletionId,
      [Query.equal('$id', postId)]
    );
    return post;
  } catch (error) {
    console.error('Error fetching post:', error);
  }
}

const createPost = async (fileModel) => {
  let documentId = ID.unique();
  try {
    const result = await databases.createDocument(
      config.databaseId,
      config.postColletionId,
      documentId,
      fileModel
    );
    return result;

  } catch (error) {
    console.error('Error creating post:', error);
  }
}

const createFileForPost = async (file) => {
  const fileId = ID.unique();
  try {
    const response = await storage.createFile(
      config.bucketId,
      fileId,
      file
    );
    return { response, fileId };
  } catch (error) {
    console.error('Error creating file:', error);
  }
}

async function fetchFileUrl(fileId) {
  try {
    const url = storage.getFileView(
      config.bucketId,
      fileId
    );
    return url;
  } catch (error) {
    console.warn('Error in getFileFromStorage:', error);
  }
}

// 评论服务函数 ---------------------------------------------------------------------
const fetchCommentsOfPost = async (post_id) => {
  try {
    const comments = await databases.listDocuments(
      config.databaseId,
      config.commentColletionId,
      [Query.equal('post_id', post_id)]
    );
    return comments;
  } catch (error) {
    console.error('Error fetching all posts:', error);
  }
}

export const sendLikedStatus = async (commentId, userId, isLiked) => {
  try {
    // 获取评论文档
    const comment = await databases.getDocument(
      config.databaseId, // 替换为你的数据库 ID
      config.commentColletionId, // 替换为你的评论集合 ID
      commentId
    );

    // 获取当前的 liked_users 数组
    const likedUsers = comment.liked_users || [];

    if (isLiked) {
      // 如果是点赞，且用户尚未点赞，则添加用户 ID
      if (!likedUsers.includes(userId)) {
        await databases.updateDocument(
          config.databaseId, // 替换为你的数据库 ID
          config.commentColletionId, // 替换为你的评论集合 ID
          commentId,
          {
            liked_users: [...likedUsers, userId], // 将 userId 添加到数组中
          }
        );
        console.log("点赞成功");
      } else {
        console.log("用户已经点赞");
      }
    } else {
      // 如果是取消点赞，且用户已点赞，则移除用户 ID
      if (likedUsers.includes(userId)) {
        const updatedLikedUsers = likedUsers.filter(id => id !== userId); // 移除用户 ID
        await databases.updateDocument(
          config.databaseId, // 替换为你的数据库 ID
          config.commentsCollectionId, // 替换为你的评论集合 ID
          commentId,
          {
            liked_users: updatedLikedUsers, // 更新数组
          }
        );
        console.log("取消点赞成功");
      } else {
        console.log("用户未点赞");
      }
    }
  } catch (error) {
    console.error("更新点赞状态时出错:", error);
  }
};

export const fetchReplies = async (parentCommentId) => {
  try {
    const replies = await databases.listDocuments(
      config.databaseId,
      config.commentColletionId,
      [
        Query.equal("parent_comment_ID", parentCommentId)
      ]
    );
    return replies.documents; // 返回子评论数组
  } catch (error) {
    console.error("Failed to fetch replies:", error);
    return [];
  }
};

export const submitReply = async (content, parentCommentId, userId, post_id) => {
  try {
    await databases.createDocument(
      config.databaseId,
      config.commentColletionId,
      ID.unique(),
      {
        content: content,
        parent_comment_ID: parentCommentId,
        creator: userId,
        post_id
      }
    );
    console.log('Reply submitted successfully');
  } catch (error) {
    console.error('Failed to submit reply:', error);
  }
};


export {
  fetchAllPostsData,
  fetchPostData,
  createPost,
  createFileForPost,
  fetchFileUrl,
  fetchCommentsOfPost,
};