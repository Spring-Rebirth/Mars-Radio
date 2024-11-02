import { FlatList, Image, Text, View } from "react-native";

export default function CommentView({ comments, avatar, username }) {
    const commentsMock = [
        { id: "1", comment: "This is a comment" },
        { id: "2", comment: "This is another comment" },
        { id: "3", comment: "This is yet another comment" },
    ];

    return (
        <FlatList
            className='mt-4'
            data={commentsMock}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
                <View className='mb-6'>
                    <View className='flex-row'>
                        <Image
                            source={{ uri: avatar }}
                            style={{ width: 30, height: 30, borderRadius: 15 }}
                        />
                        <Text className='text-gray-100 mt-0.5 ml-3'>
                            {username}
                        </Text>
                    </View>

                    <View>
                        <Text
                            className='text-white mt-1.5 ml-11'
                            numberOfLines={4}
                        >
                            {item.comment}
                        </Text>
                    </View>
                </View>
            )}
        />
    )
}