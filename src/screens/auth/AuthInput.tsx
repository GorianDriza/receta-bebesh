import { ReactNode } from 'react';
import { KeyboardTypeOptions, StyleSheet, TextInput, View } from 'react-native';

type AutoCapitalize = 'none' | 'sentences' | 'words' | 'characters';
import { Text } from 'react-native-paper';

type Props = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: AutoCapitalize;
  autoComplete?: any;
  right?: ReactNode;
  helperText?: string;
};

export function AuthInput({
  label,
  value,
  onChangeText,
  secureTextEntry,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  autoComplete,
  right,
  helperText,
}: Props) {
  return (
    <View style={s.wrap}>
      <Text style={s.label}>{label}</Text>
      <View style={s.row}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoComplete={autoComplete}
          style={s.input}
          placeholderTextColor="#B0A9A3"
        />
        {right != null && <View style={s.rightSlot}>{right}</View>}
      </View>
      {helperText != null && <Text style={s.helper}>{helperText}</Text>}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { gap: 6 },
  label: { fontSize: 14, fontWeight: '700', color: '#3D3530' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F5F2',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#EDE8E3',
    paddingHorizontal: 16,
  },
  input: {
    flex: 1,
    height: 52,
    fontSize: 16,
    color: '#1A1714',
  },
  rightSlot: { paddingLeft: 8, justifyContent: 'center' },
  helper: { fontSize: 12, color: '#9E9590', marginLeft: 4 },
});
