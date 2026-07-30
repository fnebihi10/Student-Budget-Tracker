import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTransactions } from '../data/TransactionContext';

export default function DashboardScreen() {
  const navigation = useNavigation();
  const {
    transactions,
    formatCurrency,
    totalBalance,
    totalIncome,
    totalExpenses,
    deleteTransaction,
  } = useTransactions();

  const handleDelete = (id, title) => {
    Alert.alert(
      'Delete Transaction',
      `Are you sure you want to delete "${title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteTransaction(id),
        },
      ]
    );
  };

  const handleEdit = (item) => {
    // Navigate to AddTransactionScreen but pass the item to edit
    navigation.navigate('AddTransaction', { transactionToEdit: item });
  };

  const renderItem = ({ item }) => (
    <View style={styles.transactionItem}>
      {/* LEFT */}
      <View style={styles.transactionLeft}>
        <Text style={styles.transactionTitle}>{item.title}</Text>

        <View style={styles.transactionMeta}>
          <View style={styles.frequencyPill}>
            <Text style={styles.frequencyText}>
              {item.frequency || 'one-time'}
            </Text>
          </View>
          <Text style={styles.dateText}>
            {item.date || ''}
          </Text>
        </View>
      </View>

      {/* RIGHT */}
      <View style={styles.transactionRight}>
        <Text
          style={[
            styles.transactionAmount,
            item.type === 'income'
              ? styles.incomeAmount
              : styles.expenseAmount,
          ]}
        >
          {item.type === 'income' ? '+' : '-'}
          {formatCurrency(item.amount)}
        </Text>

        {/* EDIT BUTTON (NEW) */}
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => handleEdit(item)}
        >
          <Text style={styles.editButtonText}>✎</Text>
        </TouchableOpacity>

        {/* DELETE BUTTON */}
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDelete(item.id, item.title)}
        >
          <Text style={styles.deleteButtonText}>✕</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.container}>
            {/* HEADER */}
            <Text style={styles.headerTitle}>UniSpend Dashboard</Text>

            {/* BALANCE CARD */}
            <View style={styles.balanceCard}>
              <Text style={styles.balanceLabel}>Total Balance</Text>
              <Text style={styles.balanceAmount}>
                {formatCurrency(totalBalance)}
              </Text>

              <View style={styles.statsRow}>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Income</Text>
                  <Text style={[styles.statValue, styles.incomeAmount]}>
                    +{formatCurrency(totalIncome)}
                  </Text>
                </View>

                <View style={styles.statDivider} />

                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Expenses</Text>
                  <Text style={[styles.statValue, styles.expenseAmount]}>
                    -{formatCurrency(totalExpenses)}
                  </Text>
                </View>
              </View>
            </View>

            {/* SECTION HEADER */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Transactions</Text>
              <TouchableOpacity
                style={styles.addButton}
                // Ensure we pass undefined or empty params to clear previous edit state
                onPress={() => navigation.navigate('AddTransaction', { transactionToEdit: null })}
              >
                <Text style={styles.addButtonText}>+ Add</Text>
              </TouchableOpacity>
            </View>

            {transactions.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No transactions yet</Text>
              </View>
            )}
          </View>
        }
        contentContainerStyle={{ paddingBottom: 30 }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  container: { padding: 20 },
  headerTitle: { fontSize: 26, fontWeight: '700', color: '#2c3e50', textAlign: 'center', marginBottom: 20 },
  balanceCard: { backgroundColor: '#f8f9fa', padding: 24, borderRadius: 18, alignItems: 'center', marginBottom: 25 },
  balanceLabel: { fontSize: 14, color: '#777', marginBottom: 6 },
  balanceAmount: { fontSize: 36, fontWeight: '700', color: '#2c3e50', marginBottom: 18 },
  statsRow: { flexDirection: 'row', width: '100%' },
  statBox: { flex: 1, alignItems: 'center' },
  statLabel: { fontSize: 12, color: '#888', marginBottom: 4 },
  statValue: { fontSize: 18, fontWeight: '600' },
  statDivider: { width: 1, backgroundColor: '#ddd', marginHorizontal: 10 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#2c3e50' },
  addButton: { backgroundColor: '#2979ff', paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20 },
  addButtonText: { color: '#fff', fontWeight: '600' },
  
  transactionItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 18, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#f1f3f5' },
  transactionLeft: { flex: 1 },
  transactionTitle: { fontSize: 16, fontWeight: '600', color: '#2c3e50', marginBottom: 6 },
  transactionMeta: { flexDirection: 'row', alignItems: 'center' },
  frequencyPill: { backgroundColor: '#f1f3f5', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginRight: 10 },
  frequencyText: { fontSize: 12, color: '#555' },
  dateText: { fontSize: 12, color: '#999' },
  
  transactionRight: { flexDirection: 'row', alignItems: 'center' },
  transactionAmount: { fontSize: 16, fontWeight: '600', marginRight: 12 },
  incomeAmount: { color: '#2ecc71' },
  expenseAmount: { color: '#e74c3c' },
  
  // EDIT BUTTON STYLES
  editButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#e3f2fd', // Light blue background
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8, // Space between Edit and Delete
  },
  editButtonText: {
    color: '#2979ff', // Blue text
    fontSize: 16,
    fontWeight: '700',
  },

  deleteButton: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#fdecea', alignItems: 'center', justifyContent: 'center' },
  deleteButtonText: { color: '#e74c3c', fontSize: 16, fontWeight: '700' },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { color: '#777' },
});









