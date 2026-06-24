import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { LanguageProvider } from './src/providers/LanguageProvider';
import { AuthProvider, useAuth } from './src/providers/AuthProvider';
import { HomeScreen } from './src/screens/HomeScreen';
import { SplashScreen } from './src/screens/SplashScreen';
import { paperTheme } from './src/theme/paperTheme';
import { isFirebaseConfigured } from './src/lib/firebase';

function AppContent() {
  const { isLoading } = useAuth();
  const [splashDone, setSplashDone] = useState(false);

  if (!splashDone) return <SplashScreen onDone={() => setSplashDone(true)} />;

  // Brief pause while Firebase resolves stored session
  if (isFirebaseConfigured && isLoading) return null;

  // Always show HomeScreen — guests can browse, auth is optional
  return <HomeScreen />;
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
