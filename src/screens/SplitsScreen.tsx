import type { Split } from '../domain/models';
import type { StackProps } from '../navigation/routes';
import { useRequiredContext as useContext } from '../context/requiredContext';
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { confirmAction } from "../utils/dialogs";
import EmptyState from "../components/EmptyState";
import SectionHeader from "../components/SectionHeader";
import { BudgetContext } from "../context/BudgetContext";
import { SplitsContext } from "../context/SplitsContext";
import { splitCategoryById } from "../data/splitCategories";
import { colors, radius, shadow } from "../design";
import { formatMoney, shortDate } from "../utils/formatters";

export default function SplitsScreen({ navigation }: StackProps<'Splits'>) {
  const { settings } = useContext(BudgetContext);
  const { splits, settleSplit, deleteSplit } = useContext(SplitsContext);
  const open = splits.filter((item) => item.status === "open");
  const settled = splits.filter((item) => item.status === "settled");
  const totals = useMemo(
    () =>
      open.reduce(
        (result, item) => {
          result[item.direction] += Number(item.amount);
          return result;
        },
        { owed_to_me: 0, i_owe: 0 }
      ),
    [open]
  );
  const net = totals.owed_to_me - totals.i_owe;

  const confirmDelete = (item: Split) =>
    confirmAction({
      title: `Remove ${item.title}?`,
      message: "This shared-expense record will be permanently removed.",
      cancelLabel: "Keep it",
      confirmLabel: "Remove",
      onConfirm: () => deleteSplit(item.id, item.revision ?? 0),
    });

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => navigation.goBack()} style={styles.back}>
          <Ionicons aria-hidden={true} name="arrow-back" size={22} color={colors.ink} />
        </Pressable>
        <Text style={styles.headerTitle}>Split & settle</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Add personal debt"
          onPress={() => navigation.navigate("ManageSplit")}
          style={styles.add}
        >
          <Ionicons aria-hidden={true} name="add" size={23} color={colors.surface} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={["#4C3C78", "#6C55A0", "#8069B0"]}
          style={styles.hero}
        >
          <View style={styles.heroTop}>
            <View>
              <Text style={styles.heroLabel}>YOUR SHARED BALANCE</Text>
              <Text style={styles.heroValue}>
                {net >= 0 ? "+" : "−"}
                {formatMoney(Math.abs(net), settings.currency)}
              </Text>
              <Text style={styles.heroHint}>
                {net > 0
                  ? "Friends owe you more than you owe"
                  : net < 0
                  ? "You currently owe a little more"
                  : "Everything is balanced"}
              </Text>
            </View>
            <View style={styles.heroIcon}>
              <Ionicons aria-hidden={true} name="people" size={23} color="#4C3C78" />
            </View>
          </View>
          <View style={styles.heroStats}>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatLabel}>OWED TO YOU</Text>
              <Text style={styles.heroStatValue}>
                {formatMoney(totals.owed_to_me, settings.currency)}
              </Text>
            </View>
            <View style={styles.heroDivider} />
            <View style={styles.heroStat}>
              <Text style={styles.heroStatLabel}>YOU OWE</Text>
              <Text style={styles.heroStatValue}>
                {formatMoney(totals.i_owe, settings.currency)}
              </Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.quick}>
          <Pressable accessibilityRole="button"
            onPress={() =>
              navigation.navigate("ManageSplit", { direction: "owed_to_me" })
            }
            style={styles.quickButton}
          >
            <View style={[styles.quickIcon, styles.quickIconIn]}>
              <Ionicons aria-hidden={true} name="arrow-down" size={18} color={colors.primary} />
            </View>
            <View>
              <Text style={styles.quickTitle}>They owe me</Text>
              <Text style={styles.quickText}>I paid for someone</Text>
            </View>
          </Pressable>
          <Pressable accessibilityRole="button"
            onPress={() =>
              navigation.navigate("ManageSplit", { direction: "i_owe" })
            }
            style={styles.quickButton}
          >
            <View style={[styles.quickIcon, styles.quickIconOut]}>
              <Ionicons aria-hidden={true} name="arrow-up" size={18} color={colors.coral} />
            </View>
            <View>
              <Text style={styles.quickTitle}>I owe them</Text>
              <Text style={styles.quickText}>Someone paid for me</Text>
            </View>
          </Pressable>
        </View>

        <View style={styles.section}>
          <SectionHeader
            title="Open balances"
            action={open.length ? `${open.length} open` : undefined}
          />
          {open.length ? (
            <View style={styles.list}>
              {open.map((item, index) => (
                <SplitRow
                  key={item.id}
                  item={item}
                  currency={settings.currency}
                  onPress={() =>
                    navigation.navigate("ManageSplit", { splitId: item.id })
                  }
                  onLongPress={() => confirmDelete(item)}
                  onSettle={() => settleSplit(item.id)}
                  last={index === open.length - 1}
                />
              ))}
            </View>
          ) : (
            <EmptyState
              icon="people-outline"
              title="No open shared expenses"
              message="Track shared rent, groceries, trips, meals, utilities, or tickets."
              action="Add shared expense"
              onAction={() => navigation.navigate("ManageSplit")}
            />
          )}
        </View>

        {settled.length ? (
          <View style={styles.section}>
            <SectionHeader title="Recently settled" />
            <View style={styles.list}>
              {settled.slice(0, 6).map((item, index) => (
                <SplitRow
                  key={item.id}
                  item={item}
                  currency={settings.currency}
                  onPress={() =>
                    navigation.navigate("ManageSplit", { splitId: item.id })
                  }
                  onLongPress={() => confirmDelete(item)}
                  onSettle={() => settleSplit(item.id)}
                  last={index === Math.min(settled.length, 6) - 1}
                  settled
                />
              ))}
            </View>
          </View>
        ) : null}

        <View style={styles.note}>
          <Ionicons aria-hidden={true}
            name="chatbubble-ellipses-outline"
            size={19}
            color={colors.primary}
          />
          <Text style={styles.noteText}>
            Pocketwise records balances only. It does not send payment requests,
            transfer money, or contact friends.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SplitRow({
  item,
  currency,
  onPress,
  onLongPress,
  onSettle,
  last,
  settled = false,
}: { item: Split; currency: string; onPress: () => void; onLongPress: () => void; onSettle: () => unknown; last: boolean; settled?: boolean }) {
  const category = splitCategoryById(item.category);
  const incoming = item.direction === "owed_to_me";
  return (
    <View style={[styles.rowWrap, !last && styles.rowDivider]}>
      <Pressable accessibilityRole="button"
        onPress={onPress}
        onLongPress={onLongPress}
        style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      >
        <View
          style={[
            styles.rowIcon,
            { backgroundColor: `${category.color}22` },
          ]}
        >
          <Ionicons aria-hidden={true}
            name={category.icon}
            size={20}
            color={category.color}
          />
        </View>
        <View style={styles.rowCopy}>
          <Text style={[styles.rowTitle, settled && styles.settledText]}>
            {item.title}
          </Text>
          <Text style={styles.rowMeta}>
            {incoming ? `${item.person} owes you` : `You owe ${item.person}`}
            {item.dueDate ? ` · ${shortDate(item.dueDate)}` : ""}
          </Text>
        </View>
        <Text
          style={[
            styles.rowAmount,
            incoming ? styles.incoming : styles.outgoing,
            settled && styles.settledText,
          ]}
        >
          {incoming ? "+" : "−"}
          {formatMoney(item.amount, currency)}
        </Text>
      </Pressable>
      <Pressable accessibilityRole="button"
        accessibilityLabel={settled ? `Reopen balance for ${item.title}` : `Mark balance settled for ${item.title}`}
        onPress={onSettle}
        style={[styles.settle, settled && styles.reopen]}
      >
        <Ionicons aria-hidden={true}
          name={settled ? "refresh" : "checkmark"}
          size={15}
          color={settled ? colors.muted : colors.primary}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas },
  header: {
    height: 60,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  back: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { color: colors.ink, fontSize: 16, fontWeight: "900" },
  add: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  content: { width: "100%", maxWidth: 1180, alignSelf: "center", paddingHorizontal: 18, paddingBottom: 35 },
  hero: { borderRadius: radius.xl, padding: 20, ...shadow },
  heroTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  heroLabel: {
    color: "#DDD4F3",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1,
  },
  heroValue: {
    color: colors.surface,
    fontSize: 32,
    fontWeight: "900",
    letterSpacing: -1,
    marginTop: 4,
  },
  heroHint: { color: "#DDD4F3", fontSize: 12, marginTop: 4 },
  heroIcon: {
    width: 48,
    height: 48,
    borderRadius: 17,
    backgroundColor: colors.lime,
    alignItems: "center",
    justifyContent: "center",
  },
  heroStats: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.11)",
    borderRadius: radius.md,
    padding: 12,
    marginTop: 17,
  },
  heroStat: { flex: 1 },
  heroStatLabel: {
    color: "#D4C9ED",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.7,
  },
  heroStatValue: {
    color: colors.surface,
    fontSize: 14,
    fontWeight: "900",
    marginTop: 3,
  },
  heroDivider: {
    width: 1,
    height: 29,
    backgroundColor: "rgba(255,255,255,0.2)",
    marginHorizontal: 13,
  },
  quick: { flexDirection: "row", gap: 9, marginTop: 11 },
  quickButton: {
    flex: 1,
    minHeight: 66,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 10,
  },
  quickIcon: {
    width: 36,
    height: 36,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  quickIconIn: { backgroundColor: colors.mint },
  quickIconOut: { backgroundColor: "#FCE8E5" },
  quickTitle: { color: colors.ink, fontSize: 12, fontWeight: "900" },
  quickText: { color: colors.muted, fontSize: 12, marginTop: 3 },
  section: { marginTop: 24 },
  list: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 13,
  },
  rowWrap: { flexDirection: "row", alignItems: "center" },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: colors.line },
  row: {
    flex: 1,
    minHeight: 72,
    flexDirection: "row",
    alignItems: "center",
  },
  rowIcon: {
    width: 43,
    height: 43,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  rowCopy: { flex: 1, paddingHorizontal: 10 },
  rowTitle: { color: colors.ink, fontSize: 12, fontWeight: "900" },
  rowMeta: { color: colors.muted, fontSize: 12, marginTop: 4 },
  rowAmount: { fontSize: 12, fontWeight: "900" },
  incoming: { color: colors.primary },
  outgoing: { color: colors.red },
  settledText: { color: colors.soft, textDecorationLine: "line-through" },
  settle: {
    width: 31,
    height: 31,
    borderRadius: 11,
    backgroundColor: colors.mint,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 7,
  },
  reopen: { backgroundColor: colors.canvas },
  pressed: { opacity: 0.65 },
  note: {
    flexDirection: "row",
    gap: 8,
    backgroundColor: colors.mint,
    borderRadius: radius.md,
    padding: 12,
    marginTop: 15,
  },
  noteText: {
    flex: 1,
    color: colors.primaryDark,
    fontSize: 12,
    lineHeight: 14,
  },
});
