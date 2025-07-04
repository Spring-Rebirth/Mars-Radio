import {
  View,
  Text,
  Image,
  Pressable,
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
} from "react-native";
import {
  fetchCommentsOfPost,
  fetchReplies,
  submitReply,
} from "../../services/postsService";
import { fetchUserData } from '../../services/userService'
import { router, useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import { useEffect, useState, useMemo } from "react";
import CommentInputBox from "../../components/post-comment/CommentInputBox";
import CommentList from "../../components/post-comment/CommentList";
import { useAdminStore } from "../../store/adminStore";
import { useGlobalContext } from "../../context/GlobalProvider";
import { deleteSinglePost } from "../../services/postsService";
import Toast from "react-native-toast-message";
import LoadingModal from "../../components/modal/LoadingModal";
import { SafeAreaView } from "react-native-safe-area-context";
import React from "react";
import ImageViewing from "react-native-image-viewing";
import PageIndicator from "../../components/post/PageIndicator";

// 将 PostHeader 组件提取出来并使用 React.memo 包装
const PostHeader = React.memo(({
  parsedPost,
  images,
  maxImageHeight,
  onCommentSubmitted,
  onImagePress
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const screenWidth = Dimensions.get('window').width;

  const handleMomentumScrollEnd = (e) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / screenWidth);
    setActiveIndex(index);
  };

  return (
    <>
      {/* 帖子详情 */}
      <View className="py-5 pt-0 border-b border-gray-300">
        {images.length > 0 && (
          <>
            <FlatList
              data={images}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item, idx) => item + idx}
              onMomentumScrollEnd={handleMomentumScrollEnd}
              renderItem={({ item, index }) => (
                <Pressable
                  onPress={() => onImagePress(index)}
                  className="bg-[#EFEDED]"
                  style={{ width: Dimensions.get('window').width, height: maxImageHeight }}
                >
                  <Image
                    source={{ uri: item }}
                    style={{ width: '100%', height: '100%' }}
                    resizeMode="contain"
                  />
                </Pressable>
              )}
            />
            {/* 页面指示器 */}
            <PageIndicator total={images.length} currentIndex={activeIndex} />
          </>
        )}

        <View className="px-5">
          <Text className="mt-3 text-2xl font-bold text-gray-900">
            {parsedPost?.title || "无法读取到标题文本"}
          </Text>
          {parsedPost?.content && (
            <Text className="mt-2 text-base text-gray-600" numberOfLines={20}>
              {parsedPost.content}
            </Text>
          )}
        </View>
      </View>
      {/* 评论输入框 */}
      <View className="px-2">
        <CommentInputBox
          onCommentSubmitted={onCommentSubmitted}
          post_id={parsedPost.$id}
        />
      </View>
    </>
  );
});

export default function PostDetails() {
  const { post } = useLocalSearchParams();
  const parsedPost = post ? JSON.parse(post) : null; // 解析为对象
  const { t } = useTranslation();
  const [commentsDoc, setCommentsDoc] = useState([]);
  const [postCreator, setPostCreator] = useState(null);
  const [maxImageHeight, setMaxImageHeight] = useState(200);
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  const maxHeight = screenHeight * 1; // 设置为屏幕高度的100%
  const adminList = useAdminStore((state) => state.adminList);
  const [isCreator, setIsCreator] = useState(false);
  const { user } = useGlobalContext();
  const [deleting, setDeleting] = useState(false);
  const [isCommentsLoading, setIsCommentsLoading] = useState(true);
  // 图片数组：优先 images 数组，否则退回单张 image
  const imagesArr = parsedPost?.images?.length ? parsedPost.images : (parsedPost?.image ? [parsedPost.image] : []);

  // 获取帖子作者信息
  useEffect(() => {
    const getPostCreatorInfo = async () => {
      const postCreator = await fetchUserData(parsedPost.author);
      setPostCreator(postCreator);
    };
    getPostCreatorInfo();
  }, []);

  // 获取评论
  useEffect(() => {
    const getCommentsOfPost = async () => {
      setIsCommentsLoading(true);
      try {
        const comments = await fetchCommentsOfPost(parsedPost.$id);
        setCommentsDoc(comments.documents);
      } catch (error) {
        console.error("Failed to fetch comments:", error);
      } finally {
        setIsCommentsLoading(false);
      }
    };
    getCommentsOfPost();
  }, []);

  // 删除评论后直接更新评论列表，而不是通过 refreshFlag
  const handleCommentDeleted = (deletedCommentId) => {
    setCommentsDoc(prevComments =>
      prevComments.filter(comment => comment?.$id !== deletedCommentId)
    );
  };

  useEffect(() => {
    if (user && parsedPost) {
      // 检查是否是帖子作者或管理员
      if (user.$id === parsedPost.author || adminList.includes(user.email)) {
        setIsCreator(true);
      }
    }
  }, [user, parsedPost, adminList]);

  useEffect(() => {
    if (imagesArr.length === 0) return;

    const promises = imagesArr.map(uri => new Promise((resolve) => {
      Image.getSize(uri, (w, h) => {
        const scaled = (screenWidth * h) / w;
        resolve(Math.min(scaled, maxHeight));
      }, () => resolve(200));
    }));

    Promise.all(promises).then(heights => {
      const maxH = Math.max(...heights);
      const finalH = Math.min(maxH, screenHeight * 0.75);
      setMaxImageHeight(finalH);
    });
  }, [imagesArr]);

  const onCommentSubmitted = (newComment) => {
    setCommentsDoc((prevComments) => [newComment, ...prevComments]);
  };

  // image viewing state
  const [viewerVisible, setViewerVisible] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);

  const openViewer = (idx) => {
    setCurrentIdx(idx);
    setViewerVisible(true);
  };
  const closeViewer = () => setViewerVisible(false);

  const handleDeletePost = async () => {
    setDeleting(true);
    try {
      const delSuccess = await deleteSinglePost(parsedPost.$id);
      if (delSuccess) {
        router.navigate("/posts");
        Toast.show({
          type: "success",
          topOffset: "80",
          text1: t("Delete Successful"),
        });
      } else {
        Toast.show({
          type: "error",
          topOffset: "80",
          text1: t("Delete Failed"),
        });
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Delete failed", error);
    } finally {
      setDeleting(false);
    }
  };

  const clickedDeletePost = () => {
    Alert.alert(
      t("Delete Post"),
      t("Are you sure you want to delete this post?"),
      [
        {
          text: t("Cancel"),
          style: "cancel",
        },
        {
          text: t("Confirm"),
          style: "destructive",
          onPress: () => {
            handleDeletePost();
          },
        },
      ],
      { cancelable: true }
    );
  };

  const headerComponent = useMemo(() => (
    <PostHeader
      parsedPost={parsedPost}
      images={imagesArr}
      maxImageHeight={maxImageHeight}
      onCommentSubmitted={onCommentSubmitted}
      onImagePress={(idx) => openViewer(idx)}
    />
  ), [parsedPost, imagesArr, maxImageHeight, onCommentSubmitted]);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center">
          <Pressable onPress={() => router.back()} className="p-4">
            <Image
              source={require("../../assets/icons/back-arrow.png")}
              className="w-6 h-6"
            />
          </Pressable>
          {/* 用户信息 */}
          <Image
            source={{ uri: postCreator?.avatar }}
            className="w-6 h-6 rounded-full ml-2"
          />
          <Text className="ml-2">{postCreator?.username}</Text>
        </View>
        {/* 删除按钮 */}
        {isCreator && (
          <Pressable
            onPress={() =>
              clickedDeletePost(() => {
                // 这里写你的删除逻辑
                console.log("确认删除帖子:", parsedPost.$id);
              })
            }
            className="p-4"
          >
            <Image
              source={require("../../assets/menu/delete.png")}
              className="w-5 h-5"
              resizeMode="contain"
            />
          </Pressable>
        )}
      </View>
      {isCommentsLoading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <CommentList
          commentsDoc={commentsDoc}
          fetchCommentUser={fetchUserData}
          fetchReplies={fetchReplies}
          submitReply={submitReply}
          isLoading={isCommentsLoading}
          ListHeaderComponent={headerComponent}
          onCommentDeleted={handleCommentDeleted}
          setCommentsDoc={setCommentsDoc}
        />
      )}
      <LoadingModal isVisible={deleting} loadingText={t("Deleting post...")} />
      {/* Image Viewer */}
      <ImageViewing
        images={imagesArr.map(uri => ({ uri }))}
        imageIndex={currentIdx}
        visible={viewerVisible}
        onRequestClose={closeViewer}
      />
    </SafeAreaView>
  );
}
