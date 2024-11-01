import React, { useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
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
                        <Text style={styles.title}>一级视图</Text>
                        <Button title="跳转到二级视图" onPress={goToNextLevel} />
                    </View>
                ) : (
                    // 二级视图
                    <View>
                        <Text style={styles.title}>二级视图</Text>
                        <Button title="返回一级视图" onPress={goToPreviousLevel} />
                    </View>
                )}
                <Button title="关闭" onPress={() => setModalVisible(false)} />
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
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 10,
        alignItems: 'center',
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 20,
    },
});
