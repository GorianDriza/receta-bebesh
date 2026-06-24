import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { LanguageProvider } from './src/providers/LanguageProvider';
import { AuthProvider, useAuth } from './src/providers/AuthProvider';
import { HomeScreen } from './src/screens/HomeScreen';
import { LoginScreen } from './src/screens/auth/LoginScreen';
import { SignUpScreen } from './src/screens/auth/SignUpScreen';
import { paperTheme } from './src/theme/paperTheme';
import { isFirebaseConfigured } from './src/lib/firebase';

function AppContent() {
  const { user, isLoading } = useAuth();
  const [showSignUp, setShowSignUp] = useState(false);

  // Firebase not configured → skip auth, show app
  if (!isFirebaseConfigured) return <HomeScreen />;

  // Waiting for persisted auth state to resolve
  if (isLoading) return null;

  // Logged in
  if (user) return <HomeScreen />;

  // Not logged in — show auth flow
  if (showSignUp) {
    return <SignUpScreen onGoLogin={() => setShowSignUp(false)} />;
  }
  return <LoginScreen onGoSignUp={() => setShowSignUp(true)} />;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <PaperProvider theme={paperTheme}>
          <StatusBar style="dark" />
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </PaperProvider>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}
