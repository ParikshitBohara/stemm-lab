import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../firebase/firebaseConfig";

import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useRef, useState } from "react";
import {
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

export default function Register() {
  const router = useRouter();

  const passwordRef = useRef(null);
  const confirmPasswordRef = useRef(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  
  

  const validatePassword = (value) => {
    const minLength = value.length >= 8;
    const hasUppercase = /[A-Z]/.test(value);
    const hasNumber = /[0-9]/.test(value);

    return minLength && hasUppercase && hasNumber;
  };

  const handleRegister = async () => {
    Keyboard.dismiss();
    setError("");

    if (!email.trim() || !password.trim() || !confirmPassword.trim()) {
      setError("Please fill in all fields.");
      return;
    }

    if (!validatePassword(password)) {
      setError(
        "Password must be 8+ characters and include 1 uppercase letter and 1 number.",
      );
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    try{
      await createUserWithEmailAndPassword(auth,email.trim(),password);
      router.replace("/main/team-setup");
    } catch(_error) {
      setError("Registration failed. Email may already be in use.");
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <StatusBar style="dark" />
      <TouchableWithoutFeedback 
        onPress={Keyboard.dismiss}
        accessible={false}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.headerRow}>
            <Image
              source={require("../../assets/images/stemmlogo.png")}
              style={styles.logo}
              resizeMode="contain"
            />
            <View style={styles.headerText}>
              <Text style={styles.title}>Create Account</Text>
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.field}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="student@example.com"
                placeholderTextColor="#8a9584"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                ref={passwordRef}
                style={styles.input}
                placeholder="Create password"
                placeholderTextColor="#8a9584"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                returnKeyType="next"
                onSubmitEditing={() => confirmPasswordRef.current?.focus()}
                autoCorrect={false}
                autoCapitalize="none"
                textContentType="oneTimeCode"
                importantForAutofill="no"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Confirm Password</Text>
              <TextInput
                ref={confirmPasswordRef}
                style={styles.input}
                placeholder="Re-enter password"
                placeholderTextColor="#8a9584"
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                returnKeyType="done"
                onSubmitEditing={handleRegister}
                autoCorrect={false}
                autoCapitalize="none"
                textContentType="oneTimeCode"
                importantForAutofill="no"
              />
              <Text style={styles.helper}>
                Use 8+ characters with 1 uppercase letter and 1 number.
              </Text>
            </View>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <TouchableOpacity style={styles.button} onPress={handleRegister}>
              <Text style={styles.buttonText}>Create Account</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => {
                Keyboard.dismiss();
                router.replace("/auth/login");
              }}
            >
              <Text style={styles.secondaryText}>Already have an account? Log in</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: "#edf6ff",
  },
  container: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 22,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 30,
    padding: 16,
    marginBottom: 16,
  },
  logo: {
    width: 82,
    height: 82,
    marginRight: 14,
  },
  headerText: {
    flex: 1,
  },
  kicker: {
    color: "#1565c0",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  title: {
    marginTop: 3,
    fontSize: 30,
    fontWeight: "900",
    color: "#172218",
    letterSpacing: -0.5,
  },
  card: {
    backgroundColor: "#172218",
    borderRadius: 30,
    padding: 22,
    shadowColor: "#000",
    shadowOpacity: 0.14,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
    elevation: 5,
  },
  subtitle: {
    color: "#dbe7d4",
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 18,
  },
  field: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    fontWeight: "900",
    marginBottom: 8,
    color: "#ffffff",
  },
  helper: {
    fontSize: 12,
    color: "#dbe7d4",
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#314333",
    backgroundColor: "#243326",
    borderRadius: 18,
    paddingVertical: 15,
    paddingHorizontal: 16,
    fontSize: 16,
    color: "#ffffff",
  },
  error: {
    color: "#7a140d",
    backgroundColor: "#ffe3df",
    borderRadius: 14,
    padding: 10,
    fontSize: 14,
    marginBottom: 12,
    fontWeight: "800",
  },
  button: {
    backgroundColor: "#f0ff75",
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: "center",
    marginTop: 4,
  },
  buttonText: {
    color: "#172218",
    fontSize: 16,
    fontWeight: "900",
  },
  secondaryButton: {
    marginTop: 14,
    paddingVertical: 12,
    alignItems: "center",
  },
  secondaryText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "900",
  },
});
