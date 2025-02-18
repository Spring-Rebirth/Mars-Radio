import { databases, config } from "../lib/appwrite";

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