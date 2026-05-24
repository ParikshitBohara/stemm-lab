import { useEffect, useRef, useState } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useEvent } from "expo";
import { CameraView, useCameraPermissions } from "expo-camera";
import { VideoView, useVideoPlayer } from "expo-video";

const MAX_RECORDING_SECONDS = 20;

function TrialVideoPreview({ trialName, uri }) {
  const [previewError, setPreviewError] = useState("");
  const player = useVideoPlayer(null, (videoPlayer) => {
    videoPlayer.loop = false;
  });
  const { status, error } = useEvent(player, "statusChange", {
    status: player.status,
    error: null,
  });

  useEffect(() => {
    let isMounted = true;

    const loadVideo = async () => {
      setPreviewError("");

      try {
        if (!uri) {
          await player.replaceAsync(null);
          return;
        }

        await player.replaceAsync({ uri });
      } catch (_error) {
        if (isMounted) {
          setPreviewError("This video could not be loaded for playback.");
        }
      }
    };

    loadVideo();

    return () => {
      isMounted = false;
    };
  }, [player, uri]);

  useEffect(() => {
    if (status === "error") {
      setPreviewError(
        error?.message || "This video could not be loaded for playback.",
      );
    }
  }, [error, status]);

  if (!uri) {
    return (
      <View style={styles.previewCard}>
        <Text style={styles.previewTitle}>{trialName}</Text>
        <View style={styles.emptyPreviewBox}>
          <Text style={styles.emptyPreviewText}>
            No video captured for this trial yet.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.previewCard}>
      <Text style={styles.previewTitle}>{trialName}</Text>
      {previewError ? (
        <View style={styles.emptyPreviewBox}>
          <Text style={styles.emptyPreviewText}>{previewError}</Text>
        </View>
      ) : (
        <VideoView
          key={uri}
          style={styles.videoPreview}
          player={player}
          nativeControls
          contentFit="contain"
          allowsFullscreen
        />
      )}
      <Text style={styles.localOnlyText}>
        Recorded on this device. Cloud upload is not connected yet.
      </Text>
    </View>
  );
}

export default function TrialVideoRecorder({
  trialSlots,
  videos,
  onVideoChange,
}) {
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [selectedTrialId, setSelectedTrialId] = useState(trialSlots[0]?.id || "");
  const [cameraOpen, setCameraOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [statusText, setStatusText] = useState("Ready to record");
  const [permissionError, setPermissionError] = useState("");
  const [recordingError, setRecordingError] = useState("");
  const cameraRef = useRef(null);
  const stopTimerRef = useRef(null);
  const isRecordingRef = useRef(false);
  const selectedTrial =
    trialSlots.find((trial) => trial.id === selectedTrialId) || trialSlots[0];
  const selectedVideoUri = selectedTrial ? videos[selectedTrial.id] : "";
  const recordedCount = trialSlots.filter((trial) => videos[trial.id]).length;

  useEffect(() => {
    isRecordingRef.current = isRecording;
  }, [isRecording]);

  useEffect(() => {
    const activeCamera = cameraRef.current;

    return () => {
      if (stopTimerRef.current) {
        clearTimeout(stopTimerRef.current);
      }

      if (activeCamera && isRecordingRef.current) {
        activeCamera.stopRecording();
      }
    };
  }, [cameraOpen]);

  const clearStopTimer = () => {
    if (stopTimerRef.current) {
      clearTimeout(stopTimerRef.current);
      stopTimerRef.current = null;
    }
  };

  const openCamera = async () => {
    setPermissionError("");
    setRecordingError("");

    const permission = cameraPermission?.granted
      ? cameraPermission
      : await requestCameraPermission();

    if (!permission.granted) {
      setPermissionError(
        "Camera permission is required to record parachute drop evidence.",
      );
      setCameraOpen(false);
      return;
    }

    setCameraOpen(true);
    setStatusText(selectedVideoUri ? "Video captured" : "Ready to record");
  };

  const startRecording = async () => {
    if (!cameraRef.current || isRecording) {
      return;
    }

    setPermissionError("");
    setRecordingError("");
    setStatusText("Recording...");
    setIsRecording(true);

    stopTimerRef.current = setTimeout(() => {
      cameraRef.current?.stopRecording();
    }, MAX_RECORDING_SECONDS * 1000);

    try {
      const video = await cameraRef.current.recordAsync({
        maxDuration: MAX_RECORDING_SECONDS,
      });

      if (video?.uri && selectedTrial) {
        onVideoChange(selectedTrial.id, video.uri);
        setStatusText("Video captured");
      } else {
        setStatusText("Ready to record");
      }
    } catch (_error) {
      setRecordingError("Video could not be recorded. Please try again.");
      setStatusText("Ready to record");
    } finally {
      clearStopTimer();
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (!cameraRef.current || !isRecording) {
      return;
    }

    cameraRef.current.stopRecording();
  };

  const retakeVideo = () => {
    if (!selectedTrial || isRecording) {
      return;
    }

    onVideoChange(selectedTrial.id, "");
    setStatusText("Ready to record");
    setRecordingError("");
  };

  const closeCamera = () => {
    if (cameraRef.current && isRecording) {
      cameraRef.current.stopRecording();
    }

    setCameraOpen(false);
  };

  const selectTrial = (trialId) => {
    if (isRecording) {
      return;
    }

    setSelectedTrialId(trialId);
    setPermissionError("");
    setRecordingError("");
    setStatusText(videos[trialId] ? "Video captured" : "Ready to record");
  };

  return (
    <View>
      <View style={styles.guidanceCard}>
        <Text style={styles.guidanceText}>
          Keep the phone steady and ensure the toy and landing area are visible
          before recording.
        </Text>
        <Text style={styles.guidanceText}>
          Video evidence recorded. Contact time may be entered after reviewing
          the video.
        </Text>
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>
          Videos recorded: {recordedCount} / {trialSlots.length}
        </Text>
        {trialSlots.map((trial) => {
          const isSelected = trial.id === selectedTrialId;
          const hasVideo = !!videos[trial.id];

          return (
            <TouchableOpacity
              key={trial.id}
              style={[
                styles.trialButton,
                isSelected && styles.trialButtonActive,
              ]}
              onPress={() => selectTrial(trial.id)}
              activeOpacity={0.86}
              disabled={isRecording}
            >
              <View style={styles.trialTextWrap}>
                <Text
                  style={[
                    styles.trialName,
                    isSelected && styles.trialNameActive,
                  ]}
                >
                  {trial.label}
                </Text>
                <Text
                  style={[
                    styles.trialStatus,
                    isSelected && styles.trialStatusActive,
                  ]}
                >
                  {hasVideo ? "Recorded" : "Not recorded"}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {permissionError ? (
        <View style={styles.messageCardError}>
          <Text style={styles.messageTextError}>{permissionError}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={openCamera}
            activeOpacity={0.86}
          >
            <Text style={styles.retryButtonText}>Retry Permission</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <View style={styles.captureCard}>
        <Text style={styles.selectedLabel}>Selected trial</Text>
        <Text style={styles.selectedTrial}>{selectedTrial?.label}</Text>
        <Text style={styles.captureStatus}>{statusText}</Text>

        {cameraOpen ? (
          <View style={styles.cameraShell}>
            <CameraView
              ref={cameraRef}
              style={styles.camera}
              facing="back"
              mode="video"
              mute
              active={cameraOpen}
              videoQuality="720p"
            />
          </View>
        ) : null}

        <View style={styles.controlGrid}>
          <TouchableOpacity
            style={[styles.controlButton, cameraOpen && styles.disabledButton]}
            onPress={openCamera}
            activeOpacity={0.86}
            disabled={cameraOpen}
          >
            <Text style={styles.controlButtonText}>Open Camera</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.controlButton,
              (!cameraOpen || isRecording) && styles.disabledButton,
            ]}
            onPress={startRecording}
            activeOpacity={0.86}
            disabled={!cameraOpen || isRecording}
          >
            <Text style={styles.controlButtonText}>Start Recording</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.stopButton,
              !isRecording && styles.disabledButton,
            ]}
            onPress={stopRecording}
            activeOpacity={0.86}
            disabled={!isRecording}
          >
            <Text style={styles.stopButtonText}>Stop Recording</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.secondaryButton,
              (!selectedVideoUri || isRecording) && styles.disabledButton,
            ]}
            onPress={retakeVideo}
            activeOpacity={0.86}
            disabled={!selectedVideoUri || isRecording}
          >
            <Text style={styles.secondaryButtonText}>Retake Video</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.secondaryButton,
              !cameraOpen && styles.disabledButton,
            ]}
            onPress={closeCamera}
            activeOpacity={0.86}
            disabled={!cameraOpen}
          >
            <Text style={styles.secondaryButtonText}>Close Camera</Text>
          </TouchableOpacity>
        </View>

        {recordingError ? (
          <Text style={styles.recordingError}>{recordingError}</Text>
        ) : null}
      </View>

      <TrialVideoPreview
        trialName={selectedTrial?.label || "Selected trial"}
        uri={selectedVideoUri}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  guidanceCard: {
    backgroundColor: "#f8fbf4",
    borderColor: "#dfe8d8",
    borderRadius: 20,
    borderWidth: 1,
    gap: 10,
    marginTop: 18,
    padding: 16,
  },
  guidanceText: {
    color: "#5f6f52",
    fontSize: 15,
    fontWeight: "800",
    lineHeight: 22,
  },
  summaryCard: {
    backgroundColor: "#edf6ff",
    borderColor: "#cfe7ff",
    borderRadius: 22,
    borderWidth: 1,
    gap: 10,
    marginTop: 18,
    padding: 16,
  },
  summaryTitle: {
    color: "#17456b",
    fontSize: 17,
    fontWeight: "900",
  },
  trialButton: {
    backgroundColor: "#ffffff",
    borderColor: "#dcecfb",
    borderRadius: 18,
    borderWidth: 1,
    minHeight: 62,
    padding: 13,
  },
  trialButtonActive: {
    backgroundColor: "#172218",
    borderColor: "#172218",
  },
  trialTextWrap: {
    gap: 5,
  },
  trialName: {
    color: "#172218",
    fontSize: 15,
    fontWeight: "900",
    lineHeight: 21,
  },
  trialNameActive: {
    color: "#ffffff",
  },
  trialStatus: {
    color: "#42667f",
    fontSize: 13,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  trialStatusActive: {
    color: "#f0ff75",
  },
  messageCardError: {
    backgroundColor: "#ffe3df",
    borderRadius: 18,
    marginTop: 16,
    padding: 14,
  },
  messageTextError: {
    color: "#9f1d14",
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 20,
  },
  retryButton: {
    alignItems: "center",
    backgroundColor: "#9f1d14",
    borderRadius: 16,
    justifyContent: "center",
    marginTop: 12,
    minHeight: 50,
    paddingHorizontal: 14,
  },
  retryButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "900",
  },
  captureCard: {
    backgroundColor: "#ffffff",
    borderColor: "#dfe8d8",
    borderRadius: 22,
    borderWidth: 1,
    marginTop: 18,
    padding: 16,
  },
  selectedLabel: {
    color: "#5f6f52",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  selectedTrial: {
    color: "#172218",
    fontSize: 20,
    fontWeight: "900",
    lineHeight: 26,
    marginTop: 4,
  },
  captureStatus: {
    backgroundColor: "#e8f5e9",
    borderRadius: 15,
    color: "#166534",
    fontSize: 14,
    fontWeight: "900",
    lineHeight: 20,
    marginTop: 12,
    padding: 11,
    textAlign: "center",
  },
  cameraShell: {
    backgroundColor: "#172218",
    borderRadius: 22,
    height: 300,
    marginTop: 16,
    overflow: "hidden",
  },
  camera: {
    flex: 1,
  },
  controlGrid: {
    gap: 10,
    marginTop: 16,
  },
  controlButton: {
    alignItems: "center",
    backgroundColor: "#2e7d32",
    borderRadius: 18,
    justifyContent: "center",
    minHeight: 56,
    paddingHorizontal: 14,
  },
  controlButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "900",
    textAlign: "center",
  },
  stopButton: {
    alignItems: "center",
    backgroundColor: "#ffe3df",
    borderColor: "#ffb4aa",
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 56,
    paddingHorizontal: 14,
  },
  stopButtonText: {
    color: "#9f1d14",
    fontSize: 15,
    fontWeight: "900",
  },
  secondaryButton: {
    alignItems: "center",
    backgroundColor: "#f0ff75",
    borderRadius: 18,
    justifyContent: "center",
    minHeight: 56,
    paddingHorizontal: 14,
  },
  secondaryButtonText: {
    color: "#172218",
    fontSize: 15,
    fontWeight: "900",
  },
  disabledButton: {
    opacity: 0.48,
  },
  recordingError: {
    backgroundColor: "#ffe3df",
    borderRadius: 16,
    color: "#9f1d14",
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 20,
    marginTop: 14,
    padding: 12,
  },
  previewCard: {
    backgroundColor: "#172218",
    borderRadius: 22,
    marginTop: 18,
    overflow: "hidden",
    padding: 14,
  },
  previewTitle: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "900",
    lineHeight: 23,
    marginBottom: 12,
  },
  videoPreview: {
    backgroundColor: "#000000",
    borderRadius: 16,
    height: 230,
    overflow: "hidden",
  },
  emptyPreviewBox: {
    alignItems: "center",
    backgroundColor: "#243326",
    borderColor: "#314333",
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 190,
    padding: 18,
  },
  emptyPreviewText: {
    color: "#dbe7d4",
    fontSize: 15,
    fontWeight: "800",
    lineHeight: 22,
    textAlign: "center",
  },
  localOnlyText: {
    color: "#dbe7d4",
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 19,
    marginTop: 12,
  },
});
