import { useEffect,useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../firebase/firebaseConfig";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import TopBar from "../../components/TopBar";
import BottomNav from "../../components/BottomNav";

const tabs = [
  { key: "overall", label: "Overall" },
  { key: "activity", label: "By Activity" },
  { key: "improved", label: "Most Improved" },
];



const activityRankings = [
  {
    activity: "Parachute Drop",
    teams: [
      { team: "Gravity Squad", points: 310 },
      { team: "Lab Legends", points: 286 },
      { team: "Sky Testers", points: 264 },
    ],
  },
  {
    activity: "Sound Pollution Hunter",
    teams: [
      { team: "Noise Ninjas", points: 298 },
      { team: "Quiet Quest", points: 271 },
      { team: "Data Dashers", points: 255 },
    ],
  },
  {
    activity: "Reaction Board",
    teams: [
      { team: "Neuro Sparks", points: 304 },
      { team: "Fast Fingers", points: 289 },
      { team: "Signal Seekers", points: 268 },
    ],
  },
];

const improvedTeams = [
  { team: "Signal Seekers", improvement: 42, activity: "Reaction Board" },
  { team: "Quiet Quest", improvement: 37, activity: "Sound Pollution Hunter" },
  { team: "Sky Testers", improvement: 31, activity: "Parachute Drop" },
  { team: "Data Dashers", improvement: 26, activity: "All activities" },
  { team: "Lab Legends", improvement: 19, activity: "All activities" },
];

const getRankTone = (rank) => {
  if (rank === 1) {
    return styles.rankGold;
  }

  if (rank === 2) {
    return styles.rankSilver;
  }

  if (rank === 3) {
    return styles.rankBronze;
  }

  return styles.rankDefault;
};

function RankingCard({ rank, team, score, activity, scoreLabel = "Points" }) {
  return (
    <View style={styles.rankingCard}>
      <View style={[styles.rankBadge, getRankTone(rank)]}>
        <Text style={styles.rankBadgeText}>{rank}</Text>
      </View>

      <View style={styles.teamDetails}>
        <Text style={styles.metaLabel}>Team name</Text>
        <Text style={styles.teamName}>{team}</Text>
        <Text style={styles.activityText}>Activity: {activity}</Text>
      </View>

      <View style={styles.scoreBlock}>
        <Text style={styles.metaLabel}>{scoreLabel}</Text>
        <Text style={styles.scoreText}>{score}</Text>
      </View>
    </View>
  );
}

export default function Leaderboard() {
  
  const [activeTab, setActiveTab] = useState("overall");
  const [overallTeams, setOverallTeams] = useState([]);
  const [loading, setLoading] = useState(true);
useEffect(() => {
  const loadLeaderboard = async () => {
    try {
      const snapshot = await getDocs(collection(db, "results"));

      const results = [];

      snapshot.forEach((doc) => {
        const data = doc.data();

        results.push({
          team: data.teamName || "Unknown Team",
          points: data.score || 0,
          activity: data.activityName || "Unknown Activity",
        });
      });

      results.sort((a, b) => b.points - a.points);

      setOverallTeams(results);

    } catch (error) {
      console.log("Error loading leaderboard:", error);
    } finally {
      setLoading(false);
    }
  };

  loadLeaderboard();
}, []);
  const renderOverall = () => (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>Ranked by total points</Text>
      {overallTeams.map((item, index) => (
        <RankingCard
          key={item.team}
          rank={index + 1}
          team={item.team}
          score={item.points}
          activity={item.activity}
        />
      ))}
    </View>
  );

  const renderByActivity = () => (
    <View style={styles.section}>
      {activityRankings.map((group) => (
        <View key={group.activity} style={styles.activityGroup}>
          <Text style={styles.activityTitle}>{group.activity}</Text>
          {group.teams.map((item, index) => (
            <RankingCard
              key={`${group.activity}-${item.team}`}
              rank={index + 1}
              team={item.team}
              score={item.points}
              activity={group.activity}
            />
          ))}
        </View>
      ))}
    </View>
  );

  const renderMostImproved = () => (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>Ranked by improvement percentage</Text>
      {improvedTeams.map((item, index) => (
        <RankingCard
          key={item.team}
          rank={index + 1}
          team={item.team}
          score={`${item.improvement}%`}
          activity={item.activity}
          scoreLabel="Improved"
        />
      ))}
    </View>
  );

  const renderContent = () => {
    if (activeTab === "activity") {
      return renderByActivity();
    }

    if (activeTab === "improved") {
      return renderMostImproved();
    }

    return renderOverall();
  };

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <TopBar title="Leaderboard" eyebrow="Team Rankings" />

        <View style={styles.hero}>
          <Text style={styles.heroTitle}>Celebrate progress.</Text>
          <Text style={styles.heroText}>
            Live leaderboard connected to Firestore activity results.
          </Text>
        </View>

        <View style={styles.tabRow}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;

            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tabButton, isActive && styles.tabButtonActive]}
                onPress={() => setActiveTab(tab.key)}
                activeOpacity={0.86}
              >
                <Text
                  style={[styles.tabText, isActive && styles.tabTextActive]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.headerRow}>
          <Text style={styles.headerText}>Rank</Text>
          <Text style={styles.headerText}>Team name</Text>
          <Text style={styles.headerText}>Score/points</Text>
        </View>

        {renderContent()}
      </ScrollView>

      <BottomNav current="leaderboard" />
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
    paddingBottom: 26,
  },
  hero: {
    backgroundColor: "#172218",
    borderRadius: 30,
    padding: 22,
    marginBottom: 16,
  },
  heroTitle: {
    color: "#ffffff",
    fontSize: 34,
    lineHeight: 39,
    fontWeight: "900",
  },
  heroText: {
    marginTop: 10,
    color: "#dbe7d4",
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "700",
  },
  tabRow: {
    flexDirection: "row",
    gap: 8,
    backgroundColor: "#ffffff",
    borderRadius: 22,
    padding: 7,
    marginBottom: 14,
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
    borderRadius: 17,
    paddingHorizontal: 8,
  },
  tabButtonActive: {
    backgroundColor: "#2e7d32",
  },
  tabText: {
    color: "#5f6f52",
    fontSize: 13,
    lineHeight: 17,
    fontWeight: "900",
    textAlign: "center",
  },
  tabTextActive: {
    color: "#ffffff",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#e8f5e9",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 11,
    marginBottom: 10,
  },
  headerText: {
    color: "#244b2a",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  section: {
    gap: 12,
  },
  sectionLabel: {
    color: "#5f6f52",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  activityGroup: {
    gap: 10,
    marginBottom: 10,
  },
  activityTitle: {
    color: "#172218",
    fontSize: 21,
    lineHeight: 27,
    fontWeight: "900",
    marginTop: 4,
  },
  rankingCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 14,
    minHeight: 96,
    elevation: 3,
    shadowColor: "#20351f",
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
  },
  rankBadge: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 13,
  },
  rankGold: {
    backgroundColor: "#f0ff75",
  },
  rankSilver: {
    backgroundColor: "#dbeafe",
  },
  rankBronze: {
    backgroundColor: "#fef3c7",
  },
  rankDefault: {
    backgroundColor: "#edf2e8",
  },
  rankBadgeText: {
    color: "#172218",
    fontSize: 18,
    fontWeight: "900",
  },
  teamDetails: {
    flex: 1,
    paddingRight: 8,
  },
  metaLabel: {
    color: "#6b7665",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  teamName: {
    color: "#172218",
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "900",
    marginTop: 3,
  },
  activityText: {
    color: "#5f6f52",
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
    marginTop: 4,
  },
  scoreBlock: {
    alignItems: "flex-end",
    minWidth: 76,
  },
  scoreText: {
    color: "#2e7d32",
    fontSize: 20,
    fontWeight: "900",
    marginTop: 4,
  },
});
