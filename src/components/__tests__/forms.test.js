import React from 'react';
import { act, create } from 'react-test-renderer';
import { TextInput } from 'react-native';
import AppButton from '../AppButton';
import AddExpenseScreen from '../../screens/AddExpenseScreen';
import { BudgetContext } from '../../context/BudgetContext';

jest.mock('react-native-safe-area-context', () => ({ SafeAreaView: require('react-native').View }));
jest.mock('expo-haptics', () => ({ notificationAsync: jest.fn(async () => {}), NotificationFeedbackType: { Success: 'success' } }));
jest.mock('../CategoryPicker', () => () => null);
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));

test('failed save retains entered values and successful confirmation alone closes the form', async () => {
  const addTransaction = jest.fn().mockResolvedValueOnce(false).mockResolvedValueOnce(true);
  const navigation = { goBack: jest.fn() };
  let renderer;
  await act(async () => { renderer = create(<BudgetContext.Provider value={{ transactions: [], settings: { currency: 'EUR' }, addTransaction }}><AddExpenseScreen route={{}} navigation={navigation} /></BudgetContext.Provider>); });
  const field = (label) => renderer.root.findAllByType(TextInput).find((input) => input.props.accessibilityLabel === label);
  await act(async () => { field('Amount').props.onChangeText('12.34'); field('Description').props.onChangeText('Retained lunch'); });
  const save = () => renderer.root.findAllByType(AppButton).find((button) => button.props.title === 'Save expense').props.onPress();
  await act(async () => { await save(); });
  expect(navigation.goBack).not.toHaveBeenCalled();
  expect(field('Amount').props.value).toBe('12.34');
  expect(field('Description').props.value).toBe('Retained lunch');
  await act(async () => { await save(); });
  expect(navigation.goBack).toHaveBeenCalledTimes(1);
  await act(async () => renderer.unmount());
});

test('button blocks duplicate presses before rerender and exposes pending accessibility state', async () => {
  let resolve;
  const request = new Promise((done) => { resolve = done; });
  const onPress = jest.fn(() => request);
  let renderer;
  await act(async () => { renderer = create(<AppButton title="Save" onPress={onPress} />); });
  const button = () => renderer.root.findAll((node) => node.props.accessibilityLabel === 'Save' && typeof node.props.onPress === 'function')[0];
  const press = button().props.onPress;
  let pending;
  await act(async () => { pending = press(); void press(); });
  expect(onPress).toHaveBeenCalledTimes(1);
  expect(button().props.accessibilityState).toEqual({ disabled: true, busy: true });
  await act(async () => { resolve(); await pending; });
  expect(button().props.accessibilityState.busy).toBe(false);
  await act(async () => renderer.unmount());
});
