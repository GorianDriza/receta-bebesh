import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  Share,
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
  addPlaceholder: string;
  checked: string;
  shareTitle: string;
}> = {
  'sq-AL': {
    title: 'Lista e Blerjes',
    empty: 'Lista është bosh. Shtoni përbërës nga recetat.',
    clearChecked: 'Fshi të kontrolluarat',
    addPlaceholder: 'Shto artikull...',
    checked: 'Të kontrolluarat',
    shareTitle: 'Lista e Blerjes - Receta Bebesh',
  },
  en: {
    title: 'Shopping List',
    empty: 'Your list is empty. Tap ingredients in any recipe to add them.',
    clearChecked: 'Clear checked',
    addPlaceholder: 'Add item...',
    checked: 'Checked',
    shareTitle: 'Shopping List - Receta Bebesh',
  },
};

type Category = { id: string; emoji: string; sq: string; en: string };

const CATEGORIES: Category[] = [
  { id: 'produce',  emoji: '🥬', sq: 'Perime & Fruta', en: 'Produce' },
  { id: 'dairy',    emoji: '🥛', sq: 'Bulmet',         en: 'Dairy'   },
  { id: 'protein',  emoji: '🍗', sq: 'Proteinë',       en: 'Protein' },
  { id: 'grains',   emoji: '🌾', sq: 'Drithëra',       en: 'Grains'  },
  { id: 'pantry',   emoji: '🫙', sq: 'Pantrë',         en: 'Pantry'  },
  { id: 'other',    emoji: '📦', sq: 'Tjetër',         en: 'Other'   },
];

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  produce: [
    'tomato', 'domate', 'apple', 'moll', 'banana', 'carrot', 'karot', 'potato', 'patate',
    'zucchini', 'kungull', 'spinach', 'spinaq', 'broccoli', 'brokol', 'cauliflower', 'lulelak',
    'avocado', 'cucumber', 'trangull', 'onion', 'qep', 'garlic', 'hudh', 'kale', 'pear', 'dardhë',
    'mango', 'peach', 'pjeshk', 'plum', 'kumbull', 'pea', 'bizele', 'lemon', 'limon', 'lime',
    'orange', 'portokall', 'strawberry', 'luleshtrydhe', 'berry', 'blueberry', 'mjedër', 'kiwi',
    'grape', 'rrush', 'celery', 'selino', 'beet', 'panxhar', 'pepper', 'speca', 'pumpkin',
    'squash', 'leek', 'presh', 'eggplant', 'patellxhan', 'fennel', 'merak', 'vegetabl',
    'sweet potato', 'lettuce', 'marule', 'corn', 'misër', 'mushroom', 'kerpudhe', 'fruit',
    'frut', 'pemë', 'perim', 'artichoke', 'asparagus',
  ],
  dairy: [
    'milk', 'qumësht', 'yogurt', 'kos', 'cheese', 'djath', 'butter', 'gjalpë', 'cream', 'krem',
    'ricotta', 'parmesan', 'cheddar', 'mozzarella', 'feta', 'whey', 'formula', 'cottage',
    'dairy', 'bulmet', 'ghee', 'lactose',
  ],
  protein: [
    'chicken', 'pulë', 'beef', 'viç', 'meat', 'mish', 'fish', 'peshk', 'salmon', 'tuna',
    'sardine', 'cod', 'merluci', 'egg', 'vezë', 'tofu', 'lentil', 'thjerrëz', 'chickpea', 'qiqër',
    'turkey', 'gjel', 'lamb', 'qingj', 'pork', 'derri', 'ham', 'proshutë', 'liver', 'mëlçi',
    'shrimp', 'prawn', 'legum', 'bean', 'fasule', 'protein', 'proteinë',
  ],
  grains: [
    'rice', 'oriz', 'pasta', 'oat', 'tërshërë', 'flour', 'miell', 'bread', 'bukë', 'cereal',
    'quinoa', 'barley', 'elb', 'semolina', 'bollgur', 'couscous', 'noodle', 'spaghetti',
    'macaroni', 'polenta', 'wheat', 'grurë', 'cracker', 'tortilla', 'pita', 'grain', 'drithë',
    'muffin', 'pancake', 'drithëra',
  ],
  pantry: [
    'oil', 'vaj', 'olive', 'ulliri', 'vinegar', 'uthull', 'sauce', 'salcë', 'honey', 'mjalt',
    'sugar', 'sheqer', 'salt', 'kripë', 'cinnamon', 'kanellë', 'cumin', 'qimnon', 'spice',
    'erëz', 'herb', 'thyme', 'trumzë', 'rosemary', 'rozmarinë', 'oregano', 'basil', 'borzilok',
    'parsley', 'majdanoz', 'mint', 'nenexhek', 'ginger', 'xhenxhefil', 'turmeric', 'kurkumë',
    'paprika', 'curry', 'vanilla', 'vanilj', 'baking', 'yeast', 'maja', 'stock', 'broth', 'supë',
    'jam', 'reçel', 'syrup', 'shurup', 'mustard', 'ketchup', 'mayo', 'extract', 'powder', 'pluhur',
    'cocoa', 'kakao', 'chocolate', 'çokollatë', 'nut', 'arr', 'almond', 'badam', 'walnut', 'lajthia',
    'peanut', 'kikirik', 'sesame', 'susam',
  ],
};

function categorize(text: string): string {
  const norm = text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  for (const [catId, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const kw of keywords) {
      const normKw = kw.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
      if (norm.includes(normKw)) return catId;
    }
  }
  return 'other';
}

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

  async function handleShare() {
    const lines: string[] = [labels.shareTitle, ''];
    const groups: Array<{ cat: Category; items: ShoppingItem[] }> = CATEGORIES
      .map((cat) => ({
        cat,
        items: unchecked.filter((item) => categorize(item.text) === cat.id),
      }))
      .filter((g) => g.items.length > 0);
    for (const { cat, items: catItems } of groups) {
      lines.push(`${cat.emoji} ${language === 'sq-AL' ? cat.sq : cat.en}`);
      for (const item of catItems) lines.push(`• ${item.text}`);
      lines.push('');
    }
    if (checked.length > 0) {
      lines.push(`✓ ${labels.checked}`);
      for (const item of checked) lines.push(`• ${item.text}`);
    }
    try {
      await Share.share({ message: lines.join('\n').trim() });
    } catch {}
  }

  const unchecked = items.filter((i) => !i.checked);
  const checked   = items.filter((i) => i.checked);
  const hasChecked = checked.length > 0;

  // Group unchecked items by category, preserving only non-empty groups
  const groups: Array<{ cat: Category; items: ShoppingItem[] }> = CATEGORIES
    .map((cat) => ({
      cat,
      items: unchecked.filter((item) => categorize(item.text) === cat.id),
    }))
    .filter((g) => g.items.length > 0);

  function renderItem(item: ShoppingItem) {
    return (
      <Pressable key={item.id} style={s.row} onPress={() => handleToggle(item.id)}>
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
            {items.length > 0 && (
              <IconButton icon="share-variant-outline" size={20} iconColor="#6E6580" style={s.icon0} onPress={handleShare} />
            )}
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
            <ScrollView
              contentContainerStyle={s.list}
              showsVerticalScrollIndicator={false}
            >
              {/* Grouped unchecked items */}
              {groups.map(({ cat, items: catItems }) => (
                <View key={cat.id} style={s.section}>
                  <View style={s.sectionHeader}>
                    <Text style={s.sectionEmoji}>{cat.emoji}</Text>
                    <Text style={s.sectionLabel}>
                      {language === 'sq-AL' ? cat.sq : cat.en}
                    </Text>
                    <Text style={s.sectionCount}>{catItems.length}</Text>
                  </View>
                  {catItems.map((item) => renderItem(item))}
                </View>
              ))}

              {/* Flat checked section */}
              {hasChecked && (
                <View style={s.section}>
                  <View style={s.sectionHeader}>
                    <Text style={s.sectionEmoji}>✓</Text>
                    <Text style={[s.sectionLabel, s.sectionLabelDone]}>{labels.checked}</Text>
                    <Text style={s.sectionCount}>{checked.length}</Text>
                  </View>
                  {checked.map((item) => renderItem(item))}
                </View>
              )}
            </ScrollView>
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
  list: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 32, gap: 4 },
  section: { marginBottom: 8 },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingTop: 12, paddingBottom: 4, paddingHorizontal: 4,
  },
  sectionEmoji: { fontSize: 16 },
  sectionLabel: { fontSize: 13, fontWeight: '800', color: '#6E6580', textTransform: 'uppercase', letterSpacing: 0.5, flex: 1 },
  sectionLabelDone: { color: '#B0ABB8' },
  sectionCount: { fontSize: 12, fontWeight: '700', color: '#B0ABB8' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 13,
    paddingHorizontal: 4,
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
