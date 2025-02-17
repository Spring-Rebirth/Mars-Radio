import {
  View,
  StyleSheet,
  TextInput,
  Button,
  TouchableOpacity,
  Image,
} from "react-native";
import React, { useState } from "react";
import { router, Stack } from "expo-router";
import { useSignIn } from "@clerk/clerk-expo";
import { useTranslation } from "react-i18next";

const PwReset = () => {
  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [successfulCreation, setSuccessfulCreation] = useState(false);
  const { signIn, setActive } = useSignIn();
  const { t } = useTranslation();

  // Request a passowrd reset code by email
  const onRequestReset = async () => {
    try {
      await signIn.create({
        strategy: "reset_password_email_code",
        identifier: emailAddress,
      });
      setSuccessfulCreation(true);
    } catch (err) {
      alert(err.errors[0].message);
    }
  };

  // Reset the password with the code and the new password
  const onReset = async () => {
    try {
      const result = await signIn.attemptFirstFactor({
        strategy: "reset_password_email_code",
        code,
        password,
      });
      console.log(result);
      alert(t("Password reset successfully"));

      // Set the user session active, which will log in the user automatically
      await setActive({ session: result.createdSessionId });
    } catch (err) {
      alert(err.errors[0].message);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerBackVisible: !successfulCreation }} />
      <TouchableOpacity
        onPress={() => router.back()}
        className="w-12 h-12 justify-center items-center -ml-2 absolute top-16 left-4"
      >
        <Image
          source={require("../../assets/icons/back-arrow.png")}
          style={{ width: 25, height: 25 }}
        />
      </TouchableOpacity>

      {!successfulCreation && (
        <>
          <TextInput
            autoCapitalize="none"
            placeholder="your_email@example.com"
            value={emailAddress}
            onChangeText={setEmailAddress}
            style={styles.inputField}
          />

          <Button
            onPress={onRequestReset}
            title={t("Send Reset Email")}
            color={"#6c47ff"}
          ></Button>
        </>
      )}

      {successfulCreation && (
        <>
          <View>
            <TextInput
              value={code}
              placeholder={t("Code...")}
              style={styles.inputField}
              onChangeText={setCode}
            />
            <TextInput
              placeholder={t("New password")}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              style={styles.inputField}
            />
          </View>
          <Button
            onPress={onReset}
            title={t("Set new Password")}
            color={"#6c47ff"}
          ></Button>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative",
    justifyContent: "center",
    padding: 20,
  },
  inputField: {
    marginVertical: 4,
    height: 50,
    borderWidth: 1,
    borderColor: "#6c47ff",
    borderRadius: 4,
    padding: 10,
    backgroundColor: "#fff",
  },
  button: {
    margin: 8,
    alignItems: "center",
  },
});

export default PwReset;
