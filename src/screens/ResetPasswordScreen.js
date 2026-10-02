import React, { useContext, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthContext } from '../context/AuthContext';
import AppButton from '../components/AppButton';
import { colors, type, radius } from '../design';

export default function ResetPasswordScreen() {
  const { finishPasswordReset, signOut, authError } = useContext(AuthContext);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const valid = password.length >= 8 && password === confirm;
  const field = { minHeight: 54, borderRadius: radius.md, backgroundColor: colors.surface, paddingHorizontal: 16, marginVertical: 10, color: colors.ink };
  return <SafeAreaView style={{ flex: 1, backgroundColor: colors.canvas }}>
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ width: '100%', maxWidth: 560, alignSelf: 'center', padding: 24 }}>
        <Text style={type.h1}>Choose a new password</Text>
        <Text style={type.body}>Use at least eight characters. The recovery link establishes a session before this form can save.</Text>
        <TextInput accessibilityLabel="New password" placeholder="New password" secureTextEntry autoComplete="new-password" value={password} onChangeText={setPassword} style={field} />
        <TextInput accessibilityLabel="Confirm new password" placeholder="Confirm new password" secureTextEntry value={confirm} onChangeText={setConfirm} style={field} />
        {confirm && !valid ? <Text accessibilityRole="alert">Passwords must match and contain at least eight characters.</Text> : null}
        {authError ? <Text accessibilityRole="alert">{authError}</Text> : null}
        <AppButton title="Save new password" disabled={!valid} onPress={() => finishPasswordReset(password)} />
        <AppButton title="Cancel and sign out" variant="ghost" onPress={signOut} />
      </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}
