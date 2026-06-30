import { useCallback, useEffect, useState } from 'react';
import { Image, Modal, Pressable, ScrollView, Share, StyleSheet, TextInput, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { IconButton, Surface, Text } from 'react-native-paper';

import { PlannerPickerSheet } from '../components/PlannerPickerSheet';
import { CookingModeModal } from './CookingModeModal';
import { ShoppingListModal } from './ShoppingListModal';
import { AppLanguage } from '../i18n/translations';
import { RecipeRecord, RecipeNutrition } from '../lib/recipes';
import { addShoppingItem } from '../lib/shoppingList';
import { getRating, setRating } from '../lib/ratings';
import { checkSafety, SafetyMatch } from '../lib/foodSafety';
import { computeAgeStage } from '../lib/users';
import { useAuth } from '../providers/AuthProvider';
import { useLanguage } from '../providers/LanguageProvider';

const LABELS: Record<AppLanguage, {
  ingredients: string; instructions: string;
  min: string; noImage: string; addToPlanner: string; plannerAdded: string;
  addAllToList: string; itemAdded: string; viewList: string;
  startCooking: string; ratingTitle: string; notePlaceholder: string; noteSaved: string;
  share: string; nutrition: string; nutritionNA: string;
  kcal: string; protein: string; carbs: string; fat: string; fiber: string;
  iron: string; calcium: string; vitC: string;
}> = {
  'sq-AL': {
    ingredients: 'Përbërësit', instructions: 'Mënyra e Përgatitjes',
    min: 'min', noImage: 'Nuk ka imazh',
    addToPlanner: 'Shto në Plan', plannerAdded: 'U shtua!',
    addAllToList: 'Shto të gjitha në listë', itemAdded: '✓ Shtuar',
    viewList: 'Shiko listën', startCooking: '👨‍🍳 Fillo gatimin',
    ratingTitle: 'Vlerësimi juaj', notePlaceholder: 'Shënime (opsionale)...', noteSaved: '✓ Ruajtur',
    share: 'Ndaj',
    nutrition: 'Vlerat Ushqyese', nutritionNA: 'Vlerat ushqyese nuk janë disponueshme',
    kcal: 'kcal', protein: 'Proteina', carbs: 'Karboh.', fat: 'Yndyrna',
    fiber: 'Fibra', iron: 'Hekur', calcium: 'Kalcium', vitC: 'Vit. C',
  },
  en: {
    ingredients: 'Ingredients', instructions: 'Instructions',
    min: 'min', noImage: 'No image',
    addToPlanner: 'Add to Plan', plannerAdded: 'Added!',
    addAllToList: 'Add all to list', itemAdded: '✓ Added',
    viewList: 'View list', startCooking: '👨‍🍳 Start Cooking',
    ratingTitle: 'Your rating', notePlaceholder: 'Notes (optional)...', noteSaved: '✓ Saved',
    share: 'Share',
    nutrition: 'Nutrition', nutritionNA: 'Nutrition info not available',
    kcal: 'kcal', protein: 'Protein', carbs: 'Carbs', fat: 'Fat',
    fiber: 'Fiber', iron: 'Iron', calcium: 'Calcium', vitC: 'Vit. C',
  },
};

type NutrientTile = { key: string; label: string; unit: string; color: string; emoji: string };
function getNutrientTiles(L: (typeof LABELS)[AppLanguage]): NutrientTile[] {
  return [
    { key: 'kcal',      label: L.kcal,    unit: '',    color: '#FF8C1A', emoji: '🔥' },
    { key: 'proteinG',  label: L.protein, unit: 'g',   color: '#6ECAC0', emoji: '💪' },
    { key: 'carbsG',    label: L.carbs,   unit: 'g',   color: '#FFB800', emoji: '🌾' },
    { key: 'fatG',      label: L.fat,     unit: 'g',   color: '#F4A62C', emoji: '🫙' },
    { key: 'fiberG',    label: L.fiber,   unit: 'g',   color: '#3AAB72', emoji: '🥦' },
    { key: 'ironMg',    label: L.iron,    unit: 'mg',  color: '#E05252', emoji: '🩸' },
    { key: 'calciumMg', label: L.calcium, unit: 'mg',  color: '#A88BEB', emoji: '🦴' },
    { key: 'vitaminCMg',label: L.vitC,    unit: 'mg',  color: '#FF6B35', emoji: '🍊' },
  ];
}

type Props = { recipe: RecipeRecord | null; onClose: () => void };

export function RecipeDetailModal({ recipe, onClose }: Props) {
  const { language } = useLanguage();
  const { user, userProfile } = useAuth();
  const L = LABELS[language];

  const safetyAlerts: SafetyMatch[] = (() => {
    if (!recipe) return [];
    const bd = userProfile?.babyBirthdate;
    const stage = bd ? computeAgeStage(bd) : null;
    const ageMonths = stage === '4-6m' ? 5 : stage === '6-8m' ? 7 : stage === '9-12m' ? 10 : 14;
    return checkSafety(recipe.ingredients[language] ?? [], ageMonths);
  })();

  const [plannerOpen, setPlannerOpen]   = useState(false);
  const [addedMsg, setAddedMsg]         = useState(false);
  const [shoppingOpen, setShoppingOpen] = useState(false);
  const [cookingOpen, setCookingOpen]   = useState(false);

  const [ratingStars, setRatingStars] = useState(0);
  const [ratingNote,  setRatingNote]  = useState('');
  const [ratingSaved, setRatingSaved] = useState(false);

  const loadRating = useCallback(async () => {
    if (!recipe) return;
    const r = await getRating(recipe.id);
    if (r) { setRatingStars(r.stars); setRatingNote(r.note); }
    else    { setRatingStars(0); setRatingNote(''); }
  }, [recipe?.id]);

  useEffect(() => { loadRating(); }, [loadRating]);

  async function handleSaveRating(stars: number) {
    if (!recipe) return;
    void Haptics.selectionAsync();
    setRatingStars(stars);
    await setRating(recipe.id, stars, ratingNote);
    setRatingSaved(true);
    setTimeout(() => setRatingSaved(false), 1500);
  }

  async function handleSaveNote() {
    if (!recipe || ratingStars === 0) return;
    await setRating(recipe.id, ratingStars, ratingNote);
    setRatingSaved(true);
    setTimeout(() => setRatingSaved(false), 1500);
  }
  const [addedIngIds, setAddedIngIds]   = useState<Set<number>>(new Set());
  const [allAddedMsg, setAllAddedMsg]   = useState(false);

  async function handleAddIngredient(text: string, index: number) {
    await addShoppingItem(text);
    setAddedIngIds((prev) => new Set([...prev, index]));
    setTimeout(() => setAddedIngIds((prev) => { const n = new Set(prev); n.delete(index); return n; }), 1500);
  }

  async function handleAddAll() {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const ings = recipe?.ingredients[language] ?? [];
    await Promise.all(ings.map((text) => addShoppingItem(text)));
    setAllAddedMsg(true);
    setTimeout(() => setAllAddedMsg(false), 2000);
  }

  async function handleShare() {
    if (!recipe) return;
    const title = recipe.title[language];
    const url = recipe.source?.url ?? null;
    const message = url
      ? `${title} — Receta Bebesh\n${url}`
      : title;
    try {
      await Share.share({ message, title });
    } catch {
      // User cancelled or share unavailable
    }
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
          <View style={s.topBarRight}>
            <Pressable style={s.cartBubble} onPress={handleShare}>
              <Text style={s.cartIcon}>↗</Text>
            </Pressable>
            <Pressable style={s.cartBubble} onPress={() => setShoppingOpen(true)}>
              <Text style={s.cartIcon}>🛒</Text>
            </Pressable>
          </View>
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

            {/* Safety alerts */}
            {safetyAlerts.length > 0 && (
              <View style={s.safetyBox}>
                {safetyAlerts.map(({ rule, ingredient }) => (
                  <View key={rule.id} style={[s.safetyRow, rule.type === 'danger' && s.safetyRowDanger]}>
                    <Text style={s.safetyIcon}>{rule.type === 'danger' ? '🚨' : '⚠️'}</Text>
                    <View style={s.safetyBody}>
                      <Text style={s.safetyIngredient}>{ingredient}</Text>
                      <Text style={s.safetyReason}>{language === 'sq-AL' ? rule.reason_sq : rule.reason_en}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            <View style={s.divider} />

            {/* Nutrition */}
            <Text style={s.sectionHeading}>{L.nutrition}</Text>
            {recipe?.nutrition ? (
              <View style={s.nutriGrid}>
                {getNutrientTiles(L).map(({ key, label, unit, color, emoji }) => {
                  const val = (recipe.nutrition as unknown as Record<string, number | undefined>)?.[key];
                  if (val == null) return null;
                  return (
                    <View key={key} style={s.nutriTile}>
                      <Text style={s.nutriEmoji}>{emoji}</Text>
                      <Text style={[s.nutriVal, { color }]}>{val}{unit}</Text>
                      <Text style={s.nutriLabel}>{label}</Text>
                    </View>
                  );
                })}
              </View>
            ) : (
              <View style={s.nutriNA}>
                <Text style={s.nutriNAText}>{L.nutritionNA}</Text>
              </View>
            )}

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


            {/* Rating */}
            <View style={s.divider} />
            <View style={s.ratingSection}>
              <View style={s.ratingHeader}>
                <Text style={s.sectionHeading}>{L.ratingTitle}</Text>
                {ratingSaved && <Text style={s.ratingSavedMsg}>{L.noteSaved}</Text>}
              </View>
              <View style={s.starsRow}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <Pressable key={n} onPress={() => handleSaveRating(n)} hitSlop={6}>
                    <Text style={[s.star, n <= ratingStars && s.starFilled]}>{n <= ratingStars ? '★' : '☆'}</Text>
                  </Pressable>
                ))}
              </View>
              {ratingStars > 0 && (
                <TextInput
                  style={s.noteInput}
                  placeholder={L.notePlaceholder}
                  placeholderTextColor="#B0ABB8"
                  value={ratingNote}
                  onChangeText={setRatingNote}
                  onBlur={handleSaveNote}
                  multiline
                  numberOfLines={3}
                />
              )}
            </View>

            {/* Action buttons */}
            <View style={s.divider} />
            <View style={s.actionRow}>
              {(recipe?.steps[language] ?? []).length > 0 && (
                <Pressable style={[s.actionBtn, s.actionBtnCook]} onPress={() => setCookingOpen(true)}>
                  <Text style={s.actionBtnLabel}>{L.startCooking}</Text>
                </Pressable>
              )}
              {user != null && (
                <Pressable style={[s.actionBtn, s.actionBtnPlan]} onPress={() => setPlannerOpen(true)}>
                  <Text style={s.actionBtnLabel}>
                    {addedMsg ? `✓ ${L.plannerAdded}` : `📅 ${L.addToPlanner}`}
                  </Text>
                </Pressable>
              )}
            </View>
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

        {cookingOpen && recipe != null && (
          <CookingModeModal recipe={recipe} visible={cookingOpen} onClose={() => setCookingOpen(false)} />
        )}
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
  topBarRight: { flexDirection: 'row', gap: 8 },
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

  // Nutrition
  nutriGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  nutriTile: {
    width: '22%', minWidth: 72,
    backgroundColor: '#F7F7FB', borderRadius: 16,
    padding: 10, alignItems: 'center', gap: 3,
  },
  nutriEmoji: { fontSize: 18 },
  nutriVal: { fontSize: 15, fontWeight: '800' },
  nutriLabel: { fontSize: 10, fontWeight: '600', color: '#6E6560', textAlign: 'center' },
  nutriNA: {
    backgroundColor: '#F7F7FB', borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 10,
    alignItems: 'center',
  },
  nutriNAText: { fontSize: 13, color: '#B0ABB8', fontStyle: 'italic' },

  // Safety alerts
  safetyBox: { gap: 8 },
  safetyRow: {
    flexDirection: 'row', gap: 10, alignItems: 'flex-start',
    backgroundColor: '#FFF8E0', borderRadius: 14,
    padding: 12, borderLeftWidth: 3, borderLeftColor: '#F4A62C',
  },
  safetyRowDanger: { backgroundColor: '#FFF0F0', borderLeftColor: '#E05252' },
  safetyIcon: { fontSize: 18, lineHeight: 22 },
  safetyBody: { flex: 1, gap: 2 },
  safetyIngredient: { fontSize: 13, fontWeight: '800', color: '#3D3530' },
  safetyReason: { fontSize: 12, color: '#5A4A3A', lineHeight: 16 },

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

  // Rating
  ratingSection: { gap: 10 },
  ratingHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  ratingSavedMsg: { fontSize: 13, fontWeight: '700', color: '#3AABA0' },
  starsRow: { flexDirection: 'row', gap: 8 },
  star: { fontSize: 32, color: '#D8D4E3' },
  starFilled: { color: '#FFB800' },
  noteInput: {
    borderWidth: 1.5, borderColor: '#E8E5F0', borderRadius: 14,
    padding: 12, fontSize: 14, lineHeight: 20, color: '#39354A',
    textAlignVertical: 'top', minHeight: 70,
  },

  // Action buttons row
  actionRow: { gap: 12 },
  actionBtn: { borderRadius: 999, paddingVertical: 16, alignItems: 'center' },
  actionBtnCook: { backgroundColor: '#1C1730' },
  actionBtnPlan: { backgroundColor: '#6ECAC0' },
  actionBtnLabel: { fontSize: 16, fontWeight: '800', color: '#FFFFFF' },

});
