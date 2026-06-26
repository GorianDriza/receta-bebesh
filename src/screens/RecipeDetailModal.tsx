import { useState } from 'react';
import { Image, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { IconButton, Surface, Text } from 'react-native-paper';

import { PlannerPickerSheet } from '../components/PlannerPickerSheet';
import { ShoppingListModal } from './ShoppingListModal';
import { AppLanguage } from '../i18n/translations';
import { RecipeRecord } from '../lib/recipes';
import { addShoppingItem } from '../lib/shoppingList';
import { useAuth } from '../providers/AuthProvider';
import { useLanguage } from '../providers/LanguageProvider';

const LABELS: Record<AppLanguage, {
  ingredients: string; instructions: string;
  min: string; noImage: string; addToPlanner: string; plannerAdded: string;
  addAllToList: string; itemAdded: string; viewList: string;
}> = {
  'sq-AL': {
    ingredients: 'Përbërësit', instructions: 'Mënyra e Përgatitjes',
    min: 'min', noImage: 'Nuk ka imazh',
    addToPlanner: 'Shto në Plan', plannerAdded: 'U shtua!',
    addAllToList: 'Shto të gjitha në listë', itemAdded: '✓ Shtuar',
    viewList: 'Shiko listën',
  },
  en: {
    ingredients: 'Ingredients', instructions: 'Instructions',
    min: 'min', noImage: 'No image',
    addToPlanner: 'Add to Plan', plannerAdded: 'Added!',
    addAllToList: 'Add all to list', itemAdded: '✓ Added',
    viewList: 'View list',
  },
};

type Props = { recipe: RecipeRecord | null; onClose: () => void };

export function RecipeDetailModal({ recipe, onClose }: Props) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const L = LABELS[language];

  const [plannerOpen, setPlannerOpen]   = useState(false);
  const [addedMsg, setAddedMsg]         = useState(false);
  const [shoppingOpen, setShoppingOpen] = useState(false);
  const [addedIngIds, setAddedIngIds]   = useState<Set<number>>(new Set());
  const [allAddedMsg, setAllAddedMsg]   = useState(false);

  async function handleAddIngredient(text: string, index: number) {
    await addShoppingItem(text);
    setAddedIngIds((prev) => new Set([...prev, index]));
    setTimeout(() => setAddedIngIds((prev) => { const n = new Set(prev); n.delete(index); return n; }), 1500);
  }

  async function handleAddAll() {
    const ings = recipe?.ingredients[language] ?? [];
    await Promise.all(ings.map((text) => addShoppingItem(text)));
    setAllAddedMsg(true);
    setTimeout(() => setAllAddedMsg(false), 2000);
  }

  const imageUrl = recipe?.image?.downloadUrl ?? recipe?.image?.sourceUrl ?? null;
  const duration = recipe?.totalMinutes ?? recipe?.prepMinutes ?? null;

  return (
    <Modal
      visible={recipe != null}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <SafeAreaProvider>
      <SafeAreaView style={s.root}>
        {/* Top bar */}
        <View style={s.topBar}>
          <View style={s.closeBubble}>
            <IconButton icon="arrow-left" size={22} iconColor="#1A1714" style={s.icon0} onPress={onClose} />
          </View>
          <Pressable style={s.cartBubble} onPress={() => setShoppingOpen(true)}>
            <Text style={s.cartIcon}>🛒</Text>
          </Pressable>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.scroll}
        >
          {/* Hero image */}
          <View style={s.heroWrap}>
            {imageUrl ? (
              <Image source={{ uri: imageUrl }} style={s.heroImg} resizeMode="cover" />
            ) : (
              <View style={s.heroPlaceholder}>
                <Text style={s.heroEmoji}>{emojiForMeal(recipe?.mealType)}</Text>
              </View>
            )}
            {/* Floating badge */}
            {recipe?.ageStage && (
              <View style={s.ageBadgeFloat}>
                <Text style={s.ageBadgeText}>{recipe.ageStage}</Text>
              </View>
            )}
          </View>

          {/* Content card */}
          <Surface style={s.card} elevation={0}>
            {/* Title row */}
            <View style={s.titleRow}>
              <Text style={s.title}>{recipe?.title[language] ?? ''}</Text>
              {duration != null && (
                <View style={s.durationPill}>
                  <IconButton icon="clock-time-four-outline" size={14} iconColor="#555" style={s.icon0} />
                  <Text style={s.durationText}>{duration} {L.min}</Text>
                </View>
              )}
            </View>

            {/* Summary */}
            {recipe?.summary[language] ? (
              <Text style={s.summary}>{recipe.summary[language]}</Text>
            ) : null}

            <View style={s.divider} />

            {/* Ingredients */}
            <View style={s.sectionRow}>
              <Text style={s.sectionHeading}>{L.ingredients}</Text>
              <Pressable onPress={handleAddAll} style={s.addAllBtn}>
                <Text style={s.addAllLabel}>{allAddedMsg ? L.itemAdded : `🛒 ${L.addAllToList}`}</Text>
              </Pressable>
            </View>
            {(recipe?.ingredients[language] ?? []).map((ing, i) => (
              <Pressable key={i} style={s.ingRow} onPress={() => handleAddIngredient(ing, i)}>
                <View style={s.ingDot} />
                <Text style={[s.ingText, addedIngIds.has(i) && s.ingTextAdded]}>{ing}</Text>
                {addedIngIds.has(i) && <Text style={s.ingCheck}>✓</Text>}
              </Pressable>
            ))}

            <View style={s.divider} />

            {/* Instructions */}
            <Text style={s.sectionHeading}>{L.instructions}</Text>
            {(recipe?.steps[language] ?? []).map((step, i) => (
              <View key={i} style={s.stepRow}>
                <View style={s.stepNum}>
                  <Text style={s.stepNumText}>{i + 1}</Text>
                </View>
                <Text style={s.stepText}>{step}</Text>
              </View>
            ))}


            {/* Add to Planner */}
            {user != null && (
              <>
                <View style={s.divider} />
                <Pressable style={s.plannerBtn} onPress={() => setPlannerOpen(true)}>
                  <Text style={s.plannerBtnLabel}>
                    {addedMsg ? `✓ ${L.plannerAdded}` : `📅 ${L.addToPlanner}`}
                  </Text>
                </Pressable>
              </>
            )}
          </Surface>
        </ScrollView>

        {plannerOpen && recipe != null && (
          <PlannerPickerSheet
            recipe={recipe}
            onClose={() => setPlannerOpen(false)}
            onAdded={() => { setAddedMsg(true); setTimeout(() => setAddedMsg(false), 2000); }}
          />
        )}

        <ShoppingListModal visible={shoppingOpen} onClose={() => setShoppingOpen(false)} />
      </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
}

function emojiForMeal(mealType?: string): string {
  const map: Record<string, string> = {
    breakfast: '🍳', lunch: '🥗', dinner: '🍲',
    snack: '🍓', puree: '🥣', 'finger-food': '🫓', 'batch-prep': '🍱',
  };
  return map[mealType ?? ''] ?? '🍽️';
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#EFEAFF' },
  topBar: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  closeBubble: {
    width: 44, height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFFCC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBubble: {
    width: 44, height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFFCC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartIcon: { fontSize: 22 },
  icon0: { margin: 0 },
  scroll: { paddingBottom: 40 },

  // Hero
  heroWrap: { marginHorizontal: 16, borderRadius: 28, overflow: 'hidden', height: 260 },
  heroImg: { width: '100%', height: '100%' },
  heroPlaceholder: {
    width: '100%', height: '100%',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroEmoji: { fontSize: 80 },
  ageBadgeFloat: {
    position: 'absolute',
    top: 14, right: 14,
    backgroundColor: '#FFFFFFEE',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  ageBadgeText: { fontSize: 13, fontWeight: '700', color: '#1A1714' },

  // Card
  card: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 32,
    backgroundColor: '#FEFEFF',
    padding: 22,
    gap: 14,
  },
  titleRow: { gap: 8 },
  title: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '800',
    letterSpacing: -0.8,
    color: '#1A1714',
  },
  durationPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F9',
    borderRadius: 999,
    paddingLeft: 6,
    paddingRight: 12,
    paddingVertical: 4,
  },
  durationText: { fontSize: 14, fontWeight: '600', color: '#444', marginLeft: -4 },
  summary: { fontSize: 15, lineHeight: 22, color: '#6E6560' },
  divider: { height: 1, backgroundColor: '#F0EEF5' },
  sectionHeading: {
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: -0.4,
    color: '#1A1714',
  },

  // Ingredients
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  addAllBtn: {
    backgroundColor: '#E8FAF8',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  addAllLabel: { fontSize: 12, fontWeight: '700', color: '#3AABA0' },
  ingRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  ingDot: {
    width: 7, height: 7,
    borderRadius: 4,
    backgroundColor: '#6ECAC0',
    marginTop: 7,
    flexShrink: 0,
  },
  ingText: { flex: 1, fontSize: 15, lineHeight: 22, color: '#39354A' },
  ingTextAdded: { color: '#3AABA0' },
  ingCheck: { fontSize: 14, color: '#3AABA0', fontWeight: '800' },

  // Steps
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  stepNum: {
    width: 28, height: 28,
    borderRadius: 14,
    backgroundColor: '#6ECAC0',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 2,
  },
  stepNumText: { fontSize: 13, fontWeight: '800', color: '#FFFFFF' },
  stepText: { flex: 1, fontSize: 15, lineHeight: 24, color: '#39354A' },

  // Source

  // Add to Planner button
  plannerBtn: {
    backgroundColor: '#6ECAC0', borderRadius: 999,
    paddingVertical: 16, alignItems: 'center',
  },
  plannerBtnLabel: { fontSize: 16, fontWeight: '800', color: '#FFFFFF' },

});
