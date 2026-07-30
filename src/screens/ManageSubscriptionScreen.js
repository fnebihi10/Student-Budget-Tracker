import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useContext, useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AppButton from "../components/AppButton";
import { BudgetContext } from "../context/BudgetContext";
import { SubscriptionsContext } from "../context/SubscriptionsContext";
import {
  serviceById,
  subscriptionCategories,
} from "../data/subscriptionCatalog";
import { colors, radius, type } from "../design";
import { formatMoney } from "../utils/formatters";
import { monthlyEquivalent } from "../utils/subscriptions";

const frequencies = ["weekly", "monthly", "yearly"];
const reminders = [0, 1, 3, 7];
const currencySymbols = { EUR: "€", USD: "$", GBP: "£", HUF: "Ft" };

const inputDate = (value) => {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const defaultRenewal = () => {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return inputDate(date);
};

export default function ManageSubscriptionScreen({ navigation, route }) {
  const { subscriptions, saveSubscription, deleteSubscription } =
    useContext(SubscriptionsContext);
  const { settings } = useContext(BudgetContext);
  const existing = subscriptions.find(
    (item) => item.id === route.params?.subscriptionId
  );
  const preset = serviceById(
    existing?.serviceId || route.params?.serviceId || "other"
  );

  const [name, setName] = useState(existing?.name || (preset.id === "other" ? "" : preset.name));
  const [amount, setAmount] = useState(
    existing?.amount != null
      ? String(existing.amount)
      : preset.suggestedAmount
      ? String(preset.suggestedAmount)
      : ""
  );
  const [frequency, setFrequency] = useState(existing?.frequency || "monthly");
  const [nextBillingDate, setNextBillingDate] = useState(
    existing?.nextBillingDate
      ? inputDate(existing.nextBillingDate)
      : defaultRenewal()
  );
  const [category, setCategory] = useState(
    existing?.category || preset.category || "other"
  );
  const [reminderDays, setReminderDays] = useState(existing?.reminderDays ?? 3);
  const [notes, setNotes] = useState(existing?.notes || "");
  const [freeTrial, setFreeTrial] = useState(existing?.freeTrial || false);

  const numericAmount = Number(amount.replace(",", "."));
  const dateValid = useMemo(
    () =>
      /^\d{4}-\d{2}-\d{2}$/.test(nextBillingDate) &&
      !Number.isNaN(new Date(`${nextBillingDate}T12:00:00`).getTime()),
    [nextBillingDate]
  );
  const canSave = name.trim() && numericAmount > 0 && dateValid;
  const preview = monthlyEquivalent({ amount: numericAmount, frequency });

  const save = () => {
    saveSubscription({
      id: existing?.id,
      serviceId: existing?.serviceId || preset.id,
      name: name.trim(),
      amount: numericAmount,
      frequency,
      nextBillingDate: new Date(`${nextBillingDate}T12:00:00`).toISOString(),
      category,
      reminderDays,
      notes: notes.trim(),
      freeTrial,
      icon: existing?.icon || preset.icon,
      color: existing?.color || preset.color,
      status: existing?.status || "active",
    });
    Haptics.notificationAsync(
      Haptics.NotificationFeedbackType.Success
    ).catch(() => {});
    navigation.goBack();
  };

  const confirmDelete = () =>
    Alert.alert(
      `Remove ${existing.name}?`,
      "This only removes the tracker entry. It will not cancel your provider subscription.",
      [
        { text: "Keep it", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => {
            deleteSubscription(existing.id);
            navigation.goBack();
          },
        },
      ]
    );

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.close}>
            <Ionicons name="close" size={23} color={colors.ink} />
          </Pressable>
          <Text style={styles.headerTitle}>
            {existing ? "Edit subscription" : "Add subscription"}
          </Text>
          {existing ? (
            <Pressable onPress={confirmDelete} style={styles.close}>
              <Ionicons name="trash-outline" size={20} color={colors.red} />
            </Pressable>
          ) : (
            <View style={styles.close} />
          )}
        </View>

        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          <View
            style={[styles.serviceHero, { backgroundColor: `${preset.color}18` }]}
          >
            <View
              style={[
                styles.serviceIcon,
                { backgroundColor: `${preset.color}28` },
              ]}
            >
              <Ionicons name={preset.icon} size={27} color={preset.color} />
            </View>
            <View style={styles.heroCopy}>
              <Text style={styles.heroEyebrow}>
                {existing ? "TRACKED SERVICE" : "NEW RECURRING COST"}
              </Text>
              <Text style={styles.heroTitle}>
                {name || "Custom subscription"}
              </Text>
            </View>
          </View>

          <Text style={styles.label}>Service name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g. Netflix"
            placeholderTextColor={colors.soft}
            autoCapitalize="words"
            maxLength={50}
            style={styles.input}
          />

          <Text style={styles.label}>Price</Text>
          <View style={styles.amountField}>
            <Text style={styles.currency}>
              {currencySymbols[settings.currency] || settings.currency}
            </Text>
            <TextInput
              value={amount}
              onChangeText={(value) =>
                setAmount(value.replace(/[^0-9.,]/g, ""))
              }
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor={colors.soft}
              style={styles.amountInput}
            />
          </View>

          <Text style={styles.label}>Billing frequency</Text>
          <View style={styles.segment}>
            {frequencies.map((item) => (
              <Pressable
                key={item}
                onPress={() => setFrequency(item)}
                style={[
                  styles.segmentItem,
                  frequency === item && styles.segmentActive,
                ]}
              >
                <Text
                  style={[
                    styles.segmentText,
                    frequency === item && styles.segmentTextActive,
                  ]}
                >
                  {item[0].toUpperCase() + item.slice(1)}
                </Text>
              </Pressable>
            ))}
          </View>

          {numericAmount > 0 ? (
            <View style={styles.conversion}>
              <Ionicons
                name="calculator-outline"
                size={18}
                color={colors.primary}
              />
              <Text style={styles.conversionText}>
                Equivalent to{" "}
                <Text style={styles.conversionStrong}>
                  {formatMoney(preview, settings.currency)} per month
                </Text>{" "}
                and {formatMoney(preview * 12, settings.currency)} per year.
              </Text>
            </View>
          ) : null}

          <Text style={styles.label}>Next renewal date</Text>
          <View style={styles.dateField}>
            <Ionicons
              name="calendar-outline"
              size={19}
              color={colors.primary}
            />
            <TextInput
              value={nextBillingDate}
              onChangeText={setNextBillingDate}
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

          <Text style={styles.label}>Category</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chips}
          >
            {subscriptionCategories.map((item) => (
              <Pressable
                key={item.id}
                onPress={() => setCategory(item.id)}
                style={[
                  styles.chip,
                  category === item.id && styles.chipActive,
                ]}
              >
                <Ionicons
                  name={item.icon}
                  size={15}
                  color={
                    category === item.id ? colors.surface : colors.primary
                  }
                />
                <Text
                  style={[
                    styles.chipText,
                    category === item.id && styles.chipTextActive,
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          <Text style={styles.label}>Reminder</Text>
          <View style={styles.reminders}>
            {reminders.map((days) => (
              <Pressable
                key={days}
                onPress={() => setReminderDays(days)}
                style={[
                  styles.reminder,
                  reminderDays === days && styles.reminderActive,
                ]}
              >
                <Text
                  style={[
                    styles.reminderText,
                    reminderDays === days && styles.reminderTextActive,
                  ]}
                >
                  {days === 0 ? "None" : `${days}d before`}
                </Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.trial}>
            <View style={styles.trialIcon}>
              <Ionicons name="gift-outline" size={20} color={colors.primary} />
            </View>
            <View style={styles.trialCopy}>
              <Text style={styles.trialTitle}>Free trial</Text>
              <Text style={styles.trialText}>
                Mark it clearly so the first charge does not surprise you.
              </Text>
            </View>
            <Switch
              value={freeTrial}
              onValueChange={setFreeTrial}
              trackColor={{ false: colors.line, true: colors.primary }}
              thumbColor={colors.surface}
            />
          </View>

          <Text style={styles.label}>Notes (optional)</Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Plan, student discount, cancellation details..."
            placeholderTextColor={colors.soft}
            multiline
            maxLength={160}
            style={[styles.input, styles.notes]}
          />

          <AppButton
            title={existing ? "Save changes" : "Track subscription"}
            icon="checkmark"
            onPress={save}
            disabled={!canSave}
            style={styles.save}
          />
          <Text style={styles.disclosure}>
            Pocketwise tracks the cost and renewal date only. Reminder choices are saved, but device notifications are not scheduled yet. It does not create,
            change, or cancel the provider’s subscription.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
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
  content: { paddingHorizontal: 19, paddingBottom: 35 },
  serviceHero: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: radius.lg,
    padding: 15,
    marginTop: 5,
  },
  serviceIcon: {
    width: 54,
    height: 54,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 13,
  },
  heroCopy: { flex: 1 },
  heroEyebrow: {
    color: colors.muted,
    fontSize: 9,
    letterSpacing: 0.9,
    fontWeight: "900",
  },
  heroTitle: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: "900",
    marginTop: 3,
  },
  label: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: "800",
    marginTop: 18,
    marginBottom: 8,
  },
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
    fontSize: 22,
    fontWeight: "900",
    marginRight: 10,
  },
  amountInput: {
    flex: 1,
    color: colors.ink,
    fontSize: 23,
    fontWeight: "900",
  },
  segment: {
    flexDirection: "row",
    backgroundColor: colors.line,
    borderRadius: radius.md,
    padding: 4,
  },
  segmentItem: {
    flex: 1,
    minHeight: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 13,
  },
  segmentActive: { backgroundColor: colors.primary },
  segmentText: { color: colors.muted, fontSize: 11, fontWeight: "800" },
  segmentTextActive: { color: colors.surface },
  conversion: {
    flexDirection: "row",
    gap: 9,
    backgroundColor: colors.mint,
    borderRadius: radius.md,
    padding: 12,
    marginTop: 10,
  },
  conversionText: {
    flex: 1,
    color: colors.primaryDark,
    fontSize: 10,
    lineHeight: 15,
  },
  conversionStrong: { fontWeight: "900" },
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
  chips: { gap: 8, paddingRight: 18 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.surface,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 11,
    paddingVertical: 9,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: { color: colors.primary, fontSize: 10, fontWeight: "800" },
  chipTextActive: { color: colors.surface },
  reminders: { flexDirection: "row", gap: 7 },
  reminder: {
    flex: 1,
    minHeight: 39,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: "center",
    justifyContent: "center",
  },
  reminderActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  reminderText: { color: colors.muted, fontSize: 9, fontWeight: "800" },
  reminderTextActive: { color: colors.surface },
  trial: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF2D9",
    borderRadius: radius.lg,
    padding: 13,
    marginTop: 18,
  },
  trialIcon: {
    width: 41,
    height: 41,
    borderRadius: 14,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  trialCopy: { flex: 1, paddingRight: 8 },
  trialTitle: { color: colors.ink, fontSize: 12, fontWeight: "900" },
  trialText: {
    color: colors.muted,
    fontSize: 9,
    lineHeight: 13,
    marginTop: 3,
  },
  notes: { minHeight: 82, textAlignVertical: "top", paddingTop: 14 },
  save: { marginTop: 22 },
  disclosure: {
    color: colors.soft,
    fontSize: 9,
    lineHeight: 14,
    textAlign: "center",
    paddingHorizontal: 10,
    marginTop: 12,
  },
});
