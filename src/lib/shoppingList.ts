import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = '@shopping_list';

export type ShoppingItem = {
  id: string;
  text: string;
  checked: boolean;
  addedAt: number;
};

export async function getShoppingList(): Promise<ShoppingItem[]> {
  try {
    const json = await AsyncStorage.getItem(KEY);
    return json ? (JSON.parse(json) as ShoppingItem[]) : [];
  } catch {
    return [];
  }
}

export async function addShoppingItem(text: string): Promise<void> {
  const list = await getShoppingList();
  const already = list.some((i) => i.text.toLowerCase().trim() === text.toLowerCase().trim());
  if (already) return;
  list.push({ id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`, text, checked: false, addedAt: Date.now() });
  await AsyncStorage.setItem(KEY, JSON.stringify(list));
}

export async function toggleShoppingItem(id: string): Promise<void> {
  const list = await getShoppingList();
  await AsyncStorage.setItem(KEY, JSON.stringify(list.map((i) => i.id === id ? { ...i, checked: !i.checked } : i)));
}

export async function removeShoppingItem(id: string): Promise<void> {
  const list = await getShoppingList();
  await AsyncStorage.setItem(KEY, JSON.stringify(list.filter((i) => i.id !== id)));
}

export async function clearCheckedItems(): Promise<void> {
  const list = await getShoppingList();
  await AsyncStorage.setItem(KEY, JSON.stringify(list.filter((i) => !i.checked)));
}

export async function getUncheckedCount(): Promise<number> {
  const list = await getShoppingList();
  return list.filter((i) => !i.checked).length;
}
