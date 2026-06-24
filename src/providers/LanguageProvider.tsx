import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { getLocales } from 'expo-localization';

import {
  AppLanguage,
  isSupportedLanguage,
  supportedLanguages,
  translations,
} from '../i18n/translations';

type LanguageContextValue = {
  deviceLanguage: AppLanguage;
  language: AppLanguage;
  isHydrated: boolean;
  setLanguage: (language: AppLanguage) => Promise<void>;
  t: typeof translations;
};

const LANGUAGE_STORAGE_KEY = 'receta-bebesh.language';

const LanguageContext = createContext<LanguageContextValue | null>(null);

function detectDeviceLanguage(): AppLanguage {
  const locale = getLocales()[0];
  const languageTag = locale?.languageTag ?? '';
  const languageCode = locale?.languageCode ?? '';

  if (languageTag.toLowerCase().startsWith('sq')) {
    return 'sq-AL';
  }

  if (languageCode.toLowerCase() === 'en') {
    return 'en';
  }

  return 'sq-AL';
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [deviceLanguage] = useState<AppLanguage>(detectDeviceLanguage);
  const [language, setLanguageState] = useState<AppLanguage>('sq-AL');
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    async function hydrateLanguage() {
      try {
        const storedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);

        if (storedLanguage && isSupportedLanguage(storedLanguage)) {
          setLanguageState(storedLanguage);
        } else if (!supportedLanguages.includes(deviceLanguage)) {
          setLanguageState('sq-AL');
        }
      } finally {
        setIsHydrated(true);
      }
    }

    void hydrateLanguage();
  }, [deviceLanguage]);

  async function setLanguage(nextLanguage: AppLanguage) {
    setLanguageState(nextLanguage);
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage);
  }

  return (
    <LanguageContext.Provider
      value={{
        deviceLanguage,
        language,
        isHydrated,
        setLanguage,
        t: translations,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }

  return context;
}
