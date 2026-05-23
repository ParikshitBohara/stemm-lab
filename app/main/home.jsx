import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { collection, getDocs, query, where } from "firebase/firestore";
import BottomNav from "../../components/BottomNav";
import { auth, db } from "../../firebase/firebaseConfig";

export default function Home() {
  const router = useRouter();

  const [teamData, setTeamData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load saved team data from Firestore for the logged-in user
  useEffect(() => {
    const loadTeamData = async () => {
      try {
        const currentUser = auth.currentUser;

        if (!currentUser) {
          setLoading(false);
          return;
        }

        const teamsQuery = query(
          collection(db, "teams"),
          where("createdBy", "==", currentUser.uid),
        );

        const querySnapshot = await getDocs(teamsQuery);

        if (!querySnapshot.empty) {
          const firstTeam = querySnapshot.docs[0].data();
          setTeamData(firstTeam);
        }
      } catch (error) {
        console.log("Error loading team data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadTeamData();
  }, []);

  const teamName = teamData?.teamName || "No team set yet";
  const members = teamData?.members?.join(" and ") || "";
  const grade = teamData?.yearLevel || "";
  const hasTeam = teamName !== "No team set yet";

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <Text style={styles.kicker}>STEMM Lab</Text>
          <Text style={styles.title}>Build, test, improve.</Text>
        </View>

        {loading ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator size="small" />
            <Text style={styles.loadingText}>Loading team data...</Text>
          </View>
        ) : null}

        <View style={styles.teamCard}>
          <View>
            <Text style={styles.cardLabel}>Current Team</Text>
            <Text style={styles.teamName}>{teamName}</Text>
          </View>
          <View style={[styles.statusPill, hasTeam && styles.statusReady]}>
            <Text
              style={[styles.statusText, hasTeam && styles.statusReadyText]}
            >
              {hasTeam ? "Ready" : "Setup"}
            </Text>
          </View>
        </View>

        {!hasTeam && !loading ? (
          <Text style={styles.notice}>
            Set up your team first so activity results can be linked to the
            correct group.
          </Text>
        ) : null}

        <View style={styles.grid}>
          <View style={styles.metricCard}>
            <Text style={styles.metricNumber}>5</Text>
            <Text style={styles.metricLabel}>Activities</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricNumber}>{grade || "--"}</Text>
            <Text style={styles.metricLabel}>Year Level</Text>
          </View>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Team Members</Text>
          <Text style={styles.infoText}>
            {members || "Add members in Team Setup."}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => router.push("/main/activities")}
        >
          <Text style={styles.primaryText}>Start Activity</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => router.push("/main/team-setup")}
        >
          <Text style={styles.secondaryText}>
            {hasTeam ? "Edit Team Setup" : "Create Team Setup"}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <BottomNav current="home" />
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
    borderRadius: 34,
    padding: 24,
    marginBottom: 16,
  },
  kicker: {
    color: "#f0ff75",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.3,
    textTransform: "uppercase",
  },
  title: {
    marginTop: 8,
    fontSize: 38,
    lineHeight: 42,
    fontWeight: "900",
    color: "#ffffff",
    letterSpacing: -1,
  },
  subtitle: {
    marginTop: 10,
    color: "#dbe7d4",
    fontSize: 15,
    lineHeight: 22,
  },
  loadingCard: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  loadingText: {
    color: "#5f6f52",
    fontWeight: "800",
  },
  teamCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#ffffff",
    borderRadius: 28,
    padding: 20,
    marginBottom: 12,
    elevation: 3,
    shadowColor: "#20351f",
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
  },
  cardLabel: {
    color: "#6b7665",
    fontWeight: "900",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  teamName: {
    marginTop: 5,
    color: "#172218",
    fontSize: 22,
    fontWeight: "900",
  },
  statusPill: {
    backgroundColor: "#fff0c2",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  statusReady: {
    backgroundColor: "#dcfce7",
  },
  statusText: {
    color: "#7a4f01",
    fontWeight: "900",
  },
  statusReadyText: {
    color: "#166534",
  },
  notice: {
    backgroundColor: "#fff8e1",
    color: "#7a4f01",
    padding: 14,
    borderRadius: 18,
    marginBottom: 12,
    fontWeight: "700",
    lineHeight: 20,
  },
  grid: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  metricCard: {
    flex: 1,
    backgroundColor: "#e8f5e9",
    borderRadius: 24,
    padding: 18,
  },
  metricNumber: {
    color: "#244b2a",
    fontSize: 30,
    fontWeight: "900",
  },
  metricLabel: {
    marginTop: 4,
    color: "#5f6f52",
    fontWeight: "800",
  },
  infoCard: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 18,
    marginBottom: 16,
  },
  infoTitle: {
    color: "#172218",
    fontSize: 17,
    fontWeight: "900",
    marginBottom: 6,
  },
  infoText: {
    color: "#5f6f52",
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "700",
  },
  primaryButton: {
    backgroundColor: "#2e7d32",
    paddingVertical: 17,
    borderRadius: 20,
    alignItems: "center",
    marginBottom: 12,
  },
  primaryText: {
    color: "#ffffff",
    fontWeight: "900",
    fontSize: 16,
  },
  secondaryButton: {
    backgroundColor: "#ffffff",
    borderColor: "#dfe8d8",
    borderWidth: 1,
    paddingVertical: 16,
    borderRadius: 20,
    alignItems: "center",
  },
  secondaryText: {
    color: "#172218",
    fontWeight: "900",
    fontSize: 15,
  },
});