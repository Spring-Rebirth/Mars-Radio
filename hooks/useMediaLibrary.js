import { useState, useEffect, useCallback } from 'react';
import * as MediaLibrary from 'expo-media-library';
import { Alert } from 'react-native';

export const useMediaLibrary = () => {
  const [albums, setAlbums] = useState([]);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [endCursor, setEndCursor] = useState(null);
  const [hasNextPage, setHasNextPage] = useState(false);

  const PAGE_SIZE = 50;

  // 请求权限
  const requestPermission = useCallback(async () => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      const granted = status === 'granted';
      setHasPermission(granted);
      return granted;
    } catch (error) {
      console.error('权限请求失败:', error);
      return false;
    }
  }, []);

  // 获取相册列表
  const getAlbums = useCallback(async () => {
    if (!hasPermission) {
      const permission = await requestPermission();
      if (!permission) return;
    }

    setLoading(true);
    try {
      const albumsData = await MediaLibrary.getAlbumsAsync({
        includeSmartAlbums: true, // 包含智能相册
      });

      // 添加"所有照片"相册
      const allPhotosCount = await MediaLibrary.getAssetsAsync({
        first: 1,
        mediaType: 'photo',
      });

      const allPhotosAlbum = {
        id: 'all-photos',
        title: '所有照片',
        assetCount: allPhotosCount.totalCount,
        type: 'all',
      };

      setAlbums([allPhotosAlbum, ...albumsData]);
    } catch (error) {
      console.error('获取相册失败:', error);
      Alert.alert('错误', '获取相册失败');
    } finally {
      setLoading(false);
    }
  }, [hasPermission, requestPermission]);

  // 根据相册获取媒体资源
  const getAssetsByAlbum = useCallback(async (album, mediaType = 'photo') => {
    if (!hasPermission) return;

    setLoading(true);
    setAssets([]);
    setEndCursor(null);
    setHasNextPage(false);

    try {
      const options = {
        first: PAGE_SIZE,
        mediaType, // 'photo', 'video', 'audio', 'unknown'
        sortBy: 'creationTime',
      };

      // 如果不是"所有照片"，则指定相册
      if (album.id !== 'all-photos') {
        options.album = album;
      }

      const result = await MediaLibrary.getAssetsAsync(options);

      setAssets(result.assets);
      setEndCursor(result.endCursor);
      setHasNextPage(result.hasNextPage);

      console.log(`加载了 ${result.assets.length} 个资源，是否有更多: ${result.hasNextPage}`);
    } catch (error) {
      console.error('获取媒体资源失败:', error);
      Alert.alert('错误', '获取媒体资源失败');
    } finally {
      setLoading(false);
    }
  }, [hasPermission]);

  // 加载更多资源
  const loadMoreAssets = useCallback(async (album, mediaType = 'photo') => {
    if (!hasNextPage || loadingMore || loading) return;

    setLoadingMore(true);

    try {
      const options = {
        first: PAGE_SIZE,
        after: endCursor,
        mediaType,
        sortBy: 'creationTime',
      };

      if (album.id !== 'all-photos') {
        options.album = album;
      }

      const result = await MediaLibrary.getAssetsAsync(options);

      setAssets(prev => [...prev, ...result.assets]);
      setEndCursor(result.endCursor);
      setHasNextPage(result.hasNextPage);

      console.log(`加载更多：新增 ${result.assets.length} 个资源`);
    } catch (error) {
      console.error('加载更多资源失败:', error);
    } finally {
      setLoadingMore(false);
    }
  }, [hasNextPage, loadingMore, loading, endCursor]);

  // 获取资源详细信息
  const getAssetInfo = useCallback(async (asset) => {
    try {
      const assetInfo = await MediaLibrary.getAssetInfoAsync(asset);
      return {
        ...asset,
        ...assetInfo,
        name: assetInfo.filename,
        size: assetInfo.fileSize,
      };
    } catch (error) {
      console.error('获取资源详情失败:', error);
      return asset;
    }
  }, []);

  useEffect(() => {
    getAlbums();
  }, [getAlbums]);

  return {
    albums,
    assets,
    loading,
    loadingMore,
    hasPermission,
    hasNextPage,
    requestPermission,
    getAlbums,
    getAssetsByAlbum,
    loadMoreAssets,
    getAssetInfo,
  };
}; 
