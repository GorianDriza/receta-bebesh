import { useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

type Props = {
  label: string;
  value: string;       // YYYY-MM-DD
  onChange: (v: string) => void;
  language?: string;
};

function toDate(str: string): Date {
  const d = new Date(str);
  return isNaN(d.getTime()) ? new Date() : d;
}

function toYMD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

function formatDisplay(str: string, lang: string): string {
  const d = toDate(str);
  if (!str) return lang === 'sq-AL' ? 'Zgjidh datën' : 'Pick a date';
  return d.toLocaleDateString(lang === 'sq-AL' ? 'sq-AL' : 'en-US', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

export function DatePickerField({ label, value, onChange, language = 'sq-AL' }: Props) {
  const [open, setOpen] = useState(false);
  const current = toDate(value);

  function handleChange(_event: DateTimePickerEvent, date?: Date) {
    if (Platform.OS === 'android') {
      setOpen(false);
      if (date) onChange(toYMD(date));
    } else {
      if (date) onChange(toYMD(date));
    }
  }

  const isEmpty = !value;

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

      {/* Android: inline show/hide */}
      {Platform.OS === 'android' && open && (
        <DateTimePicker
          value={current}
          mode="date"
          display="default"
          maximumDate={new Date()}
          onChange={handleChange}
        />
      )}

      {/* iOS: bottom sheet modal */}
      {Platform.OS === 'ios' && (
        <Modal visible={open} transparent animationType="slide">
          <SafeAreaView style={s.iosSheet} edges={['bottom']}>
            <View style={s.iosInner}>
              <View style={s.iosTitleRow}>
                <Text style={s.iosTitle}>{label}</Text>
                <Pressable onPress={() => setOpen(false)} hitSlop={12} style={s.iosDoneBtn}>
                  <Text style={s.iosDone}>
                    {language === 'sq-AL' ? 'Gati' : 'Done'}
                  </Text>
                </Pressable>
              </View>
              <DateTimePicker
                value={current}
                mode="date"
                display="spinner"
                maximumDate={new Date()}
                onChange={handleChange}
                style={s.picker}
              />
            </View>
          </SafeAreaView>
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

  // iOS sheet
  iosSheet: { flex: 1, justifyContent: 'flex-end', backgroundColor: '#00000055' },
  iosInner: {
    backgroundColor: '#FFFFFF', borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 24, paddingBottom: 16,
  },
  iosTitleRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 20, paddingBottom: 8,
  },
  iosTitle: { fontSize: 17, fontWeight: '800', color: '#1A1714' },
  iosDoneBtn: { padding: 4 },
  iosDone: { fontSize: 17, fontWeight: '700', color: '#6ECAC0' },
  picker: { width: '100%' },
});
