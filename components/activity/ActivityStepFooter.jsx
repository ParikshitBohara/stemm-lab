import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function ActivityStepFooter({
  isFirstStep,
  onBack,
  onNext,
  nextLabel = "Next",
  backLabel = "Back",
  nextDisabled = false,
}) {
  return (
    <View style={styles.navRow}>
      {isFirstStep ? (
        <View style={styles.navSpacer} />
      ) : (
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          activeOpacity={0.86}
        >
          <Text style={styles.backButtonText}>{backLabel}</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={[styles.nextButton, nextDisabled && styles.disabledButton]}
        onPress={onNext}
        activeOpacity={0.86}
        disabled={nextDisabled}
      >
        <Text style={styles.nextButtonText}>{nextLabel}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
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
  disabledButton: {
    opacity: 0.5,
  },
});
