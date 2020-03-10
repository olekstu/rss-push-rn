import React, { useState, useEffect } from "react";
import {
  FlatList,
  StyleSheet,
  View,
  TextInput,
  Button,
  Text
} from "react-native";
import { Notifications, registerRootComponent } from "expo";
import Constants from "expo-constants";
import * as Permissions from "expo-permissions";
import { prod, local } from "./config";

const envConfig = __DEV__ ? local : prod;

const fetchPlus = (url, config = {}) => {
  return fetch(url, {
    ...config,
    headers: {
      "x-api-key": Constants.manifest.extra.apiKey
    }
  });
};

async function registerForPushNotificationsAsync() {
  const { status: existingStatus } = await Permissions.getAsync(
    Permissions.NOTIFICATIONS
  );
  let finalStatus = existingStatus;
  if (existingStatus !== "granted") {
    const { status } = await Permissions.askAsync(Permissions.NOTIFICATIONS);
    finalStatus = status;
  }
  if (finalStatus !== "granted") {
    alert("Failed to get push token for push notification!");
    return;
  }
  console.log("PERMISSION GRANTED");

  // Get the token that identifies this device
  try {
    let token = await Notifications.getExpoPushTokenAsync();
    return token;
  } catch (e) {
    console.log("ERROR WHEN FETCHING TOKEN: " + e);
  }
}

export default class App extends React.Component {
  render() {
    return <AppTmp />;
  }
}

const AppTmp = () => {
  const [token, setToken] = useState();
  const [rssUrl, onRssUrlChange] = useState("");
  const [rssUrlsForUser, setRssUrlsForUser] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  console.log("IS DEV " + __DEV__);

  const getUrlsForUser = async () => {
    console.log("GETTING URL FOR USER WITH ID: " + Constants.installationId);
    const res = await fetchPlus(
      `${envConfig.host}/users/${Constants.installationId}`
    );
    const rssUrlsForUser = await res.json();
    console.log("GOT URL FOR USER");
    console.log(rssUrlsForUser);
    return rssUrlsForUser;
  };

  const loadInitialData = async () => {
    const initDataLoad = await Promise.all([
      registerForPushNotificationsAsync(),
      getUrlsForUser()
    ]);
    console.log(initDataLoad);
    const freshToken = initDataLoad[0];
    const rssUrlsForUser = initDataLoad[1];
    if (rssUrlsForUser.length > 0 && freshToken !== rssUrlsForUser[0].token) {
      console.log("Received new token. Updating....");
      //const await = updateTokenToBackendForUserId();      
    }
    setToken(freshToken);
    setRssUrlsForUser(rssUrlsForUser);
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const onSubmitPressed = () => {
    if (token === undefined) {
      alert("Failed to get push token for push notification!");
      return;
    }

    const body = {
      token: token,
      rssUrl: rssUrl,
      userId: Constants.installationId
    };
    console.log("POSTING RSSURL");
    console.log(body);
    fetch(`${envConfig.host}/addUserToRssUrl`, {
      method: "POST",
      headers: {
        "x-api-key": Constants.manifest.extra.apiKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    })
      .then(res =>
        getUrlsForUser().then(rssUrlsForUser =>
          setRssUrlsForUser(rssUrlsForUser)
        )
      )
      .catch(err => console.log("ERROR: " + err));
  };

  const onRemoveRssUrlPressed = rssUrl => {
    fetchPlus(
      `${envConfig.host}/userss/${
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
        data={rssUrlsForUser
          .map(user => user.rss_url)
          .map(rssUrl => ({
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
};

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
