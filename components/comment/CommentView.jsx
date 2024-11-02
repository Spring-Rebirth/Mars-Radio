import { FlatList, Image, Text, View } from "react-native";
import menuIcon from "../../assets/icons/menu.png";

export default function CommentView({ commentsDoc, avatar, username }) {
    const commentsMock = [
        { id: "1", comment: "This is a comment" },
        { id: "2", comment: "This is another comment" },
        { id: "3", comment: "This is yet another comment ggggggggggggggggggggggggggggggggggggggggggg" },
    ];

    return (
        <FlatList
            className='mt-4'
            data={commentsDoc}
            keyExtractor={(item) => item.$id}
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
                        <Image
                            source={menuIcon}
                            style={{ width: 14, height: 14, position: 'absolute', right: 0, top: 3.5 }}
                            resizeMode="contain"
                        />
                    </View>

                    <View>
                        <Text
                            className='text-white mt-1.5 ml-11 mr-3'
                            numberOfLines={4}
                        >
                            {item.content}
                        </Text>
                    </View>
                </View>
            )}
        />
    )
}