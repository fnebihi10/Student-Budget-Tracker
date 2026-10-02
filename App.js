import React, { useContext } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { BudgetProvider } from "./src/context/BudgetContext";
import { GoalsProvider } from "./src/context/GoalsContext";
import { SplitsProvider } from "./src/context/SplitsContext";
import { SubscriptionsProvider } from "./src/context/SubscriptionsContext";
import AppNavigator from "./src/navigation/AppNavigator";
import { AuthContext, AuthProvider } from "./src/context/AuthContext";
import ErrorBoundary from './src/components/ErrorBoundary';

export default function App() {
  return (
    <ErrorBoundary><AuthProvider>
      <AccountScope />
    </AuthProvider></ErrorBoundary>
  );
}

function AccountScope() {
  const { user, isDemo, isRecovering } = useContext(AuthContext);
  const scope = isRecovering ? `recovery/${user?.id}` : isDemo ? 'demo' : user?.id || 'signed-out';
  return <FinanceApp key={scope} />;
}

function FinanceApp() {
  return (
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
  );
}
