import { useState } from "react";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import BottomNav from "../../components/BottomNav";
import {
  cancelAllNotifications,
  requestNotificationPermission,
  scheduleActivityReminder,
  sendTestNotification,
} from "../../utils/notifications";

const settings = [
  { label: "Account Type", value: "Student prototype" },
  { label: "Privacy Mode", value: "Classroom only" },
];

export default function Profile() {
  const router = useRouter();
  const [notificationMessage, setNotificationMessage] = useState("");
  const [notificationError, setNotificationError] = useState("");
  const [busyNotificationAction, setBusyNotificationAction] = useState("");

  const handleLogout = () => {
    router.replace("/auth/login");
  };

  const runNotificationAction = async (actionName, action) => {
    setBusyNotificationAction(actionName);
    setNotificationMessage("");
    setNotificationError("");

    try {
      const result = await action();

      if (result?.success || result?.granted) {
        setNotificationMessage(result.message);
      } else {
        setNotificationError(
          result?.message || "That notification action could not be completed.",
        );
      }
    } catch (_error) {
      setNotificationError("Notifications are not available right now.");
    } finally {
      setBusyNotificationAction("");
    }
  };

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerCard}>
          <View style={styles.logoShell}>
            <Image
              source={require("../../assets/images/stemmlogo.png")}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.kicker}>Profile</Text>
          <Text style={styles.title}>Your STEMM Lab space</Text>
          <Text style={styles.subtitle}>
            Manage settings and leave the app from here.
          </Text>
        </View>

        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>PL</Text>
          </View>
          <View style={styles.profileTextWrap}>
            <Text style={styles.name}>Parikshit</Text>
            <Text style={styles.role}>Student team member</Text>
          </View>
        </View>

        <View style={styles.settingsCard}>
          <Text style={styles.sectionTitle}>Settings</Text>
          {settings.map((item) => (
            <View key={item.label} style={styles.settingRow}>
              <Text style={styles.settingLabel}>{item.label}</Text>
              <Text style={styles.settingValue}>{item.value}</Text>
            </View>
          ))}
        </View>

        <View style={styles.notificationsCard}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <Text style={styles.notificationText}>
            Try local STEMM Lab reminders on this device. These do not use push
            tokens, Firebase Cloud Messaging, or a backend.
          </Text>

          {notificationMessage ? (
            <Text style={styles.notificationSuccess}>{notificationMessage}</Text>
          ) : null}
          {notificationError ? (
            <Text style={styles.notificationError}>{notificationError}</Text>
          ) : null}

          <TouchableOpacity
            style={[
              styles.notificationButton,
              busyNotificationAction && styles.notificationButtonDisabled,
            ]}
            onPress={() =>
              runNotificationAction(
                "permission",
                requestNotificationPermission,
              )
            }
            disabled={!!busyNotificationAction}
          >
            <Text style={styles.notificationButtonText}>
              {busyNotificationAction === "permission"
                ? "Requesting..."
                : "Request Permission"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.notificationButton,
              busyNotificationAction && styles.notificationButtonDisabled,
            ]}
            onPress={() =>
              runNotificationAction("test", sendTestNotification)
            }
            disabled={!!busyNotificationAction}
          >
            <Text style={styles.notificationButtonText}>
              {busyNotificationAction === "test"
                ? "Sending..."
                : "Send Test Notification"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.notificationButton,
              busyNotificationAction && styles.notificationButtonDisabled,
            ]}
            onPress={() =>
              runNotificationAction("reminder", () =>
                scheduleActivityReminder(10),
              )
            }
            disabled={!!busyNotificationAction}
          >
            <Text style={styles.notificationButtonText}>
              {busyNotificationAction === "reminder"
                ? "Scheduling..."
                : "Schedule Activity Reminder in 10 Seconds"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.cancelNotificationButton,
              busyNotificationAction && styles.notificationButtonDisabled,
            ]}
            onPress={() =>
              runNotificationAction("cancel", cancelAllNotifications)
            }
            disabled={!!busyNotificationAction}
          >
            <Text style={styles.cancelNotificationText}>
              {busyNotificationAction === "cancel"
                ? "Cancelling..."
                : "Cancel All Notifications"}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.noteCard}>
          <Text style={styles.noteTitle}>Backend handoff note</Text>
          <Text style={styles.noteText}>
            This screen is frontend-only for now. Login sessions, saved profile
            data, and real logout logic can be connected later by the backend
            member.
          </Text>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>

      <BottomNav current="profile" />
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
    paddingBottom: 24,
  },
  headerCard: {
    backgroundColor: "#172218",
    borderRadius: 34,
    padding: 24,
    marginBottom: 16,
  },
  logoShell: {
    width: 84,
    height: 84,
    borderRadius: 24,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  logo: {
    width: 66,
    height: 66,
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
    color: "#ffffff",
    fontSize: 34,
    lineHeight: 38,
    fontWeight: "900",
    letterSpacing: -0.8,
  },
  subtitle: {
    marginTop: 8,
    color: "#dbe7d4",
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "700",
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 28,
    padding: 18,
    marginBottom: 14,
    elevation: 3,
    shadowColor: "#20351f",
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
  },
  avatar: {
    width: 62,
    height: 62,
    borderRadius: 22,
    backgroundColor: "#f0ff75",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  avatarText: {
    color: "#172218",
    fontSize: 20,
    fontWeight: "900",
  },
  profileTextWrap: {
    flex: 1,
  },
  name: {
    color: "#172218",
    fontSize: 22,
    fontWeight: "900",
  },
  role: {
    marginTop: 4,
    color: "#5f6f52",
    fontSize: 14,
    fontWeight: "800",
  },
  settingsCard: {
    backgroundColor: "#ffffff",
    borderRadius: 28,
    padding: 20,
    marginBottom: 14,
  },
  sectionTitle: {
    color: "#172218",
    fontSize: 19,
    fontWeight: "900",
    marginBottom: 10,
  },
  settingRow: {
    borderTopWidth: 1,
    borderTopColor: "#edf2e8",
    paddingVertical: 13,
  },
  settingLabel: {
    color: "#6b7665",
    fontWeight: "800",
    fontSize: 13,
  },
  settingValue: {
    color: "#172218",
    fontWeight: "900",
    fontSize: 15,
    marginTop: 4,
  },
  notificationsCard: {
    backgroundColor: "#ffffff",
    borderRadius: 28,
    padding: 20,
    marginBottom: 14,
    elevation: 2,
    shadowColor: "#20351f",
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
  },
  notificationText: {
    color: "#5f6f52",
    fontSize: 14,
    lineHeight: 21,
    fontWeight: "700",
    marginBottom: 12,
  },
  notificationSuccess: {
    backgroundColor: "#e8f5e9",
    color: "#244b2a",
    borderRadius: 16,
    padding: 12,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "800",
    marginBottom: 10,
  },
  notificationError: {
    backgroundColor: "#ffe3df",
    color: "#9f1d14",
    borderRadius: 16,
    padding: 12,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "800",
    marginBottom: 10,
  },
  notificationButton: {
    minHeight: 52,
    backgroundColor: "#172218",
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    marginTop: 10,
  },
  notificationButtonDisabled: {
    opacity: 0.55,
  },
  notificationButtonText: {
    color: "#f0ff75",
    fontSize: 14,
    fontWeight: "900",
    textAlign: "center",
  },
  cancelNotificationButton: {
    minHeight: 52,
    backgroundColor: "#f6f8ef",
    borderColor: "#d7e3cf",
    borderWidth: 1,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    marginTop: 10,
  },
  cancelNotificationText: {
    color: "#344234",
    fontSize: 14,
    fontWeight: "900",
    textAlign: "center",
  },
  noteCard: {
    backgroundColor: "#e8f5e9",
    borderRadius: 24,
    padding: 18,
    marginBottom: 14,
  },
  noteTitle: {
    color: "#244b2a",
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 6,
  },
  noteText: {
    color: "#466045",
    fontSize: 14,
    lineHeight: 21,
    fontWeight: "700",
  },
  logoutButton: {
    backgroundColor: "#ffe3df",
    borderColor: "#ffb4aa",
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 16,
    alignItems: "center",
  },
  logoutText: {
    color: "#9f1d14",
    fontSize: 16,
    fontWeight: "900",
  },
});
