import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { categoryById } from "../data/categories";
import { colors, radius } from "../design";
import { formatMoney } from "../utils/formatters";

export default function BudgetCard({ categoryId, spent, limit, currency, onPress }) {
  const category = categoryById(categoryId);
  const ratio = limit > 0 ? spent / limit : 0;
  const over = ratio > 1;
  const warning = ratio >= 0.8;

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.top}>
        <View style={[styles.icon, { backgroundColor: `${category.color}28` }]}>
          <Ionicons name={category.icon} size={20} color={category.color} />
        </View>
        <View style={styles.copy}>
          <Text style={styles.title}>{category.label}</Text>
          <Text style={[styles.status, over && styles.over]}>
            {over
              ? `${formatMoney(spent - limit, currency)} over`
              : `${formatMoney(Math.max(limit - spent, 0), currency)} left`}
          </Text>
        </View>
        <Text style={styles.total}>
          {formatMoney(spent, currency, true)} / {formatMoney(limit, currency, true)}
        </Text>
      </View>
      <View style={styles.track}>
        <View
          style={[
            styles.fill,
            {
              width: `${Math.min(ratio * 100, 100)}%`,
              backgroundColor: over ? colors.red : warning ? colors.amber : category.color,
            },
          ]}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.line,
    marginBottom: 10,
  },
  pressed: { opacity: 0.75 },
  top: { flexDirection: "row", alignItems: "center", marginBottom: 14 },
  icon: {
    height: 42,
    width: 42,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
  },
  copy: { flex: 1 },
  title: { color: colors.ink, fontSize: 14, fontWeight: "800", marginBottom: 3 },
  status: { color: colors.muted, fontSize: 12 },
  over: { color: colors.red, fontWeight: "700" },
  total: { color: colors.ink, fontSize: 12, fontWeight: "800" },
  track: { height: 7, borderRadius: 99, backgroundColor: colors.line, overflow: "hidden" },
  fill: { height: "100%", borderRadius: 99 },
});
