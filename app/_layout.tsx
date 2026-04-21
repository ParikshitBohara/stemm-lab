import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="auth/login" />
      <Stack.Screen name="auth/register" />
      <Stack.Screen name="main/home" />
      <Stack.Screen name="main/team-setup" />
      <Stack.Screen name="main/activities" />
      <Stack.Screen name="main/profile" />
    </Stack>
  );
}
