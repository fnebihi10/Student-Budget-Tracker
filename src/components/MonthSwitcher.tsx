import type { IconName } from '../domain/models';

import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius } from "../design";
import { monthLabel } from "../utils/formatters";
import { monthStart } from '../domain/calendar';

export default function MonthSwitcher({ value, onChange, allowFuture = false }: { value: Date; onChange: (value: Date) => void; allowFuture?: boolean }) {
  const current = new Date();
  const isCurrentMonth =
    value.getUTCFullYear() === current.getUTCFullYear() &&
    value.getUTCMonth() === current.getUTCMonth();

  const move = (offset: number) => {
    const next = monthStart(value, offset);
    onChange(next);
  };

  return (
    <View style={styles.container}>
      <MonthButton
        icon="chevron-back"
        label="Previous month"
        onPress={() => move(-1)}
      />
      <View style={styles.copy}>
        <Text style={styles.label}>{monthLabel(value)}</Text>
        {!isCurrentMonth ? (
          <Pressable accessibilityRole="button" onPress={() => onChange(new Date())} hitSlop={8}>
            <Text style={styles.current}>Return to current month</Text>
          </Pressable>
        ) : (
          <Text style={styles.current}>Current month</Text>
        )}
      </View>
      <MonthButton
        icon="chevron-forward"
        label="Next month"
        disabled={!allowFuture && isCurrentMonth}
        onPress={() => move(1)}
      />
    </View>
  );
}

function MonthButton({ icon, label, onPress, disabled }: { icon: IconName; label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        disabled && styles.disabled,
        pressed && styles.pressed,
      ]}
    >
      <Ionicons aria-hidden={true} name={icon} size={19} color={colors.primary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 62,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    paddingHorizontal: 8,
    marginBottom: 12,
  },
  button: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.mint,
  },
  copy: { flex: 1, alignItems: "center", paddingHorizontal: 8 },
  label: { color: colors.ink, fontSize: 14, fontWeight: "900" },
  current: { color: colors.muted, fontSize: 12, fontWeight: "700", marginTop: 2 },
  disabled: { opacity: 0.3 },
  pressed: { opacity: 0.65 },
});
