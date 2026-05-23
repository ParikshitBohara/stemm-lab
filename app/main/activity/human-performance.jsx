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

const steps = [
  "Overview",
  "Equipment",
  "Instructions",
  "Movement Test",
  "Results",
  "Reflection & Save",
];

const equipment = [
  "Mobile phone with STEMM Lab app",
  "Open space to move safely",
];

const instructions = [
  "Hold the phone firmly in one hand.",
  "Activate the movement sensor in the app.",
  "Perform each guided movement slowly and safely.",
  "Record movement and vibration results.",
  "Repeat the activity with feedback enabled.",
  "Review speed, smoothness and coordination data.",
  "Reflect as a team.",
];

const safetyNotes = [
  "Ensure there is clear space before moving.",
  "Stop immediately if any movement causes pain or discomfort.",
  "Hold the phone securely during testing.",
];

const movements = [
  {
    label: "Movement 1",
    title: "Slow arm raise",
    detail: "Lift your arm slowly while keeping control through the full range.",
  },
  {
    label: "Movement 2",
    title: "Side-to-side reach",
    detail: "Reach gently from side to side while staying balanced.",
  },
  {
    label: "Movement 3",
    title: "Controlled wrist rotation",
    detail: "Rotate your wrist smoothly without rushing the movement.",
  },
];

const resultFields = [
  {
    label: "Prediction: which movement will be hardest to keep smooth?",
    placeholder: "Example: Controlled wrist rotation will be hardest.",
    key: "prediction",
    multiline: true,
  },
  {
    label: "Attempt 1 notes",
    placeholder: "What happened during the slow arm raise?",
    key: "attempt1Notes",
    multiline: true,
  },
  {
    label: "Attempt 2 notes",
    placeholder: "What happened during the side-to-side reach?",
    key: "attempt2Notes",
    multiline: true,
  },
  {
    label: "Attempt 3 notes",
    placeholder: "What happened during the wrist rotation?",
    key: "attempt3Notes",
    multiline: true,
  },
  {
    label: "Were you right?",
    placeholder: "Compare your prediction with the result.",
    key: "wereYouRight",
    multiline: true,
  },
  {
    label: "Any surprises?",
    placeholder: "What surprised your team?",
    key: "surprises",
    multiline: true,
  },
];

export default function HumanPerformanceLab() {
  const [currentStep, setCurrentStep] = useState(0);
  const [prediction, setPrediction] = useState("");
  const [attempt1Notes, setAttempt1Notes] = useState("");
  const [attempt2Notes, setAttempt2Notes] = useState("");
  const [attempt3Notes, setAttempt3Notes] = useState("");
  const [wereYouRight, setWereYouRight] = useState("");
  const [surprises, setSurprises] = useState("");
  const [reflection, setReflection] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [saveError, setSaveError] = useState("");

  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;
  const progressPercent = `${((currentStep + 1) / steps.length) * 100}%`;

  const fieldValues = {
    prediction,
    attempt1Notes,
    attempt2Notes,
    attempt3Notes,
    wereYouRight,
    surprises,
  };

  const fieldSetters = {
    prediction: setPrediction,
    attempt1Notes: setAttempt1Notes,
    attempt2Notes: setAttempt2Notes,
    attempt3Notes: setAttempt3Notes,
    wereYouRight: setWereYouRight,
    surprises: setSurprises,
  };

  const goBack = () => {
    Keyboard.dismiss();
    setSuccessMessage("");
    setSaveError("");
    setCurrentStep((step) => Math.max(step - 1, 0));
  };

  const goNext = () => {
    Keyboard.dismiss();
    setSuccessMessage("");
    setSaveError("");
    setCurrentStep((step) => Math.min(step + 1, steps.length - 1));
  };

  const saveActivity = () => {
    Keyboard.dismiss();
    setSuccessMessage("");
    setSaveError("");

    if (!prediction.trim()) {
      setSaveError("Add your prediction before saving.");
      return;
    }

    if (!reflection.trim()) {
      setSaveError("Add your reflection before saving.");
      return;
    }

    setSuccessMessage("Human Performance activity saved for demo.");
  };

  const renderInput = ({
    label,
    value,
    onChangeText,
    placeholder,
    multiline,
  }) => (
    <View style={styles.field}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.textArea]}
        value={value}
        onChangeText={(nextValue) => {
          onChangeText(nextValue);
          setSuccessMessage("");
          setSaveError("");
        }}
        placeholder={placeholder}
        placeholderTextColor="#8a9584"
        multiline={multiline}
        textAlignVertical={multiline ? "top" : "center"}
        returnKeyType={multiline ? "default" : "next"}
      />
    </View>
  );

  const renderOverview = () => (
    <View style={styles.card}>
      <Text style={styles.cardLabel}>Overview</Text>
      <Text style={styles.pageTitle}>Human Performance Lab</Text>
      <Text style={styles.categoryText}>Medical Science + Biomechanics</Text>
      <Text style={styles.cardText}>
        Students investigate how the human body moves by measuring speed,
        smoothness and coordination during controlled stretching activities.
      </Text>

      <View style={styles.focusGrid}>
        <View style={styles.focusPill}>
          <Text style={styles.focusText}>Speed</Text>
        </View>
        <View style={styles.focusPill}>
          <Text style={styles.focusText}>Smoothness</Text>
        </View>
        <View style={styles.focusPill}>
          <Text style={styles.focusText}>Coordination</Text>
        </View>
      </View>
    </View>
  );

  const renderEquipment = () => (
    <View style={styles.card}>
      <Text style={styles.cardLabel}>Equipment</Text>
      <Text style={styles.cardTitle}>What You Need</Text>
      <View style={styles.list}>
        {equipment.map((item) => (
          <View key={item} style={styles.listRow}>
            <View style={styles.dot} />
            <Text style={styles.listText}>{item}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  const renderInstructions = () => (
    <View style={styles.card}>
      <Text style={styles.cardLabel}>Instructions</Text>
      <Text style={styles.cardTitle}>Move Slowly and Safely</Text>
      <View style={styles.list}>
        {instructions.map((instruction, index) => (
          <View key={instruction} style={styles.instructionRow}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>{index + 1}</Text>
            </View>
            <Text style={styles.instructionText}>{instruction}</Text>
          </View>
        ))}
      </View>

      <View style={styles.safetyBox}>
        <Text style={styles.safetyTitle}>Safety Note</Text>
        {safetyNotes.map((note) => (
          <View key={note} style={styles.safetyRow}>
            <View style={styles.safetyDot} />
            <Text style={styles.safetyText}>{note}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  const renderMovementTest = () => (
    <View style={styles.card}>
      <Text style={styles.cardLabel}>Movement Test</Text>
      <Text style={styles.cardTitle}>Guided Stretch Sequence</Text>
      <Text style={styles.cardText}>
        Complete each movement gently and focus on control. Sensor tracking is
        intentionally left for the next development step.
      </Text>

      <View style={styles.movementList}>
        {movements.map((movement) => (
          <View key={movement.label} style={styles.movementCard}>
            <Text style={styles.movementLabel}>{movement.label}</Text>
            <Text style={styles.movementTitle}>{movement.title}</Text>
            <Text style={styles.movementDetail}>{movement.detail}</Text>
          </View>
        ))}
      </View>

      <View style={styles.placeholderBox}>
        <Text style={styles.placeholderTitle}>Coming Next</Text>
        <Text style={styles.placeholderText}>
          Movement tracking will be enabled in the next development step.
        </Text>
      </View>
    </View>
  );

  const renderResults = () => (
    <View style={styles.card}>
      <Text style={styles.cardLabel}>Results</Text>
      <Text style={styles.cardTitle}>Record Your Observations</Text>
      <Text style={styles.cardText}>
        Use team observations for now. Sensor values will be added later.
      </Text>
      <View style={styles.form}>
        {resultFields.map((field) =>
          renderInput({
            ...field,
            value: fieldValues[field.key],
            onChangeText: fieldSetters[field.key],
          }),
        )}
      </View>
    </View>
  );

  const renderReflection = () => (
    <View style={styles.card}>
      <Text style={styles.cardLabel}>Reflection & Save</Text>
      <Text style={styles.cardTitle}>Team Reflection</Text>
      <Text style={styles.cardText}>
        Explain what your team learned about speed, smoothness and coordination.
      </Text>
      <View style={styles.form}>
        {renderInput({
          label: "Reflection",
          value: reflection,
          onChangeText: setReflection,
          placeholder: "What changed as your team slowed down or improved control?",
          multiline: true,
        })}
      </View>

      {saveError ? <Text style={styles.errorText}>{saveError}</Text> : null}
      {successMessage ? (
        <Text style={styles.successText}>{successMessage}</Text>
      ) : null}

      <TouchableOpacity
        style={styles.saveButton}
        onPress={saveActivity}
        activeOpacity={0.86}
      >
        <Text style={styles.saveButtonText}>Save Activity</Text>
      </TouchableOpacity>
    </View>
  );

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return renderOverview();
      case 1:
        return renderEquipment();
      case 2:
        return renderInstructions();
      case 3:
        return renderMovementTest();
      case 4:
        return renderResults();
      case 5:
        return renderReflection();
      default:
        return renderOverview();
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <StatusBar style="dark" />
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={styles.screen}>
          <ScrollView
            contentContainerStyle={styles.container}
            showsVerticalScrollIndicator={false}
            keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
            keyboardShouldPersistTaps="handled"
          >
            <TopBar
              title="Human Performance Lab"
              eyebrow="Medical Science + Biomechanics"
            />

            <View style={styles.progressCard}>
              <Text style={styles.progressStep}>
                Step {currentStep + 1} of {steps.length}
              </Text>
              <Text style={styles.progressTitle}>{steps[currentStep]}</Text>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: progressPercent }]} />
              </View>
            </View>

            {renderStep()}

            <View style={styles.navRow}>
              {isFirstStep ? (
                <View style={styles.navSpacer} />
              ) : (
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={goBack}
                  activeOpacity={0.86}
                >
                  <Text style={styles.backButtonText}>Back</Text>
                </TouchableOpacity>
              )}

              {isLastStep ? (
                <View style={styles.navSpacer} />
              ) : (
                <TouchableOpacity
                  style={styles.nextButton}
                  onPress={goNext}
                  activeOpacity={0.86}
                >
                  <Text style={styles.nextButtonText}>Next</Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
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
    paddingBottom: 34,
  },
  progressCard: {
    backgroundColor: "#172218",
    borderRadius: 28,
    padding: 20,
    marginBottom: 16,
  },
  progressStep: {
    color: "#f0ff75",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  progressTitle: {
    color: "#ffffff",
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "900",
    marginTop: 6,
    marginBottom: 14,
  },
  progressTrack: {
    height: 10,
    backgroundColor: "#314333",
    borderRadius: 999,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#f0ff75",
    borderRadius: 999,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 28,
    padding: 22,
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
    marginBottom: 8,
    textTransform: "uppercase",
  },
  pageTitle: {
    color: "#172218",
    fontSize: 34,
    lineHeight: 40,
    fontWeight: "900",
    marginBottom: 8,
  },
  categoryText: {
    color: "#1565c0",
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "900",
    marginBottom: 14,
  },
  cardTitle: {
    color: "#172218",
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "900",
    marginBottom: 10,
  },
  cardText: {
    color: "#5f6f52",
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "700",
  },
  focusGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 18,
  },
  focusPill: {
    backgroundColor: "#e8f5e9",
    borderRadius: 999,
    paddingHorizontal: 13,
    paddingVertical: 9,
  },
  focusText: {
    color: "#244b2a",
    fontSize: 14,
    fontWeight: "900",
  },
  list: {
    gap: 12,
    marginTop: 10,
  },
  listRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fbf4",
    borderColor: "#dfe8d8",
    borderWidth: 1,
    borderRadius: 18,
    minHeight: 54,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: "#2e7d32",
    marginRight: 11,
  },
  listText: {
    flex: 1,
    color: "#172218",
    fontSize: 16,
    lineHeight: 23,
    fontWeight: "800",
  },
  instructionRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#f8fbf4",
    borderColor: "#dfe8d8",
    borderWidth: 1,
    borderRadius: 20,
    minHeight: 68,
    padding: 15,
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
  stepNumberText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "900",
  },
  instructionText: {
    flex: 1,
    color: "#172218",
    fontSize: 16,
    lineHeight: 23,
    fontWeight: "800",
  },
  safetyBox: {
    backgroundColor: "#fff8e1",
    borderColor: "#f6d365",
    borderWidth: 1,
    borderRadius: 22,
    padding: 16,
    marginTop: 18,
  },
  safetyTitle: {
    color: "#7a4f01",
    fontSize: 17,
    fontWeight: "900",
    marginBottom: 9,
  },
  safetyRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 6,
  },
  safetyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#f6a800",
    marginTop: 7,
    marginRight: 10,
  },
  safetyText: {
    flex: 1,
    color: "#7a4f01",
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "800",
  },
  movementList: {
    gap: 12,
    marginTop: 18,
  },
  movementCard: {
    backgroundColor: "#f8fbf4",
    borderColor: "#dfe8d8",
    borderWidth: 1,
    borderRadius: 22,
    padding: 16,
  },
  movementLabel: {
    color: "#2e7d32",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  movementTitle: {
    color: "#172218",
    fontSize: 19,
    lineHeight: 25,
    fontWeight: "900",
    marginTop: 5,
  },
  movementDetail: {
    color: "#5f6f52",
    fontSize: 14,
    lineHeight: 21,
    fontWeight: "700",
    marginTop: 6,
  },
  placeholderBox: {
    backgroundColor: "#edf6ff",
    borderColor: "#cfe7ff",
    borderWidth: 1,
    borderRadius: 22,
    padding: 18,
    marginTop: 18,
  },
  placeholderTitle: {
    color: "#17456b",
    fontSize: 17,
    fontWeight: "900",
    marginBottom: 6,
    textAlign: "center",
  },
  placeholderText: {
    color: "#17456b",
    fontSize: 16,
    lineHeight: 23,
    fontWeight: "900",
    textAlign: "center",
  },
  form: {
    gap: 16,
    marginTop: 18,
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
    backgroundColor: "#f8fbf4",
    borderColor: "#dfe8d8",
    borderRadius: 18,
    borderWidth: 1,
    color: "#172218",
    fontSize: 16,
    fontWeight: "700",
    minHeight: 56,
    paddingHorizontal: 15,
    paddingVertical: 14,
  },
  textArea: {
    lineHeight: 23,
    minHeight: 118,
  },
  successText: {
    backgroundColor: "#dcfce7",
    borderRadius: 16,
    color: "#166534",
    fontSize: 15,
    fontWeight: "900",
    lineHeight: 21,
    marginTop: 18,
    padding: 13,
  },
  errorText: {
    backgroundColor: "#ffe3df",
    borderRadius: 16,
    color: "#9f1d14",
    fontSize: 15,
    fontWeight: "900",
    lineHeight: 21,
    marginTop: 18,
    padding: 13,
  },
  saveButton: {
    alignItems: "center",
    backgroundColor: "#2e7d32",
    borderRadius: 20,
    justifyContent: "center",
    marginTop: 18,
    minHeight: 60,
    paddingHorizontal: 16,
  },
  saveButtonText: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "900",
    textAlign: "center",
  },
  navRow: {
    flexDirection: "row",
    gap: 12,
  },
  navSpacer: {
    flex: 1,
  },
  backButton: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: "#dfe8d8",
    borderRadius: 20,
    borderWidth: 1,
    flex: 1,
    justifyContent: "center",
    minHeight: 58,
  },
  backButtonText: {
    color: "#172218",
    fontSize: 16,
    fontWeight: "900",
  },
  nextButton: {
    alignItems: "center",
    backgroundColor: "#2e7d32",
    borderRadius: 20,
    flex: 1,
    justifyContent: "center",
    minHeight: 58,
    paddingHorizontal: 14,
  },
  nextButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "900",
    textAlign: "center",
  },
});
