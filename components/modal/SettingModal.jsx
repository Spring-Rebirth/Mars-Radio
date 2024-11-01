import React, { useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet, TouchableOpacity } from 'react-native';
import Modal from 'react-native-modal';

export default function SettingModal({ showModal = false, setModalVisible }) {
    const [viewLevel, setViewLevel] = useState(1); // 控制当前视图层级

    // 使用 useEffect 监听 showModal 的变化
    useEffect(() => {
        if (showModal) setViewLevel(1); // 每次打开 Modal 时重置为一级视图
    }, [showModal]);

    const goToNextLevel = () => {
        setViewLevel(2); // 切换到二级视图
    };

    const goToPreviousLevel = () => {
        setViewLevel(1); // 切换回一级视图
    };

    return (
        <Modal
            isVisible={showModal}
            onBackdropPress={() => setModalVisible(false)} // 使用箭头函数延迟执行
        >
            <View style={styles.modalContent}>
                {viewLevel === 1 ? (
                    // 一级视图
                    <View>
                        <Text style={styles.title}>Setting</Text>
                        <TouchableOpacity onPress={goToNextLevel}>
                            <View className="bg-[#D3D3D3] w-36 h-8 items-center justify-center">
                                <Text>Language</Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                ) : (
                    // 二级视图
                    <View>

                        <TouchableOpacity onPress={goToPreviousLevel}
                            className="absolute -top-2.5 -left-28"
                        >
                            <Text>返回</Text>
                        </TouchableOpacity>
                        <Text style={styles.title}>Switch Language</Text>
                        <TouchableOpacity onPress={() => { }}>
                            <View className="bg-[#D3D3D3] w-36 h-8 items-center justify-center">
                                <Text>English</Text>
                            </View>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => { }}>
                            <View className="bg-[#D3D3D3] w-36 h-8 items-center justify-center mt-2">
                                <Text>中文</Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                )}
                <TouchableOpacity
                    style={{ position: 'absolute', top: 10, right: 10 }}
                    onPress={() => setModalVisible(false)}
                >
                    <Text>关闭</Text>
                </TouchableOpacity>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        position: 'relative',
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
});
