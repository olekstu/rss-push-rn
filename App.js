import React, { useState, useEffect } from "react";
import {
  FlatList,
  StyleSheet,
  View,
  TextInput,
  Button,
  Text
} from "react-native";
import { Notifications } from "expo";
import Constants from "expo-constants";
import * as Permissions from "expo-permissions";

async function registerForPushNotificationsAsync(setToken) {
  const { status } = await Permissions.askAsync(Permissions.NOTIFICATIONS);
  // only asks if permissions have not already been determined, because
  // iOS won't necessarily prompt the user a second time.
  // On Android, permissions are granted on app installation, so
  // `askAsync` will never prompt the user

  // Stop here if the user did not grant permissions
  if (status !== "granted") {
    alert("No notification permissions!");
    return;
  }

  // Get the token that identifies this device
  try {
    let token = await Notifications.getExpoPushTokenAsync();
    console.log(token);
    setToken(token);
  } catch (e) {
    console.log("ERROR: " + e);
  }
}

async function getUrlsForUser() {
  const res = await fetch(
    `http://192.168.0.7:8080/users/${Constants.installationId}`
  );
  const rssUrlsForUser = await res.json();
  return rssUrlsForUser;
}

export default function App() {
  const [token, onTokenChange] = useState();
  const [rssUrl, onRssUrlChange] = useState("");
  const [rssUrlsForUser, setRssUrlsForUser] = useState([]);

  useEffect(() => {
    registerForPushNotificationsAsync(onTokenChange);
    getUrlsForUser().then(rssUrlsForUser => setRssUrlsForUser(rssUrlsForUser));
  }, []);

  const onSubmitPressed = () => {
    fetch("http://192.168.0.7:8080/addUserToRssUrl", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        token: token,
        rssUrl: rssUrl,
        userId: Constants.installationId
      })
    })
      .then(res =>
        getUrlsForUser().then(rssUrlsForUser =>
          setRssUrlsForUser(rssUrlsForUser)
        )
      )
      .catch(err => console.log("ERROR: " + err));
  };

  const onRemoveRssUrlPressed = rssUrl => {
    console.log();
    fetch(
      `http://192.168.0.7:8080/userss/${
        Constants.installationId
      }/rssUrl/${encodeURIComponent(rssUrl)}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        }
      }
    ).then(() =>
      getUrlsForUser().then(rssUrlsForUser => setRssUrlsForUser(rssUrlsForUser))
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.submitWrapper}>
        <TextInput
          placeholder={"Enter RSS URL"}
          style={styles.textInput}
          onChangeText={v => onRssUrlChange(v)}
          value={rssUrl}
        />
        <Button
          styles={styles.submitButton}
          title="Submit "
          onPress={() => onSubmitPressed()}
        />
      </View>
      <Text style={{ color: "white" }}>Dine URLER:</Text>
      <FlatList
        style={styles.urlList}
        data={rssUrlsForUser.map(rssUrl => ({
          key: rssUrl
        }))}
        renderItem={({ item }) => (
          <View style={styles.rssElementWrapper}>
            <Text style={styles.rssUrlText}>{item.key} </Text>
            <Button title="X" onPress={() => onRemoveRssUrlPressed(item.key)} />
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60
  },
  textInput: {
    height: 40,
    borderColor: "grey",
    borderWidth: 1,
    backgroundColor: "white",
    fontSize: 16,
    marginRight: 20
  },
  submitWrapper: {
    display: "flex",
    flexDirection: "row",
    borderColor: "grey",
    borderWidth: 1,
    paddingLeft: 50,
    paddingRight: 50,
    paddingTop: 10,
    paddingBottom: 10,
    borderRadius: 5,
    marginBottom: 40
  },
  rssElementWrapper: {
    display: "flex",
    flexDirection: "row"
  },
  rssUrlText: {
    marginTop: 10,
    color: "white",
    borderBottomColor: "white",
    borderWidth: 2,
    fontSize: 14
  }
});
