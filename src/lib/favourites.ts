import { get, ref, remove, set } from 'firebase/database';
import { firebaseDatabase } from './firebase';

export async function getFavouriteIds(uid: string): Promise<Set<string>> {
  if (!firebaseDatabase) return new Set();
  const snap = await get(ref(firebaseDatabase, `users/${uid}/favourites`));
  if (!snap.exists()) return new Set();
  return new Set(Object.keys(snap.val() as Record<string, number>));
}

export async function addFavourite(uid: string, recipeId: string): Promise<void> {
  if (!firebaseDatabase) return;
  await set(ref(firebaseDatabase, `users/${uid}/favourites/${recipeId}`), Date.now());
}

export async function removeFavourite(uid: string, recipeId: string): Promise<void> {
  if (!firebaseDatabase) return;
  await remove(ref(firebaseDatabase, `users/${uid}/favourites/${recipeId}`));
}
