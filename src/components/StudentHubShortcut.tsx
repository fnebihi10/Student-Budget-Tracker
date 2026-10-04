
import type { AppNavigation } from '../navigation/routes';
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius } from "../design";

export default function StudentHubShortcut({ navigation }: { navigation: AppNavigation }) {
  return (
    <Pressable accessibilityRole="button"
      onPress={() => navigation.navigate("StudentHub")}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.icon}>
        <Ionicons aria-hidden={true} name="grid" size={21} color={colors.primaryDark} />
      </View>
      <View style={styles.copy}>
        <Text style={styles.eyebrow}>STUDENT MONEY HUB</Text>
        <Text style={styles.title}>Calendar, shared costs, and smart coaching</Text>
        <Text style={styles.subtitle}>
          Three new tools connected to the plan you already built.
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
    backgroundColor: "#F0EAFB",
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: "#E0D4F3",
    padding: 14,
    marginTop: 10,
  },
  pressed: { opacity: 0.68 },
  icon: {
    width: 45,
    height: 45,
    borderRadius: 16,
    backgroundColor: colors.lime,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
  },
  copy: { flex: 1, paddingRight: 8 },
  eyebrow: {
    color: "#7653A4",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  title: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: "900",
    marginTop: 2,
  },
  subtitle: { color: colors.muted, fontSize: 12, marginTop: 3 },
  arrow: {
    width: 33,
    height: 33,
    borderRadius: 12,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
});
