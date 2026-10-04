import type { SavingsGoal } from '../domain/models';
import type { StackProps } from '../navigation/routes';
import { useRequiredContext as useContext } from '../context/requiredContext';
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import EmptyState from "../components/EmptyState";
import SectionHeader from "../components/SectionHeader";
import { BudgetContext } from "../context/BudgetContext";
import { GoalsContext } from "../context/GoalsContext";
import { goalTemplates } from "../data/goalTemplates";
import { colors, radius, shadow } from "../design";
import { formatMoney } from "../utils/formatters";
import {
  goalDaysLeft,
  goalProgress,
  goalRemaining,
  goalTotals,
  monthlyGoalPace,
} from "../utils/goals";

export default function GoalsScreen({ navigation }: StackProps<'Goals'>) {
  const { goals } = useContext(GoalsContext);
  const { settings } = useContext(BudgetContext);
  const totals = useMemo(() => goalTotals(goals), [goals]);
  const active = goals.filter((goal) => Number(goal.saved) < Number(goal.target));
  const completed = goals.filter((goal) => Number(goal.saved) >= Number(goal.target));
  const totalProgress = totals.target ? (totals.saved / totals.target) * 100 : 0;
  const nextGoal = [...active].sort((a, b) => {
    if (!a.deadline) return 1;
    if (!b.deadline) return -1;
    return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
  })[0];

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => navigation.goBack()} style={styles.back}>
          <Ionicons aria-hidden={true} name="arrow-back" size={22} color={colors.ink} />
        </Pressable>
        <Text style={styles.headerTitle}>Savings goals</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Add savings goal"
          onPress={() => navigation.navigate("ManageGoal")}
          style={styles.add}
        >
          <Ionicons aria-hidden={true} name="add" size={23} color={colors.surface} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={[colors.primaryDark, colors.primary, "#34795D"]}
          style={styles.hero}
        >
          <View style={styles.heroTop}>
            <View>
              <Text style={styles.heroLabel}>SAVED TOWARD DREAMS</Text>
              <Text style={styles.heroValue}>
                {formatMoney(totals.saved, settings.currency)}
              </Text>
            </View>
            <View style={styles.heroIcon}>
              <Ionicons aria-hidden={true} name="flag" size={22} color={colors.primaryDark} />
            </View>
          </View>
          <View style={styles.heroTrack}>
            <View
              style={[
                styles.heroFill,
                { width: `${Math.min(totalProgress, 100)}%` },
              ]}
            />
          </View>
          <View style={styles.heroBottom}>
            <Text style={styles.heroSmall}>
              {Math.round(totalProgress)}% overall
            </Text>
            <Text style={styles.heroSmall}>
              {formatMoney(totals.target, settings.currency)} total target
            </Text>
          </View>
          {nextGoal ? (
            <View style={styles.pace}>
              <View style={styles.paceIcon}>
                <Ionicons aria-hidden={true}
                  name="calendar-outline"
                  size={17}
                  color={colors.primaryDark}
                />
              </View>
              <View style={styles.paceCopy}>
                <Text style={styles.paceTitle}>A comfortable pace</Text>
                <Text style={styles.paceText}>
                  Save around{" "}
                  {formatMoney(monthlyGoalPace(nextGoal), settings.currency)} /
                  month for {nextGoal.name}.
                </Text>
              </View>
            </View>
          ) : null}
        </LinearGradient>

        <View style={styles.section}>
          <SectionHeader
            title="Start something"
            action="Custom goal"
            onAction={() => navigation.navigate("ManageGoal")}
          />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.templates}
          >
            {goalTemplates.slice(0, -1).map((template) => (
              <Pressable accessibilityRole="button"
                key={template.id}
                onPress={() =>
                  navigation.navigate("ManageGoal", {
                    templateId: template.id,
                  })
                }
                style={({ pressed }) => [
                  styles.template,
                  pressed && styles.pressed,
                ]}
              >
                <View
                  style={[
                    styles.templateIcon,
                    { backgroundColor: `${template.color}22` },
                  ]}
                >
                  <Ionicons aria-hidden={true}
                    name={template.icon}
                    size={22}
                    color={template.color}
                  />
                </View>
                <Text style={styles.templateName}>{template.name}</Text>
                <Text numberOfLines={2} style={styles.templateText}>
                  {template.description}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <SectionHeader
            title="Active goals"
            action={active.length ? `${active.length} active` : undefined}
          />
          {active.length ? (
            active.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                currency={settings.currency}
                onPress={() =>
                  navigation.navigate("ManageGoal", { goalId: goal.id })
                }
              />
            ))
          ) : (
            <EmptyState
              icon="flag-outline"
              title="Give your savings a purpose"
              message="Create a target, add small contributions, and watch steady progress become something real."
              action="Create a goal"
              onAction={() => navigation.navigate("ManageGoal")}
            />
          )}
        </View>

        {completed.length ? (
          <View style={styles.section}>
            <SectionHeader title="Completed" />
            {completed.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                currency={settings.currency}
                completed
                onPress={() =>
                  navigation.navigate("ManageGoal", { goalId: goal.id })
                }
              />
            ))}
          </View>
        ) : null}

        <View style={styles.nudge}>
          <View style={styles.nudgeIcon}>
            <Ionicons aria-hidden={true} name="leaf-outline" size={21} color={colors.primary} />
          </View>
          <View style={styles.nudgeCopy}>
            <Text style={styles.nudgeTitle}>Tiny deposits count</Text>
            <Text style={styles.nudgeText}>
              A regular small transfer is usually easier to sustain than one
              ambitious amount at the end of the month.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function GoalCard({ goal, currency, onPress, completed = false }: { goal: SavingsGoal; currency: string; onPress: () => void; completed?: boolean }) {
  const progress = goalProgress(goal);
  const days = goalDaysLeft(goal);
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`Manage savings goal ${goal.name}`}
      onPress={onPress}
      style={({ pressed }) => [styles.goalCard, pressed && styles.pressed]}
    >
      <View style={styles.goalTop}>
        <View
          style={[styles.goalIcon, { backgroundColor: `${goal.color}22` }]}
        >
          <Ionicons aria-hidden={true} name={goal.icon} size={22} color={goal.color || colors.primary} />
        </View>
        <View style={styles.goalCopy}>
          <Text style={styles.goalName}>{goal.name}</Text>
          <Text style={styles.goalMeta}>
            {completed
              ? "Goal reached"
              : days == null
              ? "No deadline"
              : days < 0
              ? "Deadline passed"
              : `${days} day${days === 1 ? "" : "s"} left`}
          </Text>
        </View>
        <Text style={styles.goalPercent}>{Math.round(progress)}%</Text>
      </View>
      <View style={styles.goalTrack}>
        <View
          style={[
            styles.goalFill,
            {
              width: `${progress}%`,
              backgroundColor: completed ? colors.primary : (goal.color || colors.primary),
            },
          ]}
        />
      </View>
      <View style={styles.goalBottom}>
        <Text style={styles.goalSaved}>
          {formatMoney(goal.saved, currency)} saved
        </Text>
        <Text style={styles.goalRemaining}>
          {completed
            ? `Target ${formatMoney(goal.target, currency)}`
            : `${formatMoney(goalRemaining(goal), currency)} to go`}
        </Text>
      </View>
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
  add: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  content: { width: "100%", maxWidth: 1180, alignSelf: "center", paddingHorizontal: 18, paddingBottom: 35 },
  hero: { borderRadius: radius.xl, padding: 20, ...shadow },
  heroTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  heroLabel: {
    color: "#BBD1C6",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.1,
  },
  heroValue: {
    color: colors.surface,
    fontSize: 34,
    fontWeight: "900",
    letterSpacing: -1.2,
    marginTop: 4,
  },
  heroIcon: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: colors.lime,
    alignItems: "center",
    justifyContent: "center",
  },
  heroTrack: {
    height: 7,
    borderRadius: 99,
    backgroundColor: "#4D7462",
    marginTop: 18,
    overflow: "hidden",
  },
  heroFill: { height: "100%", borderRadius: 99, backgroundColor: colors.lime },
  heroBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 7,
  },
  heroSmall: { color: "#BDD0C7", fontSize: 12 },
  pace: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.10)",
    borderRadius: radius.md,
    padding: 12,
    marginTop: 16,
  },
  paceIcon: {
    width: 36,
    height: 36,
    borderRadius: 13,
    backgroundColor: colors.lime,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  paceCopy: { flex: 1 },
  paceTitle: { color: colors.surface, fontSize: 12, fontWeight: "900" },
  paceText: { color: "#C5D6CE", fontSize: 12, marginTop: 3 },
  section: { marginTop: 24 },
  templates: { gap: 9, paddingRight: 18 },
  template: {
    width: 142,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 13,
  },
  templateIcon: {
    width: 43,
    height: 43,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  templateName: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: "900",
    marginTop: 10,
  },
  templateText: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 13,
    marginTop: 4,
  },
  goalCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 15,
    marginBottom: 10,
  },
  goalTop: { flexDirection: "row", alignItems: "center" },
  goalIcon: {
    width: 45,
    height: 45,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
  },
  goalCopy: { flex: 1 },
  goalName: { color: colors.ink, fontSize: 14, fontWeight: "900" },
  goalMeta: { color: colors.muted, fontSize: 12, marginTop: 4 },
  goalPercent: { color: colors.ink, fontSize: 13, fontWeight: "900" },
  goalTrack: {
    height: 7,
    borderRadius: 99,
    backgroundColor: colors.line,
    marginTop: 14,
    overflow: "hidden",
  },
  goalFill: { height: "100%", borderRadius: 99 },
  goalBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  goalSaved: { color: colors.ink, fontSize: 12, fontWeight: "800" },
  goalRemaining: { color: colors.muted, fontSize: 12 },
  pressed: { opacity: 0.68 },
  nudge: {
    flexDirection: "row",
    backgroundColor: colors.mint,
    borderRadius: radius.lg,
    padding: 14,
    marginTop: 10,
  },
  nudgeIcon: {
    width: 42,
    height: 42,
    borderRadius: 15,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  nudgeCopy: { flex: 1 },
  nudgeTitle: { color: colors.primaryDark, fontSize: 12, fontWeight: "900" },
  nudgeText: {
    color: colors.primaryDark,
    fontSize: 12,
    lineHeight: 14,
    marginTop: 3,
  },
});
