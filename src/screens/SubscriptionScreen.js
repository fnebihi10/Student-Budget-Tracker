import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AppButton from "../components/AppButton";
import { colors, radius, type } from "../design";

const benefits = [
  ["analytics-outline", "Deeper spending forecasts"],
  ["albums-outline", "Unlimited custom budget plans"],
  ["cloud-outline", "Cloud sync when connected"],
  ["people-outline", "Shared budgets when connected"],
];

export default function SubscriptionScreen({ navigation }) {
  const [plan, setPlan] = useState("annual");

  const unavailable = () =>
    Alert.alert(
      "Billing setup needed",
      "The paywall is ready, but real purchases must be connected to App Store products and RevenueCat before release. No payment was taken."
    );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.close}>
          <Ionicons name="close" size={23} color={colors.ink} />
        </Pressable>
        <Text style={styles.headerTitle}>Pocketwise Pro</Text>
        <Pressable onPress={unavailable} hitSlop={10}>
          <Text style={styles.restore}>Restore</Text>
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={[colors.primaryDark, colors.primary]} style={styles.hero}>
          <View style={styles.sparkle}>
            <Ionicons name="sparkles" size={27} color={colors.primaryDark} />
          </View>
          <Text style={styles.heroEyebrow}>BUILD CALMER MONEY HABITS</Text>
          <Text style={styles.heroTitle}>More clarity.{`\n`}Less money stress.</Text>
          <Text style={styles.heroText}>
            Pro is designed for students who want smarter planning across every semester.
          </Text>
        </LinearGradient>

        <View style={styles.benefits}>
          {benefits.map(([icon, text]) => (
            <View key={text} style={styles.benefit}>
              <View style={styles.benefitIcon}>
                <Ionicons name={icon} size={19} color={colors.primary} />
              </View>
              <Text style={styles.benefitText}>{text}</Text>
              <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
            </View>
          ))}
        </View>

        <Pressable onPress={() => setPlan("annual")} style={[styles.plan, plan === "annual" && styles.planActive]}>
          <View style={styles.best}><Text style={styles.bestText}>BEST VALUE</Text></View>
          <View style={styles.radio}>{plan === "annual" ? <View style={styles.radioDot} /> : null}</View>
          <View style={styles.planCopy}>
            <Text style={styles.planTitle}>Annual</Text>
            <Text style={styles.planSub}>€19.99 billed once a year</Text>
          </View>
          <View style={styles.priceCopy}>
            <Text style={styles.price}>€1.67</Text>
            <Text style={styles.priceSub}>per month</Text>
          </View>
        </Pressable>
        <Pressable onPress={() => setPlan("monthly")} style={[styles.plan, plan === "monthly" && styles.planActive]}>
          <View style={styles.radio}>{plan === "monthly" ? <View style={styles.radioDot} /> : null}</View>
          <View style={styles.planCopy}>
            <Text style={styles.planTitle}>Monthly</Text>
            <Text style={styles.planSub}>Flexible, cancel any time</Text>
          </View>
          <View style={styles.priceCopy}>
            <Text style={styles.price}>€2.99</Text>
            <Text style={styles.priceSub}>per month</Text>
          </View>
        </Pressable>

        <AppButton title={`Continue with ${plan}`} icon="arrow-forward" onPress={unavailable} style={styles.button} />
        <Text style={styles.disclosure}>
          Preview pricing only. Purchases are disabled until App Store billing is configured. Any live subscription must include Apple’s terms, privacy policy, renewal, and cancellation disclosures.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas },
  header: { height: 59, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 18 },
  close: { width: 40, height: 40, borderRadius: 14, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" },
  headerTitle: { color: colors.ink, fontSize: 15, fontWeight: "900" },
  restore: { color: colors.primary, fontSize: 12, fontWeight: "800" },
  content: { paddingHorizontal: 18, paddingBottom: 30 },
  hero: { borderRadius: radius.xl, padding: 21, alignItems: "center" },
  sparkle: { width: 55, height: 55, borderRadius: 20, backgroundColor: colors.lime, alignItems: "center", justifyContent: "center", marginBottom: 16 },
  heroEyebrow: { color: colors.lime, fontSize: 9, letterSpacing: 1.2, fontWeight: "900" },
  heroTitle: { color: colors.surface, fontSize: 30, lineHeight: 35, fontWeight: "900", textAlign: "center", letterSpacing: -1, marginTop: 7 },
  heroText: { color: "#C4D4CC", fontSize: 12, lineHeight: 18, textAlign: "center", marginTop: 9, maxWidth: 280 },
  benefits: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 14, marginVertical: 13 },
  benefit: { minHeight: 57, flexDirection: "row", alignItems: "center" },
  benefitIcon: { width: 34, height: 34, borderRadius: 12, backgroundColor: colors.mint, alignItems: "center", justifyContent: "center", marginRight: 10 },
  benefitText: { flex: 1, color: colors.ink, fontSize: 12, fontWeight: "700" },
  plan: { minHeight: 73, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, marginBottom: 10, flexDirection: "row", alignItems: "center", paddingHorizontal: 14 },
  planActive: { borderWidth: 2, borderColor: colors.primary, backgroundColor: "#F6FBF7" },
  best: { position: "absolute", top: -9, right: 12, backgroundColor: colors.lime, borderRadius: 99, paddingHorizontal: 8, paddingVertical: 4 },
  bestText: { color: colors.primaryDark, fontSize: 7, letterSpacing: 0.6, fontWeight: "900" },
  radio: { width: 21, height: 21, borderRadius: 11, borderWidth: 2, borderColor: colors.primary, alignItems: "center", justifyContent: "center", marginRight: 11 },
  radioDot: { width: 11, height: 11, borderRadius: 6, backgroundColor: colors.primary },
  planCopy: { flex: 1 },
  planTitle: { color: colors.ink, fontSize: 14, fontWeight: "900" },
  planSub: { color: colors.muted, fontSize: 10, marginTop: 3 },
  priceCopy: { alignItems: "flex-end" },
  price: { color: colors.ink, fontSize: 15, fontWeight: "900" },
  priceSub: { color: colors.muted, fontSize: 9, marginTop: 2 },
  button: { marginTop: 6 },
  disclosure: { color: colors.soft, fontSize: 9, lineHeight: 14, textAlign: "center", marginTop: 13, paddingHorizontal: 12 },
});
