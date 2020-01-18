import React, { useState } from 'react';
import { StyleSheet, View, TextInput } from 'react-native';
import { Notifications } from 'expo';
import * as Permissions from 'expo-permissions';

async function registerForPushNotificationsAsync() {
  const { status } = await Permissions.askAsync(Permissions.NOTIFICATIONS);
  // only asks if permissions have not already been determined, because
  // iOS won't necessarily prompt the user a second time.
  // On Android, permissions are granted on app installation, so
  // `askAsync` will never prompt the user

  // Stop here if the user did not grant permissions
  if (status !== 'granted') {
    alert('No notification permissions!');
    return;
  }

  // Get the token that identifies this device
  let token = '';
  try {
    token = await Notifications.getExpoPushTokenAsync();
  }
  catch(e) {
    console.log("ERROR");
    console.log(e);
  }

  console.log(token)

  // POST the token to your backend server from where you can retrieve it to send push notifications.
  fetch('http://192.168.0.5:8080/subcsribeToTopic', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      regToken: token,
      url: 'test',
      username: 'Brent'
    }),
  })
  .then(res => console.log("RES: " + res))
  .catch(err => console.log("ERROR: "+ err))
}

export default function App() {

  registerForPushNotificationsAsync();

  const [value, onChangeText] = useState('Init value')
  return (
    <View style={styles.container}>
        <TextInput 
          style={{ height: 40, borderColor: 'gray', borderWidth: 1 }}
          onChangeText={text => onChangeText(text)}
          value={value}
        />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
