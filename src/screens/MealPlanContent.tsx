import { startTransition, useEffect, useMemo, useState } from 'react';
import { Linking, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Chip, IconButton, Surface, Text } from 'react-native-paper';

import { AppLanguage } from '../i18n/translations';
import { isFirebaseConfigured, missingFirebaseKeys } from '../lib/firebase';
import { fetchRecipes, RecipeMealType, RecipeRecord } from '../lib/recipes';
import { useLanguage } from '../providers/LanguageProvider';

type MealCard = {
  id: string;
  title: string;
  duration: string;
  emoji: string;
  backgroundColor: string;
  accentColor: string;
};

const FEATURED_MEALS: MealCard[] = [
  { id: 'gnocchi', title: 'Sweet Potato Gnocchi Bites', duration: '20 min', emoji: '🍠', backgroundColor: '#E5FF9A', accentColor: '#D4F768' },
  { id: 'wraps',   title: 'Chicken Lettuce Wraps',      duration: '30 min', emoji: '🥗', backgroundColor: '#CFFFD6', accentColor: '#B7F4C2' },
  { id: 'oats',    title: 'Berry Overnight Oats',       duration: '8 min',  emoji: '🫐', backgroundColor: '#D9CCFF', accentColor: '#C7B7FB' },
];

const CARD_PALETTE = [
  { backgroundColor: '#E5FF9A', accentColor: '#D4F768' },
  { backgroundColor: '#CFFFD6', accentColor: '#B7F4C2' },
  { backgroundColor: '#D9CCFF', accentColor: '#C7B7FB' },
] as const;

export function MealPlanContent() {
  const { deviceLanguage, language, setLanguage, t } = useLanguage();
  const [remoteRecipes, setRemoteRecipes] = useState<RecipeRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [recipesError, setRecipesError] = useState<string | null>(null);

  useEffect(() => {
    if (!isFirebaseConfigured) return;
    let mounted = true;
    setIsLoading(true);
    setRecipesError(null);
    fetchRecipes()
      .then((recipes) => {
        if (!mounted) return;
        startTransition(() => setRemoteRecipes(recipes));
      })
      .catch((err) => {
        if (!mounted) return;
        setRecipesError(err instanceof Error ? err.message : 'Unable to load recipes.');
      })
      .finally(() => { if (mounted) setIsLoading(false); });
    return () => { mounted = false; };
  }, []);

  const displayedMeals = useMemo<MealCard[]>(() => {
    if (remoteRecipes.length === 0) return FEATURED_MEALS;
    return remoteRecipes.slice(0, 3).map((r, i) => {
      const p = CARD_PALETTE[i % CARD_PALETTE.length];
      return {
        id: r.id,
        title: r.title[language],
        duration: r.totalMinutes != null
          ? `${r.totalMinutes} min`
          : r.prepMinutes != null
            ? `${r.prepMinutes} min`
            : '15 min',
        emoji: emojiForMealType(r.mealType),
        backgroundColor: p.backgroundColor,
        accentColor: p.accentColor,
      };
    });
  }, [remoteRecipes, language]);

  const langOptions: Array<{ id: AppLanguage; label: string }> = [
    { id: 'sq-AL', label: t[language].common.albanian },
    { id: 'en',    label: t[language].common.english  },
  ];

  const firebaseMessage = isFirebaseConfigured
    ? t[language].home.heroConnected
    : t[language].home.heroMissing;

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={s.scroll}
    >
      {/* Header */}
      <View style={s.header}>
        <View style={s.headerCopy}>
          <Text style={s.screenTitle}>{t[language].home.title}</Text>
          <Text style={s.screenSub}>{t[language].home.subtitle}</Text>
        </View>
        <View style={[s.badge, isFirebaseConfigured ? s.badgeSynced : s.badgeSetup]}>
          <Text style={s.badgeText}>
            {isFirebaseConfigured ? t[language].common.synced : t[language].common.setup}
          </Text>
        </View>
      </View>

      {/* Language row */}
      <View style={s.langRow}>
        <View style={s.deviceHint}>
          <Text style={s.deviceHintText}>
            Device: {deviceLanguage === 'sq-AL' ? 'sq-AL' : 'en'}
          </Text>
        </View>
        <View style={s.langChips}>
          {langOptions.map((o) => (
            <Chip
              key={o.id}
              selected={language === o.id}
              onPress={() => void setLanguage(o.id)}
              compact
              style={[s.chip, language === o.id && s.chipOn]}
              textStyle={[s.chipText, language === o.id && s.chipTextOn]}
            >
              {o.label}
            </Chip>
          ))}
        </View>
      </View>

      {/* Hero card */}
      <Surface style={s.heroCard} elevation={0}>
        <View style={s.heroGlowLarge} />
        <View style={s.heroGlowSmall} />

        <View style={s.heroCopy}>
          <Text style={s.heroEyebrow}>{t[language].home.heroTitle}</Text>
          <Text style={s.heroBody}>{firebaseMessage}</Text>
          {!isFirebaseConfigured ? (
            <Text style={s.heroMeta}>
              {t[language].home.heroMissingMeta(missingFirebaseKeys.length)}
            </Text>
          ) : (
            <Text style={s.heroMeta}>{t[language].home.heroReadyMeta}</Text>
          )}
          <Button
            mode="contained"
            onPress={() => void Linking.openURL('https://console.firebase.google.com/')}
            contentStyle={s.heroBtnContent}
            style={s.heroBtn}
            labelStyle={s.heroBtnLabel}
          >
            {t[language].common.fillInData}
          </Button>
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

      {/* Section header */}
      <View style={s.sectionRow}>
        <Text style={s.sectionTitle}>{t[language].home.mealsTitle}</Text>
        <Text style={s.seeAll}>{t[language].common.seeAll}</Text>
      </View>

      {/* Recipe cards */}
      <View style={s.cardStack}>
        {isLoading && (
          <Surface style={s.noticeCard} elevation={0}>
            <Text style={s.noticeTitle}>{t[language].common.loadingRecipes}</Text>
            <Text style={s.noticeBody}>{t[language].common.loadingRecipesBody}</Text>
          </Surface>
        )}
        {recipesError != null && (
          <Surface style={s.noticeCard} elevation={0}>
            <Text style={s.noticeTitle}>{t[language].common.recipeSyncUnavailable}</Text>
            <Text style={s.noticeBody}>{recipesError}</Text>
          </Surface>
        )}
        {displayedMeals.map((meal) => (
          <Surface
            key={meal.id}
            style={[s.mealCard, { backgroundColor: meal.backgroundColor }]}
            elevation={0}
          >
            <View style={[s.mealSquare,  { backgroundColor: meal.accentColor }]} />
            <View style={[s.mealPill,    { backgroundColor: `${meal.accentColor}CC` }]} />

            <View style={s.mealActions}>
              <View style={s.actionBubble}>
                <IconButton icon="heart" size={18} iconColor="#111" style={s.icon0} />
              </View>
              <View style={s.actionBubble}>
                <IconButton icon="plus"  size={22} iconColor="#111" style={s.icon0} />
              </View>
            </View>

            <View style={s.mealInfo}>
              <Text style={s.mealTitle}>{meal.title}</Text>
              <View style={s.durationPill}>
                <IconButton icon="clock-time-four-outline" size={16} iconColor="#111" style={s.icon0} />
                <Text style={s.durationText}>{meal.duration}</Text>
              </View>
            </View>

            <View style={s.platePos}>
              <View style={s.plateShadow} />
              <View style={s.plateCircle}>
                <Text style={s.plateEmoji}>{meal.emoji}</Text>
              </View>
            </View>
          </Surface>
        ))}
      </View>
    </ScrollView>
  );
}

function emojiForMealType(mealType: RecipeMealType | string): string {
  const map: Record<string, string> = {
    breakfast: '🍳', lunch: '🥗', dinner: '🍲',
    snack: '🍓', puree: '🥣', 'finger-food': '🫓', 'batch-prep': '🍱',
  };
  return map[mealType] ?? '🍽️';
}

const s = StyleSheet.create({
  scroll: {
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 20,
    gap: 18,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  headerCopy: { flex: 1 },
  screenTitle: {
    fontSize: 38,
    lineHeight: 42,
    fontWeight: '800',
    letterSpacing: -1.4,
    color: '#111111',
  },
  screenSub: {
    marginTop: 6,
    fontSize: 15,
    lineHeight: 22,
    color: '#686074',
    maxWidth: 250,
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  badgeSynced: { backgroundColor: '#D9FFDE' },
  badgeSetup:  { backgroundColor: '#FFFFFFCC' },
  badgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#39354A',
  },
  langRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  deviceHint: {
    borderRadius: 999,
    backgroundColor: '#FFFFFFB8',
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  deviceHintText: { fontSize: 13, fontWeight: '600', color: '#4D4760' },
  langChips: { flexDirection: 'row', gap: 8 },
  chip: {
    borderRadius: 999,
    backgroundColor: '#FFFFFFD9',
    paddingHorizontal: 6,
    paddingVertical: 8,
  },
  chipOn:      { backgroundColor: '#111111' },
  chipText:    { fontSize: 15, fontWeight: '600', color: '#1E1B2F' },
  chipTextOn:  { color: '#FFFFFF' },

  // Hero card
  heroCard: {
    borderRadius: 30,
    backgroundColor: '#FFF5A7',
    padding: 20,
    flexDirection: 'row',
    overflow: 'hidden',
    minHeight: 198,
  },
  heroGlowLarge: {
    position: 'absolute',
    right: -30, top: 10,
    width: 160, height: 160,
    borderRadius: 80,
    backgroundColor: '#FFE679',
    opacity: 0.55,
  },
  heroGlowSmall: {
    position: 'absolute',
    left: -25, bottom: -30,
    width: 120, height: 120,
    borderRadius: 60,
    backgroundColor: '#FFFCE0',
    opacity: 0.9,
  },
  heroCopy: {
    flex: 1,
    justifyContent: 'space-between',
    paddingRight: 12,
    zIndex: 1,
  },
  heroEyebrow: {
    fontSize: 28,
    lineHeight: 31,
    fontWeight: '800',
    letterSpacing: -1.1,
    color: '#111111',
  },
  heroBody: {
    marginTop: 10,
    fontSize: 15,
    lineHeight: 22,
    color: '#4B4328',
    maxWidth: 215,
  },
  heroMeta: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 18,
    color: '#6A5C1D',
  },
  heroBtn: {
    alignSelf: 'flex-start',
    marginTop: 16,
    borderRadius: 999,
    backgroundColor: '#FFD600',
  },
  heroBtnContent: { paddingHorizontal: 18, minHeight: 52 },
  heroBtnLabel:   { color: '#111111', fontSize: 17, fontWeight: '800' },
  heroArt: {
    width: 118,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
    zIndex: 1,
  },
  chefBubble: {
    width: 98, height: 98,
    borderRadius: 49,
    backgroundColor: '#FFFFFFDD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chefEmoji:  { fontSize: 48 },
  snackRow:   { flexDirection: 'row', gap: 8 },
  snack: {
    width: 34, height: 34,
    borderRadius: 17,
    backgroundColor: '#FFFCE8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  snackEmoji: { fontSize: 18 },

  // Section
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 31,
    lineHeight: 34,
    fontWeight: '800',
    letterSpacing: -1.2,
    color: '#111111',
  },
  seeAll: { fontSize: 18, color: '#6A6475' },

  // Cards
  cardStack: { gap: 14 },
  noticeCard: {
    borderRadius: 24,
    backgroundColor: '#FFFFFFD9',
    padding: 16,
    gap: 6,
  },
  noticeTitle: { fontSize: 17, fontWeight: '700', color: '#111111' },
  noticeBody:  { fontSize: 14, lineHeight: 20, color: '#605B71' },

  mealCard: {
    minHeight: 176,
    borderRadius: 30,
    padding: 18,
    overflow: 'hidden',
    justifyContent: 'space-between',
  },
  mealSquare: {
    position: 'absolute',
    width: 64, height: 64,
    right: 110, top: 58,
    borderRadius: 18,
    transform: [{ rotate: '18deg' }],
    opacity: 0.55,
  },
  mealPill: {
    position: 'absolute',
    width: 98, height: 38,
    left: 18, bottom: 20,
    borderRadius: 22,
    opacity: 0.42,
  },
  mealActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionBubble: {
    width: 50, height: 50,
    borderRadius: 25,
    backgroundColor: '#FFFFFFE8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon0: { margin: 0 },
  mealInfo: { maxWidth: '58%', gap: 14 },
  mealTitle: {
    fontSize: 23,
    lineHeight: 29,
    fontWeight: '800',
    letterSpacing: -0.8,
    color: '#111111',
  },
  durationPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FFF0',
    borderRadius: 999,
    paddingLeft: 6,
    paddingRight: 14,
    paddingVertical: 5,
  },
  durationText: {
    marginLeft: -2,
    fontSize: 17,
    color: '#111111',
    fontWeight: '600',
  },
  platePos: { position: 'absolute', right: 18, bottom: 16 },
  plateShadow: {
    position: 'absolute',
    top: 8, left: 8,
    width: 126, height: 126,
    borderRadius: 63,
    backgroundColor: '#00000018',
  },
  plateCircle: {
    width: 126, height: 126,
    borderRadius: 63,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  plateEmoji: { fontSize: 60 },
});
