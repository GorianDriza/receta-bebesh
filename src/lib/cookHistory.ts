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

export async function getWeekCookSummary(): Promise<Array<{ dateKey: string; count: number }>> {
  const today = new Date();
  const result: Array<{ dateKey: string; count: number }> = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = dateKey(d);
    const history = await getDayHistory(d);
    result.push({ dateKey: key, count: Object.keys(history).length });
  }
  return result;
}
