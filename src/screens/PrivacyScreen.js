import { Ionicons } from "@expo/vector-icons";
import React, { useContext, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AppButton from "../components/AppButton";
import { BudgetContext } from "../context/BudgetContext";
import { GoalsContext } from "../context/GoalsContext";
import { SplitsContext } from "../context/SplitsContext";
import { SubscriptionsContext } from "../context/SubscriptionsContext";
import { AuthContext } from "../context/AuthContext";
import { colors, radius } from "../design";
import { confirmAction, showMessage } from "../utils/dialogs";
import { jsonExport, csvExport } from '../domain/exports';
import { shareExportFile } from '../services/exportFile';

export default function PrivacyScreen({ navigation }) {
  const { user, isDemo, deleteAccount } = useContext(AuthContext);
  const budget = useContext(BudgetContext);
  const { subscriptions, resetSubscriptions, syncStatus: subscriptionStatus } = useContext(SubscriptionsContext);
  const { goals, resetGoals, syncStatus: goalStatus } = useContext(GoalsContext);
  const { splits, resetSplits, syncStatus: splitStatus } = useContext(SplitsContext);
  const canExport = [budget.syncStatus, subscriptionStatus, goalStatus, splitStatus].every((status) => status === 'synced');
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const exportData = async (format = 'json') => {
    if (!canExport) return;
    setExporting(true);
    try {
      const payload = {
        profile: budget.profile,
        settings: budget.settings,
        categoryBudgets: budget.categoryBudgets,
        periodBudgets: budget.periodBudgets,
        transactions: budget.transactions,
        bills: budget.bills,
        subscriptions,
        goals,
        splits,
      };
      await shareExportFile(format === 'json' ? jsonExport(payload) : csvExport(payload), format);
    } catch {
      showMessage(
        "Export unavailable",
        "Your device could not open the share sheet. No data was changed."
      );
    } finally {
      setExporting(false);
    }
  };

  const confirmErase = () =>
    confirmAction({
      title: "Permanently erase everything?",
      message:
        "This removes your profile, transactions, budgets, bills, subscriptions, savings goals, and shared expenses from this device. It cannot be undone.",
      confirmLabel: "Erase everything",
      onConfirm: () => {
        resetSubscriptions();
        resetGoals();
        resetSplits();
        budget.resetData();
      },
    });

  const performAccountDeletion = async () => {
    setDeleting(true);
    const { error } = await deleteAccount();
    setDeleting(false);
    if (error) {
      showMessage(
        "Account not deleted",
        "We could not complete the deletion. Check your connection and try again."
      );
    }
  };

  const confirmAccountDeletion = () => {
    const message =
      "Your account and every synced transaction, bill, subscription, goal, and shared expense will be permanently deleted. This cannot be undone.";
    confirmAction({
      title: "Delete your Pocketwise account?",
      message,
      confirmLabel: "Delete account",
      onConfirm: () => void performAccountDeletion(),
    });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => navigation.goBack()} style={styles.back}>
          <Ionicons name="arrow-back" size={22} color={colors.ink} />
        </Pressable>
        <Text style={styles.headerTitle}>Privacy & data</Text>
        <View style={styles.back} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Ionicons
              name="shield-checkmark"
              size={29}
              color={colors.primaryDark}
            />
          </View>
          <Text style={styles.heroTitle}>Your money story stays yours.</Text>
          <Text style={styles.heroText}>
            {isDemo
              ? "Demo information stays on this device and is never uploaded."
              : "Your records sync to Supabase over encrypted connections and are cached separately for each account. Cloud editing requires a connection and confirmed save. Offline editing is unavailable."}
          </Text>
        </View>

        <Text style={styles.sectionTitle}>
          {isDemo ? "Stored on this device" : "Your synced records"}
        </Text>
        <View style={styles.stats}>
          <DataStat
            icon="receipt-outline"
            value={budget.transactions.length}
            label="Transactions"
            color={colors.blue}
          />
          <DataStat
            icon="repeat-outline"
            value={subscriptions.length}
            label="Subscriptions"
            color={colors.lavender}
          />
          <DataStat
            icon="flag-outline"
            value={goals.length}
            label="Goals"
            color={colors.primary}
          />
          <DataStat
            icon="calendar-outline"
            value={budget.bills.length}
            label="Bills"
            color={colors.amber}
          />
          <DataStat
            icon="people-outline"
            value={splits.length}
            label="Shared costs"
            color="#D16F77"
          />
        </View>

        <Text style={styles.sectionTitle}>Your controls</Text>
        <View style={styles.card}>
          <InfoRow
            icon="phone-portrait-outline"
            title={isDemo ? "Local demo storage" : "Device cache and private cloud"}
            text={
              isDemo
                ? "Demo data is saved only on this device."
                : `Signed in as ${user?.email || "your account"}; app records are cached on this device and protected per user in the cloud.`
            }
          />
          <View style={styles.divider} />
          <InfoRow
            icon="cloud-offline-outline"
            title={isDemo ? "No demo upload" : "Supabase synchronization"}
            text={
              isDemo
                ? "Creating an account starts with a clean private workspace."
                : "Changes sync to your authenticated Supabase account."
            }
          />
          <View style={styles.divider} />
          <InfoRow
            icon="eye-off-outline"
            title="No tracking"
            text="No analytics or advertising identifiers are sent. Signed-in financial records are sent to Supabase to save and synchronize your account."
          />
        </View>

        <View style={styles.exportCard}>
          <View style={styles.exportIcon}>
            <Ionicons
              name="download-outline"
              size={22}
              color={colors.primary}
            />
          </View>
          <View style={styles.exportCopy}>
            <Text style={styles.exportTitle}>Portable data export</Text>
            <Text style={styles.exportText}>
              Share a readable JSON backup containing your current Pocketwise
              data.
            </Text>
          </View>
          <AppButton
            title="Export JSON"
            variant="secondary"
            onPress={() => exportData('json')}
            loading={exporting}
            disabled={!canExport}
            style={styles.exportButton}
          />
        </View>

        <AppButton title="Export transactions CSV" variant="secondary" loading={exporting} disabled={!canExport} onPress={() => exportData('csv')} />
        {!canExport ? <Text accessibilityRole="alert" style={styles.exportText}>Load every finance section successfully before exporting a complete backup.</Text> : null}
        <Text style={styles.exportText}>JSON includes all records and histories. CSV contains actual transactions only. Import is unavailable until validation, preview, duplicate handling and atomic commit are implemented.</Text>

        <Text style={styles.sectionTitle}>Danger zone</Text>
        <View style={styles.danger}>
          <View style={styles.dangerTop}>
            <View style={styles.dangerIcon}>
              <Ionicons name="trash-outline" size={21} color={colors.red} />
            </View>
            <View style={styles.dangerCopy}>
              <Text style={styles.dangerTitle}>
                {isDemo ? "Erase all demo data" : "Delete account data"}
              </Text>
              <Text style={styles.dangerText}>
                {isDemo
                  ? "Permanently return the local demo to a clean first launch."
                  : "Permanently remove your account and all synced records."}
              </Text>
            </View>
          </View>
          <Pressable accessibilityRole="button"
            disabled={deleting}
            onPress={isDemo ? confirmErase : confirmAccountDeletion}
            style={[styles.eraseButton, deleting && styles.eraseButtonDisabled]}
          >
            <Text style={styles.eraseText}>
              {deleting ? "Deleting…" : isDemo ? "Erase demo data" : "Delete my account"}
            </Text>
          </Pressable>
        </View>

        <Text style={styles.footer}>
          Pocketwise 1.0.0 · {isDemo ? "Local demo" : "Supabase protected"}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function DataStat({ icon, value, label, color }) {
  return (
    <View style={styles.stat}>
      <View style={[styles.statIcon, { backgroundColor: `${color}20` }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function InfoRow({ icon, title, text }) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}>
        <Ionicons name={icon} size={19} color={colors.primary} />
      </View>
      <View style={styles.infoCopy}>
        <Text style={styles.infoTitle}>{title}</Text>
        <Text style={styles.infoText}>{text}</Text>
      </View>
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
  content: { width: "100%", maxWidth: 960, alignSelf: "center", paddingHorizontal: 18, paddingBottom: 35 },
  hero: {
    backgroundColor: colors.primaryDark,
    borderRadius: radius.xl,
    padding: 21,
    alignItems: "center",
  },
  heroIcon: {
    width: 58,
    height: 58,
    borderRadius: 20,
    backgroundColor: colors.lime,
    alignItems: "center",
    justifyContent: "center",
  },
  heroTitle: {
    color: colors.surface,
    fontSize: 20,
    fontWeight: "900",
    textAlign: "center",
    marginTop: 15,
  },
  heroText: {
    color: "#C3D3CB",
    fontSize: 11,
    lineHeight: 17,
    textAlign: "center",
    marginTop: 7,
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: "900",
    marginTop: 24,
    marginBottom: 10,
  },
  stats: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 9,
  },
  stat: {
    width: "48.7%",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 13,
  },
  statIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 9,
  },
  statValue: { color: colors.ink, fontSize: 19, fontWeight: "900" },
  statLabel: { color: colors.muted, fontSize: 9, marginTop: 2 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 14,
  },
  infoRow: { flexDirection: "row", paddingVertical: 14 },
  infoIcon: {
    width: 39,
    height: 39,
    borderRadius: 14,
    backgroundColor: colors.mint,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  infoCopy: { flex: 1 },
  infoTitle: { color: colors.ink, fontSize: 12, fontWeight: "900" },
  infoText: {
    color: colors.muted,
    fontSize: 9,
    lineHeight: 14,
    marginTop: 3,
  },
  divider: { height: 1, backgroundColor: colors.line, marginLeft: 49 },
  exportCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.mint,
    borderRadius: radius.lg,
    padding: 14,
    marginTop: 13,
  },
  exportIcon: {
    width: 43,
    height: 43,
    borderRadius: 15,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  exportCopy: { flex: 1, paddingRight: 8 },
  exportTitle: {
    color: colors.primaryDark,
    fontSize: 12,
    fontWeight: "900",
  },
  exportText: {
    color: colors.primaryDark,
    fontSize: 9,
    lineHeight: 13,
    marginTop: 3,
  },
  exportButton: {
    minHeight: 39,
    paddingHorizontal: 12,
    borderRadius: 13,
  },
  danger: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: "#F0C9C5",
    backgroundColor: "#FFF8F7",
    padding: 14,
  },
  dangerTop: { flexDirection: "row", alignItems: "center" },
  dangerIcon: {
    width: 42,
    height: 42,
    borderRadius: 15,
    backgroundColor: "#FCE8E5",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  dangerCopy: { flex: 1 },
  dangerTitle: { color: colors.red, fontSize: 12, fontWeight: "900" },
  dangerText: { color: colors.muted, fontSize: 9, marginTop: 3 },
  eraseButton: {
    minHeight: 43,
    borderRadius: 14,
    backgroundColor: "#FCE8E5",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 13,
  },
  eraseButtonDisabled: { opacity: 0.5 },
  eraseText: { color: colors.red, fontSize: 12, fontWeight: "900" },
  footer: {
    color: colors.soft,
    fontSize: 9,
    textAlign: "center",
    marginTop: 23,
  },
});
