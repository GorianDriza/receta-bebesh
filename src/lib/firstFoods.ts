import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = '@first_foods_v1';

export type FoodReaction = 'loved' | 'neutral' | 'rejected' | 'allergy';

export type FoodEntry = {
  id: string;
  foodName: string;
  emoji: string;
  dateIntroduced: string; // YYYY-MM-DD
  reaction: FoodReaction;
  notes: string;
  waitDays: 3 | 5;
};

export async function getFoodEntries(): Promise<FoodEntry[]> {
  try {
    const json = await AsyncStorage.getItem(KEY);
    return json ? (JSON.parse(json) as FoodEntry[]) : [];
  } catch {
    return [];
  }
}

export async function saveFoodEntry(entry: FoodEntry): Promise<void> {
  const entries = await getFoodEntries();
  const idx = entries.findIndex((e) => e.id === entry.id);
  if (idx >= 0) entries[idx] = entry;
  else entries.push(entry);
  entries.sort((a, b) => b.dateIntroduced.localeCompare(a.dateIntroduced));
  await AsyncStorage.setItem(KEY, JSON.stringify(entries));
}

export async function deleteFoodEntry(id: string): Promise<void> {
  const entries = await getFoodEntries();
  await AsyncStorage.setItem(KEY, JSON.stringify(entries.filter((e) => e.id !== id)));
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function daysUntilNextSafe(entries: FoodEntry[]): number {
  if (entries.length === 0) return 0;
  const latest = entries[0]; // sorted desc
  const introduced = new Date(latest.dateIntroduced + 'T00:00:00');
  const next = new Date(introduced);
  next.setDate(next.getDate() + latest.waitDays);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.max(0, Math.ceil((next.getTime() - today.getTime()) / 86400000));
}

export const REACTION_CONFIG: Record<FoodReaction, { emoji: string; bg: string; label_sq: string; label_en: string }> = {
  loved:    { emoji: '😍', bg: '#CFFFD6', label_sq: 'E deshi',    label_en: 'Loved'    },
  neutral:  { emoji: '😐', bg: '#FFF39D', label_sq: 'Neutral',    label_en: 'Neutral'  },
  rejected: { emoji: '🙅', bg: '#FFD9AE', label_sq: 'Refuzoi',    label_en: 'Rejected' },
  allergy:  { emoji: '⚠️', bg: '#FFE9E9', label_sq: 'Reagim!',    label_en: 'Reaction!'},
};

export const FOOD_EMOJIS = [
  '🥕','🍠','🥦','🍌','🥑','🍎','🫐','🍓','🥚','🐟',
  '🍗','🥩','🌽','🫛','🧀','🥛','🍞','🍚','🥣','🍋',
  '🍊','🥝','🍇','🥜','🍆','🌿','🫚','🥗','🍲','🥐',
  '🍅','🧅','🧄','🫚','🫐','🍑','🥭','🍍','🥬','🫑',
];
