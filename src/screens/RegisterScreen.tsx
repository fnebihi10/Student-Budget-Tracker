import type { StackProps } from '../navigation/routes';
import { useRequiredContext as useContext } from '../context/requiredContext';
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AppButton from "../components/AppButton";
import { AuthContext } from "../context/AuthContext";
import { colors, radius, type } from "../design";

export default function RegisterScreen({ navigation }: StackProps<'Setup'>) {
  const { width } = useWindowDimensions();
  const isWide = width >= 820;
  const { signUp } = useContext(AuthContext);
  const [name, setName] = useState("");
  const [school, setSchool] = useState("");
  const [budget, setBudget] = useState("900");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");
  const [submitError, setSubmitError] = useState("");
  const emailValid = /^\S+@\S+\.\S+$/.test(email.trim());
  const formIssue = !name.trim()
    ? "Enter your first name."
    : !emailValid
    ? "Enter a valid email address."
    : password.length < 8
    ? "Password must contain at least 8 characters."
    : password !== confirmPassword
    ? "The two passwords do not match."
    : !Number(budget)
    ? "Monthly spending plan must be greater than zero."
    : "";

  const submit = async () => {
    setSubmitMessage("");
    setSubmitError("");
    if (password !== confirmPassword) {
      Alert.alert("Passwords do not match", "Enter the same password twice.");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await signUp({
        email,
        password,
        name,
        school,
        budget,
      });
      if (error) {
        setSubmitError(error.message);
        return;
      }
      if (!data?.session) {
        setSubmitMessage(
          "Account created. Check your inbox, confirm your email, then return to sign in."
        );
      }
    } catch {
      setSubmitError("The account service could not be reached. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={[
            styles.content,
            isWide && styles.contentWide,
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.formCard, isWide && styles.formCardWide]}>
          <View style={styles.top}>
            <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => navigation.goBack()} style={{ minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons aria-hidden={true}
              name="arrow-back"
              size={24}
              color={colors.ink}
            />
            </Pressable>
            <View style={styles.steps}>
              <View style={[styles.step, styles.stepActive]} />
              <View style={styles.step} />
              <View style={styles.step} />
            </View>
            <View style={styles.spacer} />
          </View>

          <View style={styles.icon}>
            <Ionicons aria-hidden={true} name="person-outline" size={28} color={colors.primary} />
          </View>
          <Text style={styles.title}>Make it yours.</Text>
          <Text style={styles.subtitle}>
            A few details help Pocketwise build a budget that feels realistic.
          </Text>

          <Text style={styles.label}>First name</Text>
          <TextInput accessibilityLabel="Name"
            value={name}
            onChangeText={setName}
            placeholder="e.g. Alex"
            placeholderTextColor={colors.soft}
            autoCapitalize="words"
            style={styles.input}
          />

          <Text style={styles.label}>University or school</Text>
          <TextInput accessibilityLabel="School"
            value={school}
            onChangeText={setSchool}
            placeholder="Optional"
            placeholderTextColor={colors.soft}
            autoCapitalize="words"
            style={styles.input}
          />

          <Text style={styles.label}>Email address</Text>
          <TextInput accessibilityLabel="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor={colors.soft}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            style={styles.input}
          />

          <Text style={styles.label}>Password</Text>
          <TextInput accessibilityLabel="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="At least 8 characters"
            placeholderTextColor={colors.soft}
            secureTextEntry
            autoCapitalize="none"
            autoComplete="new-password"
            style={styles.input}
          />

          <Text style={styles.label}>Confirm password</Text>
          <TextInput accessibilityLabel="Confirm password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Repeat your password"
            placeholderTextColor={colors.soft}
            secureTextEntry
            autoCapitalize="none"
            style={styles.input}
          />

          <Text style={styles.label}>Monthly spending plan</Text>
          <View style={styles.moneyInput}>
            <Text style={styles.currency}>€</Text>
            <TextInput accessibilityLabel="Monthly plan"
              value={budget}
              onChangeText={(value) => setBudget(value.replace(/[^0-9]/g, ""))}
              placeholder="900"
              keyboardType="number-pad"
              placeholderTextColor={colors.soft}
              style={styles.moneyField}
            />
          </View>

          <View style={styles.note}>
            <Ionicons aria-hidden={true} name="lock-closed-outline" size={18} color={colors.primary} />
            <Text style={styles.noteText}>
              Your account is protected by Supabase Auth and per-user database policies.
            </Text>
          </View>

          {formIssue ? (
            <View accessibilityRole="alert" style={styles.validation}>
              <Ionicons aria-hidden={true} name="information-circle-outline" size={17} color={colors.red} />
              <Text style={styles.validationText}>{formIssue}</Text>
            </View>
          ) : null}

          {submitError ? (
            <Text accessibilityRole="alert" style={styles.submitError}>
              {submitError}
            </Text>
          ) : null}
          {submitMessage ? (
            <View accessibilityRole="alert" style={styles.success}>
              <Ionicons aria-hidden={true} name="mail-outline" size={19} color={colors.primary} />
              <Text style={styles.successText}>{submitMessage}</Text>
            </View>
          ) : null}

          <AppButton
            title="Build my dashboard"
            icon="sparkles-outline"
            loading={loading}
            disabled={Boolean(formIssue) || Boolean(submitMessage)}
            onPress={submit}
            style={styles.button}
          />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safe: { flex: 1, backgroundColor: colors.canvas },
  content: { flexGrow: 1, paddingHorizontal: 22, paddingBottom: 22 },
  contentWide: { justifyContent: "center", paddingVertical: 42 },
  formCard: { width: "100%", alignSelf: "center" },
  formCardWide: {
    maxWidth: 720,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 28,
    backgroundColor: colors.surface,
    paddingHorizontal: 42,
    paddingBottom: 38,
  },
  top: {
    height: 60,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  steps: { flexDirection: "row", gap: 6 },
  step: { width: 26, height: 5, borderRadius: 9, backgroundColor: colors.line },
  stepActive: { width: 44, backgroundColor: colors.primary },
  spacer: { width: 24 },
  icon: {
    width: 58,
    height: 58,
    borderRadius: 20,
    backgroundColor: colors.mint,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 22,
    marginBottom: 20,
  },
  title: { ...type.title, letterSpacing: -1, marginBottom: 10 },
  subtitle: { color: colors.muted, fontSize: 15, lineHeight: 22, marginBottom: 30 },
  label: { color: colors.ink, fontSize: 13, fontWeight: "800", marginBottom: 8 },
  input: {
    minHeight: 56,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    color: colors.ink,
    fontSize: 15,
    marginBottom: 19,
  },
  moneyInput: {
    minHeight: 64,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  currency: { color: colors.primary, fontSize: 24, fontWeight: "800", marginRight: 12 },
  moneyField: { flex: 1, color: colors.ink, fontSize: 24, fontWeight: "800" },
  note: {
    flexDirection: "row",
    gap: 10,
    backgroundColor: colors.mint,
    borderRadius: radius.md,
    padding: 14,
    marginTop: 20,
  },
  noteText: { color: colors.primaryDark, fontSize: 12, lineHeight: 18, flex: 1 },
  validation: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
    borderRadius: 14,
    backgroundColor: "#FFF1EF",
    paddingHorizontal: 13,
    paddingVertical: 10,
  },
  validationText: { flex: 1, color: colors.red, fontSize: 12, fontWeight: "700" },
  submitError: { color: colors.red, fontSize: 12, fontWeight: "700", marginTop: 12 },
  success: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    marginTop: 12,
    borderRadius: 14,
    backgroundColor: colors.mint,
    padding: 13,
  },
  successText: { flex: 1, color: colors.primaryDark, fontSize: 12, lineHeight: 17, fontWeight: "700" },
  button: { marginTop: "auto", minHeight: 58 },
});
