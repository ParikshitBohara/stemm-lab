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
import { Audio } from "expo-av";
import * as Location from "expo-location";
import { StatusBar } from "expo-status-bar";
import MapView, { Callout, Marker } from "react-native-maps";
import TopBar from "../../../components/TopBar";
import { sendActivitySavedNotification } from "../../../utils/notifications";

const MAX_MAPPED_READINGS = 3;
const MAP_DELTA = 0.004;

const steps = [
  "Overview",
  "Equipment",
  "Instructions",
  "Sound Meter",
  "Results",
  "Map Loud and Quiet Zones",
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

const estimateDbFromMetering = (metering) => {
  const normalized = Math.max(0, Math.min(1, (metering + 80) / 80));
  return Math.round(30 + normalized * 70);
};

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
  const [recording, setRecording] = useState(null);
  const [isMeasuring, setIsMeasuring] = useState(false);
  const [liveEstimatedDb, setLiveEstimatedDb] = useState(null);
  const [savedMeasurement, setSavedMeasurement] = useState("");
  const [permissionMessage, setPermissionMessage] = useState("");
  const [measurementError, setMeasurementError] = useState("");
  const [activityMessage, setActivityMessage] = useState("");
  const [activityError, setActivityError] = useState("");
  const [locationPermissionStatus, setLocationPermissionStatus] = useState("");
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [accuracy, setAccuracy] = useState(null);
  const [capturedAt, setCapturedAt] = useState("");
  const [locationError, setLocationError] = useState("");
  const [mappedReadings, setMappedReadings] = useState([]);
  const [mapMessage, setMapMessage] = useState("");
  const [mapError, setMapError] = useState("");
  const recordingRef = useRef(null);

  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;
  const progressPercent = `${((currentStep + 1) / steps.length) * 100}%`;
  const locationTag = {
    latitude,
    longitude,
    accuracy,
    capturedAt,
    permissionStatus: locationPermissionStatus,
  };
  const hasLocationTag =
    locationTag.latitude !== null && locationTag.longitude !== null;
  const newestMappedReading =
    mappedReadings.length > 0
      ? mappedReadings[mappedReadings.length - 1]
      : null;
  const loudestReading =
    mappedReadings.length > 0
      ? mappedReadings.reduce((loudest, reading) =>
          reading.estimatedDb > loudest.estimatedDb ? reading : loudest,
        )
      : null;
  const quietestReading =
    mappedReadings.length > 0
      ? mappedReadings.reduce((quietest, reading) =>
          reading.estimatedDb < quietest.estimatedDb ? reading : quietest,
        )
      : null;
  const mapRegion = newestMappedReading
    ? {
        latitude: newestMappedReading.latitude,
        longitude: newestMappedReading.longitude,
        latitudeDelta: MAP_DELTA,
        longitudeDelta: MAP_DELTA,
      }
    : null;

  useEffect(() => {
    return () => {
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync().catch(() => {});
      }
    };
  }, []);

  const goBack = () => {
    Keyboard.dismiss();
    setCurrentStep((step) => Math.max(step - 1, 0));
  };

  const goNext = () => {
    Keyboard.dismiss();
    setCurrentStep((step) => Math.min(step + 1, steps.length - 1));
  };

  const handleRecordingStatus = (status) => {
    if (typeof status.metering === "number") {
      setLiveEstimatedDb(estimateDbFromMetering(status.metering));
    }
  };

  const startMeasuring = async () => {
    setMeasurementError("");

    try {
      const permission = await Audio.requestPermissionsAsync();

      if (!permission.granted) {
        setPermissionMessage("Microphone permission was not granted.");
        return;
      }

      setPermissionMessage("Microphone permission granted.");
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        {
          ...Audio.RecordingOptionsPresets.HIGH_QUALITY,
          isMeteringEnabled: true,
        },
        handleRecordingStatus,
        300,
      );

      recordingRef.current = newRecording;
      setRecording(newRecording);
      setIsMeasuring(true);
      setSavedMeasurement("");
    } catch (_error) {
      setMeasurementError("Unable to start microphone measurement.");
    }
  };

  const stopMeasuring = async () => {
    setMeasurementError("");

    if (!recordingRef.current && !recording) {
      setIsMeasuring(false);
      return;
    }

    try {
      const activeRecording = recordingRef.current || recording;
      activeRecording.setOnRecordingStatusUpdate(null);
      await activeRecording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
    } catch (_error) {
      setMeasurementError("Measurement stopped. Start again if needed.");
    } finally {
      recordingRef.current = null;
      setRecording(null);
      setIsMeasuring(false);
    }
  };

  const saveMeasurement = () => {
    Keyboard.dismiss();

    if (liveEstimatedDb === null) {
      setMeasurementError("Start measuring before saving a reading.");
      return;
    }

    const savedValue = `${liveEstimatedDb}`;
    setEstimatedDbResult(savedValue);
    setSavedMeasurement(`${savedValue} dB estimate saved locally.`);
    setMeasurementError("");
  };

  const tagCurrentLocation = async () => {
    Keyboard.dismiss();
    setLocationError("");

    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      setLocationPermissionStatus(permission.status);

      if (permission.status !== "granted") {
        setLocationError(
          "Location permission is required to map where this classroom sound measurement was taken.",
        );
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setLatitude(currentLocation.coords.latitude);
      setLongitude(currentLocation.coords.longitude);
      setAccuracy(currentLocation.coords.accuracy);
      setCapturedAt(
        new Date(currentLocation.timestamp || Date.now()).toISOString(),
      );
    } catch (_error) {
      setLocationError(
        "Unable to tag this location right now. Check device location settings and try again.",
      );
    }
  };

  const saveActivity = () => {
    Keyboard.dismiss();
    setActivityError("");
    setActivityMessage("");

    if (
      !prediction.trim() ||
      !actionTested.trim() ||
      !estimatedDbResult.trim() ||
      !reflection.trim()
    ) {
      setActivityError(
        "Add your prediction, action tested, estimated dB, and reflection before saving.",
      );
      return;
    }

    setActivityMessage("Sound Pollution Hunter activity saved for demo.");
    sendActivitySavedNotification({
      title: "STEMM Lab: Activity saved",
      body: "Your activity result was saved for demo.",
    }).catch(() => undefined);
  };

  const formatCoordinate = (value) =>
    value === null ? "--" : value.toFixed(6);

  const formatAccuracy = (value) =>
    typeof value === "number" ? `${Math.round(value)} m` : "--";

  const formatCapturedAt = (value) =>
    value ? new Date(value).toLocaleString() : "--";

  const formatReadingDb = (value) =>
    Number.isFinite(value) ? `${Math.round(value)} dB` : "--";

  const getMarkerColor = (value) => {
    if (value >= 70) {
      return "#dc2626";
    }

    if (value <= 50) {
      return "#2e7d32";
    }

    return "#f59e0b";
  };

  const describeReading = (reading) =>
    reading ? `${reading.locationName}: ${formatReadingDb(reading.estimatedDb)}` : "--";

  const addReadingToMap = () => {
    Keyboard.dismiss();
    setMapMessage("");
    setMapError("");

    if (mappedReadings.length >= MAX_MAPPED_READINGS) {
      setMapError("Maximum of three classroom zones recorded.");
      return;
    }

    if (!actionTested.trim()) {
      setMapError("Add an action or activity name before mapping this reading.");
      return;
    }

    if (!estimatedDbResult.trim()) {
      setMapError("Add an estimated dB reading before mapping this zone.");
      return;
    }

    const numericDb = Number.parseFloat(estimatedDbResult);

    if (!Number.isFinite(numericDb)) {
      setMapError("Enter a valid estimated dB number before mapping this zone.");
      return;
    }

    if (!hasLocationTag) {
      setMapError("Tag the current GPS location before mapping this reading.");
      return;
    }

    const nextReading = {
      id: `${Date.now()}-${mappedReadings.length + 1}`,
      actionTested: actionTested.trim(),
      estimatedDb: numericDb,
      locationName: location.trim() || "Unnamed classroom zone",
      latitude: locationTag.latitude,
      longitude: locationTag.longitude,
      accuracy: locationTag.accuracy,
      capturedAt: locationTag.capturedAt || new Date().toISOString(),
    };

    const nextCount = mappedReadings.length + 1;

    setMappedReadings((readings) => [...readings, nextReading]);
    setMapMessage(
      nextCount === MAX_MAPPED_READINGS
        ? "Maximum of three classroom zones recorded."
        : "Reading added to map. Tap Next to view loud and quiet zones.",
    );
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
      <Text style={styles.cardLabel}>Sound Meter</Text>
      <Text style={styles.cardTitle}>Estimated Sound Level</Text>
      <Text style={styles.cardText}>
        Use the phone microphone to estimate the current sound level. Phone
        microphones are not laboratory calibrated, so treat this as a classroom
        estimate rather than a certified measurement.
      </Text>
      <View style={styles.meterBox}>
        <Text style={styles.meterValue}>
          {liveEstimatedDb === null ? "--" : liveEstimatedDb}
        </Text>
        <Text style={styles.meterLabel}>Estimated dB</Text>
      </View>

      {permissionMessage ? (
        <Text style={styles.statusText}>{permissionMessage}</Text>
      ) : null}
      {measurementError ? (
        <Text style={styles.errorText}>{measurementError}</Text>
      ) : null}
      {savedMeasurement ? (
        <Text style={styles.savedText}>{savedMeasurement}</Text>
      ) : null}

      <View style={styles.measurementActions}>
        <TouchableOpacity
          style={[
            styles.measureButton,
            isMeasuring && styles.measureButtonDisabled,
          ]}
          onPress={startMeasuring}
          activeOpacity={0.86}
          disabled={isMeasuring}
        >
          <Text style={styles.measureButtonText}>Start Measuring</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.stopButton,
            !isMeasuring && styles.measureButtonDisabled,
          ]}
          onPress={stopMeasuring}
          activeOpacity={0.86}
          disabled={!isMeasuring}
        >
          <Text style={styles.stopButtonText}>Stop Measuring</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.secondaryAction}
        onPress={saveMeasurement}
        activeOpacity={0.86}
      >
        <Text style={styles.secondaryActionText}>Save Measurement</Text>
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
        <View style={styles.locationCard}>
          <Text style={styles.locationTitle}>GPS Location Tag</Text>
          <Text style={styles.locationNote}>
            Location is used only to tag where this classroom sound reading was
            measured.
          </Text>

          <TouchableOpacity
            style={styles.locationButton}
            onPress={tagCurrentLocation}
            activeOpacity={0.86}
          >
            <Text style={styles.locationButtonText}>Tag Current Location</Text>
          </TouchableOpacity>

          {locationError ? (
            <Text style={styles.errorText}>{locationError}</Text>
          ) : null}

          {hasLocationTag ? (
            <View style={styles.locationResult}>
              <View style={styles.locationRow}>
                <Text style={styles.locationLabel}>Latitude</Text>
                <Text style={styles.locationValue}>
                  {formatCoordinate(locationTag.latitude)}
                </Text>
              </View>
              <View style={styles.locationRow}>
                <Text style={styles.locationLabel}>Longitude</Text>
                <Text style={styles.locationValue}>
                  {formatCoordinate(locationTag.longitude)}
                </Text>
              </View>
              <View style={styles.locationRow}>
                <Text style={styles.locationLabel}>Accuracy</Text>
                <Text style={styles.locationValue}>
                  {formatAccuracy(locationTag.accuracy)}
                </Text>
              </View>
              <View style={styles.locationRow}>
                <Text style={styles.locationLabel}>Captured</Text>
                <Text style={styles.locationValue}>
                  {formatCapturedAt(locationTag.capturedAt)}
                </Text>
              </View>
            </View>
          ) : null}
        </View>
        {renderInput({
          label: "Estimated dB result",
          value: estimatedDbResult,
          onChangeText: setEstimatedDbResult,
          placeholder: "Example: 65",
          keyboardType: "decimal-pad",
        })}
        <View style={styles.mapActionCard}>
          <Text style={styles.mapActionTitle}>Classroom Zone Map</Text>
          <Text style={styles.mapActionText}>
            Add up to three sound readings after you have an action, an
            estimated dB result, and a tagged GPS location.
          </Text>
          <TouchableOpacity
            style={[
              styles.mapActionButton,
              mappedReadings.length >= MAX_MAPPED_READINGS &&
                styles.mapActionButtonDisabled,
            ]}
            onPress={addReadingToMap}
            activeOpacity={0.86}
            disabled={mappedReadings.length >= MAX_MAPPED_READINGS}
          >
            <Text style={styles.mapActionButtonText}>Add Reading to Map</Text>
          </TouchableOpacity>
          <Text style={styles.mapCountText}>
            {mappedReadings.length} of {MAX_MAPPED_READINGS} zones recorded
          </Text>
          {mapError ? <Text style={styles.errorText}>{mapError}</Text> : null}
          {mapMessage ? (
            <Text style={styles.savedText}>{mapMessage}</Text>
          ) : null}
        </View>
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

  const renderMapZones = () => (
    <View style={styles.card}>
      <Text style={styles.cardLabel}>Map Loud and Quiet Zones</Text>
      <Text style={styles.cardTitle}>Classroom Sound Map</Text>
      <Text style={styles.cardText}>
        Compare the sound zones your team recorded. The newest GPS-tagged
        reading stays centred on the map.
      </Text>

      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Mapped readings</Text>
          <Text style={styles.summaryValue}>
            {mappedReadings.length}/{MAX_MAPPED_READINGS}
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Loudest zone</Text>
          <Text style={styles.summaryValue}>
            {describeReading(loudestReading)}
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Quietest zone</Text>
          <Text style={styles.summaryValue}>
            {describeReading(quietestReading)}
          </Text>
        </View>
      </View>

      {mappedReadings.length === 0 || !mapRegion ? (
        <Text style={styles.emptyMapText}>
          Capture a location-tagged sound reading to display it on the map.
        </Text>
      ) : (
        <>
          <View style={styles.mapShell}>
            <MapView
              style={styles.map}
              region={mapRegion}
              scrollEnabled={false}
              zoomEnabled={false}
              rotateEnabled={false}
              pitchEnabled={false}
            >
              {mappedReadings.map((reading) => (
                <Marker
                  key={reading.id}
                  coordinate={{
                    latitude: reading.latitude,
                    longitude: reading.longitude,
                  }}
                  pinColor={getMarkerColor(reading.estimatedDb)}
                >
                  <Callout tooltip={false}>
                    <View style={styles.callout}>
                      <Text style={styles.calloutTitle}>
                        {reading.actionTested}
                      </Text>
                      <Text style={styles.calloutText}>
                        Estimated dB: {formatReadingDb(reading.estimatedDb)}
                      </Text>
                      <Text style={styles.calloutText}>
                        Location: {reading.locationName}
                      </Text>
                    </View>
                  </Callout>
                </Marker>
              ))}
            </MapView>
          </View>

          <View style={styles.readingList}>
            {mappedReadings.map((reading, index) => (
              <View key={reading.id} style={styles.readingRow}>
                <Text style={styles.readingBadge}>{index + 1}</Text>
                <View style={styles.readingDetails}>
                  <Text style={styles.readingTitle}>
                    {reading.locationName}
                  </Text>
                  <Text style={styles.readingText}>
                    {reading.actionTested} - {formatReadingDb(reading.estimatedDb)}
                  </Text>
                  <Text style={styles.readingMeta}>
                    Accuracy {formatAccuracy(reading.accuracy)} -{" "}
                    {formatCapturedAt(reading.capturedAt)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </>
      )}
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
      {activityError ? (
        <Text style={styles.errorText}>{activityError}</Text>
      ) : null}
      {activityMessage ? (
        <Text style={styles.activitySuccessText}>{activityMessage}</Text>
      ) : null}
      <TouchableOpacity
        style={styles.saveActivityButton}
        onPress={saveActivity}
        activeOpacity={0.86}
      >
        <Text style={styles.saveActivityButtonText}>Save Activity</Text>
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
        return renderSoundMeter();
      case 4:
        return renderResults();
      case 5:
        return renderMapZones();
      case 6:
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
  statusText: {
    backgroundColor: "#e8f5e9",
    borderRadius: 16,
    color: "#166534",
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 20,
    marginTop: 14,
    padding: 12,
  },
  errorText: {
    backgroundColor: "#ffe3df",
    borderRadius: 16,
    color: "#9f1d14",
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 20,
    marginTop: 14,
    padding: 12,
  },
  savedText: {
    backgroundColor: "#edf6ff",
    borderRadius: 16,
    color: "#17456b",
    fontSize: 14,
    fontWeight: "900",
    lineHeight: 20,
    marginTop: 14,
    padding: 12,
  },
  activitySuccessText: {
    backgroundColor: "#dcfce7",
    borderRadius: 16,
    color: "#166534",
    fontSize: 15,
    fontWeight: "900",
    lineHeight: 21,
    marginTop: 18,
    padding: 13,
  },
  measurementActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
  },
  measureButton: {
    alignItems: "center",
    backgroundColor: "#2e7d32",
    borderRadius: 18,
    flex: 1,
    justifyContent: "center",
    minHeight: 56,
    paddingHorizontal: 12,
  },
  stopButton: {
    alignItems: "center",
    backgroundColor: "#ffe3df",
    borderColor: "#ffb4aa",
    borderRadius: 18,
    borderWidth: 1,
    flex: 1,
    justifyContent: "center",
    minHeight: 56,
    paddingHorizontal: 12,
  },
  measureButtonDisabled: {
    opacity: 0.48,
  },
  measureButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "900",
    textAlign: "center",
  },
  stopButtonText: {
    color: "#9f1d14",
    fontSize: 14,
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
  locationCard: {
    backgroundColor: "#f8fbf4",
    borderColor: "#dfe8d8",
    borderWidth: 1,
    borderRadius: 22,
    padding: 16,
    marginTop: 18,
  },
  locationTitle: {
    color: "#172218",
    fontSize: 18,
    fontWeight: "900",
  },
  locationNote: {
    color: "#5f6f52",
    fontSize: 14,
    lineHeight: 21,
    fontWeight: "700",
    marginTop: 6,
  },
  locationButton: {
    alignItems: "center",
    backgroundColor: "#172218",
    borderRadius: 18,
    justifyContent: "center",
    minHeight: 56,
    marginTop: 14,
    paddingHorizontal: 16,
  },
  locationButtonText: {
    color: "#f0ff75",
    fontSize: 15,
    fontWeight: "900",
    textAlign: "center",
  },
  locationResult: {
    backgroundColor: "#ffffff",
    borderColor: "#dfe8d8",
    borderWidth: 1,
    borderRadius: 18,
    marginTop: 14,
    padding: 14,
  },
  locationRow: {
    borderTopColor: "#edf2e8",
    borderTopWidth: 1,
    paddingVertical: 10,
  },
  locationLabel: {
    color: "#5f6f52",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  locationValue: {
    color: "#172218",
    fontSize: 15,
    fontWeight: "900",
    marginTop: 4,
  },
  mapActionCard: {
    backgroundColor: "#edf6ff",
    borderColor: "#cfe7ff",
    borderWidth: 1,
    borderRadius: 22,
    padding: 16,
    marginTop: 18,
  },
  mapActionTitle: {
    color: "#17456b",
    fontSize: 18,
    fontWeight: "900",
  },
  mapActionText: {
    color: "#42667f",
    fontSize: 14,
    lineHeight: 21,
    fontWeight: "700",
    marginTop: 6,
  },
  mapActionButton: {
    alignItems: "center",
    backgroundColor: "#1565c0",
    borderRadius: 18,
    justifyContent: "center",
    minHeight: 56,
    marginTop: 14,
    paddingHorizontal: 16,
  },
  mapActionButtonDisabled: {
    opacity: 0.48,
  },
  mapActionButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "900",
    textAlign: "center",
  },
  mapCountText: {
    color: "#17456b",
    fontSize: 13,
    fontWeight: "900",
    marginTop: 10,
    textTransform: "uppercase",
  },
  summaryCard: {
    backgroundColor: "#f8fbf4",
    borderColor: "#dfe8d8",
    borderWidth: 1,
    borderRadius: 22,
    padding: 16,
    marginTop: 18,
  },
  summaryRow: {
    borderTopColor: "#edf2e8",
    borderTopWidth: 1,
    paddingVertical: 11,
  },
  summaryLabel: {
    color: "#5f6f52",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  summaryValue: {
    color: "#172218",
    fontSize: 16,
    fontWeight: "900",
    lineHeight: 22,
    marginTop: 4,
  },
  emptyMapText: {
    backgroundColor: "#edf6ff",
    borderRadius: 18,
    color: "#17456b",
    fontSize: 15,
    fontWeight: "800",
    lineHeight: 22,
    marginTop: 18,
    padding: 14,
  },
  mapShell: {
    borderColor: "#dfe8d8",
    borderWidth: 1,
    borderRadius: 24,
    height: 260,
    marginTop: 18,
    overflow: "hidden",
  },
  map: {
    flex: 1,
  },
  callout: {
    maxWidth: 220,
    padding: 4,
  },
  calloutTitle: {
    color: "#172218",
    fontSize: 15,
    fontWeight: "900",
    marginBottom: 4,
  },
  calloutText: {
    color: "#5f6f52",
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18,
  },
  readingList: {
    gap: 10,
    marginTop: 16,
  },
  readingRow: {
    alignItems: "flex-start",
    backgroundColor: "#f8fbf4",
    borderColor: "#dfe8d8",
    borderWidth: 1,
    borderRadius: 18,
    flexDirection: "row",
    padding: 13,
  },
  readingBadge: {
    backgroundColor: "#172218",
    borderRadius: 14,
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "900",
    marginRight: 11,
    minWidth: 34,
    overflow: "hidden",
    paddingHorizontal: 10,
    paddingVertical: 8,
    textAlign: "center",
  },
  readingDetails: {
    flex: 1,
  },
  readingTitle: {
    color: "#172218",
    fontSize: 16,
    fontWeight: "900",
  },
  readingText: {
    color: "#42667f",
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 20,
    marginTop: 4,
  },
  readingMeta: {
    color: "#5f6f52",
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 18,
    marginTop: 4,
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
  saveActivityButton: {
    alignItems: "center",
    backgroundColor: "#2e7d32",
    borderRadius: 20,
    justifyContent: "center",
    marginTop: 18,
    minHeight: 60,
    paddingHorizontal: 16,
  },
  saveActivityButtonText: {
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
