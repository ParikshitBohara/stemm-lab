import { StyleSheet, Text, View } from "react-native";

export default function ValidationMessage({ title = "Check your activity", items }) {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <View style={styles.validationCard}>
      <Text style={styles.validationTitle}>{title}</Text>
      {items.map((item) => (
        <View key={item} style={styles.validationRow}>
          <View style={styles.validationDot} />
          <Text style={styles.validationText}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  validationCard: {
    backgroundColor: "#ffe3df",
    borderColor: "#ffb4aa",
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 16,
    padding: 14,
  },
  validationTitle: {
    color: "#9f1d14",
    fontSize: 15,
    fontWeight: "900",
    marginBottom: 8,
  },
  validationRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 4,
  },
  validationDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#9f1d14",
    marginTop: 7,
    marginRight: 9,
  },
  validationText: {
    flex: 1,
    color: "#9f1d14",
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 20,
  },
});
