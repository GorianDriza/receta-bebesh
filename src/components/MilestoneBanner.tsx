import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { AppLanguage } from '../i18n/translations';

type Milestone = { emoji: string; sq: string; en: string };

const MILESTONES: Record<string, Milestone[]> = {
  '0-4m': [
    { emoji: '🍼', sq: 'Vetëm qumësht gjiri ose formulë deri në 4 muaj.', en: 'Breast milk or formula only until 4 months.' },
    { emoji: '👶', sq: 'Bebja po fiton kontrollin e kokës — etapë kyçe!', en: 'Baby is gaining head control — a key milestone!' },
  ],
  '4-6m': [
    { emoji: '🥣', sq: 'Koha për pureutë e para! Fillo me perime dhe fruta me ngjyrë.', en: "Time for first purees! Start with colorful vegetables and fruits." },
    { emoji: '🥕', sq: 'Provo patate të ëmbla, kungull ose karrota. Një ushqim në herë!', en: 'Try sweet potato, squash or carrots. One food at a time!' },
    { emoji: '🍌', sq: 'Banana e pjekur është ushqimi ideal i parë — shija e ëmbël tërheq bebënat.', en: 'Ripe banana is a perfect first food — the sweet taste appeals to babies.' },
    { emoji: '🌡️', sq: 'Shenja e gatishmërisë: bebja mund të qëndrojë ulur me mbështetje.', en: 'Readiness sign: baby can sit up with support.' },
  ],
  '6-8m': [
    { emoji: '🫐', sq: 'Prezanto boronica të shtypur — e pasur me antioksidantë!', en: 'Introduce mashed blueberries — rich in antioxidants!' },
    { emoji: '🥚', sq: 'Mund të hedhësh vezën e tërë (të zier mirë) në meny tani!', en: 'You can introduce whole egg (well cooked) to the menu now!' },
    { emoji: '🐟', sq: 'Peshku me pak kripë si salmoni është i shkëlqyer në 6 muaj.', en: 'Low-salt fish like salmon is excellent at 6 months.' },
    { emoji: '✊', sq: 'Provo ushqime me teksturë: bebja fillon të mësojë të kafshojë.', en: 'Try textured foods: baby is learning to bite and chew.' },
    { emoji: '🥣', sq: 'Orizin e trashë ose bollgurin mund ta prezantosh tani.', en: 'Thick rice porridge or oatmeal can be introduced now.' },
  ],
  '9-12m': [
    { emoji: '🤏', sq: 'Ushqimet me gishta (finger foods) ndihmojnë koordinimin dhe pavarësinë.', en: 'Finger foods help develop coordination and independence.' },
    { emoji: '🍝', sq: 'Makarona të buta me salcë domate janë perfekte për 9 muaj+.', en: 'Soft pasta with tomato sauce is perfect for 9 months+.' },
    { emoji: '🧀', sq: 'Djathi me pak kripë si mozzarella mund të pritet në copa të vogla.', en: 'Low-salt cheese like mozzarella can be cut into small pieces.' },
    { emoji: '🥦', sq: 'Brokolini i zier mirë është i pasur me hekur dhe C vitamina.', en: 'Well-cooked broccoli is rich in iron and vitamin C.' },
    { emoji: '🍗', sq: 'Mish pule të grirë pak në purenë tuaj.', en: 'Add a little ground chicken to purees.' },
  ],
  '12m+': [
    { emoji: '👨‍👩‍👧', sq: 'Bebja mund të ndarë vaktet familjare — thjesht zvogëloni kripën!', en: 'Baby can share family meals — just reduce the salt!' },
    { emoji: '🥛', sq: 'Qumështi i lopës mund të prezantohet si pije nga 12 muajt.', en: "Cow's milk can be introduced as a drink from 12 months." },
    { emoji: '🍓', sq: 'Frutëkuqet dhe luleshtrydhet mund t\'i prezantoni tani pa problem.', en: 'Strawberries and raspberries can be introduced freely now.' },
    { emoji: '🧇', sq: 'Gatime wafle ose petulla integrale për mëngjes të shijshëm!', en: 'Whole wheat waffles or pancakes for a delicious breakfast!' },
    { emoji: '🥜', sq: 'Gjalpi i kikirikut i holluar mund të prezantohet nëse nuk ka alergji.', en: 'Diluted peanut butter can be introduced if no allergy risk.' },
  ],
  family: [
    { emoji: '🥗', sq: 'Sallata me fruta të freskëta është e shkëlqyer për fëmijët e rritur.', en: 'Fresh fruit salad is excellent for older children.' },
    { emoji: '🍲', sq: 'Supa me perime është i pasur në vitamina dhe hidratim.', en: 'Vegetable soup is rich in vitamins and hydration.' },
  ],
};

function getAgeGroup(birthdateIso: string): string {
  const birth = new Date(birthdateIso);
  const now = new Date();
  const months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
  if (months < 4)  return '0-4m';
  if (months < 6)  return '4-6m';
  if (months < 9)  return '6-8m';
  if (months < 12) return '9-12m';
  if (months < 36) return '12m+';
  return 'family';
}

function weekIndex(): number {
  const d = new Date();
  const start = new Date(d.getFullYear(), 0, 0);
  return Math.floor((d.getTime() - start.getTime()) / (7 * 24 * 60 * 60 * 1000));
}

type Props = { babyBirthdate: string; language: AppLanguage };

export function MilestoneBanner({ babyBirthdate, language }: Props) {
  const group = getAgeGroup(babyBirthdate);
  const tips = MILESTONES[group] ?? MILESTONES['family'];
  const tip = tips[weekIndex() % tips.length];

  return (
    <View style={s.root}>
      <Text style={s.emoji}>{tip.emoji}</Text>
      <Text style={s.text}>{language === 'sq-AL' ? tip.sq : tip.en}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#E8FAF8',
    borderRadius: 18,
    padding: 14,
  },
  emoji: { fontSize: 26, lineHeight: 32 },
  text: { flex: 1, fontSize: 14, lineHeight: 20, color: '#2A6B66', fontWeight: '500' },
});
