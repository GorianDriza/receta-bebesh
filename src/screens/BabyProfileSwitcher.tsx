import { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { IconButton, Surface, Text } from 'react-native-paper';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import {
  addProfile,
  BabyProfile,
  getActiveProfileId,
  getProfiles,
  removeProfile,
  setActiveProfileId,
} from '../lib/babyProfiles';
import { useLanguage } from '../providers/LanguageProvider';

const EMOJIS = ['👶', '🧒', '👼', '🍼', '⭐', '🌈', '🐣', '🦋'];

type Props = {
  visible: boolean;
  onClose: () => void;
  onSwitch: (profile: BabyProfile) => void;
};

export function BabyProfileSwitcher({ visible, onClose, onSwitch }: Props) {
  const { language } = useLanguage();
  const sq = language === 'sq-AL';

  const [profiles, setProfiles]       = useState<BabyProfile[]>([]);
  const [activeId, setActiveId]       = useState<string | null>(null);
  const [adding, setAdding]           = useState(false);
  const [newName, setNewName]         = useState('');
  const [newBirthdate, setNewBirthdate] = useState('');
  const [newEmoji, setNewEmoji]       = useState(EMOJIS[0]);
  const [saving, setSaving]           = useState(false);

  async function load() {
    const [p, a] = await Promise.all([getProfiles(), getActiveProfileId()]);
    setProfiles(p);
    setActiveId(a ?? p[0]?.id ?? null);
  }

  useEffect(() => { if (visible) load(); }, [visible]);

  async function handleSelect(p: BabyProfile) {
    await setActiveProfileId(p.id);
    setActiveId(p.id);
    onSwitch(p);
    onClose();
  }

  async function handleAdd() {
    if (!newName.trim() || !newBirthdate.trim()) return;
    setSaving(true);
    const p = await addProfile({ name: newName.trim(), birthdate: newBirthdate.trim(), emoji: newEmoji });
    await load();
    setAdding(false);
    setNewName('');
    setNewBirthdate('');
    setNewEmoji(EMOJIS[0]);
    setSaving(false);
    await handleSelect(p);
  }

  async function handleRemove(id: string) {
    Alert.alert(
      sq ? 'Fshi profilin' : 'Delete profile',
      sq ? 'Jeni i sigurt?' : 'Are you sure?',
      [
        { text: sq ? 'Anulo' : 'Cancel', style: 'cancel' },
        {
          text: sq ? 'Fshi' : 'Delete',
          style: 'destructive',
          onPress: async () => {
            await removeProfile(id);
            await load();
          },
        },
      ],
    );
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaProvider>
        <SafeAreaView style={s.root}>
          <View style={s.header}>
            <Text style={s.title}>{sq ? 'Profile Bebe' : 'Baby Profiles'}</Text>
            <IconButton icon="close" size={22} iconColor="#111" onPress={onClose} style={s.icon0} />
          </View>

          <ScrollView contentContainerStyle={s.scroll}>
            {profiles.map((p) => {
              const isActive = p.id === activeId;
              const age = (() => {
                const birth = new Date(p.birthdate);
                const now = new Date();
                const months =
                  (now.getFullYear() - birth.getFullYear()) * 12 +
                  (now.getMonth() - birth.getMonth());
                if (months < 12) return `${months}m`;
                const y = Math.floor(months / 12);
                const m = months % 12;
                return m > 0 ? `${y}v ${m}m` : `${y}v`;
              })();
              return (
                <Pressable key={p.id} onPress={() => handleSelect(p)}>
                  <Surface style={[s.card, isActive && s.cardActive]} elevation={0}>
                    <View style={[s.emojiCircle, isActive && s.emojiCircleActive]}>
                      <Text style={s.emojiText}>{p.emoji ?? '👶'}</Text>
                    </View>
                    <View style={s.info}>
                      <Text style={[s.name, isActive && s.nameActive]}>{p.name}</Text>
                      <Text style={s.age}>{age}</Text>
                    </View>
                    <View style={s.cardRight}>
                      {isActive && <View style={s.activeDot} />}
                      {profiles.length > 1 && (
                        <Pressable
                          onPress={(e) => { e.stopPropagation(); handleRemove(p.id); }}
                          hitSlop={8}
                        >
                          <Text style={s.deleteBtn}>✕</Text>
                        </Pressable>
                      )}
                    </View>
                  </Surface>
                </Pressable>
              );
            })}

            {adding ? (
              <Surface style={s.addForm} elevation={0}>
                <Text style={s.addFormTitle}>{sq ? 'Profil i Ri' : 'New Profile'}</Text>

                <View style={s.emojiRow}>
                  {EMOJIS.map((e) => (
                    <Pressable
                      key={e}
                      style={[s.emojiOption, newEmoji === e && s.emojiOptionSelected]}
                      onPress={() => setNewEmoji(e)}
                    >
                      <Text style={s.emojiOptionText}>{e}</Text>
                    </Pressable>
                  ))}
                </View>

                <TextInput
                  style={s.input}
                  placeholder={sq ? 'Emri i bebës' : "Baby's name"}
                  placeholderTextColor="#B0ABB8"
                  value={newName}
                  onChangeText={setNewName}
                />
                <TextInput
                  style={s.input}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#B0ABB8"
                  value={newBirthdate}
                  onChangeText={setNewBirthdate}
                  keyboardType="numbers-and-punctuation"
                />

                <View style={s.addFormBtns}>
                  <Pressable style={s.cancelBtn} onPress={() => setAdding(false)}>
                    <Text style={s.cancelBtnText}>{sq ? 'Anulo' : 'Cancel'}</Text>
                  </Pressable>
                  <Pressable
                    style={[s.saveBtn, (!newName.trim() || !newBirthdate.trim()) && s.saveBtnDisabled]}
                    onPress={handleAdd}
                    disabled={saving || !newName.trim() || !newBirthdate.trim()}
                  >
                    <Text style={s.saveBtnText}>{saving ? '…' : (sq ? 'Shto' : 'Add')}</Text>
                  </Pressable>
                </View>
              </Surface>
            ) : (
              profiles.length < 5 && (
                <Pressable style={s.addBtn} onPress={() => setAdding(true)}>
                  <Text style={s.addBtnText}>+ {sq ? 'Shto profil' : 'Add profile'}</Text>
                </Pressable>
              )
            )}
          </ScrollView>
        </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F0FF' },
  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 8,
  },
  title: { fontSize: 24, fontWeight: '800', color: '#111' },
  icon0: { margin: 0 },
  scroll: { padding: 18, gap: 12 },

  card: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: '#FEFEFE', borderRadius: 22, padding: 16,
    borderWidth: 2, borderColor: 'transparent',
  },
  cardActive: { borderColor: '#7C5CBF', backgroundColor: '#F5F0FF' },
  emojiCircle: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: '#F0EDE8', alignItems: 'center', justifyContent: 'center',
  },
  emojiCircleActive: { backgroundColor: '#EDE5FF' },
  emojiText: { fontSize: 26 },
  info: { flex: 1 },
  name: { fontSize: 18, fontWeight: '700', color: '#111' },
  nameActive: { color: '#6A42D8' },
  age: { fontSize: 13, color: '#8E8A95', marginTop: 2 },
  cardRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  activeDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#6A42D8' },
  deleteBtn: { fontSize: 16, color: '#D0CBDB', fontWeight: '700' },

  addForm: {
    backgroundColor: '#FEFEFE', borderRadius: 22, padding: 18, gap: 12,
  },
  addFormTitle: { fontSize: 18, fontWeight: '800', color: '#111' },
  emojiRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  emojiOption: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#F0EDE8', alignItems: 'center', justifyContent: 'center',
  },
  emojiOptionSelected: { backgroundColor: '#EDE5FF', borderWidth: 2, borderColor: '#7C5CBF' },
  emojiOptionText: { fontSize: 22 },
  input: {
    borderWidth: 1.5, borderColor: '#E8E5F0', borderRadius: 14,
    padding: 12, fontSize: 15, color: '#111',
  },
  addFormBtns: { flexDirection: 'row', gap: 10 },
  cancelBtn: {
    flex: 1, borderRadius: 14, paddingVertical: 12,
    backgroundColor: '#F0EDE8', alignItems: 'center',
  },
  cancelBtnText: { fontSize: 15, fontWeight: '700', color: '#6E6560' },
  saveBtn: {
    flex: 1, borderRadius: 14, paddingVertical: 12,
    backgroundColor: '#6A42D8', alignItems: 'center',
  },
  saveBtnDisabled: { backgroundColor: '#C8BFEE' },
  saveBtnText: { fontSize: 15, fontWeight: '700', color: '#FFF' },

  addBtn: {
    borderRadius: 18, paddingVertical: 16,
    backgroundColor: '#FEFEFE',
    alignItems: 'center',
    borderWidth: 2, borderColor: '#E8E5F0', borderStyle: 'dashed',
  },
  addBtnText: { fontSize: 16, fontWeight: '700', color: '#6A42D8' },
});
