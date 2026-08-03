import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import React, { useContext } from "react";
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
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
import { AuthContext } from "../context/AuthContext";
import { GoalsContext } from "../context/GoalsContext";
import { SplitsContext } from "../context/SplitsContext";
import { SubscriptionsContext } from "../context/SubscriptionsContext";
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
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === "web" && width >= 1024;
  return (
    <Tab.Navigator
      sceneStyle={styles.tabScene}
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarPosition: isDesktop ? "left" : "bottom",
        tabBarVariant: isDesktop ? "material" : "uikit",
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.soft,
        tabBarLabelStyle: [
          styles.tabLabel,
          isDesktop && styles.desktopTabLabel,
        ],
        tabBarStyle: [styles.tabBar, isDesktop && styles.desktopTabBar],
        tabBarItemStyle: [styles.tabItem, isDesktop && styles.desktopTabItem],
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
  const { isLoading, storageError } = useContext(BudgetContext);
  const { user, isDemo, isAuthLoading, authError } = useContext(AuthContext);
  const { goalsStorageError, isLoadingGoals } = useContext(GoalsContext);
  const { splitsStorageError, isLoadingSplits } = useContext(SplitsContext);
  const { subscriptionsStorageError, isLoadingSubscriptions } =
    useContext(SubscriptionsContext);
  const visibleError =
    authError ||
    storageError ||
    goalsStorageError ||
    splitsStorageError ||
    subscriptionsStorageError;

  const isCloudDataLoading =
    Boolean(user) &&
    (isLoadingGoals || isLoadingSplits || isLoadingSubscriptions);

  if (isLoading || isAuthLoading || isCloudDataLoading) return <LoadingScreen />;

  return (
    <>
      <StatusBar style="dark" />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user && !isDemo ? (
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
      {visibleError ? (
        <View accessibilityRole="alert" style={styles.errorBanner}>
          <Ionicons name="cloud-offline-outline" size={17} color={colors.surface} />
          <Text style={styles.errorText}>{visibleError}</Text>
        </View>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    width: "100%",
    maxWidth: 1180,
    alignSelf: "center",
    height: 76,
    paddingTop: 8,
    paddingBottom: 10,
    backgroundColor: colors.surface,
    borderTopColor: colors.line,
  },
  tabItem: { paddingVertical: 2 },
  desktopTabBar: {
    width: 220,
    maxWidth: 220,
    height: "100%",
    paddingTop: 28,
    paddingBottom: 28,
    borderTopWidth: 0,
    borderRightWidth: 1,
    borderRightColor: colors.line,
  },
  desktopTabItem: {
    flex: 0,
    minHeight: 58,
    marginHorizontal: 10,
    marginVertical: 3,
    borderRadius: 14,
  },
  desktopTabLabel: { fontSize: 12, fontWeight: "800" },
  tabScene: {
    width: "100%",
    maxWidth: 1180,
    alignSelf: "center",
    backgroundColor: colors.canvas,
  },
  tabLabel: { fontSize: 9, fontWeight: "800" },
  loading: { flex: 1, backgroundColor: colors.canvas, alignItems: "center", justifyContent: "center" },
  loadingLogo: { width: 58, height: 58, borderRadius: 21, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  loadingName: { color: colors.ink, fontSize: 21, fontWeight: "900", marginTop: 13 },
  spinner: { marginTop: 20 },
  errorBanner: {
    position: "absolute",
    left: 14,
    right: 14,
    top: 52,
    zIndex: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 14,
    backgroundColor: colors.red,
    paddingHorizontal: 13,
    paddingVertical: 11,
  },
  errorText: { flex: 1, color: colors.surface, fontSize: 11, fontWeight: "700" },
});
