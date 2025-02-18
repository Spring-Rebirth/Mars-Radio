// CommentItem.js
import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
} from "react-native";
import commentIcon from "../../assets/icons/comment.png";
import likeIcon from "../../assets/icons/like.png";
import likedIcon from "../../assets/icons/liked.png";
import deleteIcon from "../../assets/menu/delete.png";
import ReactNativeModal from "react-native-modal";
import { useTranslation } from "react-i18next";
import { databases } from "../../lib/appwrite";
import { config } from "../../services/postsService";
import upIcon from "../../assets/icons/arrow-up.png";
import downIcon from "../../assets/icons/arrow-down.png";
import { sendLikedStatus } from "../../services/postsService";
import { formatCommentsCounts } from "../../utils/numberFormatter";
import { sendPushNotification } from "../../functions/notifications";
import { router } from "expo-router";
import { useAdminStore } from "../../store/adminStore";

const CommentItem = ({
  comment,
  level = 1,
  fetchReplies,
  setRefreshFlag,
  fetchUsername,
  userId,
  fetchCommentUser,
  submitReply,
  onReplyDeleted,
  videoCreator,
  user,
  rootCommentId = comment.$id,
}) => {
  console.log("commentItem comment:", JSON.stringify(comment, null, 2));
  const [replies, setReplies] = useState([]);
  const [commentId, setCommentId] = useState(comment.$id);
  const [repliesCount, setRepliesCount] = useState(0);
  const [showReplies, setShowReplies] = useState(false);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const { t } = useTranslation();
  const [cmtUsername, setCmtUsername] = useState(t("loading..."));
  const [cmtAvatar, setCmtAvatar] = useState(
    require("../../assets/images/default-avatar.png")
  );
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [replyMsg, setReplyMsg] = useState("");
  const [parentCommentId, setParentCommentId] = useState(null); // 当前回复的父评论 ID
  const [parentCommentUserId, setParentCommentUserId] = useState(null); // 当前回复的父评论用户 ID
  const adminList = useAdminStore((state) => state.adminList);
  const admin = adminList?.includes(user?.email);
  const inputRef = useRef(null);

  const MAX_LEVEL = 1;
  let paddingLeft = level <= MAX_LEVEL ? 40 : 0;

  // 加载用户信息
  useEffect(() => {
    const loadUser = async () => {
      const { creator: user } = comment;
      setCmtUsername(user.username);
      setCmtAvatar({ uri: user.avatar });
    };
    loadUser();
  }, [comment.user_ID]);

  useEffect(() => {
    const loadRepliesCount = async () => {
      const childComments = await fetchReplies(commentId);
      setRepliesCount(childComments?.length); // 设置子评论数量
    };
    loadRepliesCount();
  }, [commentId, fetchReplies]);

  // 打开模态框时，自动聚焦输入框
  useEffect(() => {
    if (showReplyModal) {
      setTimeout(() => {
        inputRef.current.focus();
      }, 100);
    }
  }, [showReplyModal]);

  useEffect(() => {
    // 异步获取评论点赞状态
    const fetchLikedStatus = async () => {
      try {
        // 获取评论文档
        const comment = await databases.getDocument(
          config.databaseId, // 替换为你的数据库 ID
          config.commentColletionId, // 替换为你的评论集合 ID
          commentId
        );
        setLikeCount(comment?.liked_users?.length || 0); // 设置点赞数
        // 检查用户是否已点赞
        if (comment.liked_users && comment.liked_users.includes(userId)) {
          setLiked(true); // 设置为已点赞
        } else {
          setLiked(false); // 设置为未点赞
        }
      } catch (error) {
        console.error("获取评论点赞状态时出错:", error);
        setLiked(false); // 获取出错时默认未点赞
      }
    };

    fetchLikedStatus();
  }, [commentId, userId]); // 依赖项: 当 commentId 或 userId 变化时重新获取状态

  // 切换显示/隐藏子评论
  const toggleReplies = useCallback(async () => {
    if (!showReplies) {
      setLoadingReplies(true);
      const childComments = await fetchReplies(commentId);
      setReplies(childComments);
      setLoadingReplies(false);
    }
    setShowReplies((prev) => !prev);
  }, [showReplies, fetchReplies, commentId]);

  const handleReplyDeleted = () => {
    setRepliesCount((prevCount) => prevCount - 1);
  };

  const deleteComment = async (commentId) => {
    try {
      const result = await databases.deleteDocument(
        config.databaseId,
        config.commentsCollectionId,
        commentId
      );
      if (result) {
        Alert.alert("Delete Success");
        setCommentId("");
        // setRefreshFlag(prev => !prev);
        if (level !== 1) {
          // 如果是子评论，通知父组件删除子评论
          onReplyDeleted();
        } else {
          // 如果是父评论，通知父组件刷新评论列表
          setRefreshFlag((prev) => !prev);
        }
      }
    } catch (error) {
      console.error("Failed to delete comment:", error);
    }
  };

  handleReplySubmit = useCallback(async () => {
    // 调用提交回复的函数，传入回复内容和父评论 ID   // 获取回复的用户名
    if (!replyMsg.trim()) return;

    const parentUsername = await fetchUsername(parentCommentUserId);

    // 如果评论层级大于MAX_LEVEL, 在回复内容前加上"@父评论用户名"
    if (level > MAX_LEVEL) {
      await submitReply(
        `@${parentUsername}  ${replyMsg}`,
        parentCommentId,
        userId,
        comment.video_ID
      );
    } else {
      await submitReply(replyMsg, parentCommentId, userId, comment.video_ID);
    }

    setRepliesCount((prevCount) => prevCount + 1);
    console.log("Submit reply:", replyMsg);

    // 根据视频ID获取视频的发布者信息
    console.log("videoCreator.expo_push_token:", videoCreator.expo_push_token);
    // 获取上一级评论，里面包含了user_ID
    const parentComment = await databases.getDocument(
      config.databaseId, // 替换为你的数据库 ID
      config.commentsCollectionId, // 替换为你的评论集合 ID
      parentCommentId
    );

    // 通过 parentComment的user_ID获取用户信息
    const parentCommentUser = await fetchCommentUser(parentComment.user_ID);

    if (
      parentCommentUser.expo_push_token &&
      parentCommentUser.$id !== user?.$id
    ) {
      // 发送推送通知
      sendPushNotification(
        parentCommentUser.expo_push_token,
        t("notifications.userRepliedComment", { username: user?.username }),
        replyMsg,
        {
          videoId: comment.video_ID,
          userId,
          commentId: rootCommentId,
        }
      );
    }

    console.log("执行了发送视频子评论推送通知");

    setReplyMsg("");
    setParentCommentUserId(null);
    setParentCommentId(null);
    setShowReplyModal(false);
    setRefreshFlag((prev) => !prev);
  }, [replyMsg, parentCommentId]);

  const handleClickLike = async () => {
    try {
      const newLikedStatus = !liked;
      const newLikeCount = newLikedStatus ? likeCount + 1 : likeCount - 1;

      // 更新本地状态
      setLiked(newLikedStatus);
      setLikeCount(newLikeCount);

      // 调用 sendLikedStatus 更新数据库中的点赞状态
      await sendLikedStatus(commentId, userId, newLikedStatus);
    } catch (error) {
      console.error("处理点赞时出错:", error);
      setLiked(liked);
      setLikeCount(likeCount);
      Alert.alert("Failed to like comment");
    }
  };

  if (!commentId) {
    return null;
  }

  return (
    <View style={styles.commentContainer}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() =>
            router.navigate({
              pathname: "view-user",
              params: { creatorId: comment.user_ID },
            })
          }
        >
          <Image source={cmtAvatar} style={styles.avatar} />
        </TouchableOpacity>
        <Text style={styles.username}>{cmtUsername}</Text>
      </View>
      <Text style={styles.commentText} numberOfLines={10}>
        {comment.content}
      </Text>
      <View style={styles.actions}>
        <TouchableOpacity
          onPress={handleClickLike}
          className="w-[60] h-[40] items-center justify-center relative"
        >
          <Image
            source={liked ? likedIcon : likeIcon}
            style={{ width: 20, height: 20 }}
          />
          {likeCount > 0 && (
            <Text className="absolute right-0.5 top-2 text-[#333] text-base">
              {formatCommentsCounts(likeCount)}
            </Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {
            setParentCommentId(commentId); // 设置当前父评论 ID
            setParentCommentUserId(comment.user_ID); // 设置当前父评论用户 ID
            setShowReplyModal(true);
          }}
          className="w-[60] h-[40] items-center justify-center"
        >
          <Image
            source={commentIcon}
            style={{ width: 20, height: 20 }}
            resizeMode="contain"
          />
        </TouchableOpacity>

        {(comment.user_ID === userId || admin === true) && (
          <TouchableOpacity
            onPress={() => deleteComment(commentId)}
            className="w-[60] h-[40] items-center justify-center"
          >
            <Image source={deleteIcon} style={{ width: 20, height: 20 }} />
          </TouchableOpacity>
        )}
      </View>
      {repliesCount > 0 && (
        <TouchableOpacity
          onPress={toggleReplies}
          className="mt-[10] ml-[36] h-10 w-28 justify-center flex-row space-x-2.5"
        >
          <Image
            source={showReplies ? upIcon : downIcon}
            style={{ width: 20, height: 20 }}
            resizeMode="contain"
          />
          <Text className="text-blue-500">
            {`${repliesCount} ${t("replies")}`}
          </Text>
        </TouchableOpacity>
      )}

      {showReplies && (
        <View style={{ paddingLeft }}>
          {loadingReplies ? (
            <Text>loading...</Text>
          ) : (
            replies.map((reply) => (
              <CommentItem
                key={reply.$id}
                comment={reply}
                userId={userId}
                level={level + 1}
                fetchReplies={fetchReplies}
                setRefreshFlag={setRefreshFlag}
                fetchUsername={fetchUsername}
                fetchCommentUser={fetchCommentUser}
                submitReply={submitReply}
                onReplyDeleted={handleReplyDeleted}
                videoCreator={videoCreator}
                user={user}
                rootCommentId={rootCommentId}
              />
            ))
          )}
        </View>
      )}

      <ReactNativeModal
        isVisible={showReplyModal}
        onBackdropPress={() => setShowReplyModal(false)}
        onBackButtonPress={() => setShowReplyModal(false)}
        style={styles.modal}
      >
        <View style={styles.modalContent}>
          <TextInput
            ref={inputRef}
            value={replyMsg}
            onChangeText={setReplyMsg}
            placeholder={t("Add a reply...")}
            placeholderTextColor="gray"
            style={styles.input}
            onSubmitEditing={handleReplySubmit}
          />
        </View>
      </ReactNativeModal>
    </View>
  );
};

const styles = StyleSheet.create({
  commentContainer: {
    paddingVertical: 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "start",
  },
  avatar: {
    width: 25,
    height: 25,
    borderRadius: 15,
    marginLeft: 0,
  },
  username: {
    fontSize: 13,
    fontWeight: "300",
    marginLeft: 15,
    color: "#4F4F4F",
    marginBottom: 0,
  },
  commentText: {
    color: "#333333",
    marginTop: 0,
    marginBottom: 5,
    marginLeft: 40,
    marginRight: 40,
    lineHeight: 22,
  },
  actions: {
    flexDirection: "row",
    marginTop: 0,
    marginLeft: 20,
    gap: 20,
  },
  icon: {
    width: 20,
    height: 20,
    marginHorizontal: 5,
  },
  modal: {
    justifyContent: "flex-end",
    margin: 0,
  },
  modalContent: {
    backgroundColor: "#f5f5f5",
    padding: 16,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  input: {
    height: 40,
    borderColor: "gray",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    color: "#333333",
  },
});

export default CommentItem;
