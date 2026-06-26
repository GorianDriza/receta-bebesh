import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Surface, Text } from 'react-native-paper';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import {
  DAYS_ORDER,
  DayPlanSuggestion,
  generateWeeklyPlan,
  getDayLabel,
  WeekPlanSuggestion,
} from '../lib/geminiPlan';
import { RecipeRecord } from '../lib/recipes';
import { useLanguage } from '../providers/LanguageProvider';

const MEAL_LABELS = {
  breakfast: { 'sq-AL': '🍳 Mëngjes', en: '🍳 Breakfast' },
  lunch:     { 'sq-AL': '🥗 Drekë',   en: '🥗 Lunch'    },
  dinner:    { 'sq-AL': '🍲 Darkë',   en: '🍲 Dinner'   },
  snack:     { 'sq-AL': '🍓 Meze',    en: '🍓 Snack'    },
};

const MEAL_ORDER: Array<keyof typeof MEAL_LABELS> = ['breakfast', 'lunch', 'dinner', 'snack'];

type Props = {
  visible: boolean;
  onClose: () => void;
  recipes: RecipeRecord[];
  babyAgeMonths: number;
};

export function AIPlanModal({ visible, onClose, recipes, babyAgeMonths }: Props) {
  const { language } = useLanguage();
  const [plan, setPlan]     = useState<WeekPlanSuggestion | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState<string | null>(null);

  const recipeMap = new Map(recipes.map((r) => [r.id, r]));

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    setPlan(null);
    try {
      const result = await generateWeeklyPlan(babyAgeMonths, recipes, language);
      setPlan(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  function recipeTitle(id?: string): string {
    if (!id) return '—';
    const r = recipeMap.get(id);
    return r ? r.title[language] : id;
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaProvider>
        <SafeAreaView style={s.root}>
          <View style={s.topBar}>
            <Pressable style={s.closeBtn} onPress={onClose} hitSlop={8}>
              <Text style={s.closeX}>✕</Text>
            </Pressable>
            <Text style={s.title}>
              {language === 'sq-AL' ? '✨ Plan i Javës me AI' : '✨ AI Weekly Plan'}
            </Text>
            <View style={{ width: 36 }} />
          </View>

          <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

            <Surface style={s.infoCard} elevation={0}>
              <Text style={s.infoText}>
                {language === 'sq-AL'
                  ? `Gjemin AI do të krijojë një plan 7-ditor për beben tuaj (${babyAgeMonths} muaj) duke zgjedhur receta nga lista juaj.`
                  : `Gemini AI will build a 7-day plan for your baby (${babyAgeMonths}m) by picking from your recipe list.`}
              </Text>
              <Pressable
                style={[s.generateBtn, loading && s.generateBtnDim]}
                onPress={handleGenerate}
                disabled={loading}
              >
                <Text style={s.generateBtnLabel}>
                  {loading
                    ? (language === 'sq-AL' ? 'Duke gjeneruar...' : 'Generating...')
                    : (language === 'sq-AL' ? '✨ Gjenero planin' : '✨ Generate plan')}
                </Text>
              </Pressable>
            </Surface>

            {error != null && (
              <Surface style={s.errorCard} elevation={0}>
                <Text style={s.errorText}>{error}</Text>
              </Surface>
            )}

            {plan != null && (
              <View style={s.weekGrid}>
                {DAYS_ORDER.map((day) => {
                  const dayPlan: DayPlanSuggestion = plan[day] ?? {};
                  return (
                    <Surface key={day} style={s.dayCard} elevation={0}>
                      <Text style={s.dayName}>{getDayLabel(day, language)}</Text>
                      {MEAL_ORDER.map((meal) => {
                        const rid = dayPlan[meal];
                        return (
                          <View key={meal} style={s.mealRow}>
                            <Text style={s.mealLabel}>{MEAL_LABELS[meal][language]}</Text>
                            <Text style={s.mealTitle} numberOfLines={2}>
                              {recipeTitle(rid)}
                            </Text>
                          </View>
                        );
                      })}
                    </Surface>
                  );
                })}
              </View>
            )}

          </ScrollView>
        </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
}

const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: '#F7F3FF' },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingVertical: 12 },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#EDE8FF', alignItems: 'center', justifyContent: 'center' },
  closeX: { fontSize: 16, color: '#555', fontWeight: '700' },
  title:  { fontSize: 18, fontWeight: '800', letterSpacing: -0.5, color: '#2A1A60', textAlign: 'center', flex: 1 },

  scroll: { paddingHorizontal: 18, paddingBottom: 40, gap: 16 },

  infoCard: { borderRadius: 24, backgroundColor: '#EDE8FF', padding: 18, gap: 14 },
  infoText: { fontSize: 15, lineHeight: 22, color: '#3A2A70' },
  generateBtn: { backgroundColor: '#6A42D8', borderRadius: 999, paddingVertical: 16, alignItems: 'center' },
  generateBtnDim: { opacity: 0.6 },
  generateBtnLabel: { fontSize: 16, fontWeight: '800', color: '#FFFFFF' },

  errorCard: { borderRadius: 18, backgroundColor: '#FFE9E9', padding: 14 },
  errorText: { fontSize: 14, color: '#C42020' },

  weekGrid: { gap: 12 },
  dayCard: { borderRadius: 22, backgroundColor: '#FFFFFF', padding: 16, gap: 10 },
  dayName: { fontSize: 18, fontWeight: '800', color: '#2A1A60', letterSpacing: -0.4 },
  mealRow: { gap: 2 },
  mealLabel: { fontSize: 12, fontWeight: '700', color: '#8870CC' },
  mealTitle: { fontSize: 14, color: '#1A1714', lineHeight: 19 },
});
