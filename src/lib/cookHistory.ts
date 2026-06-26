import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFIX = '@cook_history_';

export type CookedEntry = {
  recipeId: string;
  recipeTitle: string;
  cookedAt: number;
};

export type DayHistory = Partial<Record<string, CookedEntry>>;

function dateKey(date: Date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export async function getDayHistory(date?: Date): Promise<DayHistory> {
  try {
    const json = await AsyncStorage.getItem(PREFIX + dateKey(date));
    return json ? (JSON.parse(json) as DayHistory) : {};
  } catch {
    return {};
  }
}

export async function markCooked(mealType: string, recipeId: string, recipeTitle: string, date?: Date): Promise<void> {
  const history = await getDayHistory(date);
  history[mealType] = { recipeId, recipeTitle, cookedAt: Date.now() };
  await AsyncStorage.setItem(PREFIX + dateKey(date), JSON.stringify(history));
}

export async function unmarkCooked(mealType: string, date?: Date): Promise<void> {
  const history = await getDayHistory(date);
  delete history[mealType];
  await AsyncStorage.setItem(PREFIX + dateKey(date), JSON.stringify(history));
}

export async function getRecentlyCookedIds(days = 14): Promise<string[]> {
  const today = new Date();
  const seen = new Set<string>();
  const ids: string[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const history = await getDayHistory(d);
    for (const entry of Object.values(history)) {
      if (entry && !seen.has(entry.recipeId)) {
        seen.add(entry.recipeId);
        ids.push(entry.recipeId);
      }
    }
  }
  return ids;
}

export async function getCookStreak(): Promise<number> {
  const today = new Date();
  let streak = 0;
  for (let i = 0; i < 60; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const history = await getDayHistory(d);
    if (Object.keys(history).length > 0) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }
  return streak;
}

export type WeekDaySummary = {
  dateKey: string;
  count: number;
  entries: CookedEntry[];
};

export async function getMonthCookCounts(year: number, month: number): Promise<Record<string, number>> {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const prefix = `${PREFIX}${year}-${String(month).padStart(2, '0')}-`;
    const relevant = allKeys.filter((k) => k.startsWith(prefix));
    const result: Record<string, number> = {};
    for (const key of relevant) {
      const json = await AsyncStorage.getItem(key);
      if (!json) continue;
      const history = JSON.parse(json) as DayHistory;
      const day = key.replace(PREFIX, '');
      result[day] = Object.keys(history).length;
    }
    return result;
  } catch {
    return {};
  }
}

export async function getWeekCookSummary(): Promise<WeekDaySummary[]> {
  const today = new Date();
  const result: WeekDaySummary[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = dateKey(d);
    const history = await getDayHistory(d);
    const entries = Object.values(history).filter((e): e is CookedEntry => e != null);
    result.push({ dateKey: key, count: entries.length, entries });
  }
  return result;
}
