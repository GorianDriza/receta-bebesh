import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconButton, Surface, Text } from 'react-native-paper';

import { useAuth } from '../providers/AuthProvider';
import { LoginScreen } from './auth/LoginScreen';
import { SignUpScreen } from './auth/SignUpScreen';
import { JournalContent } from './JournalContent';
import { LearningContent } from './LearningContent';
import { MealPlanContent } from './MealPlanContent';
import { PlannerContent } from './PlannerContent';
import { ProfileModal } from './ProfileModal';
import { QuickContent } from './QuickContent';

type TabId = 'meals' | 'planner' | 'spark' | 'journal' | 'learn';
type AuthView = 'login' | 'signup' | null;

const TABS: Array<{ id: TabId; icon: string; label: string }> = [
  { id: 'meals',   icon: 'silverware-fork-knife',  label: 'Meals'   },
  { id: 'planner', icon: 'calendar-month-outline',  label: 'Planner' },
  { id: 'spark',   icon: 'lightning-bolt',          label: 'Quick'   },
  { id: 'journal', icon: 'clipboard-text-outline',  label: 'Journal' },
  { id: 'learn',   icon: 'book-open-page-variant',  label: 'Learn'   },
];

export function HomeScreen() {
  const { user } = useAuth();
  const [activeTab,   setActiveTab]   = useState<TabId>('meals');
  const [showProfile, setShowProfile] = useState(false);
  const [authView,    setAuthView]    = useState<AuthView>(null);

  // Auto-close auth overlay once login/signup succeeds
  useEffect(() => {
    if (user && authView != null) setAuthView(null);
  }, [user, authView]);

  function handleAvatarPress() {
    if (user) setShowProfile(true);
    else setAuthView('login');
  }

  // Auth screens overlay the entire app
  if (authView === 'login') {
    return (
      <LoginScreen
        onGoSignUp={() => setAuthView('signup')}
        onGuestContinue={() => setAuthView(null)}
      />
    );
  }
  if (authView === 'signup') {
    return (
      <SignUpScreen
        onGoLogin={() => setAuthView('login')}
        onGuestContinue={() => setAuthView(null)}
      />
    );
  }

  return (
    <SafeAreaView style={s.root}>
      <View style={s.glowTop} />
      <View style={s.glowBottom} />

      <View style={s.screenArea}>
        {activeTab === 'meals'   && <MealPlanContent onAvatarPress={handleAvatarPress} onLoginRequired={() => setAuthView('login')} />}
        {activeTab === 'planner' && <PlannerContent onLoginRequired={() => setAuthView('login')} />}
        {activeTab === 'spark'   && <QuickContent />}
        {activeTab === 'journal' && <JournalContent onLoginRequired={() => setAuthView('login')} />}
        {activeTab === 'learn'   && <LearningContent />}
      </View>

      {/* Bottom nav */}
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
            {activeTab === tab.id && (
              <Text style={s.dockLabel}>{tab.label}</Text>
            )}
          </View>
        ))}
      </Surface>

      <ProfileModal visible={showProfile} onClose={() => setShowProfile(false)} />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#EFEAFF' },
  glowTop: {
    position: 'absolute', top: -120, right: -30,
    width: 240, height: 240, borderRadius: 120,
    backgroundColor: '#FFF7B0', opacity: 0.36,
  },
  glowBottom: {
    position: 'absolute', bottom: 100, left: -40,
    width: 220, height: 220, borderRadius: 110,
    backgroundColor: '#C6FFD0', opacity: 0.28,
  },
  screenArea: { flex: 1, paddingBottom: 100 },

  // Dock
  dock: {
    position: 'absolute',
    left: 20, right: 20, bottom: 18,
    borderRadius: 28,
    backgroundColor: '#2D2730EE',
    paddingHorizontal: 8,
    paddingVertical: 6,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    shadowColor: '#1A1330',
    shadowOpacity: 0.22,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
  },
  dockItem: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 52,
    borderRadius: 20,
    paddingVertical: 4,
  },
  dockItemActive: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
  },
  dockLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#101010',
    marginTop: -4,
    marginBottom: 2,
  },
  icon0: { margin: 0 },
});
