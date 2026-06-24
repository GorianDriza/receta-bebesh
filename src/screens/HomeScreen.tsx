import { useMemo, useState } from 'react';
import { Linking, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Chip, IconButton, Surface, Text } from 'react-native-paper';

import { AppLanguage } from '../i18n/translations';
import { isFirebaseConfigured, missingFirebaseKeys } from '../lib/firebase';
import { useLanguage } from '../providers/LanguageProvider';

type MealCard = {
  id: string;
  title: string;
  duration: string;
  emoji: string;
  backgroundColor: string;
  accentColor: string;
};

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

const featuredMeals: MealCard[] = [
  {
    id: 'gnocchi',
    title: 'Sweet Potato Gnocchi Bites',
    duration: '20 min',
    emoji: '🍠',
    backgroundColor: '#E5FF9A',
    accentColor: '#D4F768',
  },
  {
    id: 'wraps',
    title: 'Chicken Lettuce Wraps',
    duration: '30 min',
    emoji: '🥗',
    backgroundColor: '#CFFFD6',
    accentColor: '#B7F4C2',
  },
  {
    id: 'oats',
    title: 'Berry Overnight Oats',
    duration: '8 min',
    emoji: '🫐',
    backgroundColor: '#D9CCFF',
    accentColor: '#C7B7FB',
  },
];

const macroCards: MacroCard[] = [
  {
    id: 'carbs',
    label: 'Power Carbs',
    value: '0/150 gr',
    icon: 'barley',
    tint: '#FFA800',
  },
  {
    id: 'protein',
    label: 'Protein Power',
    value: '0/113 gr',
    icon: 'food-steak',
    tint: '#FF8C1A',
  },
  {
    id: 'fat',
    label: 'Healthy Fat',
    value: '0/50 gr',
    icon: 'water-outline',
    tint: '#F2B23D',
  },
];

const snapshots: SnapshotCard[] = [
  {
    id: 'breakfast',
    meal: 'Breakfast',
    calories: '631 kcal',
    emoji: '🍳',
    backgroundColor: '#CFC2FF',
    accentColor: '#B79DFE',
  },
  {
    id: 'lunch',
    meal: 'Lunch',
    calories: '486 kcal',
    emoji: '🥙',
    backgroundColor: '#FFF19D',
    accentColor: '#FFE25A',
  },
  {
    id: 'dinner',
    meal: 'Dinner',
    calories: '359 kcal',
    emoji: '🍲',
    backgroundColor: '#CFFFD6',
    accentColor: '#ACEDB7',
  },
  {
    id: 'snack',
    meal: 'Snack',
    calories: '193 kcal',
    emoji: '🍓',
    backgroundColor: '#FFD9AE',
    accentColor: '#FFC681',
  },
];

const learningTopics: LearningTopic[] = [
  'All',
  'Nutrition',
  'Sustainability',
  'Fitness',
];

const learningCards: LearningCard[] = [
  {
    id: 'nutrition',
    title: 'Nutrition Without Obsession',
    author: 'NutritionistheNewBlack',
    topic: 'Nutrition',
    badge: 'N',
    backgroundColor: '#CABEFF',
    ringColor: '#A68DFF',
  },
  {
    id: 'peels',
    title: 'Tricks for Citrus Peels',
    author: 'TooGoodToGo',
    topic: 'Sustainability',
    badge: 'TG',
    backgroundColor: '#FFFFFF',
    ringColor: '#98E8D3',
  },
  {
    id: 'balanced',
    title: 'Recipes for a Balanced Family Week',
    author: 'ekilu Team',
    topic: 'Nutrition',
    badge: 'ek',
    backgroundColor: '#FFF39D',
    ringColor: '#F4E15F',
  },
  {
    id: 'walks',
    title: 'Stick to New Year Walk Rituals',
    author: 'Amy C.',
    topic: 'Fitness',
    badge: 'A',
    backgroundColor: '#CBFFD6',
    ringColor: '#98E8AA',
  },
];

const bottomTabs = [
  { id: 'meals', icon: 'silverware-fork-knife', active: false },
  { id: 'planner', icon: 'calendar-month-outline', active: false },
  { id: 'spark', icon: 'star-four-points', active: false },
  { id: 'journal', icon: 'clipboard-text', active: true },
  { id: 'learn', icon: 'book-open-variant', active: false },
] as const;

export function HomeScreen() {
  const { deviceLanguage, language, setLanguage, t } = useLanguage();
  const [selectedTopic, setSelectedTopic] = useState<LearningTopic>('All');

  const visibleLearningCards = useMemo(() => {
    if (selectedTopic === 'All') {
      return learningCards;
    }

    return learningCards.filter((card) => card.topic === selectedTopic);
  }, [selectedTopic]);

  const firebaseMessage = isFirebaseConfigured
    ? t[language].home.heroConnected
    : t[language].home.heroMissing;

  const languageOptions: Array<{
    id: AppLanguage;
    label: string;
  }> = [
    { id: 'sq-AL', label: t[language].common.albanian },
    { id: 'en', label: t[language].common.english },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.backgroundGlowTop} />
      <View style={styles.backgroundGlowBottom} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.screenHeader}>
          <View style={styles.screenHeaderCopy}>
            <Text style={styles.screenTitle}>{t[language].home.title}</Text>
            <Text style={styles.screenSubtitle}>
              {t[language].home.subtitle}
            </Text>
          </View>

          <View style={styles.statusBadge}>
            <Text style={styles.statusBadgeText}>
              {isFirebaseConfigured
                ? t[language].common.synced
                : t[language].common.setup}
            </Text>
          </View>
        </View>

        <View style={styles.languageRow}>
          <View style={styles.languageHint}>
            <Text style={styles.languageHintText}>
              Device: {deviceLanguage === 'sq-AL' ? 'sq-AL' : 'en'}
            </Text>
          </View>

          <View style={styles.languageChips}>
            {languageOptions.map((option) => (
              <Chip
                key={option.id}
                selected={language === option.id}
                onPress={() => {
                  void setLanguage(option.id);
                }}
                compact
                style={[
                  styles.languageChip,
                  language === option.id && styles.languageChipActive,
                ]}
                textStyle={[
                  styles.languageChipText,
                  language === option.id && styles.languageChipTextActive,
                ]}
              >
                {option.label}
              </Chip>
            ))}
          </View>
        </View>

        <Surface style={styles.heroCard} elevation={0}>
          <View style={styles.heroGlowLarge} />
          <View style={styles.heroGlowSmall} />

          <View style={styles.heroCopy}>
            <Text style={styles.heroEyebrow}>{t[language].home.heroTitle}</Text>
            <Text style={styles.heroBody}>{firebaseMessage}</Text>

            {!isFirebaseConfigured ? (
              <Text style={styles.heroMeta}>
                {t[language].home.heroMissingMeta(missingFirebaseKeys.length)}
              </Text>
            ) : (
              <Text style={styles.heroMeta}>{t[language].home.heroReadyMeta}</Text>
            )}

            <Button
              mode="contained"
              onPress={() => {
                void Linking.openURL('https://console.firebase.google.com/');
              }}
              contentStyle={styles.heroButtonContent}
              style={styles.heroButton}
              labelStyle={styles.heroButtonLabel}
            >
              {t[language].common.fillInData}
            </Button>
          </View>

          <View style={styles.heroArtwork}>
            <View style={styles.chefBubble}>
              <Text style={styles.chefEmoji}>👩‍🍳</Text>
            </View>
            <View style={styles.heroSnackRow}>
              <View style={styles.heroSnack}>
                <Text style={styles.heroSnackEmoji}>🥕</Text>
              </View>
              <View style={styles.heroSnack}>
                <Text style={styles.heroSnackEmoji}>🍲</Text>
              </View>
              <View style={styles.heroSnack}>
                <Text style={styles.heroSnackEmoji}>🥣</Text>
              </View>
            </View>
          </View>
        </Surface>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t[language].home.mealsTitle}</Text>
          <Text style={styles.sectionAction}>{t[language].common.seeAll}</Text>
        </View>

        <View style={styles.cardStack}>
          {featuredMeals.map((meal) => (
            <Surface
              key={meal.id}
              style={[styles.mealCard, { backgroundColor: meal.backgroundColor }]}
              elevation={0}
            >
              <View
                style={[
                  styles.mealAccentSquare,
                  { backgroundColor: meal.accentColor },
                ]}
              />
              <View
                style={[
                  styles.mealAccentPill,
                  { backgroundColor: `${meal.accentColor}CC` },
                ]}
              />

              <View style={styles.mealActions}>
                <View style={styles.actionBubble}>
                  <IconButton
                    icon="heart"
                    size={18}
                    iconColor="#111111"
                    style={styles.actionIcon}
                  />
                </View>
                <View style={styles.actionBubble}>
                  <IconButton
                    icon="plus"
                    size={22}
                    iconColor="#111111"
                    style={styles.actionIcon}
                  />
                </View>
              </View>

              <View style={styles.mealInfo}>
                <Text style={styles.mealTitle}>{meal.title}</Text>

                <View style={styles.durationPill}>
                  <IconButton
                    icon="clock-time-four-outline"
                    size={16}
                    iconColor="#111111"
                    style={styles.durationIcon}
                  />
                  <Text style={styles.durationText}>{meal.duration}</Text>
                </View>
              </View>

              <View style={styles.plateWrap}>
                <View style={styles.plateShadow} />
                <View style={styles.plateCircle}>
                  <Text style={styles.plateEmoji}>{meal.emoji}</Text>
                </View>
              </View>
            </Surface>
          ))}
        </View>

        <Text style={styles.journalHeading}>{t[language].home.journalTitle}</Text>

        <Surface style={styles.journalPanel} elevation={0}>
          <View style={styles.journalHeader}>
            <View style={styles.journalTitleRow}>
              <View style={styles.fireBubble}>
                <Text style={styles.fireEmoji}>🔥</Text>
              </View>
              <View>
                <Text style={styles.journalTitle}>Calories</Text>
                <Text style={styles.journalSubtitle}>
                  {t[language].home.journalSubtitle}
                </Text>
              </View>
            </View>

            <View style={styles.calendarBubble}>
              <IconButton
                icon="calendar-month"
                size={20}
                iconColor="#111111"
                style={styles.actionIcon}
              />
            </View>
          </View>

          <View style={styles.metricBar}>
            <Text style={styles.metricLabel}>{t[language].home.consumed}</Text>
            <Text style={styles.metricValue}>00 cal</Text>
          </View>
          <View style={styles.metricBar}>
            <Text style={styles.metricLabel}>{t[language].home.remaining}</Text>
            <Text style={styles.metricValue}>00 cal</Text>
          </View>
          <View style={[styles.metricBar, styles.metricBarSoft]}>
            <Text style={styles.metricLabel}>{t[language].home.hydration}</Text>
            <Text style={styles.metricValue}>
              06 {t[language].home.cups}
            </Text>
          </View>

          <View style={styles.macroRow}>
            {macroCards.map((macro) => (
              <Surface key={macro.id} style={styles.macroCard} elevation={0}>
                <Text style={styles.macroValue}>{macro.value}</Text>
                <View style={styles.macroIconRow}>
                  <IconButton
                    icon={macro.icon}
                    size={20}
                    iconColor={macro.tint}
                    style={styles.macroIcon}
                  />
                </View>
                <Text style={styles.macroLabel}>{macro.label}</Text>
              </Surface>
            ))}
          </View>
        </Surface>

        <View style={styles.snapshotGrid}>
          {snapshots.map((snapshot) => (
            <Surface
              key={snapshot.id}
              style={[
                styles.snapshotCard,
                { backgroundColor: snapshot.backgroundColor },
              ]}
              elevation={0}
            >
              <View
                style={[
                  styles.snapshotAccent,
                  { backgroundColor: snapshot.accentColor },
                ]}
              />
              <View style={styles.snapshotHeader}>
                <View style={styles.snapshotEmojiBubble}>
                  <Text style={styles.snapshotEmoji}>{snapshot.emoji}</Text>
                </View>
                <Text style={styles.snapshotCalories}>{snapshot.calories}</Text>
              </View>

              <View style={styles.snapshotFooter}>
                <Text style={styles.snapshotMeal}>{snapshot.meal}</Text>
                <View style={styles.snapshotPlusBubble}>
                  <IconButton
                    icon="plus"
                    size={20}
                    iconColor="#111111"
                    style={styles.actionIcon}
                  />
                </View>
              </View>
            </Surface>
          ))}
        </View>

        <Text style={styles.learningHeading}>{t[language].home.learningTitle}</Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.topicRow}
        >
          {learningTopics.map((topic) => (
            <Chip
              key={topic}
              selected={selectedTopic === topic}
              onPress={() => setSelectedTopic(topic)}
              compact
              style={[
                styles.topicChip,
                selectedTopic === topic && styles.topicChipActive,
              ]}
              textStyle={[
                styles.topicChipText,
                selectedTopic === topic && styles.topicChipTextActive,
              ]}
            >
              {topic}
            </Chip>
          ))}
        </ScrollView>

        <View style={styles.learningList}>
          {visibleLearningCards.map((card) => (
            <Surface
              key={card.id}
              style={[
                styles.learningCard,
                { backgroundColor: card.backgroundColor },
              ]}
              elevation={0}
            >
              <View style={styles.learningPattern} />
              <View style={styles.learningNotchTop} />
              <View style={styles.learningNotchBottom} />

              <View style={styles.learningCopy}>
                <Text style={styles.learningCardTitle}>{card.title}</Text>
                <Text style={styles.learningAuthor}>{card.author}</Text>
              </View>

              <View
                style={[
                  styles.learningAvatarRing,
                  { borderColor: card.ringColor },
                ]}
              >
                <View
                  style={[
                    styles.learningAvatarCore,
                    { backgroundColor: card.ringColor },
                  ]}
                >
                  <Text style={styles.learningBadge}>{card.badge}</Text>
                </View>
              </View>
            </Surface>
          ))}
        </View>
      </ScrollView>

      <Surface style={styles.bottomDock} elevation={0}>
        {bottomTabs.map((tab) => (
          <View
            key={tab.id}
            style={[
              styles.bottomDockItem,
              tab.active && styles.bottomDockItemActive,
            ]}
          >
            <IconButton
              icon={tab.icon}
              size={tab.active ? 22 : 20}
              iconColor={tab.active ? '#101010' : '#F8F8F8'}
              style={styles.bottomDockIcon}
            />
          </View>
        ))}
      </Surface>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#EFEAFF',
  },
  backgroundGlowTop: {
    position: 'absolute',
    top: -120,
    right: -30,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: '#FFF7B0',
    opacity: 0.36,
  },
  backgroundGlowBottom: {
    position: 'absolute',
    bottom: 100,
    left: -40,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#C6FFD0',
    opacity: 0.28,
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 132,
    gap: 18,
  },
  screenHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  screenHeaderCopy: {
    flex: 1,
  },
  screenTitle: {
    fontSize: 38,
    lineHeight: 42,
    fontWeight: '800',
    letterSpacing: -1.4,
    color: '#111111',
  },
  screenSubtitle: {
    marginTop: 6,
    fontSize: 15,
    lineHeight: 22,
    color: '#686074',
    maxWidth: 250,
  },
  languageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  languageHint: {
    borderRadius: 999,
    backgroundColor: '#FFFFFFB8',
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  languageHintText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4D4760',
  },
  languageChips: {
    flexDirection: 'row',
    gap: 8,
  },
  languageChip: {
    borderRadius: 999,
    backgroundColor: '#FFFFFFD9',
    paddingHorizontal: 6,
    paddingVertical: 8,
  },
  languageChipActive: {
    backgroundColor: '#111111',
  },
  languageChipText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E1B2F',
  },
  languageChipTextActive: {
    color: '#FFFFFF',
  },
  statusBadge: {
    borderRadius: 999,
    backgroundColor: '#FFFFFFCC',
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  statusBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#39354A',
  },
  heroCard: {
    borderRadius: 30,
    backgroundColor: '#FFF5A7',
    padding: 20,
    flexDirection: 'row',
    overflow: 'hidden',
    minHeight: 198,
  },
  heroGlowLarge: {
    position: 'absolute',
    right: -30,
    top: 10,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#FFE679',
    opacity: 0.55,
  },
  heroGlowSmall: {
    position: 'absolute',
    left: -25,
    bottom: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FFFCE0',
    opacity: 0.9,
  },
  heroCopy: {
    flex: 1,
    justifyContent: 'space-between',
    paddingRight: 12,
    zIndex: 1,
  },
  heroEyebrow: {
    fontSize: 28,
    lineHeight: 31,
    fontWeight: '800',
    letterSpacing: -1.1,
    color: '#111111',
  },
  heroBody: {
    marginTop: 10,
    fontSize: 15,
    lineHeight: 22,
    color: '#4B4328',
    maxWidth: 215,
  },
  heroMeta: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 18,
    color: '#6A5C1D',
  },
  heroButton: {
    alignSelf: 'flex-start',
    marginTop: 16,
    borderRadius: 999,
    backgroundColor: '#FFD600',
  },
  heroButtonContent: {
    paddingHorizontal: 18,
    minHeight: 52,
  },
  heroButtonLabel: {
    color: '#111111',
    fontSize: 17,
    fontWeight: '800',
  },
  heroArtwork: {
    width: 118,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
    zIndex: 1,
  },
  chefBubble: {
    width: 98,
    height: 98,
    borderRadius: 49,
    backgroundColor: '#FFFFFFDD',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#E2BF00',
    shadowOpacity: 0.16,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
  },
  chefEmoji: {
    fontSize: 48,
  },
  heroSnackRow: {
    flexDirection: 'row',
    gap: 8,
  },
  heroSnack: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFFCE8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroSnackEmoji: {
    fontSize: 18,
  },
  sectionHeader: {
    marginTop: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 31,
    lineHeight: 34,
    fontWeight: '800',
    letterSpacing: -1.2,
    color: '#111111',
  },
  sectionAction: {
    fontSize: 18,
    color: '#6A6475',
  },
  cardStack: {
    gap: 14,
  },
  mealCard: {
    minHeight: 176,
    borderRadius: 30,
    padding: 18,
    overflow: 'hidden',
    justifyContent: 'space-between',
  },
  mealAccentSquare: {
    position: 'absolute',
    width: 64,
    height: 64,
    right: 110,
    top: 58,
    borderRadius: 18,
    transform: [{ rotate: '18deg' }],
    opacity: 0.55,
  },
  mealAccentPill: {
    position: 'absolute',
    width: 98,
    height: 38,
    left: 18,
    bottom: 20,
    borderRadius: 22,
    opacity: 0.42,
  },
  mealActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionBubble: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFFFFFE8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIcon: {
    margin: 0,
  },
  mealInfo: {
    maxWidth: '58%',
    gap: 14,
  },
  mealTitle: {
    fontSize: 23,
    lineHeight: 29,
    fontWeight: '800',
    letterSpacing: -0.8,
    color: '#111111',
  },
  durationPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FFF0',
    borderRadius: 999,
    paddingLeft: 6,
    paddingRight: 14,
    paddingVertical: 5,
  },
  durationIcon: {
    margin: 0,
  },
  durationText: {
    marginLeft: -2,
    fontSize: 17,
    color: '#111111',
    fontWeight: '600',
  },
  plateWrap: {
    position: 'absolute',
    right: 18,
    bottom: 16,
  },
  plateShadow: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 126,
    height: 126,
    borderRadius: 63,
    backgroundColor: '#00000018',
  },
  plateCircle: {
    width: 126,
    height: 126,
    borderRadius: 63,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  plateEmoji: {
    fontSize: 60,
  },
  journalHeading: {
    marginTop: 8,
    fontSize: 38,
    lineHeight: 42,
    fontWeight: '800',
    letterSpacing: -1.4,
    color: '#111111',
  },
  journalPanel: {
    borderRadius: 32,
    padding: 18,
    backgroundColor: '#FEFEFF',
    gap: 12,
  },
  journalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  journalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  fireBubble: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFF9EC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fireEmoji: {
    fontSize: 24,
  },
  journalTitle: {
    fontSize: 27,
    lineHeight: 29,
    fontWeight: '800',
    letterSpacing: -1,
    color: '#111111',
  },
  journalSubtitle: {
    marginTop: 4,
    fontSize: 15,
    color: '#7B7287',
  },
  calendarBubble: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F5F5F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricBar: {
    borderRadius: 18,
    backgroundColor: '#F2F2F9',
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricBarSoft: {
    backgroundColor: '#FCFCFF',
    borderWidth: 1,
    borderColor: '#F1EEF7',
  },
  metricLabel: {
    fontSize: 18,
    color: '#39354A',
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111111',
  },
  macroRow: {
    flexDirection: 'row',
    gap: 10,
  },
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
  macroIconRow: {
    marginTop: 10,
    alignItems: 'flex-start',
  },
  macroIcon: {
    margin: 0,
  },
  macroLabel: {
    marginTop: 8,
    fontSize: 16,
    lineHeight: 22,
    color: '#39354A',
  },
  snapshotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  snapshotCard: {
    width: '48.2%',
    minHeight: 152,
    borderRadius: 28,
    padding: 14,
    overflow: 'hidden',
  },
  snapshotAccent: {
    position: 'absolute',
    width: 52,
    height: 52,
    right: 20,
    bottom: 24,
    borderRadius: 14,
    opacity: 0.35,
  },
  snapshotHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  snapshotEmojiBubble: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFFFFFD8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  snapshotEmoji: {
    fontSize: 22,
  },
  snapshotCalories: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111111',
  },
  snapshotFooter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  snapshotMeal: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111111',
  },
  snapshotPlusBubble: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFFFFFE8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  learningHeading: {
    marginTop: 8,
    fontSize: 38,
    lineHeight: 42,
    fontWeight: '800',
    letterSpacing: -1.4,
    color: '#111111',
  },
  topicRow: {
    paddingRight: 12,
    gap: 10,
  },
  topicChip: {
    borderRadius: 999,
    backgroundColor: '#FFFFFFD9',
    paddingHorizontal: 6,
    paddingVertical: 8,
  },
  topicChipActive: {
    backgroundColor: '#111111',
  },
  topicChipText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E1B2F',
  },
  topicChipTextActive: {
    color: '#FFFFFF',
  },
  learningList: {
    gap: 14,
  },
  learningCard: {
    minHeight: 156,
    borderRadius: 30,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  learningPattern: {
    position: 'absolute',
    right: 16,
    top: 14,
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 12,
    borderColor: '#FFFFFF12',
  },
  learningNotchTop: {
    position: 'absolute',
    width: 34,
    height: 8,
    borderRadius: 999,
    top: 0,
    left: '50%',
    marginLeft: -17,
    backgroundColor: '#EFEAFF',
  },
  learningNotchBottom: {
    position: 'absolute',
    width: 34,
    height: 8,
    borderRadius: 999,
    bottom: 0,
    left: '50%',
    marginLeft: -17,
    backgroundColor: '#EFEAFF',
  },
  learningCopy: {
    flex: 1,
    paddingRight: 16,
    gap: 10,
  },
  learningCardTitle: {
    fontSize: 23,
    lineHeight: 30,
    fontWeight: '800',
    letterSpacing: -0.8,
    color: '#111111',
  },
  learningAuthor: {
    fontSize: 16,
    color: '#575265',
  },
  learningAvatarRing: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    backgroundColor: '#FFFFFFB5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  learningAvatarCore: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  learningBadge: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111111',
  },
  bottomDock: {
    position: 'absolute',
    left: 26,
    right: 26,
    bottom: 18,
    borderRadius: 999,
    backgroundColor: '#8C857499',
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#1A1330',
    shadowOpacity: 0.16,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
  },
  bottomDockItem: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomDockItemActive: {
    backgroundColor: '#FFFFFF',
  },
  bottomDockIcon: {
    margin: 0,
  },
});
