import { useState } from 'react';
import {
  ActivityIndicator, Alert, Image, Modal, Pressable,
  ScrollView, StyleSheet, TextInput, View,
} from 'react-native';
import { Surface, Text } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';

import { RecipeStage, RecipeMealType } from '../lib/recipes';
import { UserRecipeRecord, saveCommunityRecipe } from '../lib/userRecipes';
import { useAuth } from '../providers/AuthProvider';
import { useLanguage } from '../providers/LanguageProvider';

const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? '';
const MODEL   = process.env.EXPO_PUBLIC_GEMINI_MODEL ?? 'gemini-2.0-flash-lite';

type Step = 'pick' | 'scanning' | 'editing' | 'saving' | 'done';

type DraftRecipe = {
  title: string;
  summary: string;
  ageStage: RecipeStage;
  mealType: RecipeMealType;
  prepMinutes: string;
  ingredients: string;
  steps: string;
};

const AGE_STAGES: RecipeStage[] = ['4-6m', '6-8m', '9-12m', '12m+', 'family'];
const MEAL_TYPES: RecipeMealType[] = ['breakfast', 'lunch', 'dinner', 'snack', 'puree', 'finger-food', 'batch-prep'];

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

async function extractRecipeFromImage(base64: string, mimeType: string, language: string): Promise<DraftRecipe> {
  if (!API_KEY) throw new Error('Gemini API key not set');

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { inline_data: { mime_type: mimeType, data: base64 } },
            {
              text: `Extract the recipe from this image. Return ONLY valid JSON:
{
  "title": "recipe name",
  "summary": "one sentence description",
  "ageStage": "4-6m or 6-8m or 9-12m or 12m+ or family",
  "mealType": "breakfast or lunch or dinner or snack or puree or finger-food or batch-prep",
  "prepMinutes": 15,
  "ingredients": ["1 cup flour", "2 eggs"],
  "steps": ["Mix flour and eggs", "Bake at 180°C for 20 min"]
}
If no recipe is visible, still return the JSON with best guesses based on the food shown.`,
            },
          ],
        }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 1024 },
      }),
    },
  );

  if (!res.ok) throw new Error(`Gemini ${res.status}`);
  const data = await res.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
  const raw = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  const start = raw.indexOf('{');
  const end   = raw.lastIndexOf('}');
  if (start === -1) throw new Error('No JSON in response');
  const parsed = JSON.parse(raw.slice(start, end + 1)) as {
    title?: string; summary?: string; ageStage?: string; mealType?: string;
    prepMinutes?: number | string; ingredients?: string[]; steps?: string[];
  };

  return {
    title:       parsed.title ?? '',
    summary:     parsed.summary ?? '',
    ageStage:    (AGE_STAGES.includes(parsed.ageStage as RecipeStage) ? parsed.ageStage : 'family') as RecipeStage,
    mealType:    (MEAL_TYPES.includes(parsed.mealType as RecipeMealType) ? parsed.mealType : 'lunch') as RecipeMealType,
    prepMinutes: parsed.prepMinutes != null ? String(parsed.prepMinutes) : '',
    ingredients: (parsed.ingredients ?? []).join('\n'),
    steps:       (parsed.steps ?? []).join('\n'),
  };
}

type Props = {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
};

export function RecipeScannerModal({ visible, onClose, onSaved }: Props) {
  const { user } = useAuth();
  const { language } = useLanguage();

  const [step,     setStep]     = useState<Step>('pick');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [draft,    setDraft]    = useState<DraftRecipe | null>(null);
  const [error,    setError]    = useState<string | null>(null);

  const L = {
    title:       language === 'sq-AL' ? '📷 Skano Recetën' : '📷 Scan a Recipe',
    gallery:     language === 'sq-AL' ? '🖼️ Nga galeria' : '🖼️ From gallery',
    camera:      language === 'sq-AL' ? '📸 Kamera' : '📸 Camera',
    manual:      language === 'sq-AL' ? '✏️ Shkruaj manualisht' : '✏️ Type manually',
    scanning:    language === 'sq-AL' ? 'Duke analizuar recetën...' : 'Extracting recipe...',
    editTitle:   language === 'sq-AL' ? 'Kontrollo dhe ruaj' : 'Review & save',
    titleLabel:  language === 'sq-AL' ? 'Titulli' : 'Title',
    summaryLabel:language === 'sq-AL' ? 'Përshkrim' : 'Summary',
    ageLabel:    language === 'sq-AL' ? 'Mosha' : 'Age stage',
    mealLabel:   language === 'sq-AL' ? 'Lloji i vaktit' : 'Meal type',
    prepLabel:   language === 'sq-AL' ? 'Koha (min)' : 'Prep time (min)',
    ingLabel:    language === 'sq-AL' ? 'Përbërësit (një për rresht)' : 'Ingredients (one per line)',
    stepsLabel:  language === 'sq-AL' ? 'Hapat (një për rresht)' : 'Steps (one per line)',
    save:        language === 'sq-AL' ? 'Ruaj recetën' : 'Save recipe',
    saving:      language === 'sq-AL' ? 'Duke ruajtur...' : 'Saving...',
    done:        language === 'sq-AL' ? '✓ Receta u ruajt!' : '✓ Recipe saved!',
    doneBody:    language === 'sq-AL' ? 'Të gjithë përdoruesit mund ta shohin recetën tënde.' : 'All users can now see your recipe.',
    close:       language === 'sq-AL' ? 'Mbyll' : 'Close',
    loginWarn:   language === 'sq-AL' ? 'Duhet të jesh i kyçur për të ruajtur receta.' : 'You must be logged in to save recipes.',
    noApiKey:    language === 'sq-AL' ? 'Gemini API key nuk është konfiguruar.' : 'Gemini API key not configured.',
  };

  function reset() {
    setStep('pick');
    setImageUri(null);
    setDraft(null);
    setError(null);
  }

  function handleClose() {
    reset();
    onClose();
  }

  function emptyDraft(): DraftRecipe {
    return { title: '', summary: '', ageStage: 'family', mealType: 'lunch', prepMinutes: '', ingredients: '', steps: '' };
  }

  async function pick(fromCamera: boolean) {
    setError(null);
    const fn = fromCamera ? ImagePicker.launchCameraAsync : ImagePicker.launchImageLibraryAsync;
    const res = await fn({ base64: true, quality: 0.7, mediaTypes: ImagePicker.MediaTypeOptions.Images });
    if (res.canceled || !res.assets?.[0]) return;

    const asset = res.assets[0];
    if (!asset.base64) { setError('Could not read image'); return; }

    setImageUri(asset.uri);
    setStep('scanning');

    try {
      const extracted = await extractRecipeFromImage(asset.base64, asset.mimeType ?? 'image/jpeg', language);
      setDraft(extracted);
      setStep('editing');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Scan failed');
      setStep('pick');
    }
  }

  async function save() {
    if (!user) { Alert.alert('', L.loginWarn); return; }
    if (!draft) return;

    setStep('saving');
    const now = new Date().toISOString();
    const id  = `user-${user.uid.slice(0, 8)}-${slugify(draft.title || 'recipe')}-${Date.now()}`;

    const recipe: UserRecipeRecord = {
      id,
      slug:      id,
      languages: ['sq-AL', 'en'],
      title:     { en: draft.title, 'sq-AL': draft.title },
      summary:   { en: draft.summary, 'sq-AL': draft.summary },
      ingredients: {
        en:      draft.ingredients.split('\n').map((s) => s.trim()).filter(Boolean),
        'sq-AL': draft.ingredients.split('\n').map((s) => s.trim()).filter(Boolean),
      },
      steps: {
        en:      draft.steps.split('\n').map((s) => s.trim()).filter(Boolean),
        'sq-AL': draft.steps.split('\n').map((s) => s.trim()).filter(Boolean),
      },
      ageStage:    draft.ageStage,
      mealType:    draft.mealType,
      prepMinutes: draft.prepMinutes ? Number(draft.prepMinutes) : null,
      cookMinutes: null,
      totalMinutes: draft.prepMinutes ? Number(draft.prepMinutes) : null,
      image: { sourceUrl: imageUri, storagePath: null, downloadUrl: null, contentType: null, mirroredAt: null },
      source: {
        siteName: 'community',
        sourceId: id,
        url:      '',
        imageUrl: imageUri,
        scrapedAt: now,
      },
      translation: { status: 'reviewed', provider: 'user', reviewedBy: user.uid },
      authorId:  user.uid,
      createdAt: now,
      updatedAt: now,
    };

    try {
      await saveCommunityRecipe(recipe);
      setStep('done');
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
      setStep('editing');
    }
  }

  function setDraftField<K extends keyof DraftRecipe>(key: K, val: DraftRecipe[K]) {
    setDraft((d) => d ? { ...d, [key]: val } : null);
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <View style={s.root}>
        <View style={s.handle} />

        <View style={s.topRow}>
          <Text style={s.heading}>{step === 'done' ? L.done : L.title}</Text>
          <Pressable style={s.closeBtn} onPress={handleClose} hitSlop={8}>
            <Text style={s.closeBtnTxt}>✕</Text>
          </Pressable>
        </View>

        {/* ── PICK ─────────────────────────────────────────────── */}
        {step === 'pick' && (
          <ScrollView contentContainerStyle={s.scroll}>
            {error && (
              <Surface style={s.errorCard} elevation={0}>
                <Text style={s.errorTxt}>{error}</Text>
              </Surface>
            )}
            <View style={s.pickRow}>
              <Pressable style={s.bigBtn} onPress={() => pick(false)}>
                <Text style={s.bigBtnEmoji}>🖼️</Text>
                <Text style={s.bigBtnTxt}>{L.gallery}</Text>
              </Pressable>
              <Pressable style={s.bigBtn} onPress={() => pick(true)}>
                <Text style={s.bigBtnEmoji}>📸</Text>
                <Text style={s.bigBtnTxt}>{L.camera}</Text>
              </Pressable>
            </View>
            <Pressable style={s.manualBtn} onPress={() => { setDraft(emptyDraft()); setStep('editing'); }}>
              <Text style={s.manualBtnTxt}>{L.manual}</Text>
            </Pressable>
          </ScrollView>
        )}

        {/* ── SCANNING ─────────────────────────────────────────── */}
        {step === 'scanning' && (
          <View style={s.centerBlock}>
            {imageUri && <Image source={{ uri: imageUri }} style={s.scanPreview} resizeMode="cover" />}
            <ActivityIndicator color="#6ECAC0" size="large" />
            <Text style={s.scanningTxt}>{L.scanning}</Text>
          </View>
        )}

        {/* ── EDITING ──────────────────────────────────────────── */}
        {step === 'editing' && draft && (
          <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
            <Text style={s.sectionHeading}>{L.editTitle}</Text>

            {error && (
              <Surface style={s.errorCard} elevation={0}>
                <Text style={s.errorTxt}>{error}</Text>
              </Surface>
            )}

            {imageUri && <Image source={{ uri: imageUri }} style={s.previewSmall} resizeMode="cover" />}

            <Text style={s.fieldLabel}>{L.titleLabel}</Text>
            <TextInput style={s.input} value={draft.title} onChangeText={(v) => setDraftField('title', v)} />

            <Text style={s.fieldLabel}>{L.summaryLabel}</Text>
            <TextInput style={[s.input, s.inputMulti]} value={draft.summary} onChangeText={(v) => setDraftField('summary', v)} multiline />

            <Text style={s.fieldLabel}>{L.ageLabel}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.pillRow}>
              {AGE_STAGES.map((stage) => (
                <Pressable
                  key={stage}
                  style={[s.pill, draft.ageStage === stage && s.pillOn]}
                  onPress={() => setDraftField('ageStage', stage)}
                >
                  <Text style={[s.pillTxt, draft.ageStage === stage && s.pillTxtOn]}>{stage}</Text>
                </Pressable>
              ))}
            </ScrollView>

            <Text style={s.fieldLabel}>{L.mealLabel}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.pillRow}>
              {MEAL_TYPES.map((mt) => (
                <Pressable
                  key={mt}
                  style={[s.pill, draft.mealType === mt && s.pillOn]}
                  onPress={() => setDraftField('mealType', mt)}
                >
                  <Text style={[s.pillTxt, draft.mealType === mt && s.pillTxtOn]}>{mt}</Text>
                </Pressable>
              ))}
            </ScrollView>

            <Text style={s.fieldLabel}>{L.prepLabel}</Text>
            <TextInput
              style={[s.input, { width: 100 }]}
              value={draft.prepMinutes}
              onChangeText={(v) => setDraftField('prepMinutes', v.replace(/[^0-9]/g, ''))}
              keyboardType="numeric"
            />

            <Text style={s.fieldLabel}>{L.ingLabel}</Text>
            <TextInput
              style={[s.input, s.inputMultiTall]}
              value={draft.ingredients}
              onChangeText={(v) => setDraftField('ingredients', v)}
              multiline
              textAlignVertical="top"
            />

            <Text style={s.fieldLabel}>{L.stepsLabel}</Text>
            <TextInput
              style={[s.input, s.inputMultiTall]}
              value={draft.steps}
              onChangeText={(v) => setDraftField('steps', v)}
              multiline
              textAlignVertical="top"
            />

            <Pressable style={[s.saveBtn, !draft.title.trim() && s.saveBtnDisabled]} onPress={save} disabled={!draft.title.trim()}>
              <Text style={s.saveBtnTxt}>{L.save}</Text>
            </Pressable>
          </ScrollView>
        )}

        {/* ── SAVING ───────────────────────────────────────────── */}
        {step === 'saving' && (
          <View style={s.centerBlock}>
            <ActivityIndicator color="#6ECAC0" size="large" />
            <Text style={s.scanningTxt}>{L.saving}</Text>
          </View>
        )}

        {/* ── DONE ─────────────────────────────────────────────── */}
        {step === 'done' && (
          <View style={s.centerBlock}>
            <Text style={s.doneEmoji}>✅</Text>
            <Text style={s.doneBody}>{L.doneBody}</Text>
            <Pressable style={s.saveBtn} onPress={handleClose}>
              <Text style={s.saveBtnTxt}>{L.close}</Text>
            </Pressable>
          </View>
        )}
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFF9F5' },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#D0CBC5', alignSelf: 'center', marginTop: 12 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  heading: { fontSize: 26, fontWeight: '800', letterSpacing: -0.8, color: '#111111', flex: 1 },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#EEE9E4', alignItems: 'center', justifyContent: 'center' },
  closeBtnTxt: { fontSize: 14, color: '#3D3530', fontWeight: '700' },

  scroll: { paddingHorizontal: 18, paddingBottom: 48, gap: 14 },

  errorCard: { borderRadius: 16, backgroundColor: '#FFE9E9', padding: 14 },
  errorTxt:  { fontSize: 14, color: '#C42020', fontWeight: '600' },

  pickRow:    { flexDirection: 'row', gap: 12 },
  bigBtn:     { flex: 1, borderRadius: 22, backgroundColor: '#6ECAC0', paddingVertical: 28, alignItems: 'center', gap: 8 },
  bigBtnEmoji:{ fontSize: 36 },
  bigBtnTxt:  { fontSize: 16, fontWeight: '800', color: '#FFFFFF' },
  manualBtn:  { borderRadius: 18, borderWidth: 2, borderColor: '#D0CBC5', paddingVertical: 16, alignItems: 'center' },
  manualBtnTxt: { fontSize: 15, fontWeight: '700', color: '#6E6560' },

  centerBlock: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 20, padding: 32 },
  scanPreview: { width: 200, height: 160, borderRadius: 18 },
  scanningTxt: { fontSize: 16, fontWeight: '600', color: '#6E6560' },

  previewSmall: { width: '100%', height: 160, borderRadius: 18 },

  sectionHeading: { fontSize: 20, fontWeight: '800', color: '#111', letterSpacing: -0.5 },
  fieldLabel: { fontSize: 13, fontWeight: '800', color: '#9E9590', textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { borderRadius: 14, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E8E4DF', paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#111111' },
  inputMulti: { minHeight: 64, textAlignVertical: 'top' },
  inputMultiTall: { minHeight: 120, textAlignVertical: 'top' },

  pillRow: { gap: 8, paddingVertical: 4 },
  pill:    { borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: '#EEEBE6' },
  pillOn:  { backgroundColor: '#1A1714' },
  pillTxt: { fontSize: 13, fontWeight: '700', color: '#3D3530' },
  pillTxtOn: { color: '#FFFFFF' },

  saveBtn:         { borderRadius: 20, backgroundColor: '#6ECAC0', paddingVertical: 18, alignItems: 'center', marginTop: 8 },
  saveBtnDisabled: { opacity: 0.4 },
  saveBtnTxt:      { fontSize: 16, fontWeight: '800', color: '#FFFFFF' },

  doneEmoji: { fontSize: 72 },
  doneBody:  { fontSize: 16, color: '#4A4440', textAlign: 'center', lineHeight: 24 },
});
