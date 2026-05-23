import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import BottomNav from "../../components/BottomNav";
import TopBar from "../../components/TopBar";

const activitySections = [
  {
    title: "Engineering Challenges",
    startNumber: 1,
    activities: [
      {
        title: "Parachute Drop Challenge",
        area: "Engineering",
        accent: "#dcfce7",
        path: "/main/activity/parachute",
      },
      {
        title: "Sound Pollution Hunter",
        area: "Environment",
        accent: "#dbeafe",
        path: "/main/activity/sound",
      },
      {
        title: "Hand Fan Challenge",
        area: "Physics",
        accent: "#fef3c7",
      },
      {
        title: "Earthquake-Resistant Structure",
        area: "Earth Science",
        accent: "#ede9fe",
        path: "/main/activity/earthquake",
      },
    ],
  },
  {
    title: "Health and Medical Sciences",
    startNumber: 5,
    activities: [
      {
        title: "Human Performance Lab",
        area: "Biomechanics",
        accent: "#ffe4e6",
        path: "/main/activity/human-performance",
      },
      {
        title: "Reaction Board Challenge",
        area: "Neuroscience",
        accent: "#ccfbf1",
        path: "/main/activity/reaction-board",
      },
      {
        title: "Breathing Pace Trainer",
        area: "Medical Science",
        accent: "#e0f2fe",
      },
    ],
  },
];

export default function Activities() {
  const router = useRouter();

  return (
    <View style={styles.wrapper}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <TopBar title="Activities" eyebrow="Challenge Library" />

        <View style={styles.hero}>
          <Text style={styles.heroTitle}>Choose a mission.</Text>
          <Text style={styles.heroText}>
            Each task turns classroom materials into measurable STEMM data.
          </Text>
        </View>

        <View style={styles.list}>
          {activitySections.map((section) => (
            <View key={section.title} style={styles.section}>
              <Text style={styles.sectionTitle}>{section.title}</Text>

              {section.activities.map((activity, index) => {
                const isEnabled = !!activity.path;

                return (
                  <TouchableOpacity
                    key={activity.title}
                    style={[styles.card, !isEnabled && styles.disabledCard]}
                    activeOpacity={isEnabled ? 0.82 : 1}
                    disabled={!isEnabled}
                    onPress={
                      isEnabled ? () => router.push(activity.path) : undefined
                    }
                  >
                    <View
                      style={[
                        styles.badge,
                        { backgroundColor: activity.accent },
                      ]}
                    >
                      <Text style={styles.badgeText}>
                        {String(section.startNumber + index).padStart(2, "0")}
                      </Text>
                    </View>
                    <View style={styles.cardText}>
                      <Text style={styles.itemTitle}>{activity.title}</Text>
                      <Text style={styles.itemArea}>{activity.area}</Text>
                    </View>
                    <Text
                      style={[
                        styles.chevron,
                        !isEnabled && styles.comingSoonText,
                      ]}
                    >
                      {isEnabled ? "Start" : "Coming Soon"}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
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
    gap: 18,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    color: "#172218",
    fontSize: 19,
    fontWeight: "900",
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
  disabledCard: {
    opacity: 0.72,
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
  comingSoonText: {
    color: "#8a9584",
  },
});
