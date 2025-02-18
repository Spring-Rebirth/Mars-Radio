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

export { fetchAllPostsData, fetchPostData, createPost, createFileForPost, fetchFileUrl };