import { StatusBar } from 'expo-status-bar';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { LanguageProvider } from './src/providers/LanguageProvider';
import { HomeScreen } from './src/screens/HomeScreen';
import { paperTheme } from './src/theme/paperTheme';

export default function App() {
  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <PaperProvider theme={paperTheme}>
          <StatusBar style="dark" />
          <HomeScreen />
        </PaperProvider>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}
