import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = '@recipe_ratings';

export type RecipeRating = {
  stars: number;   // 1-5
  note: string;
  updatedAt: number;
};

type RatingsMap = Record<string, RecipeRating>;

async function loadAll(): Promise<RatingsMap> {
  try {
    const json = await AsyncStorage.getItem(KEY);
    return json ? (JSON.parse(json) as RatingsMap) : {};
  } catch {
    return {};
  }
}

export async function getRating(recipeId: string): Promise<RecipeRating | null> {
  const all = await loadAll();
  return all[recipeId] ?? null;
}

export async function setRating(recipeId: string, stars: number, note: string): Promise<void> {
  const all = await loadAll();
  all[recipeId] = { stars, note, updatedAt: Date.now() };
  await AsyncStorage.setItem(KEY, JSON.stringify(all));
}

export async function deleteRating(recipeId: string): Promise<void> {
  const all = await loadAll();
  delete all[recipeId];
  await AsyncStorage.setItem(KEY, JSON.stringify(all));
}

export async function getAllRatings(): Promise<RatingsMap> {
  return loadAll();
}
