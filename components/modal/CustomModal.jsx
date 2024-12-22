import { useState, useEffect } from 'react';
import { View, Text, Button } from 'react-native';
import Modal from 'react-native-modal';

export default function CustomModal({
    isVisible,
    onClose, // 提供关闭时的回调
    children, // 支持自定义内容
    modalStyle, // 自定义 Modal 外部样式
    contentStyle, // 自定义 Modal 内部样式
    animationIn = "slideInUp", // 默认动画
    animationOut = "slideOutDown",
    ...modalProps // 传递给 Modal 组件的其他属性
}) {
    const [isModalVisible, setModalVisible] = useState(isVisible);

    // 监听外部传入的 isVisible 值并更新状态
    useEffect(() => {
        setModalVisible(isVisible);
    }, [isVisible]);

    const toggleModal = () => {
        setModalVisible(!isModalVisible);
        if (onClose) {
            onClose(); // 触发父组件的关闭回调
        }
    };

    return (
        <View>
            <Modal
                isVisible={isModalVisible}
                animationIn={animationIn}
                animationOut={animationOut}
                onBackdropPress={toggleModal} // 点击背景关闭
                {...modalProps} // 传递其他的 Modal 属性
            >
                <View style={[{ width: '100%', height: 400, borderRadius: 20, alignItems: 'center', backgroundColor: 'white' }, contentStyle]}>
                    {children ? children : ( // 使用 children 代替固定内容
                        <>
                            <Text>Hello!</Text>
                            <Button title="Hide Modal" onPress={toggleModal} />
                        </>
                    )}
                </View>
            </Modal>
        </View>
    );
}
