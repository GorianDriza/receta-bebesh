import AsyncStorage from '@react-native-async-storage/async-storage';
import { cancelMealReminders, scheduleMealReminders } from './notifications';

const KEY = '@notif_reminders_enabled';

export async function getRemindersEnabled(): Promise<boolean> {
  try {
    const val = await AsyncStorage.getItem(KEY);
    return val !== 'false';
  } catch {
    return true;
  }
}

export async function setRemindersEnabled(enabled: boolean, babyName?: string): Promise<void> {
  await AsyncStorage.setItem(KEY, String(enabled));
  if (enabled) {
    await scheduleMealReminders(babyName);
  } else {
    await cancelMealReminders();
  }
}
