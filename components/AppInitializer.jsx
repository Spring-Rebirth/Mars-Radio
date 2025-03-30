import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { useDataManager } from '../hooks/useDataManager';

/**
 * 应用初始化组件
 * 使用自定义hooks初始化应用所需的所有数据和状态
 * 接收children作为prop并渲染它们，而不是返回空JSX
 */
export default function AppInitializer({ children }) {
    // 使用自定义hook处理认证
    useAuth();

    // 使用自定义hook处理数据管理
    useDataManager();

    // 不返回null，而是返回children
    return children;
} 