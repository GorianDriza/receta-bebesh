import { useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Text } from 'react-native-paper';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = {
  label: string;
  value: string;       // YYYY-MM-DD
  onChange: (v: string) => void;
  language?: string;
};

function toDate(str: string): Date {
  if (!str) return new Date(2024, 0, 1);
  const d = new Date(str);
  return isNaN(d.getTime()) ? new Date(2024, 0, 1) : d;
}

function toYMD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

function formatDisplay(str: string, lang: string): string {
  const d = toDate(str);
  return d.toLocaleDateString(lang === 'sq-AL' ? 'sq-AL' : 'en-US', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

// Inner sheet — needs its own insets hook (runs inside SafeAreaProvider)
function IOSPickerSheet({
  label, value, onChange, language, onClose,
}: Props & { onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState(toDate(value));

  return (
    <View style={[s.iosOverlay, { paddingBottom: 0 }]}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      <View style={[s.iosInner, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <View style={s.iosTitleRow}>
          <Text style={s.iosTitle}>{label}</Text>
          <Pressable
            onPress={() => { onChange(toYMD(draft)); onClose(); }}
            hitSlop={12}
            style={s.iosDoneBtn}
          >
            <Text style={s.iosDone}>
              {language === 'sq-AL' ? 'Gati' : 'Done'}
            </Text>
          </Pressable>
        </View>
        <DateTimePicker
          value={draft}
          mode="date"
          display="spinner"
          maximumDate={new Date()}
          onChange={(_e: DateTimePickerEvent, d?: Date) => { if (d) setDraft(d); }}
          style={s.picker}
        />
      </View>
    </View>
  );
}

export function DatePickerField({ label, value, onChange, language = 'sq-AL' }: Props) {
  const [open, setOpen] = useState(false);
  const isEmpty = !value;

  function handleAndroidChange(_event: DateTimePickerEvent, date?: Date) {
    setOpen(false);
    if (date) onChange(toYMD(date));
  }

  return (
    <>
      <View style={s.field}>
        <Text style={s.fieldLabel}>{label}</Text>
        <Pressable style={s.input} onPress={() => setOpen(true)}>
          <Text style={[s.inputText, isEmpty && s.placeholder]}>
            {isEmpty
              ? (language === 'sq-AL' ? 'Zgjidh datën...' : 'Pick a date...')
              : formatDisplay(value, language)}
          </Text>
          <Text style={s.calIcon}>📅</Text>
        </Pressable>
      </View>

      {/* Android: native dialog rendered inline */}
      {Platform.OS === 'android' && open && (
        <DateTimePicker
          value={toDate(value)}
          mode="date"
          display="default"
          maximumDate={new Date()}
          onChange={handleAndroidChange}
        />
      )}

      {/* iOS: bottom sheet inside its own SafeAreaProvider */}
      {Platform.OS === 'ios' && (
        <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
          <SafeAreaProvider>
            <IOSPickerSheet
              label={label}
              value={value}
              onChange={onChange}
              language={language}
              onClose={() => setOpen(false)}
            />
          </SafeAreaProvider>
        </Modal>
      )}
    </>
  );
}

const s = StyleSheet.create({
  field: { gap: 6 },
  fieldLabel: { fontSize: 14, fontWeight: '700', color: '#4A4044' },
  input: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#F4F1EE', borderRadius: 16,
    paddingHorizontal: 18, paddingVertical: 18,
  },
  inputText: { fontSize: 16, color: '#1A1714', flex: 1 },
  placeholder: { color: '#B0A9A3' },
  calIcon: { fontSize: 18 },

  iosOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: '#00000055' },
  iosInner: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 24, paddingTop: 4,
  },
  iosTitleRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 20, paddingBottom: 4,
  },
  iosTitle: { fontSize: 17, fontWeight: '800', color: '#1A1714' },
  iosDoneBtn: { padding: 4 },
  iosDone: { fontSize: 17, fontWeight: '700', color: '#6ECAC0' },
  picker: { width: '100%' },
});
