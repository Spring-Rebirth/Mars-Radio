import { View, Text } from 'react-native'
import React from 'react'

export default function CommentBox() {
    const [comment, setComment] = useState('');

    return (
        <View>
            <TextInput
                value={comment}
                onChangeText={setComment}
                placeholder="Write your comment..."
                style={{ height: 40, borderColor: 'gray', borderWidth: 1, marginBottom: 10 }}
            />
            <Button title="Submit a review" onPress={handleCommentSubmit} />
        </View>
    )
}