import { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { IconButton, Surface, Text } from 'react-native-paper';

import { isFirebaseConfigured } from '../lib/firebase';
import {
  DayPlan,
  getISOWeekKey,
  getWeekPlan,
  PlannerMealType,
  todayDayKey,
} from '../lib/planner';
import { useAuth } from '../providers/AuthProvider';
import { useLanguage } from '../providers/LanguageProvider';

type MacroCard = { id: string; label: string; value: string; icon: string; tint: string };

const MACRO_CARDS: MacroCard[] = [
  { id: 'carbs',   label: 'Karbohidrate', value: '—',  icon: 'barley',        tint: '#FFA800' },
  { id: 'protein', label: 'Proteina',     value: '—',  icon: 'food-steak',    tint: '#FF8C1A' },
  { id: 'fat',     label: 'Yndyrna',      value: '—',  icon: 'water-outline', tint: '#F2B23D' },
];

const MEAL_META: Record<PlannerMealType, { emoji: string; sq: string; en: string; bg: string; accent: string }> = {
  breakfast: { emoji: '🍳', sq: 'Mëngjes', en: 'Breakfast', bg: '#CFC2FF', accent: '#B79DFE' },
  lunch:     { emoji: '🥗', sq: 'Drekë',   en: 'Lunch',     bg: '#FFF19D', accent: '#FFE25A' },
  dinner:    { emoji: '🍲', sq: 'Darkë',   en: 'Dinner',    bg: '#CFFFD6', accent: '#ACEDB7' },
  snack:     { emoji: '🍓', sq: 'Meze',    en: 'Snack',     bg: '#FFD9AE', accent: '#FFC681' },
};

const MEAL_ORDER: PlannerMealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

type Props = { onLoginRequired?: () => void };

export function JournalContent({ onLoginRequired }: Props) {
  const { language, t } = useLanguage();
  const { user } = useAuth();
  const [dayPlan, setDayPlan] = useState<DayPlan>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user || !isFirebaseConfigured) return;
    setLoading(true);
    const weekKey = getISOWeekKey(new Date());
    const day = todayDayKey();
    getWeekPlan(user.uid, weekKey)
      .then((plan) => setDayPlan(plan[day] ?? {}))
      .catch(() => setDayPlan({}))
      .finally(() => setLoading(false));
  }, [user]);

  const plannedCount = MEAL_ORDER.filter((m) => dayPlan[m] != null).length;

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
      <Text style={s.heading}>{t[language].home.journalTitle}</Text>

      {/* Calories panel */}
      <Surface style={s.panel} elevation={0}>
        <View style={s.panelHeader}>
          <View style={s.panelTitleRow}>
            <View style={s.fireBubble}>
              <Text style={s.fireEmoji}>📋</Text>
            </View>
            <View>
              <Text style={s.panelTitle}>
                {language === 'sq-AL' ? 'Sot' : 'Today'}
              </Text>
              <Text style={s.panelSub}>
                {language === 'sq-AL'
                  ? `${plannedCount} vakte të planifikuara`
                  : `${plannedCount} meals planned`}
              </Text>
            </View>
          </View>
          <View style={s.calBubble}>
            <IconButton icon="calendar-today" size={20} iconColor="#111" style={s.icon0} />
          </View>
        </View>

        <View style={s.metricRow}>
          <Text style={s.metricLabel}>{t[language].home.consumed}</Text>
          <Text style={s.metricValue}>
            {language === 'sq-AL' ? 'Jo i gjurmuar' : 'Not tracked'}
          </Text>
        </View>
        <View style={s.metricRow}>
          <Text style={s.metricLabel}>{t[language].home.remaining}</Text>
          <Text style={s.metricValue}>—</Text>
        </View>
        <View style={[s.metricRow, s.metricRowSoft]}>
          <Text style={s.metricLabel}>{t[language].home.hydration}</Text>
          <Text style={s.metricValue}>— {t[language].home.cups}</Text>
        </View>

        <View style={s.macroRow}>
          {MACRO_CARDS.map((macro) => (
            <Surface key={macro.id} style={s.macroCard} elevation={0}>
              <Text style={s.macroValue}>{macro.value}</Text>
              <View style={s.macroIconRow}>
                <IconButton icon={macro.icon} size={20} iconColor={macro.tint} style={s.icon0} />
              </View>
              <Text style={s.macroLabel}>
                {language === 'sq-AL' ? macro.label : macro.id === 'carbs' ? 'Carbs' : macro.id === 'protein' ? 'Protein' : 'Fat'}
              </Text>
            </Surface>
          ))}
        </View>
      </Surface>

      {/* Guest prompt */}
      {!user && (
        <Pressable style={s.guestBanner} onPress={onLoginRequired}>
          <Text style={s.guestBannerText}>
            {language === 'sq-AL'
              ? '🔒 Hyni për të parë vaktet e planifikuara'
              : '🔒 Sign in to see your planned meals'}
          </Text>
        </Pressable>
      )}

      {/* Today's meal snapshot grid — connected to planner */}
      <Text style={s.subHeading}>
        {language === 'sq-AL' ? 'Vaktet e Sotme' : "Today's Meals"}
      </Text>

      <View style={s.snapshotGrid}>
        {MEAL_ORDER.map((mealKey) => {
          const meta = MEAL_META[mealKey];
          const entry = dayPlan[mealKey];
          return (
            <Surface
              key={mealKey}
              style={[s.snapCard, { backgroundColor: meta.bg }]}
              elevation={0}
            >
              <View style={[s.snapAccent, { backgroundColor: meta.accent }]} />

              <View style={s.snapHeader}>
                <View style={s.snapEmojiBubble}>
                  <Text style={s.snapEmoji}>{meta.emoji}</Text>
                </View>
                {entry?.recipeImage ? (
                  <Image
                    source={{ uri: entry.recipeImage }}
                    style={s.snapThumb}
                    resizeMode="cover"
                  />
                ) : null}
              </View>

              <View style={s.snapFooter}>
                <View style={s.snapTextCol}>
                  <Text style={s.snapMeal}>
                    {language === 'sq-AL' ? meta.sq : meta.en}
                  </Text>
                  {entry != null && (
                    <Text style={s.snapRecipe} numberOfLines={2}>
                      {entry.recipeTitle}
                    </Text>
                  )}
                </View>
                {entry == null && !loading && (
                  <View style={s.snapPlusBubble}>
                    <Text style={s.snapPlusText}>+</Text>
                  </View>
                )}
              </View>
            </Surface>
          );
        })}
      </View>

      {!isFirebaseConfigured && (
        <Surface style={s.noticeCard} elevation={0}>
          <Text style={s.noticeText}>
            {language === 'sq-AL'
              ? 'Konfiguro Firebase për të parë vaktet e planifikuara.'
              : 'Configure Firebase to see planned meals.'}
          </Text>
        </Surface>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  scroll: { paddingHorizontal: 18, paddingTop: 8, paddingBottom: 20, gap: 18 },
  heading: { fontSize: 38, lineHeight: 42, fontWeight: '800', letterSpacing: -1.4, color: '#111111' },
  subHeading: { fontSize: 24, fontWeight: '800', letterSpacing: -0.8, color: '#111111' },

  panel: { borderRadius: 32, padding: 18, backgroundColor: '#FEFEFF', gap: 12 },
  panelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  panelTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  fireBubble: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#FFF9EC', alignItems: 'center', justifyContent: 'center' },
  fireEmoji: { fontSize: 24 },
  panelTitle: { fontSize: 27, lineHeight: 29, fontWeight: '800', letterSpacing: -1, color: '#111111' },
  panelSub: { marginTop: 4, fontSize: 15, color: '#7B7287' },
  calBubble: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#F5F5F8', alignItems: 'center', justifyContent: 'center' },
  icon0: { margin: 0 },

  metricRow: { borderRadius: 18, backgroundColor: '#F2F2F9', paddingHorizontal: 16, paddingVertical: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  metricRowSoft: { backgroundColor: '#FCFCFF', borderWidth: 1, borderColor: '#F1EEF7' },
  metricLabel: { fontSize: 18, color: '#39354A' },
  metricValue: { fontSize: 17, fontWeight: '700', color: '#111111' },

  macroRow: { flexDirection: 'row', gap: 10 },
  macroCard: { flex: 1, borderRadius: 24, backgroundColor: '#F7F7FB', padding: 12, minHeight: 126 },
  macroValue: { fontSize: 22, lineHeight: 24, fontWeight: '800', color: '#111111' },
  macroIconRow: { marginTop: 10, alignItems: 'flex-start' },
  macroLabel: { marginTop: 8, fontSize: 14, lineHeight: 20, color: '#39354A' },

  snapshotGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  snapCard: { width: '47.5%', minHeight: 152, borderRadius: 28, padding: 14, overflow: 'hidden', justifyContent: 'space-between' },
  snapAccent: { position: 'absolute', width: 52, height: 52, right: 20, bottom: 24, borderRadius: 14, opacity: 0.35 },
  snapHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  snapEmojiBubble: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#FFFFFFD8', alignItems: 'center', justifyContent: 'center' },
  snapEmoji: { fontSize: 22 },
  snapThumb: { width: 36, height: 36, borderRadius: 10 },
  snapFooter: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  snapTextCol: { flex: 1, paddingRight: 4 },
  snapMeal: { fontSize: 17, fontWeight: '700', color: '#111111' },
  snapRecipe: { fontSize: 11, color: '#4A4440', lineHeight: 15, marginTop: 2 },
  snapPlusBubble: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#FFFFFFCC', alignItems: 'center', justifyContent: 'center' },
  snapPlusText: { fontSize: 22, color: '#111111', fontWeight: '400', lineHeight: 26 },

  guestBanner: {
    backgroundColor: '#FFF9E0', borderRadius: 18,
    paddingHorizontal: 18, paddingVertical: 14,
    borderWidth: 1, borderColor: '#FFE57A',
  },
  guestBannerText: { fontSize: 15, fontWeight: '700', color: '#7A6200', textAlign: 'center' },

  noticeCard: { borderRadius: 24, backgroundColor: '#FFFFFFD9', padding: 16 },
  noticeText: { fontSize: 15, color: '#6E6560', textAlign: 'center' },
});
