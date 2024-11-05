// CommentList.js
import React from 'react';
import { FlatList, ActivityIndicator } from 'react-native';
import CommentItem from './CommentItem';

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
        return <ActivityIndicator size="large" color="#000" />;
    }

    return (
        <FlatList
            data={commentsDoc}
            renderItem={renderComment}
            keyExtractor={(item) => item.$id.toString()}
            contentContainerStyle={{ paddingBottom: 330, paddingTop: 5 }}
        />
    );
}
