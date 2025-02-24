import { View, TextInput, StyleSheet, Text, Alert } from "react-native";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ID } from "react-native-appwrite";
import { config, databases } from "../../lib/appwrite";
import { sendPushNotification } from "../../functions/notifications";
import { useGlobalContext } from "../../context/GlobalProvider";
import Toast from "react-native-toast-message";

export default function CommentInputBox({
  videoId,
  userId,
  videoCreator,
  onCommentSubmitted,
}) {
  const { t } = useTranslation();
  const [comment, setComment] = useState("");
  const { user } = useGlobalContext();

  // console.log('videoCreator:', JSON.stringify(videoCreator, null, 2));

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
        ID.unique(), // 自动生成唯一文档 ID
        newComment
      );
      Toast.show({
        text1: t("Publish successfully"),
        type: "success",
        position: "bottom",
        bottomOffset: 68,
      });
      // 根据视频ID获取视频的发布者信息
      console.log(
        "videoCreator.expo_push_token:",
        videoCreator.expo_push_token
      );
      if (videoCreator.expo_push_token && videoCreator.$id !== user?.$id) {
        // 发送推送通知
        sendPushNotification(
          videoCreator.expo_push_token,
          `${user?.username} ${t("sent you a comment")}`,
          comment,
          {
            videoId,
            userId,
            commentId: response.$id,
          }
        );

        console.log("执行了发送视频主评论推送通知");
      }

      setComment("");
      onCommentSubmitted(response); // 调用回调，传递新评论数据
    } catch (error) {
      console.error(error, "Data upload failed");
    }
  };

  return (
    <View className="mt-4">
      <Text className={"text-black text-xl mb-4 font-bold"}>
        {t("Comment")}
      </Text>
      <TextInput
        value={comment}
        onChangeText={setComment}
        placeholder={t("Write your comment...")}
        placeholderTextColor={"gray"}
        style={styles.input}
        onSubmitEditing={handleCommentSubmit}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    height: 40,
    borderColor: "gray",
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 10,
    paddingHorizontal: 16,
    color: "black",
  },
});
