import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useContext, useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import EmptyState from "../components/EmptyState";
import GoalShortcut from "../components/GoalShortcut";
import SectionHeader from "../components/SectionHeader";
import StudentHubShortcut from "../components/StudentHubShortcut";
import SubscriptionShortcut from "../components/SubscriptionShortcut";
import TransactionItem from "../components/TransactionItem";
import { BudgetContext } from "../context/BudgetContext";
import { categoryById } from "../data/categories";
import { colors, radius, shadow, type } from "../design";
import { getTotals } from "../utils/calculations";
import { formatMoney, monthLabel } from "../utils/formatters";

export default function DashboardScreen({ navigation }) {
  const { transactions, bills, profile, settings, toggleBill } = useContext(BudgetContext);
  const totals = useMemo(() => getTotals(transactions), [transactions]);
  const current = useMemo(
    () =>
      [...transactions]
        .filter((item) => {
          const date = new Date(item.date);
          const now = new Date();
          return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
        })
        .sort((a, b) => new Date(b.date) - new Date(a.date)),
    [transactions]
  );
  const remaining = settings.monthlyBudget - totals.expenses;
  const date = new Date();
  const daysLeft = Math.max(
    1,
    new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate() - date.getDate() + 1
  );
  const weeklySafe = Math.max(0, (remaining / daysLeft) * 7);
  const progress = Math.min((totals.expenses / Math.max(settings.monthlyBudget, 1)) * 100, 100);
  const nextBill = bills
    .filter((bill) => !bill.paid)
    .sort((a, b) => a.dueDay - b.dueDay)[0];

  return (
    <SafeAreaView edges={["top"]} style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>{monthLabel().toUpperCase()}</Text>
            <Text style={styles.greeting}>
              Hi {profile.name || "there"} <Text style={styles.wave}>✦</Text>
            </Text>
          </View>
          <Pressable
            accessibilityLabel="Open profile"
            onPress={() => navigation.navigate("Profile")}
            style={styles.avatar}
          >
            <Text style={styles.avatarText}>
              {(profile.name || "P").slice(0, 1).toUpperCase()}
            </Text>
          </Pressable>
        </View>

        <LinearGradient colors={[colors.primaryDark, colors.primary]} style={styles.hero}>
          <View style={styles.heroTop}>
            <View>
              <Text style={styles.heroLabel}>SAFE TO SPEND</Text>
              <Text style={styles.heroValue}>{formatMoney(Math.max(remaining, 0), settings.currency)}</Text>
            </View>
            <View style={styles.monthPill}>
              <Text style={styles.monthPillText}>{daysLeft} days left</Text>
            </View>
          </View>
          <View style={styles.heroTrack}>
            <View style={[styles.heroFill, { width: `${progress}%` }]} />
          </View>
          <View style={styles.heroBottom}>
            <Text style={styles.heroSmall}>
              {formatMoney(totals.expenses, settings.currency)} spent
            </Text>
            <Text style={styles.heroSmall}>
              {formatMoney(settings.monthlyBudget, settings.currency)} plan
            </Text>
          </View>
          <View style={styles.weekly}>
            <View style={styles.weeklyIcon}>
              <Ionicons name="calendar-outline" color={colors.primaryDark} size={18} />
            </View>
            <View style={styles.weeklyCopy}>
              <Text style={styles.weeklyLabel}>Your weekly pace</Text>
              <Text style={styles.weeklyText}>
                About {formatMoney(weeklySafe, settings.currency)} is comfortable this week.
              </Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.quickRow}>
          <SummaryCard
            icon="arrow-down"
            label="Income"
            value={formatMoney(totals.income, settings.currency, true)}
            color={colors.primary}
          />
          <SummaryCard
            icon="arrow-up"
            label="Spent"
            value={formatMoney(totals.expenses, settings.currency, true)}
            color={colors.coral}
          />
          <SummaryCard
            icon="wallet-outline"
            label="Balance"
            value={formatMoney(totals.balance, settings.currency, true)}
            color={colors.blue}
          />
        </View>

        {nextBill ? (
          <Pressable
            onPress={() => toggleBill(nextBill.id)}
            style={({ pressed }) => [styles.bill, pressed && styles.pressed]}
          >
            <View style={styles.billIcon}>
              <Ionicons
                name={categoryById(nextBill.category).icon}
                size={20}
                color={colors.primary}
              />
            </View>
            <View style={styles.billCopy}>
              <Text style={styles.billEyebrow}>UPCOMING · DAY {nextBill.dueDay}</Text>
              <Text style={styles.billTitle}>{nextBill.title}</Text>
            </View>
            <Text style={styles.billAmount}>
              {formatMoney(nextBill.amount, settings.currency)}
            </Text>
            <Ionicons name="checkmark-circle-outline" size={23} color={colors.soft} />
          </Pressable>
        ) : null}

        <StudentHubShortcut navigation={navigation} />
        <SubscriptionShortcut navigation={navigation} />
        <GoalShortcut navigation={navigation} />

        <View style={styles.section}>
          <SectionHeader
            title="Recent activity"
            action={current.length ? "See all" : undefined}
            onAction={() => navigation.navigate("Activity")}
          />
          {current.length ? (
            <View style={styles.list}>
              {current.slice(0, 4).map((item, index) => (
                <View key={item.id}>
                  <TransactionItem item={item} currency={settings.currency} />
                  {index < Math.min(current.length, 4) - 1 ? <View style={styles.divider} /> : null}
                </View>
              ))}
            </View>
          ) : (
            <EmptyState
              icon="receipt-outline"
              title="A fresh month"
              message="Add your first expense or income and your overview will come alive."
              action="Add transaction"
              onAction={() => navigation.navigate("AddTransaction")}
            />
          )}
        </View>

        <Pressable
          onPress={() => navigation.navigate("Reports")}
          style={({ pressed }) => [styles.insight, pressed && styles.pressed]}
        >
          <View style={styles.insightIcon}>
            <Ionicons name="bulb-outline" size={22} color={colors.primaryDark} />
          </View>
          <View style={styles.insightCopy}>
            <Text style={styles.insightTitle}>Small wins add up</Text>
            <Text style={styles.insightText}>
              See where your money went and spot easy ways to stretch it.
            </Text>
          </View>
          <Ionicons name="arrow-forward" size={19} color={colors.primary} />
        </Pressable>
      </ScrollView>

      <Pressable
        accessibilityLabel="Add a transaction"
        onPress={() => navigation.navigate("AddTransaction")}
        style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
      >
        <Ionicons name="add" size={29} color={colors.surface} />
      </Pressable>
    </SafeAreaView>
  );
}

function SummaryCard({ icon, label, value, color }) {
  return (
    <View style={styles.summaryCard}>
      <View style={[styles.summaryIcon, { backgroundColor: `${color}20` }]}>
        <Ionicons name={icon} size={16} color={color} />
      </View>
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas },
  content: { paddingHorizontal: 18, paddingBottom: 122 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
  },
  eyebrow: { color: colors.muted, fontSize: 10, fontWeight: "800", letterSpacing: 1.3 },
  greeting: { ...type.h1, marginTop: 2, letterSpacing: -0.8 },
  wave: { color: colors.primary },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: colors.lime,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: colors.primaryDark, fontWeight: "900", fontSize: 17 },
  hero: { borderRadius: radius.xl, padding: 20, overflow: "hidden", ...shadow },
  heroTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  heroLabel: { color: "#A9C3B7", fontSize: 10, fontWeight: "900", letterSpacing: 1.3 },
  heroValue: { color: colors.surface, fontSize: 34, fontWeight: "900", letterSpacing: -1.3, marginTop: 3 },
  monthPill: { backgroundColor: "#3C6854", borderRadius: 99, paddingHorizontal: 10, paddingVertical: 7 },
  monthPillText: { color: colors.lime, fontSize: 10, fontWeight: "800" },
  heroTrack: { height: 7, backgroundColor: "#426B58", borderRadius: 99, marginTop: 18, overflow: "hidden" },
  heroFill: { height: "100%", backgroundColor: colors.lime, borderRadius: 99 },
  heroBottom: { flexDirection: "row", justifyContent: "space-between", marginTop: 7 },
  heroSmall: { color: "#BED0C7", fontSize: 10 },
  weekly: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.10)",
    borderRadius: radius.md,
    padding: 12,
    marginTop: 18,
  },
  weeklyIcon: {
    width: 37,
    height: 37,
    borderRadius: 13,
    backgroundColor: colors.lime,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  weeklyCopy: { flex: 1 },
  weeklyLabel: { color: colors.surface, fontSize: 12, fontWeight: "800" },
  weeklyText: { color: "#C5D6CE", fontSize: 10, marginTop: 3 },
  quickRow: { flexDirection: "row", gap: 9, marginTop: 12 },
  summaryCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.line,
  },
  summaryIcon: { width: 29, height: 29, borderRadius: 10, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  summaryValue: { color: colors.ink, fontSize: 14, fontWeight: "900" },
  summaryLabel: { color: colors.muted, fontSize: 10, marginTop: 2 },
  bill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.mint,
    borderRadius: radius.lg,
    padding: 14,
    marginTop: 12,
    gap: 10,
  },
  billIcon: { width: 40, height: 40, borderRadius: 14, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" },
  billCopy: { flex: 1 },
  billEyebrow: { color: colors.primary, fontSize: 9, fontWeight: "900", letterSpacing: 0.8 },
  billTitle: { color: colors.ink, fontSize: 13, fontWeight: "800", marginTop: 3 },
  billAmount: { color: colors.ink, fontSize: 13, fontWeight: "900" },
  section: { marginTop: 25 },
  list: { backgroundColor: colors.surface, borderRadius: radius.lg, paddingHorizontal: 15, borderWidth: 1, borderColor: colors.line },
  divider: { height: 1, backgroundColor: colors.line, marginLeft: 57 },
  insight: {
    marginTop: 16,
    borderRadius: radius.lg,
    padding: 15,
    backgroundColor: "#EEF2D0",
    flexDirection: "row",
    alignItems: "center",
  },
  insightIcon: { width: 43, height: 43, borderRadius: 15, backgroundColor: colors.lime, alignItems: "center", justifyContent: "center", marginRight: 11 },
  insightCopy: { flex: 1, paddingRight: 8 },
  insightTitle: { color: colors.ink, fontSize: 13, fontWeight: "900" },
  insightText: { color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: 3 },
  pressed: { opacity: 0.7 },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 18,
    width: 58,
    height: 58,
    borderRadius: 21,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    ...shadow,
  },
  fabPressed: { transform: [{ scale: 0.94 }] },
});
