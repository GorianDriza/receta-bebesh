import { startTransition, useCallback, useEffect, useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { IconButton, Surface, Text } from 'react-native-paper';

import { PlannerPickerSheet } from '../components/PlannerPickerSheet';
import { RecipeCardSkeleton } from '../components/Skeleton';
import { getDayHistory, DayHistory, markCooked, unmarkCooked } from '../lib/cookHistory';
import { addFavourite, getFavouriteIds, removeFavourite } from '../lib/favourites';
import { isFirebaseConfigured } from '../lib/firebase';
import { fetchRecipes, RecipeRecord } from '../lib/recipes';
import { computeAgeStage } from '../lib/users';
import { useAuth } from '../providers/AuthProvider';
import { useLanguage } from '../providers/LanguageProvider';
import { RecipeDetailModal } from './RecipeDetailModal';

const PALETTE = [
  { bg: '#FFEBD4', accent: '#FFCB94' },
  { bg: '#D4F0FF', accent: '#94D8FF' },
  { bg: '#E8D4FF', accent: '#C894FF' },
  { bg: '#D4FFE8', accent: '#94FFBC' },
  { bg: '#FFD4F0', accent: '#FF94D8' },
] as const;

function shuffleSlice<T>(arr: T[], count: number): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, count);
}

type Props = { onLoginRequired?: () => void };

export function QuickContent({ onLoginRequired }: Props) {
  const { language } = useLanguage();
  const { user, userProfile } = useAuth();
  const [allRecipes, setAllRecipes] = useState<RecipeRecord[]>([]);
  const [picks, setPicks]           = useState<RecipeRecord[]>([]);
  const [loading, setLoading]       = useState(false);
  const [selected, setSelected]     = useState<RecipeRecord | null>(null);
  const [plannerRecipe, setPlannerRecipe] = useState<RecipeRecord | null>(null);
  const [tick, setTick]             = useState(0);
  const [cooked, setCooked]         = useState<DayHistory>({});
  const [favouriteIds, setFavIds]   = useState<Set<string>>(new Set());
  type MealTypeFilter = 'any' | 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'puree' | 'finger-food';
  const [mealTypeFilter, setMealTypeFilter] = useState<MealTypeFilter>('any');

  useEffect(() => {
    if (!isFirebaseConfigured) return;
    setLoading(true);
    fetchRecipes()
      .then((data) => startTransition(() => setAllRecipes(data)))
      .catch(() => {})
      .finally(() => setLoading(false));
    getDayHistory().then(setCooked).catch(() => {});
  }, []);

  useEffect(() => {
    if (!user || !isFirebaseConfigured) return;
    getFavouriteIds(user.uid).then(setFavIds).catch(() => {});
  }, [user]);

  async function toggleFavourite(recipe: RecipeRecord) {
    if (!user) { onLoginRequired?.(); return; }
    const isFav = favouriteIds.has(recipe.id);
    setFavIds((prev) => { const n = new Set(prev); isFav ? n.delete(recipe.id) : n.add(recipe.id); return n; });
    try {
      if (isFav) await removeFavourite(user.uid, recipe.id);
      else await addFavourite(user.uid, recipe.id);
    } catch {
      setFavIds((prev) => { const n = new Set(prev); isFav ? n.add(recipe.id) : n.delete(recipe.id); return n; });
    }
  }

  async function toggleCooked(recipe: RecipeRecord) {
    const mealType = recipe.mealType;
    if (cooked[mealType]) {
      await unmarkCooked(mealType);
    } else {
      await markCooked(mealType, recipe.id, recipe.title[language]);
    }
    getDayHistory().then(setCooked).catch(() => {});
  }

  const ageStage = useMemo(() => {
    const bd = userProfile?.babyBirthdate;
    return bd ? computeAgeStage(bd) : null;
  }, [userProfile?.babyBirthdate]);

  const pool = useMemo(() => {
    if (!allRecipes.length) return [];
    let filtered = ageStage
      ? allRecipes.filter((r) => r.ageStage === ageStage)
      : allRecipes;
    if (mealTypeFilter !== 'any') {
      filtered = filtered.filter((r) => r.mealType === mealTypeFilter);
    }
    return filtered.length > 0 ? filtered : (ageStage ? allRecipes.filter((r) => r.ageStage === ageStage) : allRecipes);
  }, [allRecipes, ageStage, mealTypeFilter]);

  // Recompute picks whenever tick or pool changes
  useEffect(() => {
    if (pool.length) setPicks(shuffleSlice(pool, 3));
  }, [pool, tick]);

  const shuffle = useCallback(() => setTick((t) => t + 1), []);

  const emojiForType = (t: string) => {
    const m: Record<string, string> = {
      breakfast: '🍳', lunch: '🥗', dinner: '🍲',
      snack: '🍓', puree: '🥣', 'finger-food': '🫓', 'batch-prep': '🍱',
    };
    return m[t] ?? '🍽️';
  };

  return (
    <>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={s.title}>
              {language === 'sq-AL' ? 'Çfarë gatuajmë? 🔥' : "What to cook? 🔥"}
            </Text>
            <Text style={s.subtitle}>
              {ageStage
                ? (language === 'sq-AL' ? `Ide për ${ageStage}` : `Ideas for ${ageStage}`)
                : (language === 'sq-AL' ? 'Ide të shpejta' : 'Quick ideas')}
            </Text>
          </View>
          <Pressable style={s.shuffleBtn} onPress={shuffle} hitSlop={8}>
            <Text style={s.shuffleEmoji}>🔀</Text>
          </Pressable>
        </View>

        {/* Meal type filter chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterRow}>
          {([
            { id: 'any',         label: language === 'sq-AL' ? 'Të gjitha' : 'All' },
            { id: 'breakfast',   label: language === 'sq-AL' ? '🍳 Mëngjes' : '🍳 Breakfast' },
            { id: 'lunch',       label: language === 'sq-AL' ? '🥗 Drekë' : '🥗 Lunch' },
            { id: 'dinner',      label: language === 'sq-AL' ? '🍲 Darkë' : '🍲 Dinner' },
            { id: 'snack',       label: language === 'sq-AL' ? '🍓 Meze' : '🍓 Snack' },
            { id: 'puree',       label: language === 'sq-AL' ? '🥣 Pure' : '🥣 Puree' },
            { id: 'finger-food', label: language === 'sq-AL' ? '🫓 Gishta' : '🫓 Finger food' },
          ] as const).map((f) => (
            <Pressable
              key={f.id}
              style={[s.filterChip, mealTypeFilter === f.id && s.filterChipOn]}
              onPress={() => { setMealTypeFilter(f.id as MealTypeFilter); setTick((t) => t + 1); }}
            >
              <Text style={[s.filterChipText, mealTypeFilter === f.id && s.filterChipTextOn]}>
                {f.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {loading && (
          <View style={s.cardList}>
            <RecipeCardSkeleton />
            <RecipeCardSkeleton />
            <RecipeCardSkeleton />
          </View>
        )}

        {!loading && !isFirebaseConfigured && (
          <Surface style={s.noticeCard} elevation={0}>
            <Text style={s.noticeText}>
              {language === 'sq-AL'
                ? 'Firebase nuk është konfiguruar.'
                : 'Firebase not configured.'}
            </Text>
          </Surface>
        )}

        {!loading && isFirebaseConfigured && picks.length === 0 && (
          <Surface style={s.noticeCard} elevation={0}>
            <Text style={s.noticeText}>
              {language === 'sq-AL' ? 'Nuk ka receta për këtë moshë.' : 'No recipes for this age stage.'}
            </Text>
          </Surface>
        )}

        {/* Pick cards */}
        <View style={s.cardList}>
          {picks.map((recipe, i) => {
            const pal = PALETTE[i % PALETTE.length];
            const img = recipe.image?.downloadUrl ?? recipe.image?.sourceUrl ?? null;
            const dur = recipe.totalMinutes ?? recipe.prepMinutes;
            const isFav = favouriteIds.has(recipe.id);
            const isCooked = cooked[recipe.mealType]?.recipeId === recipe.id;
            return (
              <Pressable key={recipe.id} onPress={() => setSelected(recipe)}>
                <Surface style={[s.card, { backgroundColor: pal.bg }]} elevation={0}>
                  <View style={[s.cardGlow, { backgroundColor: pal.accent }]} />

                  <View style={s.cardBody}>
                    <View style={[s.stagePill, { backgroundColor: pal.accent }]}>
                      <Text style={s.stagePillText}>{recipe.ageStage}</Text>
                    </View>
                    <Text style={s.cardTitle}>{recipe.title[language]}</Text>
                    {dur != null && (
                      <View style={s.durRow}>
                        <Text style={s.durText}>⏱ {dur} min</Text>
                      </View>
                    )}
                    <View style={s.cardActions}>
                      <Pressable
                        style={[s.actionBtn, isFav && s.actionBtnFav]}
                        onPress={(e) => { e.stopPropagation(); void toggleFavourite(recipe); }}
                        hitSlop={6}
                      >
                        <Text style={s.actionBtnText}>{isFav ? '♥' : '♡'}</Text>
                      </Pressable>
                      <Pressable
                        style={s.actionBtn}
                        onPress={(e) => {
                          e.stopPropagation();
                          if (!user) { onLoginRequired?.(); return; }
                          setPlannerRecipe(recipe);
                        }}
                        hitSlop={6}
                      >
                        <Text style={s.actionBtnText}>+</Text>
                      </Pressable>
                      <Pressable
                        style={[s.actionBtn, isCooked && s.actionBtnCooked]}
                        onPress={(e) => { e.stopPropagation(); void toggleCooked(recipe); }}
                        hitSlop={6}
                      >
                        <Text style={[s.actionBtnText, isCooked && s.actionBtnTextCooked]}>
                          {isCooked ? '✓' : '○'}
                        </Text>
                      </Pressable>
                    </View>
                  </View>

                  <View style={s.imageWrap}>
                    {img ? (
                      <Image source={{ uri: img }} style={s.image} resizeMode="cover" />
                    ) : (
                      <View style={s.imagePlaceholder}>
                        <Text style={s.imagePlaceholderEmoji}>
                          {emojiForType(recipe.mealType)}
                        </Text>
                      </View>
                    )}
                  </View>
                </Surface>
              </Pressable>
            );
          })}
        </View>

        {picks.length > 0 && (
          <Pressable style={s.moreBtn} onPress={shuffle}>
            <Text style={s.moreBtnText}>
              {language === 'sq-AL' ? '🔀 Ide të reja' : '🔀 New ideas'}
            </Text>
          </Pressable>
        )}
      </ScrollView>

      <RecipeDetailModal recipe={selected} onClose={() => setSelected(null)} />
      {plannerRecipe != null && (
        <PlannerPickerSheet recipe={plannerRecipe} onClose={() => setPlannerRecipe(null)} />
      )}
    </>
  );
}

const s = StyleSheet.create({
  scroll: { paddingHorizontal: 18, paddingTop: 8, paddingBottom: 40, gap: 20 },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  title: { fontSize: 32, fontWeight: '800', letterSpacing: -1.2, color: '#111111' },
  subtitle: { marginTop: 4, fontSize: 15, color: '#6E6560' },
  shuffleBtn: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: '#FFFFFFD9',
    alignItems: 'center', justifyContent: 'center',
    marginTop: 4,
  },
  shuffleEmoji: { fontSize: 24 },

  filterRow: { gap: 8, paddingVertical: 2 },
  filterChip: {
    borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8,
    backgroundColor: '#FFFFFFD9',
  },
  filterChipOn: { backgroundColor: '#1A1714' },
  filterChipText: { fontSize: 13, fontWeight: '700', color: '#3D3530' },
  filterChipTextOn: { color: '#FFFFFF' },

  noticeCard: { borderRadius: 24, backgroundColor: '#FFFFFFD9', padding: 20 },
  noticeText: { fontSize: 16, color: '#6E6560', textAlign: 'center' },

  cardList: { gap: 16 },
  card: { borderRadius: 28, padding: 20, minHeight: 148, flexDirection: 'row', overflow: 'hidden' },
  cardGlow: {
    position: 'absolute', top: -30, right: -30,
    width: 140, height: 140, borderRadius: 70, opacity: 0.5,
  },
  cardBody: { flex: 1, gap: 10, justifyContent: 'center' },
  stagePill: {
    alignSelf: 'flex-start',
    borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5,
  },
  stagePillText: { fontSize: 12, fontWeight: '800', color: '#1A1714' },
  cardTitle: { fontSize: 20, fontWeight: '800', letterSpacing: -0.6, color: '#1A1714', lineHeight: 26 },
  durRow: { flexDirection: 'row', alignItems: 'center' },
  durText: { fontSize: 14, fontWeight: '600', color: '#4A4440' },

  cardActions: { flexDirection: 'row', gap: 8, marginTop: 4 },
  actionBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#FFFFFF88', alignItems: 'center', justifyContent: 'center' },
  actionBtnFav:    { backgroundColor: '#FFD9D9' },
  actionBtnCooked: { backgroundColor: '#6ECAC0' },
  actionBtnText:   { fontSize: 18, color: '#3A3030', fontWeight: '700', lineHeight: 22 },
  actionBtnTextCooked: { color: '#FFFFFF' },

  imageWrap: { width: 100, justifyContent: 'center', alignItems: 'center' },
  image: { width: 96, height: 96, borderRadius: 48 },
  imagePlaceholder: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: '#FFFFFF88', alignItems: 'center', justifyContent: 'center',
  },
  imagePlaceholderEmoji: { fontSize: 44 },

  moreBtn: {
    alignSelf: 'center',
    backgroundColor: '#1A1714',
    borderRadius: 999,
    paddingHorizontal: 32,
    paddingVertical: 18,
  },
  moreBtnText: { fontSize: 16, fontWeight: '800', color: '#FFFFFF' },
});
