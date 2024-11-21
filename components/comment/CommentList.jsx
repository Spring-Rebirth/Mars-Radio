// CommentList.js
import React from 'react';
import { FlatList, View, Image, Text } from 'react-native';
import CommentItem from './CommentItem';
import emptyIcon from '../../assets/images/empty-msg.png';

export default function CommentList({ commentsDoc, fetchReplies, setRefreshFlag, fetchUsername, userId, fetchCommentUser, submitReply }) {
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
      data={commentsDoc}
      renderItem={renderComment}
      keyExtractor={(item) => item.$id.toString()}
      contentContainerStyle={{ paddingBottom: 330, paddingTop: 5, paddingHorizontal: 15 }}
    />
  );
}
