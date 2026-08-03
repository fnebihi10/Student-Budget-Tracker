import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { categoryById } from "../data/categories";
import { colors } from "../design";
import { formatMoney, shortDate } from "../utils/formatters";

export default function TransactionItem({ item, currency, onLongPress }) {
  const category = categoryById(item.category);
  const income = item.type === "income";

  return (
    <Pressable
      accessibilityLabel={`${item.title}, ${formatMoney(item.amount, currency)}`}
      onLongPress={onLongPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={[styles.icon, { backgroundColor: `${category.color}28` }]}>
        <Ionicons name={category.icon} size={21} color={category.color} />
      </View>
      <View style={styles.copy}>
        <Text numberOfLines={1} style={styles.title}>
          {item.title}
        </Text>
        <Text style={styles.meta}>
          {category.label} · {shortDate(item.date)}
          {item.recurring ? " · Recurring" : ""}
        </Text>
      </View>
      <Text style={[styles.amount, income && styles.income]}>
        {income ? "+" : "−"}
        {formatMoney(item.amount, currency)}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 11,
  },
  pressed: {
    opacity: 0.6,
  },
  icon: {
    width: 45,
    height: 45,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 4,
  },
  meta: {
    color: colors.muted,
    fontSize: 12,
  },
  amount: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "800",
    marginLeft: 10,
  },
  income: {
    color: colors.primary,
  },
});
