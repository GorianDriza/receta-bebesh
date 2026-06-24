import { ScrollView, StyleSheet, View } from 'react-native';
import { IconButton, Surface, Text } from 'react-native-paper';

import { useLanguage } from '../providers/LanguageProvider';

type MacroCard = {
  id: string;
  label: string;
  value: string;
  icon: string;
  tint: string;
};

type SnapshotCard = {
  id: string;
  meal: string;
  calories: string;
  emoji: string;
  backgroundColor: string;
  accentColor: string;
};

const MACRO_CARDS: MacroCard[] = [
  { id: 'carbs',   label: 'Power Carbs',  value: '0/150 gr', icon: 'barley',        tint: '#FFA800' },
  { id: 'protein', label: 'Protein Power', value: '0/113 gr', icon: 'food-steak',    tint: '#FF8C1A' },
  { id: 'fat',     label: 'Healthy Fat',  value: '0/50 gr',  icon: 'water-outline', tint: '#F2B23D' },
];

const SNAPSHOTS: SnapshotCard[] = [
  { id: 'breakfast', meal: 'Breakfast', calories: '631 kcal', emoji: '🍳', backgroundColor: '#CFC2FF', accentColor: '#B79DFE' },
  { id: 'lunch',     meal: 'Lunch',     calories: '486 kcal', emoji: '🥙', backgroundColor: '#FFF19D', accentColor: '#FFE25A' },
  { id: 'dinner',    meal: 'Dinner',    calories: '359 kcal', emoji: '🍲', backgroundColor: '#CFFFD6', accentColor: '#ACEDB7' },
  { id: 'snack',     meal: 'Snack',     calories: '193 kcal', emoji: '🍓', backgroundColor: '#FFD9AE', accentColor: '#FFC681' },
];

export function JournalContent() {
  const { language, t } = useLanguage();

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={s.scroll}
    >
      <Text style={s.heading}>{t[language].home.journalTitle}</Text>

      {/* Calories panel */}
      <Surface style={s.panel} elevation={0}>
        {/* Panel header */}
        <View style={s.panelHeader}>
          <View style={s.panelTitleRow}>
            <View style={s.fireBubble}>
              <Text style={s.fireEmoji}>🔥</Text>
            </View>
            <View>
              <Text style={s.panelTitle}>Calories</Text>
              <Text style={s.panelSub}>{t[language].home.journalSubtitle}</Text>
            </View>
          </View>
          <View style={s.calBubble}>
            <IconButton icon="calendar-month" size={20} iconColor="#111" style={s.icon0} />
          </View>
        </View>

        {/* Metric rows */}
        <View style={s.metricRow}>
          <Text style={s.metricLabel}>{t[language].home.consumed}</Text>
          <Text style={s.metricValue}>00 cal</Text>
        </View>
        <View style={s.metricRow}>
          <Text style={s.metricLabel}>{t[language].home.remaining}</Text>
          <Text style={s.metricValue}>00 cal</Text>
        </View>
        <View style={[s.metricRow, s.metricRowSoft]}>
          <Text style={s.metricLabel}>{t[language].home.hydration}</Text>
          <Text style={s.metricValue}>06 {t[language].home.cups}</Text>
        </View>

        {/* Macro cards */}
        <View style={s.macroRow}>
          {MACRO_CARDS.map((macro) => (
            <Surface key={macro.id} style={s.macroCard} elevation={0}>
              <Text style={s.macroValue}>{macro.value}</Text>
              <View style={s.macroIconRow}>
                <IconButton icon={macro.icon} size={20} iconColor={macro.tint} style={s.icon0} />
              </View>
              <Text style={s.macroLabel}>{macro.label}</Text>
            </Surface>
          ))}
        </View>
      </Surface>

      {/* Snapshot grid */}
      <View style={s.snapshotGrid}>
        {SNAPSHOTS.map((snap) => (
          <Surface
            key={snap.id}
            style={[s.snapCard, { backgroundColor: snap.backgroundColor }]}
            elevation={0}
          >
            <View style={[s.snapAccent, { backgroundColor: snap.accentColor }]} />

            <View style={s.snapHeader}>
              <View style={s.snapEmojiBubble}>
                <Text style={s.snapEmoji}>{snap.emoji}</Text>
              </View>
              <Text style={s.snapCalories}>{snap.calories}</Text>
            </View>

            <View style={s.snapFooter}>
              <Text style={s.snapMeal}>{snap.meal}</Text>
              <View style={s.snapPlusBubble}>
                <IconButton icon="plus" size={20} iconColor="#111" style={s.icon0} />
              </View>
            </View>
          </Surface>
        ))}
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  scroll: {
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 20,
    gap: 18,
  },
  heading: {
    fontSize: 38,
    lineHeight: 42,
    fontWeight: '800',
    letterSpacing: -1.4,
    color: '#111111',
  },

  // Calories panel
  panel: {
    borderRadius: 32,
    padding: 18,
    backgroundColor: '#FEFEFF',
    gap: 12,
  },
  panelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  panelTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  fireBubble: {
    width: 52, height: 52,
    borderRadius: 26,
    backgroundColor: '#FFF9EC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fireEmoji:  { fontSize: 24 },
  panelTitle: {
    fontSize: 27,
    lineHeight: 29,
    fontWeight: '800',
    letterSpacing: -1,
    color: '#111111',
  },
  panelSub:   { marginTop: 4, fontSize: 15, color: '#7B7287' },
  calBubble: {
    width: 48, height: 48,
    borderRadius: 24,
    backgroundColor: '#F5F5F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon0: { margin: 0 },

  // Metric rows
  metricRow: {
    borderRadius: 18,
    backgroundColor: '#F2F2F9',
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricRowSoft: {
    backgroundColor: '#FCFCFF',
    borderWidth: 1,
    borderColor: '#F1EEF7',
  },
  metricLabel: { fontSize: 18, color: '#39354A' },
  metricValue: { fontSize: 18, fontWeight: '700', color: '#111111' },

  // Macro cards
  macroRow: { flexDirection: 'row', gap: 10 },
  macroCard: {
    flex: 1,
    borderRadius: 24,
    backgroundColor: '#F7F7FB',
    padding: 12,
    minHeight: 126,
  },
  macroValue: {
    fontSize: 22,
    lineHeight: 24,
    fontWeight: '800',
    color: '#111111',
  },
  macroIconRow: { marginTop: 10, alignItems: 'flex-start' },
  macroLabel:   { marginTop: 8, fontSize: 16, lineHeight: 22, color: '#39354A' },

  // Snapshot grid
  snapshotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  snapCard: {
    width: '47.5%',
    minHeight: 152,
    borderRadius: 28,
    padding: 14,
    overflow: 'hidden',
    justifyContent: 'space-between',
  },
  snapAccent: {
    position: 'absolute',
    width: 52, height: 52,
    right: 20, bottom: 24,
    borderRadius: 14,
    opacity: 0.35,
  },
  snapHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  snapEmojiBubble: {
    width: 42, height: 42,
    borderRadius: 21,
    backgroundColor: '#FFFFFFD8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  snapEmoji:    { fontSize: 22 },
  snapCalories: { fontSize: 17, fontWeight: '700', color: '#111111' },
  snapFooter: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  snapMeal:     { fontSize: 17, fontWeight: '700', color: '#111111' },
  snapPlusBubble: {
    width: 52, height: 52,
    borderRadius: 26,
    backgroundColor: '#FFFFFFE8',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
