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
    return json ? (JSON.parse(json) as RecipeRecord[]).map(normalizeRecipe) : null;
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

export type RecipeNutrition = {
  kcal?: number;
  proteinG?: number;
  carbsG?: number;
  fatG?: number;
  fiberG?: number;
  ironMg?: number;
  calciumMg?: number;
  vitaminCMg?: number;
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
  nutrition?: RecipeNutrition;
  createdAt: string;
  updatedAt: string;
};

type RecipeMap = Record<string, RecipeRecord>;

// Firebase RTDB drops empty arrays/objects, so records can arrive with missing
// fields. Fill them in once here so every screen can index safely.
export function normalizeRecipe<T extends RecipeRecord>(r: T): T {
  const text = (v?: Partial<LocalizedText>): LocalizedText => {
    const en = v?.en ?? v?.['sq-AL'] ?? '';
    return { en, 'sq-AL': v?.['sq-AL'] || en };
  };
  const list = (v?: Partial<LocalizedTextList>): LocalizedTextList => {
    const en = v?.en ?? [];
    return { en, 'sq-AL': v?.['sq-AL']?.length ? v['sq-AL'] : en };
  };
  return {
    ...r,
    title: text(r.title),
    summary: text(r.summary),
    ingredients: list(r.ingredients),
    steps: list(r.steps),
    mealType: r.mealType ?? 'unknown',
    ageStage: r.ageStage ?? 'family',
    image: r.image ?? { sourceUrl: null, storagePath: null, downloadUrl: null, contentType: null, mirroredAt: null },
    createdAt: r.createdAt ?? '',
    updatedAt: r.updatedAt ?? '',
  };
}

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
    const recipes = Object.values(snapshot.val() as RecipeMap).filter(Boolean).map(normalizeRecipe).sort((a, b) =>
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
