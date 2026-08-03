import { Ionicons } from "@expo/vector-icons";
import React from "react";
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

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        isSecondary && styles.secondary,
        isGhost && styles.ghost,
        (disabled || loading) && styles.disabled,
        pressed && styles.pressed,
        style,
      ]}
    >
      {loading ? (
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
