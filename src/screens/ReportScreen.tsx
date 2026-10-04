import type { TabProps } from '../navigation/routes';
import { useRequiredContext as useContext } from '../context/requiredContext';
import { Ionicons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import EmptyState from "../components/EmptyState";
import MonthSwitcher from "../components/MonthSwitcher";
import SectionHeader from "../components/SectionHeader";
import SubscriptionImpactCard from "../components/SubscriptionImpactCard";
import { BudgetContext } from "../context/BudgetContext";
import { categoryById } from "../data/categories";
import { colors, radius, type } from "../design";
import { categorySpend, getTotals } from "../utils/calculations";
import { formatMoney } from "../utils/formatters";
import { monthStart } from '../domain/calendar';
import { AuthContext } from '../context/AuthContext';
import { useReportTotals } from '../context/useReportTotals';
import { monthKey as financialMonthKey } from '../utils/dates';

const monthKey = (date: Date) => `${date.getUTCFullYear()}-${date.getUTCMonth()}`;

export default function ReportScreen({ navigation }: TabProps<'Reports'>) {
  const { transactions, settings } = useContext(BudgetContext);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const localTotals = useMemo(
    () => getTotals(transactions, selectedMonth),
    [transactions, selectedMonth]
  );
  const { user } = useContext(AuthContext);
  const server = useReportTotals(financialMonthKey(selectedMonth), transactions, user?.id);
  const totals = server?.result ? { income: server.result.income, expenses: server.result.expenses, balance: server.result.monthlyNet } : localTotals;
  const spend = useMemo(
    () => categorySpend(transactions, selectedMonth),
    [transactions, selectedMonth]
  );
  const ranked = useMemo(
    () => Object.entries(spend).sort((a, b) => b[1] - a[1]),
    [spend]
  );
  const now = new Date();
  const isCurrentMonth =
    selectedMonth.getUTCFullYear() === now.getUTCFullYear() &&
    selectedMonth.getUTCMonth() === now.getUTCMonth();
  const daysElapsed = isCurrentMonth
    ? now.getUTCDate()
    : new Date(Date.UTC(selectedMonth.getUTCFullYear(), selectedMonth.getUTCMonth() + 1, 0)).getUTCDate();
  const savingsRate = totals.income > 0 ? ((totals.income - totals.expenses) / totals.income) * 100 : 0;
  const maxCategory = ranked[0]?.[1] || 1;

  const months = useMemo(() => {
    const result = [];
    for (let offset = 3; offset >= 0; offset -= 1) {
      const date = monthStart(new Date(), -offset);
      const amount = getTotals(transactions, date).expenses;
      result.push({
        key: monthKey(date),
        label: new Intl.DateTimeFormat("en", { timeZone: 'UTC', month: "short" }).format(date),
        amount,
      });
    }
    return result;
  }, [transactions]);
  const maxMonth = Math.max(...months.map((item) => item.amount), 1);

  return (
    <SafeAreaView edges={["top"]} style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>MONEY, MADE CLEAR</Text>
          <Text style={styles.title}>Insights</Text>
        </View>

        <MonthSwitcher value={selectedMonth} onChange={setSelectedMonth} />
        {user ? <Text accessibilityLiveRegion="polite" style={type.small}>{server?.result ? 'Totals include all server transactions. Category details use the refreshed history.' : server?.error ? 'Server totals unavailable. Showing loaded history; use Refresh to retry.' : 'Loading complete server totals; showing loaded history.'}</Text> : null}

        <View style={styles.scoreRow}>
          <View style={styles.scoreCard}>
            <View style={[styles.scoreIcon, { backgroundColor: colors.mint }]}>
              <Ionicons aria-hidden={true} name="leaf-outline" size={20} color={colors.primary} />
            </View>
            <Text style={styles.scoreLabel}>Savings rate</Text>
            <Text style={styles.scoreValue}>{Math.round(savingsRate)}%</Text>
          </View>
          <View style={styles.scoreCard}>
            <View style={[styles.scoreIcon, { backgroundColor: "#FFF1D5" }]}>
              <Ionicons aria-hidden={true} name="calendar-outline" size={20} color="#A86A14" />
            </View>
            <Text style={styles.scoreLabel}>Daily average</Text>
            <Text style={styles.scoreValue}>
              {formatMoney(totals.expenses / Math.max(daysElapsed, 1), settings.currency, true)}
            </Text>
          </View>
        </View>

        <SubscriptionImpactCard navigation={navigation} />

        <View style={styles.chartCard}>
          <SectionHeader title="Four-month rhythm" />
          <Text style={styles.chartSub}>Your expense total by month</Text>
          <View style={styles.bars}>
            {months.map((month, index) => (
              <View key={month.key} style={styles.barColumn}>
                <Text style={styles.barValue}>
                  {month.amount ? formatMoney(month.amount, settings.currency, true) : "—"}
                </Text>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.bar,
                      {
                        height: `${Math.max((month.amount / maxMonth) * 100, month.amount ? 9 : 2)}%`,
                        backgroundColor: index === months.length - 1 ? colors.primary : colors.mint,
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.barLabel, index === months.length - 1 && styles.barLabelActive]}>
                  {month.label}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <SectionHeader title="Where it went" />
          {ranked.length ? (
            <View style={styles.categoryCard}>
              {ranked.map(([id, amount], index) => {
                const category = categoryById(id);
                const percent = totals.expenses ? (amount / totals.expenses) * 100 : 0;
                return (
                  <View key={id} style={[styles.categoryRow, index < ranked.length - 1 && styles.categoryDivider]}>
                    <View style={[styles.categoryIcon, { backgroundColor: `${category.color}25` }]}>
                      <Ionicons aria-hidden={true} name={category.icon} size={19} color={category.color} />
                    </View>
                    <View style={styles.categoryCopy}>
                      <View style={styles.categoryTop}>
                        <Text style={styles.categoryName}>{category.label}</Text>
                        <Text style={styles.categoryAmount}>{formatMoney(amount, settings.currency)}</Text>
                      </View>
                      <View style={styles.categoryTrack}>
                        <View
                          style={[
                            styles.categoryFill,
                            { width: `${(amount / maxCategory) * 100}%`, backgroundColor: category.color },
                          ]}
                        />
                      </View>
                      <Text style={styles.categoryPercent}>{Math.round(percent)}% of expenses</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          ) : (
            <EmptyState
              icon="pie-chart-outline"
              title="No spending in this month"
              message="Choose another month or add expenses to reveal your spending patterns."
              action="Add expense"
              onAction={() => navigation.navigate("AddTransaction")}
            />
          )}
        </View>

        {ranked.length ? (
          <View style={styles.nudge}>
            <View style={styles.nudgeIcon}>
              <Ionicons aria-hidden={true} name="sparkles-outline" size={21} color={colors.primaryDark} />
            </View>
            <View style={styles.nudgeCopy}>
              <Text style={styles.nudgeTitle}>A useful nudge</Text>
              <Text style={styles.nudgeText}>
                {categoryById(ranked[0][0]).label} was the largest category in this month at{" "}
                {formatMoney(ranked[0][1], settings.currency)}. Review it before setting next month’s limit.
              </Text>
            </View>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas },
  content: { width: "100%", maxWidth: 1180, alignSelf: "center", paddingHorizontal: 18, paddingBottom: 110 },
  header: { paddingTop: 13, paddingBottom: 16 },
  eyebrow: { color: colors.muted, fontSize: 12, fontWeight: "800", letterSpacing: 1.2 },
  title: { ...type.h1, marginTop: 2, letterSpacing: -0.7 },
  scoreRow: { flexDirection: "row", gap: 10 },
  scoreCard: { flex: 1, borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, padding: 15 },
  scoreIcon: { width: 38, height: 38, borderRadius: 14, alignItems: "center", justifyContent: "center", marginBottom: 14 },
  scoreLabel: { color: colors.muted, fontSize: 12, fontWeight: "700" },
  scoreValue: { color: colors.ink, fontSize: 24, fontWeight: "900", letterSpacing: -0.8, marginTop: 3 },
  chartCard: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, padding: 16, marginTop: 11 },
  chartSub: { color: colors.muted, fontSize: 12, marginTop: -8 },
  bars: { height: 190, flexDirection: "row", gap: 12, alignItems: "flex-end", marginTop: 20 },
  barColumn: { flex: 1, alignItems: "center", height: "100%" },
  barValue: { color: colors.muted, fontSize: 12, fontWeight: "700", marginBottom: 7 },
  barTrack: { flex: 1, width: 27, borderRadius: 10, backgroundColor: colors.canvas, justifyContent: "flex-end", overflow: "hidden" },
  bar: { width: "100%", borderRadius: 10 },
  barLabel: { color: colors.muted, fontSize: 12, marginTop: 8 },
  barLabelActive: { color: colors.primary, fontWeight: "900" },
  section: { marginTop: 24 },
  categoryCard: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 14 },
  categoryRow: { flexDirection: "row", paddingVertical: 14 },
  categoryDivider: { borderBottomWidth: 1, borderBottomColor: colors.line },
  categoryIcon: { width: 42, height: 42, borderRadius: 15, alignItems: "center", justifyContent: "center", marginRight: 11 },
  categoryCopy: { flex: 1 },
  categoryTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  categoryName: { color: colors.ink, fontSize: 13, fontWeight: "800" },
  categoryAmount: { color: colors.ink, fontSize: 12, fontWeight: "900" },
  categoryTrack: { height: 5, borderRadius: 9, backgroundColor: colors.line, marginTop: 9, overflow: "hidden" },
  categoryFill: { height: 5, borderRadius: 9 },
  categoryPercent: { color: colors.muted, fontSize: 12, marginTop: 5 },
  nudge: { flexDirection: "row", backgroundColor: colors.lime, borderRadius: radius.lg, padding: 15, marginTop: 16 },
  nudgeIcon: { width: 42, height: 42, borderRadius: 15, backgroundColor: "rgba(255,255,255,0.62)", alignItems: "center", justifyContent: "center", marginRight: 11 },
  nudgeCopy: { flex: 1 },
  nudgeTitle: { color: colors.primaryDark, fontSize: 13, fontWeight: "900" },
  nudgeText: { color: colors.primaryDark, fontSize: 12, lineHeight: 16, marginTop: 4 },
});
