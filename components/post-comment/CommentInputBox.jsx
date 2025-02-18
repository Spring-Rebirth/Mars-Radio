import { View, TextInput, StyleSheet, Text, Alert } from "react-native";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ID } from "react-native-appwrite";
import { config, databases } from "../../services/postsService";
import { useGlobalContext } from "../../context/GlobalProvider";

export default function CommentInputBox({ onCommentSubmitted, post_id }) {
  const { t } = useTranslation();
  const [comment, setComment] = useState("");
  const { user } = useGlobalContext();

  const handleCommentSubmit = async () => {
    try {
      const newComment = {
        content: comment,
        creator: user.$id,
        parent_comment_ID: "", // 顶级评论
        post_id,
      };

      const response = await databases.createDocument(
        config.databaseId,
        config.commentColletionId,
        ID.unique(), // 自动生成唯一文档 ID
        newComment
      );
      Alert.alert("Publish successfully");

      setComment("");
      onCommentSubmitted(response); // 调用回调，传递新评论数据
    } catch (error) {
      console.error(error, "Data upload failed");
    }
  };

  return (
    <View>
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
  container: {},
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
