import AsyncStorage from '@react-native-async-storage/async-storage';
import { get, ref, update } from 'firebase/database';

import { firebaseDatabase } from './firebase';

const RECIPE_CACHE_KEY = '@recipes_cache';
const RECIPE_CACHE_META_KEY = '@recipes_cache_meta';

type CacheMeta = { cachedAt: number; count: number };

async function saveRecipeCache(recipes: RecipeRecord[]): Promise<void> {
  try {
    await AsyncStorage.setItem(RECIPE_CACHE_KEY, JSON.stringify(recipes));
    const meta: CacheMeta = { cachedAt: Date.now(), count: recipes.length };
    await AsyncStorage.setItem(RECIPE_CACHE_META_KEY, JSON.stringify(meta));
  } catch {
    // Non-fatal — cache write failures are silent
  }
}

async function loadRecipeCache(): Promise<RecipeRecord[] | null> {
  try {
    const json = await AsyncStorage.getItem(RECIPE_CACHE_KEY);
    return json ? (JSON.parse(json) as RecipeRecord[]) : null;
  } catch {
    return null;
  }
}

export async function getRecipeCacheMeta(): Promise<CacheMeta | null> {
  try {
    const json = await AsyncStorage.getItem(RECIPE_CACHE_META_KEY);
    return json ? (JSON.parse(json) as CacheMeta) : null;
  } catch {
    return null;
  }
}

export type RecipeLanguage = 'sq-AL' | 'en';
export type TranslationStatus = 'pending' | 'machine' | 'reviewed';
export type RecipeStage =
  | '4-6m'
  | '6-8m'
  | '9-12m'
  | '12m+'
  | 'family';
export type RecipeMealType =
  | 'breakfast'
  | 'lunch'
  | 'dinner'
  | 'snack'
  | 'puree'
  | 'finger-food'
  | 'batch-prep'
  | 'unknown';

export type LocalizedText = Record<RecipeLanguage, string>;
export type LocalizedTextList = Record<RecipeLanguage, string[]>;

export type RecipeSource = {
  siteName: string;
  sourceId: string;
  url: string;
  imageUrl: string | null;
  scrapedAt: string;
};

export type RecipeImage = {
  sourceUrl: string | null;
  storagePath: string | null;
  downloadUrl: string | null;
  contentType: string | null;
  mirroredAt: string | null;
};

export type RecipeTranslation = {
  status: TranslationStatus;
  provider: string;
  reviewedBy: string | null;
};

export type RecipeRecord = {
  id: string;
  slug: string;
  languages: RecipeLanguage[];
  title: LocalizedText;
  summary: LocalizedText;
  ingredients: LocalizedTextList;
  steps: LocalizedTextList;
  ageStage: RecipeStage;
  mealType: RecipeMealType;
  prepMinutes: number | null;
  cookMinutes: number | null;
  totalMinutes: number | null;
  image: RecipeImage;
  source: RecipeSource;
  translation: RecipeTranslation;
  createdAt: string;
  updatedAt: string;
};

type RecipeMap = Record<string, RecipeRecord>;

export type FetchResult = { recipes: RecipeRecord[]; fromCache: boolean };

export async function fetchRecipes(): Promise<RecipeRecord[]> {
  if (!firebaseDatabase) {
    return (await loadRecipeCache()) ?? [];
  }

  try {
    const snapshot = await get(ref(firebaseDatabase, 'recipes'));
    if (!snapshot.exists()) {
      return (await loadRecipeCache()) ?? [];
    }
    const recipes = Object.values(snapshot.val() as RecipeMap).sort((a, b) =>
      b.updatedAt.localeCompare(a.updatedAt),
    );
    await saveRecipeCache(recipes);
    return recipes;
  } catch {
    return (await loadRecipeCache()) ?? [];
  }
}

export async function upsertRecipes(recipes: RecipeRecord[]) {
  if (!firebaseDatabase || recipes.length === 0) {
    return;
  }

  const updates: Record<string, RecipeRecord> = {};

  for (const recipe of recipes) {
    updates[`recipes/${recipe.id}`] = recipe;
  }

  await update(ref(firebaseDatabase), updates);
}
