import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { collection, getDocs } from "firebase/firestore";
import BottomNav from "../../components/BottomNav";
import TopBar from "../../components/TopBar";
import { ACTIVITY_POINTS } from "../../constants/activityPoints";
import { db } from "../../firebase/firebaseConfig";

const activityLabels = {
  parachute: "Parachute Drop",
  sound: "Sound Pollution",
  earthquake: "Earthquake Structure",
  "human-performance": "Human Performance",
  "reaction-board": "Reaction Board",
};

const scoringGuide = [
  { id: "parachute", label: activityLabels.parachute },
  { id: "sound", label: activityLabels.sound },
  { id: "earthquake", label: activityLabels.earthquake },
  { id: "human-performance", label: activityLabels["human-performance"] },
  { id: "reaction-board", label: activityLabels["reaction-board"] },
];

const maxTotalPoints = scoringGuide.reduce(
  (total, activity) => total + (ACTIVITY_POINTS[activity.id] || 0),
  0,
);

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

const getCompletionTime = (completedAt) => {
  if (!completedAt) {
    return null;
  }

  if (typeof completedAt.toMillis === "function") {
    return completedAt.toMillis();
  }

  if (typeof completedAt.toDate === "function") {
    return completedAt.toDate().getTime();
  }

  const parsedTime = new Date(completedAt).getTime();
  return Number.isFinite(parsedTime) ? parsedTime : null;
};

const formatLatestCompletion = (timestamp) => {
  if (!timestamp) {
    return "No completion date";
  }

  return new Date(timestamp).toLocaleDateString();
};

const getActivityName = (activityId, activityName) =>
  activityName || activityLabels[activityId] || activityId;

const buildLeaderboardRows = (snapshot) => {
  const teamMap = new Map();

  snapshot.forEach((resultDoc) => {
    const data = resultDoc.data();
    const { activityId, activityName, teamId, teamName, pointsAwarded } = data;

    if (
      !teamId ||
      teamId === "demo-team" ||
      !activityId ||
      !Number.isFinite(pointsAwarded)
    ) {
      return;
    }

    if (!teamMap.has(teamId)) {
      teamMap.set(teamId, {
        teamId,
        teamName: teamName || "Unknown Team",
        activities: new Map(),
        latestCompletion: null,
      });
    }

    const team = teamMap.get(teamId);
    const completionTime = getCompletionTime(data.completedAt);
    const existingActivity = team.activities.get(activityId);

    if (
      !existingActivity ||
      (completionTime && completionTime > existingActivity.completedAt)
    ) {
      team.activities.set(activityId, {
        activityId,
        activityName: getActivityName(activityId, activityName),
        pointsAwarded,
        completedAt: completionTime,
      });
    }

    if (
      completionTime &&
      (!team.latestCompletion || completionTime > team.latestCompletion)
    ) {
      team.latestCompletion = completionTime;
    }
  });

  return Array.from(teamMap.values())
    .map((team) => {
      const completedActivities = Array.from(team.activities.values());
      const totalPoints = completedActivities.reduce(
        (sum, activity) => sum + activity.pointsAwarded,
        0,
      );

      return {
        teamId: team.teamId,
        teamName: team.teamName,
        totalPoints,
        activitiesCompleted: completedActivities.length,
        completedActivities: completedActivities.map(
          (activity) => activity.activityName,
        ),
        latestCompletion: team.latestCompletion,
      };
    })
    .sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) {
        return b.totalPoints - a.totalPoints;
      }

      if (b.activitiesCompleted !== a.activitiesCompleted) {
        return b.activitiesCompleted - a.activitiesCompleted;
      }

      return a.teamName.localeCompare(b.teamName);
    });
};

function RankingCard({ rank, team }) {
  const activitiesText =
    team.completedActivities.length > 0
      ? team.completedActivities.join(", ")
      : "No valid activity scores";

  return (
    <View style={styles.rankingCard}>
      <View style={[styles.rankBadge, getRankTone(rank)]}>
        <Text style={styles.rankBadgeText}>{rank}</Text>
      </View>

      <View style={styles.teamDetails}>
        <Text style={styles.metaLabel}>Team name</Text>
        <Text style={styles.teamName}>{team.teamName}</Text>
        <Text style={styles.activityText}>
          {team.activitiesCompleted} / {scoringGuide.length} activities completed
        </Text>
        <Text style={styles.activityList}>{activitiesText}</Text>
        <Text style={styles.latestText}>
          Latest: {formatLatestCompletion(team.latestCompletion)}
        </Text>
      </View>

      <View style={styles.scoreBlock}>
        <Text style={styles.metaLabel}>Points</Text>
        <Text style={styles.scoreText}>{team.totalPoints}</Text>
      </View>
    </View>
  );
}

export default function Leaderboard() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadLeaderboard = async () => {
    setLoading(true);
    setError("");

    try {
      const snapshot = await getDocs(collection(db, "results"));
      setTeams(buildLeaderboardRows(snapshot));
    } catch (loadError) {
      console.log("Error loading leaderboard:", loadError);
      setError("Unable to load the leaderboard. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeaderboard();
  }, []);

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <TopBar title="Leaderboard" eyebrow="Team Rankings" />

        <View style={styles.hero}>
          <Text style={styles.heroTitle}>Overall Team Leaderboard</Text>
          <Text style={styles.heroText}>
            Real totals from submitted Firestore activity results.
          </Text>
        </View>

        <View style={styles.guideCard}>
          <Text style={styles.guideTitle}>Scoring Guide</Text>
          {scoringGuide.map((activity) => (
            <View key={activity.id} style={styles.guideRow}>
              <Text style={styles.guideLabel}>{activity.label}</Text>
              <Text style={styles.guidePoints}>
                {ACTIVITY_POINTS[activity.id]} pts
              </Text>
            </View>
          ))}
          <View style={styles.guideTotalRow}>
            <Text style={styles.guideTotalLabel}>Maximum total</Text>
            <Text style={styles.guideTotalPoints}>{maxTotalPoints} pts</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.refreshButton, loading && styles.refreshButtonDisabled]}
          onPress={loadLeaderboard}
          activeOpacity={0.86}
          disabled={loading}
        >
          <Text style={styles.refreshButtonText}>Refresh Scores</Text>
        </TouchableOpacity>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color= "2e7d32" />
            <Text style={styles.stateText}>Loading leaderboard...</Text>

          </View>
    
        ) :null}
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {!loading && !error && teams.length === 0 ? (
          <Text style={styles.stateText}>
            No submitted activity scores yet. Complete an activity to appear on
            the leaderboard.
          </Text>
        ) : null}

        {!loading && !error && teams.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Ranked by total points</Text>
            {teams.map((team, index) => (
              <RankingCard key={team.teamId} rank={index + 1} team={team} />
            ))}
          </View>
        ) : null}
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
  guideCard: {
    backgroundColor: "#ffffff",
    borderColor: "#dfe8d8",
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 14,
    padding: 16,
  },
  guideTitle: {
    color: "#172218",
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 8,
  },
  guideRow: {
    alignItems: "center",
    borderTopColor: "#edf2e8",
    borderTopWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
  },
  guideLabel: {
    color: "#5f6f52",
    flex: 1,
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 20,
  },
  guidePoints: {
    color: "#2e7d32",
    fontSize: 14,
    fontWeight: "900",
    marginLeft: 12,
  },
  guideTotalRow: {
    alignItems: "center",
    backgroundColor: "#e8f5e9",
    borderRadius: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  guideTotalLabel: {
    color: "#244b2a",
    fontSize: 14,
    fontWeight: "900",
  },
  guideTotalPoints: {
    color: "#244b2a",
    fontSize: 15,
    fontWeight: "900",
  },
  refreshButton: {
    alignItems: "center",
    backgroundColor: "#2e7d32",
    borderRadius: 20,
    justifyContent: "center",
    marginBottom: 14,
    minHeight: 56,
    paddingHorizontal: 16,
  },
  refreshButtonDisabled: {
    opacity: 0.55,
  },
  refreshButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "900",
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  stateText: {
    backgroundColor: "#edf6ff",
    borderRadius: 18,
    color: "#17456b",
    fontSize: 15,
    fontWeight: "800",
    lineHeight: 22,
    marginBottom: 14,
    padding: 14,
  },
  errorText: {
    backgroundColor: "#ffe3df",
    borderRadius: 18,
    color: "#9f1d14",
    fontSize: 15,
    fontWeight: "800",
    lineHeight: 22,
    marginBottom: 14,
    padding: 14,
  },
  section: {
    gap: 12,
  },
  sectionLabel: {
    color: "#5f6f52",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 1,
    marginBottom: 2,
    textTransform: "uppercase",
  },
  rankingCard: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 24,
    elevation: 3,
    flexDirection: "row",
    minHeight: 118,
    padding: 14,
    shadowColor: "#20351f",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
  },
  rankBadge: {
    alignItems: "center",
    borderRadius: 18,
    height: 52,
    justifyContent: "center",
    marginRight: 13,
    width: 52,
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
    fontWeight: "900",
    lineHeight: 22,
    marginTop: 3,
  },
  activityText: {
    color: "#5f6f52",
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 18,
    marginTop: 4,
  },
  activityList: {
    color: "#42667f",
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 17,
    marginTop: 3,
  },
  latestText: {
    color: "#6b7665",
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 17,
    marginTop: 3,
  },
  scoreBlock: {
    alignItems: "flex-end",
    minWidth: 76,
  },
  scoreText: {
    color: "#2e7d32",
    fontSize: 24,
    fontWeight: "900",
    marginTop: 4,
  },
});
