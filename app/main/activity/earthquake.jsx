import { useEffect, useRef, useState } from "react";
import {
  Accelerometer,
} from "expo-sensors";
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
  Vibration,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import TopBar from "../../../components/TopBar";

const steps = [
  "Overview",
  "Equipment",
  "Instructions",
  "Vibration Test",
  "Results",
  "Reflection & Save",
];

const equipment = [
  "Cardboard",
  "Paper",
  "Scissors",
  "Sticky tape",
  "Plastic/paper cups",
  "Mobile phone with vibration/motion sensor",
];

const instructions = [
  "Build an anti-vibration layer by folding paper/cardboard.",
  "Place a flat cardboard platform on top.",
  "Place the phone in the centre.",
  "Activate vibration mode in the STEMM app.",
  "Modify the structure to reduce movement.",
];

const EARTHQUAKE_TEST_SECONDS = 10;
const EARTHQUAKE_VIBRATION_PATTERN = [0, 250, 120, 420, 140, 300];
const SENSOR_UPDATE_MS = 120;

const designOptions = [
  { key: "design1Outcome", label: "Design 1" },
  { key: "design2Outcome", label: "Design 2" },
  { key: "design3Outcome", label: "Design 3" },
];

const resultFields = [
  {
    label: "Prediction: which design will move the least?",
    placeholder: "Example: I think Design 2 will move the least.",
    key: "prediction",
    multiline: true,
  },
  {
    label: "Design 1 notes",
    placeholder: "Describe the materials and shape.",
    key: "design1Notes",
    multiline: true,
  },
  {
    label: "Design 1 movement outcome",
    placeholder: "Example: moved a lot, tipped over, stayed stable.",
    key: "design1Outcome",
    multiline: true,
  },
  {
    label: "Design 2 notes",
    placeholder: "Describe what changed in the second design.",
    key: "design2Notes",
    multiline: true,
  },
  {
    label: "Design 2 movement outcome",
    placeholder: "Record what happened during the test.",
    key: "design2Outcome",
    multiline: true,
  },
  {
    label: "Design 3 notes",
    placeholder: "Describe your final improvement.",
    key: "design3Notes",
    multiline: true,
  },
  {
    label: "Design 3 movement outcome",
    placeholder: "Record what happened during the final test.",
    key: "design3Outcome",
    multiline: true,
  },
  {
    label: "Were you right?",
    placeholder: "Compare your prediction with the results.",
    key: "wereYouRight",
    multiline: true,
  },
  {
    label: "Any surprises?",
    placeholder: "What happened that you did not expect?",
    key: "surprises",
    multiline: true,
  },
];

export default function EarthquakeResistantStructure() {
  const [currentStep, setCurrentStep] = useState(0);
  const [prediction, setPrediction] = useState("");
  const [design1Notes, setDesign1Notes] = useState("");
  const [design1Outcome, setDesign1Outcome] = useState("");
  const [design2Notes, setDesign2Notes] = useState("");
  const [design2Outcome, setDesign2Outcome] = useState("");
  const [design3Notes, setDesign3Notes] = useState("");
  const [design3Outcome, setDesign3Outcome] = useState("");
  const [wereYouRight, setWereYouRight] = useState("");
  const [surprises, setSurprises] = useState("");
  const [reflection, setReflection] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isTesting, setIsTesting] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const [testMessage, setTestMessage] = useState("");
  const [activeDesignKey, setActiveDesignKey] = useState("design1Outcome");
  const [currentMovement, setCurrentMovement] = useState(null);
  const [maxMovement, setMaxMovement] = useState(null);
  const [averageMovement, setAverageMovement] = useState(null);
  const [tiltAngle, setTiltAngle] = useState(null);
  const testIntervalRef = useRef(null);
  const testTimeoutRef = useRef(null);
  const accelerometerSubscriptionRef = useRef(null);
  const movementSamplesRef = useRef([]);
  const movementTotalRef = useRef(0);
  const maxMovementRef = useRef(0);
  const latestMovementRef = useRef({
    current: null,
    max: null,
    average: null,
    tilt: null,
  });

  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;
  const progressPercent = `${((currentStep + 1) / steps.length) * 100}%`;

  const fieldValues = {
    prediction,
    design1Notes,
    design1Outcome,
    design2Notes,
    design2Outcome,
    design3Notes,
    design3Outcome,
    wereYouRight,
    surprises,
  };

  const fieldSetters = {
    prediction: setPrediction,
    design1Notes: setDesign1Notes,
    design1Outcome: setDesign1Outcome,
    design2Notes: setDesign2Notes,
    design2Outcome: setDesign2Outcome,
    design3Notes: setDesign3Notes,
    design3Outcome: setDesign3Outcome,
    wereYouRight: setWereYouRight,
    surprises: setSurprises,
  };

  useEffect(() => {
    return () => {
      if (testIntervalRef.current) {
        clearInterval(testIntervalRef.current);
      }

      if (testTimeoutRef.current) {
        clearTimeout(testTimeoutRef.current);
      }

      if (accelerometerSubscriptionRef.current) {
        accelerometerSubscriptionRef.current.remove();
      }

      Vibration.cancel();
    };
  }, []);

  const clearTestTimers = () => {
    if (testIntervalRef.current) {
      clearInterval(testIntervalRef.current);
      testIntervalRef.current = null;
    }

    if (testTimeoutRef.current) {
      clearTimeout(testTimeoutRef.current);
      testTimeoutRef.current = null;
    }
  };

  const stopAccelerometer = () => {
    if (accelerometerSubscriptionRef.current) {
      accelerometerSubscriptionRef.current.remove();
      accelerometerSubscriptionRef.current = null;
    }
  };

  const resetMovementStats = () => {
    movementSamplesRef.current = [];
    movementTotalRef.current = 0;
    maxMovementRef.current = 0;
    latestMovementRef.current = {
      current: null,
      max: null,
      average: null,
      tilt: null,
    };
    setCurrentMovement(null);
    setMaxMovement(null);
    setAverageMovement(null);
    setTiltAngle(null);
  };

  const formatMovement = (value) =>
    value === null ? "--" : value.toFixed(2);

  const formatTilt = (value) =>
    value === null ? "--" : `${value.toFixed(1)}°`;

  const saveMovementToActiveDesign = (statusLabel) => {
    const latestResult = latestMovementRef.current;

    if (latestResult.average === null) {
      return;
    }

    const savedText = `${statusLabel}: current ${formatMovement(
      latestResult.current,
    )}, max ${formatMovement(latestResult.max)}, average ${formatMovement(
      latestResult.average,
    )}, tilt ${formatTilt(latestResult.tilt)}. Classroom estimate from phone sensor data.`;

    fieldSetters[activeDesignKey](savedText);
  };

  const handleAccelerometerUpdate = ({ x, y, z }) => {
    const movementMagnitude = Math.sqrt(x * x + y * y + z * z);
    const tilt = Math.atan2(x, Math.sqrt(y * y + z * z)) * (180 / Math.PI);
    const nextSamples = [
      ...movementSamplesRef.current,
      { x, y, z, movementMagnitude, tilt },
    ];
    const nextTotal = movementTotalRef.current + movementMagnitude;
    const nextMax = Math.max(maxMovementRef.current, movementMagnitude);
    const nextAverage = nextTotal / nextSamples.length;

    movementSamplesRef.current = nextSamples;
    movementTotalRef.current = nextTotal;
    maxMovementRef.current = nextMax;
    latestMovementRef.current = {
      current: movementMagnitude,
      max: nextMax,
      average: nextAverage,
      tilt,
    };

    setCurrentMovement(movementMagnitude);
    setMaxMovement(nextMax);
    setAverageMovement(nextAverage);
    setTiltAngle(tilt);
  };

  const completeEarthquakeTest = () => {
    clearTestTimers();
    stopAccelerometer();
    Vibration.cancel();
    setIsTesting(false);
    setSecondsRemaining(0);
    setTestMessage("Test complete");
    saveMovementToActiveDesign("Test complete");
  };

  const startEarthquakeTest = async () => {
    Keyboard.dismiss();
    clearTestTimers();
    stopAccelerometer();
    Vibration.cancel();
    resetMovementStats();
    setTestMessage("");

    try {
      const isAvailable = await Accelerometer.isAvailableAsync();

      if (!isAvailable) {
        setTestMessage("Accelerometer is not available on this device.");
        return;
      }

      const permission = await Accelerometer.requestPermissionsAsync();

      if (!permission.granted) {
        setTestMessage("Motion sensor permission was not granted.");
        return;
      }

      Accelerometer.setUpdateInterval(SENSOR_UPDATE_MS);
      accelerometerSubscriptionRef.current = Accelerometer.addListener(
        handleAccelerometerUpdate,
      );

      Vibration.vibrate(EARTHQUAKE_VIBRATION_PATTERN, true);
      setIsTesting(true);
      setSecondsRemaining(EARTHQUAKE_TEST_SECONDS);
      setTestMessage("Earthquake simulation running");

      testIntervalRef.current = setInterval(() => {
        setSecondsRemaining((remaining) => Math.max(remaining - 1, 0));
      }, 1000);

      testTimeoutRef.current = setTimeout(() => {
        completeEarthquakeTest();
      }, EARTHQUAKE_TEST_SECONDS * 1000);
    } catch (_error) {
      stopAccelerometer();
      Vibration.cancel();
      setIsTesting(false);
      setSecondsRemaining(0);
      setTestMessage("Unable to start the movement sensor test.");
    }
  };

  const stopEarthquakeTest = () => {
    Keyboard.dismiss();
    clearTestTimers();
    stopAccelerometer();
    Vibration.cancel();
    setIsTesting(false);
    setSecondsRemaining(0);
    setTestMessage("Test stopped");
    saveMovementToActiveDesign("Test stopped");
  };

  const goBack = () => {
    Keyboard.dismiss();
    clearTestTimers();
    stopAccelerometer();
    Vibration.cancel();
    setIsTesting(false);
    setSecondsRemaining(0);
    setTestMessage("");
    setCurrentStep((step) => Math.max(step - 1, 0));
  };

  const goNext = () => {
    Keyboard.dismiss();
    clearTestTimers();
    stopAccelerometer();
    Vibration.cancel();
    setIsTesting(false);
    setSecondsRemaining(0);
    setTestMessage("");
    setSuccessMessage("");
    setCurrentStep((step) => Math.min(step + 1, steps.length - 1));
  };

  const saveActivity = () => {
    Keyboard.dismiss();
    setSuccessMessage("Earthquake activity saved for demo.");
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
        onChangeText={(text) => {
          onChangeText(text);
          setSuccessMessage("");
        }}
        placeholder={placeholder}
        placeholderTextColor="#8b9784"
        multiline={multiline}
        textAlignVertical={multiline ? "top" : "center"}
      />
    </View>
  );

  const renderOverview = () => (
    <View style={styles.card}>
      <Text style={styles.badge}>Engineering + Earth Science</Text>
      <Text style={styles.pageTitle}>Earthquake-Resistant Structure</Text>
      <Text style={styles.bodyText}>
        Students design structures that withstand vibration, simulating
        earthquakes.
      </Text>
      <View style={styles.focusRow}>
        <View style={styles.focusPill}>
          <Text style={styles.focusLabel}>Design</Text>
        </View>
        <View style={styles.focusPill}>
          <Text style={styles.focusLabel}>Test</Text>
        </View>
        <View style={styles.focusPill}>
          <Text style={styles.focusLabel}>Improve</Text>
        </View>
      </View>
    </View>
  );

  const renderEquipment = () => (
    <View style={styles.card}>
      <Text style={styles.sectionKicker}>Materials</Text>
      <Text style={styles.sectionTitle}>Equipment</Text>
      {equipment.map((item) => (
        <View style={styles.listRow} key={item}>
          <View style={styles.dot} />
          <Text style={styles.listText}>{item}</Text>
        </View>
      ))}
    </View>
  );

  const renderInstructions = () => (
    <View style={styles.card}>
      <Text style={styles.sectionKicker}>Build and test</Text>
      <Text style={styles.sectionTitle}>Instructions</Text>
      {instructions.map((item, index) => (
        <View style={styles.instructionRow} key={item}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>{index + 1}</Text>
          </View>
          <Text style={styles.instructionText}>{item}</Text>
        </View>
      ))}
    </View>
  );

  const renderVibrationTest = () => (
    <View style={styles.card}>
      <Text style={styles.sectionKicker}>Device demo</Text>
      <Text style={styles.sectionTitle}>Vibration Test</Text>
      <Text style={styles.bodyText}>
        Start a 10-second vibration pattern to simulate shaking. Watch how your
        structure moves, then record your observations on the Results step.
      </Text>
      <Text style={styles.sensorNote}>
        This is a classroom estimate using phone sensor data, not a laboratory
        measurement.
      </Text>
      <View style={styles.designSelector}>
        <Text style={styles.selectorLabel}>Save result to</Text>
        <View style={styles.designButtonRow}>
          {designOptions.map((design) => (
            <TouchableOpacity
              key={design.key}
              style={[
                styles.designButton,
                activeDesignKey === design.key && styles.designButtonActive,
              ]}
              onPress={() => setActiveDesignKey(design.key)}
              disabled={isTesting}
            >
              <Text
                style={[
                  styles.designButtonText,
                  activeDesignKey === design.key &&
                    styles.designButtonTextActive,
                ]}
              >
                {design.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      <View style={styles.placeholderBox}>
        <Text style={styles.placeholderIcon}>~</Text>
        <Text style={styles.placeholderTitle}>
          {isTesting ? `${secondsRemaining}s remaining` : "Ready to test"}
        </Text>
        <Text style={styles.placeholderText}>
          {testMessage ||
            "This demo uses phone vibration and accelerometer readings only. No storage or backend logic is active."}
        </Text>
      </View>
      <View style={styles.metricGrid}>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Live movement score</Text>
          <Text style={styles.metricValue}>{formatMovement(currentMovement)}</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Max movement</Text>
          <Text style={styles.metricValue}>{formatMovement(maxMovement)}</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Average movement</Text>
          <Text style={styles.metricValue}>
            {formatMovement(averageMovement)}
          </Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Approx. tilt angle</Text>
          <Text style={styles.metricValue}>{formatTilt(tiltAngle)}</Text>
        </View>
      </View>
      <View style={styles.testButtonRow}>
        <TouchableOpacity
          style={[
            styles.testButton,
            isTesting && styles.testButtonDisabled,
          ]}
          onPress={startEarthquakeTest}
          disabled={isTesting}
        >
          <Text style={styles.testButtonText}>Start Earthquake Test</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.stopButton,
            !isTesting && styles.testButtonDisabled,
          ]}
          onPress={stopEarthquakeTest}
          disabled={!isTesting}
        >
          <Text style={styles.stopButtonText}>Stop Test</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderResults = () => (
    <View style={styles.card}>
      <Text style={styles.sectionKicker}>Observations</Text>
      <Text style={styles.sectionTitle}>Results</Text>
      <Text style={styles.bodyText}>
        Compare each structure design. Focus on movement, stability, and how
        each redesign changed the result.
      </Text>
      {resultFields.map((field) =>
        renderInput({
          ...field,
          value: fieldValues[field.key],
          onChangeText: fieldSetters[field.key],
        }),
      )}
    </View>
  );

  const renderReflection = () => (
    <View style={styles.card}>
      <Text style={styles.sectionKicker}>Final thinking</Text>
      <Text style={styles.sectionTitle}>Reflection & Save</Text>
      {renderInput({
        label: "Reflection",
        value: reflection,
        onChangeText: setReflection,
        placeholder:
          "What design features helped your structure handle vibration?",
        multiline: true,
      })}
      {successMessage ? (
        <Text style={styles.successText}>{successMessage}</Text>
      ) : null}
      <TouchableOpacity style={styles.saveButton} onPress={saveActivity}>
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
        return renderVibrationTest();
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
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <StatusBar style="dark" />
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={styles.screen}>
          <ScrollView
            contentContainerStyle={styles.container}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <TopBar
              title="Earthquake-Resistant Structure"
              eyebrow="Engineering + Earth Science"
            />

            <View style={styles.progressCard}>
              <Text style={styles.progressMeta}>
                Step {currentStep + 1} of {steps.length}
              </Text>
              <Text style={styles.progressTitle}>{steps[currentStep]}</Text>
              <View style={styles.progressTrack}>
                <View
                  style={[styles.progressFill, { width: progressPercent }]}
                />
              </View>
            </View>

            {renderStep()}

            <View style={styles.navRow}>
              {!isFirstStep ? (
                <TouchableOpacity style={styles.backButton} onPress={goBack}>
                  <Text style={styles.backButtonText}>Back</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.navSpacer} />
              )}

              {!isLastStep ? (
                <TouchableOpacity style={styles.nextButton} onPress={goNext}>
                  <Text style={styles.nextButtonText}>Next</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </ScrollView>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f6f8ef",
  },
  container: {
    padding: 22,
    paddingTop: 58,
    paddingBottom: 36,
  },
  progressCard: {
    backgroundColor: "#172218",
    borderRadius: 28,
    padding: 20,
    marginBottom: 16,
  },
  progressMeta: {
    color: "#f0ff75",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  progressTitle: {
    color: "#ffffff",
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "900",
    marginTop: 6,
  },
  progressTrack: {
    height: 9,
    backgroundColor: "#354333",
    borderRadius: 999,
    marginTop: 16,
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
  badge: {
    alignSelf: "flex-start",
    backgroundColor: "#e8f5e9",
    color: "#244b2a",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  pageTitle: {
    color: "#172218",
    fontSize: 33,
    lineHeight: 38,
    fontWeight: "900",
    marginTop: 16,
  },
  bodyText: {
    color: "#51604c",
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "700",
    marginTop: 10,
  },
  focusRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 18,
  },
  focusPill: {
    backgroundColor: "#f6f8ef",
    borderColor: "#d7e3cf",
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  focusLabel: {
    color: "#344234",
    fontSize: 13,
    fontWeight: "900",
  },
  sectionKicker: {
    color: "#5f7d34",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 7,
  },
  sectionTitle: {
    color: "#172218",
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "900",
    marginBottom: 12,
  },
  listRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#edf2e8",
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 999,
    backgroundColor: "#f0ff75",
    marginTop: 7,
    marginRight: 12,
    borderWidth: 1,
    borderColor: "#172218",
  },
  listText: {
    flex: 1,
    color: "#2f3d2f",
    fontSize: 16,
    lineHeight: 23,
    fontWeight: "800",
  },
  instructionRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 11,
    borderTopWidth: 1,
    borderTopColor: "#edf2e8",
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 12,
    backgroundColor: "#172218",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  stepNumberText: {
    color: "#f0ff75",
    fontSize: 14,
    fontWeight: "900",
  },
  instructionText: {
    flex: 1,
    color: "#2f3d2f",
    fontSize: 16,
    lineHeight: 23,
    fontWeight: "800",
  },
  placeholderBox: {
    backgroundColor: "#f6f8ef",
    borderColor: "#d7e3cf",
    borderWidth: 1,
    borderRadius: 24,
    padding: 18,
    marginTop: 18,
    alignItems: "center",
  },
  placeholderIcon: {
    color: "#172218",
    fontSize: 34,
    fontWeight: "900",
  },
  placeholderTitle: {
    color: "#172218",
    fontSize: 18,
    fontWeight: "900",
    marginTop: 6,
  },
  placeholderText: {
    color: "#5f6f52",
    fontSize: 14,
    lineHeight: 21,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 8,
  },
  sensorNote: {
    backgroundColor: "#fff8dc",
    color: "#6d5816",
    borderColor: "#f5df8b",
    borderWidth: 1,
    borderRadius: 18,
    padding: 13,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "800",
    marginTop: 14,
  },
  designSelector: {
    marginTop: 16,
  },
  selectorLabel: {
    color: "#344234",
    fontSize: 14,
    fontWeight: "900",
    marginBottom: 8,
  },
  designButtonRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  designButton: {
    minHeight: 44,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#d7e3cf",
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 13,
  },
  designButtonActive: {
    backgroundColor: "#172218",
    borderColor: "#172218",
  },
  designButtonText: {
    color: "#344234",
    fontSize: 13,
    fontWeight: "900",
  },
  designButtonTextActive: {
    color: "#f0ff75",
  },
  metricGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 16,
  },
  metricCard: {
    flexGrow: 1,
    flexBasis: "46%",
    minHeight: 88,
    backgroundColor: "#f6f8ef",
    borderColor: "#d7e3cf",
    borderWidth: 1,
    borderRadius: 20,
    padding: 14,
    justifyContent: "center",
  },
  metricLabel: {
    color: "#5f6f52",
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  metricValue: {
    color: "#172218",
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "900",
    marginTop: 5,
  },
  testButtonRow: {
    gap: 10,
    marginTop: 16,
  },
  testButton: {
    minHeight: 56,
    backgroundColor: "#172218",
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  stopButton: {
    minHeight: 56,
    backgroundColor: "#fff1ef",
    borderColor: "#ffb4aa",
    borderWidth: 1,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  testButtonDisabled: {
    opacity: 0.55,
  },
  testButtonText: {
    color: "#f0ff75",
    fontSize: 15,
    fontWeight: "900",
    textAlign: "center",
  },
  stopButtonText: {
    color: "#9f1d14",
    fontSize: 15,
    fontWeight: "900",
    textAlign: "center",
  },
  field: {
    marginTop: 14,
  },
  inputLabel: {
    color: "#344234",
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "900",
    marginBottom: 8,
  },
  input: {
    minHeight: 52,
    backgroundColor: "#f6f8ef",
    borderColor: "#d7e3cf",
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 15,
    paddingVertical: 13,
    color: "#172218",
    fontSize: 16,
    fontWeight: "700",
  },
  textArea: {
    minHeight: 104,
    lineHeight: 22,
  },
  successText: {
    backgroundColor: "#e8f5e9",
    color: "#244b2a",
    borderRadius: 16,
    padding: 12,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "800",
    marginTop: 14,
  },
  saveButton: {
    minHeight: 56,
    backgroundColor: "#172218",
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
    marginTop: 14,
  },
  saveButtonText: {
    color: "#f0ff75",
    fontSize: 16,
    fontWeight: "900",
  },
  navRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  navSpacer: {
    flex: 1,
  },
  backButton: {
    flex: 1,
    minHeight: 54,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#d7e3cf",
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
  },
  backButtonText: {
    color: "#344234",
    fontSize: 15,
    fontWeight: "900",
  },
  nextButton: {
    flex: 1,
    minHeight: 54,
    borderRadius: 18,
    backgroundColor: "#f0ff75",
    alignItems: "center",
    justifyContent: "center",
  },
  nextButtonText: {
    color: "#172218",
    fontSize: 15,
    fontWeight: "900",
  },
});
