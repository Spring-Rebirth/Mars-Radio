import React, { useEffect, useState, useRef } from 'react';
import { View, Text, Image, FlatList, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import commentIcon from '../../assets/icons/comment.png';
import likeIcon from '../../assets/icons/like.png';
import likedIcon from '../../assets/icons/liked.png';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet'
import { useTranslation } from 'react-i18next';

export default function CommentView({ commentsDoc, avatar, username, fetchReplies, submitReply }) {
    // fetchReplies 是一个获取子评论的函数，输入评论 ID，返回该评论的子评论
    const bottomSheetRef = useRef(null);
    const [sheetIndex, setSheetIndex] = useState(-1); // 初始为关闭状态
    const [replyMsg, setReplyMsg] = useState('');
    const [parentCommentId, setParentCommentId] = useState(null); // 当前回复的父评论 ID
    const { t } = useTranslation();

    handleReplySubmit = async (e) => {
        // TODO: 提交回复评论
        if (!replyMsg.trim()) return;
        // 调用提交回复的函数，传入回复内容和父评论 ID
        await submitReply(replyMsg, parentCommentId);

        console.log('Submit reply:', replyMsg);
        setSheetIndex(-1); // 关闭评论框
        setReplyMsg(''); // 清空输入框
        setParentCommentId(null); // 重置父评论 ID
    }

    const CommentItem = ({ comment, level = 0 }) => {
        const [replies, setReplies] = useState([]);
        const [isRepliesLoaded, setIsRepliesLoaded] = useState(false);
        const [liked, setLiked] = useState(false);


        useEffect(() => {
            // 获取子评论
            const loadReplies = async () => {
                if (comment.parent_comment_ID) {
                    const childComments = await fetchReplies(comment.$id); // 根据父评论ID获取子评论
                    setReplies(childComments);
                    setIsRepliesLoaded(true);
                }
            };
            loadReplies();
        }, [comment.$id]);

        return (

            <View style={[styles.commentContainer, { marginLeft: level * 20 }]}>
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
                        setSheetIndex(0);
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
                    <FlatList
                        data={replies}
                        keyExtractor={(item) => item.$id}
                        renderItem={({ item }) => (
                            <CommentItem comment={item} level={level + 1} /> // 递归渲染子评论
                        )}
                    />
                )}
            </View>

        );
    };


    return (
        <>
            <FlatList
                data={commentsDoc}
                keyExtractor={(item) => item.$id}
                renderItem={({ item }) => (
                    <CommentItem comment={item} />
                )}
            />

            <BottomSheet
                ref={bottomSheetRef}
                index={sheetIndex}
                snapPoints={['25%', '90%']}
                enablePanDownToClose={true}
                handleComponent={null}
                onChange={(index) => {
                    console.log('Sheet changed to:', index);
                    if (index === -1) setSheetIndex(-1); // 当关闭时，保持 `sheetIndex` 为 -1
                }}
            >
                <BottomSheetView style={{ flex: 1, backgroundColor: '#161622' }}>
                    <View className='flex-1 px-6 mt-4'>
                        <TextInput
                            value={replyMsg}
                            onChangeText={setReplyMsg}
                            placeholder={t("Add a reply···")}
                            placeholderTextColor={'gray'}
                            style={styles.input}
                            onSubmitEditing={handleReplySubmit}
                        />
                    </View>
                </BottomSheetView>
            </BottomSheet>
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
    }
});
