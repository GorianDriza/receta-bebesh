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
import { getDayHistory, DayHistory, markCooked, unmarkCooked, getCookStreak, getWeekCookSummary, WeekDaySummary, getMonthCookCounts } from '../lib/cookHistory';
import { fetchRecipes, RecipeRecord } from '../lib/recipes';
import { summarizeRecipeNutrition, roundNutritionValue } from '../lib/nutrition';
import { DAILY_TARGETS, NUTRIENT_META } from '../lib/nutritionTargets';
import { computeAgeStage } from '../lib/users';
import { useAuth } from '../providers/AuthProvider';
import { useLanguage } from '../providers/LanguageProvider';

type MacroCard = { id: string; label: string; value: string; icon: string; tint: string };

const FOOD_GROUP_KEYWORDS: Array<{
  id: string; emoji: string; label_sq: string; label_en: string; color: string; keywords: string[];
}> = [
  { id: 'grains',  emoji: '🌾', label_sq: 'Drithëra',  label_en: 'Grains',   color: '#FFB800', keywords: ['rice','oriz','pasta','oat','tërshërë','flour','miell','bread','bukë','quinoa','barley','elb','corn','misër'] },
  { id: 'protein', emoji: '💪', label_sq: 'Proteinë',  label_en: 'Protein',  color: '#6ECAC0', keywords: ['chicken','pulë','beef','viç','fish','peshk','salmon','egg','vezë','tofu','lentil','thjerrëz','chickpea','qiqër','turkey','lamb','qingj'] },
  { id: 'dairy',   emoji: '🥛', label_sq: 'Bulmet',    label_en: 'Dairy',    color: '#A88BEB', keywords: ['milk','qumësht','yogurt','kos','cheese','djathë','butter','gjalpë','cream','ricotta'] },
  { id: 'produce', emoji: '🥬', label_sq: 'Perime/Fruta', label_en: 'Produce', color: '#3AAB72', keywords: ['carrot','karot','potato','patate','apple','moll','banana','spinach','spinaq','broccoli','mango','pear','dardhë','tomato','domate','zucchini','kungull','avocado','pea','bizele'] },
  { id: 'fats',    emoji: '🫙', label_sq: 'Yndyrna të mira', label_en: 'Healthy Fats', color: '#FF8C1A', keywords: ['olive oil','vaj ulliri','avocado','salmon','butter','gjalpë','flaxseed','chia','walnut','arra','almond','badam'] },
];

function computeWeeklyVariety(weekSummary: WeekDaySummary[], allRecipes: RecipeRecord[]): Set<string> {
  const covered = new Set<string>();
  const recipeMap = new Map(allRecipes.map((r) => [r.id, r]));
  const cookedRecipes = weekSummary
    .flatMap((d) => d.entries)
    .map((e) => recipeMap.get(e.recipeId))
    .filter(Boolean) as RecipeRecord[];
  const corpus = cookedRecipes
    .flatMap((r) => [...(r.ingredients['sq-AL'] ?? []), ...(r.ingredients['en'] ?? [])])
    .join(' ')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
  for (const grp of FOOD_GROUP_KEYWORDS) {
    if (grp.keywords.some((kw) => corpus.includes(kw))) covered.add(grp.id);
  }
  return covered;
}

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
  const { user, userProfile } = useAuth();
  const [dayPlan, setDayPlan]       = useState<DayPlan>({});
  const [loading, setLoading]       = useState(false);
  const [cooked, setCooked]         = useState<DayHistory>({});
  const [streak, setStreak]         = useState(0);
  const [weekSummary, setWeekSummary] = useState<WeekDaySummary[]>([]);
  const today = new Date();
  const [calYear, setCalYear]   = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth() + 1);
  const [monthCounts, setMonthCounts] = useState<Record<string, number>>({});
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [selectedEntries, setSelectedEntries] = useState<DayHistory>({});
  const [allRecipes, setAllRecipes] = useState<RecipeRecord[]>([]);
  const [macroCards, setMacroCards] = useState<MacroCard[]>([
    { id: 'carbs',   label: 'Karbohidrate', value: '—', icon: 'barley',        tint: '#FFA800' },
    { id: 'protein', label: 'Proteina',     value: '—', icon: 'food-steak',    tint: '#FF8C1A' },
    { id: 'fat',     label: 'Yndyrna',      value: '—', icon: 'water-outline', tint: '#F2B23D' },
  ]);
  const [todayKcal, setTodayKcal] = useState<string>('—');
  const [todayMeals, setTodayMeals] = useState(0);

  useEffect(() => {
    fetchRecipes().then(setAllRecipes).catch(() => {});
  }, []);

  function refreshToday(recipes: RecipeRecord[]) {
    getDayHistory().then((history) => {
      setCooked(history);
      const cookedIds = new Set(Object.values(history).filter(Boolean).map((e) => e!.recipeId));
      const cookedRecipes = recipes.filter((r) => cookedIds.has(r.id));
      const summary = summarizeRecipeNutrition(cookedRecipes);
      setTodayMeals(Object.keys(history).length);
      if (summary.withNutritionCount > 0) {
        setTodayKcal(roundNutritionValue(summary.totals.kcal));
        setMacroCards([
          { id: 'carbs',   label: 'Karbohidrate', value: `${roundNutritionValue(summary.totals.carbsG)}g`,   icon: 'barley',        tint: '#FFA800' },
          { id: 'protein', label: 'Proteina',     value: `${roundNutritionValue(summary.totals.proteinG)}g`, icon: 'food-steak',    tint: '#FF8C1A' },
          { id: 'fat',     label: 'Yndyrna',      value: `${roundNutritionValue(summary.totals.fatG)}g`,     icon: 'water-outline', tint: '#F2B23D' },
        ]);
      } else {
        setTodayKcal('—');
        setMacroCards([
          { id: 'carbs',   label: 'Karbohidrate', value: '—', icon: 'barley',        tint: '#FFA800' },
          { id: 'protein', label: 'Proteina',     value: '—', icon: 'food-steak',    tint: '#FF8C1A' },
          { id: 'fat',     label: 'Yndyrna',      value: '—', icon: 'water-outline', tint: '#F2B23D' },
        ]);
      }
    }).catch(() => {});
    getCookStreak().then(setStreak).catch(() => {});
    getWeekCookSummary().then(setWeekSummary).catch(() => {});
  }

  useEffect(() => {
    refreshToday(allRecipes);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allRecipes]);

  useEffect(() => {
    getMonthCookCounts(calYear, calMonth).then(setMonthCounts).catch(() => {});
  }, [calYear, calMonth]);

  function buildCalendarDays(): (string | null)[] {
    const firstDay = new Date(calYear, calMonth - 1, 1);
    const daysInMonth = new Date(calYear, calMonth, 0).getDate();
    // ISO week starts Monday; getDay() 0=Sun → offset
    const startOffset = (firstDay.getDay() + 6) % 7;
    const cells: (string | null)[] = Array(startOffset).fill(null);
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push(`${calYear}-${String(calMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
    }
    return cells;
  }

  function shiftMonth(delta: number) {
    let m = calMonth + delta;
    let y = calYear;
    if (m > 12) { m = 1; y++; }
    if (m < 1) { m = 12; y--; }
    setCalMonth(m);
    setCalYear(y);
    setSelectedDay(null);
  }

  const calDays = buildCalendarDays();

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

      {/* ── Streak + week heatmap ── */}
      <Surface style={s.streakCard} elevation={0}>
        <View style={s.streakLeft}>
          <Text style={s.streakNumber}>{streak}</Text>
          <Text style={s.streakLabel}>
            {language === 'sq-AL' ? 'ditë radhazi 🔥' : 'day streak 🔥'}
          </Text>
        </View>
        <View style={s.weekRow}>
          {weekSummary.map((day) => {
            const parts = day.dateKey.split('-');
            const dayNum = Number(parts[2]);
            const isToday = day.dateKey === new Date().toISOString().slice(0, 10);
            return (
              <View key={day.dateKey} style={s.dayCol}>
                <View style={[
                  s.daydot,
                  day.count > 0 && s.daydotActive,
                  isToday && s.daydotToday,
                ]}>
                  {day.count > 0 && <Text style={s.daydotCount}>{day.count}</Text>}
                </View>
                <Text style={[s.dayLabel, isToday && s.dayLabelToday]}>{dayNum}</Text>
              </View>
            );
          })}
        </View>
      </Surface>

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
                  ? `${plannedCount} vakte të planifikuara · ${todayMeals} të gatuar`
                  : `${plannedCount} planned · ${todayMeals} cooked`}
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
            {todayKcal === '—'
              ? (language === 'sq-AL' ? 'Jo i gjurmuar' : 'Not tracked')
              : `${todayKcal} kcal`}
          </Text>
        </View>

        <View style={s.macroRow}>
          {macroCards.map((macro) => (
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

      {/* Nutrition gap chart */}
      {(() => {
        const bd = userProfile?.babyBirthdate;
        const stage = bd ? computeAgeStage(bd) : null;
        const targets = stage ? DAILY_TARGETS[stage] : null;
        if (!targets) return null;

        // Pull actual totals from macroCards state
        const parse = (v: string) => parseFloat(v.replace('g', '')) || 0;
        const kcalActual = todayKcal === '—' ? 0 : parseFloat(todayKcal) || 0;
        const actuals: Record<string, number> = {
          kcal:     kcalActual,
          proteinG: parse(macroCards.find((m) => m.id === 'protein')?.value ?? '0'),
          carbsG:   parse(macroCards.find((m) => m.id === 'carbs')?.value ?? '0'),
          fatG:     parse(macroCards.find((m) => m.id === 'fat')?.value ?? '0'),
          fiberG:   0,
        };
        const hasData = kcalActual > 0;

        return (
          <Surface style={s.gapCard} elevation={0}>
            <Text style={s.gapTitle}>
              {language === 'sq-AL' ? '🎯 Objektivat e Ditës' : '🎯 Daily Targets'}
            </Text>
            <Text style={s.gapStage}>{stage}</Text>
            {NUTRIENT_META.map(({ key, label_sq, label_en, unit }) => {
              const actual  = actuals[key] ?? 0;
              const target  = targets[key as keyof typeof targets] ?? 1;
              const pct     = Math.min(1, hasData ? actual / target : 0);
              const barColor = pct >= 0.8 ? '#3AAB72' : pct >= 0.4 ? '#F4A62C' : '#E05252';
              return (
                <View key={key} style={s.gapRow}>
                  <Text style={s.gapLabel}>{language === 'sq-AL' ? label_sq : label_en}</Text>
                  <View style={s.gapBarTrack}>
                    <View style={[s.gapBarFill, { width: `${Math.round(pct * 100)}%` as `${number}%`, backgroundColor: barColor }]} />
                  </View>
                  <Text style={s.gapValues}>
                    {hasData ? `${Math.round(actual)}` : '—'}/{target}{unit}
                  </Text>
                </View>
              );
            })}
            {!hasData && (
              <Text style={s.gapHint}>
                {language === 'sq-AL' ? 'Shënoni vaktet si të gatuar për të parë progresin.' : 'Mark meals as cooked to see progress.'}
              </Text>
            )}
          </Surface>
        );
      })()}

      {/* Weekly variety dashboard */}
      {weekSummary.some((d) => d.count > 0) && (() => {
        const covered = computeWeeklyVariety(weekSummary, allRecipes);
        return (
          <Surface style={s.varietyCard} elevation={0}>
            <Text style={s.varietyTitle}>
              {language === 'sq-AL' ? '📊 Varieteti Javor' : '📊 Weekly Variety'}
            </Text>
            <Text style={s.varietySub}>
              {covered.size}/5 {language === 'sq-AL' ? 'grupe ushqimore' : 'food groups'}
            </Text>
            <View style={s.varietyRow}>
              {FOOD_GROUP_KEYWORDS.map((grp) => {
                const hit = covered.has(grp.id);
                return (
                  <View key={grp.id} style={s.varietyCell}>
                    <View style={[s.varietyBubble, { backgroundColor: hit ? grp.color : '#F0EDE8' }]}>
                      <Text style={s.varietyEmoji}>{grp.emoji}</Text>
                    </View>
                    <Text style={[s.varietyLabel, hit && { color: grp.color }]} numberOfLines={2}>
                      {language === 'sq-AL' ? grp.label_sq : grp.label_en}
                    </Text>
                    {!hit && (
                      <Text style={s.varietyMissing}>
                        {language === 'sq-AL' ? 'mungon' : 'missing'}
                      </Text>
                    )}
                  </View>
                );
              })}
            </View>
          </Surface>
        );
      })()}

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

              {cooked[mealKey] && (
                <View style={s.cookedBadge}>
                  <Text style={s.cookedBadgeText}>✓</Text>
                </View>
              )}

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
                {entry != null && (
                  <Pressable
                    style={[s.snapPlusBubble, cooked[mealKey] && s.snapCookedBubble]}
                    onPress={async () => {
                      if (cooked[mealKey]) {
                        await unmarkCooked(mealKey);
                      } else {
                        await markCooked(mealKey, entry.recipeId, entry.recipeTitle);
                      }
                      refreshToday(allRecipes);
                    }}
                  >
                    <Text style={[s.snapPlusText, cooked[mealKey] && s.snapCookedText]}>
                      {cooked[mealKey] ? '✓' : '○'}
                    </Text>
                  </Pressable>
                )}
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

      {/* ── Month calendar heat-map ── */}
      <Surface style={s.calCard} elevation={0}>
        <View style={s.calHeader}>
          <Pressable style={s.calNavBtn} onPress={() => shiftMonth(-1)}>
            <Text style={s.calNavText}>‹</Text>
          </Pressable>
          <Text style={s.calMonthLabel}>
            {new Date(calYear, calMonth - 1, 1).toLocaleDateString(
              language === 'sq-AL' ? 'sq-AL' : 'en-US',
              { month: 'long', year: 'numeric' },
            )}
          </Text>
          <Pressable style={s.calNavBtn} onPress={() => shiftMonth(1)}>
            <Text style={s.calNavText}>›</Text>
          </Pressable>
        </View>
        <View style={s.calDoW}>
          {['H', 'M', 'M', 'E', 'P', 'S', 'D'].map((d, i) => (
            <Text key={i} style={s.calDoWText}>{d}</Text>
          ))}
        </View>
        <View style={s.calGrid}>
          {calDays.map((dayKey, idx) => {
            if (dayKey == null) return <View key={`empty-${idx}`} style={s.calCell} />;
            const count = monthCounts[dayKey] ?? 0;
            const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
            const isToday = dayKey === todayKey;
            const isSelected = dayKey === selectedDay;
            const dayNum = Number(dayKey.split('-')[2]);
            const dotBg = count >= 2 ? '#6ECAC0' : count === 1 ? '#B8EDE9' : '#F0EDE0';
            return (
              <Pressable
                key={dayKey}
                style={s.calCell}
                onPress={async () => {
                  if (selectedDay === dayKey) { setSelectedDay(null); return; }
                  setSelectedDay(dayKey);
                  const parts = dayKey.split('-');
                  const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
                  const hist = await getDayHistory(d);
                  setSelectedEntries(hist);
                }}
              >
                <View style={[
                  s.calDot,
                  { backgroundColor: dotBg },
                  isToday && s.calDotToday,
                  isSelected && s.calDotSelected,
                ]}>
                  <Text style={[s.calDayNum, count > 0 && s.calDayNumActive]}>{dayNum}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        {selectedDay && Object.keys(selectedEntries).length > 0 && (
          <View style={s.calDetail}>
            {Object.values(selectedEntries).map((e, i) => e && (
              <Text key={i} style={s.calDetailText}>✓ {e.recipeTitle}</Text>
            ))}
          </View>
        )}
        {selectedDay && Object.keys(selectedEntries).length === 0 && (
          <View style={s.calDetail}>
            <Text style={s.calDetailEmpty}>
              {language === 'sq-AL' ? 'Asnjë vakt i gatuar' : 'No meals cooked'}
            </Text>
          </View>
        )}
      </Surface>

      {/* ── Cooked this week ── */}
      {weekSummary.some((d) => d.count > 0) && (
        <>
          <Text style={s.subHeading}>
            {language === 'sq-AL' ? 'Javën Kjo' : 'This Week'}
          </Text>
          <View style={s.historyList}>
            {weekSummary.filter((d) => d.entries.length > 0).map((day) => {
              const parts = day.dateKey.split('-');
              const dateLabel = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]))
                .toLocaleDateString(language === 'sq-AL' ? 'sq-AL' : 'en-US', { weekday: 'short', month: 'short', day: 'numeric' });
              return (
                <Surface key={day.dateKey} style={s.historyCard} elevation={0}>
                  <Text style={s.historyDate}>{dateLabel}</Text>
                  {day.entries.map((e, idx) => (
                    <View key={idx} style={s.historyEntryRow}>
                      <Text style={s.historyCheck}>✓</Text>
                      <Text style={s.historyRecipe} numberOfLines={1}>{e.recipeTitle}</Text>
                    </View>
                  ))}
                </Surface>
              );
            })}
          </View>
        </>
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
  snapCookedBubble: { backgroundColor: '#6ECAC0' },
  snapCookedText: { color: '#FFFFFF', fontWeight: '800' },
  cookedBadge: {
    position: 'absolute', top: 10, right: 10,
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: '#6ECAC0', alignItems: 'center', justifyContent: 'center',
    zIndex: 2,
  },
  cookedBadgeText: { fontSize: 14, color: '#FFFFFF', fontWeight: '800' },

  guestBanner: {
    backgroundColor: '#FFF9E0', borderRadius: 18,
    paddingHorizontal: 18, paddingVertical: 14,
    borderWidth: 1, borderColor: '#FFE57A',
  },
  guestBannerText: { fontSize: 15, fontWeight: '700', color: '#7A6200', textAlign: 'center' },

  noticeCard: { borderRadius: 24, backgroundColor: '#FFFFFFD9', padding: 16 },
  noticeText: { fontSize: 15, color: '#6E6560', textAlign: 'center' },

  calCard: {
    borderRadius: 28, backgroundColor: '#FEFEFE',
    padding: 16, gap: 10,
    borderWidth: 1, borderColor: '#F0EDE8',
  },
  calHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  calNavBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  calNavText: { fontSize: 26, color: '#111111', fontWeight: '300' },
  calMonthLabel: { fontSize: 17, fontWeight: '800', color: '#111111', textTransform: 'capitalize' },
  calDoW: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 4 },
  calDoWText: { width: 36, textAlign: 'center', fontSize: 11, fontWeight: '700', color: '#9E9590', textTransform: 'uppercase' },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calCell: { width: '14.28%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center', padding: 2 },
  calDot: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  calDotToday: { borderWidth: 2, borderColor: '#111111' },
  calDotSelected: { borderWidth: 2, borderColor: '#6ECAC0' },
  calDayNum: { fontSize: 13, fontWeight: '600', color: '#9E9590' },
  calDayNumActive: { color: '#1A3D3A', fontWeight: '800' },
  calDetail: { backgroundColor: '#F5FFFE', borderRadius: 14, padding: 12, gap: 6 },
  calDetailText: { fontSize: 14, color: '#1A3D3A', fontWeight: '600' },
  calDetailEmpty: { fontSize: 14, color: '#9E9590', textAlign: 'center' },

  historyList: { gap: 10 },
  historyCard: { borderRadius: 18, backgroundColor: '#FEFEFE', padding: 14, gap: 8, borderWidth: 1, borderColor: '#F0EDE8' },
  historyDate: { fontSize: 13, fontWeight: '800', color: '#9E9590', textTransform: 'uppercase', letterSpacing: 0.5 },
  historyEntryRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  historyCheck: { fontSize: 14, color: '#6ECAC0', fontWeight: '800' },
  historyRecipe: { flex: 1, fontSize: 14, color: '#1A1714', fontWeight: '600' },

  varietyCard: {
    borderRadius: 24, backgroundColor: '#FEFFFE',
    padding: 16, gap: 10,
    borderWidth: 1, borderColor: '#E8F0EE',
  },
  varietyTitle: { fontSize: 18, fontWeight: '800', color: '#111111' },
  varietySub: { fontSize: 12, fontWeight: '700', color: '#6E9A98', marginTop: -6 },
  varietyRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  varietyCell: { alignItems: 'center', gap: 4, flex: 1 },
  varietyBubble: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  varietyEmoji: { fontSize: 22 },
  varietyLabel: { fontSize: 9, fontWeight: '700', color: '#9E9590', textAlign: 'center' },
  varietyMissing: { fontSize: 8, fontWeight: '600', color: '#C4B8A8', textAlign: 'center' },

  gapCard: {
    borderRadius: 24, backgroundColor: '#FEFFFE',
    padding: 16, gap: 10,
    borderWidth: 1, borderColor: '#D8F0EE',
  },
  gapTitle: { fontSize: 18, fontWeight: '800', color: '#111111' },
  gapStage: { fontSize: 12, fontWeight: '700', color: '#6E9A98', textTransform: 'uppercase', marginTop: -6 },
  gapRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  gapLabel: { fontSize: 13, fontWeight: '600', color: '#3D3530', width: 84 },
  gapBarTrack: { flex: 1, height: 10, borderRadius: 5, backgroundColor: '#E8F5F4', overflow: 'hidden' },
  gapBarFill: { height: 10, borderRadius: 5, minWidth: 4 },
  gapValues: { fontSize: 11, fontWeight: '700', color: '#6E6560', width: 68, textAlign: 'right' },
  gapHint: { fontSize: 12, color: '#9E9590', textAlign: 'center', marginTop: 4 },

  streakCard: {
    borderRadius: 28, backgroundColor: '#FFF9EC',
    padding: 18, flexDirection: 'row',
    alignItems: 'center', gap: 16,
    borderWidth: 1, borderColor: '#FFE9A8',
  },
  streakLeft: { alignItems: 'center', minWidth: 52 },
  streakNumber: { fontSize: 40, lineHeight: 42, fontWeight: '800', color: '#111111' },
  streakLabel: { fontSize: 12, color: '#7A6200', fontWeight: '700', textAlign: 'center', marginTop: 2 },
  weekRow: { flex: 1, flexDirection: 'row', justifyContent: 'space-between' },
  dayCol: { alignItems: 'center', gap: 4 },
  daydot: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: '#F0EDE0',
    alignItems: 'center', justifyContent: 'center',
  },
  daydotActive: { backgroundColor: '#6ECAC0' },
  daydotToday: { borderWidth: 2, borderColor: '#111111' },
  daydotCount: { fontSize: 13, fontWeight: '800', color: '#FFFFFF' },
  dayLabel: { fontSize: 11, color: '#9E9590', fontWeight: '600' },
  dayLabelToday: { color: '#111111', fontWeight: '800' },
});
