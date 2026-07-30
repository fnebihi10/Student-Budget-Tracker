import { Ionicons } from "@expo/vector-icons";
import React, { useContext, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AppButton from "../components/AppButton";
import CategoryPicker from "../components/CategoryPicker";
import { BudgetContext } from "../context/BudgetContext";
import { expenseCategories } from "../data/categories";
import { colors, radius } from "../design";

export default function AddBillScreen({ navigation }) {
  const { saveBill } = useContext(BudgetContext);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDay, setDueDay] = useState("");
  const [category, setCategory] = useState("housing");
  const validDay = Number(dueDay) >= 1 && Number(dueDay) <= 31;

  const save = () => {
    saveBill({ title: title.trim(), amount: Number(amount.replace(",", ".")), dueDay: Number(dueDay), category });
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.flex}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.back}>
            <Ionicons name="arrow-back" size={22} color={colors.ink} />
          </Pressable>
          <Text style={styles.title}>Add monthly bill</Text>
          <View style={styles.back} />
        </View>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.art}>
            <Ionicons name="calendar-outline" size={28} color={colors.primary} />
          </View>
          <Text style={styles.heading}>Never let a bill surprise you.</Text>
          <Text style={styles.intro}>Add regular payments so your safe-to-spend number stays realistic.</Text>

          <Text style={styles.label}>Bill name</Text>
          <TextInput value={title} onChangeText={setTitle} placeholder="e.g. Phone plan" placeholderTextColor={colors.soft} style={styles.input} />
          <Text style={styles.label}>Monthly amount</Text>
          <TextInput value={amount} onChangeText={(value) => setAmount(value.replace(/[^0-9.,]/g, ""))} keyboardType="decimal-pad" placeholder="0.00" placeholderTextColor={colors.soft} style={styles.input} />
          <Text style={styles.label}>Due day (1–31)</Text>
          <TextInput value={dueDay} onChangeText={(value) => setDueDay(value.replace(/[^0-9]/g, ""))} keyboardType="number-pad" maxLength={2} placeholder="e.g. 15" placeholderTextColor={colors.soft} style={styles.input} />
          <Text style={styles.label}>Category</Text>
          <CategoryPicker categories={expenseCategories} value={category} onChange={setCategory} />
          <AppButton title="Save monthly bill" icon="checkmark" onPress={save} disabled={!title.trim() || !Number(amount.replace(",", ".")) || !validDay} style={styles.button} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safe: { flex: 1, backgroundColor: colors.canvas },
  header: { height: 60, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 18 },
  back: { width: 40, height: 40, borderRadius: 14, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" },
  title: { color: colors.ink, fontSize: 16, fontWeight: "900" },
  content: { paddingHorizontal: 20, paddingBottom: 35 },
  art: { width: 58, height: 58, borderRadius: 20, backgroundColor: colors.mint, alignItems: "center", justifyContent: "center", marginTop: 18 },
  heading: { color: colors.ink, fontSize: 25, fontWeight: "900", letterSpacing: -0.8, marginTop: 17 },
  intro: { color: colors.muted, fontSize: 14, lineHeight: 21, marginTop: 7, marginBottom: 18 },
  label: { color: colors.ink, fontSize: 13, fontWeight: "800", marginTop: 16, marginBottom: 8 },
  input: { minHeight: 55, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 15, color: colors.ink, fontSize: 14 },
  button: { marginTop: 26 },
});
