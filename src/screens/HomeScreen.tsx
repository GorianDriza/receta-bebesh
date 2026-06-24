import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconButton, Surface } from 'react-native-paper';

import { JournalContent } from './JournalContent';
import { LearningContent } from './LearningContent';
import { MealPlanContent } from './MealPlanContent';

type TabId = 'meals' | 'planner' | 'spark' | 'journal' | 'learn';

const TABS: Array<{ id: TabId; icon: string }> = [
  { id: 'meals',   icon: 'silverware-fork-knife'  },
  { id: 'planner', icon: 'calendar-month-outline' },
  { id: 'spark',   icon: 'star-four-points'       },
  { id: 'journal', icon: 'clipboard-text'         },
  { id: 'learn',   icon: 'book-open-variant'      },
];

export function HomeScreen() {
  const [activeTab, setActiveTab] = useState<TabId>('meals');

  return (
    <SafeAreaView style={s.root}>
      <View style={s.glowTop} />
      <View style={s.glowBottom} />

      <View style={s.screenArea}>
        {activeTab === 'meals'   && <MealPlanContent />}
        {activeTab === 'journal' && <JournalContent />}
        {activeTab === 'learn'   && <LearningContent />}
        {(activeTab === 'planner' || activeTab === 'spark') && <MealPlanContent />}
      </View>

      <Surface style={s.dock} elevation={0}>
        {TABS.map((tab) => (
          <View
            key={tab.id}
            style={[s.dockItem, activeTab === tab.id && s.dockItemActive]}
          >
            <IconButton
              icon={tab.icon}
              size={activeTab === tab.id ? 22 : 20}
              iconColor={activeTab === tab.id ? '#101010' : '#F8F8F8'}
              style={s.icon0}
              onPress={() => setActiveTab(tab.id)}
            />
          </View>
        ))}
      </Surface>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#EFEAFF',
  },
  glowTop: {
    position: 'absolute',
    top: -120, right: -30,
    width: 240, height: 240,
    borderRadius: 120,
    backgroundColor: '#FFF7B0',
    opacity: 0.36,
  },
  glowBottom: {
    position: 'absolute',
    bottom: 100, left: -40,
    width: 220, height: 220,
    borderRadius: 110,
    backgroundColor: '#C6FFD0',
    opacity: 0.28,
  },
  screenArea: {
    flex: 1,
    paddingBottom: 100,
  },
  dock: {
    position: 'absolute',
    left: 26, right: 26, bottom: 18,
    borderRadius: 999,
    backgroundColor: '#8C857499',
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#1A1330',
    shadowOpacity: 0.16,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
  },
  dockItem: {
    width: 48, height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dockItemActive: { backgroundColor: '#FFFFFF' },
  icon0: { margin: 0 },
});
