import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { BudgetProvider } from "./src/context/BudgetContext";
import { GoalsProvider } from "./src/context/GoalsContext";
import { SplitsProvider } from "./src/context/SplitsContext";
import { SubscriptionsProvider } from "./src/context/SubscriptionsContext";
import AppNavigator from "./src/navigation/AppNavigator";
import { AuthProvider } from "./src/context/AuthContext";

export default function App() {
  return (
    <AuthProvider>
      <BudgetProvider>
        <SubscriptionsProvider>
          <GoalsProvider>
            <SplitsProvider>
              <NavigationContainer>
                <AppNavigator />
              </NavigationContainer>
            </SplitsProvider>
          </GoalsProvider>
        </SubscriptionsProvider>
      </BudgetProvider>
    </AuthProvider>
  );
}
