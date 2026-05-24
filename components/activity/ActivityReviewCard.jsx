import { StyleSheet, Text, View } from "react-native";

export default function ActivityReviewCard({
  title,
  subtitle,
  rows = [],
  children,
}) {
  return (
    <View style={styles.reviewCard}>
      <Text style={styles.reviewTitle}>{title}</Text>
      {subtitle ? <Text style={styles.reviewSubtitle}>{subtitle}</Text> : null}

      {rows.length > 0 ? (
        <View style={styles.rowList}>
          {rows.map((row) => (
            <View key={row.label} style={styles.reviewRow}>
              <Text style={styles.reviewLabel}>{row.label}</Text>
              <Text style={styles.reviewValue}>{row.value || "--"}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  reviewCard: {
    backgroundColor: "#f8fbf4",
    borderColor: "#dfe8d8",
    borderRadius: 22,
    borderWidth: 1,
    marginTop: 16,
    padding: 16,
  },
  reviewTitle: {
    color: "#172218",
    fontSize: 19,
    fontWeight: "900",
    lineHeight: 25,
  },
  reviewSubtitle: {
    color: "#5f6f52",
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
    marginTop: 5,
  },
  rowList: {
    marginTop: 12,
  },
  reviewRow: {
    borderTopColor: "#edf2e8",
    borderTopWidth: 1,
    paddingVertical: 11,
  },
  reviewLabel: {
    color: "#5f6f52",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  reviewValue: {
    color: "#172218",
    fontSize: 15,
    fontWeight: "800",
    lineHeight: 22,
    marginTop: 4,
  },
});
