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
  "Sound Meter",
  "Results",
  "Reflection",
];

const equipment = [
  "Mobile phone with STEMM Lab app",
  "Notebook or worksheet",
  "Pencil",
  "Quiet indoor area",
  "Busier outdoor or classroom area",
  "Teacher-approved observation spot",
];

const instructions = [
  "Choose two or three safe places to compare sound levels.",
  "Stand still and listen carefully for 30 seconds at each location.",
  "Describe the main sound sources you can hear.",
  "Record whether each place feels quiet, moderate, or loud.",
  "Compare the locations and decide where sound pollution is highest.",
  "Suggest one way to make the loudest area more comfortable.",
];

const soundLevelGuide = [
  { range: "0-30 dB", description: "quiet" },
  { range: "30-60 dB", description: "normal classroom" },
  { range: "60-85 dB", description: "busy traffic/vacuum" },
  {
    range: "85-90 dB",
    description: "hearing damage possible after long exposure",
  },
  {
    range: "90-100 dB",
    description: "hearing damage likely after short exposure",
  },
  { range: "100+ dB", description: "serious hearing risk" },
];

export default function SoundPollutionHunter() {
  const [currentStep, setCurrentStep] = useState(0);
  const [prediction, setPrediction] = useState("");
  const [actionTested, setActionTested] = useState("");
  const [location, setLocation] = useState("");
  const [estimatedDbResult, setEstimatedDbResult] = useState("");
  const [wasPredictionCorrect, setWasPredictionCorrect] = useState("");
  const [notes, setNotes] = useState("");
  const [reflection, setReflection] = useState("");
  const [earMuffsAnswer, setEarMuffsAnswer] = useState("");
  const [demoReading, setDemoReading] = useState("");

  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;
  const progressPercent = `${((currentStep + 1) / steps.length) * 100}%`;

  const goBack = () => {
    Keyboard.dismiss();
    setCurrentStep((step) => Math.max(step - 1, 0));
  };

  const goNext = () => {
    Keyboard.dismiss();
    setCurrentStep((step) => Math.min(step + 1, steps.length - 1));
  };

  const renderInput = ({
    label,
    value,
    onChangeText,
    placeholder,
    multiline,
    keyboardType,
  }) => (
    <View style={styles.field}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.textArea]}
        placeholder={placeholder}
        placeholderTextColor="#8a9584"
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType || "default"}
        multiline={multiline}
        textAlignVertical={multiline ? "top" : "center"}
        returnKeyType={multiline ? "default" : "next"}
      />
    </View>
  );

  const renderOverview = () => (
    <View style={styles.card}>
      <Text style={styles.cardLabel}>Overview</Text>
      <Text style={styles.pageTitle}>Sound Pollution Hunter</Text>
      <Text style={styles.categoryText}>Environment + Physics</Text>
      <Text style={styles.cardText}>
        Investigate how sound changes across different spaces. Students observe
        nearby sound sources, compare loudness, and think about how noisy places
        can affect comfort, focus, and wellbeing.
      </Text>
      <View style={styles.focusBox}>
        <Text style={styles.focusTitle}>Student Mission</Text>
        <Text style={styles.focusText}>
          Find the noisiest safe location, describe what is making the sound,
          and suggest one practical improvement.
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
      <Text style={styles.cardTitle}>Observe and Compare</Text>
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

  const renderSoundMeter = () => (
    <View style={styles.card}>
      <Text style={styles.cardLabel}>Sound Meter Placeholder</Text>
      <Text style={styles.cardTitle}>Microphone Coming Later</Text>
      <Text style={styles.cardText}>
        A live sound meter can be added in a later sprint. This prototype keeps
        the activity frontend-only and does not access the microphone.
      </Text>
      <View style={styles.meterBox}>
        <Text style={styles.meterValue}>{demoReading || "--"}</Text>
        <Text style={styles.meterLabel}>Demo reading</Text>
      </View>
      <TouchableOpacity
        style={styles.secondaryAction}
        onPress={() => setDemoReading("Moderate")}
        activeOpacity={0.86}
      >
        <Text style={styles.secondaryActionText}>Add Demo Reading</Text>
      </TouchableOpacity>

      <View style={styles.guideCard}>
        <Text style={styles.guideTitle}>Sound Level Guide</Text>
        {soundLevelGuide.map((item) => (
          <View key={item.range} style={styles.guideRow}>
            <Text style={styles.guideRange}>{item.range}</Text>
            <Text style={styles.guideText}>{item.description}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  const renderResults = () => (
    <View style={styles.card}>
      <Text style={styles.cardLabel}>Results Placeholder</Text>
      <Text style={styles.cardTitle}>Record Your Observations</Text>
      <Text style={styles.cardText}>
        In a later sprint, students can record measured decibel values here. For
        now, use local form fields to describe what was tested and what changed.
      </Text>
      <View style={styles.form}>
        {renderInput({
          label: "Prediction",
          value: prediction,
          onChangeText: setPrediction,
          placeholder: "Example: The hallway will be louder than the library.",
          multiline: true,
        })}
        {renderInput({
          label: "Action tested",
          value: actionTested,
          onChangeText: setActionTested,
          placeholder: "Example: Closing the door",
        })}
        {renderInput({
          label: "Location",
          value: location,
          onChangeText: setLocation,
          placeholder: "Example: Canteen entrance",
        })}
        {renderInput({
          label: "Estimated dB result",
          value: estimatedDbResult,
          onChangeText: setEstimatedDbResult,
          placeholder: "Example: 65",
          keyboardType: "decimal-pad",
        })}
        {renderInput({
          label: "Was prediction correct?",
          value: wasPredictionCorrect,
          onChangeText: setWasPredictionCorrect,
          placeholder: "Example: Yes, partly, or no",
        })}
        {renderInput({
          label: "Notes",
          value: notes,
          onChangeText: setNotes,
          placeholder: "What sound sources did you notice?",
          multiline: true,
        })}
      </View>
    </View>
  );

  const renderReflection = () => (
    <View style={styles.card}>
      <Text style={styles.cardLabel}>Reflection Placeholder</Text>
      <Text style={styles.cardTitle}>What Did You Notice?</Text>
      <Text style={styles.cardText}>
        Write a short reflection about the sound sources you found and how the
        loudest place could be improved.
      </Text>
      <View style={styles.form}>
        {renderInput({
          label: "Reflection",
          value: reflection,
          onChangeText: setReflection,
          placeholder: "Example: The loudest area was near...",
          multiline: true,
        })}
        {renderInput({
          label: "Ear muffs answer",
          value: earMuffsAnswer,
          onChangeText: setEarMuffsAnswer,
          placeholder: "Would ear muffs help? Explain your answer.",
          multiline: true,
        })}
      </View>
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
        return renderSoundMeter();
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
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View>
            <TopBar title="Sound Pollution Hunter" eyebrow="Environment + Physics" />

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
  meterBox: {
    backgroundColor: "#edf6ff",
    borderColor: "#cfe7ff",
    borderWidth: 1,
    borderRadius: 22,
    minHeight: 112,
    justifyContent: "center",
    alignItems: "center",
    padding: 18,
    marginTop: 18,
  },
  meterValue: {
    color: "#17456b",
    fontSize: 34,
    fontWeight: "900",
  },
  meterLabel: {
    color: "#42667f",
    fontSize: 14,
    fontWeight: "900",
    marginTop: 6,
    textTransform: "uppercase",
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
  guideCard: {
    backgroundColor: "#f8fbf4",
    borderColor: "#dfe8d8",
    borderWidth: 1,
    borderRadius: 22,
    padding: 16,
    marginTop: 18,
  },
  guideTitle: {
    color: "#172218",
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 10,
  },
  guideRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    borderTopColor: "#edf2e8",
    borderTopWidth: 1,
    gap: 12,
    minHeight: 44,
    paddingVertical: 10,
  },
  guideRange: {
    width: 88,
    color: "#1565c0",
    fontSize: 14,
    fontWeight: "900",
  },
  guideText: {
    flex: 1,
    color: "#172218",
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "800",
  },
  resultPreview: {
    backgroundColor: "#f8fbf4",
    borderColor: "#dfe8d8",
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    marginTop: 18,
    gap: 8,
  },
  previewTitle: {
    color: "#172218",
    fontSize: 17,
    fontWeight: "900",
  },
  previewText: {
    color: "#5f6f52",
    fontSize: 15,
    fontWeight: "800",
  },
  field: {
    gap: 9,
    marginTop: 18,
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
    minHeight: 128,
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
