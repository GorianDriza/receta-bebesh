import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Chip, Surface, Text } from 'react-native-paper';

import { useLanguage } from '../providers/LanguageProvider';

type LearningTopic = 'All' | 'Nutrition' | 'Sustainability' | 'Fitness';

type LearningCard = {
  id: string;
  title: string;
  author: string;
  topic: Exclude<LearningTopic, 'All'>;
  badge: string;
  backgroundColor: string;
  ringColor: string;
};

const TOPICS: LearningTopic[] = ['All', 'Nutrition', 'Sustainability', 'Fitness'];

const LEARNING_CARDS: LearningCard[] = [
  { id: 'nutrition', title: 'Nutrition Without Obsession',        author: 'NutritionistheNewBlack', topic: 'Nutrition',      badge: 'N',  backgroundColor: '#CABEFF', ringColor: '#A68DFF' },
  { id: 'peels',     title: 'Tricks for Citrus Peels',            author: 'TooGoodToGo',            topic: 'Sustainability', badge: 'TG', backgroundColor: '#FFFFFF', ringColor: '#98E8D3' },
  { id: 'balanced',  title: 'Recipes for a Balanced Family Week',  author: 'ekilu Team',             topic: 'Nutrition',      badge: 'ek', backgroundColor: '#FFF39D', ringColor: '#F4E15F' },
  { id: 'walks',     title: "Stick to New Year's Walk Rituals",    author: 'Amy C.',                 topic: 'Fitness',        badge: 'A',  backgroundColor: '#CBFFD6', ringColor: '#98E8AA' },
];

export function LearningContent() {
  const { language, t } = useLanguage();
  const [selectedTopic, setSelectedTopic] = useState<LearningTopic>('All');

  const visibleCards = useMemo(
    () => selectedTopic === 'All'
      ? LEARNING_CARDS
      : LEARNING_CARDS.filter((c) => c.topic === selectedTopic),
    [selectedTopic],
  );

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={s.scroll}
    >
      <Text style={s.heading}>{t[language].home.learningTitle}</Text>

      {/* Topic chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.topicRow}
      >
        {TOPICS.map((topic) => (
          <Chip
            key={topic}
            selected={selectedTopic === topic}
            onPress={() => setSelectedTopic(topic)}
            compact
            style={[s.chip, selectedTopic === topic && s.chipOn]}
            textStyle={[s.chipText, selectedTopic === topic && s.chipTextOn]}
          >
            {topic}
          </Chip>
        ))}
      </ScrollView>

      {/* Learning cards */}
      <View style={s.cardList}>
        {visibleCards.map((card) => (
          <Surface
            key={card.id}
            style={[s.card, { backgroundColor: card.backgroundColor }]}
            elevation={0}
          >
            {/* Decorative ring */}
            <View style={s.cardPattern} />
            {/* Notches */}
            <View style={s.notchTop} />
            <View style={s.notchBottom} />

            <View style={s.cardCopy}>
              <Text style={s.cardTitle}>{card.title}</Text>
              <Text style={s.cardAuthor}>{card.author}</Text>
            </View>

            <View style={[s.avatarRing, { borderColor: card.ringColor }]}>
              <View style={[s.avatarCore, { backgroundColor: card.ringColor }]}>
                <Text style={s.badge}>{card.badge}</Text>
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

  // Topic chips
  topicRow: { paddingRight: 12, gap: 10 },
  chip: {
    borderRadius: 999,
    backgroundColor: '#FFFFFFD9',
    paddingHorizontal: 6,
    paddingVertical: 8,
  },
  chipOn:      { backgroundColor: '#111111' },
  chipText:    { fontSize: 16, fontWeight: '600', color: '#1E1B2F' },
  chipTextOn:  { color: '#FFFFFF' },

  // Cards
  cardList: { gap: 14 },
  card: {
    minHeight: 156,
    borderRadius: 30,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  cardPattern: {
    position: 'absolute',
    right: 16, top: 14,
    width: 120, height: 120,
    borderRadius: 60,
    borderWidth: 12,
    borderColor: '#FFFFFF12',
  },
  notchTop: {
    position: 'absolute',
    width: 34, height: 8,
    borderRadius: 999,
    top: 0,
    left: '50%',
    marginLeft: -17,
    backgroundColor: '#EFEAFF',
  },
  notchBottom: {
    position: 'absolute',
    width: 34, height: 8,
    borderRadius: 999,
    bottom: 0,
    left: '50%',
    marginLeft: -17,
    backgroundColor: '#EFEAFF',
  },
  cardCopy: { flex: 1, paddingRight: 16, gap: 10 },
  cardTitle: {
    fontSize: 23,
    lineHeight: 30,
    fontWeight: '800',
    letterSpacing: -0.8,
    color: '#111111',
  },
  cardAuthor: { fontSize: 16, color: '#575265' },

  // Avatar ring
  avatarRing: {
    width: 76, height: 76,
    borderRadius: 38,
    borderWidth: 4,
    backgroundColor: '#FFFFFFB5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarCore: {
    width: 52, height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: { fontSize: 18, fontWeight: '800', color: '#111111' },
});
