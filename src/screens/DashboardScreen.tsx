import type { IconName } from '../domain/models';
import type { TabProps } from '../navigation/routes';
import { useRequiredContext as useContext } from '../context/requiredContext';
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
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
import { isBillPaidForMonth } from "../utils/dates";
import { SubscriptionsContext } from '../context/SubscriptionsContext';
import { SplitsContext } from '../context/SplitsContext';
import { budgetEstimate } from '../domain/budgetEstimate';

export default function DashboardScreen({ navigation }: TabProps<'Home'>) {
  const { width } = useWindowDimensions();
  const isWide = width >= 900;
  const { transactions, bills, profile, settings, toggleBill } = useContext(BudgetContext);
  const { subscriptions } = useContext(SubscriptionsContext);
  const { splits } = useContext(SplitsContext);
  const [showAssumptions, setShowAssumptions] = useState(false);
  const totals = useMemo(() => getTotals(transactions), [transactions]);
  const current = useMemo(
    () =>
      [...transactions]
        .filter((item) => {
          const date = new Date(item.date);
          const now = new Date();
          return date.getUTCMonth() === now.getUTCMonth() && date.getUTCFullYear() === now.getUTCFullYear();
        })
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [transactions]
  );
  const remaining = settings.monthlyBudget - totals.expenses;
  const date = new Date();
  const daysLeft = Math.max(
    1,
    new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate() - date.getUTCDate() + 1
  );
  const estimate = budgetEstimate({ budget: settings.monthlyBudget, transactions, bills, subscriptions, debts: splits });
  const weeklySafe = estimate.estimate;
  const progress = Math.min((totals.expenses / Math.max(settings.monthlyBudget, 1)) * 100, 100);
  const nextBill = bills
    .filter((bill) => !isBillPaidForMonth(bill))
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
          <Pressable accessibilityRole="button"
            accessibilityLabel="Open profile"
            onPress={() => navigation.navigate("Profile")}
            style={styles.avatar}
          >
            <Text style={styles.avatarText}>
              {(profile.name || "P").slice(0, 1).toUpperCase()}
            </Text>
          </Pressable>
        </View>

        <View style={[styles.overview, isWide && styles.overviewWide]}>
        <LinearGradient
          colors={[colors.primaryDark, colors.primary]}
          style={[styles.hero, isWide && styles.heroWide]}
        >
          <View style={styles.heroTop}>
            <View>
              <Text style={styles.heroLabel}>BUDGET AFTER COMMITMENTS</Text>
              <Text style={styles.heroValue}>{formatMoney(Math.max(remaining - estimate.reserved, 0), settings.currency)}</Text>
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
              <Ionicons aria-hidden={true} name="calendar-outline" color={colors.primaryDark} size={18} />
            </View>
            <View style={styles.weeklyCopy}>
              <Text style={styles.weeklyLabel}>Estimate for the next {estimate.days} days</Text>
              <Text style={styles.weeklyText}>
                {formatMoney(weeklySafe, settings.currency)} after reserving {formatMoney(estimate.reserved, settings.currency)}.
              </Text>
            </View>
          </View>
          <Text style={styles.heroSmall}>A budget estimate; no bank balance is verified.</Text>
          <Pressable accessibilityRole="button" accessibilityState={{ expanded: showAssumptions }} onPress={() => setShowAssumptions((value) => !value)} hitSlop={8}>
            <Text style={styles.heroSmall}>{showAssumptions ? 'Hide estimate assumptions' : 'Show estimate assumptions'}</Text>
          </Pressable>
          {showAssumptions ? <Text style={styles.heroSmall}>{estimate.assumptions}</Text> : null}
        </LinearGradient>

        <View style={[styles.overviewSide, isWide && styles.overviewSideWide]}>
        <View style={[styles.quickRow, isWide && styles.quickRowWide]}>
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
            label="Monthly net"
            value={formatMoney(totals.balance, settings.currency, true)}
            color={colors.blue}
          />
        </View>

        {nextBill ? (
          <Pressable accessibilityRole="button"
            onPress={() => toggleBill(nextBill.id)}
            style={({ pressed }) => [styles.bill, pressed && styles.pressed]}
          >
            <View style={styles.billIcon}>
              <Ionicons aria-hidden={true}
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
            <Ionicons aria-hidden={true} name="checkmark-circle-outline" size={23} color={colors.soft} />
          </Pressable>
        ) : null}
        </View>
        </View>

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
                  <TransactionItem
                    item={item}
                    currency={settings.currency}
                    onPress={() =>
                      navigation.navigate("AddTransaction", { transactionId: item.id })
                    }
                  />
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

        <Pressable accessibilityRole="button"
          onPress={() => navigation.navigate("Reports")}
          style={({ pressed }) => [styles.insight, pressed && styles.pressed]}
        >
          <View style={styles.insightIcon}>
            <Ionicons aria-hidden={true} name="bulb-outline" size={22} color={colors.primaryDark} />
          </View>
          <View style={styles.insightCopy}>
            <Text style={styles.insightTitle}>Small wins add up</Text>
            <Text style={styles.insightText}>
              See where your money went and spot easy ways to stretch it.
            </Text>
          </View>
          <Ionicons aria-hidden={true} name="arrow-forward" size={19} color={colors.primary} />
        </Pressable>
      </ScrollView>

      <Pressable accessibilityRole="button"
        accessibilityLabel="Add a transaction"
        onPress={() => navigation.navigate("AddTransaction")}
        style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
      >
        <Ionicons aria-hidden={true} name="add" size={29} color={colors.surface} />
      </Pressable>
    </SafeAreaView>
  );
}

function SummaryCard({ icon, label, value, color }: { icon: IconName; label: string; value: string; color: string }) {
  return (
    <View style={styles.summaryCard}>
      <View style={[styles.summaryIcon, { backgroundColor: `${color}20` }]}>
        <Ionicons aria-hidden={true} name={icon} size={16} color={color} />
      </View>
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas },
  content: { width: "100%", maxWidth: 1180, alignSelf: "center", paddingHorizontal: 18, paddingBottom: 122 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
  },
  eyebrow: { color: colors.muted, fontSize: 12, fontWeight: "800", letterSpacing: 1.3 },
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
  overview: {},
  overviewWide: { flexDirection: "row", alignItems: "stretch", gap: 12 },
  heroWide: { flex: 1.25, justifyContent: "space-between" },
  overviewSide: {},
  overviewSideWide: { flex: 1 },
  heroTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  heroLabel: { color: "#A9C3B7", fontSize: 12, fontWeight: "900", letterSpacing: 1.3 },
  heroValue: { color: colors.surface, fontSize: 34, fontWeight: "900", letterSpacing: -1.3, marginTop: 3 },
  monthPill: { backgroundColor: "#3C6854", borderRadius: 99, paddingHorizontal: 10, paddingVertical: 7 },
  monthPillText: { color: colors.lime, fontSize: 12, fontWeight: "800" },
  heroTrack: { height: 7, backgroundColor: "#426B58", borderRadius: 99, marginTop: 18, overflow: "hidden" },
  heroFill: { height: "100%", backgroundColor: colors.lime, borderRadius: 99 },
  heroBottom: { flexDirection: "row", justifyContent: "space-between", marginTop: 7 },
  heroSmall: { color: "#BED0C7", fontSize: 12 },
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
  weeklyText: { color: "#C5D6CE", fontSize: 12, marginTop: 3 },
  quickRow: { flexDirection: "row", gap: 9, marginTop: 12 },
  quickRowWide: { marginTop: 0 },
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
  summaryLabel: { color: colors.muted, fontSize: 12, marginTop: 2 },
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
  billEyebrow: { color: colors.primary, fontSize: 12, fontWeight: "900", letterSpacing: 0.8 },
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
  insightText: { color: colors.muted, fontSize: 12, lineHeight: 16, marginTop: 3 },
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
