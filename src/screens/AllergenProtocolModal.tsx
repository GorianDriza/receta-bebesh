import { useEffect, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Surface, Text } from 'react-native-paper';

import {
  Allergen,
  AllergenEntry,
  AllergenReaction,
  ALLERGENS,
  getAllergenLog,
  REACTION_CONFIG,
  removeAllergenEntry,
  saveAllergenEntry,
} from '../lib/allergenProtocol';
import { useLanguage } from '../providers/LanguageProvider';

const L = {
  'sq-AL': {
    title: '🎯 Protokolli i Alergenëve',
    subtitle: '9 alergenë kryesorë • Fillo 1 nga 1 • Prit 3-5 ditë',
    logTitle: 'Shëno hyrjen',
    date: 'Data (VVVV-MM-DD)',
    notes: 'Shënim...',
    save: 'Ruaj',
    reset: 'Fshi',
    tip: 'Këshillë',
    introduced: 'Prezantuar',
    notTried: 'Nuk është provuar',
    progress: 'Progres',
  },
  en: {
    title: '🎯 Allergen Protocol',
    subtitle: '9 major allergens • Introduce 1 at a time • Wait 3-5 days',
    logTitle: 'Log introduction',
    date: 'Date (YYYY-MM-DD)',
    notes: 'Note...',
    save: 'Save',
    reset: 'Remove',
    tip: 'Tip',
    introduced: 'Introduced',
    notTried: 'Not tried yet',
    progress: 'Progress',
  },
} as const;

type Props = { visible: boolean; onClose: () => void };

export function AllergenProtocolModal({ visible, onClose }: Props) {
  const { language } = useLanguage();
  const ll = L[language];

  const [log, setLog]             = useState<AllergenEntry[]>([]);
  const [selected, setSelected]   = useState<Allergen | null>(null);
  const [date, setDate]           = useState(new Date().toISOString().slice(0, 10));
  const [reaction, setReaction]   = useState<AllergenReaction>('none');
  const [notes, setNotes]         = useState('');

  async function reload() {
    setLog(await getAllergenLog());
  }

  useEffect(() => {
    if (visible) reload();
  }, [visible]);

  function openLog(allergen: Allergen) {
    const existing = log.find((e) => e.allergenId === allergen.id);
    setDate(existing?.dateIntroduced ?? new Date().toISOString().slice(0, 10));
    setReaction(existing?.reaction ?? 'none');
    setNotes(existing?.notes ?? '');
    setSelected(allergen);
  }

  async function handleSave() {
    if (!selected) return;
    await saveAllergenEntry({ allergenId: selected.id, dateIntroduced: date, reaction, notes: notes.trim() });
    await reload();
    setSelected(null);
  }

  function handleReset(allergenId: string) {
    Alert.alert(
      language === 'sq-AL' ? 'Fshi shënimin?' : 'Remove entry?',
      undefined,
      [
        { text: language === 'sq-AL' ? 'Anulo' : 'Cancel', style: 'cancel' },
        { text: language === 'sq-AL' ? 'Fshi' : 'Delete', style: 'destructive', onPress: async () => { await removeAllergenEntry(allergenId); await reload(); } },
      ],
    );
  }

  const doneCount = log.length;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaProvider>
      <SafeAreaView style={s.root}>
        <View style={s.topBar}>
          <Pressable style={s.closeBtn} onPress={onClose} hitSlop={8}>
            <Text style={s.closeX}>✕</Text>
          </Pressable>
          <View style={s.titleBlock}>
            <Text style={s.title}>{ll.title}</Text>
            <Text style={s.subtitle}>{ll.subtitle}</Text>
          </View>
          <View style={s.progressPill}>
            <Text style={s.progressText}>{doneCount}/9</Text>
          </View>
        </View>

        {/* Progress bar */}
        <View style={s.progressTrack}>
          <View style={[s.progressFill, { width: `${Math.round((doneCount / 9) * 100)}%` as `${number}%` }]} />
        </View>

        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={s.grid}>
            {ALLERGENS.map((allergen) => {
              const entry = log.find((e) => e.allergenId === allergen.id);
              const rc = entry ? REACTION_CONFIG[entry.reaction] : null;
              return (
                <Pressable key={allergen.id} onPress={() => openLog(allergen)} style={s.cell}>
                  <Surface style={[s.allergenCard, entry && { borderColor: rc!.color, borderWidth: 2 }]} elevation={0}>
                    <Text style={s.allergenEmoji}>{allergen.emoji}</Text>
                    <Text style={s.allergenName}>{language === 'sq-AL' ? allergen.name_sq : allergen.name_en}</Text>
                    {entry ? (
                      <>
                        <View style={[s.reactionBadge, { backgroundColor: rc!.color + '22' }]}>
                          <Text style={s.reactionBadgeText}>{rc!.emoji}</Text>
                        </View>
                        <Text style={s.entryDate}>{entry.dateIntroduced}</Text>
                      </>
                    ) : (
                      <Text style={s.notTried}>{ll.notTried}</Text>
                    )}
                  </Surface>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>

        {/* Log sheet */}
        {selected && (
          <View style={s.sheet}>
            <View style={s.sheetHandle} />
            <View style={s.sheetHeader}>
              <Text style={s.sheetTitle}>
                {selected.emoji} {language === 'sq-AL' ? selected.name_sq : selected.name_en}
              </Text>
              {log.find((e) => e.allergenId === selected.id) && (
                <Pressable onPress={() => { handleReset(selected.id); setSelected(null); }} hitSlop={8}>
                  <Text style={s.resetBtn}>{ll.reset}</Text>
                </Pressable>
              )}
            </View>

            <Surface style={s.tipCard} elevation={0}>
              <Text style={s.tipLabel}>{ll.tip}:</Text>
              <Text style={s.tipText}>{language === 'sq-AL' ? selected.tip_sq : selected.tip_en}</Text>
            </Surface>

            <TextInput
              style={s.input}
              value={date}
              onChangeText={setDate}
              placeholder={ll.date}
              placeholderTextColor="#B0A9A3"
            />

            {/* Reaction picker */}
            <View style={s.reactionRow}>
              {(Object.entries(REACTION_CONFIG) as Array<[AllergenReaction, typeof REACTION_CONFIG[AllergenReaction]]>).map(([key, rc]) => (
                <Pressable
                  key={key}
                  style={[s.reactionBtn, reaction === key && { backgroundColor: rc.color + '33', borderColor: rc.color, borderWidth: 1.5 }]}
                  onPress={() => setReaction(key)}
                >
                  <Text style={s.reactionBtnEmoji}>{rc.emoji}</Text>
                  <Text style={s.reactionBtnLabel}>{language === 'sq-AL' ? rc.label_sq : rc.label_en}</Text>
                </Pressable>
              ))}
            </View>

            <TextInput
              style={s.input}
              value={notes}
              onChangeText={setNotes}
              placeholder={ll.notes}
              placeholderTextColor="#B0A9A3"
              multiline
            />

            <View style={s.sheetActions}>
              <Pressable style={s.cancelBtn} onPress={() => setSelected(null)}>
                <Text style={s.cancelBtnLabel}>{language === 'sq-AL' ? 'Anulo' : 'Cancel'}</Text>
              </Pressable>
              <Pressable style={s.saveBtn} onPress={handleSave}>
                <Text style={s.saveBtnLabel}>{ll.save}</Text>
              </Pressable>
            </View>
          </View>
        )}
      </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFF5E8' },

  topBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 18, paddingVertical: 12, gap: 10,
  },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#FFFFFF99', alignItems: 'center', justifyContent: 'center' },
  closeX: { fontSize: 15, color: '#555', fontWeight: '700' },
  titleBlock: { flex: 1, gap: 2 },
  title: { fontSize: 18, fontWeight: '800', color: '#111', letterSpacing: -0.4 },
  subtitle: { fontSize: 11, color: '#7A6A5A', fontWeight: '600' },
  progressPill: { backgroundColor: '#F4A62C', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5 },
  progressText: { fontSize: 13, fontWeight: '800', color: '#FFFFFF' },

  progressTrack: { height: 6, backgroundColor: '#F0E8D8', marginHorizontal: 18, borderRadius: 3, overflow: 'hidden', marginBottom: 4 },
  progressFill: { height: 6, backgroundColor: '#F4A62C', borderRadius: 3 },

  scroll: { paddingHorizontal: 14, paddingBottom: 40 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10 },
  cell: { width: '30%' },

  allergenCard: {
    borderRadius: 20, backgroundColor: '#FFFFFF',
    padding: 12, alignItems: 'center', gap: 4,
    borderWidth: 1, borderColor: '#F0E8D8',
    minHeight: 110,
  },
  allergenEmoji: { fontSize: 32 },
  allergenName: { fontSize: 11, fontWeight: '700', color: '#3D3530', textAlign: 'center' },
  reactionBadge: { borderRadius: 999, width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  reactionBadgeText: { fontSize: 14 },
  entryDate: { fontSize: 9, color: '#9E9590', fontWeight: '600' },
  notTried: { fontSize: 9, color: '#C4B8A8', fontWeight: '600', textAlign: 'center' },

  // Sheet overlay
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 20, paddingBottom: 34, gap: 12,
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 20, shadowOffset: { width: 0, height: -6 },
    elevation: 12,
  },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#E0D8D0', alignSelf: 'center', marginBottom: 4 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sheetTitle: { fontSize: 20, fontWeight: '800', color: '#111' },
  resetBtn: { fontSize: 14, fontWeight: '700', color: '#E05252' },
  tipCard: { backgroundColor: '#FFF9F0', borderRadius: 14, padding: 12, gap: 4 },
  tipLabel: { fontSize: 11, fontWeight: '800', color: '#C47A00', textTransform: 'uppercase' },
  tipText: { fontSize: 13, color: '#5A4530', lineHeight: 18 },

  input: {
    backgroundColor: '#F5F2EE', borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: '#1A1714',
  },

  reactionRow: { flexDirection: 'row', gap: 8 },
  reactionBtn: {
    flex: 1, borderRadius: 14, backgroundColor: '#F5F2EE',
    paddingVertical: 10, alignItems: 'center', gap: 4,
  },
  reactionBtnEmoji: { fontSize: 20 },
  reactionBtnLabel: { fontSize: 10, fontWeight: '700', color: '#3D3530', textAlign: 'center' },

  sheetActions: { flexDirection: 'row', gap: 10 },
  cancelBtn: { flex: 1, borderRadius: 999, paddingVertical: 14, alignItems: 'center', backgroundColor: '#F5F2EE' },
  cancelBtnLabel: { fontSize: 15, fontWeight: '700', color: '#6E6560' },
  saveBtn: { flex: 2, borderRadius: 999, paddingVertical: 14, alignItems: 'center', backgroundColor: '#F4A62C' },
  saveBtnLabel: { fontSize: 15, fontWeight: '800', color: '#FFFFFF' },
});
