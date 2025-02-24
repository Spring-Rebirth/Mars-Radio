import { View, TextInput, StyleSheet, Text, Alert } from "react-native";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ID } from "react-native-appwrite";
import { config, databases } from "../../services/postsService";
import { useGlobalContext } from "../../context/GlobalProvider";
import Toast from "react-native-toast-message";

export default function CommentInputBox({ onCommentSubmitted, post_id }) {
  const { t } = useTranslation();
  const [comment, setComment] = useState("");
  const { user } = useGlobalContext();

  const handleCommentSubmit = async () => {
    try {
      const newComment = {
        content: comment,
        creator: user.$id,
        parent_comment_ID: "",
        post_id,
      };

      const uniqueId = ID.unique(); // 生成新的 ID
      console.log("Generated ID: ", uniqueId); // 输出 ID 查看是否不同

      const response = await databases.createDocument(
        config.databaseId,
        config.commentColletionId,
        uniqueId,
        newComment
      );

      Toast.show({
        text1: t("Publish successfully"),
        type: "success",
        position: "bottom",
        bottomOffset: 68,
      });

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
