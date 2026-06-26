import { useEffect, useMemo, useState } from 'react';
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconButton, Surface, Text } from 'react-native-paper';

import { SlotSkeleton } from '../components/Skeleton';
import { isFirebaseConfigured } from '../lib/firebase';
import {
  DayKey,
  DayPlan,
  getISOWeekKey,
  getWeekPlan,
  getWeekStartDate,
  offsetWeek,
  PlannerMealType,
  removePlannerEntry,
  setPlannerEntry,
  todayDayKey,
  WeekPlan,
} from '../lib/planner';
import { fetchRecipes, RecipeRecord } from '../lib/recipes';
import { addShoppingItem } from '../lib/shoppingList';
import { useAuth } from '../providers/AuthProvider';
import { useLanguage } from '../providers/LanguageProvider';
import { CookingModeModal } from './CookingModeModal';
import { RecipeDetailModal } from './RecipeDetailModal';

const DAYS: Array<{ key: DayKey; sq: string; en: string }> = [
  { key: 'mon', sq: 'Hë', en: 'Mo' },
  { key: 'tue', sq: 'Ma', en: 'Tu' },
  { key: 'wed', sq: 'Më', en: 'We' },
  { key: 'thu', sq: 'En', en: 'Th' },
  { key: 'fri', sq: 'Pr', en: 'Fr' },
  { key: 'sat', sq: 'Sh', en: 'Sa' },
  { key: 'sun', sq: 'Di', en: 'Su' },
];

const MEALS: Array<{ key: PlannerMealType; emoji: string; sq: string; en: string }> = [
  { key: 'breakfast', emoji: '🍳', sq: 'Mëngjes', en: 'Breakfast' },
  { key: 'lunch',     emoji: '🥗', sq: 'Drekë',  en: 'Lunch' },
  { key: 'dinner',    emoji: '🍲', sq: 'Darkë',  en: 'Dinner' },
  { key: 'snack',     emoji: '🍓', sq: 'Meze',   en: 'Snack' },
];

function formatWeekRange(weekKey: string, lang: string): string {
  const start = getWeekStartDate(weekKey);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 6);
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  const locale = lang === 'sq-AL' ? 'sq-AL' : 'en-US';
  return `${start.toLocaleDateString(locale, opts)} – ${end.toLocaleDateString(locale, opts)}`;
}


type Props = { onLoginRequired?: () => void };

export function PlannerContent({ onLoginRequired }: Props) {
  const { language } = useLanguage();
  const { user } = useAuth();

  const todayWeekKey = getISOWeekKey(new Date());
  const [weekKey, setWeekKey]     = useState(() => todayWeekKey);
  const [activeDay, setActiveDay] = useState<DayKey>(todayDayKey);
  const isCurrentWeek = weekKey === todayWeekKey;
  const [weekPlan, setWeekPlan]   = useState<WeekPlan>({});
  const [recipes, setRecipes]     = useState<RecipeRecord[]>([]);
  const [loading, setLoading]     = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerMeal, setPickerMeal] = useState<PlannerMealType | null>(null);
  const [pickerSearch, setPickerSearch] = useState('');

  useEffect(() => {
    if (!isFirebaseConfigured) return;
    fetchRecipes().then(setRecipes).catch(() => {});
  }, []);

  useEffect(() => {
    if (!user || !isFirebaseConfigured) return;
    setLoading(true);
    getWeekPlan(user.uid, weekKey)
      .then(setWeekPlan)
      .catch(() => setWeekPlan({}))
      .finally(() => setLoading(false));
  }, [user, weekKey]);

  const dayPlan: DayPlan = weekPlan[activeDay] ?? {};

  function openPicker(meal: PlannerMealType) {
    setPickerMeal(meal);
    setPickerSearch('');
    setPickerOpen(true);
  }

  async function assignRecipe(recipe: RecipeRecord) {
    if (!user || !pickerMeal) return;
    const entry = {
      recipeId: recipe.id,
      recipeTitle: recipe.title[language],
      recipeImage: recipe.image?.sourceUrl ?? recipe.image?.downloadUrl ?? null,
      addedAt: new Date().toISOString(),
    };
    setWeekPlan((prev) => ({
      ...prev,
      [activeDay]: { ...(prev[activeDay] ?? {}), [pickerMeal]: entry },
    }));
    setPickerOpen(false);
    await setPlannerEntry(user.uid, weekKey, activeDay, pickerMeal, entry);
  }

  async function removeEntry(meal: PlannerMealType) {
    if (!user) return;
    setWeekPlan((prev) => {
      const day = { ...(prev[activeDay] ?? {}) };
      delete day[meal];
      return { ...prev, [activeDay]: day };
    });
    await removePlannerEntry(user.uid, weekKey, activeDay, meal);
  }

  const [addedToList, setAddedToList] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeRecord | null>(null);
  const [cookingRecipe, setCookingRecipe] = useState<RecipeRecord | null>(null);
  const recipeMap = useMemo(() => new Map(recipes.map((r) => [r.id, r])), [recipes]);

  async function addWeekToShoppingList() {
    const recipeMap = new Map(recipes.map((r) => [r.id, r]));
    const seen = new Set<string>();
    const toAdd: string[] = [];
    for (const dayKey of Object.keys(weekPlan)) {
      const day = weekPlan[dayKey as DayKey] ?? {};
      for (const meal of Object.values(day)) {
        if (!meal) continue;
        const recipe = recipeMap.get(meal.recipeId);
        if (!recipe) continue;
        for (const ing of recipe.ingredients?.[language] ?? []) {
          const normalized = ing.trim();
          if (normalized && !seen.has(normalized.toLowerCase())) {
            seen.add(normalized.toLowerCase());
            toAdd.push(normalized);
          }
        }
      }
    }
    for (const item of toAdd) await addShoppingItem(item);
    setAddedToList(true);
    setTimeout(() => setAddedToList(false), 2500);
  }

  const filteredRecipes = useMemo(() => {
    if (!pickerSearch.trim()) return recipes;
    const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    const q = norm(pickerSearch);
    return recipes.filter((r) => norm(r.title[language]).includes(q));
  }, [recipes, pickerSearch, language]);

  return (
    <>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        {/* Header */}
        <View style={s.header}>
          <Text style={s.title}>
            {language === 'sq-AL' ? 'Plani Javor 📅' : 'Weekly Plan 📅'}
          </Text>
        </View>

        {/* Guest prompt */}
        {!user && (
          <Pressable style={s.guestBanner} onPress={onLoginRequired}>
            <Text style={s.guestBannerText}>
              {language === 'sq-AL'
                ? '🔒 Hyni për të ruajtur planin tuaj javor'
                : '🔒 Sign in to save your weekly plan'}
            </Text>
          </Pressable>
        )}

        {/* Week navigation */}
        <View style={s.weekNav}>
          <Pressable style={s.navBtn} onPress={() => setWeekKey((k) => offsetWeek(k, -1))} hitSlop={8}>
            <Text style={s.navArrow}>‹</Text>
          </Pressable>
          <Pressable
            style={s.weekLabelBtn}
            onPress={() => { if (!isCurrentWeek) { setWeekKey(todayWeekKey); setActiveDay(todayDayKey); } }}
            hitSlop={4}
          >
            <Text style={s.weekLabel}>{formatWeekRange(weekKey, language)}</Text>
            {!isCurrentWeek && (
              <Text style={s.todayHint}>
                {language === 'sq-AL' ? '⟳ Sot' : '⟳ Today'}
              </Text>
            )}
          </Pressable>
          <Pressable style={s.navBtn} onPress={() => setWeekKey((k) => offsetWeek(k, 1))} hitSlop={8}>
            <Text style={s.navArrow}>›</Text>
          </Pressable>
        </View>

        {/* Day selector */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.dayRow}>
          {DAYS.map((d) => {
            const hasPlan = Object.keys(weekPlan[d.key] ?? {}).length > 0;
            const isActive = activeDay === d.key;
            return (
              <Pressable
                key={d.key}
                style={[s.dayPill, isActive && s.dayPillOn]}
                onPress={() => setActiveDay(d.key)}
              >
                <Text style={[s.dayPillText, isActive && s.dayPillTextOn]}>
                  {language === 'sq-AL' ? d.sq : d.en}
                </Text>
                {hasPlan && <View style={[s.dayDot, isActive && s.dayDotOn]} />}
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Meal slots */}
        {!isFirebaseConfigured ? (
          <Surface style={s.noticeCard} elevation={0}>
            <Text style={s.noticeTitle}>
              {language === 'sq-AL' ? 'Firebase nuk është konfiguruar' : 'Firebase not configured'}
            </Text>
          </Surface>
        ) : (
          <View style={s.slotList}>
            {MEALS.map((m) => {
              const entry = dayPlan[m.key];
              return (
                <Surface key={m.key} style={s.slotCard} elevation={0}>
                  <View style={s.slotHeader}>
                    <Text style={s.slotEmoji}>{m.emoji}</Text>
                    <Text style={s.slotLabel}>{language === 'sq-AL' ? m.sq : m.en}</Text>
                  </View>
                  {entry ? (
                    <View>
                      <Pressable
                        style={s.slotFilled}
                        onPress={() => {
                          const r = recipeMap.get(entry.recipeId);
                          if (r) setSelectedRecipe(r);
                        }}
                      >
                        {entry.recipeImage ? (
                          <Image
                            source={{ uri: entry.recipeImage }}
                            style={s.slotThumb}
                            resizeMode="cover"
                          />
                        ) : (
                          <View style={[s.slotThumb, s.slotThumbEmpty]}>
                            <Text style={s.slotThumbEmoji}>{m.emoji}</Text>
                          </View>
                        )}
                        <Text style={s.slotRecipeTitle} numberOfLines={2}>
                          {entry.recipeTitle}
                        </Text>
                        <Pressable onPress={(e) => { e.stopPropagation(); removeEntry(m.key); }} hitSlop={10} style={s.removeBtn}>
                          <IconButton icon="close-circle" size={20} iconColor="#E05252" style={s.icon0} />
                        </Pressable>
                      </Pressable>
                      <Pressable
                        style={s.cookBtn}
                        onPress={() => {
                          const r = recipeMap.get(entry.recipeId);
                          if (r) setCookingRecipe(r);
                        }}
                      >
                        <Text style={s.cookBtnText}>
                          {language === 'sq-AL' ? '🍳 Gatiho tani' : '🍳 Cook now'}
                        </Text>
                      </Pressable>
                    </View>
                  ) : (
                    <Pressable
                      style={s.slotEmpty}
                      onPress={() => { if (!user) { onLoginRequired?.(); return; } openPicker(m.key); }}
                    >
                      <IconButton icon="plus-circle-outline" size={22} iconColor="#6ECAC0" style={s.icon0} />
                      <Text style={s.slotEmptyText}>
                        {language === 'sq-AL' ? 'Shto recetë' : 'Add recipe'}
                      </Text>
                    </Pressable>
                  )}
                </Surface>
              );
            })}
          </View>
        )}

        {loading && (
          <View style={s.slotList}>
            <SlotSkeleton />
            <SlotSkeleton />
            <SlotSkeleton />
          </View>
        )}

        {/* Add week to shopping list */}
        {user && Object.values(weekPlan).some((d) => d && Object.keys(d).length > 0) && (
          <Pressable
            style={[s.shoppingBtn, addedToList && s.shoppingBtnDone]}
            onPress={addWeekToShoppingList}
          >
            <Text style={s.shoppingBtnText}>
              {addedToList
                ? (language === 'sq-AL' ? '✓ Shtuar në listë!' : '✓ Added to list!')
                : (language === 'sq-AL' ? '🛒 Shto ingredientet e javës' : '🛒 Add week ingredients to list')}
            </Text>
          </Pressable>
        )}
      </ScrollView>

      {/* Recipe picker modal */}
      <Modal
        visible={pickerOpen}
        animationType="slide"
        presentationStyle="formSheet"
        onRequestClose={() => setPickerOpen(false)}
      >
        <SafeAreaView style={s.pickerRoot}>
          <View style={s.pickerTopBar}>
            <Text style={s.pickerTitle}>
              {language === 'sq-AL' ? 'Zgjidh recetë' : 'Pick a recipe'}
            </Text>
            <Pressable onPress={() => setPickerOpen(false)} hitSlop={8} style={s.pickerClose}>
              <Text style={s.pickerCloseText}>✕</Text>
            </Pressable>
          </View>
          <View style={s.pickerSearch}>
            <Text style={s.searchIcon}>🔍</Text>
            <TextInput
              value={pickerSearch}
              onChangeText={setPickerSearch}
              placeholder={language === 'sq-AL' ? 'Kërko...' : 'Search...'}
              placeholderTextColor="#B0A9A3"
              style={s.pickerSearchInput}
            />
          </View>
          <ScrollView contentContainerStyle={s.pickerList}>
            {filteredRecipes.map((r) => {
              const imgUrl = r.image?.sourceUrl ?? r.image?.downloadUrl ?? null;
              return (
                <Pressable key={r.id} style={s.pickerItem} onPress={() => assignRecipe(r)}>
                  {imgUrl ? (
                    <Image source={{ uri: imgUrl }} style={s.pickerThumb} resizeMode="cover" />
                  ) : (
                    <View style={[s.pickerThumb, s.pickerThumbEmpty]}>
                      <Text style={{ fontSize: 22 }}>🍽️</Text>
                    </View>
                  )}
                  <View style={s.pickerItemText}>
                    <Text style={s.pickerItemTitle} numberOfLines={2}>{r.title[language]}</Text>
                    <Text style={s.pickerItemMeta}>{r.ageStage}</Text>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      <RecipeDetailModal recipe={selectedRecipe} onClose={() => setSelectedRecipe(null)} />
      {cookingRecipe != null && (
        <CookingModeModal recipe={cookingRecipe} visible={true} onClose={() => setCookingRecipe(null)} />
      )}
    </>
  );
}

const s = StyleSheet.create({
  scroll: { paddingHorizontal: 18, paddingTop: 8, paddingBottom: 40, gap: 16 },

  header: {},
  title: { fontSize: 32, fontWeight: '800', letterSpacing: -1.2, color: '#111111' },

  guestBanner: {
    backgroundColor: '#FFF9E0', borderRadius: 18,
    paddingHorizontal: 18, paddingVertical: 14,
    borderWidth: 1, borderColor: '#FFE57A',
  },
  guestBannerText: { fontSize: 15, fontWeight: '700', color: '#7A6200', textAlign: 'center' },

  weekNav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#FFFFFFD9', borderRadius: 18, paddingVertical: 12, paddingHorizontal: 16,
  },
  navBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  navArrow: { fontSize: 24, color: '#1A1714', fontWeight: '700' },
  weekLabelBtn: { flex: 1, alignItems: 'center', gap: 2 },
  weekLabel: { fontSize: 16, fontWeight: '700', color: '#1A1714' },
  todayHint: { fontSize: 12, fontWeight: '700', color: '#6ECAC0' },

  dayRow: { gap: 8, paddingVertical: 4 },
  dayPill: {
    borderRadius: 999, paddingHorizontal: 18, paddingVertical: 10,
    backgroundColor: '#FFFFFFD9', alignItems: 'center', gap: 4,
  },
  dayPillOn: { backgroundColor: '#1A1714' },
  dayPillText: { fontSize: 14, fontWeight: '700', color: '#3D3530' },
  dayPillTextOn: { color: '#FFFFFF' },
  dayDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#6ECAC0' },
  dayDotOn: { backgroundColor: '#FFFFFF' },

  slotList: { gap: 12 },
  slotCard: {
    borderRadius: 24, backgroundColor: '#FFFFFF',
    padding: 16, gap: 10,
    shadowColor: '#1A1330', shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },
  slotHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  slotEmoji: { fontSize: 20 },
  slotLabel: { fontSize: 16, fontWeight: '800', color: '#1A1714' },

  slotFilled: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  slotThumb: { width: 64, height: 64, borderRadius: 14, overflow: 'hidden' },
  slotThumbEmpty: { backgroundColor: '#F0EEF5', alignItems: 'center', justifyContent: 'center' },
  slotThumbEmoji: { fontSize: 28 },
  slotRecipeTitle: { flex: 1, fontSize: 15, fontWeight: '700', color: '#1A1714', lineHeight: 20 },
  removeBtn: {},

  slotEmpty: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 10, paddingHorizontal: 4,
  },
  slotEmptyText: { fontSize: 15, color: '#6ECAC0', fontWeight: '600' },

  cookBtn: {
    marginTop: 8, borderRadius: 999, backgroundColor: '#E8FAF8',
    paddingVertical: 10, alignItems: 'center',
    borderWidth: 1, borderColor: '#98E8AA',
  },
  cookBtnText: { fontSize: 14, fontWeight: '700', color: '#2A6B66' },

  icon0: { margin: 0 },

  noticeCard: { borderRadius: 24, backgroundColor: '#FFFFFFD9', padding: 16 },
  noticeTitle: { fontSize: 16, fontWeight: '700', color: '#111111' },
  loadingText: { textAlign: 'center', fontSize: 14, color: '#9E9590' },

  // Picker
  pickerRoot: { flex: 1, backgroundColor: '#FFF9F5' },
  pickerTopBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16,
  },
  pickerTitle: { fontSize: 20, fontWeight: '800', color: '#1A1714' },
  pickerClose: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  pickerCloseText: { fontSize: 18, color: '#6E6560' },
  pickerSearch: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 20, marginBottom: 12,
    backgroundColor: '#FFFFFF', borderRadius: 16, paddingHorizontal: 14, height: 48, gap: 8,
  },
  searchIcon: { fontSize: 16 },
  pickerSearchInput: { flex: 1, fontSize: 16, color: '#1A1714' },
  pickerList: { paddingHorizontal: 20, gap: 10, paddingBottom: 40 },
  pickerItem: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: '#FFFFFF', borderRadius: 18, padding: 12,
  },
  pickerThumb: { width: 56, height: 56, borderRadius: 12, overflow: 'hidden' },
  pickerThumbEmpty: { backgroundColor: '#F0EEF5', alignItems: 'center', justifyContent: 'center' },
  pickerItemText: { flex: 1 },
  pickerItemTitle: { fontSize: 15, fontWeight: '700', color: '#1A1714', lineHeight: 20 },
  pickerItemMeta: { fontSize: 13, color: '#9E9590', marginTop: 2 },

  shoppingBtn: { borderRadius: 999, backgroundColor: '#E8FAF8', borderWidth: 1, borderColor: '#98E8AA', paddingVertical: 16, alignItems: 'center' },
  shoppingBtnDone: { backgroundColor: '#6ECAC0', borderColor: '#6ECAC0' },
  shoppingBtnText: { fontSize: 16, fontWeight: '700', color: '#2A6B66' },
});
