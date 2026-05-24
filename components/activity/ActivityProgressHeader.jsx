import { StyleSheet, Text, View } from "react-native";

export default function ActivityProgressHeader({
  currentStep,
  totalSteps,
  title,
}) {
  const progressPercent = `${((currentStep + 1) / totalSteps) * 100}%`;

  return (
    <View style={styles.progressCard}>
      <View style={styles.progressHeader}>
        <Text style={styles.progressStep}>
          Step {currentStep + 1} of {totalSteps}
        </Text>
        <Text style={styles.progressTitle}>{title}</Text>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: progressPercent }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
});
