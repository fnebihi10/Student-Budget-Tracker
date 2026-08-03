import { Ionicons } from "@expo/vector-icons";
import React, { useContext, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import EmptyState from "../components/EmptyState";
import { BudgetContext } from "../context/BudgetContext";
import { GoalsContext } from "../context/GoalsContext";
import { SplitsContext } from "../context/SplitsContext";
import { SubscriptionsContext } from "../context/SubscriptionsContext";
import { splitCategoryById } from "../data/splitCategories";
import { serviceById } from "../data/subscriptionCatalog";
import { categoryById } from "../data/categories";
import { colors, radius } from "../design";
import { formatMoney } from "../utils/formatters";
import { isBillPaidForMonth } from "../utils/dates";
import { getNextRenewal } from "../utils/subscriptions";

const typeConfig = {
  transaction: { label: "Activity", color: colors.coral, icon: "receipt-outline" },
  bill: { label: "Bill", color: colors.amber, icon: "calendar-outline" },
  subscription: { label: "Subscription", color: colors.blue, icon: "repeat-outline" },
  goal: { label: "Goal", color: colors.primary, icon: "flag-outline" },
  split: { label: "Shared", color: colors.lavender, icon: "people-outline" },
};

const dateKey = (date) => {
  const value = new Date(date);
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(value.getDate()).padStart(2, "0")}`;
};

const sameMonth = (date, month) =>
  date.getMonth() === month.getMonth() &&
  date.getFullYear() === month.getFullYear();

export default function MoneyCalendarScreen({ navigation }) {
  const budget = useContext(BudgetContext);
  const { subscriptions } = useContext(SubscriptionsContext);
  const { goals } = useContext(GoalsContext);
  const { splits } = useContext(SplitsContext);
  const [month, setMonth] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  );
  const [selected, setSelected] = useState(dateKey(new Date()));
  const [filter, setFilter] = useState("all");

  const events = useMemo(() => {
    const result = [];
    const lastDay = new Date(
      month.getFullYear(),
      month.getMonth() + 1,
      0
    ).getDate();

    budget.transactions.forEach((item) => {
      const date = new Date(item.date);
      if (!sameMonth(date, month)) return;
      const category = categoryById(item.category);
      result.push({
        id: `transaction-${item.id}`,
        type: "transaction",
        date,
        title: item.title,
        subtitle: item.type === "income" ? "Income" : category.label,
        amount: item.amount,
        income: item.type === "income",
        icon: category.icon,
        color: category.color,
      });
    });

    budget.bills.forEach((bill) => {
      const date = new Date(
        month.getFullYear(),
        month.getMonth(),
        Math.min(bill.dueDay, lastDay),
        12
      );
      const category = categoryById(bill.category);
      result.push({
        id: `bill-${bill.id}-${dateKey(date)}`,
        type: "bill",
        date,
        title: bill.title,
        subtitle: isBillPaidForMonth(bill, date) ? "Marked paid" : "Monthly bill",
        amount: bill.amount,
        icon: category.icon,
        color: category.color,
      });
    });

    subscriptions
      .filter((item) => item.status === "active")
      .forEach((item) => {
        const start = new Date(month.getFullYear(), month.getMonth(), 1, 12);
        const renewal = getNextRenewal(item, start);
        if (!sameMonth(renewal, month)) return;
        const service = serviceById(item.serviceId);
        result.push({
          id: `subscription-${item.id}-${dateKey(renewal)}`,
          type: "subscription",
          date: renewal,
          title: item.name,
          subtitle: `${item.frequency} renewal`,
          amount: item.amount,
          icon: item.icon || service.icon,
          color: item.color || service.color,
        });
      });

    goals.forEach((goal) => {
      if (!goal.deadline) return;
      const date = new Date(goal.deadline);
      if (!sameMonth(date, month)) return;
      result.push({
        id: `goal-${goal.id}`,
        type: "goal",
        date,
        title: goal.name,
        subtitle: "Savings target date",
        amount: Math.max(Number(goal.target) - Number(goal.saved), 0),
        icon: goal.icon,
        color: goal.color,
      });
    });

    splits
      .filter((item) => item.status === "open" && item.dueDate)
      .forEach((item) => {
        const date = new Date(item.dueDate);
        if (!sameMonth(date, month)) return;
        const category = splitCategoryById(item.category);
        result.push({
          id: `split-${item.id}`,
          type: "split",
          date,
          title: item.title,
          subtitle:
            item.direction === "owed_to_me"
              ? `${item.person} owes you`
              : `You owe ${item.person}`,
          amount: item.amount,
          income: item.direction === "owed_to_me",
          icon: category.icon,
          color: category.color,
        });
      });

    return result.sort((a, b) => a.date - b.date);
  }, [
    month,
    budget.transactions,
    budget.bills,
    subscriptions,
    goals,
    splits,
  ]);

  const visibleEvents = events.filter(
    (event) => filter === "all" || event.type === filter
  );
  const selectedEvents = visibleEvents.filter(
    (event) => dateKey(event.date) === selected
  );
  const monthTitle = new Intl.DateTimeFormat("en", {
    month: "long",
    year: "numeric",
  }).format(month);
  const selectedTitle = new Intl.DateTimeFormat("en", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date(`${selected}T12:00:00`));

  const moveMonth = (offset) => {
    const next = new Date(month.getFullYear(), month.getMonth() + offset, 1);
    setMonth(next);
    const today = new Date();
    setSelected(
      dateKey(
        sameMonth(today, next)
          ? today
          : new Date(next.getFullYear(), next.getMonth(), 1, 12)
      )
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.back}>
          <Ionicons name="arrow-back" size={22} color={colors.ink} />
        </Pressable>
        <Text style={styles.headerTitle}>Money calendar</Text>
        <Pressable
          onPress={() => {
            const today = new Date();
            setMonth(new Date(today.getFullYear(), today.getMonth(), 1));
            setSelected(dateKey(today));
          }}
          style={styles.today}
        >
          <Text style={styles.todayText}>Today</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.calendar}>
          <View style={styles.monthRow}>
            <Pressable onPress={() => moveMonth(-1)} style={styles.monthButton}>
              <Ionicons name="chevron-back" size={20} color={colors.primary} />
            </Pressable>
            <View style={styles.monthCopy}>
              <Text style={styles.monthLabel}>UNIFIED TIMELINE</Text>
              <Text style={styles.monthTitle}>{monthTitle}</Text>
            </View>
            <Pressable onPress={() => moveMonth(1)} style={styles.monthButton}>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.primary}
              />
            </Pressable>
          </View>
          <View style={styles.weekdays}>
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <Text key={day} style={styles.weekday}>
                {day}
              </Text>
            ))}
          </View>
          <CalendarGrid
            month={month}
            selected={selected}
            onSelect={setSelected}
            events={visibleEvents}
          />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filters}
        >
          {[
            ["all", "Everything"],
            ["transaction", "Activity"],
            ["bill", "Bills"],
            ["subscription", "Renewals"],
            ["goal", "Goals"],
            ["split", "Shared"],
          ].map(([id, label]) => (
            <Pressable
              key={id}
              onPress={() => setFilter(id)}
              style={[styles.filter, filter === id && styles.filterActive]}
            >
              {id !== "all" ? (
                <View
                  style={[
                    styles.filterDot,
                    { backgroundColor: typeConfig[id].color },
                  ]}
                />
              ) : null}
              <Text
                style={[
                  styles.filterText,
                  filter === id && styles.filterTextActive,
                ]}
              >
                {label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.selectedHeader}>
          <Text style={styles.selectedTitle}>{selectedTitle}</Text>
          <Text style={styles.selectedCount}>
            {selectedEvents.length} item{selectedEvents.length === 1 ? "" : "s"}
          </Text>
        </View>

        {selectedEvents.length ? (
          <View style={styles.events}>
            {selectedEvents.map((event, index) => (
              <View
                key={event.id}
                style={[
                  styles.event,
                  index < selectedEvents.length - 1 && styles.eventDivider,
                ]}
              >
                <View
                  style={[
                    styles.eventIcon,
                    { backgroundColor: `${event.color}22` },
                  ]}
                >
                  <Ionicons
                    name={event.icon || typeConfig[event.type].icon}
                    size={20}
                    color={event.color}
                  />
                </View>
                <View style={styles.eventCopy}>
                  <View style={styles.eventTitleRow}>
                    <Text style={styles.eventTitle}>{event.title}</Text>
                    <View
                      style={[
                        styles.eventPill,
                        {
                          backgroundColor: `${typeConfig[event.type].color}18`,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.eventPillText,
                          { color: typeConfig[event.type].color },
                        ]}
                      >
                        {typeConfig[event.type].label}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.eventSubtitle}>{event.subtitle}</Text>
                </View>
                <Text
                  style={[
                    styles.eventAmount,
                    event.income && styles.eventIncome,
                  ]}
                >
                  {event.income ? "+" : event.type === "goal" ? "" : "−"}
                  {formatMoney(event.amount, budget.settings.currency)}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <EmptyState
            icon="calendar-clear-outline"
            title="A quiet day"
            message="No matching money activity or deadlines are planned for this date."
          />
        )}

        <View style={styles.legend}>
          <Ionicons
            name="information-circle-outline"
            size={18}
            color={colors.primary}
          />
          <Text style={styles.legendText}>
            The calendar combines your existing Pocketwise entries. Monthly bills
            repeat automatically; subscription dates follow their saved billing
            frequency.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function CalendarGrid({ month, selected, onSelect, events }) {
  const firstWeekday = new Date(
    month.getFullYear(),
    month.getMonth(),
    1
  ).getDay();
  const days = new Date(
    month.getFullYear(),
    month.getMonth() + 1,
    0
  ).getDate();
  const cells = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: days }, (_, index) => index + 1),
  ];
  while (cells.length % 7) cells.push(null);
  const todayKey = dateKey(new Date());

  return (
    <View style={styles.grid}>
      {cells.map((day, index) => {
        if (!day) return <View key={`blank-${index}`} style={styles.day} />;
        const date = new Date(month.getFullYear(), month.getMonth(), day, 12);
        const key = dateKey(date);
        const dayEvents = events.filter((event) => dateKey(event.date) === key);
        const active = key === selected;
        const today = key === todayKey;
        return (
          <Pressable
            key={key}
            onPress={() => onSelect(key)}
            style={[styles.day, active && styles.dayActive]}
          >
            <Text
              style={[
                styles.dayText,
                today && styles.dayToday,
                active && styles.dayTextActive,
              ]}
            >
              {day}
            </Text>
            <View style={styles.dots}>
              {dayEvents.slice(0, 3).map((event) => (
                <View
                  key={event.id}
                  style={[
                    styles.dot,
                    {
                      backgroundColor: active
                        ? colors.surface
                        : typeConfig[event.type].color,
                    },
                  ]}
                />
              ))}
            </View>
          </Pressable>
        );
      })}
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
  today: {
    minWidth: 52,
    height: 36,
    borderRadius: 13,
    backgroundColor: colors.mint,
    alignItems: "center",
    justifyContent: "center",
  },
  todayText: { color: colors.primary, fontSize: 10, fontWeight: "900" },
  content: { width: "100%", maxWidth: 1180, alignSelf: "center", paddingHorizontal: 18, paddingBottom: 35 },
  calendar: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 14,
  },
  monthRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  monthButton: {
    width: 37,
    height: 37,
    borderRadius: 13,
    backgroundColor: colors.mint,
    alignItems: "center",
    justifyContent: "center",
  },
  monthCopy: { alignItems: "center" },
  monthLabel: {
    color: colors.muted,
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  monthTitle: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: "900",
    marginTop: 2,
  },
  weekdays: { flexDirection: "row", marginBottom: 5 },
  weekday: {
    width: "14.285%",
    textAlign: "center",
    color: colors.soft,
    fontSize: 8,
    fontWeight: "800",
  },
  grid: { flexDirection: "row", flexWrap: "wrap" },
  day: {
    width: "14.285%",
    height: 47,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  dayActive: { backgroundColor: colors.primary },
  dayText: { color: colors.ink, fontSize: 11, fontWeight: "700" },
  dayToday: { color: colors.primary, fontWeight: "900" },
  dayTextActive: { color: colors.surface },
  dots: { flexDirection: "row", gap: 2, height: 5, marginTop: 4 },
  dot: { width: 4, height: 4, borderRadius: 2 },
  filters: { gap: 7, paddingVertical: 13, paddingRight: 18 },
  filter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: colors.surface,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 11,
    paddingVertical: 8,
  },
  filterActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterDot: { width: 6, height: 6, borderRadius: 3 },
  filterText: { color: colors.muted, fontSize: 9, fontWeight: "800" },
  filterTextActive: { color: colors.surface },
  selectedHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
    marginBottom: 10,
  },
  selectedTitle: { color: colors.ink, fontSize: 15, fontWeight: "900" },
  selectedCount: { color: colors.muted, fontSize: 9 },
  events: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 13,
  },
  event: { minHeight: 70, flexDirection: "row", alignItems: "center" },
  eventDivider: { borderBottomWidth: 1, borderBottomColor: colors.line },
  eventIcon: {
    width: 42,
    height: 42,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  eventCopy: { flex: 1, paddingRight: 8 },
  eventTitleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  eventTitle: { color: colors.ink, fontSize: 12, fontWeight: "900" },
  eventSubtitle: { color: colors.muted, fontSize: 9, marginTop: 4 },
  eventPill: { borderRadius: 99, paddingHorizontal: 6, paddingVertical: 3 },
  eventPillText: { fontSize: 7, fontWeight: "900" },
  eventAmount: { color: colors.ink, fontSize: 11, fontWeight: "900" },
  eventIncome: { color: colors.primary },
  legend: {
    flexDirection: "row",
    gap: 8,
    backgroundColor: colors.mint,
    borderRadius: radius.md,
    padding: 12,
    marginTop: 14,
  },
  legendText: {
    flex: 1,
    color: colors.primaryDark,
    fontSize: 9,
    lineHeight: 14,
  },
});
