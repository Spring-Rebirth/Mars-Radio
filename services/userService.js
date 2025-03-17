import { databases, config } from "../lib/appwrite";
import { fetchData, handleError } from '../lib/appwrite';
import { account, avatars } from '../lib/appwrite';
import { ID, Query } from 'react-native-appwrite';

export async function updateUserInfo(userId, content = {}) {
  try {
    const updateUserInfo = await databases.updateDocument(
      config.databaseId,
      config.usersCollectionId,
      userId,
      content
    );
    return updateUserInfo;
  } catch (error) {
    console.warn('updateUserInfo failed:', error.message);
  }
}

const fetchUserData = async (userId) => {
  try {
    const user = await databases.getDocument(
      config.databaseId,
      config.usersCollectionId,
      userId
    );
    console.log('appwrite user:', user);
    return user;
  } catch (error) {
    console.error('Error fetching user:', error);
  }
}

export { fetchUserData }

export const registerUser = async (email, password, username) => {
  try {
    const newAccount = await account.create(ID.unique(), email, password, username);
    const avatarURL = avatars.getInitials(username);
    await signIn(email, password);
    return { newAccount, avatarURL };
  } catch (error) {
    handleError(error, 'Failed to register user');
  }
};

export async function getCurrentUser(accountId) {
  try {
    const currentUserData = await fetchData(
      config.databaseId,
      config.usersCollectionId,
      [Query.equal('accountId', accountId)],
      'Failed to fetch user data'
    );
    return currentUserData.length > 0 ? currentUserData[0] : null;
  } catch (error) {
    console.log('Error in getCurrentUser', error);
    return null;
  }
}

export async function updateAvatar(avatarUrl, userId) {
  try {
    const updatedPost = await databases.updateDocument(
      config.databaseId,
      config.usersCollectionId,
      userId,
      { avatar: avatarUrl }
    );
    return updatedPost;
  } catch (error) {
    console.warn('updateAvatar failed:', error.message);
  }
}