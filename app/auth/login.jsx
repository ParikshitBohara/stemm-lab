// Firebase Authentication imports
import { signInWithEmailAndPassword } from "firebase/auth";
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

export default function Login() {
  const router = useRouter();
  const passwordRef = useRef(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // Handle user login with Firebase
  const handleLogin = async() => {
    Keyboard.dismiss();
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Please enter your email and password.");
      return;
    }
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      
      // Navigate to home screen after successful login
      router.push("/main/home");
    } catch (_error) {
    setError("Login failed. Please check your email and password.");
    }
  };

    
  

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <StatusBar style="dark" />
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.heroCard}>
            <View style={styles.logoShell}>
              <Image
                source={require("../../assets/images/stemmlogo.png")}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.title}>Welcome Back!</Text>
            <Text style={styles.subtitle}>
              Login to continue your STEMM challenge dashboard.
            </Text>
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
                accessibilityLabel="Email input"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                ref={passwordRef}
                style={styles.input}
                placeholder="Enter password"
                placeholderTextColor="#8a9584"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
                accessibilityLabel="Password input"
              />
            </View>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <TouchableOpacity style={styles.button} onPress={handleLogin}>
              <Text style={styles.buttonText}>Login</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => {
                Keyboard.dismiss();
                router.push("/auth/register");
              }}
            >
              <Text style={styles.secondaryText}>Register an account</Text>
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
    backgroundColor: "#f6f8ef",
  },
  container: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 22,
  },
  heroCard: {
    backgroundColor: "#172218",
    borderRadius: 34,
    padding: 24,
    marginBottom: 16,
    overflow: "hidden",
  },
  logoShell: {
    width: 104,
    height: 104,
    borderRadius: 28,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 18,
  },
  logo: {
    width: 82,
    height: 82,
  },
  kicker: {
    color: "#f0ff75",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  title: {
    marginTop: 6,
    fontSize: 36,
    fontWeight: "900",
    color: "#ffffff",
    letterSpacing: -0.7,
  },
  subtitle: {
    marginTop: 8,
    color: "#dbe7d4",
    fontSize: 15,
    lineHeight: 22,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 30,
    padding: 22,
    shadowColor: "#20351f",
    shadowOpacity: 0.1,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
    elevation: 4,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "900",
    marginBottom: 8,
    color: "#172218",
  },
  input: {
    borderWidth: 1,
    borderColor: "#dfe8d8",
    backgroundColor: "#f8fbf4",
    borderRadius: 18,
    paddingVertical: 15,
    paddingHorizontal: 16,
    fontSize: 16,
    color: "#172218",
  },
  error: {
    color: "#b42318",
    backgroundColor: "#fff1f0",
    borderRadius: 14,
    padding: 10,
    fontSize: 14,
    marginBottom: 12,
    fontWeight: "700",
  },
  button: {
    backgroundColor: "#2e7d32",
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: "center",
    marginTop: 4,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "900",
  },
  secondaryButton: {
    marginTop: 14,
    paddingVertical: 12,
    alignItems: "center",
  },
  secondaryText: {
    color: "#1565c0",
    fontSize: 15,
    fontWeight: "900",
  },
});
