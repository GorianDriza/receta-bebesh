import { get, ref, update } from 'firebase/database';

import { firebaseDatabase } from './firebase';

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

export async function fetchRecipes(): Promise<RecipeRecord[]> {
  if (!firebaseDatabase) {
    return [];
  }

  const snapshot = await get(ref(firebaseDatabase, 'recipes'));

  if (!snapshot.exists()) {
    return [];
  }

  const recipes = snapshot.val() as RecipeMap;

  return Object.values(recipes).sort((left, right) =>
    right.updatedAt.localeCompare(left.updatedAt),
  );
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
