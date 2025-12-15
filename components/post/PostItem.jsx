import React from "react";
import { View, Text, Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from '@expo/vector-icons';

export default function PostItem({ $id, title, content, author_name, $createdAt, image, images }) {
    return (
        <View className="mb-5">
            <LinearGradient
                colors={['#FFB800', '#FF6B6B', '#FFA001']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="rounded-2xl p-0.5 overflow-hidden"
            >
                <View className="bg-white rounded-xl">
                    {(images || image) && (
                        <Image
                            source={{ uri: images[0] ?? image }}
                            className="w-full h-40 rounded-t-2xl"
                            resizeMode="cover"
                        />
                    )}
                    <View className="px-5 py-2">
                        <Text className="text-xl font-extrabold text-gray-900">
                            {title}
                        </Text>

                        {content && (
                            <Text
                                className="text-base text-gray-600 leading-6"
                                numberOfLines={3}
                                lineBreakMode={"tail"}
                            >
                                {content}
                            </Text>
                        )}

                        <View className="flex-row justify-between items-center mt-2">
                            <View className="flex-row items-center">
                                <Text className="text-sm text-gray-700 font-semibold">
                                    {author_name}
                                </Text>
                            </View>

                            <View className="flex-row items-center">
                                <Ionicons name="calendar-outline" size={16} color="#666" style={{ marginRight: 4 }} />
                                <Text className="text-sm text-gray-500">
                                    {$createdAt.split("T")[0]}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>
            </LinearGradient>
        </View>
    );
}
