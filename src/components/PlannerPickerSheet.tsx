import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

import { DayKey, getISOWeekKey, PlannerMealType, setPlannerEntry } from '../lib/planner';
import { RecipeRecord } from '../lib/recipes';
import { useAuth } from '../providers/AuthProvider';
import { useLanguage } from '../providers/LanguageProvider';

const DAYS: Array<{ key: DayKey; sq: string; en: string }> = [
  { key: 'mon', sq: 'Hë', en: 'Mo' }, { key: 'tue', sq: 'Ma', en: 'Tu' },
  { key: 'wed', sq: 'Më', en: 'We' }, { key: 'thu', sq: 'En', en: 'Th' },
  { key: 'fri', sq: 'Pr', en: 'Fr' }, { key: 'sat', sq: 'Sh', en: 'Sa' },
  { key: 'sun', sq: 'Di', en: 'Su' },
];

const MEAL_OPTS: Array<{ key: PlannerMealType; sq: string; en: string }> = [
  { key: 'breakfast', sq: 'Mëngjes', en: 'Breakfast' },
  { key: 'lunch',     sq: 'Drekë',   en: 'Lunch' },
  { key: 'dinner',    sq: 'Darkë',   en: 'Dinner' },
  { key: 'snack',     sq: 'Meze',    en: 'Snack' },
];

type Props = {
  recipe: RecipeRecord;
  onClose: () => void;
  onAdded?: () => void;
};

export function PlannerPickerSheet({ recipe, onClose, onAdded }: Props) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const [selDay, setSelDay]   = useState<DayKey>('mon');
  const [selMeal, setSelMeal] = useState<PlannerMealType>('lunch');

  async function handleAdd() {
    if (!user) return;
    await setPlannerEntry(user.uid, getISOWeekKey(new Date()), selDay, selMeal, {
      recipeId: recipe.id,
      recipeTitle: recipe.title[language],
      recipeImage: recipe.image?.sourceUrl ?? recipe.image?.downloadUrl ?? null,
      addedAt: new Date().toISOString(),
    });
    onAdded?.();
    onClose();
  }

  return (
    <View style={s.root}>
      <Pressable style={s.backdrop} onPress={onClose} />
      <View style={s.sheet}>
        <Text style={s.title}>
          {language === 'sq-AL' ? 'Zgjidhni ditën dhe vaktin' : 'Choose day and meal'}
        </Text>
        <View style={s.row}>
          {DAYS.map((d) => (
            <Pressable
              key={d.key}
              style={[s.pill, selDay === d.key && s.pillOn]}
              onPress={() => setSelDay(d.key)}
            >
              <Text style={[s.pillText, selDay === d.key && s.pillTextOn]}>
                {language === 'sq-AL' ? d.sq : d.en}
              </Text>
            </Pressable>
          ))}
        </View>
        <View style={s.row}>
          {MEAL_OPTS.map((m) => (
            <Pressable
              key={m.key}
              style={[s.pill, selMeal === m.key && s.pillOn]}
              onPress={() => setSelMeal(m.key)}
            >
              <Text style={[s.pillText, selMeal === m.key && s.pillTextOn]}>
                {language === 'sq-AL' ? m.sq : m.en}
              </Text>
            </Pressable>
          ))}
        </View>
        <Pressable style={s.addBtn} onPress={handleAdd}>
          <Text style={s.addBtnLabel}>
            {language === 'sq-AL' ? '✓ Shto në Plan' : '✓ Add to Plan'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { ...StyleSheet.absoluteFill, justifyContent: 'flex-end', zIndex: 20 },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: '#00000044' },
  sheet: {
    backgroundColor: '#FFF9F5', borderTopLeftRadius: 32, borderTopRightRadius: 32,
    padding: 24, gap: 14,
  },
  title: { fontSize: 17, fontWeight: '800', color: '#1A1714', textAlign: 'center' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: { borderRadius: 999, paddingHorizontal: 14, paddingVertical: 9, backgroundColor: '#F0EDE9' },
  pillOn: { backgroundColor: '#1A1714' },
  pillText: { fontSize: 14, fontWeight: '700', color: '#3D3530' },
  pillTextOn: { color: '#FFFFFF' },
  addBtn: {
    backgroundColor: '#6ECAC0', borderRadius: 999,
    paddingVertical: 17, alignItems: 'center', marginTop: 4,
  },
  addBtnLabel: { fontSize: 16, fontWeight: '800', color: '#FFFFFF' },
});
