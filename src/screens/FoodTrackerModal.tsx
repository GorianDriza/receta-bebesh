import { useCallback, useEffect, useState } from 'react';
import { FlatList, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { IconButton, Text } from 'react-native-paper';

import { AppLanguage } from '../i18n/translations';
import {
  FOOD_CATEGORIES,
  FoodStatus,
  FoodTrackerMap,
  getFoodTracker,
  setFoodStatus,
} from '../lib/foodTracker';
import { useLanguage } from '../providers/LanguageProvider';

const L: Record<AppLanguage, {
  title: string; subtitle: string; untried: string; safe: string; reaction: string;
}> = {
  'sq-AL': {
    title: 'Ushqimet e Provuara',
    subtitle: 'Trokitni një herë = e shëndetshme  ·  dy herë = reaksion',
    untried: 'Pa provuar',
    safe: 'E sigurt',
    reaction: 'Reaksion',
  },
  en: {
    title: 'Foods Introduced',
    subtitle: 'Tap once = safe  ·  tap again = reaction  ·  tap again = reset',
    untried: 'Untried',
    safe: 'Safe',
    reaction: 'Reaction',
  },
};

const STATUS_CYCLE: FoodStatus[] = ['safe', 'reaction', 'untried'];

function nextStatus(current: FoodStatus): FoodStatus {
  const idx = STATUS_CYCLE.indexOf(current);
  return STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length];
}

type Props = { visible: boolean; onClose: () => void };

export function FoodTrackerModal({ visible, onClose }: Props) {
  const { language } = useLanguage();
  const labels = L[language];
  const [map, setMap] = useState<FoodTrackerMap>({});

  const load = useCallback(async () => {
    setMap(await getFoodTracker());
  }, []);

  useEffect(() => {
    if (visible) load();
  }, [visible, load]);

  async function handleTap(foodId: string) {
    const current = map[foodId]?.status ?? 'untried';
    const next = nextStatus(current);
    await setFoodStatus(foodId, next);
    await load();
  }

  const triedCount = Object.keys(map).filter((id) => map[id]?.status === 'safe').length;
  const reactionCount = Object.keys(map).filter((id) => map[id]?.status === 'reaction').length;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaProvider>
        <SafeAreaView style={s.root}>
          {/* Header */}
          <View style={s.header}>
            <View>
              <Text style={s.title}>{labels.title}</Text>
              <Text style={s.subtitle}>{labels.subtitle}</Text>
            </View>
            <IconButton icon="close" size={22} iconColor="#1A1714" style={s.icon0} onPress={onClose} />
          </View>

          {/* Summary chips */}
          <View style={s.summaryRow}>
            <View style={[s.chip, s.chipSafe]}>
              <Text style={s.chipText}>✓ {triedCount} {labels.safe.toLowerCase()}</Text>
            </View>
            {reactionCount > 0 && (
              <View style={[s.chip, s.chipReaction]}>
                <Text style={s.chipText}>⚠ {reactionCount} {labels.reaction.toLowerCase()}</Text>
              </View>
            )}
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
            {FOOD_CATEGORIES.map((cat) => (
              <View key={cat.label.en} style={s.category}>
                <Text style={s.catLabel}>{language === 'sq-AL' ? cat.label.sq : cat.label.en}</Text>
                <View style={s.grid}>
                  {cat.items.map((food) => {
                    const status = map[food.id]?.status ?? 'untried';
                    return (
                      <Pressable
                        key={food.id}
                        style={[s.foodCell, status === 'safe' && s.foodCellSafe, status === 'reaction' && s.foodCellReaction]}
                        onPress={() => handleTap(food.id)}
                      >
                        <Text style={s.foodEmoji}>{food.emoji}</Text>
                        <Text style={[s.foodName, status !== 'untried' && s.foodNameActive]} numberOfLines={2}>
                          {language === 'sq-AL' ? food.sq : food.en}
                        </Text>
                        {status === 'safe'     && <Text style={s.statusDot}>✓</Text>}
                        {status === 'reaction' && <Text style={[s.statusDot, s.statusDotReaction]}>⚠</Text>}
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ))}
          </ScrollView>
        </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FEFEFF' },
  header: {
    flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#F0EEF5',
  },
  title: { fontSize: 20, fontWeight: '800', letterSpacing: -0.4, color: '#1A1714' },
  subtitle: { fontSize: 12, color: '#9E99B2', marginTop: 2 },
  icon0: { margin: 0 },
  summaryRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, paddingVertical: 10 },
  chip: {
    borderRadius: 999, paddingHorizontal: 14, paddingVertical: 6,
    backgroundColor: '#E8FAF8',
  },
  chipSafe: { backgroundColor: '#E8FAF8' },
  chipReaction: { backgroundColor: '#FFF0F0' },
  chipText: { fontSize: 13, fontWeight: '700', color: '#2A6B66' },
  scroll: { paddingHorizontal: 16, paddingBottom: 32 },
  category: { marginBottom: 24 },
  catLabel: { fontSize: 16, fontWeight: '700', color: '#1A1714', marginBottom: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  foodCell: {
    width: '28%', flexGrow: 1,
    borderRadius: 16, padding: 12,
    backgroundColor: '#F8F6FF',
    alignItems: 'center', gap: 4,
    position: 'relative',
  },
  foodCellSafe:     { backgroundColor: '#E8FAF8' },
  foodCellReaction: { backgroundColor: '#FFF0F0' },
  foodEmoji: { fontSize: 26 },
  foodName: { fontSize: 11, fontWeight: '600', color: '#9E99B2', textAlign: 'center' },
  foodNameActive: { color: '#2A6B66' },
  statusDot: {
    position: 'absolute', top: 6, right: 8,
    fontSize: 12, fontWeight: '800', color: '#3AABA0',
  },
  statusDotReaction: { color: '#E05252' },
});
