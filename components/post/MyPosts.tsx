import { View, Text, FlatList, Pressable } from "react-native";
import { useInfiniteQuery } from "@tanstack/react-query";
import { fetchPostsWithPagination } from "../../services/postsService";
import { router } from "expo-router";
import PostItem from "./PostItem";
import { useGlobalContext } from "../../context/GlobalProvider";

type Post = {
    $id: string;
    title: string;
    content: string;
    author: string;
    author_name: string;
    $createdAt: string;
    image?: string;
    images: string[];
}

export default function MyPosts() {
    const { user } = useGlobalContext();
    const { data, isLoading, error, fetchNextPage } = useInfiniteQuery({
        queryKey: ["myPosts"],
        queryFn: ({ pageParam = 0 }) => fetchPostsWithPagination(pageParam, 10),
        getNextPageParam: (lastPage, allPages) => {
            if (Array.isArray(lastPage) && lastPage.length > 0) {
                return allPages.length * 10;
            }
            return undefined;
        },
        initialPageParam: 0,
    });

    let posts: Post[] = [];

    if (data) {
        posts = data.pages.flatMap((page) => {
            return page.map((post: any) => {
                if (post && post.author === user?.$id) {
                    return {
                        title: post.title || '',
                        content: post.content || '',
                        author: post.author || '',
                        author_name: post.author_name || '',
                        $createdAt: post.$createdAt || '',
                        images: post.images || [],
                        $id: post.$id || '',
                    } as Post;
                }
                return undefined;
            }).filter(Boolean) as Post[];
        });
    }

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
                        {item && (
                            <PostItem
                                $id={item.$id}
                                title={item.title}
                                content={item.content}
                                author_name={item.author_name}
                                $createdAt={item.$createdAt}
                                image={item.image}
                                images={item.images}
                            />
                        )}
                    </Pressable>
                )}
            />
        </View>
    );
}
