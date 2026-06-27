import AsyncStorage from '@react-native-async-storage/async-storage';
import { cancelMealReminders, scheduleMealReminders } from './notifications';

const KEY       = '@notif_reminders_enabled';
const TIMES_KEY = '@notif_times';

export type NotifTimes = {
  lunchHour: number;
  lunchMinute: number;
  dinnerHour: number;
  dinnerMinute: number;
};

const DEFAULT_TIMES: NotifTimes = {
  lunchHour: 12, lunchMinute: 0,
  dinnerHour: 17, dinnerMinute: 30,
};

export async function getRemindersEnabled(): Promise<boolean> {
  try {
    const val = await AsyncStorage.getItem(KEY);
    return val !== 'false';
  } catch {
    return true;
  }
}

export async function getNotifTimes(): Promise<NotifTimes> {
  try {
    const json = await AsyncStorage.getItem(TIMES_KEY);
    return json ? { ...DEFAULT_TIMES, ...(JSON.parse(json) as Partial<NotifTimes>) } : DEFAULT_TIMES;
  } catch {
    return DEFAULT_TIMES;
  }
}

export async function setRemindersEnabled(enabled: boolean, babyName?: string): Promise<void> {
  await AsyncStorage.setItem(KEY, String(enabled));
  if (enabled) {
    const times = await getNotifTimes();
    await scheduleMealReminders(babyName, times);
  } else {
    await cancelMealReminders();
  }
}

export async function setNotifTimes(times: NotifTimes, babyName?: string): Promise<void> {
  await AsyncStorage.setItem(TIMES_KEY, JSON.stringify(times));
  const enabled = await getRemindersEnabled();
  if (enabled) await scheduleMealReminders(babyName, times);
}
