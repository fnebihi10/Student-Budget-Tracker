import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useContext, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AppButton from "../components/AppButton";
import { colors, radius, type } from "../design";
import { AuthContext } from "../context/AuthContext";

const features = [
  ["sparkles-outline", "Estimate your budget after commitments"],
  ["pie-chart-outline", "Plan every student expense"],
  ["shield-checkmark-outline", "Private account with secure cloud sync"],
];

export default function LoginScreen({ navigation }) {
  const {
    signIn,
    startDemo,
    authError,
    resendConfirmation,
    clearAuthError,
    requestPasswordReset,
  } = useContext(AuthContext);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState("");

  const loadAllDemo = () => {
    startDemo();
  };

  const submit = async () => {
    clearAuthError();
    setResendMessage("");
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) Alert.alert("Could not sign in", error.message);
  };

  const resend = async () => {
    if (!email.trim()) return;
    setLoading(true);
    setResendMessage("");
    const { error } = await resendConfirmation(email);
    setLoading(false);
    if (!error) {
      setResendMessage("A new confirmation email was sent. Use only the newest link.");
    }
  };

  const resetPassword = async () => {
    if (!email.trim()) return;
    setLoading(true);
    const { error } = await requestPasswordReset(email);
    setLoading(false);
    if (!error) setResendMessage('If this email has an account, a reset link has been sent. Open it on this device.');
  };

  return (
    <LinearGradient colors={["#EFF8EF", "#F7F7F1", "#EEF5EA"]} style={styles.gradient}>
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.flex}
        >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
        <View style={styles.brand}>
          <View style={styles.logo}>
            <Ionicons name="leaf" size={20} color={colors.surface} />
          </View>
          <Text style={styles.brandName}>Pocketwise</Text>
        </View>

        <View style={styles.artCompact}>
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
          <Text style={styles.title}>Welcome back.</Text>
          <Text style={styles.subtitle}>
            Sign in to securely sync your budget across your devices.
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

        <TextInput accessibilityLabel="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="Email address"
          placeholderTextColor={colors.soft}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          style={styles.input}
        />
        <TextInput accessibilityLabel="Password"
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          placeholderTextColor={colors.soft}
          secureTextEntry
          autoCapitalize="none"
          autoComplete="current-password"
          style={styles.input}
        />
        <AppButton
          title="Sign in"
          icon="arrow-forward"
          onPress={submit}
          loading={loading}
          disabled={!email.trim() || password.length < 8}
        />
        {authError ? (
          <View accessibilityRole="alert" style={styles.authError}>
            <Ionicons name="alert-circle-outline" size={18} color={colors.red} />
            <Text style={styles.authErrorText}>{authError}</Text>
          </View>
        ) : null}
        <AppButton title="Forgot password?" variant="ghost" disabled={!email.trim() || loading} onPress={resetPassword} />
        {authError?.toLowerCase().includes("confirm") ||
        authError?.toLowerCase().includes("expired") ? (
          <AppButton
            title="Resend confirmation email"
            variant="ghost"
            onPress={resend}
          />
        ) : null}
        {resendMessage ? (
          <Text accessibilityRole="alert" style={styles.resendMessage}>
            {resendMessage}
          </Text>
        ) : null}
        <AppButton
          title="Create an account"
          variant="secondary"
          onPress={() => navigation.navigate("Setup")}
          style={styles.create}
        />
        <Pressable accessibilityRole="button" onPress={loadAllDemo} style={styles.demo}>
          <Text style={styles.demoText}>Explore with demo data</Text>
        </Pressable>
        </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  flex: { flex: 1 },
  safe: { flex: 1, paddingHorizontal: 22, paddingBottom: 10 },
  scroll: {
    flexGrow: 1,
    width: "100%",
    maxWidth: 720,
    alignSelf: "center",
    paddingBottom: 8,
  },
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
  artCompact: { minHeight: 150, alignItems: "center", justifyContent: "center" },
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
    ...Platform.select({
      web: { boxShadow: "0 7px 12px rgba(25, 58, 43, 0.12)" },
      default: {
        shadowColor: "#193A2B",
        shadowOpacity: 0.12,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 5 },
        elevation: 4,
      },
    }),
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
  input: {
    minHeight: 54,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    color: colors.ink,
    fontSize: 15,
    marginBottom: 10,
  },
  create: { marginTop: 10 },
  authError: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 10,
    borderRadius: 14,
    backgroundColor: "#FFF1EF",
    padding: 12,
  },
  authErrorText: { flex: 1, color: colors.red, fontSize: 12, fontWeight: "700" },
  resendMessage: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
    marginVertical: 8,
  },
});
