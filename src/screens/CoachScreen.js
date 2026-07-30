import { Ionicons } from "@expo/vector-icons";
import React, { useContext, useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle } from "react-native-svg";
import { BudgetContext } from "../context/BudgetContext";
import { GoalsContext } from "../context/GoalsContext";
import { SubscriptionsContext } from "../context/SubscriptionsContext";
import { categoryById } from "../data/categories";
import { colors, radius } from "../design";
import { calculateHealth } from "../utils/coach";
import { formatMoney } from "../utils/formatters";

export default function CoachScreen({ navigation }) {
  const budget = useContext(BudgetContext);
  const { goals } = useContext(GoalsContext);
  const { subscriptions } = useContext(SubscriptionsContext);
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
  const actions = buildActions(health, budget, goals, subscriptions, navigation);
  const strongest = [...health.breakdown].sort(
    (a, b) => b.score / b.max - a.score / a.max
  )[0];

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.back}>
          <Ionicons name="arrow-back" size={22} color={colors.ink} />
        </Pressable>
        <Text style={styles.headerTitle}>Smart money coach</Text>
        <View style={styles.back} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.scoreCard}>
          <ScoreRing score={health.score} />
          <View style={styles.scoreCopy}>
            <Text style={styles.scoreEyebrow}>YOUR MONEY HEALTH</Text>
            <Text style={styles.scoreTitle}>{health.grade}</Text>
            <Text style={styles.scoreText}>
              This transparent score uses only your Pocketwise plan, cash flow,
              goals, commitments, and tracking habits.
            </Text>
          </View>
        </View>

        <View style={styles.breakdownCard}>
          <Text style={styles.sectionTitle}>How the score is built</Text>
          {health.breakdown.map((item) => {
            const ratio = (item.score / item.max) * 100;
            return (
              <View key={item.id} style={styles.breakdown}>
                <View style={styles.breakdownTop}>
                  <Text style={styles.breakdownLabel}>{item.label}</Text>
                  <Text style={styles.breakdownValue}>
                    {item.score}/{item.max}
                  </Text>
                </View>
                <View style={styles.track}>
                  <View
                    style={[
                      styles.fill,
                      {
                        width: `${ratio}%`,
                        backgroundColor:
                          ratio >= 75
                            ? colors.primary
                            : ratio >= 50
                            ? colors.amber
                            : colors.coral,
                      },
                    ]}
                  />
                </View>
              </View>
            );
          })}
          <View style={styles.strongest}>
            <Ionicons
              name="sparkles-outline"
              size={18}
              color={colors.primary}
            />
            <Text style={styles.strongestText}>
              Your strongest area right now is{" "}
              <Text style={styles.strongestBold}>{strongest.label}</Text>.
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitleOutside}>Recommended next moves</Text>
        {actions.map((action) => (
          <Pressable
            key={action.id}
            onPress={action.onPress}
            style={({ pressed }) => [
              styles.action,
              pressed && styles.pressed,
            ]}
          >
            <View
              style={[
                styles.actionIcon,
                { backgroundColor: `${action.color}20` },
              ]}
            >
              <Ionicons
                name={action.icon}
                size={22}
                color={action.color}
              />
            </View>
            <View style={styles.actionCopy}>
              <View style={styles.actionTitleRow}>
                <Text style={styles.actionTitle}>{action.title}</Text>
                <View
                  style={[
                    styles.priority,
                    { backgroundColor: `${action.color}16` },
                  ]}
                >
                  <Text style={[styles.priorityText, { color: action.color }]}>
                    {action.priority}
                  </Text>
                </View>
              </View>
              <Text style={styles.actionText}>{action.text}</Text>
            </View>
            <Ionicons name="arrow-forward" size={18} color={colors.soft} />
          </Pressable>
        ))}

        <Text style={styles.sectionTitleOutside}>This week’s challenge</Text>
        <View style={styles.challenge}>
          <View style={styles.challengeTop}>
            <View style={styles.challengeIcon}>
              <Ionicons
                name="cafe-outline"
                size={24}
                color={colors.primaryDark}
              />
            </View>
            <View style={styles.challengeCopy}>
              <Text style={styles.challengeEyebrow}>SMALL WIN</Text>
              <Text style={styles.challengeTitle}>The three-check pause</Text>
            </View>
          </View>
          <Text style={styles.challengeText}>
            Before three non-essential purchases, check your safe-to-spend
            balance, wait ten minutes, and decide again. Record only the purchases
            you still value.
          </Text>
          <View style={styles.challengeSteps}>
            {["Check", "Pause", "Choose"].map((step, index) => (
              <View key={step} style={styles.challengeStep}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{index + 1}</Text>
                </View>
                <Text style={styles.stepText}>{step}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.disclaimer}>
          <Ionicons
            name="information-circle-outline"
            size={19}
            color={colors.primary}
          />
          <Text style={styles.disclaimerText}>
            The health score is a budgeting aid, not financial advice or a credit
            score. Its formula is shown above and never uses bank, credit, or
            external identity data.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function ScoreRing({ score }) {
  const size = 128;
  const stroke = 10;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  return (
    <View style={styles.ringWrap}>
      <Svg width={size} height={size} style={styles.ring}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#DDE9E1"
          strokeWidth={stroke}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.primary}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={styles.ringValue}>
        <Text style={styles.ringNumber}>{score}</Text>
        <Text style={styles.ringMax}>OUT OF 100</Text>
      </View>
    </View>
  );
}

function buildActions(health, budget, goals, subscriptions, navigation) {
  const actions = [];
  if (health.budgetRatio > 1) {
    actions.push({
      id: "budget",
      icon: "wallet-outline",
      color: colors.red,
      priority: "HIGH IMPACT",
      title: "Bring the plan back into range",
      text: `This month is ${formatMoney(
        health.totals.expenses - budget.settings.monthlyBudget,
        budget.settings.currency
      )} over plan. Review your largest flexible category first.`,
      onPress: () => navigation.navigate("Main", { screen: "Budgets" }),
    });
  } else {
    actions.push({
      id: "budget",
      icon: "checkmark-circle-outline",
      color: colors.primary,
      priority: "ON TRACK",
      title: "Protect your remaining budget",
      text: `${formatMoney(
        Math.max(budget.settings.monthlyBudget - health.totals.expenses, 0),
        budget.settings.currency
      )} remains in this month’s plan.`,
      onPress: () => navigation.navigate("Main", { screen: "Budgets" }),
    });
  }

  if (health.recurringRatio > 0.15) {
    actions.push({
      id: "subscriptions",
      icon: "repeat-outline",
      color: colors.blue,
      priority: "REVIEW",
      title: "Audit recurring services",
      text: `Subscriptions use ${Math.round(
        health.recurringRatio * 100
      )}% of your monthly plan. Pause anything that no longer earns its place.`,
      onPress: () => navigation.navigate("Subscriptions"),
    });
  } else if (subscriptions.length) {
    actions.push({
      id: "subscriptions",
      icon: "repeat-outline",
      color: colors.blue,
      priority: "HEALTHY",
      title: "Recurring costs look manageable",
      text: `Your tracked services total ${formatMoney(
        health.recurring,
        budget.settings.currency
      )} per month.`,
      onPress: () => navigation.navigate("Subscriptions"),
    });
  }

  if (!goals.length) {
    actions.push({
      id: "goals",
      icon: "flag-outline",
      color: colors.lavender,
      priority: "START SMALL",
      title: "Give savings a purpose",
      text: "A named goal makes even a small weekly transfer easier to protect.",
      onPress: () => navigation.navigate("Goals"),
    });
  } else {
    const closest = [...goals].sort(
      (a, b) =>
        Number(b.saved) / Number(b.target) -
        Number(a.saved) / Number(a.target)
    )[0];
    actions.push({
      id: "goals",
      icon: "flag-outline",
      color: colors.lavender,
      priority: "KEEP GOING",
      title: `Keep momentum on ${closest.name}`,
      text: `${formatMoney(
        Math.max(Number(closest.target) - Number(closest.saved), 0),
        budget.settings.currency
      )} remains before the target is complete.`,
      onPress: () => navigation.navigate("Goals"),
    });
  }

  if (health.openBills > 0) {
    actions.push({
      id: "bills",
      icon: "calendar-outline",
      color: colors.amber,
      priority: "UPCOMING",
      title: `${health.openBills} bill${
        health.openBills === 1 ? "" : "s"
      } still open`,
      text: "Mark paid bills as complete so the dashboard reflects what still needs attention.",
      onPress: () => navigation.navigate("Main", { screen: "Budgets" }),
    });
  }
  return actions.slice(0, 4);
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
  content: { paddingHorizontal: 18, paddingBottom: 35 },
  scoreCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 17,
    flexDirection: "row",
    alignItems: "center",
  },
  ringWrap: {
    width: 128,
    height: 128,
    alignItems: "center",
    justifyContent: "center",
  },
  ring: { position: "absolute" },
  ringValue: { alignItems: "center" },
  ringNumber: {
    color: colors.ink,
    fontSize: 31,
    fontWeight: "900",
    letterSpacing: -1,
  },
  ringMax: {
    color: colors.muted,
    fontSize: 7,
    fontWeight: "900",
    letterSpacing: 0.7,
  },
  scoreCopy: { flex: 1, paddingLeft: 16 },
  scoreEyebrow: {
    color: colors.primary,
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.9,
  },
  scoreTitle: {
    color: colors.ink,
    fontSize: 23,
    fontWeight: "900",
    marginTop: 3,
  },
  scoreText: {
    color: colors.muted,
    fontSize: 9,
    lineHeight: 14,
    marginTop: 5,
  },
  breakdownCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 15,
    marginTop: 11,
  },
  sectionTitle: { color: colors.ink, fontSize: 15, fontWeight: "900" },
  breakdown: { marginTop: 14 },
  breakdownTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  breakdownLabel: { color: colors.ink, fontSize: 10, fontWeight: "800" },
  breakdownValue: { color: colors.muted, fontSize: 9, fontWeight: "800" },
  track: {
    height: 6,
    borderRadius: 99,
    backgroundColor: colors.line,
    marginTop: 7,
    overflow: "hidden",
  },
  fill: { height: "100%", borderRadius: 99 },
  strongest: {
    flexDirection: "row",
    gap: 8,
    backgroundColor: colors.mint,
    borderRadius: radius.md,
    padding: 11,
    marginTop: 15,
  },
  strongestText: {
    flex: 1,
    color: colors.primaryDark,
    fontSize: 9,
    lineHeight: 14,
  },
  strongestBold: { fontWeight: "900" },
  sectionTitleOutside: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: "900",
    marginTop: 24,
    marginBottom: 10,
  },
  action: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 13,
    marginBottom: 9,
  },
  pressed: { opacity: 0.65 },
  actionIcon: {
    width: 46,
    height: 46,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
  },
  actionCopy: { flex: 1, paddingRight: 8 },
  actionTitleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  actionTitle: { color: colors.ink, fontSize: 11, fontWeight: "900" },
  actionText: {
    color: colors.muted,
    fontSize: 9,
    lineHeight: 14,
    marginTop: 4,
  },
  priority: { borderRadius: 99, paddingHorizontal: 6, paddingVertical: 3 },
  priorityText: { fontSize: 6, fontWeight: "900" },
  challenge: {
    backgroundColor: colors.lime,
    borderRadius: radius.xl,
    padding: 17,
  },
  challengeTop: { flexDirection: "row", alignItems: "center" },
  challengeIcon: {
    width: 48,
    height: 48,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.65)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
  },
  challengeCopy: { flex: 1 },
  challengeEyebrow: {
    color: colors.primary,
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  challengeTitle: {
    color: colors.primaryDark,
    fontSize: 16,
    fontWeight: "900",
    marginTop: 2,
  },
  challengeText: {
    color: colors.primaryDark,
    fontSize: 10,
    lineHeight: 15,
    marginTop: 13,
  },
  challengeSteps: { flexDirection: "row", gap: 8, marginTop: 14 },
  challengeStep: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.55)",
    borderRadius: 12,
    padding: 7,
  },
  stepNumber: {
    width: 20,
    height: 20,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumberText: { color: colors.surface, fontSize: 8, fontWeight: "900" },
  stepText: { color: colors.primaryDark, fontSize: 8, fontWeight: "900" },
  disclaimer: {
    flexDirection: "row",
    gap: 8,
    backgroundColor: colors.mint,
    borderRadius: radius.md,
    padding: 12,
    marginTop: 14,
  },
  disclaimerText: {
    flex: 1,
    color: colors.primaryDark,
    fontSize: 9,
    lineHeight: 14,
  },
});
