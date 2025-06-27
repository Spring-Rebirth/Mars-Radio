import React from "react";
import { View } from "react-native";

// 页面指示器（圆点）组件
export default function PageIndicator({
    total = 0,
    currentIndex = 0,
    activeColor = "#333",
    inactiveColor = "#C4C4C4",
    dotSize = 8,
    spacing = 6,
}) {
    // 只有一页时不渲染指示器
    if (total <= 1) return null;

    return (
        <View
            style={{
                flexDirection: "row",
                justifyContent: "center",
                marginTop: 8,
            }}
        >
            {Array.from({ length: total }).map((_, idx) => (
                <View
                    key={idx}
                    style={{
                        width: dotSize,
                        height: dotSize,
                        borderRadius: dotSize / 2,
                        marginHorizontal: spacing / 2,
                        backgroundColor: idx === currentIndex ? activeColor : inactiveColor,
                    }}
                />
            ))}
        </View>
    );
} 
