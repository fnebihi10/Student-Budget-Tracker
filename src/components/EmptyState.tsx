import type { IconName } from '../domain/models';

import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, radius } from "../design";
import AppButton from "./AppButton";

export default function EmptyState({
  icon = "wallet-outline",
  title,
  message,
  action,
  onAction,
}: { icon?: IconName; title: string; message: string; action?: string; onAction?: () => unknown }) {
  return (
    <View style={styles.container}>
      <View style={styles.icon}>
        <Ionicons aria-hidden={true} name={icon} size={28} color={colors.primary} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {action ? (
        <AppButton title={action} onPress={onAction} variant="secondary" style={styles.button} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 28,
    alignItems: "center",
  },
  icon: {
    height: 58,
    width: 58,
    borderRadius: 22,
    backgroundColor: colors.mint,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
  },
  title: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: "800",
    marginBottom: 6,
  },
  message: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  button: {
    marginTop: 18,
    alignSelf: "stretch",
  },
});
