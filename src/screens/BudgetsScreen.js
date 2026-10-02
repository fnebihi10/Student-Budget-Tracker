import { Ionicons } from "@expo/vector-icons";
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
import AppButton from "../components/AppButton";
import BudgetCard from "../components/BudgetCard";
import SectionHeader from "../components/SectionHeader";
import SubscriptionShortcut from "../components/SubscriptionShortcut";
import { BudgetContext } from "../context/BudgetContext";
import { categoryById } from "../data/categories";
import { colors, radius, type } from "../design";
import { categorySpend } from "../utils/calculations";
import { formatMoney } from "../utils/formatters";
import { isBillPaidForMonth, monthKey } from "../utils/dates";
import MonthSwitcher from '../components/MonthSwitcher';
import { validMoney } from '../domain/finance';

export default function BudgetsScreen({ navigation }) {
  const {
    transactions,
    categoryBudgets: currentCategories,
    defaultCategoryBudgets,
    periodBudgets,
    setCategoryBudget,
    bills,
    toggleBill,
    settings,
  } = useContext(BudgetContext);
  const [month, setMonth] = useState(new Date());
  const categoryBudgets = periodBudgets[monthKey(month)]?.categoryBudgets || defaultCategoryBudgets || currentCategories;
  const spend = useMemo(() => categorySpend(transactions, month), [transactions, month]);
  const [editing, setEditing] = useState(null);
  const [limit, setLimit] = useState("");
  const totalPlanned = Object.values(categoryBudgets).reduce((sum, value) => sum + value, 0);

  const openEdit = (category) => {
    setEditing(category);
    setLimit(String(categoryBudgets[category] || ""));
  };

  const saveLimit = async () => {
    if (!await setCategoryBudget(editing, limit, monthKey(month))) return;
    setEditing(null);
  };

  return (
    <SafeAreaView edges={["top"]} style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>YOUR PLAN</Text>
            <Text style={styles.title}>Budgets & bills</Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Add bill" onPress={() => navigation.navigate("AddBill")} style={styles.add}>
            <Ionicons name="add" size={24} color={colors.surface} />
          </Pressable>
        </View>

        <MonthSwitcher value={month} onChange={setMonth} allowFuture />
        <View style={styles.planCard}>
          <View style={styles.planIcon}>
            <Ionicons name="map-outline" size={22} color={colors.primaryDark} />
          </View>
          <View style={styles.planCopy}>
            <Text style={styles.planLabel}>PLANNED ACROSS CATEGORIES</Text>
            <Text style={styles.planValue}>{formatMoney(totalPlanned, settings.currency)}</Text>
          </View>
          <Text style={styles.planHint}>Tap a category to edit</Text>
        </View>

        <SubscriptionShortcut navigation={navigation} />

        <View style={styles.section}>
          <SectionHeader title="Category limits" />
          {Object.keys(categoryBudgets).map((category) => (
            <BudgetCard
              key={category}
              categoryId={category}
              spent={spend[category] || 0}
              limit={categoryBudgets[category]}
              currency={settings.currency}
              onPress={() => openEdit(category)}
            />
          ))}
        </View>

        <View style={styles.section}>
          <SectionHeader
            title="Monthly bills"
            action="Add bill"
            onAction={() => navigation.navigate("AddBill")}
          />
          {bills.length ? (
            <View style={styles.bills}>
              {[...bills]
                .sort((a, b) => a.dueDay - b.dueDay)
                .map((bill, index) => {
                  const category = categoryById(bill.category);
                  const isPaid = isBillPaidForMonth(bill, month);
                  return (
                    <View key={bill.id}>
                      <Pressable accessibilityRole="checkbox" accessibilityLabel={`${bill.title} paid for ${monthKey(month)}`} accessibilityState={{ checked: isPaid }} onPress={() => toggleBill(bill.id, monthKey(month))} style={styles.bill}>
                        <View style={[styles.billIcon, { backgroundColor: `${category.color}25` }]}>
                          <Ionicons name={category.icon} size={20} color={category.color} />
                        </View>
                        <View style={styles.billCopy}>
                          <Text style={[styles.billTitle, isPaid && styles.billPaid]}>{bill.title}</Text>
                          <Text style={styles.billMeta}>Due day {bill.dueDay}</Text>
                        </View>
                        <Text style={[styles.billAmount, isPaid && styles.billPaid]}>
                          {formatMoney(bill.amount, settings.currency)}
                        </Text>
                        <Ionicons
                          name={isPaid ? "checkmark-circle" : "ellipse-outline"}
                          size={23}
                          color={isPaid ? colors.primary : colors.soft}
                        />
                      </Pressable>
                      <AppButton title={`Edit ${bill.title}`} variant="ghost" onPress={() => navigation.navigate('AddBill', { billId: bill.id })} />
                      {index < bills.length - 1 ? <View style={styles.divider} /> : null}
                    </View>
                  );
                })}
            </View>
          ) : (
            <View style={styles.noBills}>
              <Ionicons name="calendar-clear-outline" size={25} color={colors.primary} />
              <View style={styles.noBillsCopy}>
                <Text style={styles.noBillsTitle}>Nothing due yet</Text>
                <Text style={styles.noBillsText}>Add rent, phone, tuition, or subscriptions.</Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      <Modal visible={Boolean(editing)} transparent animationType="fade" onRequestClose={() => setEditing(null)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.modalShade}>
          <Pressable accessibilityRole="button" style={StyleSheet.absoluteFill} onPress={() => setEditing(null)} />
          <View style={styles.modalCard}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>
              {editing ? categoryById(editing).label : ""} limit
            </Text>
            <Text style={styles.modalText}>This limit applies only to the selected month. Unconfigured months use your default plan.</Text>
            <TextInput accessibilityLabel="Category limit"
              value={limit}
              onChangeText={(value) => setLimit(value.replace(/[^0-9.,]/g, ""))}
              keyboardType="decimal-pad"
              autoFocus
              placeholder="0"
              placeholderTextColor={colors.soft}
              style={styles.limitInput}
            />
            <AppButton title="Save limit" onPress={saveLimit} disabled={!validMoney(limit, true)} />
            <AppButton title="Cancel" variant="ghost" onPress={() => setEditing(null)} />
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas },
  content: { width: "100%", maxWidth: 1180, alignSelf: "center", paddingHorizontal: 18, paddingBottom: 110 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingTop: 13, paddingBottom: 16 },
  eyebrow: { color: colors.muted, fontSize: 10, fontWeight: "800", letterSpacing: 1.2 },
  title: { ...type.h1, marginTop: 2, letterSpacing: -0.7 },
  add: { width: 44, height: 44, borderRadius: 16, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  planCard: { flexDirection: "row", alignItems: "center", backgroundColor: colors.lime, borderRadius: radius.lg, padding: 16 },
  planIcon: { width: 46, height: 46, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.6)", alignItems: "center", justifyContent: "center", marginRight: 12 },
  planCopy: { flex: 1 },
  planLabel: { color: colors.primary, fontSize: 9, letterSpacing: 0.8, fontWeight: "900" },
  planValue: { color: colors.primaryDark, fontSize: 22, fontWeight: "900", marginTop: 3 },
  planHint: { color: colors.primary, fontSize: 9, maxWidth: 58, lineHeight: 13, textAlign: "right" },
  section: { marginTop: 25 },
  bills: { backgroundColor: colors.surface, borderRadius: radius.lg, paddingHorizontal: 14, borderWidth: 1, borderColor: colors.line },
  bill: { minHeight: 68, flexDirection: "row", alignItems: "center", gap: 10 },
  billIcon: { width: 40, height: 40, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  billCopy: { flex: 1 },
  billTitle: { color: colors.ink, fontSize: 13, fontWeight: "800" },
  billMeta: { color: colors.muted, fontSize: 10, marginTop: 3 },
  billAmount: { color: colors.ink, fontSize: 12, fontWeight: "900" },
  billPaid: { color: colors.soft, textDecorationLine: "line-through" },
  divider: { height: 1, backgroundColor: colors.line, marginLeft: 50 },
  noBills: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, padding: 18, flexDirection: "row", alignItems: "center", gap: 13 },
  noBillsCopy: { flex: 1 },
  noBillsTitle: { color: colors.ink, fontSize: 13, fontWeight: "800" },
  noBillsText: { color: colors.muted, fontSize: 11, marginTop: 3 },
  modalShade: { flex: 1, backgroundColor: "rgba(14,29,21,0.42)", justifyContent: "flex-end" },
  modalCard: { backgroundColor: colors.canvas, borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingHorizontal: 21, paddingTop: 10, paddingBottom: 30 },
  modalHandle: { width: 42, height: 5, borderRadius: 9, backgroundColor: colors.line, alignSelf: "center", marginBottom: 20 },
  modalTitle: { ...type.h2 },
  modalText: { color: colors.muted, fontSize: 13, marginTop: 5 },
  limitInput: { minHeight: 65, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, marginVertical: 18, paddingHorizontal: 17, color: colors.ink, fontSize: 25, fontWeight: "900" },
});
