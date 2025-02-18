import {
  SafeAreaView,
  View,
  Text,
  Image,
  FlatList,
  Pressable,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { fetchUserData } from "../../services/userService";
import CommentInputBox from "../../components/post-comment/CommentInputBox";
import CommentList from "../../components/post-comment/CommentList";
import { fetchCommentsOfPost } from "../../services/postsService";

export default function PostDetails() {
  const { post } = useLocalSearchParams();
  const parsedPost = post ? JSON.parse(post) : null; // 解析为对象
  const { t } = useTranslation();
  const [commentsDoc, setCommentsDoc] = useState([]);
  const [postCreator, setPostCreator] = useState(null);

  // 获取帖子的用户信息
  useEffect(() => {
    const getPostCreatorInfo = async () => {
      const postCreator = await fetchUserData(parsedPost.author);
      setPostCreator(postCreator);
    };

    const getCommentsOfPost = async () => {
      const comments = await fetchCommentsOfPost(parsedPost.$id);
      setCommentsDoc(comments.documents);
    };

    Promise.all([getPostCreatorInfo(), getCommentsOfPost()]);
  }, []);

  const onCommentSubmitted = (newComment) => {
    setCommentsDoc((prevComments) => [newComment, ...prevComments]);
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-row items-center">
        {/* 顶部返回按钮 */}
        <Pressable onPress={() => router.back()} className="p-4">
          <Image
            source={require("../../assets/icons/back-arrow.png")}
            className="w-6 h-6"
          />
        </Pressable>
        {/* 用户信息 */}
        <Image
          source={{ uri: postCreator?.avatar }}
          className="w-6 h-6 rounded-full ml-2"
        />
        <Text className="ml-2">{postCreator?.username}</Text>
      </View>
      {/* 帖子详情 */}
      <View className="p-5 pt-0 border-b border-gray-300">
        <Image
          source={{ uri: parsedPost.image }}
          className="h-44 w-full mx-auto"
          resizeMode="contain"
        />
        <Text className="mt-3 text-2xl font-bold text-gray-900">
          {parsedPost?.title || "无法读取到标题文本"}
        </Text>
        <Text className="mt-2 text-base text-gray-600" numberOfLines={20}>
          {parsedPost?.content || "无法读取到内容文本"}
        </Text>
      </View>
      {/* 评论列表 */}
      <View className="p-4 flex-1">
        {/* 主评论输入框 */}
        <CommentInputBox
          onCommentSubmitted={onCommentSubmitted}
          post_id={parsedPost.$id}
        />
        {/* 评论列表 */}
        <CommentList commentsDoc={commentsDoc} />
      </View>
    </SafeAreaView>
  );
}
