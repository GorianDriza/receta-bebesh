import { useEffect, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Surface, Text } from 'react-native-paper';

import {
  addFreezerEntry,
  FreezerEntry,
  getFreezerLog,
  removeFreezerEntry,
  useOnePortion,
} from '../lib/freezerTracker';
import { useLanguage } from '../providers/LanguageProvider';

const FOOD_EMOJIS = ['🥕', '🥦', '🍗', '🐟', '🥣', '🍲', '🥚', '🫘', '🌽', '🥬', '🍠', '🍎', '🍌', '🥝', '🫐', '🍊', '🥑', '🧀', '🍚', '🫙'];

const L = {
  'sq-AL': {
    title: '🧊 Ngrirësi',
    empty: 'Asnjë ushqim i ngrirë. Shto poshtë!',
    add: 'Shto',
    portionsLeft: 'porci.',
    useOne: '−1',
    foodName: 'Emri ushqimit...',
    portions: 'Sasi (porci)',
    date: 'Data (VVVV-MM-DD)',
    notes: 'Shënim (opsional)',
    deleteConfirm: 'Fshi hyrjen nga ngrirësi?',
    total: 'gjithsej',
  },
  en: {
    title: '🧊 Freezer',
    empty: 'No frozen meals. Add one below!',
    add: 'Add',
    portionsLeft: 'left',
    useOne: '−1',
    foodName: 'Food name...',
    portions: 'Portions',
    date: 'Date (YYYY-MM-DD)',
    notes: 'Note (optional)',
    deleteConfirm: 'Remove this from the freezer?',
    total: 'total',
  },
} as const;

type Props = { visible: boolean; onClose: () => void };

export function FreezerModal({ visible, onClose }: Props) {
  const { language } = useLanguage();
  const ll = L[language];

  const [entries, setEntries] = useState<FreezerEntry[]>([]);
  const [selectedEmoji, setSelectedEmoji] = useState('🥕');
  const [foodName, setFoodName]   = useState('');
  const [portions, setPortions]   = useState('4');
  const [date, setDate]           = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes]         = useState('');
  const [adding, setAdding]       = useState(false);
  const [showForm, setShowForm]   = useState(false);

  async function reload() {
    setEntries(await getFreezerLog());
  }

  useEffect(() => {
    if (visible) reload();
  }, [visible]);

  async function handleAdd() {
    const name = foodName.trim();
    const p = parseInt(portions, 10);
    if (!name || isNaN(p) || p < 1) return;
    setAdding(true);
    await addFreezerEntry({
      foodName: name,
      emoji: selectedEmoji,
      dateCoooked: date,
      totalPortions: p,
      portionsLeft: p,
      notes: notes.trim() || undefined,
    });
    setFoodName('');
    setPortions('4');
    setNotes('');
    setShowForm(false);
    await reload();
    setAdding(false);
  }

  async function handleUse(id: string) {
    await useOnePortion(id);
    await reload();
  }

  function handleDelete(id: string) {
    Alert.alert(ll.deleteConfirm, undefined, [
      { text: language === 'sq-AL' ? 'Anulo' : 'Cancel', style: 'cancel' },
      { text: language === 'sq-AL' ? 'Fshi' : 'Delete', style: 'destructive', onPress: async () => { await removeFreezerEntry(id); await reload(); } },
    ]);
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaProvider>
      <SafeAreaView style={s.root}>
        <View style={s.topBar}>
          <Pressable style={s.closeBtn} onPress={onClose} hitSlop={8}>
            <Text style={s.closeX}>✕</Text>
          </Pressable>
          <Text style={s.title}>{ll.title}</Text>
          <Pressable style={s.addHeaderBtn} onPress={() => setShowForm((v) => !v)} hitSlop={8}>
            <Text style={s.addHeaderBtnText}>{showForm ? '−' : '+'}</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          {/* Add form */}
          {showForm && (
            <Surface style={s.formCard} elevation={0}>
              {/* Emoji picker */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.emojiRow}>
                {FOOD_EMOJIS.map((e) => (
                  <Pressable key={e} style={[s.emojiBtn, selectedEmoji === e && s.emojiBtnOn]} onPress={() => setSelectedEmoji(e)}>
                    <Text style={s.emojiText}>{e}</Text>
                  </Pressable>
                ))}
              </ScrollView>

              <TextInput style={s.input} value={foodName} onChangeText={setFoodName} placeholder={ll.foodName} placeholderTextColor="#B0A9A3" />
              <View style={s.row}>
                <TextInput style={[s.input, { flex: 1 }]} value={date} onChangeText={setDate} placeholder={ll.date} placeholderTextColor="#B0A9A3" />
                <TextInput style={[s.input, s.portionInput]} value={portions} onChangeText={setPortions} placeholder={ll.portions} placeholderTextColor="#B0A9A3" keyboardType="number-pad" />
              </View>
              <TextInput style={s.input} value={notes} onChangeText={setNotes} placeholder={ll.notes} placeholderTextColor="#B0A9A3" />
              <Pressable style={[s.addBtn, adding && s.addBtnDim]} onPress={handleAdd} disabled={adding}>
                <Text style={s.addBtnLabel}>{ll.add}</Text>
              </Pressable>
            </Surface>
          )}

          {/* Entry list */}
          {entries.length === 0 ? (
            <Text style={s.empty}>{ll.empty}</Text>
          ) : (
            <View style={s.list}>
              {entries.map((e) => {
                const pct = e.portionsLeft / e.totalPortions;
                const barColor = pct > 0.5 ? '#6ECAC0' : pct > 0.25 ? '#F4A62C' : '#E05252';
                return (
                  <Surface key={e.id} style={s.card} elevation={0}>
                    <View style={s.cardTop}>
                      <Text style={s.cardEmoji}>{e.emoji}</Text>
                      <View style={s.cardInfo}>
                        <Text style={s.cardName}>{e.foodName}</Text>
                        <Text style={s.cardDate}>{e.dateCoooked}</Text>
                        {e.notes ? <Text style={s.cardNote}>{e.notes}</Text> : null}
                      </View>
                      <Pressable style={s.delBtn} onPress={() => handleDelete(e.id)} hitSlop={8}>
                        <Text style={s.delX}>✕</Text>
                      </Pressable>
                    </View>

                    {/* Portion bar */}
                    <View style={s.barTrack}>
                      <View style={[s.barFill, { width: `${Math.round(pct * 100)}%` as `${number}%`, backgroundColor: barColor }]} />
                    </View>

                    <View style={s.cardBottom}>
                      <Text style={s.portionText}>
                        <Text style={[s.portionNum, { color: barColor }]}>{e.portionsLeft}</Text>
                        {' '}{ll.portionsLeft} / {e.totalPortions} {ll.total}
                      </Text>
                      <Pressable
                        style={[s.useBtn, { backgroundColor: barColor }]}
                        onPress={() => handleUse(e.id)}
                      >
                        <Text style={s.useBtnText}>{ll.useOne}</Text>
                      </Pressable>
                    </View>
                  </Surface>
                );
              })}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#EEF9FF' },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 18, paddingVertical: 12,
  },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#FFFFFF99', alignItems: 'center', justifyContent: 'center' },
  closeX: { fontSize: 15, color: '#555', fontWeight: '700' },
  addHeaderBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#6ECAC0', alignItems: 'center', justifyContent: 'center' },
  addHeaderBtnText: { fontSize: 22, color: '#FFFFFF', fontWeight: '300', lineHeight: 28 },
  title: { fontSize: 20, fontWeight: '800', color: '#111', letterSpacing: -0.5 },

  scroll: { paddingHorizontal: 18, paddingBottom: 40, gap: 14 },

  formCard: { borderRadius: 24, backgroundColor: '#FFFFFF', padding: 18, gap: 12 },
  emojiRow: { gap: 6, paddingVertical: 4 },
  emojiBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F5F2EE' },
  emojiBtnOn: { backgroundColor: '#C8F0EC' },
  emojiText: { fontSize: 24 },
  row: { flexDirection: 'row', gap: 10 },
  input: {
    backgroundColor: '#F5F2EE', borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: '#1A1714',
  },
  portionInput: { width: 90 },
  addBtn: { backgroundColor: '#6ECAC0', borderRadius: 999, paddingVertical: 16, alignItems: 'center' },
  addBtnDim: { opacity: 0.6 },
  addBtnLabel: { fontSize: 16, fontWeight: '800', color: '#FFFFFF' },

  empty: { textAlign: 'center', color: '#9E9590', fontSize: 15, paddingVertical: 32 },
  list: { gap: 12 },

  card: {
    borderRadius: 20, backgroundColor: '#FFFFFF',
    padding: 16, gap: 10,
    borderWidth: 1, borderColor: '#E0F4F8',
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  cardEmoji: { fontSize: 36, lineHeight: 42 },
  cardInfo: { flex: 1, gap: 2 },
  cardName: { fontSize: 17, fontWeight: '800', color: '#111' },
  cardDate: { fontSize: 12, color: '#9E9590', fontWeight: '600' },
  cardNote: { fontSize: 12, color: '#7A6A5A', marginTop: 2 },
  delBtn: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#FFECEC', alignItems: 'center', justifyContent: 'center' },
  delX: { fontSize: 11, color: '#C42020', fontWeight: '800' },

  barTrack: { height: 8, borderRadius: 4, backgroundColor: '#F0F0F0', overflow: 'hidden' },
  barFill: { height: 8, borderRadius: 4, minWidth: 4 },

  cardBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  portionText: { fontSize: 14, color: '#6E6560', fontWeight: '600' },
  portionNum: { fontSize: 22, fontWeight: '800' },
  useBtn: { borderRadius: 999, paddingHorizontal: 18, paddingVertical: 8 },
  useBtnText: { fontSize: 16, fontWeight: '800', color: '#FFFFFF' },
});
