import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
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
  // ── First Foods ───────────────────────────────────────────────────────────
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
    id: 'blw',
    topic: 'firstfoods',
    title: {
      'sq-AL': 'Ushqyerja e drejtuar nga bebja (BLW)',
      en:      'Baby-led weaning (BLW)',
    },
    excerpt: {
      'sq-AL': 'Jepuni bebës copa të buta në vend të pure — nxit pavarësinë dhe shijet.',
      en:      'Offer soft finger pieces instead of purée — builds independence and taste.',
    },
    badge: 'BLW', bg: '#CFFFD6', ring: '#98E8AA',
  },
  {
    id: 'finger6',
    topic: 'firstfoods',
    title: {
      'sq-AL': 'Ushqimet me gishta nga 6 muajt',
      en:      'Finger foods from 6 months',
    },
    excerpt: {
      'sq-AL': 'Karotë e zier, bananet e pjekur, avokado — të buta dhe pa rrezik mbytjeje.',
      en:      'Steamed carrot, ripe banana, avocado — soft, low choking risk foods.',
    },
    badge: '👆', bg: '#FFD9AE', ring: '#FFC681',
  },
  {
    id: 'water',
    topic: 'firstfoods',
    title: {
      'sq-AL': 'Kur të filloni ujin',
      en:      'When to introduce water',
    },
    excerpt: {
      'sq-AL': 'Uji mund të ofrohet nga 6 muajt kur beba ha ushqime të ngurta.',
      en:      'Small sips of water can start at 6 months once solid foods begin.',
    },
    badge: '💧', bg: '#D4F0FF', ring: '#94D8FF',
  },
  {
    id: 'grains',
    topic: 'firstfoods',
    title: {
      'sq-AL': 'Drithërat dhe cerealet',
      en:      'Grains and cereals',
    },
    excerpt: {
      'sq-AL': 'Orizin, tërbithë dhe misrin mund t’i shtoni nga 6 muajt si pure ose qull.',
      en:      'Rice, oats, and corn can be introduced from 6 months as porridge or mash.',
    },
    badge: '🌾', bg: '#CABEFF', ring: '#A68DFF',
  },
  // ── Nutrition ──────────────────────────────────────────────────────────────
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
    id: 'omega3',
    topic: 'nutrition',
    title: {
      'sq-AL': 'Acidet yndyrore Omega-3 për trurin',
      en:      'Omega-3 fatty acids for brain growth',
    },
    excerpt: {
      'sq-AL': 'Peshku si salmoni, sardelet dhe luleshtrydhet janë burime të mira DHA.',
      en:      'Salmon, sardines, and walnuts are great DHA sources for developing brains.',
    },
    badge: 'Ω3', bg: '#FFF39D', ring: '#F4E15F',
  },
  {
    id: 'calcium',
    topic: 'nutrition',
    title: {
      'sq-AL': 'Kalciumi dhe kockat e forta',
      en:      'Calcium for strong bones',
    },
    excerpt: {
      'sq-AL': 'Gjalpi, kosi dhe djathi janë burime kalciumi pas vitit të parë.',
      en:      'Yoghurt, cheese, and dairy provide calcium after the first year.',
    },
    badge: 'Ca', bg: '#F0CBFF', ring: '#D494FF',
  },
  {
    id: 'vitamin_d',
    topic: 'nutrition',
    title: {
      'sq-AL': 'Vitamina D — pse është e domosdoshme',
      en:      'Vitamin D — why it is essential',
    },
    excerpt: {
      'sq-AL': 'Shumë fëmijë kanë nevojë për suplemente Vit D, sidomos gjatë dimrit.',
      en:      'Many babies need a Vit D supplement, especially in winter months.',
    },
    badge: 'D☀', bg: '#FFD9AE', ring: '#FFC681',
  },
  // ── Allergies ──────────────────────────────────────────────────────────────
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
    id: 'big8',
    topic: 'allergies',
    title: {
      'sq-AL': '8 alergjenët kryesorë',
      en:      'The 8 major allergens',
    },
    excerpt: {
      'sq-AL': 'Qumështi, vezët, kikiriku, arrat, soja, gruri, peshku, gaforrja.',
      en:      'Milk, eggs, peanuts, tree nuts, soy, wheat, fish, shellfish.',
    },
    badge: '×8', bg: '#CFFFD6', ring: '#98E8AA',
  },
  {
    id: 'reaction',
    topic: 'allergies',
    title: {
      'sq-AL': 'Shenjat e reagimit alergjik',
      en:      'Signs of an allergic reaction',
    },
    excerpt: {
      'sq-AL': 'Kruajtja, ënjtja e buzëve, kollitja ose të vjellat — njohni shenjat herët.',
      en:      'Hives, lip swelling, coughing, or vomiting — recognize the signs early.',
    },
    badge: '⚠', bg: '#CABEFF', ring: '#A68DFF',
  },
  {
    id: 'introduce_timing',
    topic: 'allergies',
    title: {
      'sq-AL': 'Koha e duhur për futjen e alergjenëve',
      en:      'Right timing for allergen introduction',
    },
    excerpt: {
      'sq-AL': 'Fëmijët me ekzemë kanë rrezik më të lartë — konsultohuni me mjekun.',
      en:      'Babies with eczema are higher risk — consult your doctor before introducing.',
    },
    badge: '⏱', bg: '#FFF39D', ring: '#F4E15F',
  },
  // ── Tips ──────────────────────────────────────────────────────────────────
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
  {
    id: 'gagging',
    topic: 'tips',
    title: {
      'sq-AL': 'Ngjirja vs mbytja — ndryshimi',
      en:      'Gagging vs choking — the difference',
    },
    excerpt: {
      'sq-AL': 'Ngjirja është normale dhe mbrojtëse; mbytja është e heshtur dhe e rrezikshme.',
      en:      'Gagging is normal and protective; choking is silent and needs action.',
    },
    badge: '!', bg: '#D4F0FF', ring: '#94D8FF',
  },
  {
    id: 'refuses',
    topic: 'tips',
    title: {
      'sq-AL': 'Kur bebja refuzon ushqimin',
      en:      'When baby refuses food',
    },
    excerpt: {
      'sq-AL': 'Refuzimi është normal. Riofrojeni ushqimin pas 2–3 ditësh pa presion.',
      en:      'Refusal is normal. Re-offer the food after 2–3 days without pressure.',
    },
    badge: '🙅', bg: '#FFD9AE', ring: '#FFC681',
  },
  {
    id: 'batch',
    topic: 'tips',
    title: {
      'sq-AL': 'Gatimi në sasi të mëdha dhe ngrirja',
      en:      'Batch cooking and freezing',
    },
    excerpt: {
      'sq-AL': 'Ngrini pure në kubikë akulli — kurseni kohë gjatë javës dhe reduktoni mbeturinat.',
      en:      'Freeze purées in ice-cube trays — saves weekday time and reduces waste.',
    },
    badge: '🧊', bg: '#CFFFD6', ring: '#98E8AA',
  },
];

export function LearningContent() {
  const { language } = useLanguage();
  const [selectedTopic, setSelectedTopic] = useState<TopicKey>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const visible = useMemo(() => {
    let cards = selectedTopic === 'all' ? CARDS : CARDS.filter((c) => c.topic === selectedTopic);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      cards = cards.filter(
        (c) => c.title[language].toLowerCase().includes(q) || c.excerpt[language].toLowerCase().includes(q),
      );
    }
    return cards;
  }, [selectedTopic, searchQuery, language]);

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

      {/* Search */}
      <View style={s.searchBar}>
        <Text style={s.searchIcon}>🔍</Text>
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder={language === 'sq-AL' ? 'Kërko...' : 'Search...'}
          placeholderTextColor="#B0A9A3"
          style={s.searchInput}
        />
        {searchQuery !== '' && (
          <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
            <Text style={s.searchClear}>✕</Text>
          </Pressable>
        )}
      </View>

      {visible.length === 0 && (
        <Text style={s.emptyText}>
          {language === 'sq-AL' ? 'Nuk ka rezultate.' : 'No results.'}
        </Text>
      )}

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

  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFFD9', borderRadius: 18, paddingHorizontal: 16, height: 48, gap: 10 },
  searchIcon: { fontSize: 15 },
  searchInput: { flex: 1, fontSize: 15, color: '#1A1714' },
  searchClear: { fontSize: 14, color: '#9E9590', paddingLeft: 8 },
  emptyText: { textAlign: 'center', color: '#9E9590', fontSize: 15, paddingVertical: 16 },

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
