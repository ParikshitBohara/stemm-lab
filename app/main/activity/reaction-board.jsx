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

const getAverageTime = (attempts) =>
  attempts.length > 0
    ? Math.round(
        attempts.reduce((total, attempt) => total + attempt, 0) /
          attempts.length,
      )
    : null;

export default function ReactionBoardChallenge() {
  const [currentStep, setCurrentStep] = useState(0);
  const [tapReactionStatus, setTapReactionStatus] = useState("");
  const [tapAttempts, setTapAttempts] = useState([]);
  const [isTapWaiting, setIsTapWaiting] = useState(false);
  const [isTargetVisible, setIsTargetVisible] = useState(false);
  const [tapMessage, setTapMessage] = useState("");
  const [swapHandsStatus, setSwapHandsStatus] = useState("");
  const [swapHandMode, setSwapHandMode] = useState("dominant");
  const [dominantHandAttempts, setDominantHandAttempts] = useState([]);
  const [nonDominantHandAttempts, setNonDominantHandAttempts] = useState([]);
  const [isSwapWaiting, setIsSwapWaiting] = useState(false);
  const [isSwapTargetVisible, setIsSwapTargetVisible] = useState(false);
  const [swapMessage, setSwapMessage] = useState("");
  const [tracingStatus, setTracingStatus] = useState("");
  const [bestPhase, setBestPhase] = useState("");
  const [hardestPhase, setHardestPhase] = useState("");
  const [notes, setNotes] = useState("");
  const [reflection, setReflection] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const reactionTimerRef = useRef(null);
  const swapTimerRef = useRef(null);
  const targetShownAtRef = useRef(null);
  const swapTargetShownAtRef = useRef(null);

  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;
  const progressPercent = `${((currentStep + 1) / steps.length) * 100}%`;
  const bestTapTime =
    tapAttempts.length > 0 ? Math.min(...tapAttempts) : null;
  const averageTapTime = getAverageTime(tapAttempts);
  const dominantAverageTime = getAverageTime(dominantHandAttempts);
  const nonDominantAverageTime = getAverageTime(nonDominantHandAttempts);
  const swapDifference =
    dominantAverageTime !== null && nonDominantAverageTime !== null
      ? Math.abs(nonDominantAverageTime - dominantAverageTime)
      : null;
  const selectedSwapAttempts =
    swapHandMode === "dominant"
      ? dominantHandAttempts
      : nonDominantHandAttempts;
  const selectedHandLabel =
    swapHandMode === "dominant" ? "Dominant hand" : "Non-dominant hand";

  const clearReactionTimer = () => {
    if (reactionTimerRef.current) {
      clearTimeout(reactionTimerRef.current);
      reactionTimerRef.current = null;
    }
  };

  const clearSwapTimer = () => {
    if (swapTimerRef.current) {
      clearTimeout(swapTimerRef.current);
      swapTimerRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      clearReactionTimer();
      clearSwapTimer();
    };
  }, []);

  const goBack = () => {
    Keyboard.dismiss();
    clearReactionTimer();
    clearSwapTimer();
    setIsTapWaiting(false);
    setIsTargetVisible(false);
    setIsSwapWaiting(false);
    setIsSwapTargetVisible(false);
    setCurrentStep((step) => Math.max(step - 1, 0));
  };

  const goNext = () => {
    Keyboard.dismiss();
    clearReactionTimer();
    clearSwapTimer();
    setIsTapWaiting(false);
    setIsTargetVisible(false);
    setIsSwapWaiting(false);
    setIsSwapTargetVisible(false);
    setSuccessMessage("");
    setCurrentStep((step) => Math.min(step + 1, steps.length - 1));
  };

  const startTapAttempt = () => {
    if (tapAttempts.length >= 3) {
      setTapMessage("All three attempts are saved. Reset to try again.");
      return;
    }

    clearReactionTimer();
    setIsTargetVisible(false);
    setIsTapWaiting(true);
    setTapMessage("Wait for the target...");
    targetShownAtRef.current = null;

    const delay = Math.floor(1000 + Math.random() * 2001);

    reactionTimerRef.current = setTimeout(() => {
      targetShownAtRef.current = Date.now();
      setIsTapWaiting(false);
      setIsTargetVisible(true);
      setTapMessage("Tap the target now!");
      reactionTimerRef.current = null;
    }, delay);
  };

  const handleEarlyTap = () => {
    if (!isTapWaiting || isTargetVisible) {
      return;
    }

    clearReactionTimer();
    targetShownAtRef.current = null;
    setIsTapWaiting(false);
    setIsTargetVisible(false);
    setTapMessage("Too early, try again");
  };

  const handleTargetTap = () => {
    if (!isTargetVisible || !targetShownAtRef.current || tapAttempts.length >= 3) {
      return;
    }

    const reactionTime = Date.now() - targetShownAtRef.current;
    const attemptNumber = tapAttempts.length + 1;
    const nextAttempts = [...tapAttempts, reactionTime];

    setTapAttempts(nextAttempts);
    setIsTargetVisible(false);
    targetShownAtRef.current = null;
    setTapMessage(`Attempt ${attemptNumber} saved: ${reactionTime} ms`);

    if (nextAttempts.length === 3) {
      setTapReactionStatus("Tap reaction completed for demo.");
    }
  };

  const resetTapAttempts = () => {
    clearReactionTimer();
    targetShownAtRef.current = null;
    setTapAttempts([]);
    setIsTapWaiting(false);
    setIsTargetVisible(false);
    setTapReactionStatus("");
    setTapMessage("Attempts reset.");
  };

  const selectSwapHandMode = (mode) => {
    clearSwapTimer();
    swapTargetShownAtRef.current = null;
    setIsSwapWaiting(false);
    setIsSwapTargetVisible(false);
    setSwapHandMode(mode);
    setSwapMessage("");
  };

  const startSwapAttempt = () => {
    if (selectedSwapAttempts.length >= 3) {
      setSwapMessage(`${selectedHandLabel} already has three attempts.`);
      return;
    }

    clearSwapTimer();
    setIsSwapTargetVisible(false);
    setIsSwapWaiting(true);
    setSwapMessage(`Wait for the target with your ${selectedHandLabel.toLowerCase()}...`);
    swapTargetShownAtRef.current = null;

    const delay = Math.floor(1000 + Math.random() * 2001);

    swapTimerRef.current = setTimeout(() => {
      swapTargetShownAtRef.current = Date.now();
      setIsSwapWaiting(false);
      setIsSwapTargetVisible(true);
      setSwapMessage(`Tap now with your ${selectedHandLabel.toLowerCase()}!`);
      swapTimerRef.current = null;
    }, delay);
  };

  const handleSwapEarlyTap = () => {
    if (!isSwapWaiting || isSwapTargetVisible) {
      return;
    }

    clearSwapTimer();
    swapTargetShownAtRef.current = null;
    setIsSwapWaiting(false);
    setIsSwapTargetVisible(false);
    setSwapMessage("Too early, try again");
  };

  const handleSwapTargetTap = () => {
    if (
      !isSwapTargetVisible ||
      !swapTargetShownAtRef.current ||
      selectedSwapAttempts.length >= 3
    ) {
      return;
    }

    const reactionTime = Date.now() - swapTargetShownAtRef.current;
    const attemptNumber = selectedSwapAttempts.length + 1;
    let nextDominantAttempts = dominantHandAttempts;
    let nextNonDominantAttempts = nonDominantHandAttempts;

    if (swapHandMode === "dominant") {
      nextDominantAttempts = [...dominantHandAttempts, reactionTime];
      setDominantHandAttempts(nextDominantAttempts);
    } else {
      nextNonDominantAttempts = [...nonDominantHandAttempts, reactionTime];
      setNonDominantHandAttempts(nextNonDominantAttempts);
    }

    setIsSwapTargetVisible(false);
    swapTargetShownAtRef.current = null;
    setSwapMessage(
      `${selectedHandLabel} attempt ${attemptNumber} saved: ${reactionTime} ms`,
    );

    if (
      nextDominantAttempts.length === 3 &&
      nextNonDominantAttempts.length === 3
    ) {
      setSwapHandsStatus("Swap hands completed for demo.");
    }
  };

  const resetSelectedSwapAttempts = () => {
    clearSwapTimer();
    swapTargetShownAtRef.current = null;
    setIsSwapWaiting(false);
    setIsSwapTargetVisible(false);
    setSwapHandsStatus("");

    if (swapHandMode === "dominant") {
      setDominantHandAttempts([]);
    } else {
      setNonDominantHandAttempts([]);
    }

    setSwapMessage(`${selectedHandLabel} attempts reset.`);
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

  const renderTapReaction = () => (
    <View style={styles.card}>
      <Text style={styles.cardLabel}>Phase 1</Text>
      <Text style={styles.cardTitle}>Tap Reaction</Text>
      <Text style={styles.cardText}>
        Press Start, wait for the target to appear, then tap it as quickly as
        you can. If you tap before the target appears, the attempt is cancelled.
      </Text>

      <View style={styles.reactionStats}>
        <View style={styles.reactionStatTile}>
          <Text style={styles.summaryLabel}>Best time</Text>
          <Text style={styles.summaryValue}>
            {bestTapTime === null ? "--" : `${bestTapTime} ms`}
          </Text>
        </View>
        <View style={styles.reactionStatTile}>
          <Text style={styles.summaryLabel}>Average time</Text>
          <Text style={styles.summaryValue}>
            {averageTapTime === null ? "--" : `${averageTapTime} ms`}
          </Text>
        </View>
      </View>

      {isTargetVisible ? (
        <TouchableOpacity
          style={styles.targetButton}
          onPress={handleTargetTap}
          activeOpacity={0.82}
        >
          <Text style={styles.targetButtonText}>Tap!</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={[
            styles.reactionPad,
            isTapWaiting && styles.reactionPadWaiting,
          ]}
          onPress={handleEarlyTap}
          activeOpacity={isTapWaiting ? 0.82 : 1}
          disabled={!isTapWaiting}
        >
          <Text style={styles.reactionPadText}>
            {isTapWaiting ? "Wait for green..." : "Target will appear here"}
          </Text>
        </TouchableOpacity>
      )}

      {tapMessage ? <Text style={styles.tapMessage}>{tapMessage}</Text> : null}

      <View style={styles.tapActions}>
        <TouchableOpacity
          style={[
            styles.startButton,
            (isTapWaiting || isTargetVisible || tapAttempts.length >= 3) &&
              styles.disabledButton,
          ]}
          onPress={startTapAttempt}
          activeOpacity={0.86}
          disabled={isTapWaiting || isTargetVisible || tapAttempts.length >= 3}
        >
          <Text style={styles.startButtonText}>Start</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.resetButton}
          onPress={resetTapAttempts}
          activeOpacity={0.86}
        >
          <Text style={styles.resetButtonText}>Reset</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.attemptList}>
        {[0, 1, 2].map((attemptIndex) => (
          <View key={attemptIndex} style={styles.attemptRow}>
            <Text style={styles.attemptLabel}>Attempt {attemptIndex + 1}</Text>
            <Text style={styles.attemptValue}>
              {tapAttempts[attemptIndex]
                ? `${tapAttempts[attemptIndex]} ms`
                : "Not saved"}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );

  const renderSwapHands = () => (
    <View style={styles.card}>
      <Text style={styles.cardLabel}>Phase 2</Text>
      <Text style={styles.cardTitle}>Swap Hands Mode</Text>
      <Text style={styles.cardText}>
        Record reaction attempts with your dominant hand, then switch to your
        non-dominant hand. Compare the average times to see how hand control
        changes your response speed.
      </Text>

      <View style={styles.handModeRow}>
        <TouchableOpacity
          style={[
            styles.handModeButton,
            swapHandMode === "dominant" && styles.handModeButtonActive,
          ]}
          onPress={() => selectSwapHandMode("dominant")}
          activeOpacity={0.86}
        >
          <Text
            style={[
              styles.handModeText,
              swapHandMode === "dominant" && styles.handModeTextActive,
            ]}
          >
            Dominant
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.handModeButton,
            swapHandMode === "nonDominant" && styles.handModeButtonActive,
          ]}
          onPress={() => selectSwapHandMode("nonDominant")}
          activeOpacity={0.86}
        >
          <Text
            style={[
              styles.handModeText,
              swapHandMode === "nonDominant" && styles.handModeTextActive,
            ]}
          >
            Non-dominant
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.comparisonGrid}>
        <View style={styles.reactionStatTile}>
          <Text style={styles.summaryLabel}>Dominant average</Text>
          <Text style={styles.summaryValue}>
            {dominantAverageTime === null ? "--" : `${dominantAverageTime} ms`}
          </Text>
        </View>
        <View style={styles.reactionStatTile}>
          <Text style={styles.summaryLabel}>Non-dominant average</Text>
          <Text style={styles.summaryValue}>
            {nonDominantAverageTime === null
              ? "--"
              : `${nonDominantAverageTime} ms`}
          </Text>
        </View>
        <View style={styles.reactionStatTile}>
          <Text style={styles.summaryLabel}>Difference</Text>
          <Text style={styles.summaryValue}>
            {swapDifference === null ? "--" : `${swapDifference} ms`}
          </Text>
        </View>
      </View>

      {isSwapTargetVisible ? (
        <TouchableOpacity
          style={styles.targetButton}
          onPress={handleSwapTargetTap}
          activeOpacity={0.82}
        >
          <Text style={styles.targetButtonText}>Tap!</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={[
            styles.reactionPad,
            isSwapWaiting && styles.reactionPadWaiting,
          ]}
          onPress={handleSwapEarlyTap}
          activeOpacity={isSwapWaiting ? 0.82 : 1}
          disabled={!isSwapWaiting}
        >
          <Text style={styles.reactionPadText}>
            {isSwapWaiting
              ? `Wait with ${selectedHandLabel.toLowerCase()}...`
              : `${selectedHandLabel} target will appear here`}
          </Text>
        </TouchableOpacity>
      )}

      {swapMessage ? (
        <Text style={styles.tapMessage}>{swapMessage}</Text>
      ) : null}

      <View style={styles.tapActions}>
        <TouchableOpacity
          style={[
            styles.startButton,
            (isSwapWaiting ||
              isSwapTargetVisible ||
              selectedSwapAttempts.length >= 3) &&
              styles.disabledButton,
          ]}
          onPress={startSwapAttempt}
          activeOpacity={0.86}
          disabled={
            isSwapWaiting ||
            isSwapTargetVisible ||
            selectedSwapAttempts.length >= 3
          }
        >
          <Text style={styles.startButtonText}>Start</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.resetButton}
          onPress={resetSelectedSwapAttempts}
          activeOpacity={0.86}
        >
          <Text style={styles.resetButtonText}>Reset Hand</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.attemptList}>
        {[0, 1, 2].map((attemptIndex) => (
          <View key={attemptIndex} style={styles.attemptRow}>
            <Text style={styles.attemptLabel}>
              {selectedHandLabel} {attemptIndex + 1}
            </Text>
            <Text style={styles.attemptValue}>
              {selectedSwapAttempts[attemptIndex]
                ? `${selectedSwapAttempts[attemptIndex]} ms`
                : "Not saved"}
            </Text>
          </View>
        ))}
      </View>
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
            {tapReactionStatus
              ? "Complete"
              : tapAttempts.length > 0
              ? `${tapAttempts.length}/3 attempts`
              : "Not started"}
          </Text>
        </View>
        <View style={styles.summaryTile}>
          <Text style={styles.summaryLabel}>Swap Hands</Text>
          <Text style={styles.summaryValue}>
            {swapHandsStatus
              ? "Complete"
              : `${dominantHandAttempts.length}/3 dom, ${nonDominantHandAttempts.length}/3 non-dom`}
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
        return renderTapReaction();
      case 4:
        return renderSwapHands();
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
  reactionStats: {
    flexDirection: "row",
    gap: 10,
    marginTop: 18,
  },
  reactionStatTile: {
    flex: 1,
    backgroundColor: "#f8fbf4",
    borderColor: "#dfe8d8",
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
  },
  reactionPad: {
    alignItems: "center",
    backgroundColor: "#edf6ff",
    borderColor: "#cfe7ff",
    borderWidth: 1,
    borderRadius: 26,
    justifyContent: "center",
    minHeight: 150,
    marginTop: 18,
    padding: 18,
  },
  reactionPadWaiting: {
    backgroundColor: "#fff8e1",
    borderColor: "#f6d365",
  },
  reactionPadText: {
    color: "#17456b",
    fontSize: 18,
    fontWeight: "900",
    textAlign: "center",
  },
  targetButton: {
    alignItems: "center",
    backgroundColor: "#2e7d32",
    borderRadius: 30,
    justifyContent: "center",
    minHeight: 150,
    marginTop: 18,
    padding: 18,
  },
  targetButtonText: {
    color: "#ffffff",
    fontSize: 34,
    fontWeight: "900",
  },
  tapMessage: {
    backgroundColor: "#f8fbf4",
    borderColor: "#dfe8d8",
    borderWidth: 1,
    borderRadius: 16,
    color: "#172218",
    fontSize: 15,
    fontWeight: "900",
    lineHeight: 21,
    marginTop: 14,
    padding: 12,
    textAlign: "center",
  },
  tapActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
  },
  startButton: {
    alignItems: "center",
    backgroundColor: "#2e7d32",
    borderRadius: 20,
    flex: 1,
    justifyContent: "center",
    minHeight: 58,
    paddingHorizontal: 14,
  },
  startButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "900",
  },
  resetButton: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: "#dfe8d8",
    borderRadius: 20,
    borderWidth: 1,
    flex: 1,
    justifyContent: "center",
    minHeight: 58,
    paddingHorizontal: 14,
  },
  resetButtonText: {
    color: "#172218",
    fontSize: 16,
    fontWeight: "900",
  },
  disabledButton: {
    opacity: 0.48,
  },
  attemptList: {
    gap: 10,
    marginTop: 18,
  },
  attemptRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f8fbf4",
    borderColor: "#dfe8d8",
    borderWidth: 1,
    borderRadius: 16,
    gap: 12,
    minHeight: 48,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  attemptLabel: {
    color: "#5f6f52",
    fontSize: 14,
    fontWeight: "900",
  },
  attemptValue: {
    color: "#172218",
    fontSize: 15,
    fontWeight: "900",
  },
  handModeRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 18,
  },
  handModeButton: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: "#dfe8d8",
    borderRadius: 18,
    borderWidth: 1,
    flex: 1,
    justifyContent: "center",
    minHeight: 54,
    paddingHorizontal: 12,
  },
  handModeButtonActive: {
    backgroundColor: "#172218",
    borderColor: "#172218",
  },
  handModeText: {
    color: "#172218",
    fontSize: 14,
    fontWeight: "900",
    textAlign: "center",
  },
  handModeTextActive: {
    color: "#ffffff",
  },
  comparisonGrid: {
    gap: 10,
    marginTop: 14,
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
