import { SafeAreaView, FlatList, View, Text, Pressable } from "react-native";
import { useState, useEffect } from "react";
import PostItem from "../../components/post/PostItem";
import { useRouter } from "expo-router";

export default function Posts() {
  const [posts, setPosts] = useState([]);
  const router = useRouter();

  useEffect(() => {
    // 模拟加载数据
    setPosts([
      {
        id: "1",
        title: "帖子一",
        content: "这是帖子一的内容",
        author: "作者A",
        time: "2023-10-01",
      },
      {
        id: "2",
        title: "帖子二",
        content: "这是帖子二的内容",
        author: "作者B",
        time: "2023-10-02",
      },
      {
        id: "3",
        title: "帖子三",
        content: "这是帖子三的内容",
        author: "作者C",
        time: "2023-10-03",
      },
    ]);
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-[#fafafa]">
      <View className="p-5 bg-white border-b border-gray-300 mb-3">
        <Text className="text-2xl font-bold text-gray-800 text-center">
          精彩帖子
        </Text>
      </View>
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => {
              router.push({
                pathname: "screens/post-details",
                params: { post: item },
              });
            }}
          >
            <PostItem {...item} />
          </Pressable>
        )}
        contentContainerStyle={{ padding: 16 }}
      />
    </SafeAreaView>
  );
}
