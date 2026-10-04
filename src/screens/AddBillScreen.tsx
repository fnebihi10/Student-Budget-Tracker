import EditConflictNotice from '../components/EditConflictNotice';
import type { StackProps } from '../navigation/routes';
import { useRequiredContext as useContext } from '../context/requiredContext';
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
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
import CategoryPicker from "../components/CategoryPicker";
import { BudgetContext } from "../context/BudgetContext";
import { expenseCategories } from "../data/categories";
import { colors, radius } from "../design";
import { confirmAction } from '../utils/dialogs';
import { validMoney } from '../domain/finance';

export default function AddBillScreen({ navigation, route }: StackProps<'AddBill'>) {
  const { saveBill, deleteBill, bills } = useContext(BudgetContext);
  const existing = bills.find((bill) => bill.id === route.params?.billId);
  const [editRevision] = useState(existing?.revision ?? 0);
  const [title, setTitle] = useState(existing?.title || "");
  const [amount, setAmount] = useState(existing ? String(existing.amount) : "");
  const [dueDay, setDueDay] = useState(existing ? String(existing.dueDay) : "");
  const [category, setCategory] = useState(existing?.category || "housing");
  const validDay = Number(dueDay) >= 1 && Number(dueDay) <= 31;

  const save = async () => {
    const saved = await saveBill({ id: route.params?.billId,
      revision: editRevision, title: title.trim(), amount: Number(amount.replace(",", ".")), dueDay: Number(dueDay), category });
    if (!saved) return;
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.flex}>
        <View style={styles.header}>
          <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => navigation.goBack()} style={styles.back}>
            <Ionicons aria-hidden={true} name="arrow-back" size={22} color={colors.ink} />
          </Pressable>
          <Text style={styles.title}>{route.params?.billId ? 'Edit monthly bill' : 'Add monthly bill'}</Text>
          <View style={styles.back} />
        </View>
        <EditConflictNotice id={route.params?.billId} revision={editRevision} current={existing} onClose={() => navigation.goBack()} />
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.art}>
            <Ionicons aria-hidden={true} name="calendar-outline" size={28} color={colors.primary} />
          </View>
          <Text style={styles.heading}>Never let a bill surprise you.</Text>
          <Text style={styles.intro}>Bills are planned obligations. The paid checkbox only updates tracking. Record payment in Budgets adds one expense and marks it paid together. If you already recorded the expense in Activity, use only the checkbox. Short months use their last day.</Text>

          <Text style={styles.label}>Bill name</Text>
          <TextInput accessibilityLabel="Bill name" maxLength={80} value={title} onChangeText={setTitle} placeholder="e.g. Phone plan" placeholderTextColor={colors.soft} style={styles.input} />
          <Text style={styles.label}>Monthly amount</Text>
          <TextInput accessibilityLabel="Amount" value={amount} onChangeText={(value) => setAmount(value.replace(/[^0-9.,]/g, ""))} keyboardType="decimal-pad" placeholder="0.00" placeholderTextColor={colors.soft} style={styles.input} />
          <Text style={styles.label}>Due day (1–31)</Text>
          <TextInput accessibilityLabel="Due day 1–31" value={dueDay} onChangeText={(value) => setDueDay(value.replace(/[^0-9]/g, ""))} keyboardType="number-pad" maxLength={2} placeholder="e.g. 15" placeholderTextColor={colors.soft} style={styles.input} />
          <Text style={styles.label}>Category</Text>
          <CategoryPicker categories={expenseCategories} value={category} onChange={setCategory} />
          <AppButton title="Save monthly bill" icon="checkmark" onPress={save} disabled={!title.trim() || !validMoney(amount) || !validDay} style={styles.button} />
          {existing ? <>
            <Text style={styles.label}>Paid occurrence history</Text>
            {Object.keys(existing.paymentHistory || {}).sort().reverse().map((month) => <Text key={month} style={styles.intro}>{month} — marked paid</Text>)}
            <AppButton title="Delete bill" variant="ghost" onPress={() => confirmAction({ title: 'Delete bill?', message: 'Removes this bill and its paid history. Recorded transactions remain.', confirmLabel: 'Delete', onConfirm: async () => { if (await deleteBill(existing.id, editRevision)) navigation.goBack(); } })} />
          </> : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safe: { flex: 1, backgroundColor: colors.canvas },
  header: { height: 60, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 18 },
  back: { width: 40, height: 40, borderRadius: 14, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" },
  title: { color: colors.ink, fontSize: 16, fontWeight: "900" },
  content: { width: "100%", maxWidth: 720, alignSelf: "center", paddingHorizontal: 20, paddingBottom: 35 },
  art: { width: 58, height: 58, borderRadius: 20, backgroundColor: colors.mint, alignItems: "center", justifyContent: "center", marginTop: 18 },
  heading: { color: colors.ink, fontSize: 25, fontWeight: "900", letterSpacing: -0.8, marginTop: 17 },
  intro: { color: colors.muted, fontSize: 14, lineHeight: 21, marginTop: 7, marginBottom: 18 },
  label: { color: colors.ink, fontSize: 13, fontWeight: "800", marginTop: 16, marginBottom: 8 },
  input: { minHeight: 55, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 15, color: colors.ink, fontSize: 14 },
  button: { marginTop: 26 },
});
