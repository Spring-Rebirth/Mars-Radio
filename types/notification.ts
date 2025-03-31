// 定义通知类型
export type NotificationType = 'general' | 'post' | 'comment' | 'user' | 'welcome';

// 通知数据结构接口
export interface NotificationData {
    postId?: string;
    commentId?: string;
    userId?: string;
    [key: string]: any;
}

// 通知项接口
export interface NotificationItem {
    id: string;
    title: string;
    body: string;
    createdAt: string;
    read: boolean;
    type: NotificationType;
    data: NotificationData;
}

// 通知统计接口
export interface NotificationStats {
    total: number;
    unread: number;
    today: number;
}

// 解析的URL参数接口
export interface ParsedNotificationData {
    title?: string;
    body?: string;
    data?: NotificationData;
    [key: string]: any;
} 