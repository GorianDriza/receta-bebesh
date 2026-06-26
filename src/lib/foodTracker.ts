import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = '@food_tracker';

export type FoodStatus = 'untried' | 'safe' | 'reaction';

export type FoodEntry = {
  status: FoodStatus;
  triedAt?: number;
};

export type FoodTrackerMap = Record<string, FoodEntry>;

export type FoodCategory = {
  label: { sq: string; en: string };
  items: Array<{ id: string; sq: string; en: string; emoji: string }>;
};

export const FOOD_CATEGORIES: FoodCategory[] = [
  {
    label: { sq: 'Fruta', en: 'Fruits' },
    items: [
      { id: 'banana',      sq: 'Banane',        en: 'Banana',      emoji: '🍌' },
      { id: 'apple',       sq: 'Mollë',         en: 'Apple',       emoji: '🍎' },
      { id: 'pear',        sq: 'Dardhë',        en: 'Pear',        emoji: '🍐' },
      { id: 'avocado',     sq: 'Avokado',       en: 'Avocado',     emoji: '🥑' },
      { id: 'mango',       sq: 'Mango',         en: 'Mango',       emoji: '🥭' },
      { id: 'peach',       sq: 'Pjeshkë',       en: 'Peach',       emoji: '🍑' },
      { id: 'blueberry',   sq: 'Boronicë',      en: 'Blueberry',   emoji: '🫐' },
      { id: 'strawberry',  sq: 'Luleshtrydhe',  en: 'Strawberry',  emoji: '🍓' },
      { id: 'watermelon',  sq: 'Shalqi',        en: 'Watermelon',  emoji: '🍉' },
      { id: 'kiwi',        sq: 'Kivi',          en: 'Kiwi',        emoji: '🥝' },
    ],
  },
  {
    label: { sq: 'Perime', en: 'Vegetables' },
    items: [
      { id: 'sweet_potato', sq: 'Patate e ëmbël', en: 'Sweet Potato', emoji: '🍠' },
      { id: 'carrot',       sq: 'Karrota',        en: 'Carrot',       emoji: '🥕' },
      { id: 'broccoli',     sq: 'Brokoli',        en: 'Broccoli',     emoji: '🥦' },
      { id: 'pea',          sq: 'Bizele',         en: 'Peas',         emoji: '🫛' },
      { id: 'spinach',      sq: 'Spinaq',         en: 'Spinach',      emoji: '🌿' },
      { id: 'zucchini',     sq: 'Kungulleshkë',   en: 'Zucchini',     emoji: '🥒' },
      { id: 'butternut',    sq: 'Kungull',        en: 'Butternut',    emoji: '🎃' },
      { id: 'potato',       sq: 'Patate',         en: 'Potato',       emoji: '🥔' },
      { id: 'tomato',       sq: 'Domate',         en: 'Tomato',       emoji: '🍅' },
      { id: 'cucumber',     sq: 'Trangull',       en: 'Cucumber',     emoji: '🥒' },
    ],
  },
  {
    label: { sq: 'Proteina & Drithëra', en: 'Protein & Grains' },
    items: [
      { id: 'egg',        sq: 'Vezë',       en: 'Egg',      emoji: '🥚' },
      { id: 'chicken',    sq: 'Pulë',       en: 'Chicken',  emoji: '🍗' },
      { id: 'salmon',     sq: 'Salmon',     en: 'Salmon',   emoji: '🐟' },
      { id: 'lentil',     sq: 'Thjerrëza', en: 'Lentils',  emoji: '🫘' },
      { id: 'oat',        sq: 'Bollgur',    en: 'Oats',     emoji: '🌾' },
      { id: 'rice',       sq: 'Oriz',       en: 'Rice',     emoji: '🍚' },
      { id: 'quinoa',     sq: 'Kinoa',      en: 'Quinoa',   emoji: '🌾' },
      { id: 'beef',       sq: 'Mish lope',  en: 'Beef',     emoji: '🥩' },
      { id: 'peanut',     sq: 'Kikiriki',   en: 'Peanut',   emoji: '🥜' },
    ],
  },
  {
    label: { sq: 'Bulmet & Të tjera', en: 'Dairy & Other' },
    items: [
      { id: 'yogurt',     sq: 'Kos',         en: 'Yogurt',   emoji: '🥛' },
      { id: 'cheese',     sq: 'Djathë',      en: 'Cheese',   emoji: '🧀' },
      { id: 'butter',     sq: 'Gjalpë',      en: 'Butter',   emoji: '🧈' },
      { id: 'olive_oil',  sq: 'Vaj ulliri',  en: 'Olive oil',emoji: '🫒' },
      { id: 'cinnamon',   sq: 'Kanellë',     en: 'Cinnamon', emoji: '🍂' },
    ],
  },
];

async function loadAll(): Promise<FoodTrackerMap> {
  try {
    const json = await AsyncStorage.getItem(KEY);
    return json ? (JSON.parse(json) as FoodTrackerMap) : {};
  } catch {
    return {};
  }
}

export async function getFoodTracker(): Promise<FoodTrackerMap> {
  return loadAll();
}

export async function setFoodStatus(foodId: string, status: FoodStatus): Promise<void> {
  const map = await loadAll();
  if (status === 'untried') {
    delete map[foodId];
  } else {
    map[foodId] = { status, triedAt: Date.now() };
  }
  await AsyncStorage.setItem(KEY, JSON.stringify(map));
}
