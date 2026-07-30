import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useContext, useMemo } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import EmptyState from "../components/EmptyState";
import SectionHeader from "../components/SectionHeader";
import { BudgetContext } from "../context/BudgetContext";
import { SubscriptionsContext } from "../context/SubscriptionsContext";
import { serviceById, subscriptionCatalog } from "../data/subscriptionCatalog";
import { colors, radius, shadow, type } from "../design";
import { formatMoney, shortDate } from "../utils/formatters";
import {
  activeSubscriptionTotal,
  daysUntil,
  monthlyEquivalent,
  upcomingSubscriptions,
  yearlyEquivalent,
} from "../utils/subscriptions";

export default function SubscriptionsScreen({ navigation }) {
  const { settings } = useContext(BudgetContext);
  const {
    subscriptions,
    toggleSubscription,
    deleteSubscription,
  } = useContext(SubscriptionsContext);
  const active = subscriptions.filter((item) => item.status === "active");
  const paused = subscriptions.filter((item) => item.status === "paused");
  const monthly = useMemo(
    () => activeSubscriptionTotal(subscriptions),
    [subscriptions]
  );
  const upcoming = useMemo(
    () => upcomingSubscriptions(subscriptions, 5),
    [subscriptions]
  );
  const cheapest = useMemo(
    () =>
      [...active].sort(
        (a, b) => monthlyEquivalent(a) - monthlyEquivalent(b)
      )[0],
    [active]
  );

  const confirmDelete = (item) =>
    Alert.alert(
      `Remove ${item.name}?`,
      "This removes it from Pocketwise only. It does not cancel the service with its provider.",
      [
        { text: "Keep it", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => deleteSubscription(item.id),
        },
      ]
    );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.back}>
          <Ionicons name="arrow-back" size={22} color={colors.ink} />
        </Pressable>
        <Text style={styles.headerTitle}>My subscriptions</Text>
        <Pressable
          onPress={() => navigation.navigate("ManageSubscription")}
          style={styles.add}
        >
          <Ionicons name="add" size={23} color={colors.surface} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={["#243D77", "#345A9B", "#4475AC"]}
          style={styles.hero}
        >
          <View style={styles.heroTop}>
            <View>
              <Text style={styles.heroLabel}>MONTHLY COMMITMENT</Text>
              <Text style={styles.heroValue}>
                {formatMoney(monthly, settings.currency)}
              </Text>
            </View>
            <View style={styles.heroBadge}>
              <Ionicons name="repeat" size={15} color={colors.lime} />
              <Text style={styles.heroBadgeText}>{active.length} active</Text>
            </View>
          </View>
          <View style={styles.yearRow}>
            <View>
              <Text style={styles.yearLabel}>That becomes</Text>
              <Text style={styles.yearValue}>
                {formatMoney(monthly * 12, settings.currency)} / year
              </Text>
            </View>
            <View style={styles.heroDivider} />
            <View>
              <Text style={styles.yearLabel}>Average per day</Text>
              <Text style={styles.yearValue}>
                {formatMoney((monthly * 12) / 365, settings.currency)}
              </Text>
            </View>
          </View>
        </LinearGradient>

        {active.length ? (
          <View style={styles.audit}>
            <View style={styles.auditIcon}>
              <Ionicons
                name="search-outline"
                size={20}
                color={colors.primaryDark}
              />
            </View>
            <View style={styles.auditCopy}>
              <Text style={styles.auditTitle}>Subscription check-up</Text>
              <Text style={styles.auditText}>
                {cheapest
                  ? `Even ${cheapest.name} adds up to ${formatMoney(
                      yearlyEquivalent(cheapest),
                      settings.currency
                    )} a year. Keep it only if it earns its place.`
                  : "Review recurring costs every few months."}
              </Text>
            </View>
          </View>
        ) : null}

        {upcoming.length ? (
          <View style={styles.section}>
            <SectionHeader title="Coming up" />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.upcomingContent}
            >
              {upcoming.map((item) => {
                const service = serviceById(item.serviceId);
                const days = daysUntil(item.renewalDate);
                return (
                  <Pressable
                    key={item.id}
                    onPress={() =>
                      navigation.navigate("ManageSubscription", {
                        subscriptionId: item.id,
                      })
                    }
                    style={styles.upcomingCard}
                  >
                    <ServiceIcon item={item} service={service} size={42} />
                    <Text numberOfLines={1} style={styles.upcomingName}>
                      {item.name}
                    </Text>
                    <Text style={styles.upcomingAmount}>
                      {formatMoney(item.amount, settings.currency)}
                    </Text>
                    <View style={styles.duePill}>
                      <Text style={styles.dueText}>
                        {days === 0 ? "Today" : `In ${days} day${days === 1 ? "" : "s"}`}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        ) : null}

        <View style={styles.section}>
          <SectionHeader title="Popular services" action="Add custom" onAction={() => navigation.navigate("ManageSubscription")} />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.catalogContent}
          >
            {subscriptionCatalog.slice(0, -1).map((service) => (
              <Pressable
                key={service.id}
                onPress={() =>
                  navigation.navigate("ManageSubscription", {
                    serviceId: service.id,
                  })
                }
                style={({ pressed }) => [
                  styles.catalogItem,
                  pressed && styles.pressed,
                ]}
              >
                <View
                  style={[
                    styles.catalogIcon,
                    { backgroundColor: `${service.color}20` },
                  ]}
                >
                  <Ionicons
                    name={service.icon}
                    size={22}
                    color={service.color}
                  />
                </View>
                <Text numberOfLines={1} style={styles.catalogName}>
                  {service.name}
                </Text>
                <Text style={styles.catalogAdd}>Add</Text>
              </Pressable>
            ))}
          </ScrollView>
          <Text style={styles.catalogNote}>
            Suggested amounts are editable examples, not live provider pricing.
          </Text>
        </View>

        <View style={styles.section}>
          <SectionHeader
            title="Active subscriptions"
            action={active.length ? `${active.length} total` : undefined}
          />
          {active.length ? (
            <View style={styles.list}>
              {active.map((item, index) => (
                <SubscriptionRow
                  key={item.id}
                  item={item}
                  currency={settings.currency}
                  onPress={() =>
                    navigation.navigate("ManageSubscription", {
                      subscriptionId: item.id,
                    })
                  }
                  onLongPress={() => confirmDelete(item)}
                  onToggle={() => toggleSubscription(item.id)}
                  last={index === active.length - 1}
                />
              ))}
            </View>
          ) : (
            <EmptyState
              icon="repeat-outline"
              title="No subscriptions tracked"
              message="Add streaming, music, storage, software, gym, or any recurring membership."
              action="Add my first subscription"
              onAction={() => navigation.navigate("ManageSubscription")}
            />
          )}
        </View>

        {paused.length ? (
          <View style={styles.section}>
            <SectionHeader title="Paused" />
            <View style={styles.list}>
              {paused.map((item, index) => (
                <SubscriptionRow
                  key={item.id}
                  item={item}
                  currency={settings.currency}
                  onPress={() =>
                    navigation.navigate("ManageSubscription", {
                      subscriptionId: item.id,
                    })
                  }
                  onLongPress={() => confirmDelete(item)}
                  onToggle={() => toggleSubscription(item.id)}
                  last={index === paused.length - 1}
                />
              ))}
            </View>
          </View>
        ) : null}

        <View style={styles.disclaimer}>
          <Ionicons
            name="information-circle-outline"
            size={19}
            color={colors.primary}
          />
          <Text style={styles.disclaimerText}>
            Pausing or removing an item here does not cancel it with Netflix,
            Spotify, YouTube, or another provider. Cancel directly with that
            service.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function ServiceIcon({ item, service, size = 45 }) {
  const color = item.color || service.color;
  return (
    <View
      style={[
        styles.serviceIcon,
        {
          width: size,
          height: size,
          borderRadius: size * 0.36,
          backgroundColor: `${color}20`,
        },
      ]}
    >
      <Ionicons
        name={item.icon || service.icon}
        size={Math.round(size * 0.47)}
        color={color}
      />
    </View>
  );
}

function SubscriptionRow({
  item,
  currency,
  onPress,
  onLongPress,
  onToggle,
  last,
}) {
  const service = serviceById(item.serviceId);
  const renewal = upcomingSubscriptions([item], 1)[0]?.renewalDate;
  return (
    <View style={[styles.rowWrap, !last && styles.rowDivider]}>
      <Pressable
        onPress={onPress}
        onLongPress={onLongPress}
        style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      >
        <ServiceIcon item={item} service={service} />
        <View style={styles.rowCopy}>
          <Text style={styles.rowTitle}>{item.name}</Text>
          <Text style={styles.rowMeta}>
            {item.status === "paused"
              ? "Paused"
              : `${item.frequency} · ${renewal ? shortDate(renewal) : "No date"}`}
          </Text>
        </View>
        <View style={styles.rowPrice}>
          <Text style={styles.rowAmount}>
            {formatMoney(item.amount, currency)}
          </Text>
          <Text style={styles.rowFrequency}>
            /{item.frequency === "yearly" ? "yr" : item.frequency === "weekly" ? "wk" : "mo"}
          </Text>
        </View>
      </Pressable>
      <Pressable
        accessibilityLabel={
          item.status === "active" ? `Pause ${item.name}` : `Resume ${item.name}`
        }
        onPress={onToggle}
        style={styles.pauseButton}
      >
        <Ionicons
          name={item.status === "active" ? "pause" : "play"}
          size={14}
          color={item.status === "active" ? colors.muted : colors.primary}
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
  content: { paddingHorizontal: 18, paddingBottom: 35 },
  hero: { borderRadius: radius.xl, padding: 20, ...shadow },
  heroTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  heroLabel: {
    color: "#BFD0F1",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  heroValue: {
    color: colors.surface,
    fontSize: 34,
    fontWeight: "900",
    letterSpacing: -1.2,
    marginTop: 4,
  },
  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(12,30,61,0.35)",
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  heroBadgeText: { color: colors.lime, fontSize: 10, fontWeight: "800" },
  yearRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.10)",
    borderRadius: radius.md,
    padding: 13,
    marginTop: 18,
    gap: 17,
  },
  yearLabel: { color: "#BFD0F1", fontSize: 9 },
  yearValue: {
    color: colors.surface,
    fontSize: 13,
    fontWeight: "900",
    marginTop: 3,
  },
  heroDivider: {
    width: 1,
    height: 30,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  audit: {
    flexDirection: "row",
    backgroundColor: colors.lime,
    borderRadius: radius.lg,
    padding: 14,
    marginTop: 12,
  },
  auditIcon: {
    width: 42,
    height: 42,
    borderRadius: 15,
    backgroundColor: "rgba(255,255,255,0.62)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
  },
  auditCopy: { flex: 1 },
  auditTitle: {
    color: colors.primaryDark,
    fontSize: 13,
    fontWeight: "900",
  },
  auditText: {
    color: colors.primaryDark,
    fontSize: 10,
    lineHeight: 15,
    marginTop: 3,
  },
  section: { marginTop: 24 },
  upcomingContent: { gap: 10, paddingRight: 18 },
  upcomingCard: {
    width: 130,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 13,
  },
  upcomingName: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: "800",
    marginTop: 10,
  },
  upcomingAmount: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: "900",
    marginTop: 4,
  },
  duePill: {
    alignSelf: "flex-start",
    backgroundColor: colors.mint,
    borderRadius: 99,
    paddingHorizontal: 7,
    paddingVertical: 4,
    marginTop: 8,
  },
  dueText: { color: colors.primary, fontSize: 8, fontWeight: "800" },
  catalogContent: { gap: 9, paddingRight: 18 },
  catalogItem: {
    width: 104,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 12,
  },
  catalogIcon: {
    width: 42,
    height: 42,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  catalogName: {
    color: colors.ink,
    fontSize: 11,
    fontWeight: "800",
    marginTop: 9,
  },
  catalogAdd: {
    color: colors.primary,
    fontSize: 9,
    fontWeight: "900",
    marginTop: 5,
  },
  catalogNote: { color: colors.soft, fontSize: 9, marginTop: 8 },
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
  serviceIcon: { alignItems: "center", justifyContent: "center" },
  rowCopy: { flex: 1, paddingHorizontal: 11 },
  rowTitle: { color: colors.ink, fontSize: 13, fontWeight: "800" },
  rowMeta: { color: colors.muted, fontSize: 9, marginTop: 4 },
  rowPrice: { alignItems: "flex-end" },
  rowAmount: { color: colors.ink, fontSize: 12, fontWeight: "900" },
  rowFrequency: { color: colors.muted, fontSize: 8, marginTop: 2 },
  pauseButton: {
    width: 31,
    height: 31,
    borderRadius: 11,
    backgroundColor: colors.canvas,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  pressed: { opacity: 0.65 },
  disclaimer: {
    flexDirection: "row",
    gap: 9,
    backgroundColor: colors.mint,
    borderRadius: radius.md,
    padding: 13,
    marginTop: 20,
  },
  disclaimerText: {
    flex: 1,
    color: colors.primaryDark,
    fontSize: 9,
    lineHeight: 14,
  },
});
