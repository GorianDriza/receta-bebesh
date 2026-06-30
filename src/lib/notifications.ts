import { Platform } from 'react-native';

// expo-notifications requires a native dev build — not available in Expo Go.
// Guard at module load; all functions become no-ops when native module is missing.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let Notif: any = null;

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  Notif = require('expo-notifications');
  Notif.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
} catch {
  // Expo Go — silently skip; will work after `eas build --profile development`
}

const CHANNEL_ID = 'meal-reminders';

async function ensureChannel(): Promise<void> {
  if (!Notif || Platform.OS !== 'android') return;
  await Notif.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Kujtues vakte',
    importance: Notif.AndroidImportance?.DEFAULT ?? 3,
    vibrationPattern: [0, 250, 250, 250],
  });
}

export async function requestNotificationPermissions(): Promise<boolean> {
  if (!Notif) return false;
  const { status: existing } = await Notif.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notif.requestPermissionsAsync();
  return status === 'granted';
}

type MealTimes = { lunchHour: number; lunchMinute: number; dinnerHour: number; dinnerMinute: number };

export async function scheduleMealReminders(babyName?: string, times?: MealTimes): Promise<void> {
  if (!Notif) return;
  const granted = await requestNotificationPermissions();
  if (!granted) return;

  await ensureChannel();
  try {
    await Notif.cancelAllScheduledNotificationsAsync();
  } catch {
    // unavailable on web / Expo Go
  }

  const nameStr = babyName ? `për ${babyName}` : 'për bebin tuaj';
  const lh = times?.lunchHour  ?? 12;
  const lm = times?.lunchMinute ?? 0;
  const dh = times?.dinnerHour  ?? 17;
  const dm = times?.dinnerMinute ?? 30;

  try {
    await Notif.scheduleNotificationAsync({
      content: {
        title: 'Koha e drekës! 🥗',
        body: `Kontrolloni planin e vaktit ${nameStr}.`,
        ...(Platform.OS === 'android' && { channelId: CHANNEL_ID }),
      },
      trigger: { type: 'daily', hour: lh, minute: lm },
    });

    await Notif.scheduleNotificationAsync({
      content: {
        title: 'Koha e darkës! 🍲',
        body: `Cila recetë sonte ${nameStr}?`,
        ...(Platform.OS === 'android' && { channelId: CHANNEL_ID }),
      },
      trigger: { type: 'daily', hour: dh, minute: dm },
    });
  } catch {
    // unavailable on web / Expo Go
  }
}

export async function cancelMealReminders(): Promise<void> {
  if (!Notif) return;
  try {
    await Notif.cancelAllScheduledNotificationsAsync();
  } catch {
    // unavailable on web / Expo Go
  }
}
