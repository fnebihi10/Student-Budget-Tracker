import { Ionicons } from "@expo/vector-icons";
import React, { useContext, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  Share,
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
import { colors, radius } from "../design";

export default function PrivacyScreen({ navigation }) {
  const budget = useContext(BudgetContext);
  const { subscriptions, resetSubscriptions } = useContext(SubscriptionsContext);
  const { goals, resetGoals } = useContext(GoalsContext);
  const { splits, resetSplits } = useContext(SplitsContext);
  const [exporting, setExporting] = useState(false);

  const exportData = async () => {
    setExporting(true);
    try {
      const payload = {
        exportedAt: new Date().toISOString(),
        app: "Pocketwise",
        profile: budget.profile,
        settings: budget.settings,
        categoryBudgets: budget.categoryBudgets,
        transactions: budget.transactions,
        bills: budget.bills,
        subscriptions,
        goals,
        splits,
      };
      await Share.share({
        title: "Pocketwise data export",
        message: JSON.stringify(payload, null, 2),
      });
    } catch {
      Alert.alert(
        "Export unavailable",
        "Your device could not open the share sheet. No data was changed."
      );
    } finally {
      setExporting(false);
    }
  };

  const confirmErase = () =>
    Alert.alert(
      "Permanently erase everything?",
      "This removes your profile, transactions, budgets, bills, subscriptions, savings goals, and shared expenses from this device. It cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Erase everything",
          style: "destructive",
          onPress: () => {
            resetSubscriptions();
            resetGoals();
            resetSplits();
            budget.resetData();
          },
        },
      ]
    );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.back}>
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
            Pocketwise currently stores your information locally on this
            device. There is no cloud account, advertising profile, or analytics
            service connected.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Stored on this device</Text>
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
            title="Local-first storage"
            text="Data is saved with device storage and remains available offline."
          />
          <View style={styles.divider} />
          <InfoRow
            icon="cloud-offline-outline"
            title="No cloud sync yet"
            text="Deleting the app can also remove its data unless you export a copy first."
          />
          <View style={styles.divider} />
          <InfoRow
            icon="eye-off-outline"
            title="No tracking"
            text="This version does not send analytics, financial entries, or advertising identifiers."
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
            title="Export"
            variant="secondary"
            onPress={exportData}
            loading={exporting}
            style={styles.exportButton}
          />
        </View>

        <Text style={styles.sectionTitle}>Danger zone</Text>
        <View style={styles.danger}>
          <View style={styles.dangerTop}>
            <View style={styles.dangerIcon}>
              <Ionicons name="trash-outline" size={21} color={colors.red} />
            </View>
            <View style={styles.dangerCopy}>
              <Text style={styles.dangerTitle}>Erase all local data</Text>
              <Text style={styles.dangerText}>
                Permanently return Pocketwise to a clean first launch.
              </Text>
            </View>
          </View>
          <Pressable onPress={confirmErase} style={styles.eraseButton}>
            <Text style={styles.eraseText}>Erase everything</Text>
          </Pressable>
        </View>

        <Text style={styles.footer}>
          Pocketwise 1.0.0 · Local-first preview · No cloud account connected
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
  content: { paddingHorizontal: 18, paddingBottom: 35 },
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
  eraseText: { color: colors.red, fontSize: 12, fontWeight: "900" },
  footer: {
    color: colors.soft,
    fontSize: 9,
    textAlign: "center",
    marginTop: 23,
  },
});
