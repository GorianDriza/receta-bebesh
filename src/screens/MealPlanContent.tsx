import { startTransition, useEffect, useMemo, useState } from 'react';
import { Image, Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { IconButton, Surface, Text } from 'react-native-paper';

import { isFirebaseConfigured, missingFirebaseKeys } from '../lib/firebase';
import { fetchRecipes, RecipeRecord } from '../lib/recipes';
import { useAuth } from '../providers/AuthProvider';
import { useLanguage } from '../providers/LanguageProvider';
import { RecipeDetailModal } from './RecipeDetailModal';

// Palette cycles for card backgrounds — pure UI data, not recipe content
const PALETTE = [
  { bg: '#E5FF9A', accent: '#D4F768' },
  { bg: '#CFFFD6', accent: '#B7F4C2' },
  { bg: '#D9CCFF', accent: '#C7B7FB' },
  { bg: '#FFD9AE', accent: '#FFC681' },
  { bg: '#FFF19D', accent: '#FFE25A' },
] as const;

function paletteFor(index: number) {
  return PALETTE[index % PALETTE.length];
}

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

type Props = { onProfilePress?: () => void };

export function MealPlanContent({ onProfilePress }: Props) {
  const { language, t } = useLanguage();
  const { user, userProfile } = useAuth();
  const [recipes, setRecipes]   = useState<RecipeRecord[]>([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [selected, setSelected] = useState<RecipeRecord | null>(null);

  useEffect(() => {
    if (!isFirebaseConfigured) return;
    let mounted = true;
    setLoading(true);
    setError(null);
    fetchRecipes()
      .then((data) => {
        if (!mounted) return;
        startTransition(() => setRecipes(data));
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : 'Could not load recipes.');
      })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  const displayed = useMemo(
    () => recipes.slice(0, 5),
    [recipes],
  );

  const babyLabel = (() => {
    const bn = userProfile?.babyName;
    const bd = userProfile?.babyBirthdate;
    if (bn && bd) {
      const birth = new Date(bd);
      const months =
        (new Date().getFullYear() - birth.getFullYear()) * 12 +
        (new Date().getMonth() - birth.getMonth());
      const age = months < 12
        ? (language === 'sq-AL' ? `${months} muaj` : `${months}m`)
        : (language === 'sq-AL' ? `${Math.floor(months / 12)} vjeç` : `${Math.floor(months / 12)}y`);
      return `${bn} · ${age}`;
    }
    return null;
  })();

  return (
    <>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
      >
        {/* ── Header ─────────────────────────────────────────────────── */}
        <View style={s.header}>
          <View style={s.headerCopy}>
            <Text style={s.screenTitle}>{t[language].home.title}</Text>
            {babyLabel != null ? (
              <Text style={s.screenSub}>👶 {babyLabel}</Text>
            ) : (
              <Text style={s.screenSub}>{t[language].home.subtitle}</Text>
            )}
          </View>
          <Pressable
            style={s.avatarBtn}
            onPress={onProfilePress}
            hitSlop={8}
          >
            {user ? (
              <Text style={s.avatarInitials}>
                {(userProfile?.displayName ?? user.displayName ?? '?')
                  .split(' ')
                  .map((w) => w[0]?.toUpperCase() ?? '')
                  .slice(0, 2)
                  .join('')}
              </Text>
            ) : (
              <IconButton icon="account-circle-outline" size={24} iconColor="#1A1714" style={s.icon0} />
            )}
          </Pressable>
        </View>

        {/* ── Hero card ──────────────────────────────────────────────── */}
        <Surface style={s.heroCard} elevation={0}>
          <View style={s.heroGlowLarge} />
          <View style={s.heroGlowSmall} />

          <View style={s.heroCopy}>
            <Text style={s.heroEyebrow}>{t[language].home.heroTitle}</Text>
            <Text style={s.heroBody}>
              {isFirebaseConfigured
                ? t[language].home.heroConnected
                : t[language].home.heroMissing}
            </Text>
            {!isFirebaseConfigured ? (
              <Text style={s.heroMeta}>
                {t[language].home.heroMissingMeta(missingFirebaseKeys.length)}
              </Text>
            ) : (
              <Text style={s.heroMeta}>{t[language].home.heroReadyMeta}</Text>
            )}
            <Pressable
              style={s.heroBtn}
              onPress={() => void Linking.openURL('https://console.firebase.google.com/')}
            >
              <Text style={s.heroBtnLabel}>{t[language].common.fillInData}</Text>
            </Pressable>
          </View>

          <View style={s.heroArt}>
            <View style={s.chefBubble}>
              <Text style={s.chefEmoji}>👩‍🍳</Text>
            </View>
            <View style={s.snackRow}>
              {['🥕', '🍲', '🥣'].map((e) => (
                <View key={e} style={s.snack}>
                  <Text style={s.snackEmoji}>{e}</Text>
                </View>
              ))}
            </View>
          </View>
        </Surface>

        {/* ── Section header ─────────────────────────────────────────── */}
        <View style={s.sectionRow}>
          <Text style={s.sectionTitle}>{t[language].home.mealsTitle}</Text>
          <Text style={s.seeAll}>{t[language].common.seeAll}</Text>
        </View>

        {/* ── States ─────────────────────────────────────────────────── */}
        {loading && (
          <Surface style={s.noticeCard} elevation={0}>
            <Text style={s.noticeTitle}>{t[language].common.loadingRecipes}</Text>
            <Text style={s.noticeBody}>{t[language].common.loadingRecipesBody}</Text>
          </Surface>
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

        {/* ── Recipe cards ───────────────────────────────────────────── */}
        <View style={s.cardStack}>
          {displayed.map((recipe, i) => {
            const p = paletteFor(i);
            const imgUrl = recipe.image?.downloadUrl ?? recipe.image?.sourceUrl ?? null;
            const dur = durationLabel(recipe);
            return (
              <Pressable key={recipe.id} onPress={() => setSelected(recipe)}>
                <Surface
                  style={[s.mealCard, { backgroundColor: p.bg }]}
                  elevation={0}
                >
                  <View style={[s.mealSquare, { backgroundColor: p.accent }]} />
                  <View style={[s.mealPill,   { backgroundColor: `${p.accent}CC` }]} />

                  <View style={s.mealActions}>
                    <View style={s.actionBubble}>
                      <IconButton icon="heart-outline" size={18} iconColor="#111" style={s.icon0} />
                    </View>
                    <View style={s.actionBubble}>
                      <IconButton icon="plus" size={22} iconColor="#111" style={s.icon0} />
                    </View>
                  </View>

                  <View style={s.mealInfo}>
                    <Text style={s.mealTitle}>{recipe.title[language]}</Text>
                    {dur !== '' && (
                      <View style={s.durationPill}>
                        <IconButton
                          icon="clock-time-four-outline"
                          size={16}
                          iconColor="#111"
                          style={s.icon0}
                        />
                        <Text style={s.durationText}>{dur}</Text>
                      </View>
                    )}
                  </View>

                  {/* Food image or emoji */}
                  <View style={s.platePos}>
                    <View style={s.plateShadow} />
                    <View style={s.plateCircle}>
                      {imgUrl != null ? (
                        <Image
                          source={{ uri: imgUrl }}
                          style={s.plateImg}
                          resizeMode="cover"
                        />
                      ) : (
                        <Text style={s.plateEmoji}>
                          {emojiForMealType(recipe.mealType)}
                        </Text>
                      )}
                    </View>
                  </View>
                </Surface>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <RecipeDetailModal recipe={selected} onClose={() => setSelected(null)} />
    </>
  );
}

const s = StyleSheet.create({
  scroll: {
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 20,
    gap: 18,
  },

  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  headerCopy: { flex: 1 },
  screenTitle: { fontSize: 38, lineHeight: 42, fontWeight: '800', letterSpacing: -1.4, color: '#111111' },
  screenSub: { marginTop: 6, fontSize: 15, lineHeight: 22, color: '#686074', maxWidth: 250 },
  avatarBtn: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: '#6ECAC0',
    alignItems: 'center', justifyContent: 'center',
    marginTop: 4,
  },
  avatarInitials: { fontSize: 16, fontWeight: '800', color: '#FFFFFF' },

  // Hero
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

  // Section
  sectionRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle:  { fontSize: 31, lineHeight: 34, fontWeight: '800', letterSpacing: -1.2, color: '#111111' },
  seeAll:        { fontSize: 18, color: '#6A6475' },

  // Notice
  cardStack: { gap: 14 },
  noticeCard:    { borderRadius: 24, backgroundColor: '#FFFFFFD9', padding: 16, gap: 6 },
  noticeTitle:   { fontSize: 17, fontWeight: '700', color: '#111111' },
  noticeBody:    { fontSize: 14, lineHeight: 20, color: '#605B71' },

  // Meal card
  mealCard:     { minHeight: 176, borderRadius: 30, padding: 18, overflow: 'hidden', justifyContent: 'space-between' },
  mealSquare:   { position: 'absolute', width: 64, height: 64, right: 110, top: 58, borderRadius: 18, transform: [{ rotate: '18deg' }], opacity: 0.55 },
  mealPill:     { position: 'absolute', width: 98, height: 38, left: 18, bottom: 20, borderRadius: 22, opacity: 0.42 },
  mealActions:  { flexDirection: 'row', justifyContent: 'space-between' },
  actionBubble: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#FFFFFFE8', alignItems: 'center', justifyContent: 'center' },
  icon0:        { margin: 0 },
  mealInfo:     { maxWidth: '58%', gap: 14 },
  mealTitle:    { fontSize: 23, lineHeight: 29, fontWeight: '800', letterSpacing: -0.8, color: '#111111' },
  durationPill: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FFF0', borderRadius: 999, paddingLeft: 6, paddingRight: 14, paddingVertical: 5 },
  durationText: { marginLeft: -2, fontSize: 17, color: '#111111', fontWeight: '600' },

  // Plate
  platePos:    { position: 'absolute', right: 18, bottom: 16 },
  plateShadow: { position: 'absolute', top: 8, left: 8, width: 126, height: 126, borderRadius: 63, backgroundColor: '#00000018' },
  plateCircle: { width: 126, height: 126, borderRadius: 63, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  plateImg:    { width: 126, height: 126 },
  plateEmoji:  { fontSize: 60 },
});
