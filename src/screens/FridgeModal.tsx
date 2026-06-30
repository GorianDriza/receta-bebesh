import { useState } from 'react';
import {
  ActivityIndicator, Modal, Pressable, ScrollView,
  StyleSheet, TextInput, View,
} from 'react-native';
import { Surface, Text } from 'react-native-paper';

import { RecipeRecord } from '../lib/recipes';
import { useLanguage } from '../providers/LanguageProvider';
import { RecipeDetailModal } from './RecipeDetailModal';

const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? '';
const MODEL   = process.env.EXPO_PUBLIC_GEMINI_MODEL ?? 'gemini-2.0-flash-lite';

// ── Ingredient catalogue ────────────────────────────────────────────────────

type Ingredient = { emoji: string; name_sq: string; name_en: string };

const INGREDIENTS: Ingredient[] = [
  { emoji: '🥕', name_sq: 'karotë',        name_en: 'carrot'        },
  { emoji: '🍠', name_sq: 'patate e ëmbël', name_en: 'sweet potato'  },
  { emoji: '🥦', name_sq: 'brokoli',        name_en: 'broccoli'      },
  { emoji: '🌽', name_sq: 'misër',          name_en: 'corn'          },
  { emoji: '🍆', name_sq: 'kungull i njomë',name_en: 'zucchini'      },
  { emoji: '🥬', name_sq: 'spinaq',         name_en: 'spinach'       },
  { emoji: '🍅', name_sq: 'domate',         name_en: 'tomato'        },
  { emoji: '🧅', name_sq: 'qepë',           name_en: 'onion'         },
  { emoji: '🥔', name_sq: 'patate',         name_en: 'potato'        },
  { emoji: '🌿', name_sq: 'bizele',         name_en: 'peas'          },
  { emoji: '🍌', name_sq: 'banane',         name_en: 'banana'        },
  { emoji: '🍎', name_sq: 'mollë',          name_en: 'apple'         },
  { emoji: '🥑', name_sq: 'avokado',        name_en: 'avocado'       },
  { emoji: '🍑', name_sq: 'pjeshkë',        name_en: 'peach'         },
  { emoji: '🫐', name_sq: 'boronica',       name_en: 'blueberry'     },
  { emoji: '🍊', name_sq: 'portokall',      name_en: 'orange'        },
  { emoji: '🍋', name_sq: 'limon',          name_en: 'lemon'         },
  { emoji: '🍐', name_sq: 'dardhë',         name_en: 'pear'          },
  { emoji: '🍓', name_sq: 'luleshtrydhe',   name_en: 'strawberry'    },
  { emoji: '🥭', name_sq: 'mango',          name_en: 'mango'         },
  { emoji: '🍗', name_sq: 'pulë',           name_en: 'chicken'       },
  { emoji: '🐟', name_sq: 'salmon',         name_en: 'salmon'        },
  { emoji: '🥚', name_sq: 'vezë',           name_en: 'egg'           },
  { emoji: '🥩', name_sq: 'viçi',           name_en: 'beef'          },
  { emoji: '🫘', name_sq: 'thjerrëza',      name_en: 'lentils'       },
  { emoji: '🧀', name_sq: 'djathë',         name_en: 'cheese'        },
  { emoji: '🥛', name_sq: 'kos',            name_en: 'yoghurt'       },
  { emoji: '🍚', name_sq: 'oriz',           name_en: 'rice'          },
  { emoji: '🌾', name_sq: 'tërbithë',       name_en: 'oats'          },
  { emoji: '🍞', name_sq: 'bukë',           name_en: 'bread'         },
  { emoji: '🧈', name_sq: 'gjalpë',         name_en: 'butter'        },
  { emoji: '🫚', name_sq: 'vaj ulliri',     name_en: 'olive oil'     },
  { emoji: '🥜', name_sq: 'kikirik',        name_en: 'peanut butter' },
  { emoji: '🧄', name_sq: 'hudhër',         name_en: 'garlic'        },
  { emoji: '🌰', name_sq: 'kastravec',      name_en: 'chickpeas'     },
  { emoji: '🐄', name_sq: 'qumësht',        name_en: 'milk'          },
];

// ── Recipe matching ─────────────────────────────────────────────────────────

function scoreRecipe(recipe: RecipeRecord, selected: Set<string>): number {
  const corpus = [
    ...(recipe.ingredients.en ?? []),
    ...(recipe.ingredients['sq-AL'] ?? []),
  ].join(' ').toLowerCase();
  let score = 0;
  for (const term of selected) {
    if (corpus.includes(term)) score++;
  }
  return score;
}

function matchRecipes(allRecipes: RecipeRecord[], selected: Set<string>): RecipeRecord[] {
  if (selected.size === 0) return [];
  return allRecipes
    .map((r) => ({ r, score: scoreRecipe(r, selected) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map(({ r }) => r);
}

// ── Gemini custom recipe ────────────────────────────────────────────────────

type GeneratedRecipe = {
  title: string;
  summary: string;
  ageStage: string;
  prepMinutes: number;
  ingredients: string[];
  steps: string[];
};

async function generateRecipe(ingredients: string[], language: string): Promise<GeneratedRecipe> {
  if (!API_KEY) throw new Error('Gemini API key not configured');
  const langNote = language === 'sq-AL' ? 'Write the recipe in Albanian.' : 'Write the recipe in English.';
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Create a healthy baby food recipe using ONLY these ingredients (plus water, salt-free broth, basic spices): ${ingredients.join(', ')}.
${langNote}
Return ONLY valid JSON:
{
  "title": "Recipe name",
  "summary": "One sentence description",
  "ageStage": "4-6m or 6-8m or 9-12m or 12m+ or family",
  "prepMinutes": 20,
  "ingredients": ["200g sweet potato", "1 carrot"],
  "steps": ["Peel and chop vegetables", "Steam for 15 minutes", "Blend until smooth"]
}`,
          }],
        }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 1024 },
      }),
    },
  );
  if (!res.ok) throw new Error(`Gemini ${res.status}`);
  const data = await res.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
  const raw = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  const start = raw.indexOf('{'); const end = raw.lastIndexOf('}');
  if (start === -1) throw new Error('No JSON in response');
  return JSON.parse(raw.slice(start, end + 1)) as GeneratedRecipe;
}

// ── Component ───────────────────────────────────────────────────────────────

type Props = { visible: boolean; onClose: () => void; allRecipes: RecipeRecord[] };

export function FridgeModal({ visible, onClose, allRecipes }: Props) {
  const { language } = useLanguage();
  const [selected,   setSelected]   = useState<Set<string>>(new Set());
  const [search,     setSearch]     = useState('');
  const [matches,    setMatches]    = useState<RecipeRecord[]>([]);
  const [searched,   setSearched]   = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generated,  setGenerated]  = useState<GeneratedRecipe | null>(null);
  const [genError,   setGenError]   = useState<string | null>(null);
  const [detail,     setDetail]     = useState<RecipeRecord | null>(null);

  const L = {
    title:     language === 'sq-AL' ? '🥕 Çfarë kam në frigorifer?' : '🥕 What\'s in my fridge?',
    hint:      language === 'sq-AL' ? 'Zgjidh përbërësit që ke' : 'Select ingredients you have',
    search:    language === 'sq-AL' ? 'Kërko përbërës...' : 'Search ingredient...',
    find:      language === 'sq-AL' ? 'Gjej receta' : 'Find recipes',
    generate:  language === 'sq-AL' ? '✨ Gjenero recetë me Gemini' : '✨ Generate recipe with Gemini',
    generating:language === 'sq-AL' ? 'Duke gjeneruar...' : 'Generating...',
    noMatch:   language === 'sq-AL' ? 'Nuk u gjetën receta.' : 'No matching recipes found.',
    tryGen:    language === 'sq-AL' ? 'Provo të gjenerosh një recetë të re me Gemini!' : 'Try generating a custom recipe with Gemini!',
    found:     (n: number) => language === 'sq-AL' ? `${n} receta të gjetura` : `${n} recipes found`,
    close:     language === 'sq-AL' ? 'Mbyll' : 'Close',
    clear:     language === 'sq-AL' ? 'Pastro' : 'Clear',
    custom:    language === 'sq-AL' ? '✨ Recetë e Gjeneruar' : '✨ Generated Recipe',
    steps:     language === 'sq-AL' ? 'Hapat:' : 'Steps:',
    ings:      language === 'sq-AL' ? 'Përbërësit:' : 'Ingredients:',
    age:       language === 'sq-AL' ? 'Mosha:' : 'Age:',
    prep:      language === 'sq-AL' ? 'Koha:' : 'Time:',
  };

  const filteredIngredients = search.trim()
    ? INGREDIENTS.filter((i) => {
        const q = search.toLowerCase();
        return i.name_en.includes(q) || i.name_sq.includes(q);
      })
    : INGREDIENTS;

  function toggle(name_en: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(name_en)) next.delete(name_en); else next.add(name_en);
      return next;
    });
    setSearched(false);
    setGenerated(null);
    setGenError(null);
  }

  function findRecipes() {
    const results = matchRecipes(allRecipes, selected);
    setMatches(results);
    setSearched(true);
    setGenerated(null);
    setGenError(null);
  }

  async function handleGenerate() {
    setGenerating(true);
    setGenError(null);
    try {
      const recipe = await generateRecipe([...selected], language);
      setGenerated(recipe);
    } catch (err) {
      setGenError(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setGenerating(false);
    }
  }

  function handleClose() {
    setSelected(new Set());
    setSearch('');
    setMatches([]);
    setSearched(false);
    setGenerated(null);
    setGenError(null);
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
              <Text style={s.closeBtnTxt}>✕</Text>
            </Pressable>
          </View>
          <Text style={s.hint}>{L.hint}</Text>

          <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

            {/* Search */}
            <View style={s.searchBar}>
              <Text style={s.searchIcon}>🔍</Text>
              <TextInput
                style={s.searchInput}
                value={search}
                onChangeText={setSearch}
                placeholder={L.search}
                placeholderTextColor="#B0A9A3"
              />
              {search !== '' && (
                <Pressable onPress={() => setSearch('')} hitSlop={8}>
                  <Text style={s.clearTxt}>✕</Text>
                </Pressable>
              )}
            </View>

            {/* Selected chips */}
            {selected.size > 0 && (
              <View style={s.selectedRow}>
                {[...selected].map((name) => {
                  const ing = INGREDIENTS.find((i) => i.name_en === name);
                  return (
                    <Pressable key={name} style={s.selectedChip} onPress={() => toggle(name)}>
                      <Text style={s.selectedChipTxt}>{ing?.emoji} {language === 'sq-AL' ? ing?.name_sq : ing?.name_en} ✕</Text>
                    </Pressable>
                  );
                })}
                <Pressable style={s.clearAllBtn} onPress={() => { setSelected(new Set()); setSearched(false); setGenerated(null); }}>
                  <Text style={s.clearAllTxt}>{L.clear}</Text>
                </Pressable>
              </View>
            )}

            {/* Ingredient grid */}
            <View style={s.grid}>
              {filteredIngredients.map((ing) => {
                const on = selected.has(ing.name_en);
                return (
                  <Pressable key={ing.name_en} style={[s.gridCell, on && s.gridCellOn]} onPress={() => toggle(ing.name_en)}>
                    <Text style={s.gridEmoji}>{ing.emoji}</Text>
                    <Text style={[s.gridLabel, on && s.gridLabelOn]} numberOfLines={1}>
                      {language === 'sq-AL' ? ing.name_sq : ing.name_en}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Find button */}
            {selected.size > 0 && (
              <Pressable style={s.findBtn} onPress={findRecipes}>
                <Text style={s.findBtnTxt}>{L.find} ({selected.size})</Text>
              </Pressable>
            )}

            {/* Results */}
            {searched && (
              <>
                {matches.length > 0 && (
                  <Text style={s.resultHeading}>{L.found(matches.length)}</Text>
                )}

                {matches.map((r) => {
                  const img = r.image?.downloadUrl ?? r.image?.sourceUrl ?? null;
                  return (
                    <Pressable key={r.id} onPress={() => setDetail(r)}>
                      <Surface style={s.recipeCard} elevation={0}>
                        {img && (
                          // eslint-disable-next-line @typescript-eslint/no-require-imports
                          <View style={s.recipeImgWrap}>
                            {/* Using Text emoji fallback for web compat */}
                          </View>
                        )}
                        <View style={s.recipeInfo}>
                          <Text style={s.recipeTitle} numberOfLines={2}>{r.title[language]}</Text>
                          <View style={s.recipePills}>
                            <View style={s.recipePill}><Text style={s.recipePillTxt}>{r.ageStage}</Text></View>
                            {(r.totalMinutes ?? r.prepMinutes) != null && (
                              <View style={s.recipePill}><Text style={s.recipePillTxt}>⏱ {r.totalMinutes ?? r.prepMinutes} min</Text></View>
                            )}
                          </View>
                        </View>
                        <Text style={s.recipeArrow}>›</Text>
                      </Surface>
                    </Pressable>
                  );
                })}

                {matches.length === 0 && (
                  <Surface style={s.noMatchCard} elevation={0}>
                    <Text style={s.noMatchTxt}>{L.noMatch}</Text>
                    <Text style={s.noMatchSub}>{L.tryGen}</Text>
                  </Surface>
                )}

                {/* Gemini generate */}
                {!generated && !generating && (
                  <Pressable style={s.genBtn} onPress={handleGenerate}>
                    <Text style={s.genBtnTxt}>{L.generate}</Text>
                  </Pressable>
                )}

                {generating && (
                  <View style={s.genLoading}>
                    <ActivityIndicator color="#6ECAC0" size="small" />
                    <Text style={s.genLoadingTxt}>{L.generating}</Text>
                  </View>
                )}

                {genError && (
                  <Surface style={s.errorCard} elevation={0}>
                    <Text style={s.errorTxt}>{genError}</Text>
                  </Surface>
                )}

                {generated && (
                  <Surface style={s.genCard} elevation={0}>
                    <Text style={s.genBadge}>{L.custom}</Text>
                    <Text style={s.genTitle}>{generated.title}</Text>
                    <Text style={s.genSummary}>{generated.summary}</Text>
                    <View style={s.genMetaRow}>
                      <View style={s.genPill}><Text style={s.genPillTxt}>{L.age} {generated.ageStage}</Text></View>
                      {generated.prepMinutes > 0 && (
                        <View style={s.genPill}><Text style={s.genPillTxt}>⏱ {generated.prepMinutes} min</Text></View>
                      )}
                    </View>
                    <Text style={s.genSectionLabel}>{L.ings}</Text>
                    {generated.ingredients.map((ing, i) => (
                      <Text key={i} style={s.genListItem}>• {ing}</Text>
                    ))}
                    <Text style={s.genSectionLabel}>{L.steps}</Text>
                    {generated.steps.map((step, i) => (
                      <Text key={i} style={s.genListItem}>{i + 1}. {step}</Text>
                    ))}
                  </Surface>
                )}
              </>
            )}
          </ScrollView>
        </View>
      </Modal>

      <RecipeDetailModal recipe={detail} onClose={() => setDetail(null)} />
    </>
  );
}

const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: '#FFF9F5' },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#D0CBC5', alignSelf: 'center', marginTop: 12 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 14, paddingBottom: 4 },
  heading:{ fontSize: 24, fontWeight: '800', letterSpacing: -0.6, color: '#111', flex: 1 },
  closeBtn:   { width: 36, height: 36, borderRadius: 18, backgroundColor: '#EEE9E4', alignItems: 'center', justifyContent: 'center' },
  closeBtnTxt:{ fontSize: 14, color: '#3D3530', fontWeight: '700' },
  hint:   { fontSize: 14, color: '#6E6560', paddingHorizontal: 20, marginBottom: 4 },

  scroll: { paddingHorizontal: 16, paddingBottom: 48, gap: 14 },

  searchBar:   { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 16, paddingHorizontal: 14, height: 44, gap: 8, borderWidth: 1, borderColor: '#E8E4DF' },
  searchIcon:  { fontSize: 14 },
  searchInput: { flex: 1, fontSize: 15, color: '#111' },
  clearTxt:    { fontSize: 13, color: '#9E9590' },

  selectedRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  selectedChip:    { backgroundColor: '#6ECAC0', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  selectedChipTxt: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
  clearAllBtn:     { backgroundColor: '#EEE9E4', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  clearAllTxt:     { fontSize: 13, fontWeight: '700', color: '#6E6560' },

  grid:       { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  gridCell:   { width: '22%', borderRadius: 16, backgroundColor: '#FFFFFF', padding: 10, alignItems: 'center', gap: 4, borderWidth: 1, borderColor: '#E8E4DF' },
  gridCellOn: { backgroundColor: '#6ECAC0', borderColor: '#6ECAC0' },
  gridEmoji:  { fontSize: 28 },
  gridLabel:  { fontSize: 11, fontWeight: '600', color: '#3D3530', textAlign: 'center' },
  gridLabelOn:{ color: '#FFFFFF' },

  findBtn:    { borderRadius: 20, backgroundColor: '#1A1714', paddingVertical: 16, alignItems: 'center' },
  findBtnTxt: { fontSize: 16, fontWeight: '800', color: '#FFFFFF' },

  resultHeading: { fontSize: 18, fontWeight: '800', color: '#111', letterSpacing: -0.4 },

  recipeCard:   { borderRadius: 18, backgroundColor: '#FFFFFF', flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12, borderWidth: 1, borderColor: '#F0EDE8' },
  recipeImgWrap:{ width: 52, height: 52, borderRadius: 12, backgroundColor: '#F0EDE8' },
  recipeInfo:   { flex: 1, gap: 6 },
  recipeTitle:  { fontSize: 15, fontWeight: '700', color: '#111', lineHeight: 20 },
  recipePills:  { flexDirection: 'row', gap: 6 },
  recipePill:   { backgroundColor: '#F0F8F6', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  recipePillTxt:{ fontSize: 11, fontWeight: '700', color: '#2A7A6A' },
  recipeArrow:  { fontSize: 22, color: '#C0BAB5', fontWeight: '300' },

  noMatchCard: { borderRadius: 18, backgroundColor: '#FFF5DC', padding: 20, gap: 8 },
  noMatchTxt:  { fontSize: 16, fontWeight: '700', color: '#111', textAlign: 'center' },
  noMatchSub:  { fontSize: 13, color: '#6E6560', textAlign: 'center' },

  genBtn:       { borderRadius: 18, backgroundColor: '#F0ECFF', paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: '#C0AAFF' },
  genBtnTxt:    { fontSize: 15, fontWeight: '800', color: '#5A2FCC' },
  genLoading:   { flexDirection: 'row', gap: 10, alignItems: 'center', justifyContent: 'center', paddingVertical: 12 },
  genLoadingTxt:{ fontSize: 14, color: '#6E6560', fontWeight: '600' },

  errorCard: { borderRadius: 16, backgroundColor: '#FFE9E9', padding: 14 },
  errorTxt:  { fontSize: 14, color: '#C42020', fontWeight: '600' },

  genCard:        { borderRadius: 22, backgroundColor: '#FFFFFF', padding: 18, gap: 10, borderWidth: 2, borderColor: '#C0AAFF' },
  genBadge:       { alignSelf: 'flex-start', backgroundColor: '#F0ECFF', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4, fontSize: 12, fontWeight: '800', color: '#5A2FCC' },
  genTitle:       { fontSize: 22, fontWeight: '800', color: '#111', letterSpacing: -0.5 },
  genSummary:     { fontSize: 14, color: '#4A4440', lineHeight: 20 },
  genMetaRow:     { flexDirection: 'row', gap: 8 },
  genPill:        { backgroundColor: '#F0F8F6', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  genPillTxt:     { fontSize: 12, fontWeight: '700', color: '#2A7A6A' },
  genSectionLabel:{ fontSize: 13, fontWeight: '800', color: '#9E9590', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 4 },
  genListItem:    { fontSize: 14, color: '#3A3A3A', lineHeight: 22 },
});
