import {View, TextInput, StyleSheet, Text} from 'react-native'
import {useState} from 'react'
import {useTranslation} from "react-i18next";

export default function CommentBox() {
    const {t} = useTranslation()
    const [comment, setComment] = useState('');

    const handleCommentSubmit = () => {}

    return (
        <View>
            <Text className={'text-white text-xl mb-4 font-bold'}>
                {t("Comment")}
            </Text>
            <TextInput
                value={comment}
                onChangeText={setComment}
                placeholder={t("Write your comment...")}
                placeholderTextColor={'white'}
                style={styles.input}
                onSubmitEditing={handleCommentSubmit}
            />
        </View>
    )
}

const styles = StyleSheet.create({
    container: {},
    input: {
        height: 40,
        borderColor: 'gray',
        borderWidth: 1,
        borderRadius: 8,
        marginBottom: 10,
        paddingHorizontal: 16
    }
})