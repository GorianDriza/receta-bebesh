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
