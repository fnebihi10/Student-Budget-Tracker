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
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AppButton from "../components/AppButton";
import { BudgetContext } from "../context/BudgetContext";
import { SplitsContext } from "../context/SplitsContext";
import { splitCategories } from "../data/splitCategories";
import { colors, radius } from "../design";

const currencySymbols = { EUR: "€", USD: "$", GBP: "£", HUF: "Ft" };

const inputDate = (value) => {
  const date = new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(date.getDate()).padStart(2, "0")}`;
};

const defaultDue = () => {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return inputDate(date);
};

export default function ManageSplitScreen({ navigation, route }) {
  const { settings } = useContext(BudgetContext);
  const { splits, saveSplit, deleteSplit } = useContext(SplitsContext);
  const existing = splits.find((item) => item.id === route.params?.splitId);
  const [direction, setDirection] = useState(
    existing?.direction || route.params?.direction || "owed_to_me"
  );
  const [title, setTitle] = useState(existing?.title || "");
  const [person, setPerson] = useState(existing?.person || "");
  const [amount, setAmount] = useState(
    existing?.amount != null ? String(existing.amount) : ""
  );
  const [category, setCategory] = useState(existing?.category || "food");
  const [dueDate, setDueDate] = useState(
    existing?.dueDate ? inputDate(existing.dueDate) : defaultDue()
  );
  const [note, setNote] = useState(existing?.note || "");
  const numericAmount = Number(amount.replace(",", "."));
  const dateValid = useMemo(
    () =>
      /^\d{4}-\d{2}-\d{2}$/.test(dueDate) &&
      !Number.isNaN(new Date(`${dueDate}T12:00:00`).getTime()),
    [dueDate]
  );
  const canSave =
    title.trim() && person.trim() && numericAmount > 0 && dateValid;

  const save = () => {
    saveSplit({
      id: existing?.id,
      direction,
      title: title.trim(),
      person: person.trim(),
      amount: numericAmount,
      category,
      dueDate: new Date(`${dueDate}T12:00:00`).toISOString(),
      note: note.trim(),
      status: existing?.status || "open",
    });
    Haptics.notificationAsync(
      Haptics.NotificationFeedbackType.Success
    ).catch(() => {});
    navigation.goBack();
  };

  const confirmDelete = () =>
    Alert.alert(
      `Remove ${existing.title}?`,
      "This shared-expense record will be permanently removed.",
      [
        { text: "Keep it", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => {
            deleteSplit(existing.id);
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
            {existing ? "Edit shared expense" : "New shared expense"}
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
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.segment}>
            <Pressable
              onPress={() => setDirection("owed_to_me")}
              style={[
                styles.segmentItem,
                direction === "owed_to_me" && styles.segmentActive,
              ]}
            >
              <Ionicons
                name="arrow-down"
                size={16}
                color={
                  direction === "owed_to_me" ? colors.surface : colors.primary
                }
              />
              <Text
                style={[
                  styles.segmentText,
                  direction === "owed_to_me" && styles.segmentTextActive,
                ]}
              >
                They owe me
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setDirection("i_owe")}
              style={[
                styles.segmentItem,
                direction === "i_owe" && styles.segmentActive,
              ]}
            >
              <Ionicons
                name="arrow-up"
                size={16}
                color={direction === "i_owe" ? colors.surface : colors.coral}
              />
              <Text
                style={[
                  styles.segmentText,
                  direction === "i_owe" && styles.segmentTextActive,
                ]}
              >
                I owe them
              </Text>
            </Pressable>
          </View>

          <View style={styles.explain}>
            <Ionicons
              name="people-outline"
              size={20}
              color={colors.primary}
            />
            <Text style={styles.explainText}>
              {direction === "owed_to_me"
                ? "Use this when you covered someone else’s share."
                : "Use this when someone else covered your share."}
            </Text>
          </View>

          <Text style={styles.label}>What was it for?</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Apartment groceries"
            placeholderTextColor={colors.soft}
            autoCapitalize="sentences"
            maxLength={60}
            style={styles.input}
          />

          <Text style={styles.label}>
            {direction === "owed_to_me" ? "Who owes you?" : "Who do you owe?"}
          </Text>
          <TextInput
            value={person}
            onChangeText={setPerson}
            placeholder="Name or group"
            placeholderTextColor={colors.soft}
            autoCapitalize="words"
            maxLength={40}
            style={styles.input}
          />

          <Text style={styles.label}>Your shared amount</Text>
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

          <Text style={styles.label}>Category</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categories}
          >
            {splitCategories.map((item) => (
              <Pressable
                key={item.id}
                onPress={() => setCategory(item.id)}
                style={[
                  styles.category,
                  category === item.id && styles.categoryActive,
                ]}
              >
                <View
                  style={[
                    styles.categoryIcon,
                    {
                      backgroundColor:
                        category === item.id
                          ? item.color
                          : `${item.color}22`,
                    },
                  ]}
                >
                  <Ionicons
                    name={item.icon}
                    size={18}
                    color={
                      category === item.id ? colors.surface : item.color
                    }
                  />
                </View>
                <Text
                  style={[
                    styles.categoryText,
                    category === item.id && styles.categoryTextActive,
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          <Text style={styles.label}>Settle by</Text>
          <View style={styles.dateField}>
            <Ionicons
              name="calendar-outline"
              size={19}
              color={colors.primary}
            />
            <TextInput
              value={dueDate}
              onChangeText={setDueDate}
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

          <Text style={styles.label}>Note (optional)</Text>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="Receipt, context, or payment details..."
            placeholderTextColor={colors.soft}
            multiline
            maxLength={140}
            style={[styles.input, styles.note]}
          />

          <AppButton
            title={existing ? "Save shared expense" : "Track shared expense"}
            icon="checkmark"
            onPress={save}
            disabled={!canSave}
            style={styles.save}
          />
          <Text style={styles.disclosure}>
            This is a private record only. Pocketwise does not transfer money or
            notify the other person.
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
  segment: {
    flexDirection: "row",
    backgroundColor: colors.line,
    borderRadius: radius.md,
    padding: 4,
    marginTop: 5,
  },
  segmentItem: {
    flex: 1,
    minHeight: 46,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    borderRadius: 14,
  },
  segmentActive: { backgroundColor: colors.primary },
  segmentText: { color: colors.muted, fontSize: 11, fontWeight: "800" },
  segmentTextActive: { color: colors.surface },
  explain: {
    flexDirection: "row",
    gap: 9,
    backgroundColor: colors.mint,
    borderRadius: radius.md,
    padding: 12,
    marginTop: 10,
  },
  explainText: {
    flex: 1,
    color: colors.primaryDark,
    fontSize: 9,
    lineHeight: 14,
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
  categories: { gap: 8, paddingRight: 18 },
  category: {
    minWidth: 78,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 9,
    alignItems: "center",
    gap: 6,
  },
  categoryActive: { backgroundColor: colors.mint, borderColor: colors.primary },
  categoryIcon: {
    width: 35,
    height: 35,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  categoryText: { color: colors.muted, fontSize: 9, fontWeight: "800" },
  categoryTextActive: { color: colors.primary },
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
  note: { minHeight: 82, textAlignVertical: "top", paddingTop: 14 },
  save: { marginTop: 22 },
  disclosure: {
    color: colors.soft,
    fontSize: 9,
    lineHeight: 14,
    textAlign: "center",
    marginTop: 12,
    paddingHorizontal: 10,
  },
});
