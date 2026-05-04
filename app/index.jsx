import { useEffect } from "react";
import { View, Text, ActivityIndicator, Image, StyleSheet } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";


export default function Index() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace("/auth/login");
    }, 1800);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.orbOne} />
      <View style={styles.orbTwo} />

      <View style={styles.logoShell}>
        <Image
          source={require("../assets/images/stemmlogo.png")}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      <Text style={styles.title}>STEMM Lab</Text>
      <Text style={styles.subtitle}>
        Real-world science challenges for curious teams.
      </Text>

      <ActivityIndicator size="large" color="#f0ff75" style={styles.loader} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#172218",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    overflow: "hidden",
  },
  orbOne: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: "#2e7d32",
    opacity: 0.72,
    top: -80,
    right: -70,
  },
  orbTwo: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "#1565c0",
    opacity: 0.35,
    bottom: -70,
    left: -60,
  },
  logoShell: {
    width: 174,
    height: 174,
    borderRadius: 48,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.22,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
  },
  logo: {
    width: 136,
    height: 136,
  },
  title: {
    fontSize: 42,
    fontWeight: "900",
    color: "#ffffff",
    textAlign: "center",
    letterSpacing: -1,
  },
  subtitle: {
    marginTop: 10,
    maxWidth: 280,
    fontSize: 16,
    lineHeight: 23,
    color: "#dbe7d4",
    textAlign: "center",
  },
  loader: {
    marginTop: 30,
  },
});