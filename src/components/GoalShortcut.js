import { Ionicons } from "@expo/vector-icons";
import React, { useContext, useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { BudgetContext } from "../context/BudgetContext";
import { GoalsContext } from "../context/GoalsContext";
import { colors, radius } from "../design";
import { formatMoney } from "../utils/formatters";
import { goalProgress, goalTotals } from "../utils/goals";

export default function GoalShortcut({ navigation }) {
  const { settings } = useContext(BudgetContext);
  const { goals } = useContext(GoalsContext);
  const totals = useMemo(() => goalTotals(goals), [goals]);
  const closest = [...goals]
    .filter((goal) => Number(goal.saved) < Number(goal.target))
    .sort((a, b) => goalProgress(b) - goalProgress(a))[0];
  const overall = totals.target ? (totals.saved / totals.target) * 100 : 0;

  return (
    <Pressable
      accessibilityLabel="Open savings goals"
      onPress={() => navigation.navigate("Goals")}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.icon}>
        <Ionicons name="flag" size={21} color={colors.primary} />
      </View>
      <View style={styles.copy}>
        <Text style={styles.eyebrow}>SAVINGS GOALS</Text>
        <Text style={styles.title}>
          {goals.length
            ? `${formatMoney(totals.saved, settings.currency)} saved across ${
                goals.length
              } goal${goals.length === 1 ? "" : "s"}`
            : "Turn spare money into a plan"}
        </Text>
        <Text style={styles.subtitle}>
          {closest
            ? `${closest.name} is ${Math.round(goalProgress(closest))}% complete`
            : "Laptop, emergency fund, travel, tuition and more"}
        </Text>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${Math.min(overall, 100)}%` }]} />
        </View>
      </View>
      <Ionicons name="arrow-forward" size={18} color={colors.primary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ECF7EF",
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: "#D7EBDD",
    padding: 14,
    marginTop: 10,
  },
  pressed: { opacity: 0.7 },
  icon: {
    width: 45,
    height: 45,
    borderRadius: 16,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
  },
  copy: { flex: 1, paddingRight: 10 },
  eyebrow: {
    color: colors.primary,
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  title: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: "900",
    marginTop: 2,
  },
  subtitle: { color: colors.muted, fontSize: 9, marginTop: 3 },
  track: {
    height: 4,
    borderRadius: 99,
    backgroundColor: "#D4E7D9",
    marginTop: 8,
    overflow: "hidden",
  },
  fill: { height: "100%", borderRadius: 99, backgroundColor: colors.primary },
});
