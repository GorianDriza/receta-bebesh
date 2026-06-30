import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Surface, Text } from 'react-native-paper';

import { useLanguage } from '../providers/LanguageProvider';
import { useAuth } from '../providers/AuthProvider';
import { computeAgeStage } from '../lib/users';

type StageId = '4-6m' | '6-8m' | '9-12m' | '12m+';

type StageGuide = {
  mealsPerDay: string;
  portionPerMeal: string;
  milk: string;
  texture: string;
  texture_sq: string;
  foods_sq: string;
  foods_en: string;
  tip_sq: string;
  tip_en: string;
};

const GUIDES: Record<StageId, StageGuide> = {
  '4-6m': {
    mealsPerDay: '1–2',
    portionPerMeal: '1–2 lug çaji / 5–10 ml',
    milk: '700–800 ml / ditë',
    texture: 'Smooth puree',
    texture_sq: 'Pure shumë e lëngshme',
    foods_sq: 'Perime të buta, fruta. Një ushqim i ri çdo 3-5 ditë.',
    foods_en: 'Soft vegetables, fruits. One new food every 3-5 days.',
    tip_sq: 'Qumështi mbetet burimi kryesor i ushqimit. Ushqimet e ngurta janë shtesë.',
    tip_en: 'Milk remains the main nutrition source. Solids are supplementary.',
  },
  '6-8m': {
    mealsPerDay: '2–3',
    portionPerMeal: '2–4 lugë gjelle / 30–60 ml',
    milk: '600–700 ml / ditë',
    texture: 'Slightly lumpy',
    texture_sq: 'Pure e butë, pak e grumbullt',
    foods_sq: 'Mish i bluar, peshk, vezë, legume, drithëra. Shmangni kripën dhe sheqerin.',
    foods_en: 'Minced meat, fish, egg, legumes, grains. No salt or sugar.',
    tip_sq: 'Fillo BLW (baby-led weaning) nëse dëshiron — copa të buta sa gishti.',
    tip_en: 'Start BLW if desired — soft finger-sized pieces.',
  },
  '9-12m': {
    mealsPerDay: '3 + 1–2 meze',
    portionPerMeal: '3–4 lugë gjelle / 60–90 ml',
    milk: '400–600 ml / ditë',
    texture: 'Soft lumps, mashed',
    texture_sq: 'Copëza të buta, të shtypura',
    foods_sq: 'Pothuajse gjithçka nga tryeza familjare — të adaptuara pa kripë. Ushqime me gishta.',
    foods_en: 'Almost everything from the family table — adapted without salt. Finger foods.',
    tip_sq: 'Inkurajo vetë-ushqyerjen me lugë dhe ushqime me gishta.',
    tip_en: 'Encourage self-feeding with a spoon and finger foods.',
  },
  '12m+': {
    mealsPerDay: '3 + 2 meze',
    portionPerMeal: '¼–⅓ filxhan / 60–120 ml',
    milk: '350–400 ml / ditë (qumësht lope)',
    texture: 'Chopped / family food',
    texture_sq: 'E prerë, ushqim familjeje',
    foods_sq: 'Ushqim familjar të prerë mirë. Shmangni ushqime shumë pikante ose shumë të kripura.',
    foods_en: 'Well-chopped family food. Avoid very spicy or very salty food.',
    tip_sq: 'Mund të kalojë në qumësht lope. Shmangni mjaltën deri në 12 muaj.',
    tip_en: 'Can transition to cow\'s milk. Avoid honey until 12 months.',
  },
};

const STAGE_ORDER: StageId[] = ['4-6m', '6-8m', '9-12m', '12m+'];

const STAGE_COLORS: Record<StageId, { bg: string; accent: string }> = {
  '4-6m':  { bg: '#FFF5E0', accent: '#F4A62C' },
  '6-8m':  { bg: '#E8FFF4', accent: '#3AAB72' },
  '9-12m': { bg: '#F0EBFF', accent: '#8B6FE8' },
  '12m+':  { bg: '#FFE8F0', accent: '#E86FA8' },
};

type Props = { visible: boolean; onClose: () => void };

export function PortionGuideModal({ visible, onClose }: Props) {
  const { language } = useLanguage();
  const { userProfile } = useAuth();

  const babyStage = userProfile?.babyBirthdate ? computeAgeStage(userProfile.babyBirthdate) : null;
  const defaultStage: StageId = (babyStage === 'family' ? '12m+' : babyStage) ?? '6-8m';

  const [activeStage, setActiveStage] = useState<StageId>(defaultStage);

  const guide = GUIDES[activeStage];
  const colors = STAGE_COLORS[activeStage];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaProvider>
      <SafeAreaView style={[s.root, { backgroundColor: colors.bg }]}>
        <View style={s.topBar}>
          <Pressable style={s.closeBtn} onPress={onClose} hitSlop={8}>
            <Text style={s.closeX}>✕</Text>
          </Pressable>
          <Text style={s.title}>
            {language === 'sq-AL' ? '🍽️ Udhëzues Porcionesh' : '🍽️ Portion Guide'}
          </Text>
          <View style={{ width: 36 }} />
        </View>

        {/* Stage tabs */}
        <View style={s.tabs}>
          {STAGE_ORDER.map((stage) => (
            <Pressable
              key={stage}
              style={[s.tab, activeStage === stage && { backgroundColor: colors.accent }]}
              onPress={() => setActiveStage(stage)}
            >
              <Text style={[s.tabText, activeStage === stage && s.tabTextOn]}>
                {stage}{stage === babyStage ? ' 👶' : ''}
              </Text>
            </Pressable>
          ))}
        </View>

        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
          {/* Summary tiles */}
          <View style={s.tileRow}>
            <Surface style={[s.tile, { backgroundColor: colors.accent + '22' }]} elevation={0}>
              <Text style={s.tileEmoji}>🍽️</Text>
              <Text style={[s.tileValue, { color: colors.accent }]}>{guide.mealsPerDay}</Text>
              <Text style={s.tileLabel}>{language === 'sq-AL' ? 'vakte/ditë' : 'meals/day'}</Text>
            </Surface>
            <Surface style={[s.tile, { backgroundColor: colors.accent + '22' }]} elevation={0}>
              <Text style={s.tileEmoji}>🥄</Text>
              <Text style={[s.tileValue, { color: colors.accent }]} numberOfLines={2}>{guide.portionPerMeal}</Text>
              <Text style={s.tileLabel}>{language === 'sq-AL' ? 'porcion/vakt' : 'per meal'}</Text>
            </Surface>
            <Surface style={[s.tile, { backgroundColor: colors.accent + '22' }]} elevation={0}>
              <Text style={s.tileEmoji}>🍼</Text>
              <Text style={[s.tileValue, { color: colors.accent }]} numberOfLines={2}>{guide.milk}</Text>
              <Text style={s.tileLabel}>{language === 'sq-AL' ? 'qumësht' : 'milk'}</Text>
            </Surface>
          </View>

          {/* Texture */}
          <Surface style={s.infoCard} elevation={0}>
            <Text style={s.infoIcon}>🫙</Text>
            <View style={s.infoBody}>
              <Text style={s.infoTitle}>{language === 'sq-AL' ? 'Konsistenca' : 'Texture'}</Text>
              <Text style={s.infoText}>{language === 'sq-AL' ? guide.texture_sq : guide.texture}</Text>
            </View>
          </Surface>

          {/* Foods */}
          <Surface style={s.infoCard} elevation={0}>
            <Text style={s.infoIcon}>🥗</Text>
            <View style={s.infoBody}>
              <Text style={s.infoTitle}>{language === 'sq-AL' ? 'Ushqimet' : 'Foods'}</Text>
              <Text style={s.infoText}>{language === 'sq-AL' ? guide.foods_sq : guide.foods_en}</Text>
            </View>
          </Surface>

          {/* Tip */}
          <Surface style={[s.tipCard, { borderLeftColor: colors.accent }]} elevation={0}>
            <Text style={[s.tipLabel, { color: colors.accent }]}>
              {language === 'sq-AL' ? '💡 Këshillë' : '💡 Tip'}
            </Text>
            <Text style={s.tipText}>{language === 'sq-AL' ? guide.tip_sq : guide.tip_en}</Text>
          </Surface>

          {/* Choking size visual */}
          <Surface style={s.chokingCard} elevation={0}>
            <Text style={s.chokingTitle}>
              {language === 'sq-AL' ? '⚠️ Madhësia e sigurt e copave' : '⚠️ Safe piece size'}
            </Text>
            <Text style={s.chokingText}>
              {language === 'sq-AL'
                ? 'Copëtoni ushqimet në copa jo më të mëdha se 1 cm deri në moshën 2 vjeç. Shmangni rreth/sferik formën.'
                : 'Cut food into pieces no larger than 1 cm until age 2. Avoid round/spherical shapes.'}
            </Text>
          </Surface>
        </ScrollView>
      </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 18, paddingVertical: 12,
  },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#FFFFFF99', alignItems: 'center', justifyContent: 'center' },
  closeX: { fontSize: 15, color: '#555', fontWeight: '700' },
  title: { fontSize: 18, fontWeight: '800', color: '#111', letterSpacing: -0.4 },

  tabs: { flexDirection: 'row', paddingHorizontal: 14, gap: 6, marginBottom: 4 },
  tab: { flex: 1, borderRadius: 999, paddingVertical: 8, alignItems: 'center', backgroundColor: '#FFFFFF66' },
  tabText: { fontSize: 11, fontWeight: '700', color: '#6E6560' },
  tabTextOn: { color: '#FFFFFF' },

  scroll: { paddingHorizontal: 18, paddingBottom: 40, gap: 12, paddingTop: 8 },

  tileRow: { flexDirection: 'row', gap: 10 },
  tile: { flex: 1, borderRadius: 20, padding: 12, alignItems: 'center', gap: 4 },
  tileEmoji: { fontSize: 24 },
  tileValue: { fontSize: 15, fontWeight: '800', textAlign: 'center', lineHeight: 18 },
  tileLabel: { fontSize: 10, fontWeight: '600', color: '#6E6560', textAlign: 'center' },

  infoCard: {
    borderRadius: 18, backgroundColor: '#FFFFFF',
    padding: 14, flexDirection: 'row', gap: 12, alignItems: 'flex-start',
  },
  infoIcon: { fontSize: 26, lineHeight: 32 },
  infoBody: { flex: 1, gap: 4 },
  infoTitle: { fontSize: 13, fontWeight: '800', color: '#3D3530', textTransform: 'uppercase', letterSpacing: 0.3 },
  infoText: { fontSize: 14, lineHeight: 20, color: '#4A4440' },

  tipCard: {
    borderRadius: 18, backgroundColor: '#FFFFFF',
    padding: 14, gap: 6,
    borderLeftWidth: 4,
  },
  tipLabel: { fontSize: 13, fontWeight: '800' },
  tipText: { fontSize: 14, lineHeight: 20, color: '#4A4440' },

  chokingCard: {
    borderRadius: 18, backgroundColor: '#FFF5E0',
    padding: 14, gap: 6,
  },
  chokingTitle: { fontSize: 14, fontWeight: '800', color: '#A05A00' },
  chokingText: { fontSize: 13, lineHeight: 19, color: '#5A4530' },
});
