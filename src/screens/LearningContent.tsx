import { useMemo, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Surface, Text } from 'react-native-paper';

import { AppLanguage } from '../i18n/translations';
import { useLanguage } from '../providers/LanguageProvider';

type TopicKey = 'all' | 'firstfoods' | 'nutrition' | 'allergies' | 'tips';

type Card = {
  id: string;
  topic: Exclude<TopicKey, 'all'>;
  title: Record<AppLanguage, string>;
  excerpt: Record<AppLanguage, string>;
  badge: string;
  bg: string;
  ring: string;
};

const TOPICS: Array<{ key: TopicKey; sq: string; en: string }> = [
  { key: 'all',        sq: 'Të gjitha', en: 'All' },
  { key: 'firstfoods', sq: 'Ushqimet e para', en: 'First Foods' },
  { key: 'nutrition',  sq: 'Ushqyerja',       en: 'Nutrition' },
  { key: 'allergies',  sq: 'Alergji',          en: 'Allergies' },
  { key: 'tips',       sq: 'Këshilla',         en: 'Tips' },
];

const CARDS: Card[] = [
  {
    id: 'spoon',
    topic: 'firstfoods',
    title: {
      'sq-AL': 'Si të filloni ushqyerjen me lugë',
      en:      'How to start spoon feeding',
    },
    excerpt: {
      'sq-AL': 'Hapat e parë drejt ushqyerjes me luge — nga pozicioni deri tek qëndrueshmëria.',
      en:      'First steps toward spoon feeding — from position to consistency.',
    },
    badge: 'UL', bg: '#CABEFF', ring: '#A68DFF',
  },
  {
    id: 'puree4',
    topic: 'firstfoods',
    title: {
      'sq-AL': 'Ushqimet e para: 4–6 muaj',
      en:      'First foods: 4–6 months',
    },
    excerpt: {
      'sq-AL': 'Perime dhe fruta të buta janë ideale — patate e ëmbël, karotë, bananet.',
      en:      'Soft vegetables and fruits are ideal — sweet potato, carrot, banana.',
    },
    badge: '4m', bg: '#FFF39D', ring: '#F4E15F',
  },
  {
    id: 'iron',
    topic: 'nutrition',
    title: {
      'sq-AL': 'Rëndësia e hekurit tek bebe',
      en:      'Why iron matters for babies',
    },
    excerpt: {
      'sq-AL': 'Bebe humbasin hekurin nga nëna pas 6 muajve. Mëso si ta plotësosh.',
      en:      'Babies deplete maternal iron after 6 months. Learn how to replenish.',
    },
    badge: 'Fe', bg: '#CFFFD6', ring: '#98E8AA',
  },
  {
    id: 'allergens',
    topic: 'allergies',
    title: {
      'sq-AL': 'Ushqimet alergjike — çfarë duhet të dini',
      en:      'Allergenic foods — what you need to know',
    },
    excerpt: {
      'sq-AL': 'Njëra nga zakonet e reja: futni alergjenët herët për të zvogëluar rrezikun.',
      en:      'New guidance: introduce allergens early to reduce allergy risk.',
    },
    badge: 'A!', bg: '#FFD9AE', ring: '#FFC681',
  },
  {
    id: 'variety',
    topic: 'nutrition',
    title: {
      'sq-AL': 'Ekspozimi ndaj shijeve të ndryshme',
      en:      'Exposing babies to diverse flavours',
    },
    excerpt: {
      'sq-AL': '8–10 ekspozime të ndryshme mund të ndihmojnë beben të pranojë ushqime të reja.',
      en:      '8–10 exposures can help babies accept new foods — keep offering.',
    },
    badge: '🌈', bg: '#D4F0FF', ring: '#94D8FF',
  },
  {
    id: 'texture',
    topic: 'tips',
    title: {
      'sq-AL': 'Kalimi nga pure te ushqimi i grirë',
      en:      'Moving from purée to mashed food',
    },
    excerpt: {
      'sq-AL': 'Rreth 8 muajve, fëmijët janë gati për tekstura pak më të trasha.',
      en:      'Around 8 months babies are ready for slightly thicker textures.',
    },
    badge: 'TX', bg: '#F0CBFF', ring: '#D494FF',
  },
];

export function LearningContent() {
  const { language } = useLanguage();
  const [selectedTopic, setSelectedTopic] = useState<TopicKey>('all');

  const visible = useMemo(
    () => selectedTopic === 'all' ? CARDS : CARDS.filter((c) => c.topic === selectedTopic),
    [selectedTopic],
  );

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
      <Text style={s.heading}>
        {language === 'sq-AL' ? 'Mëso 🌱' : 'Learn 🌱'}
      </Text>

      {/* Topic chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.topicRow}>
        {TOPICS.map((t) => (
          <Pressable
            key={t.key}
            style={[s.chip, selectedTopic === t.key && s.chipOn]}
            onPress={() => setSelectedTopic(t.key)}
          >
            <Text style={[s.chipText, selectedTopic === t.key && s.chipTextOn]}>
              {language === 'sq-AL' ? t.sq : t.en}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Cards */}
      <View style={s.cardList}>
        {visible.map((card) => (
          <Surface key={card.id} style={[s.card, { backgroundColor: card.bg }]} elevation={0}>
            <View style={s.cardPattern} />
            <View style={s.notchTop} />
            <View style={s.notchBottom} />

            <View style={s.cardCopy}>
              <View style={[s.topicPill, { backgroundColor: `${card.ring}66` }]}>
                <Text style={[s.topicPillText, { color: '#2A2030' }]}>
                  {language === 'sq-AL'
                    ? TOPICS.find((t) => t.key === card.topic)?.sq ?? ''
                    : TOPICS.find((t) => t.key === card.topic)?.en ?? ''}
                </Text>
              </View>
              <Text style={s.cardTitle}>{card.title[language]}</Text>
              <Text style={s.cardExcerpt}>{card.excerpt[language]}</Text>
            </View>

            <View style={[s.avatarRing, { borderColor: card.ring }]}>
              <View style={[s.avatarCore, { backgroundColor: card.ring }]}>
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
  scroll: { paddingHorizontal: 18, paddingTop: 8, paddingBottom: 20, gap: 18 },
  heading: { fontSize: 38, lineHeight: 42, fontWeight: '800', letterSpacing: -1.4, color: '#111111' },

  topicRow: { paddingRight: 12, gap: 10 },
  chip: { borderRadius: 999, backgroundColor: '#FFFFFFD9', paddingHorizontal: 18, paddingVertical: 10 },
  chipOn:     { backgroundColor: '#111111' },
  chipText:   { fontSize: 14, fontWeight: '700', color: '#1E1B2F' },
  chipTextOn: { color: '#FFFFFF' },

  cardList: { gap: 14 },
  card: {
    minHeight: 156, borderRadius: 30, padding: 18,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', overflow: 'hidden',
  },
  cardPattern: {
    position: 'absolute', right: 16, top: 14,
    width: 120, height: 120, borderRadius: 60,
    borderWidth: 12, borderColor: '#FFFFFF12',
  },
  notchTop: {
    position: 'absolute', width: 34, height: 8, borderRadius: 999,
    top: 0, left: '50%', marginLeft: -17, backgroundColor: '#EFEAFF',
  },
  notchBottom: {
    position: 'absolute', width: 34, height: 8, borderRadius: 999,
    bottom: 0, left: '50%', marginLeft: -17, backgroundColor: '#EFEAFF',
  },
  cardCopy: { flex: 1, paddingRight: 16, gap: 8 },
  topicPill: { alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  topicPillText: { fontSize: 11, fontWeight: '700' },
  cardTitle: { fontSize: 20, lineHeight: 26, fontWeight: '800', letterSpacing: -0.6, color: '#111111' },
  cardExcerpt: { fontSize: 13, lineHeight: 18, color: '#575265' },

  avatarRing: {
    width: 76, height: 76, borderRadius: 38,
    borderWidth: 4, backgroundColor: '#FFFFFFB5',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarCore: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  badge: { fontSize: 16, fontWeight: '800', color: '#111111' },
});
