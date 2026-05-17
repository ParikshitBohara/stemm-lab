import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";

const items = [
  { key: "home", label: "Home", path: "/main/home" },
  { key: "activities", label: "Labs", path: "/main/activities" },
  { key: "leaderboard", label: "Leaders", path: "/main/leaderboard" },
  { key: "team", label: "Team", path: "/main/team-setup" },
  { key: "profile", label: "Profile", path: "/main/profile" },
];

export default function BottomNav({ current }) {
  const router = useRouter();

  return (
    <View style={styles.shell}>
      <View style={styles.container}>
        {items.map((item) => {
          const isActive = current === item.key;

          return (
            <TouchableOpacity
              key={item.key}
              style={[styles.item, isActive && styles.activeItem]}
              onPress={() => router.replace(item.path)}
            >
              <View style={[styles.dot, isActive && styles.activeDot]} />
              <Text style={[styles.text, isActive && styles.activeText]}>{item.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    backgroundColor: "transparent",
  },
  container: {
    flexDirection: "row",
    backgroundColor: "#172218",
    borderRadius: 28,
    padding: 8,
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
  },
  item: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 22,
  },
  activeItem: {
    backgroundColor: "#f0ff75",
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginBottom: 5,
    backgroundColor: "transparent",
  },
  activeDot: {
    backgroundColor: "#244b2a",
  },
  text: {
    color: "#dbe7d4",
    fontWeight: "800",
    fontSize: 10,
  },
  activeText: {
    color: "#172218",
  },
});
