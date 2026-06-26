import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, Share, StyleSheet, TextInput, View } from 'react-native';
import { Surface, Text } from 'react-native-paper';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Line, Polyline } from 'react-native-svg';

import { addGrowthEntry, getGrowthLog, GrowthEntry, removeGrowthEntry } from '../lib/growthTracker';
import { useLanguage } from '../providers/LanguageProvider';

const L = {
  'sq-AL': {
    title: 'Gjatësia & Pesha',
    date: 'Data (VVVV-MM-DD)',
    weight: 'Pesha (kg)',
    height: 'Gjatësia (cm)',
    note: 'Shënim (opsional)',
    add: 'Shto',
    noEntries: 'Nuk ka shënime akoma. Shto matjen e parë!',
    weightChart: 'Pesha (kg)',
    heightChart: 'Gjatësia (cm)',
    deleteConfirm: 'Fshi hyrjen?',
  },
  en: {
    title: 'Growth Tracker',
    date: 'Date (YYYY-MM-DD)',
    weight: 'Weight (kg)',
    height: 'Height (cm)',
    note: 'Note (optional)',
    add: 'Add',
    noEntries: 'No entries yet. Add your first measurement!',
    weightChart: 'Weight (kg)',
    heightChart: 'Height (cm)',
    deleteConfirm: 'Delete entry?',
  },
} as const;

const CHART_W = 300;
const CHART_H = 110;
const PAD = 10;

function miniChart(values: number[], color: string) {
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const pts = values.map((v, i) => {
    const x = PAD + (i / (values.length - 1)) * (CHART_W - PAD * 2);
    const y = CHART_H - PAD - ((v - min) / range) * (CHART_H - PAD * 2);
    return `${x},${y}`;
  });
  return (
    <Svg width={CHART_W} height={CHART_H}>
      <Line x1={PAD} y1={CHART_H - PAD} x2={CHART_W - PAD} y2={CHART_H - PAD} stroke="#E8E4F0" strokeWidth="1" />
      <Polyline points={pts.join(' ')} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {values.map((v, i) => {
        const x = PAD + (i / (values.length - 1)) * (CHART_W - PAD * 2);
        const y = CHART_H - PAD - ((v - min) / range) * (CHART_H - PAD * 2);
        return <Circle key={i} cx={x} cy={y} r={4} fill={color} />;
      })}
    </Svg>
  );
}

type Props = { visible: boolean; onClose: () => void };

export function GrowthTrackerModal({ visible, onClose }: Props) {
  const { language } = useLanguage();
  const ll = L[language];

  const [entries, setEntries] = useState<GrowthEntry[]>([]);
  const [date, setDate]       = useState(new Date().toISOString().slice(0, 10));
  const [weight, setWeight]   = useState('');
  const [height, setHeight]   = useState('');
  const [note, setNote]       = useState('');
  const [adding, setAdding]   = useState(false);

  useEffect(() => {
    if (visible) getGrowthLog().then(setEntries).catch(() => {});
  }, [visible]);

  async function handleAdd() {
    if (!date) return;
    const w = parseFloat(weight);
    const h = parseFloat(height);
    if (isNaN(w) && isNaN(h)) return;
    setAdding(true);
    await addGrowthEntry({
      date,
      weightKg: isNaN(w) ? undefined : w,
      heightCm: isNaN(h) ? undefined : h,
      note: note.trim() || undefined,
    });
    const updated = await getGrowthLog();
    setEntries(updated);
    setWeight('');
    setHeight('');
    setNote('');
    setAdding(false);
  }

  async function handleRemove(id: string) {
    await removeGrowthEntry(id);
    getGrowthLog().then(setEntries).catch(() => {});
  }

  const weightValues = entries.filter((e) => e.weightKg != null).map((e) => e.weightKg!);
  const heightValues = entries.filter((e) => e.heightCm != null).map((e) => e.heightCm!);

  async function handleShare() {
    if (entries.length === 0) return;
    const header = language === 'sq-AL' ? '📊 Rritja e Bebës' : '📊 Baby Growth Log';
    const lines = [header, ''];
    for (const e of [...entries].reverse()) {
      const parts: string[] = [e.date];
      if (e.weightKg != null) parts.push(`⚖ ${e.weightKg} kg`);
      if (e.heightCm != null) parts.push(`📏 ${e.heightCm} cm`);
      if (e.note) parts.push(`(${e.note})`);
      lines.push(parts.join('  '));
    }
    try {
      await Share.share({ message: lines.join('\n') });
    } catch {}
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
          {entries.length > 0 ? (
            <Pressable style={s.closeBtn} onPress={handleShare} hitSlop={8}>
              <Text style={s.closeX}>↑</Text>
            </Pressable>
          ) : (
            <View style={{ width: 36 }} />
          )}
        </View>

        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          {/* Charts */}
          {weightValues.length >= 2 && (
            <Surface style={s.chartCard} elevation={0}>
              <Text style={s.chartLabel}>{ll.weightChart}</Text>
              {miniChart(weightValues, '#6ECAC0')}
            </Surface>
          )}
          {heightValues.length >= 2 && (
            <Surface style={s.chartCard} elevation={0}>
              <Text style={s.chartLabel}>{ll.heightChart}</Text>
              {miniChart(heightValues, '#A68DFF')}
            </Surface>
          )}

          {/* Add form */}
          <Surface style={s.formCard} elevation={0}>
            <TextInput
              style={s.input}
              value={date}
              onChangeText={setDate}
              placeholder={ll.date}
              placeholderTextColor="#B0A9A3"
            />
            <View style={s.row}>
              <TextInput
                style={[s.input, s.inputHalf]}
                value={weight}
                onChangeText={setWeight}
                placeholder={ll.weight}
                placeholderTextColor="#B0A9A3"
                keyboardType="decimal-pad"
              />
              <TextInput
                style={[s.input, s.inputHalf]}
                value={height}
                onChangeText={setHeight}
                placeholder={ll.height}
                placeholderTextColor="#B0A9A3"
                keyboardType="decimal-pad"
              />
            </View>
            <TextInput
              style={s.input}
              value={note}
              onChangeText={setNote}
              placeholder={ll.note}
              placeholderTextColor="#B0A9A3"
            />
            <Pressable style={[s.addBtn, adding && s.addBtnDim]} onPress={handleAdd} disabled={adding}>
              <Text style={s.addBtnLabel}>{ll.add}</Text>
            </Pressable>
          </Surface>

          {/* Entry list */}
          {entries.length === 0 ? (
            <Text style={s.empty}>{ll.noEntries}</Text>
          ) : (
            <View style={s.entryList}>
              {[...entries].reverse().map((e) => (
                <Surface key={e.id} style={s.entryRow} elevation={0}>
                  <View style={s.entryLeft}>
                    <Text style={s.entryDate}>{e.date}</Text>
                    <View style={s.entryMeta}>
                      {e.weightKg != null && (
                        <View style={s.badge}>
                          <Text style={s.badgeText}>⚖ {e.weightKg} kg</Text>
                        </View>
                      )}
                      {e.heightCm != null && (
                        <View style={[s.badge, s.badgePurple]}>
                          <Text style={s.badgeText}>📏 {e.heightCm} cm</Text>
                        </View>
                      )}
                    </View>
                    {e.note && <Text style={s.entryNote}>{e.note}</Text>}
                  </View>
                  <Pressable style={s.delBtn} onPress={() => handleRemove(e.id)} hitSlop={8}>
                    <Text style={s.delX}>✕</Text>
                  </Pressable>
                </Surface>
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
}

const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: '#FFF9F5' },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingVertical: 12 },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F0EDE8', alignItems: 'center', justifyContent: 'center' },
  closeX: { fontSize: 16, color: '#555', fontWeight: '700' },
  title:  { fontSize: 20, fontWeight: '800', letterSpacing: -0.6, color: '#111' },

  scroll: { paddingHorizontal: 18, paddingBottom: 40, gap: 16 },

  chartCard: { borderRadius: 24, backgroundColor: '#FEFEFF', padding: 16, gap: 8 },
  chartLabel: { fontSize: 14, fontWeight: '700', color: '#555' },

  formCard: { borderRadius: 24, backgroundColor: '#FFFFFF', padding: 18, gap: 12, elevation: 0 },
  row: { flexDirection: 'row', gap: 10 },
  input: {
    backgroundColor: '#F5F2EE', borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: '#1A1714',
    flex: 1,
  },
  inputHalf: { flex: 1 },
  addBtn: { backgroundColor: '#6ECAC0', borderRadius: 999, paddingVertical: 16, alignItems: 'center' },
  addBtnDim: { opacity: 0.6 },
  addBtnLabel: { fontSize: 16, fontWeight: '800', color: '#FFFFFF' },

  empty: { textAlign: 'center', color: '#9E9590', fontSize: 15, paddingVertical: 24 },
  entryList: { gap: 10 },
  entryRow: {
    borderRadius: 18, backgroundColor: '#FEFEFE',
    padding: 14, flexDirection: 'row',
    alignItems: 'flex-start', justifyContent: 'space-between',
    borderWidth: 1, borderColor: '#F0EDE8',
  },
  entryLeft: { flex: 1, gap: 6 },
  entryDate: { fontSize: 14, fontWeight: '700', color: '#111' },
  entryMeta: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  badge: { borderRadius: 999, backgroundColor: '#E8FAF8', paddingHorizontal: 10, paddingVertical: 4 },
  badgePurple: { backgroundColor: '#F0CBFF' },
  badgeText: { fontSize: 13, fontWeight: '700', color: '#2A2030' },
  entryNote: { fontSize: 13, color: '#7A6A5A' },
  delBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#FFECEC', alignItems: 'center', justifyContent: 'center' },
  delX: { fontSize: 12, color: '#C42020', fontWeight: '800' },
});
