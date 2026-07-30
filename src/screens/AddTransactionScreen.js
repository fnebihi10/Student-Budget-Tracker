import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert,
  SafeAreaView,
  ScrollView,
} from "react-native";
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTransactions } from '../data/TransactionContext';

export default function AddTransactionScreen() {
  const navigation = useNavigation();
  const route = useRoute(); // <--- Need this to get params
  const { addTransaction, updateTransaction, formatCurrency } = useTransactions();
  
  // Check if we are editing
  const transactionToEdit = route.params?.transactionToEdit;
  const isEditing = !!transactionToEdit;

  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [frequency, setFrequency] = useState("one-time");
  const [type, setType] = useState("expense");

  // Load data if editing
  useEffect(() => {
    if (transactionToEdit) {
      setTitle(transactionToEdit.title);
      setAmount(transactionToEdit.amount.toString());
      setFrequency(transactionToEdit.frequency);
      setType(transactionToEdit.type);
    }
  }, [transactionToEdit]);

  const handleSubmit = () => {
    if (!title.trim()) {
      Alert.alert("Error", "Please enter transaction name");
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      Alert.alert("Error", "Please enter a valid amount");
      return;
    }

    const transactionData = {
      title: title.trim(),
      amount: numAmount,
      frequency,
      type,
    };

    if (isEditing) {
      // --- UPDATE LOGIC ---
      updateTransaction(transactionToEdit.id, transactionData);
      Alert.alert("Success", "Transaction updated!");
      navigation.goBack();
    } else {
      // --- ADD LOGIC ---
      const newTransaction = addTransaction(transactionData);
      Alert.alert(
        "Success", 
        `Added ${type}: "${newTransaction.title}" (${formatCurrency(newTransaction.amount)})`,
        [
          { 
            text: "OK", 
            onPress: () => {
              setTitle("");
              setAmount("");
              setFrequency("one-time");
              setType("expense");
              navigation.goBack();
            }
          }
        ]
      );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        <Text style={styles.header}>
            {isEditing ? "Edit Transaction" : "Add Transaction"}
        </Text>

        {/* Type Selector */}
        <View style={styles.typeSelector}>
          <TouchableOpacity
            style={[
              styles.typeButton,
              type === 'expense' && styles.expenseActive
            ]}
            onPress={() => setType('expense')}
          >
            <Text style={[
              styles.typeButtonText,
              type === 'expense' && styles.typeButtonTextActive
            ]}>Expense</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.typeButton,
              type === 'income' && styles.incomeActive
            ]}
            onPress={() => setType('income')}
          >
            <Text style={[
              styles.typeButtonText,
              type === 'income' && styles.typeButtonTextActive
            ]}>Income</Text>
          </TouchableOpacity>
        </View>

        {/* Form */}
        <TextInput
          style={styles.input}
          placeholder="Transaction Name"
          placeholderTextColor="#999"
          value={title}
          onChangeText={setTitle}
        />

        <TextInput
          style={styles.input}
          placeholder="Amount (€)"
          placeholderTextColor="#999"
          keyboardType="decimal-pad"
          value={amount}
          onChangeText={setAmount}
        />

        {/* Frequency Selector */}
        <Text style={styles.label}>Frequency:</Text>
        <View style={styles.frequencySelector}>
          {['one-time', 'weekly', 'monthly'].map((freq) => (
            <TouchableOpacity
              key={freq}
              style={[
                styles.frequencyButton,
                frequency === freq && styles.frequencyActive
              ]}
              onPress={() => setFrequency(freq)}
            >
              <Text style={[
                styles.frequencyText,
                frequency === freq && styles.frequencyTextActive
              ]}>
                {freq.charAt(0).toUpperCase() + freq.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Action Buttons */}
        <TouchableOpacity style={styles.addButton} onPress={handleSubmit}>
          <Text style={styles.addButtonText}>
              {isEditing ? "Update Transaction" : "Add Transaction"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.cancelButton} 
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, padding: 20 },
  header: { fontSize: 28, fontWeight: 'bold', color: '#2c3e50', marginBottom: 30, textAlign: 'center' },
  typeSelector: { flexDirection: 'row', marginBottom: 20, backgroundColor: '#f8f9fa', borderRadius: 10, padding: 4 },
  typeButton: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 8 },
  expenseActive: { backgroundColor: '#ffebee' },
  incomeActive: { backgroundColor: '#e8f5e9' },
  typeButtonText: { color: '#666', fontWeight: '500' },
  typeButtonTextActive: { color: '#2c3e50', fontWeight: '600' },
  input: { backgroundColor: '#f8f9fa', borderWidth: 1, borderColor: '#e9ecef', borderRadius: 10, padding: 16, marginBottom: 20, fontSize: 16, color: '#2c3e50' },
  label: { fontSize: 14, color: '#666', marginBottom: 10 },
  frequencySelector: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
  frequencyButton: { flex: 1, paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: '#e9ecef', marginHorizontal: 5, borderRadius: 8 },
  frequencyActive: { backgroundColor: '#2979ff', borderColor: '#2979ff' },
  frequencyText: { color: '#666', fontWeight: '500' },
  frequencyTextActive: { color: '#fff', fontWeight: '600' },
  addButton: { backgroundColor: '#2979ff', padding: 18, borderRadius: 10, alignItems: 'center', marginBottom: 15 },
  addButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  cancelButton: { padding: 18, alignItems: 'center' },
  cancelButtonText: { color: '#666', fontSize: 16 },
});
