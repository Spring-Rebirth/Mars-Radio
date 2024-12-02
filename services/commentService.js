import { databases, config } from '../lib/appwrite';
import { ID, Query } from 'react-native-appwrite';

export async function fetchCommentsData(videoId) {
  try {
    const result = await databases.listDocuments(
      config.databaseId,
      config.commentsCollectionId,
      [
        Query.equal('video_ID', videoId),
        Query.equal('parent_comment_ID', ""),
        Query.orderDesc('$createdAt')
      ],
    );
    return result.documents || [];
  } catch (error) {
    console.error('Error fetching comments:', error);
    return [];
  }
}

export const fetchReplies = async (parentCommentId) => {
  try {
    const replies = await databases.listDocuments(
      config.databaseId,
      config.commentsCollectionId,
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

export const fetchCommentUsername = async (userId) => {
  try {
    const user = await databases.getDocument(
      config.databaseId,
      config.usersCollectionId,
      userId
    );
    return user.username;
  } catch (error) {
    console.error('Failed to fetch username:', error);
  }
}

export const fetchCommentUser = async (userId) => {
  try {
    const user = await databases.getDocument(
      config.databaseId,
      config.usersCollectionId,
      userId
    );
    return user;
  } catch (error) {
    console.error('Failed to fetch user:', error);
  }
}

export const submitReply = async (content, parentCommentId, userId, videoId) => {
  try {
    await databases.createDocument(
      config.databaseId,
      config.commentsCollectionId,
      ID.unique(),
      {
        content: content,
        parent_comment_ID: parentCommentId,
        user_ID: userId,
        video_ID: videoId,
      }
    );
    console.log('Reply submitted successfully');
  } catch (error) {
    console.error('Failed to submit reply:', error);
  }
};

export const sendLikedStatus = async (commentId, userId, isLiked) => {
  try {
    // 获取评论文档
    const comment = await databases.getDocument(
      config.databaseId, // 替换为你的数据库 ID
      config.commentsCollectionId, // 替换为你的评论集合 ID
      commentId
    );

    // 获取当前的 liked_users 数组
    const likedUsers = comment.liked_users || [];

    if (isLiked) {
      // 如果是点赞，且用户尚未点赞，则添加用户 ID
      if (!likedUsers.includes(userId)) {
        await databases.updateDocument(
          config.databaseId, // 替换为你的数据库 ID
          config.commentsCollectionId, // 替换为你的评论集合 ID
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
