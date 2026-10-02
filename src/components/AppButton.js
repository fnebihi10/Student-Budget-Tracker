import { Ionicons } from "@expo/vector-icons";
import React, { useRef, useState } from "react";
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text } from "react-native";
import { colors, radius } from "../design";

export default function AppButton({
  title,
  onPress,
  icon,
  variant = "primary",
  disabled = false,
  loading = false,
  style,
}) {
  const isSecondary = variant === "secondary";
  const isGhost = variant === "ghost";
  const busy = useRef(false);
  const [pending, setPending] = useState(false);
  const isBusy = loading || pending;
  const press = async () => {
    if (busy.current || disabled || loading) return;
    busy.current = true;
    setPending(true);
    try { await onPress?.(); }
    finally { busy.current = false; setPending(false); }
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: disabled || isBusy, busy: isBusy }}
      disabled={disabled || isBusy}
      onPress={press}
      style={({ pressed }) => [
        styles.base,
        isSecondary && styles.secondary,
        isGhost && styles.ghost,
        (disabled || isBusy) && styles.disabled,
        pressed && styles.pressed,
        style,
      ]}
    >
      {isBusy ? (
        <ActivityIndicator color={isSecondary || isGhost ? colors.primary : colors.surface} />
      ) : (
        <>
          {icon ? (
            <Ionicons
              name={icon}
              size={19}
              color={isSecondary || isGhost ? colors.primary : colors.surface}
            />
          ) : null}
          <Text
            style={[
              styles.label,
              (isSecondary || isGhost) && styles.secondaryLabel,
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 54,
    paddingHorizontal: 20,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 9,
    ...Platform.select({ web: { cursor: "pointer" } }),
  },
  secondary: {
    backgroundColor: colors.mint,
  },
  ghost: {
    backgroundColor: "transparent",
  },
  label: {
    color: colors.surface,
    fontSize: 15,
    fontWeight: "800",
  },
  secondaryLabel: {
    color: colors.primary,
  },
  disabled: {
    opacity: 0.45,
    ...Platform.select({ web: { cursor: "not-allowed" } }),
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.985 }],
  },
});
