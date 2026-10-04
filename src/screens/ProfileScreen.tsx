import type { IconName } from '../domain/models';
import { useModalFocus } from '../components/useModalFocus';
import type { TabProps } from '../navigation/routes';
import { useRequiredContext as useContext } from '../context/requiredContext';
import { Ionicons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AppButton from "../components/AppButton";
import { BudgetContext } from "../context/BudgetContext";
import { AuthContext } from "../context/AuthContext";
import { GoalsContext } from "../context/GoalsContext";
import { SplitsContext } from "../context/SplitsContext";
import { SubscriptionsContext } from "../context/SubscriptionsContext";
import { colors, radius, shadow, type } from "../design";
import { formatMoney } from "../utils/formatters";
import { isBillPaidForMonth } from "../utils/dates";
import { goalTotals } from "../utils/goals";
import { activeSubscriptionTotal } from "../utils/subscriptions";

const currencies = ["EUR", "USD", "GBP", "HUF"] as const;

export default function ProfileScreen({ navigation }: TabProps<'Profile'>) {
  const {
    profile,
    settings,
    updateSettings,
    updateProfile,
    transactions,
    bills,
  } = useContext(BudgetContext);
  const { signOut, user, isDemo } = useContext(AuthContext);
  const { subscriptions } = useContext(SubscriptionsContext);
  const { goals } = useContext(GoalsContext);
  const { splits } = useContext(SplitsContext);
  const [showProfile, setShowProfile] = useState(false);
  useModalFocus(showProfile);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [name, setName] = useState(profile.name);
  const [school, setSchool] = useState(profile.school);
  const [budget, setBudget] = useState(String(settings.monthlyBudget));
  const [editRevisions, setEditRevisions] = useState({ profile: 0, settings: 0 });
  const openProfile = () => {
    setName(profile.name);
    setSchool(profile.school);
    setBudget(String(settings.monthlyBudget));
    setEditRevisions({ profile: profile.revision ?? 0, settings: settings.revision ?? 0 });
    setShowProfile(true);
  };
  const saved = useMemo(() => goalTotals(goals).saved, [goals]);
  const recurring = useMemo(
    () => activeSubscriptionTotal(subscriptions),
    [subscriptions]
  );

  const saveProfile = async () => {
    if (!await updateProfile({ name: name.trim(), school: school.trim(), revision: editRevisions.profile })) return;
    const saved = await updateSettings({
      revision: editRevisions.settings,
      monthlyBudget:
        Number(budget.replace(",", ".")) || settings.monthlyBudget,
    });
    if (saved) setShowProfile(false);
  };

  const performLogout = async () => {
    if (isSigningOut) return;
    setIsSigningOut(true);
    const { error } = await signOut();
    setIsSigningOut(false);
    if (error && Platform.OS !== "web") {
      Alert.alert("Could not sign out", error.message);
    }
  };

  const confirmLogout = () => {
    const message = isDemo
      ? "This closes the local demo and returns to sign in."
      : `Your cloud data stays securely linked to ${user?.email || "your account"}.`;

    if (Platform.OS === "web") {
      const confirmed = globalThis.confirm?.(
        `Sign out of Pocketwise?\n\n${message}`
      );
      if (confirmed) void performLogout();
      return;
    }

    Alert.alert("Sign out of Pocketwise?", message, [
      { text: "Stay signed in", style: "cancel" },
      { text: "Sign out", style: "destructive", onPress: performLogout },
    ]);
  };

  return (
    <SafeAreaView edges={["top"]} style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>YOUR POCKETWISE</Text>
            <Text style={styles.title}>Profile & tools</Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Edit personal details"
            onPress={openProfile}
            style={styles.headerEdit}
          >
            <Ionicons aria-hidden={true} name="pencil-outline" size={18} color={colors.primary} />
          </Pressable>
        </View>

        <View style={styles.identity}>
          <View style={styles.avatarWrap}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {(profile.name || "P")[0].toUpperCase()}
              </Text>
            </View>
            <View style={styles.onlineDot} />
          </View>
          <View style={styles.identityCopy}>
            <Text style={styles.name}>{profile.name || "Pocketwise student"}</Text>
            <Text style={styles.school}>
              {profile.school || "Add your university or school"}
            </Text>
            <View style={styles.localPill}>
              <Ionicons aria-hidden={true}
                name={isDemo ? "phone-portrait-outline" : "cloud-done-outline"}
                size={11}
                color={colors.primary}
              />
              <Text style={styles.localText}>
                {isDemo ? "Private local demo" : "Private cloud account"}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.snapshot}>
          <Snapshot
            icon="receipt-outline"
            label="Entries"
            value={String(transactions.length)}
            color={colors.blue}
          />
          <Snapshot
            icon="repeat-outline"
            label="Monthly"
            value={formatMoney(recurring, settings.currency, true)}
            color={colors.lavender}
          />
          <Snapshot
            icon="flag-outline"
            label="Goal savings"
            value={formatMoney(saved, settings.currency, true)}
            color={colors.primary}
          />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Money tools</Text>
          <Text style={styles.sectionHint}>Everything in one place</Text>
        </View>
        <View style={styles.toolGrid}>
          <ToolCard
            icon="grid"
            title="Student Hub"
            subtitle="Calendar, coach & splits"
            color="#7759A6"
            onPress={() => navigation.navigate("StudentHub")}
          />
          <ToolCard
            icon="calendar"
            title="Money calendar"
            subtitle="See every money date"
            color="#D28A43"
            onPress={() => navigation.navigate("MoneyCalendar")}
          />
          <ToolCard
            icon="people"
            title="Split costs"
            subtitle={`${
              splits.filter((item) => item.status !== "settled").length
            } open`}
            color="#D16F77"
            onPress={() => navigation.navigate("Splits")}
          />
          <ToolCard
            icon="pulse"
            title="Smart coach"
            subtitle="Your financial health"
            color="#3F9B82"
            onPress={() => navigation.navigate("Coach")}
          />
          <ToolCard
            icon="flag"
            title="Savings goals"
            subtitle={`${goals.length} goal${goals.length === 1 ? "" : "s"}`}
            color="#4FA982"
            onPress={() => navigation.navigate("Goals")}
          />
          <ToolCard
            icon="repeat"
            title="Subscriptions"
            subtitle={`${subscriptions.length} tracked`}
            color="#5D82D8"
            onPress={() => navigation.navigate("Subscriptions")}
          />
          <ToolCard
            icon="sparkles"
            title="Pocketwise Pro"
            subtitle="Explore features"
            color="#9A75D5"
            onPress={() => navigation.navigate("Subscription")}
          />
          <ToolCard
            icon="shield-checkmark"
            title="Privacy & data"
            subtitle="Export or manage"
            color="#D17B65"
            onPress={() => navigation.navigate("Privacy")}
          />
        </View>

        <Text style={styles.sectionTitle}>Plan preferences</Text>
        <View style={styles.card}>
          <SettingRow
            icon="wallet-outline"
            title="Monthly plan"
            subtitle={formatMoney(
              settings.monthlyBudget,
              settings.currency
            )}
            onPress={openProfile}
          />
          <View style={styles.divider} />
          <View style={styles.settingRow}>
            <View style={styles.settingIcon}>
              <Ionicons aria-hidden={true}
                name="cash-outline"
                size={19}
                color={colors.primary}
              />
            </View>
            <View style={styles.settingCopy}>
              <Text style={styles.settingTitle}>Currency</Text>
              <Text style={styles.settingSubtitle}>One account currency; locked while records exist</Text>
            </View>
            <View style={styles.currencyRow}>
              {currencies.map((currency) => (
                <Pressable
                  key={currency}
                  disabled={currency !== settings.currency && Boolean(transactions.length || bills.length || subscriptions.length || goals.length || splits.length)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: settings.currency === currency, disabled: currency !== settings.currency && Boolean(transactions.length || bills.length || subscriptions.length || goals.length || splits.length) }}
                  onPress={() => updateSettings({ currency })}
                  style={[
                    styles.currency,
                    settings.currency === currency && styles.currencyActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.currencyText,
                      settings.currency === currency &&
                        styles.currencyTextActive,
                    ]}
                  >
                    {currency}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.settingRow}>
            <View style={styles.settingIcon}>
              <Ionicons aria-hidden={true}
                name="notifications-outline"
                size={19}
                color={colors.primary}
              />
            </View>
            <View style={styles.settingCopy}>
              <Text style={styles.settingTitle}>Reminders unavailable</Text>
              <Text style={styles.settingSubtitle}>
                Notifications are not scheduled in this version
              </Text>
            </View>
            <View style={styles.switchWrap}>
              <Switch
                accessibilityLabel="Reminders unavailable"
                disabled
                value={settings.notifications}
                onValueChange={(notifications) => { void updateSettings({ notifications }); }}
                trackColor={{ false: colors.line, true: colors.primary }}
                thumbColor={colors.surface}
                style={styles.switch}
              />
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.card}>
          <SettingRow
            icon="person-outline"
            title="Personal details"
            subtitle="Name, school, and monthly plan"
            onPress={openProfile}
          />
          <View style={styles.divider} />
          <SettingRow
            icon="calendar-outline"
            title="Upcoming commitments"
            subtitle={`${bills.filter((bill) => !isBillPaidForMonth(bill)).length} bills and ${
              subscriptions.filter((item) => item.status === "active").length
            } subscriptions`}
            onPress={() => navigation.navigate("Main", { screen: "Budgets" })}
          />
          <View style={styles.divider} />
          <SettingRow
            icon="help-circle-outline"
            title="About Pocketwise"
            subtitle="Privacy, version, and project status"
            onPress={() => navigation.navigate("Privacy")}
          />
        </View>

        <Pressable accessibilityRole="button"
          disabled={isSigningOut}
          onPress={confirmLogout}
          style={[styles.logout, isSigningOut && styles.logoutDisabled]}
        >
          <View style={styles.logoutIcon}>
            <Ionicons aria-hidden={true} name="log-out-outline" size={19} color={colors.primary} />
          </View>
          <View style={styles.logoutCopy}>
            <Text style={styles.logoutTitle}>
              {isSigningOut ? "Signing out…" : "Sign out"}
            </Text>
            <Text style={styles.logoutText}>
              {isDemo
                ? "Close the demo and return to the welcome screen"
                : "Securely end this session; cloud data is retained"}
            </Text>
          </View>
          <Ionicons aria-hidden={true} name="arrow-forward" size={19} color={colors.primary} />
        </Pressable>

        <Text style={styles.footer}>
          Pocketwise · Private by default · Version 1.0.0
        </Text>
      </ScrollView>

      <Modal
        visible={showProfile}
        transparent
        animationType="slide"
        onRequestClose={() => setShowProfile(false)}
      >
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalShade}>
          <Pressable accessibilityRole="button" accessibilityLabel="Close personal details"
            style={StyleSheet.absoluteFill}
            onPress={() => setShowProfile(false)}
          />
          <View style={styles.modal}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Personal details</Text>
            <Text style={styles.modalSubtitle}>
              Keep your plan personal and realistic.
            </Text>
            <Text style={styles.inputLabel}>First name</Text>
            <TextInput accessibilityLabel="Name"
              value={name}
              onChangeText={setName}
              placeholder="Your name"
              placeholderTextColor={colors.soft}
              style={styles.input}
            />
            <Text style={styles.inputLabel}>School</Text>
            <TextInput accessibilityLabel="School"
              value={school}
              onChangeText={setSchool}
              placeholder="Optional"
              placeholderTextColor={colors.soft}
              style={styles.input}
            />
            <Text style={styles.inputLabel}>Monthly plan</Text>
            <TextInput accessibilityLabel="Monthly plan"
              value={budget}
              onChangeText={(value) =>
                setBudget(value.replace(/[^0-9.,]/g, ""))
              }
              keyboardType="decimal-pad"
              placeholderTextColor={colors.soft}
              style={styles.input}
            />
            <AppButton
              title="Save changes"
              onPress={saveProfile}
              disabled={!name.trim() || !Number(budget.replace(",", "."))}
              style={styles.save}
            />
            <AppButton title="Cancel" variant="ghost" onPress={() => setShowProfile(false)} />
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

function Snapshot({ icon, label, value, color }: { icon: IconName; label: string; value: string; color: string }) {
  return (
    <View style={styles.snapshotItem}>
      <View style={[styles.snapshotIcon, { backgroundColor: `${color}20` }]}>
        <Ionicons aria-hidden={true} name={icon} size={16} color={color} />
      </View>
      <Text numberOfLines={1} style={styles.snapshotValue}>
        {value}
      </Text>
      <Text style={styles.snapshotLabel}>{label}</Text>
    </View>
  );
}

function ToolCard({ icon, title, subtitle, color, onPress }: { icon: IconName; title: string; subtitle: string; color: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.toolCard,
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.toolIcon, { backgroundColor: `${color}20` }]}>
        <Ionicons aria-hidden={true} name={icon} size={21} color={color} />
      </View>
      <Text style={styles.toolTitle}>{title}</Text>
      <Text style={styles.toolSubtitle}>{subtitle}</Text>
      <View style={styles.toolArrow}>
        <Ionicons aria-hidden={true} name="arrow-forward" size={15} color={colors.primary} />
      </View>
    </Pressable>
  );
}

function SettingRow({ icon, title, subtitle, onPress }: { icon: IconName; title: string; subtitle: string; onPress?: () => void }) {
  return (
    <Pressable accessibilityRole="button"
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [
        styles.settingRow,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.settingIcon}>
        <Ionicons aria-hidden={true} name={icon} size={19} color={colors.primary} />
      </View>
      <View style={styles.settingCopy}>
        <Text style={styles.settingTitle}>{title}</Text>
        <Text style={styles.settingSubtitle}>{subtitle}</Text>
      </View>
      {onPress ? (
        <Ionicons aria-hidden={true} name="chevron-forward" size={20} color={colors.soft} />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas },
  content: { width: "100%", maxWidth: 1180, alignSelf: "center", paddingHorizontal: 18, paddingBottom: 110 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 13,
    paddingBottom: 16,
  },
  eyebrow: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  title: { ...type.h1, marginTop: 2, letterSpacing: -0.7 },
  headerEdit: {
    width: 42,
    height: 42,
    borderRadius: 15,
    backgroundColor: colors.mint,
    alignItems: "center",
    justifyContent: "center",
  },
  identity: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primaryDark,
    borderRadius: radius.xl,
    padding: 18,
    ...shadow,
  },
  avatarWrap: { marginRight: 14 },
  avatar: {
    width: 62,
    height: 62,
    borderRadius: 22,
    backgroundColor: colors.lime,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: colors.primaryDark,
    fontSize: 24,
    fontWeight: "900",
  },
  onlineDot: {
    position: "absolute",
    right: -2,
    bottom: -2,
    width: 17,
    height: 17,
    borderRadius: 9,
    backgroundColor: "#63C391",
    borderWidth: 3,
    borderColor: colors.primaryDark,
  },
  identityCopy: { flex: 1 },
  name: { color: colors.surface, fontSize: 19, fontWeight: "900" },
  school: { color: "#BFD0C8", fontSize: 12, marginTop: 4 },
  localPill: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: colors.mint,
    borderRadius: 99,
    paddingHorizontal: 8,
    paddingVertical: 5,
    marginTop: 9,
  },
  localText: { color: colors.primary, fontSize: 12, fontWeight: "800" },
  snapshot: { flexDirection: "row", gap: 9, marginTop: 11 },
  snapshotItem: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 11,
  },
  snapshotIcon: {
    width: 29,
    height: 29,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  snapshotValue: { color: colors.ink, fontSize: 13, fontWeight: "900" },
  snapshotLabel: { color: colors.muted, fontSize: 12, marginTop: 2 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 25,
    marginBottom: 10,
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: "900",
    marginTop: 25,
    marginBottom: 10,
  },
  sectionHint: { color: colors.muted, fontSize: 12 },
  toolGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 9,
  },
  toolCard: {
    width: "48.7%",
    minHeight: 133,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 13,
  },
  pressed: { opacity: 0.65 },
  toolIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  toolTitle: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: "900",
    marginTop: 10,
  },
  toolSubtitle: { color: colors.muted, fontSize: 12, marginTop: 3 },
  toolArrow: {
    position: "absolute",
    right: 11,
    top: 13,
    width: 27,
    height: 27,
    borderRadius: 10,
    backgroundColor: colors.mint,
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.line,
  },
  settingRow: {
    minHeight: 72,
    flexDirection: "row",
    alignItems: "center",
  },
  settingIcon: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: colors.mint,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  settingCopy: { flex: 1, paddingRight: 8, justifyContent: "center" },
  settingTitle: { color: colors.ink, fontSize: 13, fontWeight: "800" },
  settingSubtitle: { color: colors.muted, fontSize: 12, marginTop: 3 },
  divider: { height: 1, backgroundColor: colors.line, marginLeft: 48 },
  currencyRow: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "stretch",
    gap: 2,
  },
  currency: {
    minWidth: 29,
    paddingVertical: 7,
    borderRadius: 9,
    alignItems: "center",
  },
  currencyActive: { backgroundColor: colors.primary },
  currencyText: { color: colors.muted, fontSize: 12, fontWeight: "800" },
  currencyTextActive: { color: colors.surface },
  switchWrap: {
    height: 72,
    minWidth: 53,
    alignItems: "center",
    justifyContent: "center",
  },
  switch: { transform: [{ scaleX: 0.9 }, { scaleY: 0.9 }] },
  logout: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.mint,
    borderRadius: radius.lg,
    padding: 14,
    marginTop: 17,
  },
  logoutDisabled: { opacity: 0.65 },
  logoutIcon: {
    width: 41,
    height: 41,
    borderRadius: 14,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  logoutCopy: { flex: 1 },
  logoutTitle: { color: colors.primaryDark, fontSize: 13, fontWeight: "900" },
  logoutText: {
    color: colors.primaryDark,
    fontSize: 12,
    marginTop: 3,
  },
  footer: {
    color: colors.soft,
    fontSize: 12,
    textAlign: "center",
    marginTop: 23,
  },
  modalShade: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(14,29,21,0.42)",
  },
  modal: {
    backgroundColor: colors.canvas,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 21,
    paddingTop: 10,
    paddingBottom: 30,
  },
  modalHandle: {
    width: 42,
    height: 5,
    borderRadius: 9,
    backgroundColor: colors.line,
    alignSelf: "center",
    marginBottom: 18,
  },
  modalTitle: { color: colors.ink, fontSize: 20, fontWeight: "900" },
  modalSubtitle: { color: colors.muted, fontSize: 12, marginTop: 4 },
  inputLabel: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: "800",
    marginTop: 13,
    marginBottom: 7,
  },
  input: {
    minHeight: 52,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 14,
    color: colors.ink,
  },
  save: { marginTop: 20 },
});
