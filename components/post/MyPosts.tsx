import { View, Text, FlatList } from "react-native";
import { useInfiniteQuery } from "@tanstack/react-query";
import { fetchPostsWithPagination } from "../../services/postsService";


export default function MyPosts() {
    const { data, isLoading, error, fetchNextPage } = useInfiniteQuery({
        queryKey: ["myPosts"],
        queryFn: ({ pageParam = 0 }) => fetchPostsWithPagination(pageParam, 10),
        getNextPageParam: (lastPage, allPages) => {
            console.log("getNextPageParam - lastPage:", lastPage);
            console.log("getNextPageParam - allPages:", allPages);
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
                renderItem={({ item }) => <Text>{item.title}</Text>}
            />
        </View>
    );
}
