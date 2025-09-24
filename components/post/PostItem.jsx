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
                className="rounded-2xl p-0.5"
            >
                <View className="bg-white rounded-xl p-5">
                    <Text className="text-xl font-extrabold mb-3 text-gray-900">
                        {title}
                    </Text>

                    {(images || image) && (
                        <Image
                            source={{ uri: images[0] ?? image }}
                            className="w-full h-40 rounded-lg"
                            resizeMode="cover"
                        />
                    )}

                    <Text
                        className="text-base text-gray-600 leading-6 mb-4"
                        numberOfLines={3}
                        lineBreakMode={"tail"}
                    >
                        {content}
                    </Text>


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
            </LinearGradient>
        </View>
    );
}
