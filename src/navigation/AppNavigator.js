import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import React, { useContext } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import AddBillScreen from "../screens/AddBillScreen";
import AddExpenseScreen from "../screens/AddExpenseScreen";
import BudgetsScreen from "../screens/BudgetsScreen";
import CoachScreen from "../screens/CoachScreen";
import DashboardScreen from "../screens/DashboardScreen";
import GoalsScreen from "../screens/GoalsScreen";
import LoginScreen from "../screens/LoginScreen";
import MoneyCalendarScreen from "../screens/MoneyCalendarScreen";
import ManageGoalScreen from "../screens/ManageGoalScreen";
import ManageSplitScreen from "../screens/ManageSplitScreen";
import ManageSubscriptionScreen from "../screens/ManageSubscriptionScreen";
import PrivacyScreen from "../screens/PrivacyScreen";
import ProfileScreen from "../screens/ProfileScreen";
import RegisterScreen from "../screens/RegisterScreen";
import ReportScreen from "../screens/ReportScreen";
import SplitsScreen from "../screens/SplitsScreen";
import StudentHubScreen from "../screens/StudentHubScreen";
import SubscriptionScreen from "../screens/SubscriptionScreen";
import SubscriptionsScreen from "../screens/SubscriptionsScreen";
import TransactionsScreen from "../screens/TransactionsScreen";
import { BudgetContext } from "../context/BudgetContext";
import { colors } from "../design";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const tabIcons = {
  Home: ["home", "home-outline"],
  Activity: ["receipt", "receipt-outline"],
  Budgets: ["wallet", "wallet-outline"],
  Reports: ["stats-chart", "stats-chart-outline"],
  Profile: ["person", "person-outline"],
};

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.soft,
        tabBarLabelStyle: styles.tabLabel,
        tabBarStyle: styles.tabBar,
        tabBarItemStyle: styles.tabItem,
        tabBarIcon: ({ focused, color }) => (
          <Ionicons name={tabIcons[route.name][focused ? 0 : 1]} size={22} color={color} />
        ),
      })}
    >
      <Tab.Screen name="Home" component={DashboardScreen} />
      <Tab.Screen name="Activity" component={TransactionsScreen} />
      <Tab.Screen name="Budgets" component={BudgetsScreen} />
      <Tab.Screen name="Reports" component={ReportScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function LoadingScreen() {
  return (
    <View style={styles.loading}>
      <View style={styles.loadingLogo}>
        <Ionicons name="leaf" size={28} color={colors.surface} />
      </View>
      <Text style={styles.loadingName}>Pocketwise</Text>
      <ActivityIndicator color={colors.primary} style={styles.spinner} />
    </View>
  );
}

export default function AppNavigator() {
  const { onboardingComplete, sessionActive, isLoading } = useContext(BudgetContext);

  if (isLoading) return <LoadingScreen />;

  return (
    <>
      <StatusBar style="dark" />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!onboardingComplete || !sessionActive ? (
          <Stack.Group>
            <Stack.Screen name="Welcome" component={LoginScreen} />
            <Stack.Screen name="Setup" component={RegisterScreen} />
          </Stack.Group>
        ) : (
          <Stack.Group>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen
              name="AddTransaction"
              component={AddExpenseScreen}
              options={{ presentation: "modal", animation: "slide_from_bottom" }}
            />
            <Stack.Screen
              name="AddBill"
              component={AddBillScreen}
              options={{ presentation: "modal", animation: "slide_from_bottom" }}
            />
            <Stack.Screen
              name="StudentHub"
              component={StudentHubScreen}
              options={{ animation: "slide_from_right" }}
            />
            <Stack.Screen
              name="MoneyCalendar"
              component={MoneyCalendarScreen}
              options={{ animation: "slide_from_right" }}
            />
            <Stack.Screen
              name="Coach"
              component={CoachScreen}
              options={{ animation: "slide_from_right" }}
            />
            <Stack.Screen
              name="Splits"
              component={SplitsScreen}
              options={{ animation: "slide_from_right" }}
            />
            <Stack.Screen
              name="ManageSplit"
              component={ManageSplitScreen}
              options={{ presentation: "modal", animation: "slide_from_bottom" }}
            />
            <Stack.Screen
              name="Goals"
              component={GoalsScreen}
              options={{ animation: "slide_from_right" }}
            />
            <Stack.Screen
              name="ManageGoal"
              component={ManageGoalScreen}
              options={{ presentation: "modal", animation: "slide_from_bottom" }}
            />
            <Stack.Screen
              name="Privacy"
              component={PrivacyScreen}
              options={{ animation: "slide_from_right" }}
            />
            <Stack.Screen
              name="Subscriptions"
              component={SubscriptionsScreen}
              options={{ animation: "slide_from_right" }}
            />
            <Stack.Screen
              name="ManageSubscription"
              component={ManageSubscriptionScreen}
              options={{ presentation: "modal", animation: "slide_from_bottom" }}
            />
            <Stack.Screen
              name="Subscription"
              component={SubscriptionScreen}
              options={{ presentation: "modal", animation: "slide_from_bottom" }}
            />
          </Stack.Group>
        )}
      </Stack.Navigator>
    </>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    height: 76,
    paddingTop: 8,
    paddingBottom: 10,
    backgroundColor: colors.surface,
    borderTopColor: colors.line,
  },
  tabItem: { paddingVertical: 2 },
  tabLabel: { fontSize: 9, fontWeight: "800" },
  loading: { flex: 1, backgroundColor: colors.canvas, alignItems: "center", justifyContent: "center" },
  loadingLogo: { width: 58, height: 58, borderRadius: 21, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  loadingName: { color: colors.ink, fontSize: 21, fontWeight: "900", marginTop: 13 },
  spinner: { marginTop: 20 },
});
