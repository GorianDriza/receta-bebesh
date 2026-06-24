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
  WeekPlan,
} from '../lib/planner';
import { fetchRecipes, RecipeRecord } from '../lib/recipes';
import { useAuth } from '../providers/AuthProvider';
import { useLanguage } from '../providers/LanguageProvider';

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

function todayDayKey(): DayKey {
  const d = new Date().getUTCDay(); // 0=Sun,1=Mon,...
  const map: Record<number, DayKey> = { 1: 'mon', 2: 'tue', 3: 'wed', 4: 'thu', 5: 'fri', 6: 'sat', 0: 'sun' };
  return map[d] ?? 'mon';
}

export function PlannerContent() {
  const { language } = useLanguage();
  const { user } = useAuth();

  const [weekKey, setWeekKey]     = useState(() => getISOWeekKey(new Date()));
  const [activeDay, setActiveDay] = useState<DayKey>(todayDayKey);
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

  const filteredRecipes = useMemo(() => {
    const q = pickerSearch.toLowerCase();
    return q ? recipes.filter((r) => r.title[language].toLowerCase().includes(q)) : recipes;
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

        {/* Week navigation */}
        <View style={s.weekNav}>
          <Pressable style={s.navBtn} onPress={() => setWeekKey((k) => offsetWeek(k, -1))} hitSlop={8}>
            <Text style={s.navArrow}>‹</Text>
          </Pressable>
          <Text style={s.weekLabel}>{formatWeekRange(weekKey, language)}</Text>
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
                    <View style={s.slotFilled}>
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
                      <Pressable onPress={() => removeEntry(m.key)} hitSlop={10} style={s.removeBtn}>
                        <IconButton icon="close-circle" size={20} iconColor="#E05252" style={s.icon0} />
                      </Pressable>
                    </View>
                  ) : (
                    <Pressable style={s.slotEmpty} onPress={() => openPicker(m.key)}>
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
          <Text style={s.loadingText}>
            {language === 'sq-AL' ? 'Duke ngarkuar...' : 'Loading...'}
          </Text>
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
    </>
  );
}

const s = StyleSheet.create({
  scroll: { paddingHorizontal: 18, paddingTop: 8, paddingBottom: 40, gap: 16 },

  header: {},
  title: { fontSize: 32, fontWeight: '800', letterSpacing: -1.2, color: '#111111' },

  weekNav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#FFFFFFD9', borderRadius: 18, paddingVertical: 12, paddingHorizontal: 16,
  },
  navBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  navArrow: { fontSize: 24, color: '#1A1714', fontWeight: '700' },
  weekLabel: { fontSize: 16, fontWeight: '700', color: '#1A1714' },

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
});
