import { Ionicons } from "@expo/vector-icons";
import React, { useContext, useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { BudgetContext } from "../context/BudgetContext";
import { SubscriptionsContext } from "../context/SubscriptionsContext";
import { colors, radius } from "../design";
import { formatMoney } from "../utils/formatters";
import { activeSubscriptionTotal } from "../utils/subscriptions";

export default function SubscriptionImpactCard({ navigation }) {
  const { settings } = useContext(BudgetContext);
  const { subscriptions } = useContext(SubscriptionsContext);
  const monthly = useMemo(
    () => activeSubscriptionTotal(subscriptions),
    [subscriptions]
  );
  const activeCount = subscriptions.filter(
    (item) => item.status === "active"
  ).length;
  const share = settings.monthlyBudget
    ? (monthly / settings.monthlyBudget) * 100
    : 0;

  return (
    <Pressable accessibilityRole="button"
      onPress={() => navigation.navigate("Subscriptions")}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.top}>
        <View style={styles.icon}>
          <Ionicons name="repeat" size={20} color="#365E9E" />
        </View>
        <View style={styles.copy}>
          <Text style={styles.eyebrow}>RECURRING SERVICES</Text>
          <Text style={styles.title}>
            {activeCount
              ? `${activeCount} subscription${activeCount === 1 ? "" : "s"} use ${Math.round(
                  share
                )}% of your plan`
              : "See your subscription impact"}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={19} color={colors.soft} />
      </View>
      <View style={styles.figures}>
        <View style={styles.figure}>
          <Text style={styles.figureLabel}>MONTHLY</Text>
          <Text style={styles.figureValue}>
            {formatMoney(monthly, settings.currency)}
          </Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.figure}>
          <Text style={styles.figureLabel}>YEARLY</Text>
          <Text style={styles.figureValue}>
            {formatMoney(monthly * 12, settings.currency)}
          </Text>
        </View>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${Math.min(share, 100)}%` }]} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#F0F4FF",
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: "#DCE5F9",
    padding: 15,
    marginTop: 11,
  },
  pressed: { opacity: 0.7 },
  top: { flexDirection: "row", alignItems: "center" },
  icon: {
    width: 41,
    height: 41,
    borderRadius: 14,
    backgroundColor: "#DCE7FC",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  copy: { flex: 1, paddingRight: 8 },
  eyebrow: {
    color: "#5373A7",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  title: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: "800",
    marginTop: 3,
  },
  figures: { flexDirection: "row", alignItems: "center", marginTop: 15 },
  figure: { flex: 1 },
  figureLabel: {
    color: colors.muted,
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 0.7,
  },
  figureValue: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: "900",
    marginTop: 3,
  },
  divider: { width: 1, height: 28, backgroundColor: "#D8E2F6" },
  track: {
    height: 5,
    borderRadius: 99,
    backgroundColor: "#DCE5F4",
    marginTop: 13,
    overflow: "hidden",
  },
  fill: { height: "100%", borderRadius: 99, backgroundColor: "#527BC1" },
});
