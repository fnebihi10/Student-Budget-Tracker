import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useContext, useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BudgetContext } from "../context/BudgetContext";
import { GoalsContext } from "../context/GoalsContext";
import { SplitsContext } from "../context/SplitsContext";
import { SubscriptionsContext } from "../context/SubscriptionsContext";
import { colors, radius, shadow } from "../design";
import { calculateHealth } from "../utils/coach";
import { formatMoney } from "../utils/formatters";
import { goalTotals } from "../utils/goals";
import { activeSubscriptionTotal } from "../utils/subscriptions";

export default function StudentHubScreen({ navigation }) {
  const budget = useContext(BudgetContext);
  const { goals } = useContext(GoalsContext);
  const { subscriptions } = useContext(SubscriptionsContext);
  const { splits } = useContext(SplitsContext);
  const health = useMemo(
    () =>
      calculateHealth({
        transactions: budget.transactions,
        settings: budget.settings,
        bills: budget.bills,
        subscriptions,
        goals,
      }),
    [budget.transactions, budget.settings, budget.bills, subscriptions, goals]
  );
  const goalSavings = useMemo(() => goalTotals(goals).saved, [goals]);
  const recurring = useMemo(
    () => activeSubscriptionTotal(subscriptions),
    [subscriptions]
  );
  const openSplits = splits.filter((item) => item.status === "open");
  const owedToMe = openSplits
    .filter((item) => item.direction === "owed_to_me")
    .reduce((sum, item) => sum + Number(item.amount), 0);
  const iOwe = openSplits
    .filter((item) => item.direction === "i_owe")
    .reduce((sum, item) => sum + Number(item.amount), 0);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.back}>
          <Ionicons name="arrow-back" size={22} color={colors.ink} />
        </Pressable>
        <Text style={styles.headerTitle}>Student money hub</Text>
        <View style={styles.back} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={["#1C4434", "#285F49", "#34765B"]}
          style={styles.hero}
        >
          <View style={styles.heroTop}>
            <View>
              <Text style={styles.heroLabel}>MONEY HEALTH</Text>
              <Text style={styles.heroTitle}>{health.grade}</Text>
              <Text style={styles.heroText}>
                One calm view of the things competing for your student budget.
              </Text>
            </View>
            <View style={styles.score}>
              <Text style={styles.scoreValue}>{health.score}</Text>
              <Text style={styles.scoreMax}>/100</Text>
            </View>
          </View>
          <Pressable
            onPress={() => navigation.navigate("Coach")}
            style={styles.heroAction}
          >
            <Text style={styles.heroActionText}>See my full money check-up</Text>
            <Ionicons name="arrow-forward" size={17} color={colors.lime} />
          </Pressable>
        </LinearGradient>

        <View style={styles.stats}>
          <MiniStat
            label="GOALS"
            value={formatMoney(goalSavings, budget.settings.currency, true)}
            icon="flag-outline"
            color="#4FA982"
          />
          <MiniStat
            label="RECURRING"
            value={formatMoney(recurring, budget.settings.currency, true)}
            icon="repeat-outline"
            color="#5D82D8"
          />
          <MiniStat
            label="SPLIT NET"
            value={formatMoney(owedToMe - iOwe, budget.settings.currency, true)}
            icon="people-outline"
            color="#9A75D5"
          />
        </View>

        <Text style={styles.sectionTitle}>Plan together</Text>
        <HubFeature
          icon="calendar"
          title="Money calendar"
          subtitle="See expenses, bills, renewals, and goal deadlines on one timeline."
          badge={`${budget.bills.length + subscriptions.length} commitments`}
          color="#5D82D8"
          onPress={() => navigation.navigate("MoneyCalendar")}
        />
        <HubFeature
          icon="people"
          title="Split & settle"
          subtitle="Track shared rent, groceries, trips, and who owes whom."
          badge={`${openSplits.length} open`}
          color="#9A75D5"
          onPress={() => navigation.navigate("Splits")}
        />
        <HubFeature
          icon="pulse"
          title="Smart money coach"
          subtitle="Understand your score and get actions based on your financial data."
          badge={`${health.score}/100`}
          color="#4FA982"
          onPress={() => navigation.navigate("Coach")}
        />

        <Text style={styles.sectionTitle}>Your foundation</Text>
        <View style={styles.foundation}>
          <FoundationRow
            icon="wallet-outline"
            title="Monthly budget"
            value={formatMoney(
              budget.settings.monthlyBudget,
              budget.settings.currency
            )}
            onPress={() => navigation.navigate("Main", { screen: "Budgets" })}
          />
          <View style={styles.divider} />
          <FoundationRow
            icon="flag-outline"
            title="Savings goals"
            value={`${goals.length} goal${goals.length === 1 ? "" : "s"}`}
            onPress={() => navigation.navigate("Goals")}
          />
          <View style={styles.divider} />
          <FoundationRow
            icon="repeat-outline"
            title="Subscriptions"
            value={`${subscriptions.length} tracked`}
            onPress={() => navigation.navigate("Subscriptions")}
          />
        </View>

        <View style={styles.note}>
          <Ionicons
            name="lock-closed-outline"
            size={18}
            color={colors.primary}
          />
          <Text style={styles.noteText}>
            Coach recommendations and shared-expense records are calculated and
            stored locally. No bank account or contact access is required.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function MiniStat({ label, value, icon, color }) {
  return (
    <View style={styles.miniStat}>
      <View style={[styles.miniIcon, { backgroundColor: `${color}20` }]}>
        <Ionicons name={icon} size={16} color={color} />
      </View>
      <Text numberOfLines={1} style={styles.miniValue}>
        {value}
      </Text>
      <Text style={styles.miniLabel}>{label}</Text>
    </View>
  );
}

function HubFeature({ icon, title, subtitle, badge, color, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.feature, pressed && styles.pressed]}
    >
      <View style={[styles.featureIcon, { backgroundColor: `${color}20` }]}>
        <Ionicons name={icon} size={25} color={color} />
      </View>
      <View style={styles.featureCopy}>
        <View style={styles.featureTitleRow}>
          <Text style={styles.featureTitle}>{title}</Text>
          <View style={[styles.badge, { backgroundColor: `${color}18` }]}>
            <Text style={[styles.badgeText, { color }]}>{badge}</Text>
          </View>
        </View>
        <Text style={styles.featureText}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.soft} />
    </Pressable>
  );
}

function FoundationRow({ icon, title, value, onPress }) {
  return (
    <Pressable onPress={onPress} style={styles.foundationRow}>
      <View style={styles.foundationIcon}>
        <Ionicons name={icon} size={18} color={colors.primary} />
      </View>
      <Text style={styles.foundationTitle}>{title}</Text>
      <Text style={styles.foundationValue}>{value}</Text>
      <Ionicons name="chevron-forward" size={18} color={colors.soft} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas },
  header: {
    height: 60,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  back: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { color: colors.ink, fontSize: 16, fontWeight: "900" },
  content: { width: "100%", maxWidth: 1180, alignSelf: "center", paddingHorizontal: 18, paddingBottom: 35 },
  hero: { borderRadius: radius.xl, padding: 20, ...shadow },
  heroTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  heroLabel: {
    color: colors.lime,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.1,
  },
  heroTitle: {
    color: colors.surface,
    fontSize: 27,
    fontWeight: "900",
    marginTop: 3,
  },
  heroText: {
    color: "#C4D4CC",
    fontSize: 10,
    lineHeight: 15,
    maxWidth: 230,
    marginTop: 5,
  },
  score: {
    width: 66,
    height: 66,
    borderRadius: 24,
    backgroundColor: colors.lime,
    alignItems: "center",
    justifyContent: "center",
  },
  scoreValue: {
    color: colors.primaryDark,
    fontSize: 22,
    fontWeight: "900",
  },
  scoreMax: { color: colors.primary, fontSize: 8, fontWeight: "800" },
  heroAction: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255,255,255,0.10)",
    borderRadius: radius.md,
    padding: 12,
    marginTop: 17,
  },
  heroActionText: { color: colors.surface, fontSize: 11, fontWeight: "800" },
  stats: { flexDirection: "row", gap: 9, marginTop: 11 },
  miniStat: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 11,
  },
  miniIcon: {
    width: 29,
    height: 29,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  miniValue: { color: colors.ink, fontSize: 12, fontWeight: "900" },
  miniLabel: {
    color: colors.muted,
    fontSize: 8,
    fontWeight: "800",
    marginTop: 2,
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: "900",
    marginTop: 24,
    marginBottom: 10,
  },
  feature: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 14,
    marginBottom: 9,
  },
  pressed: { opacity: 0.66 },
  featureIcon: {
    width: 51,
    height: 51,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
  },
  featureCopy: { flex: 1, paddingRight: 8 },
  featureTitleRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  featureTitle: { color: colors.ink, fontSize: 13, fontWeight: "900" },
  featureText: {
    color: colors.muted,
    fontSize: 9,
    lineHeight: 14,
    marginTop: 4,
  },
  badge: { borderRadius: 99, paddingHorizontal: 7, paddingVertical: 4 },
  badgeText: { fontSize: 7, fontWeight: "900" },
  foundation: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 13,
  },
  foundationRow: {
    minHeight: 62,
    flexDirection: "row",
    alignItems: "center",
  },
  foundationIcon: {
    width: 35,
    height: 35,
    borderRadius: 12,
    backgroundColor: colors.mint,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  foundationTitle: {
    flex: 1,
    color: colors.ink,
    fontSize: 11,
    fontWeight: "800",
  },
  foundationValue: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: "700",
    marginRight: 6,
  },
  divider: { height: 1, backgroundColor: colors.line, marginLeft: 45 },
  note: {
    flexDirection: "row",
    gap: 9,
    backgroundColor: colors.mint,
    borderRadius: radius.md,
    padding: 13,
    marginTop: 17,
  },
  noteText: {
    flex: 1,
    color: colors.primaryDark,
    fontSize: 9,
    lineHeight: 14,
  },
});
