import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import {
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
import { addDoc, collection } from "firebase/firestore";
import BottomNav from "../../components/BottomNav";
import { auth, db } from "../../firebase/firebaseConfig";

export default function TeamSetup() {
  const router = useRouter();

  const [teamName, setTeamName] = useState("");
  const [memberOne, setMemberOne] = useState("");
  const [memberTwo, setMemberTwo] = useState("");
  const [grade, setGrade] = useState("");
  const [error, setError] = useState("");

  // Save team setup data to Firestore before moving to home screen
  const handleSaveTeam = async () => {
    Keyboard.dismiss();
    setError("");

    if (!teamName.trim() || !memberOne.trim() || !grade.trim()) {
      setError("Please add a team name, at least one member, and a year level.");
      return;
    }

    try {
      const currentUser = auth.currentUser;

      const teamCode =
        teamName.trim().toUpperCase().replace(/\s+/g, "-") + "-" + Date.now();

      await addDoc(collection(db, "teams"), {
        teamName: teamName.trim(),
        members: [memberOne.trim(), memberTwo.trim()].filter(Boolean),
        yearLevel: grade.trim(),
        teamCode: teamCode,
        createdBy: currentUser ? currentUser.uid : "unknown",
        createdAt: new Date().toISOString(),
      });

      router.replace({
        pathname: "/main/home",
        params: {
          teamName: teamName.trim(),
          memberOne: memberOne.trim(),
          memberTwo: memberTwo.trim(),
          grade: grade.trim(),
        },
      });
    } catch (error) {
      console.log("Error saving team:", error);
      setError("Team could not be saved. Please try again.");
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <StatusBar style="dark" />
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.screen}>
          <ScrollView
            contentContainerStyle={styles.container}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.hero}>
              <Text style={styles.kicker}>Team Setup</Text>
              <Text style={styles.title}>Name your lab crew.</Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.label}>Team Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Example: Gravity Squad"
                placeholderTextColor="#8a9584"
                value={teamName}
                onChangeText={setTeamName}
                returnKeyType="next"
              />

              <Text style={styles.label}>Member 1</Text>
              <TextInput
                style={styles.input}
                placeholder="First member name"
                placeholderTextColor="#8a9584"
                value={memberOne}
                onChangeText={setMemberOne}
                returnKeyType="next"
              />

              <Text style={styles.label}>Member 2</Text>
              <TextInput
                style={styles.input}
                placeholder="Second member name"
                placeholderTextColor="#8a9584"
                value={memberTwo}
                onChangeText={setMemberTwo}
                returnKeyType="next"
              />

              <Text style={styles.label}>Grade / Year Level</Text>
              <TextInput
                style={styles.input}
                placeholder="Example: Year 7"
                placeholderTextColor="#8a9584"
                value={grade}
                onChangeText={setGrade}
                returnKeyType="done"
                onSubmitEditing={handleSaveTeam}
              />

              {error ? <Text style={styles.error}>{error}</Text> : null}

              <TouchableOpacity style={styles.button} onPress={handleSaveTeam}>
                <Text style={styles.buttonText}>Save Team</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>

          <BottomNav current="team" />
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: "#f6f8ef",
  },
  screen: {
    flex: 1,
    backgroundColor: "#f6f8ef",
  },
  container: {
    padding: 22,
    paddingTop: 58,
    paddingBottom: 24,
  },
  hero: {
    backgroundColor: "#ffffff",
    borderRadius: 30,
    padding: 22,
    marginBottom: 16,
  },
  kicker: {
    color: "#2e7d32",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.3,
    textTransform: "uppercase",
  },
  title: {
    marginTop: 8,
    color: "#172218",
    fontSize: 34,
    lineHeight: 38,
    fontWeight: "900",
    letterSpacing: -0.8,
  },
  subtitle: {
    marginTop: 8,
    color: "#5f6f52",
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "700",
  },
  card: {
    backgroundColor: "#172218",
    borderRadius: 30,
    padding: 22,
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.14,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
  },
  label: {
    fontSize: 14,
    fontWeight: "900",
    marginBottom: 8,
    color: "#ffffff",
  },
  input: {
    borderWidth: 1,
    borderColor: "#314333",
    backgroundColor: "#243326",
    borderRadius: 18,
    paddingVertical: 15,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 15,
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
});