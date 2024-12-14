// CommentList.js
import React, { useEffect, useRef, useState } from 'react';
import { FlatList, View, Image, Text } from 'react-native';
import CommentItem from './CommentItem';
import emptyIcon from '../../assets/images/empty-msg.png';

export default function CommentList({ commentsDoc, fetchReplies, setRefreshFlag, fetchUsername, userId, fetchCommentUser, submitReply, scrollToComment }) {
  const flatListRef = useRef(null);
  const [hasScrolled, setHasScrolled] = useState(false);

  useEffect(() => {
    let timeoutId;

    if (
      scrollToComment &&
      flatListRef.current &&
      commentsDoc &&
      commentsDoc.length > 0 &&
      !hasScrolled
    ) {
      // 延迟两秒后执行滚动
      timeoutId = setTimeout(() => {
        const index = commentsDoc.findIndex(comment => comment.$id === scrollToComment);
        if (index !== -1) {
          flatListRef.current.scrollToIndex({
            index,
            animated: true,
            viewPosition: 0
          });
          setHasScrolled(true); // 确保只执行一次滚动
        }
      }, 2000); // 2000毫秒 = 2秒
    }

    // 清除定时器以防止内存泄漏
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [scrollToComment, commentsDoc, hasScrolled]);

  const renderComment = ({ item }) => (
    <CommentItem
      comment={item}
      userId={userId}
      fetchReplies={fetchReplies}
      setRefreshFlag={setRefreshFlag}
      fetchUsername={fetchUsername}
      fetchCommentUser={fetchCommentUser}
      submitReply={submitReply}
    />
  );

  if (!commentsDoc || commentsDoc.length === 0) {
    return (
      <View className="w-full h-full justify-start items-center">
        <Image
          source={emptyIcon}
          className="w-20 h-20 mt-32"
          resizeMode="contain"
        />
        <Text style={{ fontSize: 18, color: 'gray', marginTop: 16 }}>
          {t("Be the first to comment")}
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      ref={flatListRef}
      data={commentsDoc}
      renderItem={renderComment}
      keyExtractor={(item) => item.$id.toString()}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      removeClippedSubviews={true} // 仅渲染视口中的子项
      initialNumToRender={10} // 根据需要调整初始渲染的项数
      maxToRenderPerBatch={10} // 根据需要调整每批渲染的最大项数
      windowSize={21} // 根据需要调整窗口大小
    />
  );
}
