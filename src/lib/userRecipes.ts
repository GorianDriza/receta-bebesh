import { get, ref, remove, update } from 'firebase/database';

import { firebaseDatabase } from './firebase';
import { RecipeRecord } from './recipes';

export type UserRecipeRecord = RecipeRecord & { authorId: string };

const PATH = 'communityRecipes';

export async function fetchCommunityRecipes(): Promise<UserRecipeRecord[]> {
  if (!firebaseDatabase) return [];
  try {
    const snap = await get(ref(firebaseDatabase, PATH));
    if (!snap.exists()) return [];
    return Object.values(snap.val() as Record<string, UserRecipeRecord>)
      .filter(Boolean)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  } catch {
    return [];
  }
}

export async function saveCommunityRecipe(recipe: UserRecipeRecord): Promise<void> {
  if (!firebaseDatabase) throw new Error('Firebase not configured');
  await update(ref(firebaseDatabase), { [`${PATH}/${recipe.id}`]: recipe });
}

export async function deleteCommunityRecipe(recipeId: string): Promise<void> {
  if (!firebaseDatabase) throw new Error('Firebase not configured');
  await remove(ref(firebaseDatabase, `${PATH}/${recipeId}`));
}

export function isCommunityRecipe(r: RecipeRecord): r is UserRecipeRecord {
  return r.source?.siteName === 'community';
}
