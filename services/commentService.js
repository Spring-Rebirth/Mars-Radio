import { databases, config } from '../lib/appwrite';
import { Query } from 'react-native-appwrite';

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

export const submitReply = async (content, parentCommentId) => {
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
