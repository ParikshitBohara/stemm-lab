import { useEffect, useMemo, useRef, useState } from "react";
import {
  Keyboard,
  PanResponder,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, { Circle, Polyline } from "react-native-svg";

const BOARD_HEIGHT = 300;
const TRACING_DURATION_MS = 7000;
const PATH_POINT_COUNT = 90;
const ACCURACY_TOLERANCE_PX = 34;
const MAX_TRACING_ATTEMPTS = 3;

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const getPathPoint = (progress, width, height) => {
  const paddingX = 28;
  const pathWidth = Math.max(width - paddingX * 2, 1);
  const centerY = height / 2;
  const amplitude = Math.min(58, height * 0.22);
  const x = paddingX + progress * pathWidth;
  const y =
    centerY +
    Math.sin(progress * Math.PI * 2.35) * amplitude +
    Math.sin(progress * Math.PI * 5.2) * amplitude * 0.18;

  return { x, y, progress };
};

const buildPathPoints = (width, height) =>
  Array.from({ length: PATH_POINT_COUNT }, (_, index) =>
    getPathPoint(index / (PATH_POINT_COUNT - 1), width, height),
  );

const getDistance = (a, b) =>
  Math.sqrt((a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y));

const findNearestPathPoint = (sample, pathPoints) =>
  pathPoints.reduce(
    (nearest, point) => {
      const distance = getDistance(sample, point);

      return distance < nearest.distance
        ? { distance, point }
        : nearest;
    },
    { distance: Number.POSITIVE_INFINITY, point: pathPoints[0] },
  );

const calculateTracingResult = ({ samples, pathPoints, startedAt, endedAt }) => {
  if (samples.length === 0 || pathPoints.length === 0) {
    return null;
  }

  let accurateSamples = 0;
  let behindDelayTotal = 0;
  let behindSamples = 0;

  samples.forEach((sample) => {
    const nearest = findNearestPathPoint(sample, pathPoints);
    const targetProgress = clamp(
      sample.elapsedMs / TRACING_DURATION_MS,
      0,
      1,
    );
    const progressLag = Math.max(0, targetProgress - nearest.point.progress);

    if (nearest.distance <= ACCURACY_TOLERANCE_PX) {
      accurateSamples += 1;
    }

    if (progressLag > 0) {
      behindDelayTotal += progressLag * TRACING_DURATION_MS;
      behindSamples += 1;
    }
  });

  return {
    accuracyPercentage: Math.round((accurateSamples / samples.length) * 100),
    averageDelayMs:
      behindSamples > 0 ? Math.round(behindDelayTotal / behindSamples) : 0,
    completionTimeSeconds: Number(((endedAt - startedAt) / 1000).toFixed(1)),
    sampleCount: samples.length,
  };
};

const formatDelay = (value) =>
  typeof value === "number" ? `${value} ms` : "--";

const formatAccuracy = (value) =>
  typeof value === "number" ? `${value}%` : "--";

export default function TracingChallengeBoard({
  attempts,
  onSaveAttempt,
  onAttemptChange,
}) {
  const [boardWidth, setBoardWidth] = useState(0);
  const [isTracing, setIsTracing] = useState(false);
  const [targetProgress, setTargetProgress] = useState(0);
  const [touchTrail, setTouchTrail] = useState([]);
  const [currentResult, setCurrentResult] = useState(null);
  const [message, setMessage] = useState("Ready to trace");

  const animationFrameRef = useRef(null);
  const startedAtRef = useRef(null);
  const isTracingRef = useRef(false);
  const samplesRef = useRef([]);
  const pathPointsRef = useRef([]);

  const pathPoints = useMemo(
    () => (boardWidth > 0 ? buildPathPoints(boardWidth, BOARD_HEIGHT) : []),
    [boardWidth],
  );
  const targetPoint =
    boardWidth > 0
      ? getPathPoint(targetProgress, boardWidth, BOARD_HEIGHT)
      : null;
  const pathPointString = pathPoints
    .map((point) => `${point.x},${point.y}`)
    .join(" ");
  const trailPointString = touchTrail
    .map((point) => `${point.x},${point.y}`)
    .join(" ");
  const canSaveAttempt =
    !!currentResult && !isTracing && attempts.length < MAX_TRACING_ATTEMPTS;
  const bestAccuracy =
    attempts.length > 0
      ? Math.max(...attempts.map((attempt) => attempt.accuracyPercentage))
      : null;
  const lowestDelay =
    attempts.length > 0
      ? Math.min(...attempts.map((attempt) => attempt.averageDelayMs))
      : null;

  useEffect(() => {
    pathPointsRef.current = pathPoints;
  }, [pathPoints]);

  useEffect(() => {
    isTracingRef.current = isTracing;
  }, [isTracing]);

  const cancelAnimation = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  };

  const completeAttempt = () => {
    cancelAnimation();
    const endedAt = Date.now();
    const result = calculateTracingResult({
      samples: samplesRef.current,
      pathPoints: pathPointsRef.current,
      startedAt: startedAtRef.current || endedAt,
      endedAt,
    });

    setIsTracing(false);
    isTracingRef.current = false;
    setTargetProgress(1);
    startedAtRef.current = null;

    if (!result) {
      setCurrentResult(null);
      setMessage("Attempt complete, but no touch movement was collected.");
      return;
    }

    setCurrentResult({
      attemptNumber: attempts.length + 1,
      ...result,
    });
    setMessage("Attempt complete - review your accuracy and delay.");
  };

  const runAnimationFrame = () => {
    if (!isTracingRef.current || !startedAtRef.current) {
      return;
    }

    const elapsed = Date.now() - startedAtRef.current;
    const progress = clamp(elapsed / TRACING_DURATION_MS, 0, 1);
    setTargetProgress(progress);

    if (progress >= 1) {
      completeAttempt();
      return;
    }

    animationFrameRef.current = requestAnimationFrame(runAnimationFrame);
  };

  const startTracingAttempt = () => {
    if (isTracing || attempts.length >= MAX_TRACING_ATTEMPTS || boardWidth <= 0) {
      return;
    }

    cancelAnimation();
    Keyboard.dismiss();
    samplesRef.current = [];
    startedAtRef.current = Date.now();
    setCurrentResult(null);
    setTouchTrail([]);
    setTargetProgress(0);
    setIsTracing(true);
    isTracingRef.current = true;
    setMessage("Tracing in progress...");
    onAttemptChange?.();
    animationFrameRef.current = requestAnimationFrame(runAnimationFrame);
  };

  const resetAttempt = () => {
    cancelAnimation();
    samplesRef.current = [];
    startedAtRef.current = null;
    setIsTracing(false);
    isTracingRef.current = false;
    setTargetProgress(0);
    setTouchTrail([]);
    setCurrentResult(null);
    setMessage("Ready to trace");
    onAttemptChange?.();
  };

  const saveAttempt = () => {
    if (!canSaveAttempt) {
      setMessage("Save an attempt after tracing with real finger movement.");
      return;
    }

    onSaveAttempt({
      id: `${Date.now()}-${currentResult.attemptNumber}`,
      ...currentResult,
    });
    setCurrentResult(null);
    setTouchTrail([]);
    setTargetProgress(0);
    setMessage(`Attempt ${currentResult.attemptNumber} saved.`);
  };

  const recordTouchSample = (nativeEvent) => {
    if (!isTracingRef.current || !startedAtRef.current) {
      return;
    }

    const x = clamp(nativeEvent.locationX, 0, boardWidth);
    const y = clamp(nativeEvent.locationY, 0, BOARD_HEIGHT);
    const sample = {
      x,
      y,
      elapsedMs: Date.now() - startedAtRef.current,
    };

    samplesRef.current = [...samplesRef.current, sample];
    setTouchTrail((trail) => [...trail.slice(-70), sample]);
    onAttemptChange?.();
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => isTracingRef.current,
      onMoveShouldSetPanResponder: () => isTracingRef.current,
      onPanResponderGrant: (event) => recordTouchSample(event.nativeEvent),
      onPanResponderMove: (event) => recordTouchSample(event.nativeEvent),
      onPanResponderTerminationRequest: () => false,
    }),
  ).current;

  useEffect(() => {
    return () => {
      cancelAnimation();
      samplesRef.current = [];
      isTracingRef.current = false;
    };
  }, []);

  return (
    <View style={styles.wrapper}>
      <Text style={styles.instructions}>
        Follow the moving target with your finger as accurately as possible.
        Keep the phone on a stable surface while tracing.
      </Text>

      <View
        style={styles.board}
        onLayout={(event) => setBoardWidth(event.nativeEvent.layout.width)}
        {...panResponder.panHandlers}
      >
        {boardWidth > 0 ? (
          <Svg width="100%" height={BOARD_HEIGHT}>
            <Polyline
              points={pathPointString}
              fill="none"
              stroke="#172218"
              strokeWidth={8}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Polyline
              points={pathPointString}
              fill="none"
              stroke="#f0ff75"
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {trailPointString ? (
              <Polyline
                points={trailPointString}
                fill="none"
                stroke="#1565c0"
                strokeWidth={5}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={0.78}
              />
            ) : null}
            <Circle
              cx={pathPoints[0]?.x || 0}
              cy={pathPoints[0]?.y || 0}
              r={10}
              fill="#2e7d32"
            />
            <Circle
              cx={pathPoints[pathPoints.length - 1]?.x || 0}
              cy={pathPoints[pathPoints.length - 1]?.y || 0}
              r={10}
              fill="#dc2626"
            />
            {targetPoint ? (
              <Circle
                cx={targetPoint.x}
                cy={targetPoint.y}
                r={14}
                fill="#1565c0"
                stroke="#ffffff"
                strokeWidth={4}
              />
            ) : null}
          </Svg>
        ) : null}

        <Text style={[styles.markerLabel, styles.startLabel]}>Start</Text>
        <Text style={[styles.markerLabel, styles.endLabel]}>End</Text>
      </View>

      <Text style={styles.message}>{message}</Text>
      {currentResult ? (
        <Text style={styles.saveHint}>
          Save this attempt to include it in your results.
        </Text>
      ) : null}

      <View style={styles.currentResultCard}>
        <Text style={styles.resultTitle}>Current Attempt</Text>
        <View style={styles.resultRow}>
          <Text style={styles.resultLabel}>Tracing Accuracy</Text>
          <Text style={styles.resultValue}>
            {formatAccuracy(currentResult?.accuracyPercentage)}
          </Text>
        </View>
        <View style={styles.resultRow}>
          <Text style={styles.resultLabel}>Average Delay</Text>
          <Text style={styles.resultValue}>
            {formatDelay(currentResult?.averageDelayMs)}
          </Text>
        </View>
        <View style={styles.resultRow}>
          <Text style={styles.resultLabel}>Completion Time</Text>
          <Text style={styles.resultValue}>
            {currentResult ? `${currentResult.completionTimeSeconds}s` : "--"}
          </Text>
        </View>
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[
            styles.primaryButton,
            (isTracing || attempts.length >= MAX_TRACING_ATTEMPTS) &&
              styles.disabledButton,
          ]}
          onPress={startTracingAttempt}
          activeOpacity={0.86}
          disabled={isTracing || attempts.length >= MAX_TRACING_ATTEMPTS}
        >
          <Text style={styles.primaryButtonText}>Start Tracing Attempt</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={resetAttempt}
          activeOpacity={0.86}
        >
          <Text style={styles.secondaryButtonText}>Reset Attempt</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[
          styles.saveButton,
          !canSaveAttempt && styles.disabledButton,
        ]}
        onPress={saveAttempt}
        activeOpacity={0.86}
        disabled={!canSaveAttempt}
      >
        <Text style={styles.saveButtonText}>Save Attempt</Text>
      </TouchableOpacity>

      <Text style={styles.note}>
        Accuracy and delay are estimates based on your finger movement relative
        to the moving target.
      </Text>

      <View style={styles.savedCard}>
        <Text style={styles.resultTitle}>Saved Tracing Attempts</Text>
        {attempts.length === 0 ? (
          <Text style={styles.emptyText}>No tracing attempts saved yet.</Text>
        ) : (
          attempts.map((attempt) => (
            <View key={attempt.id} style={styles.savedRow}>
              <Text style={styles.savedLabel}>
                Attempt {attempt.attemptNumber}
              </Text>
              <Text style={styles.savedValue}>
                {formatAccuracy(attempt.accuracyPercentage)} accuracy |{" "}
                {formatDelay(attempt.averageDelayMs)} delay |{" "}
                {attempt.completionTimeSeconds}s
              </Text>
            </View>
          ))
        )}

        <View style={styles.bestGrid}>
          <View style={styles.bestTile}>
            <Text style={styles.bestLabel}>Best tracing accuracy</Text>
            <Text style={styles.bestValue}>{formatAccuracy(bestAccuracy)}</Text>
          </View>
          <View style={styles.bestTile}>
            <Text style={styles.bestLabel}>Lowest tracing delay</Text>
            <Text style={styles.bestValue}>{formatDelay(lowestDelay)}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 14,
    marginTop: 16,
  },
  instructions: {
    color: "#5f6f52",
    fontSize: 15,
    fontWeight: "800",
    lineHeight: 22,
  },
  board: {
    backgroundColor: "#f8fbf4",
    borderColor: "#dfe8d8",
    borderRadius: 24,
    borderWidth: 1,
    height: BOARD_HEIGHT,
    overflow: "hidden",
  },
  markerLabel: {
    backgroundColor: "#ffffff",
    borderRadius: 999,
    color: "#172218",
    fontSize: 11,
    fontWeight: "900",
    overflow: "hidden",
    paddingHorizontal: 9,
    paddingVertical: 5,
    position: "absolute",
    top: 10,
  },
  startLabel: {
    left: 12,
  },
  endLabel: {
    right: 12,
  },
  message: {
    backgroundColor: "#edf6ff",
    borderRadius: 16,
    color: "#17456b",
    fontSize: 14,
    fontWeight: "900",
    lineHeight: 20,
    padding: 12,
    textAlign: "center",
  },
  saveHint: {
    color: "#2e7d32",
    fontSize: 13,
    fontWeight: "900",
    lineHeight: 18,
    textAlign: "center",
  },
  currentResultCard: {
    backgroundColor: "#ffffff",
    borderColor: "#dfe8d8",
    borderRadius: 20,
    borderWidth: 1,
    padding: 14,
  },
  resultTitle: {
    color: "#172218",
    fontSize: 17,
    fontWeight: "900",
    marginBottom: 8,
  },
  resultRow: {
    borderTopColor: "#edf2e8",
    borderTopWidth: 1,
    paddingVertical: 9,
  },
  resultLabel: {
    color: "#5f6f52",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  resultValue: {
    color: "#172218",
    fontSize: 17,
    fontWeight: "900",
    marginTop: 3,
  },
  actionRow: {
    gap: 10,
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: "#2e7d32",
    borderRadius: 18,
    justifyContent: "center",
    minHeight: 56,
    paddingHorizontal: 14,
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "900",
    textAlign: "center",
  },
  secondaryButton: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: "#dfe8d8",
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 54,
    paddingHorizontal: 14,
  },
  secondaryButtonText: {
    color: "#172218",
    fontSize: 15,
    fontWeight: "900",
    textAlign: "center",
  },
  saveButton: {
    alignItems: "center",
    backgroundColor: "#f0ff75",
    borderRadius: 18,
    justifyContent: "center",
    minHeight: 56,
    paddingHorizontal: 14,
  },
  saveButtonText: {
    color: "#172218",
    fontSize: 15,
    fontWeight: "900",
    textAlign: "center",
  },
  disabledButton: {
    opacity: 0.5,
  },
  note: {
    backgroundColor: "#fff8e1",
    borderColor: "#f6d365",
    borderRadius: 16,
    borderWidth: 1,
    color: "#7a4f01",
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 19,
    padding: 12,
  },
  savedCard: {
    backgroundColor: "#ffffff",
    borderColor: "#dfe8d8",
    borderRadius: 20,
    borderWidth: 1,
    padding: 14,
  },
  emptyText: {
    color: "#5f6f52",
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 20,
  },
  savedRow: {
    borderTopColor: "#edf2e8",
    borderTopWidth: 1,
    paddingVertical: 10,
  },
  savedLabel: {
    color: "#172218",
    fontSize: 14,
    fontWeight: "900",
  },
  savedValue: {
    color: "#5f6f52",
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 19,
    marginTop: 3,
  },
  bestGrid: {
    gap: 10,
    marginTop: 10,
  },
  bestTile: {
    backgroundColor: "#172218",
    borderRadius: 16,
    padding: 13,
  },
  bestLabel: {
    color: "#f0ff75",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  bestValue: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "900",
    marginTop: 4,
  },
});
