import { useEffect, useRef, useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  Vibration,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Accelerometer } from "expo-sensors";
import TopBar from "../../../components/TopBar";
import ActivityProgressHeader from "../../../components/activity/ActivityProgressHeader";
import ActivityReviewCard from "../../../components/activity/ActivityReviewCard";
import ActivityStepFooter from "../../../components/activity/ActivityStepFooter";
import ValidationMessage from "../../../components/activity/ValidationMessage";
import { ACTIVITY_POINTS } from "../../../constants/activityPoints";
import { saveActivityResult } from "../../../firebase/saveActivityResult";

const MOVEMENT_TEST_SECONDS = 10;
const SENSOR_UPDATE_MS = 120;
const HIGH_MOVEMENT_THRESHOLD = 1.9;
const VIBRATION_COOLDOWN_MS = 2200;
const VIBRATION_PULSE_MS = 90;

const steps = [
  "Overview",
  "Equipment",
  "Instructions",
  "Movement Test",
  "Results",
  "Reflection",
  "Review & Submit",
];

const HUMAN_PERFORMANCE_POINTS = ACTIVITY_POINTS["human-performance"];

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
    id: "movement1",
    label: "Movement 1",
    title: "Slow arm raise",
    detail: "Lift your arm slowly while keeping control through the full range.",
  },
  {
    id: "movement2",
    label: "Movement 2",
    title: "Side-to-side reach",
    detail: "Reach gently from side to side while staying balanced.",
  },
  {
    id: "movement3",
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

const getSmoothnessCategory = (averageMovement) => {
  if (averageMovement === null) {
    return "No movement data yet";
  }

  if (averageMovement < 1.25) {
    return "Smooth and controlled";
  }

  if (averageMovement < 1.75) {
    return "Moderate movement";
  }

  return "Needs more control";
};

const getSmoothnessScore = (averageMovement) => {
  if (averageMovement === null) {
    return null;
  }

  return Math.max(0, Math.min(100, Math.round(115 - averageMovement * 35)));
};

const formatMovement = (value) => (value === null ? "--" : value.toFixed(2));

const formatScore = (score) => (score === null ? "--" : `${score}/100`);

const createEmptySavedAttempts = () =>
  movements.reduce((attempts, movement) => {
    attempts[movement.id] = {
      withoutFeedback: null,
      withFeedback: null,
    };
    return attempts;
  }, {});

const getAttemptModeLabel = (feedbackEnabled) =>
  feedbackEnabled ? "With feedback" : "Without feedback";

const getAttemptModeKey = (feedbackEnabled) =>
  feedbackEnabled ? "withFeedback" : "withoutFeedback";

export default function HumanPerformanceLab() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [activeMovementId, setActiveMovementId] = useState("movement1");
  const [feedbackEnabled, setFeedbackEnabled] = useState(false);
  const [prediction, setPrediction] = useState("");
  const [attempt1Notes, setAttempt1Notes] = useState("");
  const [attempt2Notes, setAttempt2Notes] = useState("");
  const [attempt3Notes, setAttempt3Notes] = useState("");
  const [wereYouRight, setWereYouRight] = useState("");
  const [surprises, setSurprises] = useState("");
  const [reflection, setReflection] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [validationMessages, setValidationMessages] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const [completedSeconds, setCompletedSeconds] = useState(0);
  const [testMessage, setTestMessage] = useState("");
  const [currentMovement, setCurrentMovement] = useState(null);
  const [maxMovement, setMaxMovement] = useState(null);
  const [averageMovement, setAverageMovement] = useState(null);
  const [latestResult, setLatestResult] = useState(null);
  const [savedAttempts, setSavedAttempts] = useState(createEmptySavedAttempts);
  const testIntervalRef = useRef(null);
  const testTimeoutRef = useRef(null);
  const accelerometerSubscriptionRef = useRef(null);
  const movementSamplesRef = useRef([]);
  const movementTotalRef = useRef(0);
  const maxMovementRef = useRef(0);
  const testStartedAtRef = useRef(null);
  const lastVibrationAtRef = useRef(0);
  const latestMovementRef = useRef({
    current: null,
    max: null,
    average: null,
    duration: 0,
  });

  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;
  const activeMovement =
    movements.find((movement) => movement.id === activeMovementId) ||
    movements[0];
  const activeAttemptMode = getAttemptModeKey(feedbackEnabled);
  const activeAttemptModeLabel = getAttemptModeLabel(feedbackEnabled);
  const liveScore = getSmoothnessScore(averageMovement);
  const displayResult =
    isTesting || averageMovement !== null
      ? {
          average: averageMovement,
          max: maxMovement,
          duration: completedSeconds,
          score: liveScore,
          category: getSmoothnessCategory(averageMovement),
        }
      : latestResult;
  const completedAttempts = movements.flatMap((movement) =>
    ["withoutFeedback", "withFeedback"]
      .map((modeKey) => savedAttempts[movement.id][modeKey])
      .filter(Boolean)
      .map((attempt) => ({
        ...attempt,
        movementName: `${movement.label}: ${movement.title}`,
      })),
  );
  const movementNames = Array.from(
    new Set(completedAttempts.map((attempt) => attempt.movementName)),
  );
  const vibrationFeedbackUsed = completedAttempts.some(
    (attempt) => attempt.feedbackEnabled,
  );
  const feedbackComparisons = movements
    .map((movement) => {
      const withoutFeedback = savedAttempts[movement.id].withoutFeedback;
      const withFeedback = savedAttempts[movement.id].withFeedback;

      if (!withoutFeedback || !withFeedback) {
        return null;
      }

      const averageMovementImprovement =
        withoutFeedback.average - withFeedback.average;

      return {
        movementId: movement.id,
        movementName: `${movement.label}: ${movement.title}`,
        withoutFeedbackAverage: withoutFeedback.average,
        withFeedbackAverage: withFeedback.average,
        averageMovementImprovement,
        improvedWithFeedback: averageMovementImprovement > 0.03,
      };
    })
    .filter(Boolean);
  const smoothestAttempt =
    completedAttempts.length > 0
      ? completedAttempts.reduce((best, attempt) =>
          attempt.average < best.average ? attempt : best,
        )
      : null;
  const savedMovementResults = movements
    .map((movement) => ({
      ...movement,
      result:
        savedAttempts[movement.id].withFeedback ||
        savedAttempts[movement.id].withoutFeedback,
    }))
    .filter((movement) => movement.result);
  const smoothestMovement =
    savedMovementResults.length > 0
      ? savedMovementResults.reduce((best, movement) =>
          movement.result.average < best.result.average ? movement : best,
        )
      : null;
  const hardestMovement =
    savedMovementResults.length > 0
      ? savedMovementResults.reduce((hardest, movement) =>
          movement.result.average > hardest.result.average
            ? movement
            : hardest,
        )
      : null;

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

  const formatFeedbackComparison = (comparison) => {
    if (!comparison) {
      return "";
    }

    if (comparison.averageMovementImprovement > 0.03) {
      return `${comparison.movementName}: improved with feedback by ${formatMovement(
        comparison.averageMovementImprovement,
      )}.`;
    }

    if (comparison.averageMovementImprovement < -0.03) {
      return `${comparison.movementName}: average movement increased by ${formatMovement(
        Math.abs(comparison.averageMovementImprovement),
      )}.`;
    }

    return `${comparison.movementName}: about the same with and without feedback.`;
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

  const getElapsedSeconds = () => {
    if (!testStartedAtRef.current) {
      return completedSeconds;
    }

    return Math.min(
      MOVEMENT_TEST_SECONDS,
      Math.max(0, Math.round((Date.now() - testStartedAtRef.current) / 1000)),
    );
  };

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

  const resetLiveMovementStats = () => {
    movementSamplesRef.current = [];
    movementTotalRef.current = 0;
    maxMovementRef.current = 0;
    latestMovementRef.current = {
      current: null,
      max: null,
      average: null,
      duration: 0,
    };
    setCurrentMovement(null);
    setMaxMovement(null);
    setAverageMovement(null);
    setCompletedSeconds(0);
    setLatestResult(null);
  };

  const cleanupMovementTest = () => {
    clearTestTimers();
    stopAccelerometer();
    testStartedAtRef.current = null;
    Vibration.cancel();
    setIsTesting(false);
    setSecondsRemaining(0);
  };

  const buildMovementResult = (statusLabel) => {
    const latestMovement = latestMovementRef.current;

    if (latestMovement.average === null) {
      return null;
    }

    const duration = latestMovement.duration || getElapsedSeconds();
    const score = getSmoothnessScore(latestMovement.average);

    return {
      movementId: activeMovement.id,
      movementLabel: activeMovement.label,
      movementTitle: activeMovement.title,
      current: latestMovement.current,
      max: latestMovement.max,
      average: latestMovement.average,
      duration,
      score,
      category: getSmoothnessCategory(latestMovement.average),
      feedbackEnabled,
      modeKey: activeAttemptMode,
      modeLabel: activeAttemptModeLabel,
      status: statusLabel,
    };
  };

  const completeMovementTest = (statusLabel = "Test complete") => {
    const result = buildMovementResult(statusLabel);

    cleanupMovementTest();

    if (!result) {
      setTestMessage("Test finished, but no movement data was captured.");
      return;
    }

    setCompletedSeconds(result.duration);
    setLatestResult(result);
    setTestMessage(`${activeMovement.label} ${statusLabel.toLowerCase()}.`);
  };

  const handleAccelerometerUpdate = ({ x, y, z }) => {
    const movementMagnitude = Math.sqrt(x * x + y * y + z * z);
    const nextSamples = [
      ...movementSamplesRef.current,
      movementMagnitude,
    ];
    const nextTotal = movementTotalRef.current + movementMagnitude;
    const nextMax = Math.max(maxMovementRef.current, movementMagnitude);
    const nextAverage = nextTotal / nextSamples.length;
    const duration = getElapsedSeconds();

    movementSamplesRef.current = nextSamples;
    movementTotalRef.current = nextTotal;
    maxMovementRef.current = nextMax;
    latestMovementRef.current = {
      current: movementMagnitude,
      max: nextMax,
      average: nextAverage,
      duration,
    };

    setCurrentMovement(movementMagnitude);
    setMaxMovement(nextMax);
    setAverageMovement(nextAverage);
    setCompletedSeconds(duration);

    if (feedbackEnabled && movementMagnitude >= HIGH_MOVEMENT_THRESHOLD) {
      const now = Date.now();

      if (now - lastVibrationAtRef.current >= VIBRATION_COOLDOWN_MS) {
        Vibration.vibrate(VIBRATION_PULSE_MS);
        lastVibrationAtRef.current = now;
      }
    }
  };

  const startMovementTest = async () => {
    Keyboard.dismiss();
    clearTestTimers();
    stopAccelerometer();
    resetLiveMovementStats();
    lastVibrationAtRef.current = 0;
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
      testStartedAtRef.current = Date.now();
      accelerometerSubscriptionRef.current = Accelerometer.addListener(
        handleAccelerometerUpdate,
      );

      setIsTesting(true);
      setSecondsRemaining(MOVEMENT_TEST_SECONDS);
      setTestMessage(
        `${activeMovement.label} test running ${activeAttemptModeLabel.toLowerCase()}.`,
      );

      testIntervalRef.current = setInterval(() => {
        const elapsed = getElapsedSeconds();
        latestMovementRef.current = {
          ...latestMovementRef.current,
          duration: elapsed,
        };
        setCompletedSeconds(elapsed);
        setSecondsRemaining(Math.max(MOVEMENT_TEST_SECONDS - elapsed, 0));
      }, 1000);

      testTimeoutRef.current = setTimeout(() => {
        completeMovementTest();
      }, MOVEMENT_TEST_SECONDS * 1000);
    } catch (_error) {
      cleanupMovementTest();
      setTestMessage("Unable to start the movement sensor test.");
    }
  };

  const stopMovementTest = () => {
    Keyboard.dismiss();

    if (!isTesting) {
      setTestMessage("Start a movement test before stopping.");
      return;
    }

    completeMovementTest("Test stopped");
  };

  const saveMovementAttempt = () => {
    Keyboard.dismiss();

    if (isTesting) {
      setTestMessage("Stop the test before saving this attempt.");
      return;
    }

    if (!latestResult || latestResult.movementId !== activeMovement.id) {
      setTestMessage(`Run ${activeMovement.label} before saving.`);
      return;
    }

    setSavedAttempts((attempts) => ({
      ...attempts,
      [activeMovement.id]: {
        ...attempts[activeMovement.id],
        [latestResult.modeKey]: latestResult,
      },
    }));
    setTestMessage(
      `${activeMovement.label} ${latestResult.modeLabel.toLowerCase()} attempt saved for review.`,
    );
    setSuccessMessage("");
    setValidationMessages([]);
  };

  const selectMovement = (movementId) => {
    if (isTesting) {
      return;
    }

    setActiveMovementId(movementId);
    setTestMessage("");
    const savedAttempt = savedAttempts[movementId][activeAttemptMode];
    setLatestResult(savedAttempt);

    if (savedAttempt) {
      setCurrentMovement(savedAttempt.current);
      setMaxMovement(savedAttempt.max);
      setAverageMovement(savedAttempt.average);
      setCompletedSeconds(savedAttempt.duration);
    } else {
      setCurrentMovement(null);
      setMaxMovement(null);
      setAverageMovement(null);
      setCompletedSeconds(0);
    }
  };

  const toggleFeedbackMode = () => {
    if (isTesting) {
      return;
    }

    const nextEnabled = !feedbackEnabled;
    const nextMode = getAttemptModeKey(nextEnabled);
    const savedAttempt = savedAttempts[activeMovement.id][nextMode];

    setFeedbackEnabled(nextEnabled);
    setTestMessage("");
    setLatestResult(savedAttempt);

    if (savedAttempt) {
      setCurrentMovement(savedAttempt.current);
      setMaxMovement(savedAttempt.max);
      setAverageMovement(savedAttempt.average);
      setCompletedSeconds(savedAttempt.duration);
    } else {
      setCurrentMovement(null);
      setMaxMovement(null);
      setAverageMovement(null);
      setCompletedSeconds(0);
    }
  };

  const goBack = () => {
    Keyboard.dismiss();
    if (currentStep === 3) {
      cleanupMovementTest();
    }
    setSuccessMessage("");
    setValidationMessages([]);
    setCurrentStep((step) => Math.max(step - 1, 0));
  };

  const goNext = () => {
    Keyboard.dismiss();
    if (currentStep === 3) {
      cleanupMovementTest();
    }
    setSuccessMessage("");

    if (currentStep === steps.length - 2) {
      const nextValidationMessages = getReviewValidationMessages();

      if (nextValidationMessages.length > 0) {
        setValidationMessages(nextValidationMessages);
        return;
      }
    }

    setValidationMessages([]);
    setCurrentStep((step) => Math.min(step + 1, steps.length - 1));
  };

  const getReviewValidationMessages = () => {
    const messages = [];

    if (!prediction.trim()) {
      messages.push("Add your prediction.");
    }

    if (completedAttempts.length === 0) {
      messages.push("Complete and save at least one movement attempt.");
    }

    if (!reflection.trim()) {
      messages.push("Add your final reflection.");
    }

    return messages;
  };

  const handleSubmitActivity = async () => {
    Keyboard.dismiss();

    if (isSubmitting || hasSubmitted) {
      return;
    }

    setSuccessMessage("");

    const nextValidationMessages = getReviewValidationMessages();

    if (nextValidationMessages.length > 0) {
      setValidationMessages(nextValidationMessages);
      return;
    }

    setValidationMessages([]);
    setIsSubmitting(true);

    try {
      await saveActivityResult({
        activityId: "human-performance",
        activityName: "Human Performance Lab",
        pointsAwarded: HUMAN_PERFORMANCE_POINTS,
        resultSummary: {
          prediction: prediction.trim(),
          attemptsCompletedCount: completedAttempts.length,
          movementNames,
          completedAttempts: completedAttempts.map((attempt) => ({
            movementId: attempt.movementId,
            movementName: attempt.movementName,
            movementTitle: attempt.movementTitle,
            modeKey: attempt.modeKey,
            modeLabel: attempt.modeLabel,
            feedbackEnabled: attempt.feedbackEnabled,
            averageMovement: attempt.average,
            maximumMovement: attempt.max,
            currentMovement: attempt.current,
            durationSeconds: attempt.duration,
            smoothnessScore: attempt.score,
            smoothnessCategory: attempt.category,
            status: attempt.status,
          })),
          averageMovementResults: completedAttempts.map((attempt) => ({
            movementId: attempt.movementId,
            movementName: attempt.movementName,
            modeLabel: attempt.modeLabel,
            averageMovement: attempt.average,
            smoothnessScore: attempt.score,
            smoothnessCategory: attempt.category,
          })),
          maximumMovementResults: completedAttempts.map((attempt) => ({
            movementId: attempt.movementId,
            movementName: attempt.movementName,
            modeLabel: attempt.modeLabel,
            maximumMovement: attempt.max,
          })),
          feedbackComparisons: feedbackComparisons.map((comparison) => ({
            movementId: comparison.movementId,
            movementName: comparison.movementName,
            withoutFeedbackAverage: comparison.withoutFeedbackAverage,
            withFeedbackAverage: comparison.withFeedbackAverage,
            averageMovementImprovement:
              comparison.averageMovementImprovement,
            improvedWithFeedback: comparison.improvedWithFeedback,
          })),
          bestControlledMovement: smoothestAttempt
            ? {
                movementId: smoothestAttempt.movementId,
                movementName: smoothestAttempt.movementName,
                modeLabel: smoothestAttempt.modeLabel,
                averageMovement: smoothestAttempt.average,
                smoothnessScore: smoothestAttempt.score,
                smoothnessCategory: smoothestAttempt.category,
              }
            : null,
          wereYouRight: wereYouRight.trim(),
          surprises: surprises.trim(),
        },
        reflection: reflection.trim(),
        evidenceSummary: {
          accelerometerMeasurementRecorded: completedAttempts.length > 0,
          vibrationFeedbackUsed,
          attemptsCompletedCount: completedAttempts.length,
        },
      });

      setSuccessMessage(
        `Activity submitted successfully. Your team earned ${HUMAN_PERFORMANCE_POINTS} points.`,
      );
      setHasSubmitted(true);
    } catch (error) {
      console.log("Error saving human performance activity:", error);
      const helperMessages = [
        "Please sign in before submitting an activity.",
        "Set up your team before submitting an activity.",
      ];
      const submissionMessage = helperMessages.includes(error?.message)
        ? error.message
        : "Activity could not be submitted right now. Check your connection and try again.";

      setValidationMessages([submissionMessage]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleContinueToActivities = () => {
    router.replace("/main/activities");
  };

  const renderInput = ({
    label,
    value,
    onChangeText,
    placeholder,
    multiline,
  }) => (
    <View style={styles.field} key={label}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.textArea]}
        value={value}
        onChangeText={(nextValue) => {
          onChangeText(nextValue);
          setSuccessMessage("");
          setValidationMessages([]);
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

  const renderComparisonCard = () => (
    <View style={styles.comparisonCard}>
      <Text style={styles.comparisonTitle}>Movement Comparison</Text>
      <Text style={styles.comparisonHint}>
        Lower average movement usually means the movement was smoother and more
        controlled. Vibration feedback is a cue tool, not a sensor measurement.
      </Text>

      {movements.map((movement) => {
        const withoutFeedback = savedAttempts[movement.id].withoutFeedback;
        const withFeedback = savedAttempts[movement.id].withFeedback;
        const improvement =
          withoutFeedback && withFeedback
            ? withoutFeedback.average - withFeedback.average
            : null;
        const improvementText =
          improvement === null
            ? "Save both attempts to compare feedback."
            : improvement > 0.03
              ? `Improved with feedback by ${formatMovement(improvement)}.`
              : improvement < -0.03
                ? `Average movement increased by ${formatMovement(Math.abs(improvement))}.`
                : "About the same with and without feedback.";

        return (
          <View key={movement.id} style={styles.comparisonRow}>
            <Text style={styles.comparisonLabel}>{movement.label} score</Text>
            <Text style={styles.comparisonValue}>
              Without feedback:{" "}
              {withoutFeedback
                ? `${formatScore(withoutFeedback.score)} - avg ${formatMovement(withoutFeedback.average)}`
                : "Not saved yet"}
            </Text>
            <Text style={styles.comparisonValue}>
              With feedback:{" "}
              {withFeedback
                ? `${formatScore(withFeedback.score)} - avg ${formatMovement(withFeedback.average)}`
                : "Not saved yet"}
            </Text>
            <Text style={styles.feedbackImprovementText}>
              {improvementText}
            </Text>
          </View>
        );
      })}

      <View style={styles.bestWorstGrid}>
        <View style={styles.bestWorstCard}>
          <Text style={styles.bestWorstLabel}>Smoothest movement</Text>
          <Text style={styles.bestWorstValue}>
            {smoothestMovement
              ? `${smoothestMovement.label}: ${smoothestMovement.title}`
              : "Save an attempt to compare"}
          </Text>
        </View>
        <View style={styles.bestWorstCard}>
          <Text style={styles.bestWorstLabel}>Hardest to control</Text>
          <Text style={styles.bestWorstValue}>
            {hardestMovement
              ? `${hardestMovement.label}: ${hardestMovement.title}`
              : "Save an attempt to compare"}
          </Text>
        </View>
      </View>
    </View>
  );

  const renderMovementTest = () => (
    <View style={styles.card}>
      <Text style={styles.cardLabel}>Movement Test</Text>
      <Text style={styles.cardTitle}>Guided Stretch Sequence</Text>
      <Text style={styles.cardText}>
        Choose one movement, run a 10-second sensor test, then save one local
        attempt for that movement.
      </Text>

      <View style={styles.movementList}>
        {movements.map((movement) => {
          const isActive = movement.id === activeMovement.id;
          const savedAttemptCount = [
            savedAttempts[movement.id].withoutFeedback,
            savedAttempts[movement.id].withFeedback,
          ].filter(Boolean).length;

          return (
            <TouchableOpacity
              key={movement.id}
              style={[
                styles.movementCard,
                isActive && styles.movementCardActive,
              ]}
              onPress={() => selectMovement(movement.id)}
              activeOpacity={0.86}
              disabled={isTesting}
            >
              <View style={styles.movementHeader}>
                <Text
                  style={[
                    styles.movementLabel,
                    isActive && styles.movementLabelActive,
                  ]}
                >
                  {movement.label}
                </Text>
                {savedAttemptCount > 0 ? (
                  <Text style={styles.savedBadge}>
                    {savedAttemptCount}/2 Saved
                  </Text>
                ) : null}
              </View>
              <Text
                style={[
                  styles.movementTitle,
                  isActive && styles.movementTitleActive,
                ]}
              >
                {movement.title}
              </Text>
              <Text
                style={[
                  styles.movementDetail,
                  isActive && styles.movementDetailActive,
                ]}
              >
                {movement.detail}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.sensorNote}>
        <Text style={styles.sensorNoteText}>
          Phone sensor measurements are classroom estimates and may vary between
          devices.
        </Text>
      </View>

      <View style={styles.feedbackBox}>
        <View style={styles.feedbackHeader}>
          <View style={styles.feedbackTextWrap}>
            <Text style={styles.feedbackTitle}>Feedback tool</Text>
            <Text style={styles.feedbackDescription}>
              Short vibration pulses can remind students to slow down when
              movement becomes unusually high. This is not a sensor measurement.
            </Text>
          </View>
          <View
            style={[
              styles.feedbackStatusDot,
              feedbackEnabled && styles.feedbackStatusDotActive,
            ]}
          />
        </View>
        <TouchableOpacity
          style={[
            styles.feedbackButton,
            feedbackEnabled && styles.feedbackButtonActive,
            isTesting && styles.disabledButton,
          ]}
          onPress={toggleFeedbackMode}
          activeOpacity={0.86}
          disabled={isTesting}
        >
          <Text
            style={[
              styles.feedbackButtonText,
              feedbackEnabled && styles.feedbackButtonTextActive,
            ]}
          >
            {feedbackEnabled
              ? "Vibration Feedback Enabled"
              : "Enable Vibration Feedback"}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.livePanel}>
        <Text style={styles.liveTitle}>{activeMovement.title}</Text>
        <Text style={styles.liveSubtitle}>
          {isTesting
            ? `${secondsRemaining}s remaining`
            : latestResult?.movementId === activeMovement.id
              ? latestResult.status
              : `Ready to test ${activeAttemptModeLabel.toLowerCase()}`}
        </Text>
        <Text style={styles.modeLabel}>
          Current attempt mode: {activeAttemptModeLabel}
        </Text>

        <View style={styles.metricGrid}>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Smoothness score</Text>
            <Text style={styles.metricValue}>
              {formatScore(displayResult?.score ?? null)}
            </Text>
            <Text style={styles.metricHint}>
              {displayResult?.category || "Run a test"}
            </Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Average movement</Text>
            <Text style={styles.metricValue}>
              {formatMovement(displayResult?.average ?? null)}
            </Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Maximum movement</Text>
            <Text style={styles.metricValue}>
              {formatMovement(displayResult?.max ?? null)}
            </Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Time completed</Text>
            <Text style={styles.metricValue}>
              {displayResult?.duration ? `${displayResult.duration}s` : "--"}
            </Text>
          </View>
        </View>

        <View style={styles.currentReadingBox}>
          <Text style={styles.currentReadingLabel}>Current movement value</Text>
          <Text style={styles.currentReadingValue}>
            {formatMovement(currentMovement)}
          </Text>
        </View>

        {testMessage ? <Text style={styles.testMessage}>{testMessage}</Text> : null}

        <View style={styles.testButtonRow}>
          <TouchableOpacity
            style={[
              styles.testButton,
              isTesting && styles.disabledButton,
            ]}
            onPress={startMovementTest}
            activeOpacity={0.86}
            disabled={isTesting}
          >
            <Text style={styles.testButtonText}>Start Movement Test</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.stopButton,
              !isTesting && styles.disabledButton,
            ]}
            onPress={stopMovementTest}
            activeOpacity={0.86}
            disabled={!isTesting}
          >
            <Text style={styles.stopButtonText}>Stop Test</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[
            styles.saveAttemptButton,
            (isTesting || !latestResult) && styles.disabledButton,
          ]}
          onPress={saveMovementAttempt}
          activeOpacity={0.86}
          disabled={isTesting || !latestResult}
        >
          <Text style={styles.saveAttemptText}>Save Attempt</Text>
        </TouchableOpacity>
      </View>

      {renderComparisonCard()}
    </View>
  );

  const renderResults = () => (
    <View style={styles.card}>
      <Text style={styles.cardLabel}>Results</Text>
      <Text style={styles.cardTitle}>Record Your Observations</Text>
      <Text style={styles.cardText}>
        Use your saved movement results and team observations to explain what
        changed as your group tested control and feedback.
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
      <Text style={styles.cardLabel}>Reflection</Text>
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
    </View>
  );

  const renderReviewSubmit = () => {
    const attemptSummary =
      completedAttempts.length > 0
        ? completedAttempts
            .map(
              (attempt) =>
                `${attempt.movementName} (${attempt.modeLabel}): score ${formatScore(
                  attempt.score,
                )}, avg ${formatMovement(attempt.average)}, max ${formatMovement(
                  attempt.max,
                )}`,
            )
            .join("\n")
        : "";
    const feedbackSummary =
      feedbackComparisons.length > 0
        ? feedbackComparisons.map(formatFeedbackComparison).join("\n")
        : vibrationFeedbackUsed
          ? "Feedback was used for at least one saved attempt."
          : "No saved attempt used vibration feedback.";
    const bestControlledText = smoothestAttempt
      ? `${smoothestAttempt.movementName} (${smoothestAttempt.modeLabel}) - ${formatScore(
          smoothestAttempt.score,
        )}, avg ${formatMovement(smoothestAttempt.average)}`
      : "Save an attempt to compare control.";

    return (
      <View style={styles.card}>
        <Text style={styles.cardLabel}>Review & Submit</Text>
        <Text style={styles.cardTitle}>Check Your Movement Lab</Text>
        <Text style={styles.cardText}>
          Review your saved movement data before submitting. Your team earns
          fixed points only after the activity is saved to Firestore.
        </Text>

        <ActivityReviewCard
          title="Activity Summary"
          subtitle="Human Performance Lab"
          rows={[
            { label: "Prediction", value: prediction },
            {
              label: "Completed attempts",
              value: `${completedAttempts.length}`,
            },
            {
              label: "Completed movement(s)",
              value: movementNames.join("\n"),
            },
            {
              label: "Attempt results",
              value: attemptSummary,
            },
            {
              label: "Feedback comparison",
              value: feedbackSummary,
            },
            {
              label: "Best-controlled movement",
              value: bestControlledText,
            },
            { label: "Reflection", value: reflection },
            {
              label: "Points to earn",
              value: `${HUMAN_PERFORMANCE_POINTS} points`,
            },
          ]}
        />

        {successMessage ? (
          <Text style={styles.successText}>{successMessage}</Text>
        ) : null}
      </View>
    );
  };

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
      case 6:
        return renderReviewSubmit();
      default:
        return renderOverview();
    }
  };

  const nextStepLabel = isLastStep
    ? hasSubmitted
      ? "Continue to Activities"
      : isSubmitting
        ? "Submitting..."
        : "Submit Activity"
    : currentStep === steps.length - 2
      ? "Review Activity"
      : "Next";
  const handleFooterNext = isLastStep
    ? hasSubmitted
      ? handleContinueToActivities
      : handleSubmitActivity
    : goNext;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <StatusBar style="dark" />
      <View style={styles.screen}>
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
          keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
          keyboardShouldPersistTaps="handled"
          onScrollBeginDrag={Keyboard.dismiss}
        >
          <TopBar
            title="Human Performance Lab"
            eyebrow="Medical Science + Biomechanics"
          />

          <ActivityProgressHeader
            currentStep={currentStep}
            totalSteps={steps.length}
            title={steps[currentStep]}
          />

          <ValidationMessage items={validationMessages} />

          {renderStep()}

          <ActivityStepFooter
            isFirstStep={isFirstStep || (isLastStep && hasSubmitted)}
            onBack={goBack}
            onNext={handleFooterNext}
            nextLabel={nextStepLabel}
            nextDisabled={isSubmitting}
          />
        </ScrollView>
      </View>
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
  movementCardActive: {
    backgroundColor: "#172218",
    borderColor: "#172218",
  },
  movementHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  movementLabel: {
    color: "#2e7d32",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  movementLabelActive: {
    color: "#f0ff75",
  },
  savedBadge: {
    backgroundColor: "#dcfce7",
    borderRadius: 999,
    color: "#166534",
    fontSize: 12,
    fontWeight: "900",
    overflow: "hidden",
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  movementTitle: {
    color: "#172218",
    fontSize: 19,
    lineHeight: 25,
    fontWeight: "900",
    marginTop: 5,
  },
  movementTitleActive: {
    color: "#ffffff",
  },
  movementDetail: {
    color: "#5f6f52",
    fontSize: 14,
    lineHeight: 21,
    fontWeight: "700",
    marginTop: 6,
  },
  movementDetailActive: {
    color: "#dbe7d4",
  },
  sensorNote: {
    backgroundColor: "#fff8e1",
    borderColor: "#f6d365",
    borderWidth: 1,
    borderRadius: 18,
    padding: 13,
    marginTop: 16,
  },
  sensorNoteText: {
    color: "#7a4f01",
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "800",
  },
  feedbackBox: {
    backgroundColor: "#f8fbf4",
    borderColor: "#dfe8d8",
    borderWidth: 1,
    borderRadius: 22,
    padding: 16,
    marginTop: 16,
  },
  feedbackHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  feedbackTextWrap: {
    flex: 1,
  },
  feedbackTitle: {
    color: "#172218",
    fontSize: 17,
    fontWeight: "900",
  },
  feedbackDescription: {
    color: "#5f6f52",
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700",
    marginTop: 5,
  },
  feedbackStatusDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#cbd5c0",
    marginTop: 3,
  },
  feedbackStatusDotActive: {
    backgroundColor: "#2e7d32",
  },
  feedbackButton: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: "#dfe8d8",
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 54,
    marginTop: 14,
    paddingHorizontal: 14,
  },
  feedbackButtonActive: {
    backgroundColor: "#172218",
    borderColor: "#172218",
  },
  feedbackButtonText: {
    color: "#172218",
    fontSize: 15,
    fontWeight: "900",
    textAlign: "center",
  },
  feedbackButtonTextActive: {
    color: "#f0ff75",
  },
  livePanel: {
    backgroundColor: "#ffffff",
    borderColor: "#dfe8d8",
    borderWidth: 1,
    borderRadius: 24,
    padding: 16,
    marginTop: 16,
  },
  liveTitle: {
    color: "#172218",
    fontSize: 21,
    lineHeight: 27,
    fontWeight: "900",
  },
  liveSubtitle: {
    color: "#5f6f52",
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "800",
    marginTop: 5,
  },
  modeLabel: {
    alignSelf: "flex-start",
    backgroundColor: "#e8f5e9",
    borderRadius: 999,
    color: "#244b2a",
    fontSize: 12,
    fontWeight: "900",
    marginTop: 10,
    overflow: "hidden",
    paddingHorizontal: 11,
    paddingVertical: 7,
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
    minHeight: 96,
    backgroundColor: "#f8fbf4",
    borderColor: "#dfe8d8",
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
  metricHint: {
    color: "#2e7d32",
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "900",
    marginTop: 4,
  },
  currentReadingBox: {
    backgroundColor: "#edf6ff",
    borderColor: "#cfe7ff",
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    marginTop: 14,
  },
  currentReadingLabel: {
    color: "#42667f",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  currentReadingValue: {
    color: "#17456b",
    fontSize: 28,
    fontWeight: "900",
    marginTop: 4,
  },
  testMessage: {
    backgroundColor: "#f8fbf4",
    borderColor: "#dfe8d8",
    borderWidth: 1,
    borderRadius: 16,
    color: "#172218",
    fontSize: 14,
    fontWeight: "900",
    lineHeight: 20,
    marginTop: 14,
    padding: 12,
    textAlign: "center",
  },
  testButtonRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
  },
  testButton: {
    alignItems: "center",
    backgroundColor: "#2e7d32",
    borderRadius: 18,
    flex: 1,
    justifyContent: "center",
    minHeight: 58,
    paddingHorizontal: 12,
  },
  testButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "900",
    textAlign: "center",
  },
  stopButton: {
    alignItems: "center",
    backgroundColor: "#ffe3df",
    borderColor: "#ffb4aa",
    borderRadius: 18,
    borderWidth: 1,
    flex: 1,
    justifyContent: "center",
    minHeight: 58,
    paddingHorizontal: 12,
  },
  stopButtonText: {
    color: "#9f1d14",
    fontSize: 14,
    fontWeight: "900",
    textAlign: "center",
  },
  saveAttemptButton: {
    alignItems: "center",
    backgroundColor: "#f0ff75",
    borderRadius: 18,
    justifyContent: "center",
    minHeight: 56,
    marginTop: 12,
    paddingHorizontal: 16,
  },
  saveAttemptText: {
    color: "#172218",
    fontSize: 15,
    fontWeight: "900",
    textAlign: "center",
  },
  disabledButton: {
    opacity: 0.5,
  },
  comparisonCard: {
    backgroundColor: "#f6f8ef",
    borderColor: "#d7e3cf",
    borderWidth: 1,
    borderRadius: 24,
    padding: 16,
    marginTop: 16,
  },
  comparisonTitle: {
    color: "#172218",
    fontSize: 19,
    fontWeight: "900",
  },
  comparisonHint: {
    color: "#5f6f52",
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "700",
    marginTop: 5,
    marginBottom: 8,
  },
  comparisonRow: {
    borderTopWidth: 1,
    borderTopColor: "#dfe8d9",
    paddingVertical: 11,
  },
  comparisonLabel: {
    color: "#344234",
    fontSize: 13,
    fontWeight: "900",
  },
  comparisonValue: {
    color: "#172218",
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "800",
    marginTop: 4,
  },
  feedbackImprovementText: {
    color: "#2e7d32",
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "900",
    marginTop: 6,
  },
  bestWorstGrid: {
    gap: 10,
    marginTop: 8,
  },
  bestWorstCard: {
    backgroundColor: "#172218",
    borderRadius: 18,
    padding: 14,
  },
  bestWorstLabel: {
    color: "#f0ff75",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  bestWorstValue: {
    color: "#ffffff",
    fontSize: 15,
    lineHeight: 21,
    fontWeight: "900",
    marginTop: 5,
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
