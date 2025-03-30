import React, { createContext, useContext, useState } from 'react';

// 创建抽屉导航上下文
const DrawerNavigationContext = createContext();

// 自定义Hook用于访问抽屉导航上下文
export const useDrawerNavigation = () => {
    return useContext(DrawerNavigationContext);
};

// 默认菜单项
const defaultMenuItems = [
    {
        icon: 'home-outline',
        label: '首页',
        route: '/',
    },
    {
        icon: 'apps-outline',
        label: '标签页',
        route: '/(tabs)',
    },
    {
        icon: 'person-outline',
        label: '个人资料',
        route: '/(tabs)/profile',
    },
    {
        icon: 'settings-outline',
        label: '设置',
        route: '/(tabs)/settings',
    },
];

export const DrawerNavigationProvider = ({ children }) => {
    const [menuItems, setMenuItems] = useState(defaultMenuItems);

    // 更新菜单项
    const updateMenuItems = (newMenuItems) => {
        setMenuItems(newMenuItems);
    };

    // 添加菜单项
    const addMenuItem = (newItem) => {
        setMenuItems(prev => [...prev, newItem]);
    };

    // 删除菜单项
    const removeMenuItem = (routeToRemove) => {
        setMenuItems(prev => prev.filter(item => item.route !== routeToRemove));
    };

    return (
        <DrawerNavigationContext.Provider
            value={{
                menuItems,
                updateMenuItems,
                addMenuItem,
                removeMenuItem,
            }}
        >
            {children}
        </DrawerNavigationContext.Provider>
    );
};

export default DrawerNavigationProvider; 