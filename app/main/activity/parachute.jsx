import { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import TopBar from "../../../components/TopBar";

const equipment = [
  "Plastic bag or lightweight fabric",
  "String",
  "Tape",
  "Small test weight",
  "Ruler or measuring tape",
  "Timer",
];

const instructions = [
  "Build a parachute canopy using the plastic bag or lightweight fabric.",
  "Attach equal lengths of string to the canopy and connect them to the test weight.",
  "Drop the parachute from the same height for every trial.",
  "Record how long the parachute takes to reach the ground.",
  "Adjust one design feature, then test again and compare the results.",
];

export default function ParachuteChallenge() {
  const [completedSteps, setCompletedSteps] = useState([]);

  const toggleStep = (stepIndex) => {
    setCompletedSteps((current) =>
      current.includes(stepIndex)
        ? current.filter((item) => item !== stepIndex)
        : [...current, stepIndex],
    );
  };

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <TopBar title="Parachute Drop Challenge" eyebrow="Engineering + Physics" />

        <View style={styles.hero}>
          <Text style={styles.category}>Engineering + Physics</Text>
          <Text style={styles.title}>Parachute Drop Challenge</Text>
          <Text style={styles.heroText}>
            Design, drop, measure, and improve a parachute so it falls slowly
            and safely.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Overview</Text>
          <Text style={styles.cardTitle}>Your Mission</Text>
          <Text style={styles.cardText}>
            Explore how canopy size, shape, and string length affect air
            resistance. Your goal is to create a parachute that gives the test
            weight the longest controlled descent.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Equipment</Text>
          <View style={styles.equipmentGrid}>
            {equipment.map((item) => (
              <View key={item} style={styles.equipmentPill}>
                <View style={styles.dot} />
                <Text style={styles.equipmentText}>{item}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Instructions</Text>
          <View style={styles.steps}>
            {instructions.map((instruction, index) => {
              const isComplete = completedSteps.includes(index);

              return (
                <TouchableOpacity
                  key={instruction}
                  style={[styles.stepRow, isComplete && styles.stepRowDone]}
                  onPress={() => toggleStep(index)}
                  activeOpacity={0.82}
                >
                  <View
                    style={[styles.stepNumber, isComplete && styles.stepNumberDone]}
                  >
                    <Text
                      style={[
                        styles.stepNumberText,
                        isComplete && styles.stepNumberTextDone,
                      ]}
                    >
                      {index + 1}
                    </Text>
                  </View>
                  <Text style={[styles.stepText, isComplete && styles.stepTextDone]}>
                    {instruction}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </View>
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
    paddingBottom: 28,
  },
  hero: {
    backgroundColor: "#172218",
    borderRadius: 30,
    padding: 22,
    marginBottom: 16,
  },
  category: {
    color: "#f0ff75",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.3,
    textTransform: "uppercase",
  },
  title: {
    marginTop: 8,
    color: "#ffffff",
    fontSize: 34,
    lineHeight: 38,
    fontWeight: "900",
  },
  heroText: {
    marginTop: 10,
    color: "#dbe7d4",
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "700",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 26,
    padding: 20,
    marginBottom: 14,
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
    textTransform: "uppercase",
    marginBottom: 8,
  },
  cardTitle: {
    color: "#172218",
    fontSize: 22,
    fontWeight: "900",
    marginBottom: 8,
  },
  cardText: {
    color: "#5f6f52",
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "700",
  },
  equipmentGrid: {
    gap: 10,
  },
  equipmentPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e8f5e9",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#2e7d32",
    marginRight: 10,
  },
  equipmentText: {
    flex: 1,
    color: "#244b2a",
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "800",
  },
  steps: {
    gap: 12,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#f8fbf4",
    borderColor: "#dfe8d8",
    borderWidth: 1,
    borderRadius: 20,
    padding: 14,
  },
  stepRowDone: {
    backgroundColor: "#dcfce7",
    borderColor: "#bbf7d0",
  },
  stepNumber: {
    width: 34,
    height: 34,
    borderRadius: 13,
    backgroundColor: "#172218",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  stepNumberDone: {
    backgroundColor: "#2e7d32",
  },
  stepNumberText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "900",
  },
  stepNumberTextDone: {
    color: "#ffffff",
  },
  stepText: {
    flex: 1,
    color: "#172218",
    fontSize: 15,
    lineHeight: 21,
    fontWeight: "800",
  },
  stepTextDone: {
    color: "#166534",
  },
});
