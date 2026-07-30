// src/screens/SavingsScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  ScrollView,
  Modal,
} from 'react-native';
import { useTransactions } from '../data/TransactionContext';

export default function SavingsScreen() {
  const { 
    savingsGoals, 
    addSavingsGoal, 
    depositToGoal, 
    formatCurrency,
    totalBalance 
  } = useTransactions();

  const [showAddModal, setShowAddModal] = useState(false);
  const [newGoalName, setNewGoalName] = useState('');
  const [newGoalTarget, setNewGoalTarget] = useState('');
  const [depositModalVisible, setDepositModalVisible] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState(null);
  const [depositAmount, setDepositAmount] = useState('');

  const handleAddGoal = () => {
    if (!newGoalName.trim()) {
      Alert.alert('Error', 'Please enter goal name');
      return;
    }

    const target = parseFloat(newGoalTarget);
    if (isNaN(target) || target <= 0) {
      Alert.alert('Error', 'Please enter valid target amount');
      return;
    }

    addSavingsGoal({
      name: newGoalName.trim(),
      targetAmount: target,
      currentAmount: 0,
    });

    setNewGoalName('');
    setNewGoalTarget('');
    setShowAddModal(false);
    Alert.alert('Success', 'Savings goal created!');
  };

  const handleDeposit = () => {
    if (!selectedGoalId || !depositAmount) {
      Alert.alert('Error', 'Please enter deposit amount');
      return;
    }

    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Error', 'Please enter valid amount');
      return;
    }

    if (amount > totalBalance) {
      Alert.alert('Error', 'Insufficient balance');
      return;
    }

    depositToGoal(selectedGoalId, amount);
    setDepositAmount('');
    setDepositModalVisible(false);
    Alert.alert('Success', `Deposited ${formatCurrency(amount)}`);
  };

  const openDepositModal = (goalId) => {
    setSelectedGoalId(goalId);
    setDepositModalVisible(true);
  };

  const calculateProgress = (current, target) => {
    return Math.min((current / target) * 100, 100);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Savings Goals</Text>
          <Text style={styles.subtitle}>Track your financial targets</Text>
        </View>

        {/* Available Balance */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Available Balance</Text>
          <Text style={styles.balanceAmount}>{formatCurrency(totalBalance)}</Text>
        </View>

        {/* Add Goal Button */}
        <TouchableOpacity 
          style={styles.addGoalButton}
          onPress={() => setShowAddModal(true)}
        >
          <Text style={styles.addGoalButtonText}>+ Create New Goal</Text>
        </TouchableOpacity>

        {/* Goals List */}
        {savingsGoals.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No savings goals yet</Text>
            <Text style={styles.emptySubtext}>Create your first goal to start saving!</Text>
          </View>
        ) : (
          savingsGoals.map((goal) => {
            const progress = calculateProgress(goal.currentAmount, goal.targetAmount);
            return (
              <View key={goal.id} style={styles.goalCard}>
                <View style={styles.goalHeader}>
                  <Text style={styles.goalName}>{goal.name}</Text>
                  <Text style={styles.goalAmount}>
                    {formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}
                  </Text>
                </View>
                
                {/* Progress Bar */}
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { width: `${progress}%` }
                    ]} 
                  />
                </View>
                
                <Text style={styles.progressText}>
                  {progress.toFixed(1)}% complete
                </Text>
                
                <View style={styles.goalActions}>
                  <TouchableOpacity 
                    style={styles.depositButton}
                    onPress={() => openDepositModal(goal.id)}
                  >
                    <Text style={styles.depositButtonText}>Add Money</Text>
                  </TouchableOpacity>
                  
                  <Text style={styles.remainingText}>
                    {formatCurrency(goal.targetAmount - goal.currentAmount)} left
                  </Text>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Add Goal Modal */}
      <Modal
        visible={showAddModal}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create New Goal</Text>
            
            <TextInput
              style={styles.modalInput}
              placeholder="Goal Name (e.g., New Laptop)"
              value={newGoalName}
              onChangeText={setNewGoalName}
            />
            
            <TextInput
              style={styles.modalInput}
              placeholder="Target Amount (€)"
              keyboardType="decimal-pad"
              value={newGoalTarget}
              onChangeText={setNewGoalTarget}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowAddModal(false);
                  setNewGoalName('');
                  setNewGoalTarget('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleAddGoal}
              >
                <Text style={styles.saveButtonText}>Create Goal</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Deposit Modal */}
      <Modal
        visible={depositModalVisible}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Money to Goal</Text>
            
            <TextInput
              style={styles.modalInput}
              placeholder="Amount to deposit (€)"
              keyboardType="decimal-pad"
              value={depositAmount}
              onChangeText={setDepositAmount}
              autoFocus={true}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setDepositModalVisible(false);
                  setDepositAmount('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleDeposit}
              >
                <Text style={styles.saveButtonText}>Deposit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  balanceCard: {
    backgroundColor: '#f8f9fa',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  balanceLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  addGoalButton: {
    backgroundColor: '#2979ff',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 25,
  },
  addGoalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  goalCard: {
    backgroundColor: '#f8f9fa',
    padding: 20,
    borderRadius: 16,
    marginBottom: 15,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  goalName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
  },
  goalAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2979ff',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e9ecef',
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4caf50',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  goalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  depositButton: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  depositButtonText: {
    color: '#2979ff',
    fontWeight: '600',
  },
  remainingText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 10,
    padding: 16,
    fontSize: 16,
    marginBottom: 15,
    backgroundColor: '#f8f9fa',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  saveButton: {
    backgroundColor: '#2979ff',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '600',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});