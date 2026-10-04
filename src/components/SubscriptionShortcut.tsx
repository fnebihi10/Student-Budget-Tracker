
import type { AppNavigation } from '../navigation/routes';
import { useRequiredContext as useContext } from '../context/requiredContext';
import { Ionicons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { BudgetContext } from "../context/BudgetContext";
import { SubscriptionsContext } from "../context/SubscriptionsContext";
import { colors, radius } from "../design";
import { formatMoney, shortDate } from "../utils/formatters";
import {
  activeSubscriptionTotal,
  upcomingSubscriptions,
} from "../utils/subscriptions";

export default function SubscriptionShortcut({ navigation, compact = false }: { navigation: AppNavigation; compact?: boolean }) {
  const { subscriptions } = useContext(SubscriptionsContext);
  const { settings } = useContext(BudgetContext);
  const monthly = useMemo(
    () => activeSubscriptionTotal(subscriptions),
    [subscriptions]
  );
  const next = useMemo(
    () => upcomingSubscriptions(subscriptions, 1)[0],
    [subscriptions]
  );

  return (
    <Pressable accessibilityRole="button"
      accessibilityLabel="Open personal subscriptions"
      onPress={() => navigation.navigate("Subscriptions")}
      style={({ pressed }) => [
        styles.card,
        compact && styles.compact,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.icon}>
        <Ionicons aria-hidden={true} name="repeat" size={21} color={colors.primaryDark} />
      </View>
      <View style={styles.copy}>
        <Text style={styles.eyebrow}>SUBSCRIPTIONS</Text>
        <Text style={styles.title}>
          {subscriptions.length
            ? `${formatMoney(monthly, settings.currency)} every month`
            : "Track every recurring service"}
        </Text>
        <Text style={styles.subtitle}>
          {next
            ? `Next: ${next.name} · ${shortDate(next.renewalDate)}`
            : "Netflix, Spotify, YouTube, cloud, gym and more"}
        </Text>
      </View>
      <View style={styles.arrow}>
        <Ionicons aria-hidden={true} name="arrow-forward" size={18} color={colors.primary} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E9F0FF",
    borderRadius: radius.lg,
    padding: 15,
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#D7E3FA",
  },
  compact: {
    marginTop: 0,
  },
  pressed: {
    opacity: 0.72,
  },
  icon: {
    width: 45,
    height: 45,
    borderRadius: 16,
    backgroundColor: colors.lime,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
  },
  copy: {
    flex: 1,
    paddingRight: 8,
  },
  eyebrow: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.9,
  },
  title: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: "900",
    marginTop: 2,
  },
  subtitle: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 4,
  },
  arrow: {
    width: 33,
    height: 33,
    borderRadius: 12,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
});
