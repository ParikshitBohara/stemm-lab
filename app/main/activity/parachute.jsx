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
import { StatusBar } from "expo-status-bar";
import TopBar from "../../../components/TopBar";

const equipment = [
  "Plastic bag or lightweight fabric",
  "String",
  "Tape",
  "Small test weight",
  "Ruler or measuring tape",
  "Timer",
];

const instructions = [
  "Build a parachute canopy using the plastic bag or lightweight fabric.",
  "Attach equal lengths of string to the canopy and connect them to the test weight.",
  "Drop the parachute from the same height for every trial.",
  "Record how long the parachute takes to reach the ground.",
  "Adjust one design feature, then test again and compare the results.",
];

const physicsConcepts = [
  {
    title: "Gravity",
    detail: "Pulls the parachute and test weight toward the ground.",
  },
  {
    title: "Drag",
    detail: "Air resistance that slows the parachute as it falls.",
  },
  {
    title: "Net Force",
    detail: "The combined push and pull acting on the falling design.",
  },
  {
    title: "G-Force",
    detail: "The acceleration load felt during launch, fall, or landing.",
  },
];

const studentFocus = [
  {
    group: "Primary School",
    detail: "Observe, describe, compare trials, and discuss fair testing.",
  },
  {
    group: "High School",
    detail: "Control variables, analyse forces, and justify design changes.",
  },
];

const curriculumLinks = [
  "Forces and motion",
  "Scientific inquiry skills",
  "Engineering design process",
  "Data collection and evidence-based reflection",
];

const experimentFields = [
  {
    key: "prediction",
    label: "Prediction",
    placeholder: "What do you think will happen before testing?",
    multiline: true,
  },
  {
    key: "dropHeight",
    label: "Drop Height",
    placeholder: "Example: 2 metres",
  },
  {
    key: "baselineTime",
    label: "Baseline Time",
    placeholder: "Example: 1.8 seconds",
    keyboardType: "decimal-pad",
  },
  {
    key: "prototypeOneTime",
    label: "Prototype 1 Time",
    placeholder: "Example: 2.1 seconds",
    keyboardType: "decimal-pad",
  },
  {
    key: "prototypeTwoTime",
    label: "Prototype 2 Time",
    placeholder: "Example: 2.4 seconds",
    keyboardType: "decimal-pad",
  },
  {
    key: "prototypeThreeTime",
    label: "Prototype 3 Time",
    placeholder: "Example: 2.6 seconds",
    keyboardType: "decimal-pad",
  },
  {
    key: "landingNotes",
    label: "Landing Notes",
    placeholder: "Was the landing stable, tilted, fast, or slow?",
    multiline: true,
  },
  {
    key: "reflection",
    label: "Reflection",
    placeholder: "What would you improve next?",
    multiline: true,
  },
];

export default function ParachuteChallenge() {
  const [completedSteps, setCompletedSteps] = useState([]);
  const [experiment, setExperiment] = useState({
    prediction: "",
    dropHeight: "",
    baselineTime: "",
    prototypeOneTime: "",
    prototypeTwoTime: "",
    prototypeThreeTime: "",
    landingNotes: "",
    reflection: "",
  });
  const [successMessage, setSuccessMessage] = useState("");

  const toggleStep = (stepIndex) => {
    setCompletedSteps((current) =>
      current.includes(stepIndex)
        ? current.filter((item) => item !== stepIndex)
        : [...current, stepIndex],
    );
  };

  const updateExperiment = (key, value) => {
    setExperiment((current) => ({ ...current, [key]: value }));
    setSuccessMessage("");
  };

  const handleSaveExperiment = () => {
    Keyboard.dismiss();
    setSuccessMessage("Experiment saved for demo.");
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <StatusBar style="dark" />
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableWithoutFeedback
          onPress={Keyboard.dismiss}
          accessible={false}
        >
          <View>
            <TopBar title="Parachute Drop Challenge" eyebrow="Engineering + Physics" />

            <View style={styles.hero}>
              <View style={styles.heroMetaRow}>
                <Text style={styles.category}>Engineering + Physics</Text>
                <Text style={styles.heroPill}>Design Lab</Text>
              </View>
              <Text style={styles.title}>Parachute Drop Challenge</Text>
              <Text style={styles.heroText}>
                Design, drop, measure, and improve a parachute so it falls slowly
                and safely.
              </Text>
              <View style={styles.heroStats}>
                <View style={styles.heroStat}>
                  <Text style={styles.heroStatLabel}>Goal</Text>
                  <Text style={styles.heroStatValue}>Slow landing</Text>
                </View>
                <View style={styles.heroStat}>
                  <Text style={styles.heroStatLabel}>Method</Text>
                  <Text style={styles.heroStatValue}>Test and improve</Text>
                </View>
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardLabel}>Overview</Text>
              <Text style={styles.cardTitle}>Your Mission</Text>
              <Text style={styles.cardText}>
                Explore how canopy size, shape, and string length affect air
                resistance. Your goal is to create a parachute that gives the test
                weight the longest controlled descent.
              </Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardLabel}>Physics Concepts</Text>
              <Text style={styles.cardTitle}>Forces in Flight</Text>
              <View style={styles.conceptGrid}>
                {physicsConcepts.map((concept) => (
                  <View key={concept.title} style={styles.conceptTile}>
                    <Text style={styles.conceptTitle}>{concept.title}</Text>
                    <Text style={styles.conceptText}>{concept.detail}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardLabel}>Student Focus</Text>
              <Text style={styles.cardTitle}>Learning Pathways</Text>
              <View style={styles.focusList}>
                {studentFocus.map((item) => (
                  <View key={item.group} style={styles.focusRow}>
                    <Text style={styles.focusBadge}>{item.group}</Text>
                    <Text style={styles.focusText}>{item.detail}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardLabel}>Curriculum Links</Text>
              <Text style={styles.cardTitle}>Skills and Outcomes</Text>
              <View style={styles.curriculumList}>
                {curriculumLinks.map((item) => (
                  <View key={item} style={styles.curriculumRow}>
                    <View style={styles.curriculumDot} />
                    <Text style={styles.curriculumText}>{item}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardLabel}>Equipment</Text>
              <Text style={styles.cardTitle}>Materials</Text>
              <View style={styles.equipmentGrid}>
                {equipment.map((item) => (
                  <View key={item} style={styles.equipmentPill}>
                    <View style={styles.dot} />
                    <Text style={styles.equipmentText}>{item}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardLabel}>Instructions</Text>
              <Text style={styles.cardTitle}>Build and Test</Text>
              <View style={styles.steps}>
                {instructions.map((instruction, index) => {
                  const isComplete = completedSteps.includes(index);

                  return (
                    <TouchableOpacity
                      key={instruction}
                      style={[styles.stepRow, isComplete && styles.stepRowDone]}
                      onPress={() => toggleStep(index)}
                      activeOpacity={0.82}
                    >
                      <View
                        style={[styles.stepNumber, isComplete && styles.stepNumberDone]}
                      >
                        <Text
                          style={[
                            styles.stepNumberText,
                            isComplete && styles.stepNumberTextDone,
                          ]}
                        >
                          {index + 1}
                        </Text>
                      </View>
                      <Text style={[styles.stepText, isComplete && styles.stepTextDone]}>
                        {instruction}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={[styles.card, styles.formCard]}>
              <Text style={styles.cardLabel}>Experiment Form</Text>
              <Text style={styles.cardTitle}>Record Your Test</Text>
              <Text style={styles.cardText}>
                Capture your prediction, timings, and reflections during the
                parachute trials.
              </Text>

              <View style={styles.form}>
                {experimentFields.map((field) => (
                  <View key={field.key} style={styles.field}>
                    <Text style={styles.inputLabel}>{field.label}</Text>
                    <TextInput
                      style={[
                        styles.input,
                        field.multiline && styles.textArea,
                      ]}
                      placeholder={field.placeholder}
                      placeholderTextColor="#8a9584"
                      value={experiment[field.key]}
                      onChangeText={(value) => updateExperiment(field.key, value)}
                      keyboardType={field.keyboardType || "default"}
                      multiline={field.multiline}
                      textAlignVertical={field.multiline ? "top" : "center"}
                      returnKeyType={field.multiline ? "default" : "next"}
                    />
                  </View>
                ))}
              </View>

              {successMessage ? (
                <Text style={styles.success}>{successMessage}</Text>
              ) : null}

              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSaveExperiment}
                activeOpacity={0.86}
              >
                <Text style={styles.saveButtonText}>Save Experiment</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </ScrollView>
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
    paddingBottom: 34,
  },
  hero: {
    backgroundColor: "#172218",
    borderRadius: 32,
    padding: 24,
    marginBottom: 16,
  },
  heroMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  category: {
    color: "#f0ff75",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.3,
    textTransform: "uppercase",
    flex: 1,
  },
  heroPill: {
    backgroundColor: "#f0ff75",
    borderRadius: 999,
    color: "#172218",
    fontSize: 12,
    fontWeight: "900",
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  title: {
    marginTop: 12,
    color: "#ffffff",
    fontSize: 36,
    lineHeight: 41,
    fontWeight: "900",
  },
  heroText: {
    marginTop: 12,
    color: "#dbe7d4",
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "700",
  },
  heroStats: {
    flexDirection: "row",
    gap: 10,
    marginTop: 20,
  },
  heroStat: {
    flex: 1,
    backgroundColor: "#243326",
    borderColor: "#314333",
    borderWidth: 1,
    borderRadius: 20,
    padding: 14,
  },
  heroStatLabel: {
    color: "#aebda7",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  heroStatValue: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "900",
    marginTop: 5,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 28,
    padding: 21,
    marginBottom: 16,
    elevation: 3,
    shadowColor: "#20351f",
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
  },
  cardLabel: {
    color: "#2e7d32",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 7,
  },
  cardTitle: {
    color: "#172218",
    fontSize: 23,
    lineHeight: 29,
    fontWeight: "900",
    marginBottom: 9,
  },
  cardText: {
    color: "#5f6f52",
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "700",
  },
  conceptGrid: {
    gap: 12,
    marginTop: 14,
  },
  conceptTile: {
    backgroundColor: "#f8fbf4",
    borderColor: "#dfe8d8",
    borderWidth: 1,
    borderRadius: 20,
    padding: 15,
  },
  conceptTitle: {
    color: "#172218",
    fontSize: 17,
    fontWeight: "900",
    marginBottom: 5,
  },
  conceptText: {
    color: "#5f6f52",
    fontSize: 14,
    lineHeight: 21,
    fontWeight: "700",
  },
  focusList: {
    gap: 12,
    marginTop: 14,
  },
  focusRow: {
    backgroundColor: "#e8f5e9",
    borderRadius: 20,
    minHeight: 72,
    padding: 15,
  },
  focusBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#2e7d32",
    borderRadius: 999,
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "900",
    overflow: "hidden",
    paddingHorizontal: 11,
    paddingVertical: 6,
  },
  focusText: {
    color: "#244b2a",
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "800",
    marginTop: 10,
  },
  curriculumList: {
    gap: 11,
    marginTop: 14,
  },
  curriculumRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fbf4",
    borderRadius: 18,
    minHeight: 50,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  curriculumDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: "#1565c0",
    marginRight: 11,
  },
  curriculumText: {
    flex: 1,
    color: "#172218",
    fontSize: 15,
    lineHeight: 21,
    fontWeight: "800",
  },
  equipmentGrid: {
    gap: 10,
    marginTop: 12,
  },
  equipmentPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fbf4",
    borderColor: "#dfe8d8",
    borderWidth: 1,
    borderRadius: 18,
    minHeight: 50,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#2e7d32",
    marginRight: 10,
  },
  equipmentText: {
    flex: 1,
    color: "#172218",
    fontSize: 15,
    lineHeight: 21,
    fontWeight: "800",
  },
  steps: {
    gap: 12,
    marginTop: 12,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#f8fbf4",
    borderColor: "#dfe8d8",
    borderWidth: 1,
    borderRadius: 20,
    minHeight: 66,
    padding: 15,
  },
  stepRowDone: {
    backgroundColor: "#dcfce7",
    borderColor: "#bbf7d0",
  },
  stepNumber: {
    width: 40,
    height: 40,
    borderRadius: 15,
    backgroundColor: "#172218",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  stepNumberDone: {
    backgroundColor: "#2e7d32",
  },
  stepNumberText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "900",
  },
  stepNumberTextDone: {
    color: "#ffffff",
  },
  stepText: {
    flex: 1,
    color: "#172218",
    fontSize: 16,
    lineHeight: 23,
    fontWeight: "800",
  },
  stepTextDone: {
    color: "#166534",
  },
  formCard: {
    backgroundColor: "#fbfdf7",
    borderColor: "#dfe8d8",
    borderWidth: 1,
  },
  form: {
    marginTop: 20,
    gap: 16,
  },
  field: {
    gap: 9,
  },
  inputLabel: {
    color: "#172218",
    fontSize: 15,
    fontWeight: "900",
  },
  input: {
    borderWidth: 1,
    borderColor: "#dfe8d8",
    backgroundColor: "#f8fbf4",
    borderRadius: 18,
    paddingHorizontal: 15,
    paddingVertical: 14,
    minHeight: 54,
    color: "#172218",
    fontSize: 16,
    fontWeight: "700",
  },
  textArea: {
    minHeight: 112,
    lineHeight: 23,
  },
  success: {
    marginTop: 18,
    backgroundColor: "#dcfce7",
    color: "#166534",
    borderRadius: 16,
    padding: 13,
    fontSize: 15,
    fontWeight: "900",
  },
  saveButton: {
    backgroundColor: "#2e7d32",
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 58,
    paddingVertical: 17,
    marginTop: 18,
  },
  saveButtonText: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "900",
  },
});
