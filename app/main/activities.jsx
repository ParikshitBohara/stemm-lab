import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import TopBar from "../../components/TopBar";
import BottomNav from "../../components/BottomNav";

const activities = [
  { title: "Parachute Drop", area: "Engineering", accent: "#dcfce7", path: "/main/activity/parachute" },
  { title: "Sound Pollution Hunter", area: "Environment", accent: "#dbeafe" },
  { title: "Hand Fan Challenge", area: "Physics", accent: "#fef3c7" },
  { title: "Earthquake Structure", area: "Earth Science", accent: "#ede9fe" },
  { title: "Human Performance Lab", area: "Biomechanics", accent: "#ffe4e6" },
  { title: "Reaction Board", area: "Neuroscience", accent: "#ccfbf1" },
  { title: "Breathing Pace Trainer", area: "Medical Science", accent: "#e0f2fe" },
];

export default function Activities() {
  const router = useRouter();

  return (
    <View style={styles.wrapper}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <TopBar title="Activities" eyebrow="Challenge Library" />

        <View style={styles.hero}>
          <Text style={styles.heroTitle}>Choose a mission.</Text>
          <Text style={styles.heroText}>Each task turns classroom materials into measurable STEMM data.</Text>
        </View>

        <View style={styles.list}>
          {activities.map((activity, index) => (
            <TouchableOpacity
              key={activity.title}
              style={styles.card}
              activeOpacity={0.82}
              onPress={activity.path ? () => router.push(activity.path) : undefined}
            >
              <View style={[styles.badge, { backgroundColor: activity.accent }]}>
                <Text style={styles.badgeText}>{String(index + 1).padStart(2, "0")}</Text>
              </View>
              <View style={styles.cardText}>
                <Text style={styles.itemTitle}>{activity.title}</Text>
                <Text style={styles.itemArea}>{activity.area}</Text>
              </View>
              <Text style={styles.chevron}>Start</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <BottomNav current="activities" />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: "#f6f8ef",
  },
  container: {
    padding: 22,
    paddingTop: 58,
    paddingBottom: 24,
  },
  hero: {
    backgroundColor: "#172218",
    borderRadius: 30,
    padding: 22,
    marginBottom: 18,
  },
  heroTitle: {
    color: "#ffffff",
    fontSize: 32,
    fontWeight: "900",
    letterSpacing: -0.8,
  },
  heroText: {
    marginTop: 8,
    color: "#dbe7d4",
    fontSize: 15,
    lineHeight: 22,
  },
  list: {
    gap: 12,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 14,
    shadowColor: "#20351f",
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  badge: {
    width: 54,
    height: 54,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  badgeText: {
    color: "#172218",
    fontWeight: "900",
    fontSize: 16,
  },
  cardText: {
    flex: 1,
  },
  itemTitle: {
    color: "#172218",
    fontSize: 17,
    fontWeight: "900",
  },
  itemArea: {
    marginTop: 4,
    color: "#6b7665",
    fontWeight: "700",
  },
  chevron: {
    color: "#2e7d32",
    fontWeight: "900",
    fontSize: 13,
  },
});
