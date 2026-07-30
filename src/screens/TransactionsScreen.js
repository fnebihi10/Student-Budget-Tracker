import { Ionicons } from "@expo/vector-icons";
import React, { useContext, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import EmptyState from "../components/EmptyState";
import TransactionItem from "../components/TransactionItem";
import { BudgetContext } from "../context/BudgetContext";
import { colors, radius, type } from "../design";

const filters = ["all", "expense", "income"];

export default function TransactionsScreen({ navigation }) {
  const { transactions, settings, deleteTransaction } = useContext(BudgetContext);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");

  const filtered = useMemo(
    () =>
      [...transactions]
        .filter((item) => filter === "all" || item.type === filter)
        .filter((item) => item.title.toLowerCase().includes(query.trim().toLowerCase()))
        .sort((a, b) => new Date(b.date) - new Date(a.date)),
    [transactions, filter, query]
  );

  const confirmDelete = (item) =>
    Alert.alert(
      "Delete transaction?",
      `${item.title} will be permanently removed.`,
      [
        { text: "Keep it", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => deleteTransaction(item.id) },
      ]
    );

  return (
    <SafeAreaView edges={["top"]} style={styles.safe}>
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>YOUR MONEY TRAIL</Text>
          <Text style={styles.title}>Activity</Text>
        </View>
        <Pressable onPress={() => navigation.navigate("AddTransaction")} style={styles.add}>
          <Ionicons name="add" size={25} color={colors.surface} />
        </Pressable>
      </View>

      <View style={styles.search}>
        <Ionicons name="search-outline" size={20} color={colors.muted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search transactions"
          placeholderTextColor={colors.soft}
          style={styles.searchInput}
          returnKeyType="search"
        />
        {query ? (
          <Ionicons name="close-circle" size={19} color={colors.soft} onPress={() => setQuery("")} />
        ) : null}
      </View>

      <View style={styles.filters}>
        {filters.map((item) => (
          <Pressable
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
            onLongPress={() => confirmDelete(item)}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            icon="search-outline"
            title={transactions.length ? "No matches" : "No activity yet"}
            message={
              transactions.length
                ? "Try another search or filter."
                : "Add expenses and income to build your money timeline."
            }
            action={transactions.length ? undefined : "Add transaction"}
            onAction={() => navigation.navigate("AddTransaction")}
          />
        }
        ListFooterComponent={
          filtered.length ? <Text style={styles.tip}>Tip: hold an item to delete it.</Text> : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 18, paddingTop: 13, paddingBottom: 16 },
  eyebrow: { color: colors.muted, fontSize: 10, fontWeight: "800", letterSpacing: 1.2 },
  title: { ...type.h1, marginTop: 2, letterSpacing: -0.7 },
  add: { width: 44, height: 44, borderRadius: 16, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  search: { flexDirection: "row", alignItems: "center", gap: 9, marginHorizontal: 18, backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 14, minHeight: 51 },
  searchInput: { flex: 1, color: colors.ink, fontSize: 14 },
  filters: { flexDirection: "row", gap: 8, paddingHorizontal: 18, paddingVertical: 13 },
  filter: { paddingHorizontal: 15, paddingVertical: 9, backgroundColor: colors.surface, borderRadius: 99, borderWidth: 1, borderColor: colors.line },
  filterActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterText: { color: colors.muted, fontSize: 12, fontWeight: "800" },
  filterTextActive: { color: colors.surface },
  list: { marginHorizontal: 18, backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 15, paddingBottom: 90 },
  emptyList: { backgroundColor: "transparent", borderWidth: 0, justifyContent: "center", flexGrow: 1, paddingHorizontal: 0 },
  divider: { height: 1, backgroundColor: colors.line, marginLeft: 57 },
  tip: { textAlign: "center", color: colors.soft, fontSize: 11, paddingVertical: 20 },
});
