import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock notifications before importing notificationPrefs
jest.mock('../lib/notifications', () => ({
  scheduleMealReminders: jest.fn(() => Promise.resolve()),
  cancelMealReminders: jest.fn(() => Promise.resolve()),
}));

import { getNotifTimes, getRemindersEnabled, setNotifTimes, setRemindersEnabled } from '../lib/notificationPrefs';
import { cancelMealReminders, scheduleMealReminders } from '../lib/notifications';

const store: Record<string, string> = {};

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn((key: string) => Promise.resolve(store[key] ?? null)),
  setItem: jest.fn((key: string, value: string) => { store[key] = value; return Promise.resolve(); }),
}));

beforeEach(() => {
  Object.keys(store).forEach((k) => delete store[k]);
  jest.clearAllMocks();
  (AsyncStorage.getItem as jest.Mock).mockImplementation((key: string) => Promise.resolve(store[key] ?? null));
  (AsyncStorage.setItem as jest.Mock).mockImplementation((key: string, value: string) => { store[key] = value; return Promise.resolve(); });
});

// ── getRemindersEnabled ───────────────────────────────────────────────────────

describe('getRemindersEnabled', () => {
  it('returns true when no value stored (default on)', async () => {
    expect(await getRemindersEnabled()).toBe(true);
  });

  it('returns false when stored as false', async () => {
    store['@notif_reminders_enabled'] = 'false';
    expect(await getRemindersEnabled()).toBe(false);
  });

  it('returns true when stored as true', async () => {
    store['@notif_reminders_enabled'] = 'true';
    expect(await getRemindersEnabled()).toBe(true);
  });
});

// ── setRemindersEnabled ───────────────────────────────────────────────────────

describe('setRemindersEnabled', () => {
  it('persists enabled=true and calls scheduleMealReminders', async () => {
    await setRemindersEnabled(true, 'Arbi');
    expect(store['@notif_reminders_enabled']).toBe('true');
    expect(scheduleMealReminders).toHaveBeenCalledTimes(1);
    expect(cancelMealReminders).not.toHaveBeenCalled();
  });

  it('persists enabled=false and calls cancelMealReminders', async () => {
    await setRemindersEnabled(false);
    expect(store['@notif_reminders_enabled']).toBe('false');
    expect(cancelMealReminders).toHaveBeenCalledTimes(1);
    expect(scheduleMealReminders).not.toHaveBeenCalled();
  });
});

// ── getNotifTimes ─────────────────────────────────────────────────────────────

describe('getNotifTimes', () => {
  it('returns defaults when nothing stored', async () => {
    const t = await getNotifTimes();
    expect(t).toEqual({ lunchHour: 12, lunchMinute: 0, dinnerHour: 17, dinnerMinute: 30 });
  });

  it('returns stored values merged with defaults', async () => {
    store['@notif_times'] = JSON.stringify({ lunchHour: 11, lunchMinute: 30 });
    const t = await getNotifTimes();
    expect(t.lunchHour).toBe(11);
    expect(t.lunchMinute).toBe(30);
    expect(t.dinnerHour).toBe(17);   // default
    expect(t.dinnerMinute).toBe(30); // default
  });
});

// ── setNotifTimes ─────────────────────────────────────────────────────────────

describe('setNotifTimes', () => {
  it('persists times and reschedules when reminders are enabled', async () => {
    store['@notif_reminders_enabled'] = 'true';
    const times = { lunchHour: 11, lunchMinute: 0, dinnerHour: 18, dinnerMinute: 0 };
    await setNotifTimes(times);
    expect(JSON.parse(store['@notif_times'])).toMatchObject(times);
    expect(scheduleMealReminders).toHaveBeenCalledWith(undefined, times);
  });

  it('persists times but does NOT reschedule when reminders are disabled', async () => {
    store['@notif_reminders_enabled'] = 'false';
    await setNotifTimes({ lunchHour: 11, lunchMinute: 0, dinnerHour: 18, dinnerMinute: 0 });
    expect(scheduleMealReminders).not.toHaveBeenCalled();
  });

  it('passes babyName through to scheduleMealReminders', async () => {
    store['@notif_reminders_enabled'] = 'true';
    const times = { lunchHour: 12, lunchMinute: 0, dinnerHour: 17, dinnerMinute: 30 };
    await setNotifTimes(times, 'Lira');
    expect(scheduleMealReminders).toHaveBeenCalledWith('Lira', times);
  });
});
