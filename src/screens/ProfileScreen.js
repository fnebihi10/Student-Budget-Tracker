import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Alert,
  SafeAreaView,
  ScrollView,
  Modal,
  TextInput,
} from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from "../services/firebase";
import { signOut } from "firebase/auth";
import { useTransactions } from '../data/TransactionContext'; // Import this for the "fire" budget bar

const STORAGE_KEY_LIMIT = 'USER_MONTHLY_LIMIT';

export default function ProfileScreen() {
  const user = auth.currentUser;
  const { totalExpenses, formatCurrency } = useTransactions();
  
  const [monthlyLimit, setMonthlyLimit] = useState(120);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [newLimitInput, setNewLimitInput] = useState("");

  // Calculate percentage for the budget bar
  const spentPercentage = Math.min((totalExpenses / monthlyLimit) * 100, 100);

  useEffect(() => {
    const loadLimit = async () => {
      try {
        const savedLimit = await AsyncStorage.getItem(STORAGE_KEY_LIMIT);
        if (savedLimit) setMonthlyLimit(parseFloat(savedLimit));
      } catch (e) {
        console.log("Failed to load limit:", e);
      }
    };
    loadLimit();
  }, []);

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", style: "destructive", onPress: () => signOut(auth) },
    ]);
  };

  const saveNewLimit = async () => {
    const newLimit = parseFloat(newLimitInput);
    if (isNaN(newLimit) || newLimit <= 0) {
      Alert.alert("Error", "Please enter a valid amount");
      return;
    }
    setMonthlyLimit(newLimit);
    setShowLimitModal(false);
    await AsyncStorage.setItem(STORAGE_KEY_LIMIT, newLimit.toString());
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        
        {/* Profile Header */}
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.email?.charAt(0).toUpperCase() || "U"}</Text>
          </View>
          <Text style={styles.email}>{user?.email || "user@example.com"}</Text>
        </View>

        {/* The "Fire" Monthly Limit Card */}
        <View style={styles.limitCard}>
          <Text style={styles.limitAmount}>{formatCurrency(monthlyLimit)}</Text>
          <Text style={styles.limitLabel}>Monthly Spending Limit</Text>
          
          {/* Progress Bar added here */}
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${spentPercentage}%`, backgroundColor: spentPercentage > 90 ? '#ff4444' : '#2979ff' }]} />
          </View>
          <Text style={styles.progressSubtext}>
            {spentPercentage.toFixed(0)}% of budget used
          </Text>

          <TouchableOpacity style={styles.limitButton} onPress={() => {setNewLimitInput(monthlyLimit.toString()); setShowLimitModal(true);}}>
            <Text style={styles.limitButtonText}>Adjust Budget</Text>
          </TouchableOpacity>
        </View>

        {/* Settings Section - Cleaned up */}
        <Text style={styles.sectionTitle}>Preferences</Text>
        <View style={styles.settingsList}>
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Theme</Text>
            <Text style={styles.settingValue}>Light</Text>
          </View>
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Language</Text>
            <Text style={styles.settingValue}>English</Text>
          </View>
        </View>

        {/* Support Section - Kept your exact Alert logic */}
        <Text style={styles.sectionTitle}>Support</Text>
        <View style={styles.supportList}>
          <TouchableOpacity style={styles.supportItem} onPress={() => Alert.alert("Help Center", "Opening help articles...")}>
            <Text style={styles.supportText}>Help Center</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.supportItem} onPress={() => Alert.alert("Terms & Privacy", "Showing terms and privacy policy...")}>
            <Text style={styles.supportText}>Terms & Privacy</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.supportItem} onPress={() => Alert.alert("Rate App", "Thank you for the rating!")}>
            <Text style={styles.supportText}>Rate App</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>

        <View style={{height: 40}} />
      </ScrollView>

      {/* Edit Limit Modal */}
      <Modal visible={showLimitModal} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Set Monthly Limit</Text>
            <TextInput
              style={styles.modalInput}
              keyboardType="decimal-pad"
              value={newLimitInput}
              onChangeText={setNewLimitInput}
              autoFocus={true}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setShowLimitModal(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.saveButton]} onPress={saveNewLimit}>
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, padding: 20 },
  header: { alignItems: 'center', marginBottom: 30, marginTop: 10 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#2979ff', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  avatarText: { color: '#fff', fontSize: 32, fontWeight: 'bold' },
  email: { fontSize: 18, color: '#2c3e50', fontWeight: '500' },
  
  // Limit Card Styles
  limitCard: { backgroundColor: '#f8f9fa', padding: 24, borderRadius: 20, alignItems: 'center', marginBottom: 25, borderWidth: 1, borderColor: '#eee' },
  limitAmount: { fontSize: 36, fontWeight: 'bold', color: '#2c3e50', marginBottom: 4 },
  limitLabel: { fontSize: 14, color: '#666', marginBottom: 15 },
  progressBarBg: { width: '100%', height: 8, backgroundColor: '#e9ecef', borderRadius: 4, overflow: 'hidden', marginBottom: 8 },
  progressBarFill: { height: '100%', borderRadius: 4 },
  progressSubtext: { fontSize: 12, color: '#999', marginBottom: 15 },
  limitButton: { backgroundColor: '#e3f2fd', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
  limitButtonText: { color: '#2979ff', fontWeight: '600' },

  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#abb2b9', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 },
  settingsList: { backgroundColor: '#f8f9fa', borderRadius: 12, paddingHorizontal: 16, marginBottom: 25 },
  settingItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#eee' },
  settingLabel: { fontSize: 16, color: '#2c3e50' },
  settingValue: { fontSize: 16, color: '#999' },

  supportList: { backgroundColor: '#f8f9fa', borderRadius: 12, paddingHorizontal: 16, marginBottom: 25 },
  supportItem: { paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#eee' },
  supportText: { fontSize: 16, color: '#2c3e50' },

  logoutButton: { backgroundColor: '#fff', padding: 18, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#ff4444' },
  logoutButtonText: { color: '#ff4444', fontSize: 16, fontWeight: 'bold' },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: 'white', borderRadius: 20, padding: 25 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  modalInput: { borderWidth: 1, borderColor: '#ddd', borderRadius: 12, padding: 15, fontSize: 24, textAlign: 'center', marginBottom: 20, backgroundColor: '#f9f9f9' },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between' },
  modalButton: { flex: 1, padding: 16, borderRadius: 12, alignItems: 'center', marginHorizontal: 5 },
  cancelButton: { backgroundColor: '#f2f2f2' },
  saveButton: { backgroundColor: '#2979ff' },
  saveButtonText: { color: '#fff', fontWeight: 'bold' },
});


