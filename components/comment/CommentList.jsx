// CommentList.js
import React, { useEffect, useRef, useState } from 'react';
import { FlatList, View, Image, Text } from 'react-native';
import CommentItem from './CommentItem';
import emptyIcon from '../../assets/images/empty-msg.png';

export default function CommentList({ commentsDoc, fetchReplies, setRefreshFlag, fetchUsername, userId, fetchCommentUser, submitReply, scrollToComment }) {
  const flatListRef = useRef(null);
  const [hasScrolled, setHasScrolled] = useState(false);

  // 估算每个评论项目的高度
  const ESTIMATED_ITEM_HEIGHT = 315; // 根据您的分析

  const getItemLayout = (data, index) => ({
    length: ESTIMATED_ITEM_HEIGHT,
    offset: ESTIMATED_ITEM_HEIGHT * index,
    index
  });

  useEffect(() => {
    if (scrollToComment && flatListRef.current && commentsDoc && commentsDoc.length > 0 && !hasScrolled) {
      const index = commentsDoc.findIndex(comment => comment.$id === scrollToComment);
      if (index !== -1) {
        flatListRef.current.scrollToIndex({ index, animated: true, viewPosition: 0 });
        setHasScrolled(true); // 确保只执行一次滚动
      }
    }
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
          Be the first to comment
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
      getItemLayout={getItemLayout}
      contentContainerStyle={{ paddingHorizontal: 15 }}
    />
  );
}
