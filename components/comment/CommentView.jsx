import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { View, Text, Image, FlatList, StyleSheet, TouchableOpacity, TextInput, Alert, InteractionManager } from 'react-native';
import commentIcon from '../../assets/icons/comment.png';
import likeIcon from '../../assets/icons/like.png';
import likedIcon from '../../assets/icons/liked.png';
import { useTranslation } from 'react-i18next';
import ReactNativeModal from 'react-native-modal';
import deleteIcon from '../../assets/menu/delete.png';
import { config, databases } from "../../lib/appwrite";

export default function CommentView({ commentsDoc, userId, fetchReplies, fetchUsername, fetchCommentUser, submitReply, setRefreshFlag }) {
    // fetchReplies 是一个获取子评论的函数，输入评论 ID，返回该评论的子评论
    const [comments, setComments] = useState([]);
    const listRef = useRef(null);
    const [viewableIndex, setViewableIndex] = useState({ index: 0, offset: 0 }); // 记录当前可见的第一个项的索引和偏移量
    const [contentLoaded, setContentLoaded] = useState(false); // 用于标记内容加载完成
    const textInputRef = useRef(null);
    const [showReplyModal, setShowReplyModal] = useState(false); // 初始为关闭状态
    const [replyMsg, setReplyMsg] = useState('');
    const [parentCommentId, setParentCommentId] = useState(null); // 当前回复的父评论 ID
    const [parentCommentUserId, setParentCommentUserId] = useState(null); // 当前回复的父评论用户 ID
    const { t } = useTranslation();

    // Viewability 配置，设定可见性阈值
    const viewabilityConfig = {
        itemVisiblePercentThreshold: 50, // 超过50%可见才算可见项
    };

    // 记录当前可见的第一个项
    const onViewableItemsChanged = ({ viewableItems }) => {
        if (viewableItems.length > 0) {
            const firstVisibleItem = viewableItems[0];
            setViewableIndex({
                index: firstVisibleItem.index,
                offset: firstVisibleItem.item.offset || 0,
            });
        }
    };

    useEffect(() => {
        if (showReplyModal) {
            const timer = setTimeout(() => {
                textInputRef.current?.focus(); // 确保模态框打开后再聚焦
            }, 100); // 100毫秒延迟

            return () => clearTimeout(timer); // 清理定时器
        }
    }, [showReplyModal]);

    // 批量加载评论数据，包括头像和用户名
    useEffect(() => {
        const prepareComments = async () => {
            if (commentsDoc && commentsDoc.length > 0) {
                const enrichedComments = await Promise.all(commentsDoc.map(async (comment) => {
                    const user = await fetchCommentUser(comment.user_ID);
                    return { ...comment, username: user.username, avatar: user.avatar || require('../../assets/images/default-avatar.png') };
                }));
                setComments(enrichedComments);
                setContentLoaded(false); // 设置为未加载状态，以便重新恢复位置
            }
        };
        prepareComments();
    }, [commentsDoc]);

    // 等待布局完成后恢复位置
    useEffect(() => {
        if (contentLoaded && listRef.current && comments.length > 0 && viewableIndex.index < comments.length) {
            InteractionManager.runAfterInteractions(() => {
                listRef.current.scrollToIndex({
                    index: viewableIndex.index,
                    viewOffset: viewableIndex.offset,
                    animated: false,
                });
            });
        }
    }, [contentLoaded, comments]);

    handleReplySubmit = useCallback(async () => {
        // 调用提交回复的函数，传入回复内容和父评论 ID   // 获取回复的用户名
        if (!replyMsg.trim()) return;

        const parentUsername = await fetchUsername(parentCommentUserId);
        await submitReply(`@${parentUsername}    ${replyMsg}`, parentCommentId);
        console.log('Submit reply:', replyMsg);
        setReplyMsg('');
        setParentCommentUserId(null);
        setParentCommentId(null);
        setShowReplyModal(false);
        setRefreshFlag(prev => !prev);
    }, [replyMsg, parentCommentId]);

    const CommentItem = React.memo(({ comment, level = 0 }) => {
        const [replies, setReplies] = useState([]);
        const [isRepliesLoaded, setIsRepliesLoaded] = useState(false);
        const [liked, setLiked] = useState(false);
        const [cmtUsername, setCmtUsername] = useState('loading...');
        const [cmtAvatar, setCmtAvatar] = useState(require('../../assets/images/default-avatar.png'));

        useEffect(() => {
            // 获取子评论
            const loadReplies = async () => {
                const childComments = await fetchReplies(comment.$id); // 根据当前评论 ID 获取子评论
                setReplies(childComments);
                setIsRepliesLoaded(true);
            };
            loadReplies();
        }, [comment.$id]); // 使用 comment.$id 作为依赖项

        useEffect(() => {
            // 获取评论的用户信息
            const loadUser = async () => {
                const user = await fetchCommentUser(comment.user_ID);
                setCmtUsername(user.username);
                setCmtAvatar({ uri: user.avatar });
            };
            loadUser();
        }, []);

        const MAX_LEVEL = 1;
        let marginLeft = level <= MAX_LEVEL ? level * 40 : 0;

        // 在这里使用 useMemo
        const memoizedReplies = useMemo(() => {
            return replies.map((item) => (
                <CommentItem key={item.$id} comment={item} level={level + 1} />
            ));
        }, [replies, level]); // 依赖于 replies

        const deleteComment = async (commentId) => {
            try {
                const result = await databases.deleteDocument(
                    config.databaseId,
                    config.commentsCollectionId,
                    commentId
                );
                if (result) {
                    Alert.alert('Delete Success');
                    setRefreshFlag(prev => !prev); // 刷新评论列表
                }
            } catch (error) {
                console.error('Failed to delete comment:', error);
            }
        }

        return (
            <View style={[styles.commentContainer, { marginLeft }]}>
                <View style={styles.header}>
                    {/* 改成使用评论的用户名和头像 */}
                    <Image source={cmtAvatar} style={styles.avatar} />
                    <Text style={styles.username}>{cmtUsername}</Text>
                </View>
                <Text style={styles.commentText} numberOfLines={10}>
                    {comment.content}
                </Text>
                <View className='flex-row gap-x-6 ml-0.5'>
                    <TouchableOpacity onPress={() => setLiked(!liked)}
                        className='w-[46] items-center'
                    >
                        <Image
                            source={liked ? likedIcon : likeIcon}
                            style={{ width: 20, height: 20, marginTop: 20 }}
                            resizeMode='contain'
                        />
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => {
                            setParentCommentId(comment.$id); // 设置当前父评论 ID
                            setParentCommentUserId(comment.user_ID); // 设置当前父评论用户 ID
                            setShowReplyModal(true);
                        }}
                        className='w-[46] items-center'
                    >
                        <Image
                            source={commentIcon}
                            style={{ width: 20, height: 20, marginTop: 20 }}
                            resizeMode='contain'
                        />
                    </TouchableOpacity>
                    {comment.user_ID === userId && (
                        <TouchableOpacity onPress={() => { deleteComment(comment.$id) }}
                            className='w-[46] items-center'
                        >
                            <Image
                                source={deleteIcon}
                                style={{ width: 22, height: 22, marginTop: 18 }}
                                resizeMode='contain'
                            />
                        </TouchableOpacity>
                    )}
                </View>
                {/* 渲染子评论 */}
                {isRepliesLoaded && replies.length > 0 && (
                    <View style={{ paddingTop: 20 }} onLayout={() => setContentLoaded(true)}>
                        {memoizedReplies}
                    </View>
                )}
            </View>
        );
    });

    // 使用 useMemo 缓存 FlatList 的渲染
    const memoizedComments = useMemo(() => {
        return comments.map((item) => (
            <CommentItem key={item.$id} comment={item} />
        ));
    }, [comments]);

    return (
        <>
            <FlatList
                ref={listRef}
                data={comments}
                keyExtractor={(item) => item.$id}
                renderItem={({ item }) => {
                    // 使用 memoizedComments 的逻辑
                    const comment = memoizedComments.find(c => c.key === item.$id);
                    return comment;
                }}
                contentContainerStyle={{ paddingBottom: 330, paddingTop: 10 }}
                extraData={comments}
                viewabilityConfig={viewabilityConfig}
                onViewableItemsChanged={onViewableItemsChanged}
                onScrollToIndexFailed={() => listRef.current.scrollToOffset({ offset: 0, animated: false })}
            />

            <ReactNativeModal
                isVisible={showReplyModal}
                onBackdropPress={() => setShowReplyModal(false)}
                onBackButtonPress={() => setShowReplyModal(false)}
                style={styles.modal}
            >
                <View className='h-24 bg-[#212121]'>
                    <View className='flex-1 px-6 mt-4'>
                        <TextInput
                            ref={textInputRef}
                            value={replyMsg}
                            onChangeText={setReplyMsg}
                            placeholder={t("Add a reply···")}
                            placeholderTextColor={'gray'}
                            style={styles.input}
                            onSubmitEditing={handleReplySubmit}
                        />
                    </View>
                </View>
            </ReactNativeModal>
        </>
    );
}

const styles = StyleSheet.create({
    commentContainer: {
        width: '100%',
        backgroundColor: '#161622',
        marginBottom: 10,
        position: 'relative',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 30,
        height: 30,
        borderRadius: 15,
    },
    username: {
        color: '#fff',
        marginLeft: 10,
    },
    commentText: {
        color: '#fff',
        marginTop: 5,
        marginLeft: 40,
        marginRight: 40,
        lineHeight: 22
    },
    input: {
        height: 40,
        borderColor: 'gray',
        borderWidth: 1,
        borderRadius: 8,
        marginBottom: 10,
        paddingHorizontal: 16,
        color: 'white'
    },
    modal: {
        justifyContent: 'flex-end',
        margin: 0,
    },
});
