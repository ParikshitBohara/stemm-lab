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
  "Tap Reaction",
  "Swap Hands",
  "Tracing Challenge",
  "Results & Reflection",
];

const equipment = [
  "Mobile phone with STEMM Lab app",
  "Flat desk or table",
  "Partner or timekeeper",
  "Paper reaction board template",
  "Pencil",
  "Timer",
];

const instructions = [
  "Place the phone or paper template flat on the table.",
  "Complete the tap reaction activity using your usual hand.",
  "Repeat the same task after swapping hands.",
  "Try the tracing challenge slowly and accurately.",
  "Compare speed, accuracy, and control across the three phases.",
  "Write a reflection about what helped or made the challenge harder.",
];

export default function ReactionBoardChallenge() {
  const [currentStep, setCurrentStep] = useState(0);
  const [tapReactionStatus, setTapReactionStatus] = useState("");
  const [swapHandsStatus, setSwapHandsStatus] = useState("");
  const [tracingStatus, setTracingStatus] = useState("");
  const [bestPhase, setBestPhase] = useState("");
  const [hardestPhase, setHardestPhase] = useState("");
  const [notes, setNotes] = useState("");
  const [reflection, setReflection] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;
  const progressPercent = `${((currentStep + 1) / steps.length) * 100}%`;

  const goBack = () => {
    Keyboard.dismiss();
    setCurrentStep((step) => Math.max(step - 1, 0));
  };

  const goNext = () => {
    Keyboard.dismiss();
    setSuccessMessage("");
    setCurrentStep((step) => Math.min(step + 1, steps.length - 1));
  };

  const saveActivity = () => {
    Keyboard.dismiss();
    setSuccessMessage("Reaction Board activity saved for demo.");
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
        placeholder={placeholder}
        placeholderTextColor="#8a9584"
        value={value}
        onChangeText={(nextValue) => {
          onChangeText(nextValue);
          setSuccessMessage("");
        }}
        multiline={multiline}
        textAlignVertical={multiline ? "top" : "center"}
        returnKeyType={multiline ? "default" : "next"}
      />
    </View>
  );

  const renderOverview = () => (
    <View style={styles.card}>
      <Text style={styles.cardLabel}>Overview</Text>
      <Text style={styles.pageTitle}>Reaction Board Challenge</Text>
      <Text style={styles.categoryText}>Neuroscience + Human Performance</Text>
      <Text style={styles.cardText}>
        Test how quickly your brain and body respond to a visual task. You will
        compare tapping, hand switching, and tracing to notice how attention,
        coordination, and control change between phases.
      </Text>
      <View style={styles.focusBox}>
        <Text style={styles.focusTitle}>Student Mission</Text>
        <Text style={styles.focusText}>
          Observe which phase feels fastest, which phase feels hardest, and what
          strategies help you stay accurate.
        </Text>
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
      <Text style={styles.cardTitle}>Run the Challenge</Text>
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
    </View>
  );

  const renderPhasePlaceholder = ({
    label,
    title,
    text,
    status,
    onPress,
  }) => (
    <View style={styles.card}>
      <Text style={styles.cardLabel}>{label}</Text>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardText}>{text}</Text>
      <View style={styles.placeholderBox}>
        <Text style={styles.placeholderText}>
          {status || "Interactive version coming in a later sprint."}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.secondaryAction}
        onPress={onPress}
        activeOpacity={0.86}
      >
        <Text style={styles.secondaryActionText}>Mark Demo Complete</Text>
      </TouchableOpacity>
    </View>
  );

  const renderResults = () => (
    <View style={styles.card}>
      <Text style={styles.cardLabel}>Results & Reflection</Text>
      <Text style={styles.cardTitle}>Compare Your Performance</Text>
      <Text style={styles.cardText}>
        Record what you noticed during each phase. This is local demo data only
        and will not be saved to a backend.
      </Text>

      <View style={styles.summaryGrid}>
        <View style={styles.summaryTile}>
          <Text style={styles.summaryLabel}>Tap Reaction</Text>
          <Text style={styles.summaryValue}>
            {tapReactionStatus ? "Complete" : "Not marked"}
          </Text>
        </View>
        <View style={styles.summaryTile}>
          <Text style={styles.summaryLabel}>Swap Hands</Text>
          <Text style={styles.summaryValue}>
            {swapHandsStatus ? "Complete" : "Not marked"}
          </Text>
        </View>
        <View style={styles.summaryTile}>
          <Text style={styles.summaryLabel}>Tracing</Text>
          <Text style={styles.summaryValue}>
            {tracingStatus ? "Complete" : "Not marked"}
          </Text>
        </View>
      </View>

      <View style={styles.form}>
        {renderInput({
          label: "Best phase",
          value: bestPhase,
          onChangeText: setBestPhase,
          placeholder: "Example: Tap reaction",
        })}
        {renderInput({
          label: "Hardest phase",
          value: hardestPhase,
          onChangeText: setHardestPhase,
          placeholder: "Example: Tracing challenge",
        })}
        {renderInput({
          label: "Notes",
          value: notes,
          onChangeText: setNotes,
          placeholder: "What did you notice about speed or accuracy?",
          multiline: true,
        })}
        {renderInput({
          label: "Reflection",
          value: reflection,
          onChangeText: setReflection,
          placeholder: "What would you try differently next time?",
          multiline: true,
        })}
      </View>

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
        return renderPhasePlaceholder({
          label: "Phase 1",
          title: "Tap Reaction Placeholder",
          text:
            "Later, this phase can become a timed tap board. For now, students can complete the task with a partner or paper template.",
          status: tapReactionStatus,
          onPress: () => setTapReactionStatus("Tap reaction completed for demo."),
        });
      case 4:
        return renderPhasePlaceholder({
          label: "Phase 2",
          title: "Swap Hands Placeholder",
          text:
            "Repeat the reaction task with the opposite hand and compare how control and speed feel different.",
          status: swapHandsStatus,
          onPress: () => setSwapHandsStatus("Swap hands completed for demo."),
        });
      case 5:
        return renderPhasePlaceholder({
          label: "Phase 3",
          title: "Tracing Challenge Placeholder",
          text:
            "Trace a path slowly and accurately. Later, this can become an interactive accuracy challenge.",
          status: tracingStatus,
          onPress: () => setTracingStatus("Tracing challenge completed for demo."),
        });
      case 6:
        return renderResults();
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
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View>
            <TopBar
              title="Reaction Board Challenge"
              eyebrow="Neuroscience + Human Performance"
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

              <TouchableOpacity
                style={[styles.nextButton, isLastStep && styles.doneButton]}
                onPress={isLastStep ? Keyboard.dismiss : goNext}
                activeOpacity={0.86}
              >
                <Text style={styles.nextButtonText}>
                  {isLastStep ? "Done" : "Next"}
                </Text>
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
  focusBox: {
    backgroundColor: "#f8fbf4",
    borderColor: "#dfe8d8",
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    marginTop: 18,
  },
  focusTitle: {
    color: "#172218",
    fontSize: 17,
    fontWeight: "900",
    marginBottom: 6,
  },
  focusText: {
    color: "#5f6f52",
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "700",
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
  placeholderBox: {
    backgroundColor: "#edf6ff",
    borderColor: "#cfe7ff",
    borderWidth: 1,
    borderRadius: 22,
    minHeight: 104,
    justifyContent: "center",
    padding: 18,
    marginTop: 18,
  },
  placeholderText: {
    color: "#17456b",
    fontSize: 16,
    lineHeight: 23,
    fontWeight: "900",
    textAlign: "center",
  },
  secondaryAction: {
    alignItems: "center",
    backgroundColor: "#f0ff75",
    borderRadius: 20,
    justifyContent: "center",
    minHeight: 56,
    marginTop: 16,
    paddingHorizontal: 16,
  },
  secondaryActionText: {
    color: "#172218",
    fontSize: 16,
    fontWeight: "900",
  },
  summaryGrid: {
    gap: 10,
    marginTop: 18,
  },
  summaryTile: {
    backgroundColor: "#f8fbf4",
    borderColor: "#dfe8d8",
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
  },
  summaryLabel: {
    color: "#5f6f52",
    fontSize: 13,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  summaryValue: {
    color: "#172218",
    fontSize: 16,
    fontWeight: "900",
    marginTop: 5,
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
  doneButton: {
    backgroundColor: "#1565c0",
  },
  nextButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "900",
    textAlign: "center",
  },
});
