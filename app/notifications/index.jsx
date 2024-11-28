import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';

const notifications = [
  { id: '1', title: 'Notification 1', message: 'This is the first notification' },
  { id: '2', title: 'Notification 2', message: 'This is the second notification' },
  { id: '3', title: 'Notification 3', message: 'This is the third notification' },
];

const NotificationItem = ({ title, message }) => (
  <View style={styles.notificationItem}>
    <Text style={styles.title}>{title}</Text>
    <Text style={styles.message}>{message}</Text>
  </View>
);

const Notifications = () => {
  return (
    <View style={styles.container}>
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <NotificationItem title={item.title} message={item.message} />
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  notificationItem: {
    padding: 15,
    marginVertical: 8,
    backgroundColor: '#f9f9f9',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  message: {
    fontSize: 14,
    color: '#555',
  },
});

export default Notifications;