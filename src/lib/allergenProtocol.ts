import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = '@allergen_protocol_v1';

export type AllergenReaction = 'none' | 'mild' | 'severe';

export type AllergenEntry = {
  allergenId: string;
  dateIntroduced: string; // YYYY-MM-DD
  reaction: AllergenReaction;
  notes: string;
};

export type Allergen = {
  id: string;
  emoji: string;
  name_sq: string;
  name_en: string;
  tip_sq: string;
  tip_en: string;
};

export const ALLERGENS: Allergen[] = [
  { id: 'peanut',    emoji: '🥜', name_sq: 'Kikiriku',     name_en: 'Peanut',    tip_sq: 'Provo gjalpin e kikiriku të holluar.', tip_en: 'Try thinned peanut butter.' },
  { id: 'egg',       emoji: '🥚', name_sq: 'Veza',          name_en: 'Egg',       tip_sq: 'Fillo me vezë të zierë mirë.', tip_en: 'Start with well-cooked egg.' },
  { id: 'dairy',     emoji: '🥛', name_sq: 'Bulmet',        name_en: 'Dairy',     tip_sq: 'Provo kos ose djathë të butë.', tip_en: 'Try yogurt or soft cheese.' },
  { id: 'wheat',     emoji: '🌾', name_sq: 'Gruri/Gluten',  name_en: 'Wheat',     tip_sq: 'Fillo me drithëra të gatuara mirë.', tip_en: 'Start with well-cooked cereals.' },
  { id: 'fish',      emoji: '🐟', name_sq: 'Peshku',        name_en: 'Fish',      tip_sq: 'Fillo me salmon ose merluci të pjekur mirë.', tip_en: 'Start with well-cooked salmon or cod.' },
  { id: 'shellfish', emoji: '🦐', name_sq: 'Kacamakët',     name_en: 'Shellfish', tip_sq: 'Gatuaj mirë para se t\'i japësh.', tip_en: 'Cook thoroughly before serving.' },
  { id: 'treenuts',  emoji: '🌰', name_sq: 'Arrat',         name_en: 'Tree Nuts', tip_sq: 'Provo gjalpë arrash ose arra të bluara.', tip_en: 'Try nut butter or finely ground nuts.' },
  { id: 'sesame',    emoji: '🌿', name_sq: 'Susami',        name_en: 'Sesame',    tip_sq: 'Provo tahin (gjalpë susami).', tip_en: 'Try tahini (sesame paste).' },
  { id: 'soy',       emoji: '🫘', name_sq: 'Soja',          name_en: 'Soy',       tip_sq: 'Fillo me tofu ose qumësht soje.', tip_en: 'Start with tofu or soy milk.' },
];

export const REACTION_CONFIG: Record<AllergenReaction, { emoji: string; label_sq: string; label_en: string; color: string }> = {
  none:   { emoji: '✅', label_sq: 'Pa reagim', label_en: 'No reaction', color: '#3AAB72' },
  mild:   { emoji: '⚠️', label_sq: 'Reagim i lehtë', label_en: 'Mild reaction', color: '#F4A62C' },
  severe: { emoji: '🚨', label_sq: 'Reagim i rëndë', label_en: 'Severe reaction', color: '#E05252' },
};

async function load(): Promise<AllergenEntry[]> {
  try {
    const json = await AsyncStorage.getItem(KEY);
    return json ? (JSON.parse(json) as AllergenEntry[]) : [];
  } catch { return []; }
}

export async function getAllergenLog(): Promise<AllergenEntry[]> {
  return load();
}

export async function saveAllergenEntry(entry: AllergenEntry): Promise<void> {
  const entries = await load();
  const filtered = entries.filter((e) => e.allergenId !== entry.allergenId);
  filtered.push(entry);
  await AsyncStorage.setItem(KEY, JSON.stringify(filtered));
}

export async function removeAllergenEntry(allergenId: string): Promise<void> {
  const entries = await load();
  await AsyncStorage.setItem(KEY, JSON.stringify(entries.filter((e) => e.allergenId !== allergenId)));
}
