import { View, Text, StyleSheet } from "react-native";

export default function TopBar({ title, eyebrow }) {
  return (
    <View style={styles.container}>
      {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    marginBottom: 20,
  },
  eyebrow: {
    color: "#5f6f52",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  title: {
    fontSize: 20,
    fontWeight: "900",
    color: "#172218",
    textAlign: "center",
  },
});
