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
import { formatCommentsCounts } from "../../utils/numberFormatter";
import { sendPushNotification } from "../../functions/notifications";
import { router } from "expo-router";
import { useAdminStore } from "../../store/adminStore";
import { fetchCommentUsername } from "../../services/commentService";
import { useGlobalContext } from "../../context/GlobalProvider";
import LoadingModal from "../modal/LoadingModal";
import Toast from "react-native-toast-message";

const CommentItem = ({
  comment,
  level = 1,
  fetchReplies,
  fetchCommentUser,
  submitReply,
  onReplyDeleted,
  onCommentDeleted,
  onCommentAdded,
  rootCommentId = comment?.$id,
}) => {
  const [replies, setReplies] = useState([]);
  const [commentId, setCommentId] = useState(comment?.$id);
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
  const { user } = useGlobalContext();
  const admin = adminList?.includes(user?.email);
  const inputRef = useRef(null);
  const [replySubmiting, setReplySubmiting] = useState(false);

  const MAX_LEVEL = 1;
  let paddingLeft = level <= MAX_LEVEL ? 40 : 0;
  let marginHorizontal = level <= MAX_LEVEL ? 15 : 0;

  // 加载用户信息
  useEffect(() => {
    const loadUser = async () => {
      const { creator: user } = comment;
      setCmtUsername(user.username);
      setCmtAvatar({ uri: user.avatar });
    };
    loadUser();
  }, [comment?.creator?.$id]);

  // 加载回复数量
  useEffect(() => {
    const loadRepliesCount = async () => {
      if (!commentId) return; // 如果没有评论ID，直接返回
      try {
        const childComments = await fetchReplies(commentId);
        setRepliesCount(childComments?.length || 0); // 设置子评论数量，如果为空则设为0
      } catch (error) {
        console.error('Error loading replies count:', error);
        setRepliesCount(0);
      }
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

  // 切换显示/隐藏子评论
  const toggleReplies = useCallback(async () => {
    if (!showReplies && commentId) { // 确保有评论ID
      setLoadingReplies(true);
      try {
        const childComments = await fetchReplies(commentId);
        setReplies(childComments || []); // 如果返回undefined，设为空数组
      } catch (error) {
        console.error('Error loading replies:', error);
        setReplies([]);
      } finally {
        setLoadingReplies(false);
      }
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
        config.commentColletionId,
        commentId
      );
      if (result) {
        Toast.show({
          type: "success",
          position: "bottom",
          bottomOffset: 68,
          text1: t("Delete Success"),
        });
        setCommentId("");
        if (level !== 1) {
          // 如果是子评论，通知父组件删除子评论
          onReplyDeleted();
        } else {
          // 如果是父评论，直接调用删除回调
          onCommentDeleted(commentId);
        }
      }
    } catch (error) {
      console.error("Failed to delete comment:", error);
    }
  };

  const handleReplySubmit = useCallback(async () => {
    if (!replyMsg.trim()) return;

    setReplySubmiting(true);

    try {
      const parentUsername = await fetchCommentUsername(parentCommentUserId);

      // 提交回复
      const newReply = await submitReply(
        level > MAX_LEVEL ? `@${parentUsername}  ${replyMsg}` : replyMsg,
        parentCommentId,
        user.$id,
        comment.post_id
      );

      setRepliesCount((prevCount) => prevCount + 1);

      // 获取上一级评论用户信息并发送通知
      const parentComment = await databases.getDocument(
        config.databaseId,
        config.commentColletionId,
        parentCommentId
      );
      const parentCommentUser = await fetchCommentUser(parentComment.creator.$id);

      if (
        parentCommentUser.expo_push_token &&
        parentCommentUser.$id !== user?.$id
      ) {
        sendPushNotification(
          parentCommentUser.expo_push_token,
          t("notifications.userRepliedComment", { username: user?.username }),
          replyMsg,
          {
            postId: comment.post_id,
            userId: user.$id,
            commentId: rootCommentId,
          }
        );
      }

      // 重置状态
      setReplyMsg("");
      setParentCommentUserId(null);
      setParentCommentId(null);
      setShowReplyModal(false);

      // 如果是主评论的回复，通知父组件添加新评论
      if (level === 1) {
        onCommentAdded(newReply);
      }

      Toast.show({
        type: "success",
        position: "bottom",
        bottomOffset: 68,
        text1: t("Reply Success"),
      });
    } catch (error) {
      console.error("Failed to submit reply:", error);
      Toast.show({
        type: "error",
        position: "bottom",
        bottomOffset: 68,
        text1: t("Reply Failed"),
      });
    } finally {
      setReplySubmiting(false);
    }
  }, [replyMsg, parentCommentId, level, user, comment?.post_id]);

  const handleClickLike = async () => {
    try {
      const newLikedStatus = !liked;
      const newLikeCount = newLikedStatus ? likeCount + 1 : likeCount - 1;

      // 更新本地状态
      setLiked(newLikedStatus);
      setLikeCount(newLikeCount);
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
    <View style={[styles.commentContainer, { marginHorizontal }]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() =>
            router.navigate({
              pathname: "view-user",
              params: { creatorId: comment.creator.$id },
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
            setParentCommentUserId(comment.creator.$id); // 设置当前父评论用户 ID
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

        {(comment.creator?.$id === user.$id || admin === true) && (
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
                level={level + 1}
                fetchReplies={fetchReplies}
                fetchCommentUser={fetchCommentUser}
                submitReply={submitReply}
                onReplyDeleted={handleReplyDeleted}
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
      <LoadingModal isVisible={replySubmiting} loadingText={t("Submitting")} />
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
