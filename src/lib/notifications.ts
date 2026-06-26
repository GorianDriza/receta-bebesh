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

export async function scheduleMealReminders(babyName?: string): Promise<void> {
  if (!Notif) return;
  const granted = await requestNotificationPermissions();
  if (!granted) return;

  await ensureChannel();
  await Notif.cancelAllScheduledNotificationsAsync();

  const nameStr = babyName ? `për ${babyName}` : 'për bebin tuaj';

  await Notif.scheduleNotificationAsync({
    content: {
      title: 'Koha e drekës! 🥗',
      body: `Kontrolloni planin e vaktit ${nameStr}.`,
      ...(Platform.OS === 'android' && { channelId: CHANNEL_ID }),
    },
    trigger: { type: 'daily', hour: 12, minute: 0 },
  });

  await Notif.scheduleNotificationAsync({
    content: {
      title: 'Koha e darkës! 🍲',
      body: `Cila recetë sonte ${nameStr}?`,
      ...(Platform.OS === 'android' && { channelId: CHANNEL_ID }),
    },
    trigger: { type: 'daily', hour: 17, minute: 30 },
  });
}

export async function cancelMealReminders(): Promise<void> {
  if (!Notif) return;
  await Notif.cancelAllScheduledNotificationsAsync();
}
