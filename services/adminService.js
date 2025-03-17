// 管理员相关的服务函数

import { fetchData } from '../lib/appwrite';

export const fetchAdminData = async () => {
  return await fetchData(
    config.databaseId,
    config.adminsCollectionId,
    [],
    'Failed to fetch admin data'
  );
} 