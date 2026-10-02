import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useContext, useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { confirmAction } from "../utils/dialogs";
import AppButton from "../components/AppButton";
import { BudgetContext } from "../context/BudgetContext";
import { GoalsContext } from "../context/GoalsContext";
import { goalTemplateById, goalTemplates } from "../data/goalTemplates";
import { colors, radius } from "../design";
import { formatMoney, shortDate } from "../utils/formatters";
import { goalProgress, goalRemaining, monthlyGoalPace } from "../utils/goals";
import { dateInputToIso, isValidDateInput } from "../utils/dates";
import { openingBalance, validMoney } from '../domain/finance';

const currencySymbols = { EUR: "€", USD: "$", GBP: "£", HUF: "Ft" };

const inputDate = (value) => {
  const date = new Date(value);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const defaultDeadline = () => {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + 120);
  return inputDate(date);
};

export default function ManageGoalScreen({ navigation, route }) {
  const { settings } = useContext(BudgetContext);
  const { goals, saveGoal, addGoalActivity, deleteGoal } =
    useContext(GoalsContext);
  const existing = goals.find((goal) => goal.id === route.params?.goalId);
  const initialTemplate = goalTemplateById(
    existing?.templateId || route.params?.templateId || "other"
  );

  const [templateId, setTemplateId] = useState(initialTemplate.id);
  const [name, setName] = useState(
    existing?.name || (initialTemplate.id === "other" ? "" : initialTemplate.name)
  );
  const [target, setTarget] = useState(
    existing?.target != null
      ? String(existing.target)
      : initialTemplate.suggestedTarget
      ? String(initialTemplate.suggestedTarget)
      : ""
  );
  const [initialSaved, setInitialSaved] = useState("");
  const [deadline, setDeadline] = useState(
    existing?.deadline ? inputDate(existing.deadline) : defaultDeadline()
  );
  const [notes, setNotes] = useState(existing?.notes || "");
  const [showContribution, setShowContribution] = useState(false);
  const [contributionMode, setContributionMode] = useState("add");
  const [contribution, setContribution] = useState("");
  const [contributionNote, setContributionNote] = useState("");

  const template = goalTemplateById(templateId);
  const numericTarget = Number(target.replace(",", "."));
  const numericInitial = Number(initialSaved.replace(",", ".")) || 0;
  const dateValid = useMemo(() => isValidDateInput(deadline), [deadline]);
  const canSave = name.trim() && validMoney(target) && (!initialSaved || validMoney(initialSaved, true)) && dateValid;

  const chooseTemplate = (id) => {
    const selected = goalTemplateById(id);
    setTemplateId(id);
    if (!existing) {
      setName(selected.id === "other" ? "" : selected.name);
      setTarget(
        selected.suggestedTarget ? String(selected.suggestedTarget) : ""
      );
    }
  };

  const save = async () => {
    const saved = await saveGoal({
      id: existing?.id,
      templateId,
      name: name.trim(),
      target: numericTarget,
      ...(existing ? {} : { saved: numericInitial }),
      deadline: dateInputToIso(deadline),
      icon: template.icon,
      color: template.color,
      notes: notes.trim(),
    });
    if (!saved) return;
    Haptics.notificationAsync(
      Haptics.NotificationFeedbackType.Success
    ).catch(() => {});
    navigation.goBack();
  };

  const recordContribution = async () => {
    const amount = Number(contribution.replace(",", "."));
    if (!amount) return;
    const saved = await addGoalActivity(
      existing.id,
      contributionMode === "add" ? amount : -amount,
      contributionNote
    );
    if (!saved) return;
    setContribution("");
    setContributionNote("");
    setShowContribution(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  };

  const confirmDelete = () =>
    confirmAction({
      title: `Delete ${existing.name}?`,
      message: "The goal and its contribution history will be permanently removed.",
      cancelLabel: "Keep it",
      confirmLabel: "Delete",
      onConfirm: async () => {
        if (!await deleteGoal(existing.id)) return;
        navigation.goBack();
      },
    });

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <View style={styles.header}>
          <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => navigation.goBack()} style={styles.close}>
            <Ionicons name="close" size={23} color={colors.ink} />
          </Pressable>
          <Text style={styles.headerTitle}>
            {existing ? "Manage goal" : "New savings goal"}
          </Text>
          {existing ? (
            <Pressable accessibilityRole="button" onPress={confirmDelete} style={styles.close}>
              <Ionicons name="trash-outline" size={20} color={colors.red} />
            </Pressable>
          ) : (
            <View style={styles.close} />
          )}
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {existing ? (
            <View
              style={[
                styles.progressCard,
                { backgroundColor: `${existing.color}18` },
              ]}
            >
              <View
                style={[
                  styles.progressIcon,
                  { backgroundColor: `${existing.color}28` },
                ]}
              >
                <Ionicons
                  name={existing.icon}
                  size={26}
                  color={existing.color}
                />
              </View>
              <View style={styles.progressCopy}>
                <Text style={styles.progressLabel}>CURRENT PROGRESS</Text>
                <Text style={styles.progressValue}>
                  {formatMoney(existing.saved, settings.currency)} of{" "}
                  {formatMoney(existing.target, settings.currency)}
                </Text>
                <Text style={styles.progressMeta}>
                  {Math.round(goalProgress(existing))}% ·{" "}
                  {formatMoney(goalRemaining(existing), settings.currency)} left
                </Text>
              </View>
              <Pressable accessibilityRole="button"
                onPress={() => {
                  setContributionMode("add");
                  setShowContribution(true);
                }}
                style={styles.deposit}
              >
                <Ionicons name="add" size={20} color={colors.surface} />
              </Pressable>
            </View>
          ) : (
            <>
              <Text style={[styles.label, styles.firstLabel]}>Choose a style</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.templates}
              >
                {goalTemplates.map((item) => (
                  <Pressable accessibilityRole="button"
                    key={item.id}
                    onPress={() => chooseTemplate(item.id)}
                    style={[
                      styles.template,
                      templateId === item.id && styles.templateActive,
                    ]}
                  >
                    <View
                      style={[
                        styles.templateIcon,
                        {
                          backgroundColor:
                            templateId === item.id
                              ? item.color
                              : `${item.color}22`,
                        },
                      ]}
                    >
                      <Ionicons
                        name={item.icon}
                        size={19}
                        color={
                          templateId === item.id ? colors.surface : item.color
                        }
                      />
                    </View>
                    <Text
                      style={[
                        styles.templateText,
                        templateId === item.id && styles.templateTextActive,
                      ]}
                    >
                      {item.name}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </>
          )}

          <Text style={styles.label}>Goal name</Text>
          <TextInput accessibilityLabel="Name"
            value={name}
            onChangeText={setName}
            placeholder="e.g. Emergency cushion"
            placeholderTextColor={colors.soft}
            autoCapitalize="words"
            maxLength={50}
            style={styles.input}
          />

          <Text style={styles.label}>Target amount</Text>
          <View style={styles.amountField}>
            <Text style={styles.currency}>
              {currencySymbols[settings.currency] || settings.currency}
            </Text>
            <TextInput accessibilityLabel="Savings target"
              value={target}
              onChangeText={(value) =>
                setTarget(value.replace(/[^0-9.,]/g, ""))
              }
              keyboardType="decimal-pad"
              placeholder="0"
              placeholderTextColor={colors.soft}
              style={styles.amountInput}
            />
          </View>

          {!existing ? (
            <>
              <Text style={styles.label}>Already saved (optional)</Text>
              <TextInput accessibilityLabel="Starting saved balance"
                value={initialSaved}
                onChangeText={(value) =>
                  setInitialSaved(value.replace(/[^0-9.,]/g, ""))
                }
                keyboardType="decimal-pad"
                placeholder="0"
                placeholderTextColor={colors.soft}
                style={styles.input}
              />
            </>
          ) : null}

          <Text style={styles.label}>Target date</Text>
          <View style={styles.dateField}>
            <Ionicons
              name="calendar-outline"
              size={19}
              color={colors.primary}
            />
            <TextInput accessibilityLabel="Deadline YYYY-MM-DD"
              value={deadline}
              onChangeText={setDeadline}
              keyboardType="numbers-and-punctuation"
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.soft}
              maxLength={10}
              style={styles.dateInput}
            />
          </View>
          {!dateValid ? (
            <Text style={styles.error}>Use a valid YYYY-MM-DD date.</Text>
          ) : null}

          {existing && numericTarget > 0 && dateValid ? (
            <View style={styles.pace}>
              <Ionicons
                name="trending-up-outline"
                size={18}
                color={colors.primary}
              />
              <Text style={styles.paceText}>
                A pace of{" "}
                <Text style={styles.paceStrong}>
                  {formatMoney(
                    monthlyGoalPace({ ...existing, target: numericTarget, deadline }),
                    settings.currency
                  )}{" "}
                  per month
                </Text>{" "}
                would reach this target date.
              </Text>
            </View>
          ) : null}

          <Text style={styles.label}>Why this matters (optional)</Text>
          <TextInput accessibilityLabel="Notes"
            value={notes}
            onChangeText={setNotes}
            placeholder="A short promise to your future self..."
            placeholderTextColor={colors.soft}
            multiline
            maxLength={180}
            style={[styles.input, styles.notes]}
          />

          {existing ? (
            <View style={styles.actions}>
              <AppButton
                title="Add money"
                icon="add"
                onPress={() => {
                  setContributionMode("add");
                  setShowContribution(true);
                }}
                style={styles.actionButton}
              />
              <AppButton
                title="Withdraw"
                icon="remove"
                variant="secondary"
                onPress={() => {
                  setContributionMode("withdraw");
                  setShowContribution(true);
                }}
                disabled={Number(existing.saved) <= 0}
                style={styles.actionButton}
              />
            </View>
          ) : null}

          <AppButton
            title={existing ? "Save goal details" : "Create savings goal"}
            icon="checkmark"
            onPress={save}
            disabled={!canSave}
            style={styles.save}
          />

          {existing ? <Text style={styles.historyTitle}>Starting balance: {formatMoney(openingBalance(existing), settings.currency)}. Contributions track savings transfers separately from income and expenses.</Text> : null}
          {existing?.activity?.length ? (
            <View style={styles.historySection}>
              <Text style={styles.historyTitle}>Contribution history</Text>
              <View style={styles.historyCard}>
                {existing.activity.map((item, index) => (
                  <View
                    key={item.id}
                    style={[
                      styles.historyRow,
                      index < existing.activity.length - 1 &&
                        styles.historyDivider,
                    ]}
                  >
                    <View
                      style={[
                        styles.historyIcon,
                        item.amount < 0 && styles.historyIconOut,
                      ]}
                    >
                      <Ionicons
                        name={item.amount < 0 ? "arrow-up" : "arrow-down"}
                        size={15}
                        color={item.amount < 0 ? colors.red : colors.primary}
                      />
                    </View>
                    <View style={styles.historyCopy}>
                      <Text style={styles.historyName}>
                        {item.note ||
                          (item.amount < 0 ? "Withdrawal" : "Contribution")}
                      </Text>
                      <Text style={styles.historyDate}>
                        {shortDate(item.date)}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.historyAmount,
                        item.amount < 0 && styles.historyAmountOut,
                      ]}
                    >
                      {item.amount < 0 ? "−" : "+"}
                      {formatMoney(Math.abs(item.amount), settings.currency)}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        visible={showContribution}
        transparent
        animationType="slide"
        onRequestClose={() => setShowContribution(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.modalShade}
        >
          <Pressable accessibilityRole="button"
            style={StyleSheet.absoluteFill}
            onPress={() => setShowContribution(false)}
          />
          <View style={styles.modal}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>
              {contributionMode === "add" ? "Add to this goal" : "Withdraw money"}
            </Text>
            <Text style={styles.modalText}>
              {contributionMode === "add"
                ? "Every contribution moves the finish line closer."
                : `Up to ${formatMoney(existing?.saved || 0, settings.currency)} is available.`}
            </Text>
            <View style={[styles.amountField, styles.modalAmount]}>
              <Text style={styles.currency}>
                {currencySymbols[settings.currency] || settings.currency}
              </Text>
              <TextInput accessibilityLabel="Contribution amount"
                value={contribution}
                onChangeText={(value) =>
                  setContribution(value.replace(/[^0-9.,]/g, ""))
                }
                keyboardType="decimal-pad"
                autoFocus
                placeholder="0"
                placeholderTextColor={colors.soft}
                style={styles.amountInput}
              />
            </View>
            <TextInput accessibilityLabel="Contribution note"
              value={contributionNote}
              onChangeText={setContributionNote}
              placeholder="Note (optional)"
              placeholderTextColor={colors.soft}
              maxLength={60}
              style={styles.input}
            />
            <AppButton
              title={
                contributionMode === "add" ? "Record contribution" : "Record withdrawal"
              }
              onPress={recordContribution}
              disabled={
                !Number(contribution.replace(",", ".")) ||
                (contributionMode === "withdraw" &&
                  Number(contribution.replace(",", ".")) > Number(existing?.saved || 0))
              }
              style={styles.modalButton}
            />
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safe: { flex: 1, backgroundColor: colors.canvas },
  header: {
    height: 59,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  close: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { color: colors.ink, fontSize: 16, fontWeight: "900" },
  content: { width: "100%", maxWidth: 760, alignSelf: "center", paddingHorizontal: 19, paddingBottom: 35 },
  progressCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: radius.lg,
    padding: 14,
    marginTop: 5,
  },
  progressIcon: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  progressCopy: { flex: 1 },
  progressLabel: {
    color: colors.muted,
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  progressValue: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "900",
    marginTop: 3,
  },
  progressMeta: { color: colors.muted, fontSize: 9, marginTop: 3 },
  deposit: {
    width: 39,
    height: 39,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: "800",
    marginTop: 18,
    marginBottom: 8,
  },
  firstLabel: { marginTop: 8 },
  templates: { gap: 8, paddingRight: 18 },
  template: {
    minWidth: 88,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: "center",
    padding: 10,
    gap: 6,
  },
  templateActive: { borderColor: colors.primary, backgroundColor: colors.mint },
  templateIcon: {
    width: 36,
    height: 36,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  templateText: {
    color: colors.muted,
    fontSize: 9,
    fontWeight: "800",
    maxWidth: 80,
  },
  templateTextActive: { color: colors.primary },
  input: {
    minHeight: 54,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    paddingHorizontal: 15,
    color: colors.ink,
    fontSize: 14,
  },
  amountField: {
    minHeight: 62,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    paddingHorizontal: 15,
    flexDirection: "row",
    alignItems: "center",
  },
  currency: {
    color: colors.primary,
    fontSize: 21,
    fontWeight: "900",
    marginRight: 10,
  },
  amountInput: {
    flex: 1,
    color: colors.ink,
    fontSize: 22,
    fontWeight: "900",
  },
  dateField: {
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
  },
  dateInput: { flex: 1, color: colors.ink, fontSize: 14 },
  error: { color: colors.red, fontSize: 10, marginTop: 5 },
  pace: {
    flexDirection: "row",
    gap: 9,
    backgroundColor: colors.mint,
    borderRadius: radius.md,
    padding: 12,
    marginTop: 10,
  },
  paceText: {
    flex: 1,
    color: colors.primaryDark,
    fontSize: 10,
    lineHeight: 15,
  },
  paceStrong: { fontWeight: "900" },
  notes: { minHeight: 82, textAlignVertical: "top", paddingTop: 14 },
  actions: { flexDirection: "row", gap: 9, marginTop: 19 },
  actionButton: { flex: 1, minHeight: 50 },
  save: { marginTop: 14 },
  historySection: { marginTop: 25 },
  historyTitle: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: "900",
    marginBottom: 10,
  },
  historyCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 13,
  },
  historyRow: {
    minHeight: 62,
    flexDirection: "row",
    alignItems: "center",
  },
  historyDivider: { borderBottomWidth: 1, borderBottomColor: colors.line },
  historyIcon: {
    width: 35,
    height: 35,
    borderRadius: 12,
    backgroundColor: colors.mint,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  historyIconOut: { backgroundColor: "#FCE8E5" },
  historyCopy: { flex: 1 },
  historyName: { color: colors.ink, fontSize: 11, fontWeight: "800" },
  historyDate: { color: colors.muted, fontSize: 8, marginTop: 3 },
  historyAmount: { color: colors.primary, fontSize: 11, fontWeight: "900" },
  historyAmountOut: { color: colors.red },
  modalShade: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(14,29,21,0.42)",
  },
  modal: {
    backgroundColor: colors.canvas,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 21,
    paddingTop: 10,
    paddingBottom: 30,
  },
  modalHandle: {
    width: 42,
    height: 5,
    borderRadius: 9,
    backgroundColor: colors.line,
    alignSelf: "center",
    marginBottom: 18,
  },
  modalTitle: { color: colors.ink, fontSize: 19, fontWeight: "900" },
  modalText: { color: colors.muted, fontSize: 11, marginTop: 5 },
  modalAmount: { marginVertical: 15 },
  modalButton: { marginTop: 14 },
});
