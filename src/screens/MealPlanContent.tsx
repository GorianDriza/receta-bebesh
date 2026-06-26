import { startTransition, useEffect, useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { IconButton, Surface, Text } from 'react-native-paper';

import { MilestoneBanner } from '../components/MilestoneBanner';
import { PlannerPickerSheet } from '../components/PlannerPickerSheet';
import { RecipeCardSkeleton } from '../components/Skeleton';
import { isFirebaseConfigured } from '../lib/firebase';
import { addFavourite, getFavouriteIds, removeFavourite } from '../lib/favourites';
import { fetchRecipes, getRecipeCacheMeta, RecipeRecord, RecipeStage } from '../lib/recipes';
import { getAllRatings } from '../lib/ratings';
import { getReactionTerms } from '../lib/foodTracker';
import { getRecentlyCookedIds } from '../lib/cookHistory';
import { getUncheckedCount } from '../lib/shoppingList';
import { computeAgeStage } from '../lib/users';
import { AIPlanModal } from './AIPlanModal';
import { useAuth } from '../providers/AuthProvider';
import { useLanguage } from '../providers/LanguageProvider';
import { RecipeDetailModal } from './RecipeDetailModal';

const PALETTE = [
  { bg: '#E5FF9A', accent: '#D4F768' },
  { bg: '#CFFFD6', accent: '#B7F4C2' },
  { bg: '#D9CCFF', accent: '#C7B7FB' },
  { bg: '#FFD9AE', accent: '#FFC681' },
  { bg: '#FFF19D', accent: '#FFE25A' },
] as const;

function paletteFor(index: number) { return PALETTE[index % PALETTE.length]; }

function emojiForMealType(mealType: string): string {
  const map: Record<string, string> = {
    breakfast: '🍳', lunch: '🥗', dinner: '🍲',
    snack: '🍓', puree: '🥣', 'finger-food': '🫓', 'batch-prep': '🍱',
  };
  return map[mealType] ?? '🍽️';
}

function durationLabel(r: RecipeRecord): string {
  const mins = r.totalMinutes ?? r.prepMinutes ?? null;
  return mins != null ? `${mins} min` : '';
}

type FilterId = RecipeStage | 'all' | 'fav' | 'rated';
type MealFilter = RecipeRecord['mealType'] | 'any';
type TimeFilter = 'any' | 'quick' | 'medium';

type Props = { onAvatarPress?: () => void; onLoginRequired?: () => void; onShoppingPress?: () => void };

export function MealPlanContent({ onAvatarPress, onLoginRequired, onShoppingPress }: Props) {
  const { language, t } = useLanguage();
  const { user, userProfile } = useAuth();

  const [recipes, setRecipes]         = useState<RecipeRecord[]>([]);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [cacheDate, setCacheDate]     = useState<number | null>(null);
  const [selected, setSelected]       = useState<RecipeRecord | null>(null);
  const [favouriteIds, setFavIds]     = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [plannerRecipe, setPlannerRecipe] = useState<RecipeRecord | null>(null);
  const [ratingsMap, setRatingsMap]   = useState<Record<string, number>>({});
  const [recentIds, setRecentIds]         = useState<string[]>([]);
  const [cartCount, setCartCount]         = useState(0);
  const [reactionTerms, setReactionTerms] = useState<string[]>([]);
  const [reactionCount, setReactionCount] = useState(0);
  const [hideAllergens, setHideAllergens] = useState(false);
  const [aiPlanOpen, setAiPlanOpen]       = useState(false);

  const defaultFilter = useMemo<FilterId>(() => {
    const bd = userProfile?.babyBirthdate;
    return bd ? computeAgeStage(bd) : 'all';
  }, [userProfile?.babyBirthdate]);

  const [ageFilter, setAgeFilter]   = useState<FilterId>(defaultFilter);
  const [mealFilter, setMealFilter] = useState<MealFilter>('any');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('any');
  const [showAll, setShowAll]       = useState(false);

  // Re-apply default when profile loads
  useEffect(() => {
    setAgeFilter(defaultFilter);
  }, [defaultFilter]);

  useEffect(() => {
    if (!isFirebaseConfigured) return;
    let mounted = true;
    setLoading(true);
    setError(null);
    fetchRecipes()
      .then((data) => {
        if (mounted) startTransition(() => setRecipes(data));
        getRecipeCacheMeta().then((meta) => { if (mounted && meta) setCacheDate(meta.cachedAt); }).catch(() => {});
      })
      .catch((err) => { if (mounted) setError(err instanceof Error ? err.message : 'Could not load recipes.'); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!user || !isFirebaseConfigured) return;
    getFavouriteIds(user.uid).then(setFavIds).catch(() => {});
  }, [user]);

  useEffect(() => {
    getAllRatings().then((map) => {
      const stars: Record<string, number> = {};
      for (const [id, r] of Object.entries(map)) stars[id] = r.stars;
      setRatingsMap(stars);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    getReactionTerms().then(({ terms, count }) => {
      setReactionTerms(terms);
      setReactionCount(count);
    }).catch(() => {});
    getRecentlyCookedIds().then(setRecentIds).catch(() => {});
    getUncheckedCount().then(setCartCount).catch(() => {});
  }, []);

  async function toggleFavourite(recipe: RecipeRecord) {
    if (!user) { onLoginRequired?.(); return; }
    const isFav = favouriteIds.has(recipe.id);
    // Optimistic UI
    setFavIds((prev) => {
      const next = new Set(prev);
      if (isFav) next.delete(recipe.id); else next.add(recipe.id);
      return next;
    });
    try {
      if (isFav) await removeFavourite(user.uid, recipe.id);
      else await addFavourite(user.uid, recipe.id);
    } catch {
      // Revert on failure
      setFavIds((prev) => {
        const next = new Set(prev);
        if (isFav) next.add(recipe.id); else next.delete(recipe.id);
        return next;
      });
    }
  }

  const displayed = useMemo(() => {
    let filtered = recipes;
    if (ageFilter === 'fav') {
      filtered = filtered.filter((r) => favouriteIds.has(r.id));
    } else if (ageFilter === 'rated') {
      filtered = filtered.filter((r) => (ratingsMap[r.id] ?? 0) > 0);
    } else if (ageFilter !== 'all') {
      filtered = filtered.filter((r) => r.ageStage === ageFilter);
    }
    if (mealFilter !== 'any') {
      filtered = filtered.filter((r) => r.mealType === mealFilter);
    }
    if (timeFilter === 'quick') {
      filtered = filtered.filter((r) => (r.totalMinutes ?? r.prepMinutes ?? 999) <= 15);
    } else if (timeFilter === 'medium') {
      filtered = filtered.filter((r) => (r.totalMinutes ?? r.prepMinutes ?? 999) <= 30);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((r) => r.title[language].toLowerCase().includes(q));
    }
    if (hideAllergens && reactionTerms.length > 0) {
      filtered = filtered.filter((r) => {
        const allText = [
          ...(r.ingredients?.['sq-AL'] ?? []),
          ...(r.ingredients?.en ?? []),
        ].map((s) => s.toLowerCase()).join(' ');
        return !reactionTerms.some((term) => allText.includes(term));
      });
    }
    return showAll ? filtered : filtered.slice(0, 5);
  }, [recipes, ageFilter, mealFilter, timeFilter, favouriteIds, ratingsMap, searchQuery, language, showAll, hideAllergens, reactionTerms]);

  const babyLabel = (() => {
    const bn = userProfile?.babyName;
    const bd = userProfile?.babyBirthdate;
    if (bn && bd) {
      const birth = new Date(bd);
      const months =
        (new Date().getFullYear() - birth.getFullYear()) * 12 +
        (new Date().getMonth() - birth.getMonth());
      const age =
        months < 12
          ? language === 'sq-AL' ? `${months} muaj` : `${months}m`
          : language === 'sq-AL' ? `${Math.floor(months / 12)} vjeç` : `${Math.floor(months / 12)}y`;
      return `${bn} · ${age}`;
    }
    return null;
  })();

  const babyAgeMonths = (() => {
    const bd = userProfile?.babyBirthdate;
    if (!bd) return 6;
    const birth = new Date(bd);
    return (new Date().getFullYear() - birth.getFullYear()) * 12 + (new Date().getMonth() - birth.getMonth());
  })();

  const FILTERS: Array<{ id: FilterId; label: string }> = [
    { id: 'all',   label: language === 'sq-AL' ? 'Të gjitha' : 'All' },
    { id: '4-6m',  label: '4-6m' },
    { id: '6-8m',  label: '6-8m' },
    { id: '9-12m', label: '9-12m' },
    { id: '12m+',  label: '12m+' },
    { id: 'fav',   label: language === 'sq-AL' ? '♡ Ruajtura' : '♡ Saved' },
    { id: 'rated', label: language === 'sq-AL' ? '⭐ Vlerësuara' : '⭐ Rated' },
  ];

  const TIME_FILTERS: Array<{ id: TimeFilter; label: string }> = [
    { id: 'any',    label: language === 'sq-AL' ? 'Çdo kohë' : 'Any time' },
    { id: 'quick',  label: language === 'sq-AL' ? '⚡ <15 min' : '⚡ <15 min' },
    { id: 'medium', label: language === 'sq-AL' ? '🕐 <30 min' : '🕐 <30 min' },
  ];

  const MEAL_FILTERS: Array<{ id: MealFilter; label: string }> = [
    { id: 'any',         label: language === 'sq-AL' ? 'Çdo vakt' : 'Any meal' },
    { id: 'breakfast',   label: language === 'sq-AL' ? '🍳 Mëngjes' : '🍳 Breakfast' },
    { id: 'lunch',       label: language === 'sq-AL' ? '🥗 Drekë' : '🥗 Lunch' },
    { id: 'dinner',      label: language === 'sq-AL' ? '🍲 Darkë' : '🍲 Dinner' },
    { id: 'snack',       label: language === 'sq-AL' ? '🍓 Meze' : '🍓 Snack' },
    { id: 'puree',       label: language === 'sq-AL' ? '🥣 Pure' : '🥣 Puree' },
    { id: 'finger-food', label: language === 'sq-AL' ? '🫓 Gishta' : '🫓 Finger food' },
  ];

  return (
    <>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        {/* ── Header ── */}
        <View style={s.header}>
          <View style={s.headerCopy}>
            <Text style={s.screenTitle}>{t[language].home.title}</Text>
            {babyLabel != null ? (
              <Text style={s.screenSub}>👶 {babyLabel}</Text>
            ) : (
              <Text style={s.screenSub}>{t[language].home.subtitle}</Text>
            )}
          </View>
          <Pressable style={s.cartBtn} onPress={() => {
            onShoppingPress?.();
            setTimeout(() => getUncheckedCount().then(setCartCount).catch(() => {}), 500);
          }} hitSlop={8}>
            <Text style={s.cartIcon}>🛒</Text>
            {cartCount > 0 && (
              <View style={s.cartBadge}>
                <Text style={s.cartBadgeText}>{cartCount > 9 ? '9+' : cartCount}</Text>
              </View>
            )}
          </Pressable>
          <Pressable style={s.avatarBtn} onPress={onAvatarPress} hitSlop={8}>
            {userProfile?.photoBase64 ? (
              <Image source={{ uri: userProfile.photoBase64 }} style={s.avatarPhoto} />
            ) : user ? (
              <Text style={s.avatarInitials}>
                {(userProfile?.displayName ?? user.displayName ?? '?')
                  .split(' ')
                  .map((w) => w[0]?.toUpperCase() ?? '')
                  .slice(0, 2)
                  .join('')}
              </Text>
            ) : (
              <IconButton icon="account-circle-outline" size={24} iconColor="#FFFFFF" style={s.icon0} />
            )}
          </Pressable>
        </View>

        {/* ── Hero card ── */}
        <Surface style={s.heroCard} elevation={0}>
          <View style={s.heroGlowLarge} />
          <View style={s.heroGlowSmall} />
          <View style={s.heroCopy}>
            {userProfile?.babyName ? (
              <>
                <Text style={s.heroEyebrow}>
                  {language === 'sq-AL' ? `Për ${userProfile.babyName} 👶` : `For ${userProfile.babyName} 👶`}
                </Text>
                <Text style={s.heroBody}>
                  {language === 'sq-AL'
                    ? 'Recetat janë filtruar sipas moshës së bebës tuaj.'
                    : "Recipes filtered for your baby's age stage."}
                </Text>
                <Pressable style={s.heroBtn} onPress={onAvatarPress}>
                  <Text style={s.heroBtnLabel}>
                    {language === 'sq-AL' ? 'Ndrysho profilin' : 'Edit profile'}
                  </Text>
                </Pressable>
              </>
            ) : user ? (
              <>
                <Text style={s.heroEyebrow}>
                  {language === 'sq-AL' ? 'Personalizo planin 🍽️' : 'Personalize your plan 🍽️'}
                </Text>
                <Text style={s.heroBody}>
                  {language === 'sq-AL'
                    ? 'Shto emrin dhe datëlindjen e bebës për receta sipas moshës.'
                    : "Add your baby's name and birthdate for age-matched recipes."}
                </Text>
                <Pressable style={s.heroBtn} onPress={onAvatarPress}>
                  <Text style={s.heroBtnLabel}>
                    {language === 'sq-AL' ? 'Plotëso profilin' : 'Complete profile'}
                  </Text>
                </Pressable>
              </>
            ) : (
              <>
                <Text style={s.heroEyebrow}>
                  {language === 'sq-AL' ? 'Receta për bebën tuaj 👶' : 'Recipes for your baby 👶'}
                </Text>
                <Text style={s.heroBody}>
                  {language === 'sq-AL'
                    ? 'Hyni për të personalizuar recetat sipas moshës së bebës.'
                    : 'Sign in to get age-matched recipes for your baby.'}
                </Text>
                <Pressable style={s.heroBtn} onPress={onLoginRequired}>
                  <Text style={s.heroBtnLabel}>
                    {language === 'sq-AL' ? 'Hyni' : 'Sign in'}
                  </Text>
                </Pressable>
              </>
            )}
          </View>
          <View style={s.heroArt}>
            <View style={s.chefBubble}><Text style={s.chefEmoji}>👩‍🍳</Text></View>
            <View style={s.snackRow}>
              {['🥕', '🍲', '🥣'].map((e) => (
                <View key={e} style={s.snack}><Text style={s.snackEmoji}>{e}</Text></View>
              ))}
            </View>
          </View>
        </Surface>

        {/* ── Milestone banner ── */}
        {userProfile?.babyBirthdate != null && (
          <MilestoneBanner babyBirthdate={userProfile.babyBirthdate} language={language} />
        )}

        {/* ── Recently cooked ── */}
        {recentIds.length > 0 && (() => {
          const recipeMap = new Map(recipes.map((r) => [r.id, r]));
          const recent = recentIds.map((id) => recipeMap.get(id)).filter((r): r is RecipeRecord => r != null);
          if (recent.length === 0) return null;
          return (
            <View style={s.recentSection}>
              <Text style={s.recentHeading}>
                {language === 'sq-AL' ? '🍳 Gatuat Fundit' : '🍳 Recently Cooked'}
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.recentRow}>
                {recent.map((recipe) => {
                  const img = recipe.image?.downloadUrl ?? recipe.image?.sourceUrl ?? null;
                  return (
                    <Pressable key={recipe.id} style={s.recentCard} onPress={() => setSelected(recipe)}>
                      {img ? (
                        <Image source={{ uri: img }} style={s.recentImg} resizeMode="cover" />
                      ) : (
                        <View style={[s.recentImg, s.recentImgEmpty]}>
                          <Text style={s.recentEmoji}>{emojiForMealType(recipe.mealType)}</Text>
                        </View>
                      )}
                      <Text style={s.recentTitle} numberOfLines={2}>{recipe.title[language]}</Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          );
        })()}

        {/* ── Section header ── */}
        <View style={s.sectionRow}>
          <View>
            <Text style={s.sectionTitle}>
              {language === 'sq-AL' ? 'Recetat' : 'Recipes'}
              {recipes.length > 0 && <Text style={s.recipeCount}> ({recipes.length})</Text>}
            </Text>
            {cacheDate != null && (
              <Text style={s.cacheHint}>
                {language === 'sq-AL' ? '📦 Ruajtur lokalisht' : '📦 Loaded from cache'}
              </Text>
            )}
          </View>
          <View style={s.sectionActions}>
            {recipes.length > 0 && (
              <Pressable style={s.aiBtn} onPress={() => setAiPlanOpen(true)} hitSlop={8}>
                <Text style={s.aiBtnLabel}>✨ AI</Text>
              </Pressable>
            )}
            <Pressable onPress={() => setShowAll((v) => !v)} hitSlop={8}>
              <Text style={s.seeAll}>
                {showAll
                  ? (language === 'sq-AL' ? 'Më pak' : 'Less')
                  : t[language].common.seeAll}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* ── Search bar ── */}
        <View style={s.searchBar}>
          <Text style={s.searchIcon}>🔍</Text>
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={language === 'sq-AL' ? 'Kërko receta...' : 'Search recipes...'}
            placeholderTextColor="#B0A9A3"
            style={s.searchInput}
          />
          {searchQuery !== '' && (
            <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
              <Text style={s.searchClear}>✕</Text>
            </Pressable>
          )}
        </View>

        {/* ── Age filter chips ── */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterRow}>
          {FILTERS.map((f) => (
            <Pressable
              key={f.id}
              style={[s.filterChip, ageFilter === f.id && s.filterChipOn]}
              onPress={() => { setAgeFilter(f.id); setShowAll(false); }}
            >
              <Text style={[s.filterChipText, ageFilter === f.id && s.filterChipTextOn]}>
                {f.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* ── Meal type filter chips ── */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterRow}>
          {MEAL_FILTERS.map((f) => (
            <Pressable
              key={f.id}
              style={[s.filterChip, s.filterChipSmall, mealFilter === f.id && s.filterChipOn]}
              onPress={() => { setMealFilter(f.id); setShowAll(false); }}
            >
              <Text style={[s.filterChipText, s.filterChipTextSmall, mealFilter === f.id && s.filterChipTextOn]}>
                {f.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* ── Time filter chips ── */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterRow}>
          {TIME_FILTERS.map((f) => (
            <Pressable
              key={f.id}
              style={[s.filterChip, s.filterChipSmall, timeFilter === f.id && s.filterChipOn]}
              onPress={() => { setTimeFilter(f.id); setShowAll(false); }}
            >
              <Text style={[s.filterChipText, s.filterChipTextSmall, timeFilter === f.id && s.filterChipTextOn]}>
                {f.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* ── Allergen filter toggle ── */}
        {reactionCount > 0 && (
          <Pressable
            style={[s.allergenChip, hideAllergens && s.allergenChipOn]}
            onPress={() => { setHideAllergens((v) => !v); setShowAll(false); }}
          >
            <Text style={[s.allergenChipText, hideAllergens && s.allergenChipTextOn]}>
              {hideAllergens
                ? (language === 'sq-AL' ? `🚫 Duke fshehur ${reactionCount} alergjene` : `🚫 Hiding ${reactionCount} allergen${reactionCount > 1 ? 's' : ''}`)
                : (language === 'sq-AL' ? `🚫 Fshih alergjenët (${reactionCount})` : `🚫 Hide allergens (${reactionCount})`)}
            </Text>
          </Pressable>
        )}

        {/* ── States ── */}
        {loading && (
          <View style={s.cardStack}>
            <RecipeCardSkeleton />
            <RecipeCardSkeleton />
            <RecipeCardSkeleton />
          </View>
        )}
        {error != null && (
          <Surface style={s.noticeCard} elevation={0}>
            <Text style={s.noticeTitle}>{t[language].common.recipeSyncUnavailable}</Text>
            <Text style={s.noticeBody}>{error}</Text>
          </Surface>
        )}
        {!loading && error == null && recipes.length === 0 && (
          <Surface style={s.noticeCard} elevation={0}>
            <Text style={s.noticeTitle}>
              {language === 'sq-AL' ? 'Nuk ka receta ende' : 'No recipes yet'}
            </Text>
            <Text style={s.noticeBody}>
              {language === 'sq-AL'
                ? 'Ekzekuto skriptën e importit: npm run import:babyfoode -- --limit=50'
                : 'Run the import script: npm run import:babyfoode -- --limit=50'}
            </Text>
          </Surface>
        )}
        {!loading && error == null && recipes.length > 0 && displayed.length === 0 && (
          <Surface style={s.noticeCard} elevation={0}>
            <Text style={s.noticeTitle}>
              {language === 'sq-AL' ? 'Nuk ka rezultate' : 'No results'}
            </Text>
            <Text style={s.noticeBody}>
              {ageFilter === 'fav'
                ? (language === 'sq-AL' ? 'Nuk keni receta të ruajtura ende.' : 'No saved recipes yet.')
                : (language === 'sq-AL' ? 'Nuk ka receta për këtë filtër.' : 'No recipes for this filter.')}
            </Text>
          </Surface>
        )}

        {/* ── Recipe cards ── */}
        <View style={s.cardStack}>
          {displayed.map((recipe, i) => {
            const p = paletteFor(i);
            const imgUrl = recipe.image?.downloadUrl ?? recipe.image?.sourceUrl ?? null;
            const dur = durationLabel(recipe);
            const isFav = favouriteIds.has(recipe.id);
            return (
              <Animated.View key={recipe.id} entering={FadeInDown.delay(i * 70).springify().damping(14)}>
                <Pressable onPress={() => setSelected(recipe)}>
                  <Surface style={[s.mealCard, { backgroundColor: p.bg }]} elevation={0}>
                    <View style={[s.mealSquare, { backgroundColor: p.accent }]} />
                    <View style={[s.mealPill,   { backgroundColor: `${p.accent}CC` }]} />

                    <View style={s.mealActions}>
                      <Pressable
                        style={s.actionBubble}
                        onPress={(e) => { e.stopPropagation(); void toggleFavourite(recipe); }}
                        hitSlop={8}
                      >
                        <IconButton
                          icon={isFav ? 'heart' : 'heart-outline'}
                          size={18}
                          iconColor={isFav ? '#E05252' : '#111'}
                          style={s.icon0}
                        />
                      </Pressable>
                      <Pressable
                        style={s.actionBubble}
                        onPress={(e) => {
                          e.stopPropagation();
                          if (!user) { onLoginRequired?.(); return; }
                          setPlannerRecipe(recipe);
                        }}
                        hitSlop={8}
                      >
                        <IconButton icon="plus" size={22} iconColor="#111" style={s.icon0} />
                      </Pressable>
                    </View>

                    <View style={s.mealInfo}>
                      {ageFilter === 'all' && (
                        <View style={[s.stagePill, { backgroundColor: `${p.accent}CC` }]}>
                          <Text style={s.stagePillText}>{recipe.ageStage}</Text>
                        </View>
                      )}
                      <Text style={s.mealTitle}>{recipe.title[language]}</Text>
                      <View style={s.mealMetaRow}>
                        {dur !== '' && (
                          <View style={s.durationPill}>
                            <IconButton icon="clock-time-four-outline" size={16} iconColor="#111" style={s.icon0} />
                            <Text style={s.durationText}>{dur}</Text>
                          </View>
                        )}
                        {(ratingsMap[recipe.id] ?? 0) > 0 && (
                          <View style={s.ratingPill}>
                            <Text style={s.ratingPillText}>{'★'.repeat(ratingsMap[recipe.id])}</Text>
                          </View>
                        )}
                      </View>
                    </View>

                    <View style={s.platePos}>
                      <View style={s.plateShadow} />
                      <View style={s.plateCircle}>
                        {imgUrl != null ? (
                          <Image source={{ uri: imgUrl }} style={s.plateImg} resizeMode="cover" />
                        ) : (
                          <Text style={s.plateEmoji}>{emojiForMealType(recipe.mealType)}</Text>
                        )}
                      </View>
                    </View>
                  </Surface>
                </Pressable>
              </Animated.View>
            );
          })}
        </View>
      </ScrollView>

      <RecipeDetailModal recipe={selected} onClose={() => {
        setSelected(null);
        getAllRatings().then((map) => {
          const stars: Record<string, number> = {};
          for (const [id, r] of Object.entries(map)) stars[id] = r.stars;
          setRatingsMap(stars);
        }).catch(() => {});
        getReactionTerms().then(({ terms, count }) => {
          setReactionTerms(terms);
          setReactionCount(count);
        }).catch(() => {});
        getUncheckedCount().then(setCartCount).catch(() => {});
      }} />
      {plannerRecipe != null && (
        <PlannerPickerSheet
          recipe={plannerRecipe}
          onClose={() => setPlannerRecipe(null)}
        />
      )}
      <AIPlanModal
        visible={aiPlanOpen}
        onClose={() => setAiPlanOpen(false)}
        recipes={recipes}
        babyAgeMonths={babyAgeMonths}
      />
    </>
  );
}

const s = StyleSheet.create({
  scroll: { paddingHorizontal: 18, paddingTop: 8, paddingBottom: 20, gap: 18 },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  headerCopy: { flex: 1 },
  screenTitle: { fontSize: 38, lineHeight: 42, fontWeight: '800', letterSpacing: -1.4, color: '#111111' },
  screenSub: { marginTop: 6, fontSize: 15, lineHeight: 22, color: '#686074', maxWidth: 250 },
  cartBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#FFFFFF44',
    alignItems: 'center', justifyContent: 'center',
    marginTop: 4,
  },
  cartIcon: { fontSize: 22 },
  cartBadge: {
    position: 'absolute', top: 2, right: 2,
    minWidth: 18, height: 18, borderRadius: 9,
    backgroundColor: '#E05252', alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 3,
  },
  cartBadgeText: { fontSize: 10, fontWeight: '800', color: '#FFFFFF' },
  avatarBtn: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: '#6ECAC0',
    alignItems: 'center', justifyContent: 'center',
    marginTop: 4,
  },
  avatarInitials: { fontSize: 16, fontWeight: '800', color: '#FFFFFF' },
  avatarPhoto: { width: 48, height: 48, borderRadius: 24 },

  heroCard:      { borderRadius: 30, backgroundColor: '#FFF5A7', padding: 20, flexDirection: 'row', overflow: 'hidden', minHeight: 198 },
  heroGlowLarge: { position: 'absolute', right: -30, top: 10, width: 160, height: 160, borderRadius: 80, backgroundColor: '#FFE679', opacity: 0.55 },
  heroGlowSmall: { position: 'absolute', left: -25, bottom: -30, width: 120, height: 120, borderRadius: 60, backgroundColor: '#FFFCE0', opacity: 0.9 },
  heroCopy:      { flex: 1, justifyContent: 'space-between', paddingRight: 12, zIndex: 1 },
  heroEyebrow:   { fontSize: 28, lineHeight: 31, fontWeight: '800', letterSpacing: -1.1, color: '#111111' },
  heroBody:      { marginTop: 10, fontSize: 15, lineHeight: 22, color: '#4B4328', maxWidth: 215 },
  heroMeta:      { marginTop: 8, fontSize: 13, lineHeight: 18, color: '#6A5C1D' },
  heroBtn:       { alignSelf: 'flex-start', marginTop: 16, borderRadius: 999, backgroundColor: '#FFD600', paddingHorizontal: 22, paddingVertical: 14 },
  heroBtnLabel:  { color: '#111111', fontSize: 17, fontWeight: '800' },
  heroArt:       { width: 118, justifyContent: 'space-between', alignItems: 'center', paddingTop: 4, zIndex: 1 },
  chefBubble:    { width: 98, height: 98, borderRadius: 49, backgroundColor: '#FFFFFFDD', alignItems: 'center', justifyContent: 'center' },
  chefEmoji:     { fontSize: 48 },
  snackRow:      { flexDirection: 'row', gap: 8 },
  snack:         { width: 34, height: 34, borderRadius: 17, backgroundColor: '#FFFCE8', alignItems: 'center', justifyContent: 'center' },
  snackEmoji:    { fontSize: 18 },

  sectionRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  aiBtn: { borderRadius: 999, backgroundColor: '#EDE8FF', paddingHorizontal: 14, paddingVertical: 8 },
  aiBtnLabel: { fontSize: 14, fontWeight: '800', color: '#6A42D8' },
  sectionTitle:  { fontSize: 31, lineHeight: 34, fontWeight: '800', letterSpacing: -1.2, color: '#111111' },
  recipeCount:   { fontSize: 20, fontWeight: '500', color: '#9E9590' },
  cacheHint:     { fontSize: 12, color: '#B0A9A3', marginTop: 2 },
  seeAll:        { fontSize: 18, color: '#6A6475' },

  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFFD9',
    borderRadius: 18, paddingHorizontal: 16,
    height: 52, gap: 10,
  },
  searchIcon: { fontSize: 16 },
  searchInput: { flex: 1, fontSize: 16, color: '#1A1714' },
  searchClear: { fontSize: 14, color: '#9E9590', paddingLeft: 8 },

  filterRow: { gap: 10, paddingVertical: 4 },
  filterChip: {
    borderRadius: 999, paddingHorizontal: 18, paddingVertical: 10,
    backgroundColor: '#FFFFFFD9',
  },
  filterChipSmall: { paddingHorizontal: 14, paddingVertical: 7 },
  filterChipOn: { backgroundColor: '#1A1714' },
  filterChipText: { fontSize: 14, fontWeight: '700', color: '#3D3530' },
  filterChipTextSmall: { fontSize: 12 },
  filterChipTextOn: { color: '#FFFFFF' },

  cardStack: { gap: 14 },
  noticeCard:    { borderRadius: 24, backgroundColor: '#FFFFFFD9', padding: 16, gap: 6 },
  noticeTitle:   { fontSize: 17, fontWeight: '700', color: '#111111' },
  noticeBody:    { fontSize: 14, lineHeight: 20, color: '#605B71' },

  mealCard:     { minHeight: 176, borderRadius: 30, padding: 18, overflow: 'hidden', justifyContent: 'space-between' },
  mealSquare:   { position: 'absolute', width: 64, height: 64, right: 110, top: 58, borderRadius: 18, transform: [{ rotate: '18deg' }], opacity: 0.55 },
  mealPill:     { position: 'absolute', width: 98, height: 38, left: 18, bottom: 20, borderRadius: 22, opacity: 0.42 },
  mealActions:  { flexDirection: 'row', justifyContent: 'space-between' },
  actionBubble: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#FFFFFFE8', alignItems: 'center', justifyContent: 'center' },
  icon0:        { margin: 0 },
  mealInfo:     { maxWidth: '58%', gap: 10 },
  stagePill:    { alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  stagePillText: { fontSize: 11, fontWeight: '800', color: '#1A1714' },
  mealTitle:    { fontSize: 23, lineHeight: 29, fontWeight: '800', letterSpacing: -0.8, color: '#111111' },
  mealMetaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 0 },
  durationPill: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FFF0', borderRadius: 999, paddingLeft: 6, paddingRight: 14, paddingVertical: 5 },
  ratingPill: { alignSelf: 'flex-start', backgroundColor: '#FFF8E0', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  ratingPillText: { fontSize: 13, color: '#FFB800', letterSpacing: 1 },
  durationText: { marginLeft: -2, fontSize: 17, color: '#111111', fontWeight: '600' },

  recentSection: { gap: 10 },
  recentHeading: { fontSize: 18, fontWeight: '800', letterSpacing: -0.4, color: '#111111' },
  recentRow: { gap: 12, paddingRight: 8 },
  recentCard: { width: 100, gap: 6, alignItems: 'center' },
  recentImg: { width: 80, height: 80, borderRadius: 40 },
  recentImgEmpty: { backgroundColor: '#F0EDE8', alignItems: 'center', justifyContent: 'center' },
  recentEmoji: { fontSize: 36 },
  recentTitle: { fontSize: 12, fontWeight: '600', color: '#3D3530', textAlign: 'center', lineHeight: 16 },

  allergenChip: {
    alignSelf: 'flex-start', borderRadius: 999,
    backgroundColor: '#FFE9E9', paddingHorizontal: 18, paddingVertical: 10,
    borderWidth: 1, borderColor: '#FFB3B3',
  },
  allergenChipOn: { backgroundColor: '#FF5A5A', borderColor: '#FF5A5A' },
  allergenChipText: { fontSize: 14, fontWeight: '700', color: '#C42020' },
  allergenChipTextOn: { color: '#FFFFFF' },

  platePos:    { position: 'absolute', right: 18, bottom: 16 },
  plateShadow: { position: 'absolute', top: 8, left: 8, width: 126, height: 126, borderRadius: 63, backgroundColor: '#00000018' },
  plateCircle: { width: 126, height: 126, borderRadius: 63, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  plateImg:    { width: 126, height: 126 },
  plateEmoji:  { fontSize: 60 },
});
