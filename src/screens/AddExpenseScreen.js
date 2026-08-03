import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useContext, useMemo, useState } from "react";
import {
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
import CategoryPicker from "../components/CategoryPicker";
import { BudgetContext } from "../context/BudgetContext";
import { expenseCategories, incomeCategories } from "../data/categories";
import { colors, radius } from "../design";
import { dateInputToIso, isValidDateInput } from "../utils/dates";

const currencySymbols = { EUR: "€", USD: "$", GBP: "£", HUF: "Ft" };

const formatInputDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default function AddExpenseScreen({ navigation }) {
  const { addTransaction, settings } = useContext(BudgetContext);
  const [type, setType] = useState("expense");
  const [amount, setAmount] = useState("");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(formatInputDate(new Date()));
  const [category, setCategory] = useState("food");
  const [recurring, setRecurring] = useState(false);
  const categories = type === "expense" ? expenseCategories : incomeCategories;
  const validDate = useMemo(() => isValidDateInput(date), [date]);
  const canSave = Number(amount.replace(",", ".")) > 0 && title.trim() && validDate;

  const chooseType = (next) => {
    setType(next);
    setCategory(next === "expense" ? "food" : "salary");
  };

  const save = () => {
    addTransaction({
      type,
      amount: Number(amount.replace(",", ".")),
      title: title.trim(),
      note: note.trim(),
      date: dateInputToIso(date),
      category,
      recurring,
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.flex}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.close}>
            <Ionicons name="close" size={23} color={colors.ink} />
          </Pressable>
          <Text style={styles.headerTitle}>New transaction</Text>
          <View style={styles.close} />
        </View>

        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          <View style={styles.segment}>
            {["expense", "income"].map((item) => (
              <Pressable
                key={item}
                onPress={() => chooseType(item)}
                style={[styles.segmentItem, type === item && styles.segmentActive]}
              >
                <Ionicons
                  name={item === "expense" ? "arrow-up" : "arrow-down"}
                  size={16}
                  color={type === item ? colors.surface : colors.muted}
                />
                <Text style={[styles.segmentText, type === item && styles.segmentTextActive]}>
                  {item[0].toUpperCase() + item.slice(1)}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.amountLabel}>HOW MUCH?</Text>
          <View style={styles.amountRow}>
            <Text style={styles.symbol}>{currencySymbols[settings.currency] || settings.currency}</Text>
            <TextInput
              value={amount}
              onChangeText={(value) => setAmount(value.replace(/[^0-9.,]/g, ""))}
              autoFocus
              keyboardType="decimal-pad"
              placeholder="0"
              placeholderTextColor="#B9C1BC"
              style={styles.amountInput}
              maxLength={12}
            />
          </View>

          <Text style={styles.label}>Category</Text>
          <CategoryPicker categories={categories} value={category} onChange={setCategory} />

          <Text style={styles.label}>Description</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder={type === "expense" ? "e.g. Groceries" : "e.g. Campus job"}
            placeholderTextColor={colors.soft}
            style={styles.input}
            maxLength={50}
          />

          <View style={styles.twoColumns}>
            <View style={styles.column}>
              <Text style={styles.label}>Date</Text>
              <View style={styles.fieldIcon}>
                <Ionicons name="calendar-outline" size={19} color={colors.primary} />
                <TextInput
                  value={date}
                  onChangeText={setDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.soft}
                  keyboardType="numbers-and-punctuation"
                  style={styles.dateInput}
                  maxLength={10}
                />
              </View>
              {!validDate ? <Text style={styles.error}>Use YYYY-MM-DD</Text> : null}
            </View>
          </View>

          <Text style={styles.label}>Note (optional)</Text>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="Anything worth remembering?"
            placeholderTextColor={colors.soft}
            multiline
            style={[styles.input, styles.note]}
            maxLength={140}
          />

          <View style={styles.repeat}>
            <View style={styles.repeatIcon}>
              <Ionicons name="repeat-outline" size={20} color={colors.primary} />
            </View>
            <View style={styles.repeatCopy}>
              <Text style={styles.repeatTitle}>Mark as recurring</Text>
              <Text style={styles.repeatText}>Labels regular entries so they are easy to identify later.</Text>
            </View>
            <Switch
              value={recurring}
              onValueChange={setRecurring}
              trackColor={{ false: colors.line, true: colors.primary }}
              thumbColor={colors.surface}
            />
          </View>

          <AppButton
            title={`Save ${type}`}
            icon="checkmark"
            onPress={save}
            disabled={!canSave}
            style={styles.save}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safe: { flex: 1, backgroundColor: colors.canvas },
  header: { height: 59, paddingHorizontal: 18, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  close: { width: 40, height: 40, borderRadius: 14, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" },
  headerTitle: { color: colors.ink, fontSize: 16, fontWeight: "900" },
  content: { width: "100%", maxWidth: 720, alignSelf: "center", paddingHorizontal: 19, paddingBottom: 35 },
  segment: { flexDirection: "row", backgroundColor: colors.line, borderRadius: radius.md, padding: 4, marginTop: 5 },
  segmentItem: { flex: 1, flexDirection: "row", gap: 7, alignItems: "center", justifyContent: "center", minHeight: 46, borderRadius: 14 },
  segmentActive: { backgroundColor: colors.primary },
  segmentText: { color: colors.muted, fontSize: 13, fontWeight: "800" },
  segmentTextActive: { color: colors.surface },
  amountLabel: { color: colors.muted, fontSize: 10, fontWeight: "900", letterSpacing: 1.2, textAlign: "center", marginTop: 28 },
  amountRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginBottom: 27 },
  symbol: { color: colors.primary, fontSize: 26, fontWeight: "800", marginRight: 7, marginTop: 6 },
  amountInput: { color: colors.ink, fontSize: 48, fontWeight: "900", letterSpacing: -2, minWidth: 50, maxWidth: "80%", textAlign: "center" },
  label: { color: colors.ink, fontSize: 13, fontWeight: "800", marginTop: 19, marginBottom: 9 },
  input: { minHeight: 54, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, paddingHorizontal: 15, color: colors.ink, fontSize: 14 },
  twoColumns: { flexDirection: "row" },
  column: { flex: 1 },
  fieldIcon: { minHeight: 54, flexDirection: "row", alignItems: "center", gap: 9, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, paddingHorizontal: 14 },
  dateInput: { flex: 1, color: colors.ink, fontSize: 14 },
  error: { color: colors.red, fontSize: 11, marginTop: 5 },
  note: { minHeight: 82, textAlignVertical: "top", paddingTop: 14 },
  repeat: { flexDirection: "row", alignItems: "center", backgroundColor: colors.mint, borderRadius: radius.lg, padding: 14, marginTop: 18 },
  repeatIcon: { width: 42, height: 42, borderRadius: 15, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center", marginRight: 11 },
  repeatCopy: { flex: 1, paddingRight: 8 },
  repeatTitle: { color: colors.ink, fontSize: 13, fontWeight: "800" },
  repeatText: { color: colors.muted, fontSize: 10, lineHeight: 14, marginTop: 3 },
  save: { marginTop: 22, minHeight: 58 },
});
