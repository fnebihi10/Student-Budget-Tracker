import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useContext } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AppButton from "../components/AppButton";
import { BudgetContext } from "../context/BudgetContext";
import { GoalsContext } from "../context/GoalsContext";
import { SplitsContext } from "../context/SplitsContext";
import { SubscriptionsContext } from "../context/SubscriptionsContext";
import { colors, radius, type } from "../design";

const features = [
  ["sparkles-outline", "Know what is safe to spend"],
  ["pie-chart-outline", "Plan every student expense"],
  ["shield-checkmark-outline", "Private and saved on your phone"],
];

export default function LoginScreen({ navigation }) {
  const { loadDemo, onboardingComplete, profile, signIn } = useContext(BudgetContext);
  const { loadDemoGoals } = useContext(GoalsContext);
  const { loadDemoSubscriptions } = useContext(SubscriptionsContext);
  const { loadDemoSplits } = useContext(SplitsContext);
  const returning = onboardingComplete && Boolean(profile.name);

  const loadAllDemo = () => {
    loadDemo();
    loadDemoGoals();
    loadDemoSubscriptions();
    loadDemoSplits();
  };

  return (
    <LinearGradient colors={["#EFF8EF", "#F7F7F1", "#EEF5EA"]} style={styles.gradient}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.brand}>
          <View style={styles.logo}>
            <Ionicons name="leaf" size={20} color={colors.surface} />
          </View>
          <Text style={styles.brandName}>Pocketwise</Text>
        </View>

        <View style={styles.art}>
          <View style={styles.orbit}>
            <View style={styles.cardBack} />
            <View style={styles.card}>
              <Text style={styles.cardEyebrow}>THIS WEEK</Text>
              <Text style={styles.cardValue}>€68 left</Text>
              <View style={styles.progress}>
                <View style={styles.progressFill} />
              </View>
              <View style={styles.cardRow}>
                <Text style={styles.cardSmall}>Spent €102</Text>
                <View style={styles.goodPill}>
                  <Text style={styles.goodText}>On track</Text>
                </View>
              </View>
            </View>
            <View style={[styles.bubble, styles.bubbleOne]}>
              <Ionicons name="cafe" size={21} color={colors.primary} />
            </View>
            <View style={[styles.bubble, styles.bubbleTwo]}>
              <Ionicons name="school" size={21} color={colors.primary} />
            </View>
          </View>
        </View>

        <View style={styles.copy}>
          <Text style={styles.title}>{returning ? `Welcome back,\n${profile.name}.` : `Student money,\nmade lighter.`}</Text>
          <Text style={styles.subtitle}>
            {returning ? "Everything is exactly where you left it on this device." : "A calm place to track spending, plan bills, and still enjoy university life."}
          </Text>
          <View style={styles.features}>
            {features.map(([icon, text]) => (
              <View key={text} style={styles.feature}>
                <Ionicons name={icon} size={17} color={colors.primary} />
                <Text style={styles.featureText}>{text}</Text>
              </View>
            ))}
          </View>
        </View>

        <AppButton
          title={returning ? "Continue to my dashboard" : "Create my budget"}
          icon="arrow-forward"
          onPress={returning ? signIn : () => navigation.navigate("Setup")}
        />
        <Pressable disabled={returning} onPress={loadAllDemo} style={styles.demo}>
          <Text style={styles.demoText}>{returning ? "Your local data is still safely stored" : "Explore with demo data"}</Text>
        </Pressable>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safe: { flex: 1, paddingHorizontal: 22, paddingBottom: 10 },
  brand: { flexDirection: "row", alignItems: "center", gap: 9, paddingTop: 8 },
  logo: {
    height: 38,
    width: 38,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
  },
  brandName: { fontSize: 19, fontWeight: "900", color: colors.ink, letterSpacing: -0.5 },
  art: { flex: 1, minHeight: 230, alignItems: "center", justifyContent: "center" },
  orbit: {
    width: 260,
    height: 210,
    borderRadius: 105,
    backgroundColor: "#E0F0D9",
    alignItems: "center",
    justifyContent: "center",
  },
  cardBack: {
    position: "absolute",
    width: 210,
    height: 132,
    borderRadius: radius.lg,
    backgroundColor: colors.lime,
    transform: [{ rotate: "8deg" }],
  },
  card: {
    width: 218,
    borderRadius: radius.lg,
    backgroundColor: colors.primaryDark,
    padding: 20,
    transform: [{ rotate: "-3deg" }],
  },
  cardEyebrow: { color: "#A7C1B4", fontSize: 10, fontWeight: "800", letterSpacing: 1.4 },
  cardValue: { color: colors.surface, fontSize: 28, fontWeight: "900", marginTop: 5 },
  progress: { height: 6, backgroundColor: "#456A59", borderRadius: 20, marginVertical: 15 },
  progressFill: { width: "62%", height: 6, backgroundColor: colors.lime, borderRadius: 20 },
  cardRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  cardSmall: { color: "#C1D0C9", fontSize: 11 },
  goodPill: { backgroundColor: "#3B6954", borderRadius: 99, paddingHorizontal: 9, paddingVertical: 5 },
  goodText: { color: colors.lime, fontSize: 9, fontWeight: "800" },
  bubble: {
    position: "absolute",
    width: 48,
    height: 48,
    borderRadius: 18,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#193A2B",
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  bubbleOne: { top: 17, right: 3, transform: [{ rotate: "8deg" }] },
  bubbleTwo: { bottom: 5, left: 8, transform: [{ rotate: "-7deg" }] },
  copy: { marginBottom: 24 },
  title: { ...type.title, letterSpacing: -1.1, marginBottom: 11 },
  subtitle: { color: colors.muted, fontSize: 15, lineHeight: 22, maxWidth: 345 },
  features: { gap: 9, marginTop: 18 },
  feature: { flexDirection: "row", alignItems: "center", gap: 9 },
  featureText: { color: colors.ink, fontSize: 13, fontWeight: "600" },
  demo: { alignItems: "center", paddingVertical: 15 },
  demoText: { color: colors.primary, fontSize: 14, fontWeight: "800" },
});
