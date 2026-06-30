import { useState } from 'react';
import { ActivityIndicator, Image, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Surface, Text } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';

import { RecipeRecord } from '../lib/recipes';
import { useLanguage } from '../providers/LanguageProvider';
import { RecipeDetailModal } from './RecipeDetailModal';

const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? '';
const MODEL   = process.env.EXPO_PUBLIC_GEMINI_MODEL ?? 'gemini-2.0-flash-lite';

type ScanResult = {
  foodName: string;
  ingredients: string[];
  nutrition: { kcal?: number; proteinG?: number; carbsG?: number; fatG?: number; fiberG?: number };
  ageStage: string;
  notes: string;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  allRecipes: RecipeRecord[];
};

async function analyzeImageWithGemini(base64: string, mimeType: string, language: string): Promise<ScanResult> {
  if (!API_KEY) throw new Error('Gemini API key not configured');

  const langNote = language === 'sq-AL' ? 'Respond in Albanian (sq-AL).' : 'Respond in English.';
  const prompt = `You are a baby food nutritionist. Analyze this food image. ${langNote}
Return ONLY valid JSON with these exact keys:
{
  "foodName": "name of the food shown",
  "ingredients": ["ingredient1", "ingredient2"],
  "nutrition": {"kcal": 0, "proteinG": 0, "carbsG": 0, "fatG": 0, "fiberG": 0},
  "ageStage": "4-6m or 6-8m or 9-12m or 12m+ or family",
  "notes": "brief baby feeding tip"
}
Estimate nutrition per baby serving (~150g). If not baby food, still analyze the food shown.`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { inline_data: { mime_type: mimeType, data: base64 } },
            { text: prompt },
          ],
        }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 512 },
      }),
    },
  );

  if (!res.ok) throw new Error(`Gemini ${res.status}`);
  const data = await res.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
  const raw = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  const start = raw.indexOf('{');
  const end   = raw.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('No JSON in response');
  return JSON.parse(raw.slice(start, end + 1)) as ScanResult;
}

function matchRecipes(result: ScanResult, allRecipes: RecipeRecord[]): RecipeRecord[] {
  const terms = [result.foodName, ...result.ingredients]
    .map((s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim())
    .filter(Boolean);

  return allRecipes
    .map((r) => {
      const corpus = [
        r.title.en, r.title['sq-AL'],
        ...(r.ingredients.en ?? []),
        ...(r.ingredients['sq-AL'] ?? []),
      ].join(' ').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
      const score = terms.filter((t) => corpus.includes(t)).length;
      return { r, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map(({ r }) => r);
}

export function FoodScanModal({ visible, onClose, allRecipes }: Props) {
  const { language } = useLanguage();
  const [scanning, setScanning] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [result, setResult]     = useState<ScanResult | null>(null);
  const [matches, setMatches]   = useState<RecipeRecord[]>([]);
  const [error, setError]       = useState<string | null>(null);
  const [selected, setSelected] = useState<RecipeRecord | null>(null);

  const L = {
    title:       language === 'sq-AL' ? '📷 Skano Ushqimin' : '📷 Scan Food',
    gallery:     language === 'sq-AL' ? '🖼️ Nga galeria' : '🖼️ From gallery',
    camera:      language === 'sq-AL' ? '📸 Kamera' : '📸 Camera',
    analyzing:   language === 'sq-AL' ? 'Duke analizuar...' : 'Analyzing...',
    detected:    language === 'sq-AL' ? 'Ushqimi i zbuluar' : 'Food detected',
    ingredients: language === 'sq-AL' ? 'Përbërësit' : 'Ingredients',
    nutrition:   language === 'sq-AL' ? 'Vlera ushqyese (racion bebje)' : 'Nutrition (baby serving)',
    ageFor:      language === 'sq-AL' ? 'Mosha e rekomanduar' : 'Recommended age',
    tips:        language === 'sq-AL' ? 'Këshillë' : 'Tip',
    recipes:     language === 'sq-AL' ? 'Receta të ngjashme' : 'Matching recipes',
    noMatch:     language === 'sq-AL' ? 'Nuk u gjetën receta të ngjashme.' : 'No matching recipes found.',
    close:       language === 'sq-AL' ? 'Mbyll' : 'Close',
    noKey:       language === 'sq-AL' ? 'Gemini API key nuk është konfiguruar.' : 'Gemini API key not configured.',
  };

  async function pick(fromCamera: boolean) {
    setError(null);
    setResult(null);
    setImageUri(null);
    setMatches([]);

    const fn = fromCamera ? ImagePicker.launchCameraAsync : ImagePicker.launchImageLibraryAsync;
    const res = await fn({ base64: true, quality: 0.7, mediaTypes: ImagePicker.MediaTypeOptions.Images });
    if (res.canceled || !res.assets?.[0]) return;

    const asset = res.assets[0];
    if (!asset.base64) { setError('Could not read image data'); return; }

    setImageUri(asset.uri);
    setScanning(true);

    try {
      const mimeType = asset.mimeType ?? 'image/jpeg';
      const scanResult = await analyzeImageWithGemini(asset.base64, mimeType, language);
      setResult(scanResult);
      setMatches(matchRecipes(scanResult, allRecipes));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Scan failed');
    } finally {
      setScanning(false);
    }
  }

  function handleClose() {
    setResult(null);
    setImageUri(null);
    setError(null);
    setMatches([]);
    onClose();
  }

  return (
    <>
      <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
        <View style={s.root}>
          <View style={s.handle} />

          <View style={s.topRow}>
            <Text style={s.heading}>{L.title}</Text>
            <Pressable style={s.closeBtn} onPress={handleClose} hitSlop={8}>
              <Text style={s.closeBtnText}>✕</Text>
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
            {/* Pick buttons */}
            <View style={s.pickRow}>
              <Pressable style={s.pickBtn} onPress={() => pick(false)}>
                <Text style={s.pickBtnText}>{L.gallery}</Text>
              </Pressable>
              <Pressable style={s.pickBtn} onPress={() => pick(true)}>
                <Text style={s.pickBtnText}>{L.camera}</Text>
              </Pressable>
            </View>

            {/* Preview */}
            {imageUri && (
              <Image source={{ uri: imageUri }} style={s.preview} resizeMode="cover" />
            )}

            {/* Scanning indicator */}
            {scanning && (
              <View style={s.loadingCard}>
                <ActivityIndicator color="#6ECAC0" size="large" />
                <Text style={s.loadingText}>{L.analyzing}</Text>
              </View>
            )}

            {/* Error */}
            {error && (
              <Surface style={s.errorCard} elevation={0}>
                <Text style={s.errorText}>{error}</Text>
              </Surface>
            )}

            {/* Results */}
            {result && !scanning && (
              <>
                <Surface style={s.resultCard} elevation={0}>
                  <Text style={s.resultLabel}>{L.detected}</Text>
                  <Text style={s.foodName}>{result.foodName}</Text>

                  {result.ageStage && (
                    <View style={s.agePill}>
                      <Text style={s.agePillText}>{L.ageFor}: {result.ageStage}</Text>
                    </View>
                  )}

                  {result.notes ? (
                    <Text style={s.notes}>💡 {result.notes}</Text>
                  ) : null}
                </Surface>

                {result.ingredients?.length > 0 && (
                  <Surface style={s.resultCard} elevation={0}>
                    <Text style={s.resultLabel}>{L.ingredients}</Text>
                    <View style={s.ingredientList}>
                      {result.ingredients.map((ing, i) => (
                        <View key={i} style={s.ingredientPill}>
                          <Text style={s.ingredientPillText}>{ing}</Text>
                        </View>
                      ))}
                    </View>
                  </Surface>
                )}

                {result.nutrition && Object.keys(result.nutrition).length > 0 && (
                  <Surface style={s.resultCard} elevation={0}>
                    <Text style={s.resultLabel}>{L.nutrition}</Text>
                    <View style={s.nutriRow}>
                      {result.nutrition.kcal != null && (
                        <View style={s.nutriCell}>
                          <Text style={s.nutriVal}>{result.nutrition.kcal}</Text>
                          <Text style={s.nutriKey}>kcal</Text>
                        </View>
                      )}
                      {result.nutrition.proteinG != null && (
                        <View style={s.nutriCell}>
                          <Text style={s.nutriVal}>{result.nutrition.proteinG}g</Text>
                          <Text style={s.nutriKey}>{language === 'sq-AL' ? 'Proteina' : 'Protein'}</Text>
                        </View>
                      )}
                      {result.nutrition.carbsG != null && (
                        <View style={s.nutriCell}>
                          <Text style={s.nutriVal}>{result.nutrition.carbsG}g</Text>
                          <Text style={s.nutriKey}>{language === 'sq-AL' ? 'Karboh.' : 'Carbs'}</Text>
                        </View>
                      )}
                      {result.nutrition.fatG != null && (
                        <View style={s.nutriCell}>
                          <Text style={s.nutriVal}>{result.nutrition.fatG}g</Text>
                          <Text style={s.nutriKey}>{language === 'sq-AL' ? 'Yndyrna' : 'Fat'}</Text>
                        </View>
                      )}
                      {result.nutrition.fiberG != null && (
                        <View style={s.nutriCell}>
                          <Text style={s.nutriVal}>{result.nutrition.fiberG}g</Text>
                          <Text style={s.nutriKey}>{language === 'sq-AL' ? 'Fibra' : 'Fiber'}</Text>
                        </View>
                      )}
                    </View>
                  </Surface>
                )}

                {/* Matching recipes */}
                <Text style={s.matchHeading}>{L.recipes}</Text>
                {matches.length === 0 ? (
                  <Text style={s.noMatch}>{L.noMatch}</Text>
                ) : (
                  <View style={s.matchList}>
                    {matches.map((r) => {
                      const img = r.image?.downloadUrl ?? r.image?.sourceUrl ?? null;
                      return (
                        <Pressable key={r.id} onPress={() => setSelected(r)}>
                          <Surface style={s.matchCard} elevation={0}>
                            {img && <Image source={{ uri: img }} style={s.matchImg} resizeMode="cover" />}
                            <View style={s.matchInfo}>
                              <Text style={s.matchTitle} numberOfLines={2}>{r.title[language]}</Text>
                              <View style={s.matchPills}>
                                <View style={s.matchPill}><Text style={s.matchPillText}>{r.ageStage}</Text></View>
                                {(r.totalMinutes ?? r.prepMinutes) != null && (
                                  <View style={s.matchPill}><Text style={s.matchPillText}>⏱ {r.totalMinutes ?? r.prepMinutes} min</Text></View>
                                )}
                              </View>
                            </View>
                          </Surface>
                        </Pressable>
                      );
                    })}
                  </View>
                )}
              </>
            )}
          </ScrollView>
        </View>
      </Modal>

      <RecipeDetailModal recipe={selected} onClose={() => setSelected(null)} />
    </>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFF9F5' },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#D0CBC5', alignSelf: 'center', marginTop: 12 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  heading: { fontSize: 26, fontWeight: '800', letterSpacing: -0.8, color: '#111111' },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#EEE9E4', alignItems: 'center', justifyContent: 'center' },
  closeBtnText: { fontSize: 14, color: '#3D3530', fontWeight: '700' },

  scroll: { paddingHorizontal: 18, paddingBottom: 40, gap: 16 },

  pickRow: { flexDirection: 'row', gap: 12 },
  pickBtn: {
    flex: 1, borderRadius: 18, backgroundColor: '#6ECAC0',
    paddingVertical: 16, alignItems: 'center',
  },
  pickBtnText: { fontSize: 16, fontWeight: '800', color: '#FFFFFF' },

  preview: { width: '100%', height: 220, borderRadius: 20 },

  loadingCard: { alignItems: 'center', gap: 12, paddingVertical: 24 },
  loadingText: { fontSize: 16, color: '#6E6560', fontWeight: '600' },

  errorCard: { borderRadius: 18, backgroundColor: '#FFE9E9', padding: 16 },
  errorText: { fontSize: 14, color: '#C42020', fontWeight: '600' },

  resultCard: { borderRadius: 22, backgroundColor: '#FFFFFF', padding: 16, gap: 10, borderWidth: 1, borderColor: '#F0EDE8' },
  resultLabel: { fontSize: 12, fontWeight: '800', color: '#9E9590', textTransform: 'uppercase', letterSpacing: 0.5 },
  foodName: { fontSize: 22, fontWeight: '800', color: '#111111', letterSpacing: -0.6 },
  agePill: { alignSelf: 'flex-start', backgroundColor: '#E8FFF8', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5 },
  agePillText: { fontSize: 13, fontWeight: '700', color: '#1A7A6A' },
  notes: { fontSize: 14, lineHeight: 20, color: '#4A4440' },

  ingredientList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  ingredientPill: { backgroundColor: '#FFF5A7', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  ingredientPillText: { fontSize: 13, fontWeight: '600', color: '#4A3D00' },

  nutriRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  nutriCell: { alignItems: 'center', minWidth: 56, backgroundColor: '#F8F8F8', borderRadius: 14, padding: 10 },
  nutriVal: { fontSize: 18, fontWeight: '800', color: '#111111' },
  nutriKey: { fontSize: 11, color: '#9E9590', fontWeight: '600', marginTop: 2 },

  matchHeading: { fontSize: 20, fontWeight: '800', letterSpacing: -0.6, color: '#111111' },
  noMatch: { fontSize: 14, color: '#9E9590', textAlign: 'center', paddingVertical: 8 },
  matchList: { gap: 12 },
  matchCard: { borderRadius: 20, backgroundColor: '#FFFFFF', flexDirection: 'row', gap: 12, padding: 12, borderWidth: 1, borderColor: '#F0EDE8' },
  matchImg: { width: 64, height: 64, borderRadius: 14 },
  matchInfo: { flex: 1, justifyContent: 'center', gap: 6 },
  matchTitle: { fontSize: 15, fontWeight: '700', color: '#111111', lineHeight: 20 },
  matchPills: { flexDirection: 'row', gap: 6 },
  matchPill: { backgroundColor: '#F0F8F6', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  matchPillText: { fontSize: 11, fontWeight: '700', color: '#2A7A6A' },
});
