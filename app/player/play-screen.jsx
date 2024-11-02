import { View, Text, Dimensions, ActivityIndicator, StyleSheet } from 'react-native'
import React, { useState } from 'react'
import { useLocalSearchParams } from "expo-router";
import { Video, ResizeMode } from 'expo-av';
import { SafeAreaView } from 'react-native-safe-area-context';
import CommentInputBox from "../../components/comment/CommentInputBox";
import CommentView from "../../components/comment/CommentView";

export default function PlayScreen() {
    const { post } = useLocalSearchParams();
    const parsedVideoUrl = post ? JSON.parse(post).video : null;
    const { $id: videoId, creator: { $id: userId } } = JSON.parse(post);

    console.log('PlayScreen - post:', JSON.parse(post, null, 2));
    console.log(videoId, "\t", userId);

    const screenHeight = Dimensions.get('window').width * 9 / 16;
    console.log('screenHeight:', screenHeight);

    const [playing, setPlaying] = useState(false);
    const [loading, setLoading] = useState(true);

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                {loading && (
                    <>
                        <ActivityIndicator size="large" color="#fff" style={styles.activityIndicator} />
                        {!playing && (
                            <Text style={styles.loadingText}>Loading</Text>
                        )}
                    </>
                )}
                <Video
                    source={{ uri: parsedVideoUrl }}
                    style={[styles.video, { height: screenHeight }]}
                    resizeMode={ResizeMode.CONTAIN}
                    useNativeControls
                    shouldPlay
                    onPlaybackStatusUpdate={async (status) => {
                        if (status.isLoaded) {
                            setLoading(false);
                        }
                        if (status.didJustFinish) {
                            setPlaying(false);
                            setLoading(true);
                        }
                    }}
                />
                <View className={'px-6 mt-4'}>
                    <CommentInputBox
                        userId={userId}
                        videoId={videoId}
                    />
                    <CommentView />
                </View>
            </View>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#161622', // adjust for your bg-primary color
    },
    container: {
        width: '100%',
        height: '100%',
        backgroundColor: '#161622', // adjust for your bg-primary color
    },
    activityIndicator: {
        position: 'absolute',
        top: '10%',
        left: '50%',
        transform: [{ translateX: -20 }, { translateY: -20 }],
    },
    loadingText: {
        color: '#fff',
        fontSize: 20,
        position: 'absolute',
        top: '5%',
        left: '50%',
        transform: [{ translateX: -40 }, { translateY: -10 }],
    },
    video: {
        width: '100%',
    },
});