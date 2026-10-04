import React from 'react';
import { Text, View } from 'react-native';
import AppButton from './AppButton';
import { colors, type } from '../design';
export default function EditConflictNotice({ id, revision, current, onClose }: {
  id?: string; revision: number; current?: { revision?: number }; onClose: () => void;
}) {
  if (!id || (current && (current.revision ?? 0) === revision)) return null;
  return <View style={{ padding: 12, gap: 8, backgroundColor: colors.mint }}>
    <Text accessibilityRole="alert" style={type.small}>{current ? 'This record changed on another device.' : 'This record was deleted on another device.'} Your draft is kept here. Copy anything you need before closing; reopen the latest record from the refreshed list.</Text>
    <AppButton title="Close editor and review" variant="secondary" onPress={onClose} />
  </View>;
}
