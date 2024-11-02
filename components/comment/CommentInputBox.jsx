import { View, TextInput, StyleSheet, Text, Alert } from 'react-native'
import { useState } from 'react'
import { useTranslation } from "react-i18next";
import { ID } from "react-native-appwrite";
import { config, databases } from "../../lib/appwrite";

export default function CommentInputBox({ videoId, userId }) {
    const { t } = useTranslation()
    const [comment, setComment] = useState('');

    const handleCommentSubmit = async () => {
        try {
            const response = await databases.createDocument(
                config.databaseId,
                config.commentsCollectionId,
                ID.unique(),    // 自动生成唯一文档 ID
                {
                    content: comment,
                    video_ID: videoId,
                    user_ID: userId
                }
            );
            Alert.alert('Publish successfully');
            console.log('Comment uploaded successfully', JSON.stringify(response));
        } catch (error) {
            console.error(error, 'Data upload failed');
        }
    }

    return (
        <View>
            <Text className={'text-white text-xl mb-4 font-bold'}>
                {t("Comment")}
            </Text>
            <TextInput
                value={comment}
                onChangeText={setComment}
                placeholder={t("Write your comment...")}
                placeholderTextColor={'gray'}
                style={styles.input}
                onSubmitEditing={handleCommentSubmit}
            />
        </View>
    )
}

const styles = StyleSheet.create({
    container: {},
    input: {
        height: 40,
        borderColor: 'gray',
        borderWidth: 1,
        borderRadius: 8,
        marginBottom: 10,
        paddingHorizontal: 16,
        color: 'white'
    }
})