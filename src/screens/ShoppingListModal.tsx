import { useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { IconButton, Text } from 'react-native-paper';

import { AppLanguage } from '../i18n/translations';
import {
  addShoppingItem,
  clearCheckedItems,
  getShoppingList,
  removeShoppingItem,
  ShoppingItem,
  toggleShoppingItem,
} from '../lib/shoppingList';
import { useLanguage } from '../providers/LanguageProvider';

const L: Record<AppLanguage, {
  title: string;
  empty: string;
  clearChecked: string;
  clearAll: string;
  addPlaceholder: string;
}> = {
  'sq-AL': {
    title: 'Lista e Blerjes',
    empty: 'Lista është bosh. Shtoni përbërës nga recetat.',
    clearChecked: 'Fshi të kontrolluarat',
    clearAll: 'Fshi të gjitha',
    addPlaceholder: 'Shto artikull...',
  },
  en: {
    title: 'Shopping List',
    empty: 'Your list is empty. Tap ingredients in any recipe to add them.',
    clearChecked: 'Clear checked',
    clearAll: 'Clear all',
    addPlaceholder: 'Add item...',
  },
};

type Props = { visible: boolean; onClose: () => void };

export function ShoppingListModal({ visible, onClose }: Props) {
  const { language } = useLanguage();
  const labels = L[language];

  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [newItem, setNewItem] = useState('');
  const inputRef = useRef<TextInput>(null);

  const load = useCallback(async () => {
    setItems(await getShoppingList());
  }, []);

  useEffect(() => {
    if (visible) load();
  }, [visible, load]);

  async function handleToggle(id: string) {
    await toggleShoppingItem(id);
    await load();
  }

  async function handleRemove(id: string) {
    await removeShoppingItem(id);
    await load();
  }

  async function handleClearChecked() {
    await clearCheckedItems();
    await load();
  }

  async function handleAddItem() {
    const text = newItem.trim();
    if (!text) return;
    await addShoppingItem(text);
    setNewItem('');
    await load();
  }

  const unchecked = items.filter((i) => !i.checked);
  const checked   = items.filter((i) => i.checked);
  const hasChecked = checked.length > 0;

  function renderItem({ item }: { item: ShoppingItem }) {
    return (
      <Pressable style={s.row} onPress={() => handleToggle(item.id)}>
        <View style={[s.checkbox, item.checked && s.checkboxChecked]}>
          {item.checked && <Text style={s.checkmark}>✓</Text>}
        </View>
        <Text style={[s.rowText, item.checked && s.rowTextDone]}>{item.text}</Text>
        <Pressable hitSlop={12} onPress={() => handleRemove(item.id)}>
          <Text style={s.removeX}>×</Text>
        </Pressable>
      </Pressable>
    );
  }

  const allItems: ShoppingItem[] = [
    ...unchecked,
    ...(checked.length > 0 ? [{ id: '__divider__', text: '', checked: false, addedAt: 0 }] : []),
    ...checked,
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaProvider>
        <SafeAreaView style={s.root}>
          {/* Header */}
          <View style={s.header}>
            <Text style={s.title}>{labels.title}</Text>
            <IconButton icon="close" size={22} iconColor="#1A1714" style={s.icon0} onPress={onClose} />
          </View>

          {/* Add item input */}
          <View style={s.addRow}>
            <TextInput
              ref={inputRef}
              style={s.addInput}
              value={newItem}
              onChangeText={setNewItem}
              placeholder={labels.addPlaceholder}
              placeholderTextColor="#B0ABB8"
              onSubmitEditing={handleAddItem}
              returnKeyType="done"
            />
            <Pressable
              style={[s.addBtn, !newItem.trim() && s.addBtnDisabled]}
              onPress={handleAddItem}
              disabled={!newItem.trim()}
            >
              <Text style={s.addBtnText}>+</Text>
            </Pressable>
          </View>

          {items.length === 0 ? (
            <View style={s.empty}>
              <Text style={s.emptyIcon}>🛒</Text>
              <Text style={s.emptyText}>{labels.empty}</Text>
            </View>
          ) : (
            <FlatList
              data={allItems}
              keyExtractor={(item) => item.id}
              contentContainerStyle={s.list}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                if (item.id === '__divider__') {
                  return <View style={s.divider} />;
                }
                return renderItem({ item });
              }}
            />
          )}

          {hasChecked && (
            <View style={s.footer}>
              <Pressable style={s.clearBtn} onPress={handleClearChecked}>
                <Text style={s.clearBtnLabel}>{labels.clearChecked} ({checked.length})</Text>
              </Pressable>
            </View>
          )}
        </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FEFEFF' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0EEF5',
  },
  title: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5, color: '#1A1714' },
  icon0: { margin: 0 },
  list: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 32 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F3FA',
  },
  checkbox: {
    width: 24, height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#C4BFD8',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  checkboxChecked: { backgroundColor: '#6ECAC0', borderColor: '#6ECAC0' },
  checkmark: { fontSize: 14, color: '#FFFFFF', fontWeight: '800', lineHeight: 17 },
  rowText: { flex: 1, fontSize: 15, lineHeight: 22, color: '#1A1714' },
  rowTextDone: { color: '#AAA', textDecorationLine: 'line-through' },
  removeX: { fontSize: 22, color: '#C4BFD8', fontWeight: '300', lineHeight: 24 },
  divider: { height: 12 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, gap: 12 },
  emptyIcon: { fontSize: 56 },
  emptyText: { fontSize: 15, lineHeight: 22, color: '#9E99B2', textAlign: 'center' },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0EEF5',
  },
  clearBtn: {
    backgroundColor: '#F5F3FA',
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
  },
  clearBtnLabel: { fontSize: 15, fontWeight: '700', color: '#6E6580' },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0EEF5',
  },
  addInput: {
    flex: 1,
    height: 44,
    backgroundColor: '#F5F3FA',
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 15,
    color: '#1A1714',
  },
  addBtn: {
    width: 44, height: 44,
    borderRadius: 12,
    backgroundColor: '#6ECAC0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnDisabled: { opacity: 0.35 },
  addBtnText: { fontSize: 26, fontWeight: '300', color: '#FFFFFF', lineHeight: 32 },
});
