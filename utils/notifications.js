import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

const CHANNEL_ID = "stemm-lab-local";
const ACTIVITY_SAVED_TITLE = "STEMM Lab: Activity saved";
const ACTIVITY_SAVED_BODY = "Your activity result was saved for demo.";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const hasNotificationPermission = (permission) =>
  permission?.granted ||
  permission?.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL ||
  permission?.ios?.status === Notifications.IosAuthorizationStatus.EPHEMERAL;

const ensureNotificationChannel = async () => {
  if (Platform.OS !== "android") {
    return;
  }

  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: "STEMM Lab reminders",
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: "#f0ff75",
  });
};

const getImmediateTrigger = () =>
  Platform.OS === "android" ? { channelId: CHANNEL_ID } : null;

const getReminderTrigger = (seconds) => ({
  type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
  seconds,
  ...(Platform.OS === "android" ? { channelId: CHANNEL_ID } : {}),
});

const getCurrentPermission = async () => {
  const permission = await Notifications.getPermissionsAsync();
  return {
    granted: hasNotificationPermission(permission),
    permission,
  };
};

export async function requestNotificationPermission() {
  try {
    const currentPermission = await getCurrentPermission();

    if (currentPermission.granted) {
      await ensureNotificationChannel();
      return {
        granted: true,
        success: true,
        message: "Notifications are already enabled for STEMM Lab.",
      };
    }

    const requestedPermission = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: false,
        allowSound: true,
      },
    });

    if (!hasNotificationPermission(requestedPermission)) {
      return {
        granted: false,
        success: false,
        message:
          "Notification permission was not granted. You can enable it in device settings.",
      };
    }

    await ensureNotificationChannel();

    return {
      granted: true,
      success: true,
      message: "Notification permission granted for STEMM Lab.",
    };
  } catch (_error) {
    return {
      granted: false,
      success: false,
      message: "Notifications are not available on this device right now.",
    };
  }
}

export async function sendTestNotification() {
  const permission = await requestNotificationPermission();

  if (!permission.granted) {
    return permission;
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "STEMM Lab test",
      body: "Local notifications are working.",
      sound: "default",
    },
    trigger: getImmediateTrigger(),
  });

  return {
    success: true,
    message: "Test notification sent.",
  };
}

export async function scheduleActivityReminder(seconds = 10) {
  const permission = await requestNotificationPermission();

  if (!permission.granted) {
    return permission;
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "STEMM Lab activity reminder",
      body: "Time to continue your STEMM Lab activity.",
      sound: "default",
    },
    trigger: getReminderTrigger(seconds),
  });

  return {
    success: true,
    message: `Activity reminder scheduled in ${seconds} seconds.`,
  };
}

export async function sendActivitySavedNotification({
  title = ACTIVITY_SAVED_TITLE,
  body = ACTIVITY_SAVED_BODY,
} = {}) {
  const currentPermission = await getCurrentPermission();

  if (!currentPermission.granted) {
    return {
      success: false,
      message: "Activity saved locally. Notifications are not enabled.",
    };
  }

  await ensureNotificationChannel();

  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: "default",
    },
    trigger: getImmediateTrigger(),
  });

  return {
    success: true,
    message: "Activity saved notification sent.",
  };
}

export async function cancelAllNotifications() {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    await Notifications.dismissAllNotificationsAsync();

    return {
      success: true,
      message: "All local notifications have been cancelled.",
    };
  } catch (_error) {
    return {
      success: false,
      message: "Unable to cancel notifications right now.",
    };
  }
}
