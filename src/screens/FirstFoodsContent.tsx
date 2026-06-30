import { useCallback, useEffect, useState } from 'react';
import {
  Alert, Modal, Pressable, ScrollView, StyleSheet,
  TextInput, View,
} from 'react-native';
import { Surface, Text } from 'react-native-paper';

import {
  deleteFoodEntry, daysUntilNextSafe, FoodEntry, FoodReaction,
  getFoodEntries, saveFoodEntry, todayISO,
  FOOD_EMOJIS, REACTION_CONFIG,
} from '../lib/firstFoods';
import { useLanguage } from '../providers/LanguageProvider';

// ── helpers ─────────────────────────────────────────────────────────────────

function formatDate(iso: string, lang: string): string {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString(lang === 'sq-AL' ? 'sq' : 'en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

function daysSince(iso: string): number {
  const d = new Date(iso + 'T00:00:00');
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return Math.floor((today.getTime() - d.getTime()) / 86400000);
}

function makeId(): string {
  return `ff-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

// ── Add/Edit form ─────────────────────────────────────────────────────────────

type FormProps = {
  initial?: FoodEntry | null;
  onSave: (entry: FoodEntry) => void;
  onClose: () => void;
  language: string;
};

const REACTIONS: FoodReaction[] = ['loved', 'neutral', 'rejected', 'allergy'];

function FoodForm({ initial, onSave, onClose, language }: FormProps) {
  const [foodName,  setFoodName]  = useState(initial?.foodName ?? '');
  const [emoji,     setEmoji]     = useState(initial?.emoji ?? '🥕');
  const [reaction,  setReaction]  = useState<FoodReaction>(initial?.reaction ?? 'loved');
  const [date,      setDate]      = useState(initial?.dateIntroduced ?? todayISO());
  const [notes,     setNotes]     = useState(initial?.notes ?? '');
  const [waitDays,  setWaitDays]  = useState<3 | 5>(initial?.waitDays ?? 3);
  const [emojiGrid, setEmojiGrid] = useState(false);

  const L = {
    title:     language === 'sq-AL' ? (initial ? 'Ndrysho ushqimin' : 'Shto ushqim të ri') : (initial ? 'Edit food' : 'Add new food'),
    namePh:    language === 'sq-AL' ? 'Emri i ushqimit...' : 'Food name...',
    dateLabel: language === 'sq-AL' ? 'Data e futjes (VVVV-MM-DD)' : 'Date introduced (YYYY-MM-DD)',
    waitLabel: language === 'sq-AL' ? 'Prit para ushqimit tjetër të ri' : 'Wait before next new food',
    notesLabel:language === 'sq-AL' ? 'Shënime (opsionale)' : 'Notes (optional)',
    save:      language === 'sq-AL' ? 'Ruaj' : 'Save',
    cancel:    language === 'sq-AL' ? 'Anulo' : 'Cancel',
  };

  function handleSave() {
    if (!foodName.trim()) return;
    onSave({
      id:               initial?.id ?? makeId(),
      foodName:         foodName.trim(),
      emoji,
      dateIntroduced:   date || todayISO(),
      reaction,
      notes:            notes.trim(),
      waitDays,
    });
  }

  return (
    <View style={f.root}>
      <View style={f.handle} />
      <Text style={f.title}>{L.title}</Text>

      {/* Emoji */}
      <Pressable style={f.emojiBtn} onPress={() => setEmojiGrid((v) => !v)}>
        <Text style={f.emojiBig}>{emoji}</Text>
        <Text style={f.emojiHint}>{language === 'sq-AL' ? 'Tap për të ndryshuar' : 'Tap to change'}</Text>
      </Pressable>

      {emojiGrid && (
        <View style={f.emojiGrid}>
          {FOOD_EMOJIS.map((e) => (
            <Pressable key={e} style={[f.emojiCell, emoji === e && f.emojiCellOn]} onPress={() => { setEmoji(e); setEmojiGrid(false); }}>
              <Text style={f.emojiCellText}>{e}</Text>
            </Pressable>
          ))}
        </View>
      )}

      {/* Name */}
      <TextInput
        style={f.input}
        value={foodName}
        onChangeText={setFoodName}
        placeholder={L.namePh}
        placeholderTextColor="#B0A9A3"
        autoFocus={!initial}
      />

      {/* Reaction */}
      <View style={f.reactionRow}>
        {REACTIONS.map((r) => {
          const rc = REACTION_CONFIG[r];
          return (
            <Pressable
              key={r}
              style={[f.reactionBtn, { backgroundColor: rc.bg }, reaction === r && f.reactionBtnOn]}
              onPress={() => setReaction(r)}
            >
              <Text style={f.reactionEmoji}>{rc.emoji}</Text>
              <Text style={f.reactionLabel}>{language === 'sq-AL' ? rc.label_sq : rc.label_en}</Text>
            </Pressable>
          );
        })}
      </View>

      {/* Date */}
      <Text style={f.fieldLabel}>{L.dateLabel}</Text>
      <TextInput
        style={f.input}
        value={date}
        onChangeText={setDate}
        placeholder="2025-06-30"
        placeholderTextColor="#B0A9A3"
        keyboardType="numeric"
      />

      {/* Wait days */}
      <Text style={f.fieldLabel}>{L.waitLabel}</Text>
      <View style={f.waitRow}>
        {([3, 5] as const).map((d) => (
          <Pressable
            key={d}
            style={[f.waitBtn, waitDays === d && f.waitBtnOn]}
            onPress={() => setWaitDays(d)}
          >
            <Text style={[f.waitBtnTxt, waitDays === d && f.waitBtnTxtOn]}>
              {d} {language === 'sq-AL' ? 'ditë' : 'days'}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Notes */}
      <Text style={f.fieldLabel}>{L.notesLabel}</Text>
      <TextInput
        style={[f.input, f.inputMulti]}
        value={notes}
        onChangeText={setNotes}
        placeholder={language === 'sq-AL' ? 'Si u soll? Çfarë vuri re?' : 'How did it go? Any observations?'}
        placeholderTextColor="#B0A9A3"
        multiline
        textAlignVertical="top"
      />

      <View style={f.btnRow}>
        <Pressable style={f.cancelBtn} onPress={onClose}>
          <Text style={f.cancelBtnTxt}>{L.cancel}</Text>
        </Pressable>
        <Pressable style={[f.saveBtn, !foodName.trim() && f.saveBtnOff]} onPress={handleSave} disabled={!foodName.trim()}>
          <Text style={f.saveBtnTxt}>{L.save}</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export function FirstFoodsContent() {
  const { language } = useLanguage();
  const [entries,   setEntries]   = useState<FoodEntry[]>([]);
  const [formOpen,  setFormOpen]  = useState(false);
  const [editing,   setEditing]   = useState<FoodEntry | null>(null);
  const [filter,    setFilter]    = useState<FoodReaction | 'all'>('all');

  const load = useCallback(() => {
    getFoodEntries().then(setEntries).catch(() => {});
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleSave(entry: FoodEntry) {
    await saveFoodEntry(entry);
    setFormOpen(false);
    setEditing(null);
    load();
  }

  async function handleDelete(id: string) {
    Alert.alert(
      language === 'sq-AL' ? 'Fshi hyrjen?' : 'Delete entry?',
      language === 'sq-AL' ? 'Kjo veprim nuk mund të kthehet.' : 'This cannot be undone.',
      [
        { text: language === 'sq-AL' ? 'Anulo' : 'Cancel', style: 'cancel' },
        { text: language === 'sq-AL' ? 'Fshi' : 'Delete', style: 'destructive', onPress: async () => { await deleteFoodEntry(id); load(); } },
      ],
    );
  }

  const waitDays = daysUntilNextSafe(entries);

  const visible = filter === 'all' ? entries : entries.filter((e) => e.reaction === filter);

  // Stats
  const total   = entries.length;
  const loved   = entries.filter((e) => e.reaction === 'loved').length;
  const allergies = entries.filter((e) => e.reaction === 'allergy').length;

  const L = {
    title:    language === 'sq-AL' ? 'Ushqimet e Para 🌱' : 'First Foods 🌱',
    subtitle: language === 'sq-AL' ? 'Gjurmo çdo ushqim të ri' : 'Track every new food',
    total:    language === 'sq-AL' ? 'provuar' : 'tried',
    loved:    language === 'sq-AL' ? 'dashuri' : 'loved',
    alert:    language === 'sq-AL' ? 'reagim' : 'reaction',
    add:      language === 'sq-AL' ? '+ Shto ushqim' : '+ Add food',
    waitMsg:  waitDays > 0
      ? (language === 'sq-AL'
          ? `⏳ Prit ${waitDays} ${waitDays === 1 ? 'ditë' : 'ditë'} para ushqimit tjetër të ri`
          : `⏳ Wait ${waitDays} more ${waitDays === 1 ? 'day' : 'days'} before introducing next food`)
      : (language === 'sq-AL' ? '✅ Mund të futësh ushqim të ri sot!' : '✅ Safe to introduce a new food today!'),
    empty:    language === 'sq-AL'
      ? 'Ende nuk keni futur asnjë ushqim.\nShtoni ushqimin e parë të bebes!'
      : "No foods tracked yet.\nAdd your baby's first food!",
    daysAgo:  (n: number) => n === 0
      ? (language === 'sq-AL' ? 'Sot' : 'Today')
      : n === 1
        ? (language === 'sq-AL' ? '1 ditë më parë' : '1 day ago')
        : (language === 'sq-AL' ? `${n} ditë më parë` : `${n} days ago`),
  };

  return (
    <>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={s.title}>{L.title}</Text>
            <Text style={s.subtitle}>{L.subtitle}</Text>
          </View>
          <Pressable style={s.addBtn} onPress={() => { setEditing(null); setFormOpen(true); }}>
            <Text style={s.addBtnTxt}>{L.add}</Text>
          </Pressable>
        </View>

        {/* Stats row */}
        {total > 0 && (
          <View style={s.statsRow}>
            <Surface style={s.statCard} elevation={0}>
              <Text style={s.statVal}>{total}</Text>
              <Text style={s.statLbl}>{L.total}</Text>
            </Surface>
            <Surface style={[s.statCard, { backgroundColor: '#CFFFD6' }]} elevation={0}>
              <Text style={s.statVal}>😍 {loved}</Text>
              <Text style={s.statLbl}>{L.loved}</Text>
            </Surface>
            {allergies > 0 && (
              <Surface style={[s.statCard, { backgroundColor: '#FFE9E9' }]} elevation={0}>
                <Text style={s.statVal}>⚠️ {allergies}</Text>
                <Text style={s.statLbl}>{L.alert}</Text>
              </Surface>
            )}
          </View>
        )}

        {/* Wait countdown */}
        {total > 0 && (
          <Surface
            style={[s.waitCard, waitDays > 0 ? s.waitCardActive : s.waitCardSafe]}
            elevation={0}
          >
            <Text style={s.waitTxt}>{L.waitMsg}</Text>
          </Surface>
        )}

        {/* Reaction filter */}
        {total > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterRow}>
            <Pressable
              style={[s.filterChip, filter === 'all' && s.filterChipOn]}
              onPress={() => setFilter('all')}
            >
              <Text style={[s.filterChipTxt, filter === 'all' && s.filterChipTxtOn]}>
                {language === 'sq-AL' ? 'Të gjitha' : 'All'} ({total})
              </Text>
            </Pressable>
            {REACTIONS.map((r) => {
              const count = entries.filter((e) => e.reaction === r).length;
              if (count === 0) return null;
              const rc = REACTION_CONFIG[r];
              return (
                <Pressable
                  key={r}
                  style={[s.filterChip, { backgroundColor: rc.bg }, filter === r && s.filterChipOn]}
                  onPress={() => setFilter(r)}
                >
                  <Text style={[s.filterChipTxt, filter === r && s.filterChipTxtOn]}>
                    {rc.emoji} {count}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        )}

        {/* Empty state */}
        {total === 0 && (
          <View style={s.emptyBlock}>
            <Text style={s.emptyEmoji}>🥕</Text>
            <Text style={s.emptyTxt}>{L.empty}</Text>
            <Pressable style={s.emptyAddBtn} onPress={() => { setEditing(null); setFormOpen(true); }}>
              <Text style={s.emptyAddBtnTxt}>{L.add}</Text>
            </Pressable>
          </View>
        )}

        {/* Timeline */}
        <View style={s.timeline}>
          {visible.map((entry, i) => {
            const rc  = REACTION_CONFIG[entry.reaction];
            const ago = daysSince(entry.dateIntroduced);
            return (
              <View key={entry.id} style={s.timelineItem}>
                {/* Vertical line */}
                {i < visible.length - 1 && <View style={s.timelineLine} />}

                {/* Emoji bubble */}
                <View style={[s.emojiBubble, { backgroundColor: rc.bg }]}>
                  <Text style={s.emojiBubbleTxt}>{entry.emoji}</Text>
                </View>

                {/* Card */}
                <Pressable style={s.entryCard} onPress={() => { setEditing(entry); setFormOpen(true); }}>
                  <View style={s.entryTop}>
                    <Text style={s.entryName}>{entry.foodName}</Text>
                    <View style={[s.reactionBadge, { backgroundColor: rc.bg }]}>
                      <Text style={s.reactionBadgeTxt}>{rc.emoji} {language === 'sq-AL' ? rc.label_sq : rc.label_en}</Text>
                    </View>
                  </View>
                  <View style={s.entryMeta}>
                    <Text style={s.entryDate}>{formatDate(entry.dateIntroduced, language)}</Text>
                    <Text style={s.entrySince}>· {L.daysAgo(ago)}</Text>
                  </View>
                  {entry.notes ? <Text style={s.entryNotes} numberOfLines={2}>{entry.notes}</Text> : null}
                  <Pressable style={s.deleteBtn} onPress={() => handleDelete(entry.id)} hitSlop={8}>
                    <Text style={s.deleteBtnTxt}>✕</Text>
                  </Pressable>
                </Pressable>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Add/Edit form modal */}
      <Modal
        visible={formOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => { setFormOpen(false); setEditing(null); }}
      >
        <ScrollView
          style={s.formScroll}
          contentContainerStyle={s.formScrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <FoodForm
            initial={editing}
            onSave={handleSave}
            onClose={() => { setFormOpen(false); setEditing(null); }}
            language={language}
          />
        </ScrollView>
      </Modal>
    </>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const REACTIONS: FoodReaction[] = ['loved', 'neutral', 'rejected', 'allergy'];

const s = StyleSheet.create({
  scroll: { paddingHorizontal: 18, paddingTop: 8, paddingBottom: 48, gap: 18 },

  header:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  title:     { fontSize: 34, fontWeight: '800', letterSpacing: -1.2, color: '#111111' },
  subtitle:  { fontSize: 14, color: '#6E6560', marginTop: 4 },
  addBtn:    { borderRadius: 20, backgroundColor: '#6ECAC0', paddingHorizontal: 16, paddingVertical: 10, marginTop: 6 },
  addBtnTxt: { fontSize: 14, fontWeight: '800', color: '#FFFFFF' },

  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: { flex: 1, borderRadius: 18, backgroundColor: '#FFFFFF', padding: 14, alignItems: 'center', gap: 4, borderWidth: 1, borderColor: '#F0EDE8' },
  statVal:  { fontSize: 22, fontWeight: '800', color: '#111111' },
  statLbl:  { fontSize: 11, fontWeight: '700', color: '#9E9590', textTransform: 'uppercase' },

  waitCard:       { borderRadius: 18, padding: 16 },
  waitCardActive: { backgroundColor: '#FFF5DC' },
  waitCardSafe:   { backgroundColor: '#EAFFEF' },
  waitTxt:        { fontSize: 15, fontWeight: '700', color: '#333', textAlign: 'center', lineHeight: 22 },

  filterRow:        { gap: 8, paddingVertical: 2 },
  filterChip:       { borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: '#FFFFFFD9' },
  filterChipOn:     { backgroundColor: '#1A1714' },
  filterChipTxt:    { fontSize: 13, fontWeight: '700', color: '#3D3530' },
  filterChipTxtOn:  { color: '#FFFFFF' },

  emptyBlock:     { alignItems: 'center', paddingVertical: 40, gap: 16 },
  emptyEmoji:     { fontSize: 64 },
  emptyTxt:       { fontSize: 16, color: '#6E6560', textAlign: 'center', lineHeight: 24 },
  emptyAddBtn:    { backgroundColor: '#6ECAC0', borderRadius: 20, paddingHorizontal: 28, paddingVertical: 14 },
  emptyAddBtnTxt: { fontSize: 16, fontWeight: '800', color: '#FFFFFF' },

  timeline:     { gap: 0 },
  timelineItem: { flexDirection: 'row', gap: 12, marginBottom: 16, position: 'relative' },
  timelineLine: {
    position: 'absolute', left: 21, top: 44,
    width: 2, bottom: -16, backgroundColor: '#E8E4DF',
  },
  emojiBubble:    { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 },
  emojiBubbleTxt: { fontSize: 24 },

  entryCard:    { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 20, padding: 14, gap: 6, borderWidth: 1, borderColor: '#F0EDE8' },
  entryTop:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  entryName:    { fontSize: 17, fontWeight: '800', color: '#111111', flex: 1 },
  reactionBadge:{ borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  reactionBadgeTxt: { fontSize: 12, fontWeight: '700', color: '#3D3530' },
  entryMeta:    { flexDirection: 'row', gap: 4 },
  entryDate:    { fontSize: 13, color: '#6E6560', fontWeight: '600' },
  entrySince:   { fontSize: 13, color: '#9E9590' },
  entryNotes:   { fontSize: 13, color: '#4A4440', lineHeight: 18 },
  deleteBtn:    { position: 'absolute', top: 10, right: 10, width: 24, height: 24, borderRadius: 12, backgroundColor: '#F0EDE8', alignItems: 'center', justifyContent: 'center' },
  deleteBtnTxt: { fontSize: 11, color: '#6E6560', fontWeight: '800' },

  formScroll:        { flex: 1, backgroundColor: '#FFF9F5' },
  formScrollContent: { paddingBottom: 60 },
});

// ── Form styles ───────────────────────────────────────────────────────────────

const f = StyleSheet.create({
  root:  { padding: 20, gap: 16 },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#D0CBC5', alignSelf: 'center', marginTop: 4, marginBottom: 8 },
  title: { fontSize: 24, fontWeight: '800', color: '#111111', letterSpacing: -0.6 },

  emojiBtn:  { alignItems: 'center', gap: 4, paddingVertical: 8 },
  emojiBig:  { fontSize: 64 },
  emojiHint: { fontSize: 12, color: '#9E9590', fontWeight: '600' },

  emojiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  emojiCell:    { width: 44, height: 44, borderRadius: 12, backgroundColor: '#F0EDE8', alignItems: 'center', justifyContent: 'center' },
  emojiCellOn:  { backgroundColor: '#6ECAC0' },
  emojiCellText:{ fontSize: 24 },

  input:       { borderRadius: 14, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E8E4DF', paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#111111' },
  inputMulti:  { minHeight: 80, textAlignVertical: 'top' },

  reactionRow: { flexDirection: 'row', gap: 8 },
  reactionBtn:    { flex: 1, borderRadius: 14, paddingVertical: 10, alignItems: 'center', gap: 4, borderWidth: 2, borderColor: 'transparent' },
  reactionBtnOn:  { borderColor: '#1A1714' },
  reactionEmoji:  { fontSize: 22 },
  reactionLabel:  { fontSize: 11, fontWeight: '700', color: '#3D3530' },

  fieldLabel: { fontSize: 12, fontWeight: '800', color: '#9E9590', textTransform: 'uppercase', letterSpacing: 0.5 },

  waitRow:      { flexDirection: 'row', gap: 12 },
  waitBtn:      { flex: 1, borderRadius: 14, paddingVertical: 12, alignItems: 'center', backgroundColor: '#F0EDE8' },
  waitBtnOn:    { backgroundColor: '#1A1714' },
  waitBtnTxt:   { fontSize: 14, fontWeight: '800', color: '#3D3530' },
  waitBtnTxtOn: { color: '#FFFFFF' },

  btnRow:      { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelBtn:   { flex: 1, borderRadius: 18, paddingVertical: 16, alignItems: 'center', backgroundColor: '#F0EDE8' },
  cancelBtnTxt:{ fontSize: 15, fontWeight: '700', color: '#6E6560' },
  saveBtn:     { flex: 2, borderRadius: 18, paddingVertical: 16, alignItems: 'center', backgroundColor: '#6ECAC0' },
  saveBtnOff:  { opacity: 0.4 },
  saveBtnTxt:  { fontSize: 15, fontWeight: '800', color: '#FFFFFF' },
});
