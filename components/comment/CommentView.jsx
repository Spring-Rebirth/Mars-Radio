import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { View, Text, Image, FlatList, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import commentIcon from '../../assets/icons/comment.png';
import likeIcon from '../../assets/icons/like.png';
import likedIcon from '../../assets/icons/liked.png';
import { useTranslation } from 'react-i18next';
import ReactNativeModal from 'react-native-modal';

export default function CommentView({ commentsDoc, avatar, username, fetchReplies, submitReply }) {
    // fetchReplies 是一个获取子评论的函数，输入评论 ID，返回该评论的子评论
    const textInputRef = useRef(null);
    const [showReplyModal, setShowReplyModal] = useState(false); // 初始为关闭状态
    const [replyMsg, setReplyMsg] = useState('');
    const [parentCommentId, setParentCommentId] = useState(null); // 当前回复的父评论 ID
    const { t } = useTranslation();

    useEffect(() => {
        if (showReplyModal) {
            const timer = setTimeout(() => {
                textInputRef.current?.focus(); // 确保模态框打开后再聚焦
            }, 100); // 100毫秒延迟

            return () => clearTimeout(timer); // 清理定时器
        }
    }, [showReplyModal]);

    handleReplySubmit = useCallback(async (e) => {
        // TODO: 提交回复评论
        if (!replyMsg.trim()) return;
        // 调用提交回复的函数，传入回复内容和父评论 ID
        await submitReply(replyMsg, parentCommentId);

        console.log('Submit reply:', replyMsg);
        setReplyMsg(''); // 清空输入框
        setParentCommentId(null); // 重置父评论 ID
        setShowReplyModal(false); // 关闭评论框
    }, [replyMsg, parentCommentId]);

    const CommentItem = React.memo(({ comment, level = 0 }) => {
        const [replies, setReplies] = useState([]);
        const [isRepliesLoaded, setIsRepliesLoaded] = useState(false);
        const [liked, setLiked] = useState(false);


        useEffect(() => {
            // 获取子评论
            const loadReplies = async () => {
                const childComments = await fetchReplies(comment.$id); // 根据当前评论 ID 获取子评论
                setReplies(childComments);
                setIsRepliesLoaded(true);
            };
            loadReplies();
        }, [comment.$id]); // 使用 comment.$id 作为依赖项

        const marginLeft = level * 20;

        // 在这里使用 useMemo
        const memoizedReplies = useMemo(() => {
            return replies.map((item) => (
                <CommentItem key={item.$id} comment={item} level={level + 1} />
            ));
        }, [replies, level]); // 依赖于 replies

        return (
            <View style={[styles.commentContainer, { marginLeft }]}>
                <View style={styles.header}>
                    <Image source={{ uri: avatar }} style={styles.avatar} />
                    <Text style={styles.username}>{username}</Text>
                </View>
                <Text style={styles.commentText}>{comment.content}</Text>
                <View className='flex-row gap-x-6 ml-0.5'>
                    <TouchableOpacity onPress={() => setLiked(!liked)}
                        className=' w-20 items-center'
                    >
                        <Image
                            source={liked ? likedIcon : likeIcon}
                            style={{ width: 20, height: 20, marginTop: 20 }}
                            resizeMode='contain'
                        />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => {
                        setParentCommentId(comment.$id); // 设置当前父评论 ID
                        setShowReplyModal(true);
                    }}
                        className=' w-20 items-center'
                    >
                        <Image
                            source={commentIcon}
                            style={{ width: 20, height: 20, marginTop: 20 }}
                            resizeMode='contain'
                        />
                    </TouchableOpacity>


                </View>
                {/* 渲染子评论 */}
                {isRepliesLoaded && replies.length > 0 && (
                    <View style={{ paddingTop: 20 }}>
                        {memoizedReplies}
                    </View>
                )}
            </View>
        );
    });

    // 使用 useMemo 缓存 FlatList 的渲染
    const memoizedComments = useMemo(() => {
        return commentsDoc.map((item) => (
            <CommentItem key={item.$id} comment={item} />
        ));
    }, [commentsDoc]);

    return (
        <>
            <FlatList
                data={commentsDoc}
                keyExtractor={(item) => item.$id}
                renderItem={() => memoizedComments}
                contentContainerStyle={{ paddingBottom: 280 }}
                extraData={showReplyModal}
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
        padding: 10,
        borderRadius: 5,
        backgroundColor: '#161622',
        marginBottom: 10,
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
