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
import TrialVideoRecorder from "../../../components/activity/TrialVideoRecorder";
import { sendActivitySavedNotification } from "../../../utils/notifications";
import { saveActivityResult } from "../../../firebase/saveActivityResult";
const GRAVITY = 9.8;

const wizardSteps = [
  "Overview",
  "Equipment",
  "Instructions",
  "Video Evidence",
  "Experiment Results",
  "Physics Calculations",
  "Reflection & Save",
];

const equipment = [
  "Mobile phone with STEMM Lab app",
  "Small toy",
  "Table or elevated surface",
  "Paper or plastic",
  "String",
  "Scissors",
  "Tape",
];

const instructions = [
  "Drop the toy without a parachute and record the baseline.",
  "Build a parachute using the materials.",
  "Drop the toy from the same height.",
  "Review speed and landing accuracy.",
  "Redesign and test up to three prototypes.",
  "Save results and reflection.",
];

const physicsConcepts = ["Gravity", "Drag", "Net Force", "G-Force"];

const videoTrialSlots = [
  { id: "baseline", label: "Baseline Drop - No Parachute" },
  { id: "prototype1", label: "Prototype 1" },
  { id: "prototype2", label: "Prototype 2" },
  { id: "prototype3", label: "Prototype 3" },
];

const experimentInputs = [
  {
    label: "Prediction",
    placeholder: "What do you think will happen?",
    key: "prediction",
    multiline: true,
  },
  {
    label: "Drop height in metres",
    placeholder: "Example: 2",
    key: "dropHeight",
    keyboardType: "decimal-pad",
    numeric: true,
  },
  {
    label: "Toy mass in kilograms",
    placeholder: "Example: 0.15",
    key: "toyMass",
    keyboardType: "decimal-pad",
    numeric: true,
  },
  {
    label: "Baseline time in seconds",
    placeholder: "Example: 1.8",
    key: "baselineTime",
    keyboardType: "decimal-pad",
    numeric: true,
  },
  {
    label: "Prototype 1 time",
    placeholder: "Example: 2.1",
    key: "prototype1Time",
    keyboardType: "decimal-pad",
    numeric: true,
  },
  {
    label: "Prototype 2 time",
    placeholder: "Example: 2.4",
    key: "prototype2Time",
    keyboardType: "decimal-pad",
    numeric: true,
  },
  {
    label: "Prototype 3 time",
    placeholder: "Example: 2.6",
    key: "prototype3Time",
    keyboardType: "decimal-pad",
    numeric: true,
  },
  {
    label: "Landing notes",
    placeholder: "Did the toy land safely, tip over, or bounce?",
    key: "landingNotes",
    multiline: true,
  },
];

const trialInputs = [
  { key: "baselineTime", label: "Baseline" },
  { key: "prototype1Time", label: "Prototype 1" },
  { key: "prototype2Time", label: "Prototype 2" },
  { key: "prototype3Time", label: "Prototype 3" },
];

const parsePositiveNumber = (value) => {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return { status: "empty", value: null };
  }

  const numberValue = Number(trimmedValue.replace(",", "."));

  if (!Number.isFinite(numberValue) || numberValue <= 0) {
    return { status: "invalid", value: null };
  }

  return { status: "valid", value: numberValue };
};

const formatNumber = (value, unit = "") => {
  const roundedValue = Number.parseFloat(value.toFixed(2));
  return `${roundedValue}${unit}`;
};

export default function ParachuteChallenge() {
  const [currentStep, setCurrentStep] = useState(0);
  const [prediction, setPrediction] = useState("");
  const [dropHeight, setDropHeight] = useState("");
  const [toyMass, setToyMass] = useState("");
  const [baselineTime, setBaselineTime] = useState("");
  const [prototype1Time, setPrototype1Time] = useState("");
  const [prototype2Time, setPrototype2Time] = useState("");
  const [prototype3Time, setPrototype3Time] = useState("");
  const [contactTime, setContactTime] = useState("");
  const [landingNotes, setLandingNotes] = useState("");
  const [reflection, setReflection] = useState("");
  const [trialVideos, setTrialVideos] = useState({});
  const [successMessage, setSuccessMessage] = useState("");

  const fieldValues = {
    prediction,
    dropHeight,
    toyMass,
    baselineTime,
    prototype1Time,
    prototype2Time,
    prototype3Time,
    landingNotes,
  };

  const fieldSetters = {
    prediction: setPrediction,
    dropHeight: setDropHeight,
    toyMass: setToyMass,
    baselineTime: setBaselineTime,
    prototype1Time: setPrototype1Time,
    prototype2Time: setPrototype2Time,
    prototype3Time: setPrototype3Time,
    landingNotes: setLandingNotes,
  };

  const numericValues = {
    dropHeight: parsePositiveNumber(dropHeight),
    toyMass: parsePositiveNumber(toyMass),
    baselineTime: parsePositiveNumber(baselineTime),
    prototype1Time: parsePositiveNumber(prototype1Time),
    prototype2Time: parsePositiveNumber(prototype2Time),
    prototype3Time: parsePositiveNumber(prototype3Time),
    contactTime: parsePositiveNumber(contactTime),
  };

  const hasBaseValues =
    numericValues.dropHeight.status === "valid" &&
    numericValues.toyMass.status === "valid";
  const hasInvalidBaseValue =
    numericValues.dropHeight.status === "invalid" ||
    numericValues.toyMass.status === "invalid";
  const hasInvalidTime = trialInputs.some(
    (trial) => numericValues[trial.key].status === "invalid",
  );
  const hasInvalidContactTime = numericValues.contactTime.status === "invalid";
  const validContactTime =
    numericValues.contactTime.status === "valid"
      ? numericValues.contactTime.value
      : null;

  const trialResults = hasBaseValues
    ? trialInputs
        .filter((trial) => numericValues[trial.key].status === "valid")
        .map((trial) => {
          const dropTime = numericValues[trial.key].value;
          const finalVelocity = numericValues.dropHeight.value / dropTime;
          const acceleration = finalVelocity / dropTime;
          const netForce = numericValues.toyMass.value * acceleration;
          const weight = numericValues.toyMass.value * GRAVITY;
          const dragForce = weight - netForce;
          const gForce =
            validContactTime === null
              ? null
              : finalVelocity / validContactTime / GRAVITY;

          return {
            ...trial,
            finalVelocity,
            acceleration,
            netForce,
            weight,
            dragForce,
            gForce,
          };
        })
    : [];

  const progressPercent = `${((currentStep + 1) / wizardSteps.length) * 100}%`;
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === wizardSteps.length - 1;
  const videosRecorded = videoTrialSlots.filter(
    (trial) => trialVideos[trial.id],
  ).length;

  const goBack = () => {
    Keyboard.dismiss();
    setCurrentStep((step) => Math.max(step - 1, 0));
  };

  const goNext = () => {
    Keyboard.dismiss();
    setSuccessMessage("");
    setCurrentStep((step) => Math.min(step + 1, wizardSteps.length - 1));
  };

  const handleTrialVideoChange = (trialId, uri) => {
    setTrialVideos((videos) => ({
      ...videos,
      [trialId]: uri,
    }));
    setSuccessMessage("");
  };

  
  const handleSaveExperiment = async () => {
    Keyboard.dismiss();

    try {
        await saveActivityResult({
          teamId: "demo-team",
          teamName: "Gravity Squad",
          activityName: "Parachute Drop Challenge",

          resultData: {
            prediction,
            dropHeight,
            toyMass,
            baselineTime,
            prototype1Time,
            prototype2Time,
            prototype3Time,
            landingNotes,
            contactTime,
            videoCaptured: videosRecorded > 0,
            videosRecorded,
            videoEvidence: videoTrialSlots.map((trial) => ({
              trial: trial.label,
              recorded: !!trialVideos[trial.id],
            })),
      },

      reflection,
      score: trialResults.length,
    });

    setSuccessMessage("Experiment successfully saved to Firestore.");

    sendActivitySavedNotification({
      title: "STEMM Lab: Activity saved",
      body: "Your parachute activity result was saved.",
    }).catch(() => undefined);
  } catch (error) {
    console.log("Error saving experiment:", error);
    setSuccessMessage("Failed to save experiment.");
  }
};
  const renderInput = ({
    label,
    value,
    onChangeText,
    placeholder,
    multiline,
    keyboardType,
    numeric,
  }) => {
    const isInvalid =
      numeric &&
      value.trim() &&
      parsePositiveNumber(value).status === "invalid";

    return (
      <View style={styles.field} key={label}>
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
          keyboardType={keyboardType || "default"}
          multiline={multiline}
          textAlignVertical={multiline ? "top" : "center"}
          returnKeyType={multiline ? "default" : "next"}
        />
        {isInvalid ? (
          <Text style={styles.validationText}>Enter a positive number.</Text>
        ) : null}
      </View>
    );
  };

  const renderOverviewStep = () => (
    <View style={styles.stepCard}>
      <Text style={styles.cardLabel}>Overview</Text>
      <Text style={styles.pageTitle}>Parachute Drop Challenge</Text>
      <Text style={styles.categoryText}>Engineering + Physics</Text>
      <Text style={styles.cardText}>
        Build and test a parachute that slows a small toy as it falls and helps it
        land safely. You will compare a baseline drop with improved prototypes,
        then use simple physics to explain what changed.
      </Text>

      <View style={styles.conceptGrid}>
        {physicsConcepts.map((concept) => (
          <View key={concept} style={styles.conceptPill}>
            <Text style={styles.conceptText}>{concept}</Text>
          </View>
        ))}
      </View>

      <View style={styles.focusBox}>
        <Text style={styles.focusTitle}>Student Focus</Text>
        <Text style={styles.focusText}>
          Upper primary students can focus on fair tests and observations.
          Lower high school students can connect results to force, drag, and
          acceleration.
        </Text>
      </View>
    </View>
  );

  const renderEquipmentStep = () => (
    <View style={styles.stepCard}>
      <Text style={styles.cardLabel}>Equipment</Text>
      <Text style={styles.cardTitle}>Gather Your Materials</Text>
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

  const renderInstructionsStep = () => (
    <View style={styles.stepCard}>
      <Text style={styles.cardLabel}>Instructions</Text>
      <Text style={styles.cardTitle}>Build, Test, Improve</Text>
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

  const renderVideoStep = () => (
    <View style={styles.stepCard}>
      <Text style={styles.cardLabel}>Video Evidence</Text>
      <Text style={styles.cardTitle}>Record Each Drop</Text>
      <Text style={styles.cardText}>
        Record local video evidence for the baseline drop and each prototype.
        These videos stay on this device and are not uploaded to Firestore.
      </Text>
      <TrialVideoRecorder
        trialSlots={videoTrialSlots}
        videos={trialVideos}
        onVideoChange={handleTrialVideoChange}
      />
    </View>
  );

  const renderExperimentStep = () => (
    <View style={styles.stepCard}>
      <Text style={styles.cardLabel}>Experiment Results</Text>
      <Text style={styles.cardTitle}>Record Your Test Data</Text>
      <Text style={styles.cardText}>
        Keep each measurement in the same units so your comparison is fair.
      </Text>
      <View style={styles.form}>
        {experimentInputs.map((field) =>
          renderInput({
            ...field,
            value: fieldValues[field.key],
            onChangeText: fieldSetters[field.key],
          }),
        )}
      </View>
    </View>
  );

  const renderPhysicsStep = () => {
    const showMissingMessage = trialResults.length === 0;
    const calculationMessage =
      hasInvalidBaseValue || hasInvalidTime || hasInvalidContactTime
        ? "Use positive numbers for physics calculations."
        : "Enter drop height, mass, and time to calculate results.";

    return (
      <View style={styles.stepCard}>
        <Text style={styles.cardLabel}>Physics Calculations</Text>
        <Text style={styles.cardTitle}>Explain the Drop</Text>
        <Text style={styles.cardText}>
          These results update locally from your measurements. Contact time is
          only needed for g-force.
        </Text>

        <View style={styles.form}>
          {renderInput({
            label: "Contact time after landing in seconds",
            placeholder: "Example: 0.3",
            value: contactTime,
            onChangeText: setContactTime,
            keyboardType: "decimal-pad",
            numeric: true,
          })}
        </View>

        {showMissingMessage ? (
          <View style={styles.emptyResults}>
            <Text style={styles.emptyResultsText}>{calculationMessage}</Text>
          </View>
        ) : (
          <View style={styles.resultsList}>
            {trialResults.map((result) => (
              <View key={result.key} style={styles.resultCard}>
                <View style={styles.resultHeader}>
                  <Text style={styles.resultTitle}>{result.label}</Text>
                  <Text style={styles.resultBadge}>Local</Text>
                </View>
                <View style={styles.resultRow}>
                  <Text style={styles.resultName}>Final velocity</Text>
                  <Text style={styles.resultValue}>
                    {formatNumber(result.finalVelocity, " m/s")}
                  </Text>
                </View>
                <View style={styles.resultRow}>
                  <Text style={styles.resultName}>Acceleration</Text>
                  <Text style={styles.resultValue}>
                    {formatNumber(result.acceleration, " m/s2")}
                  </Text>
                </View>
                <View style={styles.resultRow}>
                  <Text style={styles.resultName}>Net force</Text>
                  <Text style={styles.resultValue}>
                    {formatNumber(result.netForce, " N")}
                  </Text>
                </View>
                <View style={styles.resultRow}>
                  <Text style={styles.resultName}>Weight</Text>
                  <Text style={styles.resultValue}>
                    {formatNumber(result.weight, " N")}
                  </Text>
                </View>
                <View style={styles.resultRow}>
                  <Text style={styles.resultName}>Drag force</Text>
                  <Text style={styles.resultValue}>
                    {formatNumber(result.dragForce, " N")}
                  </Text>
                </View>
                <View style={styles.resultRow}>
                  <Text style={styles.resultName}>G-force</Text>
                  <Text style={styles.resultValue}>
                    {hasInvalidContactTime
                      ? "Enter valid contact time"
                      : result.gForce === null
                        ? "Add contact time"
                        : formatNumber(result.gForce, " g")}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderReflectionStep = () => (
    <View style={styles.stepCard}>
      <Text style={styles.cardLabel}>Reflection & Save</Text>
      <Text style={styles.cardTitle}>What Did You Learn?</Text>
      <Text style={styles.cardText}>
        Explain which parachute worked best and what you would change next.
      </Text>
      <View style={styles.form}>
        {renderInput({
          label: "Reflection",
          placeholder: "Write your final reflection here.",
          value: reflection,
          onChangeText: setReflection,
          multiline: true,
        })}
      </View>
      {successMessage ? (
        <Text style={styles.success}>{successMessage}</Text>
      ) : null}
    </View>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return renderOverviewStep();
      case 1:
        return renderEquipmentStep();
      case 2:
        return renderInstructionsStep();
      case 3:
        return renderVideoStep();
      case 4:
        return renderExperimentStep();
      case 5:
        return renderPhysicsStep();
      case 6:
        return renderReflectionStep();
      default:
        return renderOverviewStep();
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
              title="Parachute Drop Challenge"
              eyebrow="Engineering + Physics"
            />

            <View style={styles.progressCard}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressStep}>
                  Step {currentStep + 1} of {wizardSteps.length}
                </Text>
                <Text style={styles.progressTitle}>
                  {wizardSteps[currentStep]}
                </Text>
              </View>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: progressPercent }]} />
              </View>
            </View>

            {renderStepContent()}

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
                <TouchableOpacity
                  style={styles.nextButton}
                  onPress={handleSaveExperiment}
                  activeOpacity={0.86}
                >
                  <Text style={styles.nextButtonText}>Save Experiment</Text>
                </TouchableOpacity>
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
  progressHeader: {
    marginBottom: 14,
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
  stepCard: {
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
  conceptGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 18,
  },
  conceptPill: {
    backgroundColor: "#e8f5e9",
    borderRadius: 999,
    paddingHorizontal: 13,
    paddingVertical: 9,
  },
  conceptText: {
    color: "#244b2a",
    fontSize: 14,
    fontWeight: "900",
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
  videoBox: {
    backgroundColor: "#edf6ff",
    borderColor: "#cfe7ff",
    borderWidth: 1,
    borderRadius: 22,
    minHeight: 92,
    justifyContent: "center",
    padding: 18,
    marginTop: 18,
  },
  videoStatus: {
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
  validationText: {
    color: "#9f1d14",
    fontSize: 13,
    fontWeight: "800",
  },
  emptyResults: {
    backgroundColor: "#fff8e1",
    borderColor: "#f6d365",
    borderRadius: 18,
    borderWidth: 1,
    marginTop: 18,
    padding: 15,
  },
  emptyResultsText: {
    color: "#7a4f01",
    fontSize: 15,
    fontWeight: "900",
    lineHeight: 21,
  },
  resultsList: {
    gap: 12,
    marginTop: 18,
  },
  resultCard: {
    backgroundColor: "#fbfdf7",
    borderColor: "#dfe8d8",
    borderRadius: 22,
    borderWidth: 1,
    padding: 16,
  },
  resultHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 10,
  },
  resultTitle: {
    flex: 1,
    color: "#172218",
    fontSize: 18,
    fontWeight: "900",
  },
  resultBadge: {
    backgroundColor: "#e8f5e9",
    borderRadius: 999,
    color: "#166534",
    fontSize: 12,
    fontWeight: "900",
    overflow: "hidden",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopColor: "#edf2e8",
    borderTopWidth: 1,
    gap: 12,
    minHeight: 44,
    paddingVertical: 10,
  },
  resultName: {
    flex: 1,
    color: "#5f6f52",
    fontSize: 14,
    fontWeight: "800",
  },
  resultValue: {
    flex: 1,
    color: "#172218",
    fontSize: 14,
    fontWeight: "900",
    textAlign: "right",
  },
  success: {
    backgroundColor: "#dcfce7",
    borderRadius: 16,
    color: "#166534",
    fontSize: 15,
    fontWeight: "900",
    marginTop: 18,
    padding: 13,
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
