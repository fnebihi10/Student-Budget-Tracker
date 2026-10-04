import type { Category } from '../domain/models';

import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { colors, radius } from "../design";

export default function CategoryPicker({ categories, value, onChange }: { categories: Category[]; value: string; onChange: (value: string) => void }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.content}
    >
      {categories.map((category) => {
        const selected = category.id === value;
        return (
          <Pressable accessibilityRole="button"
            accessibilityLabel={category.label}
            accessibilityState={{ selected }}
            key={category.id}
            onPress={() => onChange(category.id)}
            style={[styles.item, selected && styles.selected]}
          >
            <View
              style={[
                styles.icon,
                { backgroundColor: selected ? category.color : `${category.color}26` },
              ]}
            >
              <Ionicons aria-hidden={true}
                name={category.icon}
                size={20}
                color={selected ? colors.surface : category.color}
              />
            </View>
            <Text style={[styles.label, selected && styles.selectedLabel]}>
              {category.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 9,
    paddingRight: 20,
  },
  item: {
    minWidth: 84,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    alignItems: "center",
    padding: 11,
    gap: 7,
  },
  selected: {
    borderColor: colors.primary,
    backgroundColor: colors.mint,
  },
  icon: {
    height: 36,
    width: 36,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700",
  },
  selectedLabel: {
    color: colors.primary,
  },
});
