// CommentList.js
import React, { useEffect, useRef, useState } from "react";
import { FlatList, View, Image, Text, ActivityIndicator } from "react-native";
import CommentItem from "./CommentItem";
import emptyIcon from "../../assets/images/empty-msg.png";
import { useTranslation } from "react-i18next";

export default function CommentList({
  commentsDoc,
  fetchReplies,
  setRefreshFlag,
  fetchCommentUser,
  submitReply,
  isLoading,
  ListHeaderComponent,
}) {
  const flatListRef = useRef(null);
  const { t } = useTranslation();

  const renderComment = ({ item }) => (
    <CommentItem
      comment={item}
      fetchReplies={fetchReplies}
      setRefreshFlag={setRefreshFlag}
      fetchCommentUser={fetchCommentUser}
      submitReply={submitReply}
    />
  );

  if (isLoading) {
    return (
      <View className="w-full h-full justify-start items-center">
        <ActivityIndicator size="large" color="#0000ff" className="mt-4" />
      </View>
    );
  }

  return (
    <FlatList
      ref={flatListRef}
      data={commentsDoc}
      renderItem={renderComment}
      ListHeaderComponent={ListHeaderComponent}
      ListEmptyComponent={
        <View className="w-full h-full justify-start items-center">
          <Image
            source={emptyIcon}
            className="w-20 h-20 mt-12"
            resizeMode="contain"
          />
          <Text style={{ fontSize: 18, color: "gray", marginTop: 16 }}>
            {t("Be the first to comment")}
          </Text>
        </View>
      }
      showsVerticalScrollIndicator={false}
      keyExtractor={(item) => item.$id.toString()}
      contentContainerStyle={{ paddingBottom: 80 }}
      removeClippedSubviews={false} // 仅渲染视口中的子项，设置为true会导致modal弹出时子项不可见而被卸载
      initialNumToRender={10} // 根据需要调整初始渲染的项数
      maxToRenderPerBatch={10} // 根据需要调整每批渲染的最大项数
      windowSize={21} // 根据需要调整窗口大小
    />
  );
}
