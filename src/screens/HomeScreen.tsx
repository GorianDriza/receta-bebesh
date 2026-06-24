import { useMemo, useState } from 'react';
import { Linking, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Avatar,
  Button,
  Card,
  Chip,
  Searchbar,
  SegmentedButtons,
  Surface,
  Text,
} from 'react-native-paper';

import { isFirebaseConfigured, missingFirebaseKeys } from '../lib/firebase';

type Recipe = {
  id: string;
  title: string;
  category: 'Purees' | 'Finger Food' | 'Batch Prep';
  stage: '6-8m' | '9-12m';
  ageLabel: string;
  prepTime: string;
  note: string;
  icon: string;
};

const recipes: Recipe[] = [
  {
    id: 'sweet-potato',
    title: 'Sweet Potato and Pear Mash',
    category: 'Purees',
    stage: '6-8m',
    ageLabel: 'Stage 1',
    prepTime: '15 min',
    note: 'Smooth starter puree with mild sweetness.',
    icon: 'food-apple',
  },
  {
    id: 'broccoli-bites',
    title: 'Broccoli Oat Bites',
    category: 'Finger Food',
    stage: '9-12m',
    ageLabel: 'Stage 2',
    prepTime: '22 min',
    note: 'Soft baked bites for self-feeding practice.',
    icon: 'silverware-fork-knife',
  },
  {
    id: 'lentil-batch',
    title: 'Red Lentil Veggie Base',
    category: 'Batch Prep',
    stage: '6-8m',
    ageLabel: 'Freezer',
    prepTime: '28 min',
    note: 'Protein-rich base that can be portioned for the week.',
    icon: 'food-drumstick-outline',
  },
];

const categories = ['All', 'Purees', 'Finger Food', 'Batch Prep'] as const;
const stages = ['all', '6-8m', '9-12m'] as const;

export function HomeScreen() {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] =
    useState<(typeof categories)[number]>('All');
  const [selectedStage, setSelectedStage] =
    useState<(typeof stages)[number]>('all');

  const filteredRecipes = useMemo(() => {
    return recipes.filter((recipe) => {
      const matchesQuery =
        query.trim().length === 0 ||
        recipe.title.toLowerCase().includes(query.trim().toLowerCase()) ||
        recipe.note.toLowerCase().includes(query.trim().toLowerCase());
      const matchesCategory =
        selectedCategory === 'All' || recipe.category === selectedCategory;
      const matchesStage =
        selectedStage === 'all' || recipe.stage === selectedStage;

      return matchesQuery && matchesCategory && matchesStage;
    });
  }, [query, selectedCategory, selectedStage]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <View style={styles.heroCopy}>
            <Text variant="headlineMedium" style={styles.heroTitle}>
              Receta Bebesh
            </Text>
            <Text variant="bodyLarge" style={styles.heroSubtitle}>
              Expo, Firebase, TypeScript, and a clean Paper UI starter for a
              mobile recipe app.
            </Text>
          </View>

          <Button
            mode="contained-tonal"
            icon="firebase"
            onPress={() => {
              void Linking.openURL('https://console.firebase.google.com/');
            }}
          >
            Firebase Console
          </Button>
        </View>

        <Searchbar
          placeholder="Search starter recipes"
          value={query}
          onChangeText={setQuery}
          style={styles.searchbar}
        />

        <View style={styles.chipRow}>
          {categories.map((category) => (
            <Chip
              key={category}
              selected={selectedCategory === category}
              onPress={() => setSelectedCategory(category)}
              compact
              style={styles.chip}
            >
              {category}
            </Chip>
          ))}
        </View>

        <SegmentedButtons
          value={selectedStage}
          onValueChange={(value) =>
            setSelectedStage(value as (typeof stages)[number])
          }
          buttons={[
            { value: 'all', label: 'All stages' },
            { value: '6-8m', label: '6-8m' },
            { value: '9-12m', label: '9-12m' },
          ]}
          style={styles.segmentedButtons}
        />

        <Surface style={styles.statusPanel} elevation={1}>
          <View style={styles.statusHeader}>
            <Avatar.Icon
              size={42}
              icon={
                isFirebaseConfigured
                  ? 'cloud-check-outline'
                  : 'cloud-alert-outline'
              }
            />

            <View style={styles.statusCopy}>
              <Text variant="titleMedium">Firebase setup</Text>
              <Text variant="bodyMedium" style={styles.statusText}>
                {isFirebaseConfigured
                  ? 'Config detected. You can start wiring auth, Firestore, and storage.'
                  : 'Add your EXPO_PUBLIC_FIREBASE_* keys to .env and restart Expo.'}
              </Text>
            </View>
          </View>

          {!isFirebaseConfigured ? (
            <Text variant="bodySmall" style={styles.missingKeys}>
              Missing: {missingFirebaseKeys.join(', ')}
            </Text>
          ) : null}
        </Surface>

        <View style={styles.sectionHeader}>
          <Text variant="titleLarge">Starter recipes</Text>
          <Text variant="bodyMedium" style={styles.sectionCopy}>
            Static sample content for the first screen while Firebase data is
            still being connected.
          </Text>
        </View>

        <View style={styles.cards}>
          {filteredRecipes.map((recipe) => (
            <Card key={recipe.id} mode="contained" style={styles.card}>
              <Card.Title
                title={recipe.title}
                subtitle={`${recipe.category} - ${recipe.ageLabel}`}
                left={(props) => <Avatar.Icon {...props} icon={recipe.icon} />}
              />
              <Card.Content>
                <Text variant="bodyMedium" style={styles.cardNote}>
                  {recipe.note}
                </Text>
                <Text variant="bodySmall" style={styles.cardMeta}>
                  Prep time: {recipe.prepTime}
                </Text>
              </Card.Content>
            </Card>
          ))}

          {filteredRecipes.length === 0 ? (
            <Surface style={styles.emptyState} elevation={0}>
              <Text variant="titleMedium">No recipes match the current filters.</Text>
              <Text variant="bodyMedium" style={styles.sectionCopy}>
                Clear the search or switch categories to see the sample list.
              </Text>
            </Surface>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F4F6F3',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 32,
    gap: 18,
  },
  hero: {
    gap: 16,
  },
  heroCopy: {
    gap: 8,
  },
  heroTitle: {
    color: '#1A1C19',
  },
  heroSubtitle: {
    color: '#596057',
    lineHeight: 24,
  },
  searchbar: {
    borderRadius: 8,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderRadius: 8,
  },
  segmentedButtons: {
    minHeight: 40,
  },
  statusPanel: {
    borderRadius: 8,
    padding: 16,
    gap: 12,
    backgroundColor: '#FFFFFF',
  },
  statusHeader: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  statusCopy: {
    flex: 1,
    gap: 4,
  },
  statusText: {
    color: '#596057',
    lineHeight: 20,
  },
  missingKeys: {
    color: '#7A3124',
    lineHeight: 18,
  },
  sectionHeader: {
    gap: 4,
  },
  sectionCopy: {
    color: '#596057',
    lineHeight: 20,
  },
  cards: {
    gap: 12,
  },
  card: {
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  cardNote: {
    color: '#28302A',
    lineHeight: 20,
    marginBottom: 8,
  },
  cardMeta: {
    color: '#596057',
  },
  emptyState: {
    borderRadius: 8,
    padding: 16,
    backgroundColor: '#E9EEE8',
  },
});
