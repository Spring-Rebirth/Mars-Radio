// cSpell:disable
import { Client, Account, ID, Avatars, Databases, Query, Storage } from 'react-native-appwrite';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const config = {
    endpoint: 'https://cloud.appwrite.io/v1',
    platform: 'com.mystseed.marsx',
    projectId: '66e00f73002ee6e0e71f',
    databaseId: '66e0120d0001cf7791eb',
    usersCollectionId: '66e01296000e1559c22d',
    videosCollectionId: '66e012ab002da534981d',
    commentsCollectionId: '67262689003d6f1e0c5f',
    adminsCollectionId: '672f02c5001a7ad7e367',
    bucketId: '66e0170c001977799119',
    functionId: '66eff7670021b6ca34c5'
};

// Init your React Native SDK
const client = new Client();
client.setEndpoint(config.endpoint).setProject(config.projectId).setPlatform(config.platform);

export const account = new Account(client);
export const databases = new Databases(client);
export const avatars = new Avatars(client);
export const storage = new Storage(client);

// 通用的错误处理函数
const handleError = (error, customMessage = "Error") => {
    console.error(`${customMessage}:`, error.message || error);
    throw new Error(error.message || "Unknown error occurred");
};

// 通用数据库查询函数
export const fetchData = async (databaseId, collectionId, queries = [], customErrorMsg = 'Failed to fetch data') => {
    try {
        const result = await databases.listDocuments(databaseId, collectionId, queries);

        return result.documents;
    } catch (error) {
        handleError(error, customErrorMsg);
    }
};

export const fetchAdminData = async () => {
    return await fetchData(
        config.databaseId,
        config.adminsCollectionId,
        [],
        'Failed to fetch admin data'
    );
}

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

export async function signIn(email, password) {
    try {
        const session = await account.getSession('current');
        if (session) await account.deleteSession('current');
    } catch (error) {
        if (error.code !== 404) {
            console.log('Enter the login phase');
        }
    }

    try {
        const newSession = await account.createEmailPasswordSession(email, password);
        return newSession;
    } catch (error) {
        handleError(error, 'Failed in signIn method');
    }
}

// Get current user data
export async function getCurrentUser(accountId) {
    try {

        const currentUserData = await fetchData(
            config.databaseId,
            config.usersCollectionId,
            [Query.equal('accountId', accountId)],
            'Failed to fetch user data'
        );

        console.log('currentUserData:', currentUserData[0]);

        return currentUserData.length > 0 ? currentUserData[0] : null;

    } catch (error) {
        console.log('Error in getCurrentUser', error);
        return null;
    }
}

// 获取所有帖子
export async function getAllPosts() {
    return await fetchData(
        config.databaseId,
        config.videosCollectionId,
        [Query.orderDesc('$createdAt')],
        'Failed to fetch all posts'
    );
}

// 获取带分页的最新帖子
export async function getPostsWithPagination(cursor = null, limit = 10) {
    const queries = [
        Query.orderDesc('$createdAt'), // 按创建时间降序排列（最新在前）
        Query.limit(limit)            // 限制返回数量
    ];

    if (cursor) {
        // 如果提供了 cursor，则从该 cursor 之后开始查询
        queries.push(Query.cursorAfter(cursor));
    }

    // 使用通用的 fetchData 函数执行查询
    return await fetchData(
        config.databaseId,
        config.videosCollectionId,
        queries,
        'Failed to fetch posts with pagination' // 自定义错误消息
    );
}

// 获取最热门帖子
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

// 搜索帖子
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

//搜索用户已收藏的帖子
export async function searchSavedPosts(query, userFavorite) {
    return await fetchData(
        config.databaseId,
        config.videosCollectionId,
        [
            Query.contains('$id', userFavorite),
            Query.search('title', query),
            Query.orderDesc('$createdAt')
        ],
        'Failed to search saved posts'
    );
}

// 获取用户帖子
export async function getUserPosts(userId) {
    return await fetchData(
        config.databaseId,
        config.videosCollectionId,
        [
            Query.equal('creator', userId),
            Query.orderDesc('$createdAt')
        ],
        'Failed to get user posts'
    );
}

// 创建文件对象
export async function createFile(fileModel, setProgress, type) {
    const fileId = ID.unique();     // 自动生成唯一文件 ID

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

export async function uploadData(formData) {
    try {
        const response = await databases.createDocument(
            config.databaseId,
            config.videosCollectionId,
            ID.unique(),    // 自动生成唯一文档 ID
            formData
        );
        console.log('Data uploaded successfully');
        return response;
    } catch (error) {
        handleError(error, 'Data upload failed');
    }
}

export async function fetchFileUrl(fileId) {
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

export async function updateSavedVideo(documentId, data) {
    try {
        const result = await databases.updateDocument(
            config.databaseId,
            config.usersCollectionId,
            documentId,
            data
        );
        return result;
    } catch (error) {
        console.warn('updateSavedVideo Failed:', error);
    }
}

export async function getSavedPosts(userFavorite) {
    console.log('Enter getSavedPosts()')
    console.log('userFavorite:', userFavorite);
    if (!userFavorite || userFavorite.length === 0) {
        console.log('current user not saved any video');
        return [];  // 返回空数组，表示没有收藏的视频
    }
    return await fetchData(
        config.databaseId,
        config.videosCollectionId,
        [
            // 查询在 user.favorite数组中存在的'$id'
            Query.contains('$id', userFavorite),
            Query.orderDesc('$createdAt')
        ],
        'Failed to get saved posts'
    );
}

export async function deleteVideoDoc(video_ID) {
    try {
        const result = await databases.deleteDocument(
            config.databaseId,
            config.videosCollectionId,
            video_ID
        );
        console.log('deleteDocument-result:', result.name);
    } catch (error) {
        console.warn('DeleteVideoDoc Failed:', error);
    }
}

export async function deleteVideoFiles(fileId) {
    try {
        const result = await storage.deleteFile(
            config.bucketId,
            fileId
        );
        console.log('deleteFile-result:', result.name);
    } catch (error) {
        console.warn('DeleteVideoFiles Failed:', error);
    }
}

export async function updateSavedCounts(postId, isIncrement) {

    const post = await databases.getDocument(
        config.databaseId,
        config.videosCollectionId,
        postId
    );
    // 获取当前的收藏数，如果没有，则初始化为 0
    const currentsaved_counts = post.saved_counts || 0;

    // 根据 isIncrement 增加或减少收藏数
    const newsaved_counts = isIncrement ? currentsaved_counts + 1 : currentsaved_counts - 1;

    // 确保收藏数不能小于 0
    const updatedsaved_counts = newsaved_counts < 0 ? 0 : newsaved_counts;

    try {
        const updatedPost = await databases.updateDocument(
            config.databaseId,
            config.videosCollectionId,
            postId,
            {
                saved_counts: updatedsaved_counts,
            }
        );
        return updatedPost;
    } catch (error) {
        console.error('updatesaved_counts failed:', error.message);
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

export async function getVideoDetails(postId) {
    try {
        const post = await databases.getDocument(
            config.databaseId,
            config.videosCollectionId,
            postId
        );

        return post;
    } catch (error) {
        console.warn('getVideoDetails failed:', error);
    }
}

export const syncDataToBackend = async (dataRef) => {
    // 新的数据结构是一个普通对象，不再需要.current
    const playbackData = dataRef.current ? dataRef.current : dataRef;

    // 提取未同步的数据
    const unsyncedData = Object.entries(playbackData).filter(
        ([_, value]) => !value.synced
    );

    if (unsyncedData.length === 0) {
        // 没有需要同步的数据
        return;
    }

    try {
        // 对每个未同步的视频，逐一更新
        for (const [video_ID, data] of unsyncedData) {
            const { count } = data;

            // 调用您的 API，更新播放次数
            const updatedDocument = await databases.updateDocument(
                config.databaseId,
                config.videosCollectionId,
                video_ID,
                { played_counts: count }
            );

            // 标记为已同步
            playbackData[video_ID].synced = true;
        }

        // 更新本地存储
        await AsyncStorage.setItem('playbackData', JSON.stringify(playbackData));

        // console.log('所有播放数据已同步到后端');
    } catch (error) {
        console.error('同步播放数据到后端失败:', error);
    }
};
