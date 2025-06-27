import { View, Text, FlatList, Pressable } from "react-native";
import { useInfiniteQuery } from "@tanstack/react-query";
import { fetchPostsWithPagination } from "../../services/postsService";
import { router } from "expo-router";
import PostItem from "./PostItem";


export default function MyPosts() {
    const { data, isLoading, error, fetchNextPage } = useInfiniteQuery({
        queryKey: ["myPosts"],
        queryFn: ({ pageParam = 0 }) => fetchPostsWithPagination(pageParam, 10),
        getNextPageParam: (lastPage, allPages) => {
            // console.log("getNextPageParam - lastPage:", lastPage);
            // console.log("getNextPageParam - allPages:", allPages);
            if (Array.isArray(lastPage) && lastPage.length > 0) {
                return allPages.length * 10;
            }
            return undefined;
        },
        initialPageParam: 0,
    });

    console.log("MyPosts - data:", data);
    console.log("MyPosts - isLoading:", isLoading);
    console.log("MyPosts - error:", error);

    const posts = data?.pages.flatMap(page => page) || [];

    return (
        <View>
            <FlatList
                data={posts}
                contentContainerStyle={{ paddingTop: 16, paddingBottom: 40 }}
                renderItem={({ item }) => (
                    <Pressable
                        onPress={() => {
                            router.push({
                                pathname: "screens/post-detail",
                                params: { post: JSON.stringify(item) },
                            });
                        }}
                        className="mx-4"
                    >
                        <PostItem
                            title={item.title}
                            content={item.content}
                            author_name={item.author_name}
                            $createdAt={item.$createdAt}
                        />
                    </Pressable>
                )}
            />
        </View>
    );
}
