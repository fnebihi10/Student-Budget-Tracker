import { Ionicons } from "@expo/vector-icons";
import React, { useContext, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AppButton from "../components/AppButton";
import { BudgetContext } from "../context/BudgetContext";
import { colors, radius, type } from "../design";

export default function RegisterScreen({ navigation }) {
  const { completeOnboarding, updateSettings } = useContext(BudgetContext);
  const [name, setName] = useState("");
  const [school, setSchool] = useState("");
  const [budget, setBudget] = useState("900");

  const submit = () => {
    updateSettings({ monthlyBudget: Number(budget) || 900 });
    completeOnboarding({ name: name.trim(), school: school.trim() });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.top}>
            <Ionicons
              name="arrow-back"
              size={24}
              color={colors.ink}
              onPress={() => navigation.goBack()}
            />
            <View style={styles.steps}>
              <View style={[styles.step, styles.stepActive]} />
              <View style={styles.step} />
              <View style={styles.step} />
            </View>
            <View style={styles.spacer} />
          </View>

          <View style={styles.icon}>
            <Ionicons name="person-outline" size={28} color={colors.primary} />
          </View>
          <Text style={styles.title}>Make it yours.</Text>
          <Text style={styles.subtitle}>
            A few details help Pocketwise build a budget that feels realistic.
          </Text>

          <Text style={styles.label}>First name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g. Alex"
            placeholderTextColor={colors.soft}
            autoCapitalize="words"
            style={styles.input}
          />

          <Text style={styles.label}>University or school</Text>
          <TextInput
            value={school}
            onChangeText={setSchool}
            placeholder="Optional"
            placeholderTextColor={colors.soft}
            autoCapitalize="words"
            style={styles.input}
          />

          <Text style={styles.label}>Monthly spending plan</Text>
          <View style={styles.moneyInput}>
            <Text style={styles.currency}>€</Text>
            <TextInput
              value={budget}
              onChangeText={(value) => setBudget(value.replace(/[^0-9]/g, ""))}
              placeholder="900"
              keyboardType="number-pad"
              placeholderTextColor={colors.soft}
              style={styles.moneyField}
            />
          </View>

          <View style={styles.note}>
            <Ionicons name="lock-closed-outline" size={18} color={colors.primary} />
            <Text style={styles.noteText}>
              Your entries stay on this device. Cloud sync can be added later.
            </Text>
          </View>

          <AppButton
            title="Build my dashboard"
            icon="sparkles-outline"
            disabled={!name.trim()}
            onPress={submit}
            style={styles.button}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safe: { flex: 1, backgroundColor: colors.canvas },
  content: { flexGrow: 1, paddingHorizontal: 22, paddingBottom: 22 },
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
  button: { marginTop: "auto", minHeight: 58 },
});
