import { View, TextInput, StyleSheet, Text, Alert } from 'react-native'
import { useState } from 'react'
import { useTranslation } from "react-i18next";
import { ID } from "react-native-appwrite";
import { config, databases } from "../../lib/appwrite";
import { sendPushNotification } from "../../functions/notifications";

export default function CommentInputBox({ videoId, userId, videoCreator, onCommentSubmitted }) {
  const { t } = useTranslation()
  const [comment, setComment] = useState('');

  const handleCommentSubmit = async () => {
    try {
      const newComment = {
        content: comment,
        video_ID: videoId,
        user_ID: userId,
        parent_comment_ID: "", // 顶级评论
      };

      const response = await databases.createDocument(
        config.databaseId,
        config.commentsCollectionId,
        ID.unique(),    // 自动生成唯一文档 ID
        newComment
      );
      Alert.alert('Publish successfully');
      // 根据视频ID获取视频的发布者信息
      if (videoCreator.expo_push_token) {
        // 发送推送通知
        sendPushNotification(videoCreator.expo_push_token, 'New comment', comment);

      }
      setComment('');
      onCommentSubmitted(response); // 调用回调，传递新评论数据
    } catch (error) {
      console.error(error, 'Data upload failed');
    }
  }

  return (
    <View>
      <Text className={'text-black text-xl mb-4 font-bold'}>
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
    color: 'black'
  }
})