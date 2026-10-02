import type { NavigatorScreenParams } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

export type MainTabs = { Home: undefined; Activity: undefined; Budgets: undefined; Reports: undefined; Profile: undefined };
export type RootStack = {
  Welcome: undefined; Setup: undefined; ResetPassword: undefined;
  Main: NavigatorScreenParams<MainTabs> | undefined;
  AddTransaction: { transactionId?: string } | undefined;
  AddBill: { billId?: string } | undefined;
  StudentHub: undefined; MoneyCalendar: undefined; Coach: undefined;
  Splits: undefined; ManageSplit: { splitId?: string; direction?: 'owed_to_me' | 'i_owe' } | undefined;
  Goals: undefined; ManageGoal: { goalId?: string; templateId?: string } | undefined;
  Privacy: undefined; Subscriptions: undefined;
  ManageSubscription: { subscriptionId?: string; serviceId?: string } | undefined;
  Subscription: undefined;
};
export const Stack = createNativeStackNavigator<RootStack>();
export const Tab = createBottomTabNavigator<MainTabs>();
