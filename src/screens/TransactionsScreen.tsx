import type { Transaction } from '../domain/finance';
import type { TabProps } from '../navigation/routes';
import { useRequiredContext as useContext } from '../context/requiredContext';
import { Ionicons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import EmptyState from "../components/EmptyState";
import MonthSwitcher from "../components/MonthSwitcher";
import TransactionItem from "../components/TransactionItem";
import { BudgetContext } from "../context/BudgetContext";
import { categoryById } from "../data/categories";
import { colors, radius, type } from "../design";
import { getTotals } from "../utils/calculations";
import { formatMoney, isSameMonth } from "../utils/formatters";
import { confirmAction } from "../utils/dialogs";

const filters = ["all", "expense", "income"];

export default function TransactionsScreen({ navigation }: TabProps<'Activity'>) {
  const { transactions, settings, deleteTransaction } = useContext(BudgetContext);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  const monthItems = useMemo(
    () => transactions.filter((item) => isSameMonth(item.date, selectedMonth)),
    [transactions, selectedMonth]
  );
  const totals = useMemo(
    () => getTotals(transactions, selectedMonth),
    [transactions, selectedMonth]
  );

  const filtered = useMemo(
    () =>
      [...monthItems]
        .filter((item) => filter === "all" || item.type === filter)
        .filter((item) => {
          const needle = query.trim().toLowerCase();
          if (!needle) return true;
          return [item.title, item.note, categoryById(item.category).label]
            .filter(Boolean)
            .some((value) => (value || "").toLowerCase().includes(needle));
        })
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [monthItems, filter, query]
  );

  const confirmDelete = (item: Transaction) =>
    confirmAction({
      title: "Delete transaction?",
      message: `${item.title} will be permanently removed.`,
      cancelLabel: "Keep it",
      confirmLabel: "Delete",
      onConfirm: () => deleteTransaction(item.id, item.revision ?? 0),
    });

  return (
    <SafeAreaView edges={["top"]} style={styles.safe}>
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>YOUR MONEY TRAIL</Text>
          <Text style={styles.title}>Activity</Text>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Add a transaction" onPress={() => navigation.navigate("AddTransaction")} style={styles.add}>
          <Ionicons aria-hidden={true} name="add" size={25} color={colors.surface} />
        </Pressable>
      </View>

      <View style={styles.search}>
        <Ionicons aria-hidden={true} name="search-outline" size={20} color={colors.muted} />
        <TextInput
          accessibilityLabel="Search transactions"
          value={query}
          onChangeText={setQuery}
          placeholder="Search transactions"
          placeholderTextColor={colors.soft}
          style={styles.searchInput}
          returnKeyType="search"
        />
        {query ? (
          <Pressable accessibilityRole="button" accessibilityLabel="Clear search" onPress={() => setQuery('')} hitSlop={12}>
            <Ionicons aria-hidden={true} name="close-circle" size={19} color={colors.soft} />
          </Pressable>
        ) : null}
      </View>

      <View style={styles.monthArea}>
        <MonthSwitcher value={selectedMonth} onChange={setSelectedMonth} />
        <View style={styles.summary}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Income</Text>
            <Text style={[styles.summaryValue, styles.income]}>
              {formatMoney(totals.income, settings.currency, true)}
            </Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Spent</Text>
            <Text style={styles.summaryValue}>
              {formatMoney(totals.expenses, settings.currency, true)}
            </Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Net</Text>
            <Text style={[styles.summaryValue, totals.balance < 0 && styles.negative]}>
              {formatMoney(totals.balance, settings.currency, true)}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.filters}>
        {filters.map((item) => (
          <Pressable accessibilityRole="button"
            key={item}
            onPress={() => setFilter(item)}
            style={[styles.filter, filter === item && styles.filterActive]}
          >
            <Text style={[styles.filterText, filter === item && styles.filterTextActive]}>
              {item[0].toUpperCase() + item.slice(1)}
            </Text>
          </Pressable>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, !filtered.length && styles.emptyList]}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.divider} />}
        renderItem={({ item }) => (
          <TransactionItem
            item={item}
            currency={settings.currency}
            onPress={() =>
              navigation.navigate("AddTransaction", { transactionId: item.id })
            }
            onLongPress={() => confirmDelete(item)}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            icon="search-outline"
            title={monthItems.length ? "No matches" : "No activity this month"}
            message={
              monthItems.length
                ? "Try another search or filter."
                : "Add expenses and income to build this month's money timeline."
            }
            action={monthItems.length ? undefined : "Add transaction"}
            onAction={() => navigation.navigate("AddTransaction")}
          />
        }
        ListFooterComponent={
          filtered.length ? <Text style={styles.tip}>Tap to edit · hold to delete</Text> : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 18, paddingTop: 13, paddingBottom: 16 },
  eyebrow: { color: colors.muted, fontSize: 12, fontWeight: "800", letterSpacing: 1.2 },
  title: { ...type.h1, marginTop: 2, letterSpacing: -0.7 },
  add: { width: 44, height: 44, borderRadius: 16, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  search: { width: "auto", maxWidth: 1180, alignSelf: "stretch", flexDirection: "row", alignItems: "center", gap: 9, marginHorizontal: 18, backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 14, minHeight: 51 },
  searchInput: { flex: 1, color: colors.ink, fontSize: 14 },
  monthArea: { width: "auto", maxWidth: 1180, alignSelf: "stretch", marginHorizontal: 18, marginTop: 12 },
  summary: { flexDirection: "row", alignItems: "center", backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, paddingVertical: 11 },
  summaryItem: { flex: 1, alignItems: "center", paddingHorizontal: 5 },
  summaryLabel: { color: colors.muted, fontSize: 12, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.6 },
  summaryValue: { color: colors.ink, fontSize: 14, fontWeight: "900", marginTop: 3 },
  income: { color: colors.primary },
  negative: { color: colors.red },
  summaryDivider: { height: 26, width: 1, backgroundColor: colors.line },
  filters: { flexDirection: "row", gap: 8, paddingHorizontal: 18, paddingVertical: 13 },
  filter: { paddingHorizontal: 15, paddingVertical: 9, backgroundColor: colors.surface, borderRadius: 99, borderWidth: 1, borderColor: colors.line },
  filterActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterText: { color: colors.muted, fontSize: 12, fontWeight: "800" },
  filterTextActive: { color: colors.surface },
  list: { width: "auto", maxWidth: 1180, alignSelf: "stretch", marginHorizontal: 18, backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 15, paddingBottom: 90 },
  emptyList: { backgroundColor: "transparent", borderWidth: 0, justifyContent: "center", flexGrow: 1, paddingHorizontal: 0 },
  divider: { height: 1, backgroundColor: colors.line, marginLeft: 57 },
  tip: { textAlign: "center", color: colors.soft, fontSize: 12, paddingVertical: 20 },
});
