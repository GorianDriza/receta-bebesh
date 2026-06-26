import { useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import DateTimePicker, {
  DateTimePickerAndroid,
  DateTimePickerChangeEvent,
} from '@react-native-community/datetimepicker';
import { Text } from 'react-native-paper';

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
  return toDate(str).toLocaleDateString(lang === 'sq-AL' ? 'sq-AL' : 'en-US', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

export function DatePickerField({ label, value, onChange, language = 'sq-AL' }: Props) {
  const [open, setOpen] = useState(false);
  const isEmpty = !value;
  const doneLabel = language === 'sq-AL' ? 'Gati ✓' : 'Done ✓';

  function handleValueChange(_event: DateTimePickerChangeEvent, date: Date) {
    onChange(toYMD(date));
  }

  function openPicker() {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: toDate(value),
        mode: 'date',
        display: 'default',
        maximumDate: new Date(),
        onValueChange: handleValueChange,
      });
      return;
    }

    setOpen((v) => !v);
  }

  return (
    <View style={s.wrapper}>
      <Text style={s.fieldLabel}>{label}</Text>

      <Pressable style={s.input} onPress={openPicker}>
        <Text style={[s.inputText, isEmpty && s.placeholder]}>
          {isEmpty
            ? (language === 'sq-AL' ? 'Zgjidh datën...' : 'Pick a date...')
            : formatDisplay(value, language)}
        </Text>
        <Text style={s.calIcon}>{open ? '🔼' : '📅'}</Text>
      </Pressable>

      {/* iOS: inline spinner below field */}
      {Platform.OS === 'ios' && open && (
        <View style={s.iosInline}>
          <DateTimePicker
            value={toDate(value)}
            mode="date"
            display="spinner"
            maximumDate={new Date()}
            onValueChange={handleValueChange}
            style={s.picker}
            textColor="#1A1714"
            locale={language === 'sq-AL' ? 'sq' : 'en'}
          />
          <Pressable style={s.doneBtn} onPress={() => setOpen(false)}>
            <Text style={s.doneBtnLabel}>{doneLabel}</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  wrapper: { gap: 6 },
  fieldLabel: { fontSize: 14, fontWeight: '700', color: '#4A4044' },
  input: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#F4F1EE', borderRadius: 16,
    paddingHorizontal: 18, paddingVertical: 18,
  },
  inputText: { fontSize: 16, color: '#1A1714', flex: 1 },
  placeholder: { color: '#B0A9A3' },
  calIcon: { fontSize: 18 },

  iosInline: {
    backgroundColor: '#F4F1EE',
    borderRadius: 16,
    overflow: 'hidden',
  },
  picker: { width: '100%', height: 200 },
  doneBtn: {
    backgroundColor: '#6ECAC0', marginHorizontal: 16, marginBottom: 14,
    borderRadius: 999, paddingVertical: 13, alignItems: 'center',
  },
  doneBtnLabel: { fontSize: 15, fontWeight: '800', color: '#FFFFFF' },
});
