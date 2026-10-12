import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { useLanguage } from '../providers/LanguageProvider';

const ONBOARDING_DONE_KEY = '@onboarding_done_v1';

export async function isOnboardingDone(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(ONBOARDING_DONE_KEY)) === 'done';
  } catch {
    return false;
  }
}

export async function markOnboardingDone(): Promise<void> {
  await AsyncStorage.setItem(ONBOARDING_DONE_KEY, 'done');
}

const { width: SW } = Dimensions.get('window');

const SLIDES = [
  {
    emoji: '🍼',
    bgColor: '#E8F5F3',
    accentColor: '#6ECAC0',
    titleSq: 'Mirë se erdhët në\nReceta Bebesh!',
    titleEn: 'Welcome to\nReceta Bebesh!',
    bodySq: 'Receta të shëndetshme për bebën tuaj, të përshtatura sipas moshës.',
    bodyEn: 'The best recipes for your baby, tailored by age and nutritional needs.',
  },
  {
    emoji: '📅',
    bgColor: '#FFF5E8',
    accentColor: '#F4A62C',
    titleSq: 'Planifikoni\nvaktet e javës',
    titleEn: 'Plan weekly\nmeals easily',
    bodySq: 'Caktoni receta për çdo ditë e vakt, ose krijoni një plan me inteligjencë artificiale.',
    bodyEn: 'Assign recipes to any day and meal. Generate an AI-powered weekly plan.',
  },
  {
    emoji: '📈',
    bgColor: '#F0EBFF',
    accentColor: '#7C5CBF',
    titleSq: 'Ndiqni rritjen\ne bebës',
    titleEn: 'Track your\nbaby\'s growth',
    bodySq: 'Regjistroni peshën dhe gjatësinë, dhe ndiqni ushqimet e reja që provon bebja.',
    bodyEn: 'Log weight and height. View cooking history and food introduction progress.',
  },
];

type Props = { onDone: () => void };

export function OnboardingScreen({ onDone }: Props) {
  const { language, setLanguage } = useLanguage();
  const sq = language === 'sq-AL';
  const [page, setPage] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const dotAnim = useRef(SLIDES.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    dotAnim.forEach((anim, i) => {
      Animated.timing(anim, {
        toValue: i === page ? 1 : 0,
        duration: 200,
        useNativeDriver: false,
      }).start();
    });
  }, [page]);

  function goNext() {
    if (page < SLIDES.length - 1) {
      const nextPage = page + 1;
      scrollRef.current?.scrollTo({ x: nextPage * SW, animated: true });
      setPage(nextPage);
    } else {
      void markOnboardingDone();
      onDone();
    }
  }

  const slide = SLIDES[page];

  return (
    <SafeAreaProvider>
      <SafeAreaView style={[s.root, { backgroundColor: slide.bgColor }]}>
        <View style={s.langRow}>
          {(['sq-AL', 'en'] as const).map((lang) => (
            <Pressable
              key={lang}
              style={[s.langChip, language === lang && s.langChipOn]}
              onPress={() => void setLanguage(lang)}
            >
              <Text style={[s.langText, language === lang && s.langTextOn]}>
                {lang === 'sq-AL' ? '🇦🇱 Shqip' : '🇬🇧 English'}
              </Text>
            </Pressable>
          ))}
        </View>
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          scrollEnabled={false}
          showsHorizontalScrollIndicator={false}
          style={s.scrollView}
        >
          {SLIDES.map((sl, i) => (
            <View key={i} style={[s.slide, { width: SW }]}>
              <View style={[s.emojiCircle, { backgroundColor: sl.accentColor + '33' }]}>
                <Text style={s.emoji}>{sl.emoji}</Text>
              </View>
              <Text style={s.title}>{sq ? sl.titleSq : sl.titleEn}</Text>
              <Text style={s.body}>{sq ? sl.bodySq : sl.bodyEn}</Text>
            </View>
          ))}
        </ScrollView>

        {/* Dots */}
        <View style={s.dotsRow}>
          {SLIDES.map((sl, i) => (
            <Animated.View
              key={i}
              style={[
                s.dot,
                {
                  width: dotAnim[i].interpolate({ inputRange: [0, 1], outputRange: [8, 24] }),
                  backgroundColor: i === page ? sl.accentColor : '#D0D0D0',
                },
              ]}
            />
          ))}
        </View>

        {/* CTA */}
        <View style={s.footer}>
          <Pressable
            style={[s.nextBtn, { backgroundColor: slide.accentColor }]}
            onPress={goNext}
          >
            <Text style={s.nextBtnText}>
              {page < SLIDES.length - 1
                ? (sq ? 'Vazhdo →' : 'Next →')
                : (sq ? '✓ Fillo!' : '✓ Get Started!')}
            </Text>
          </Pressable>
          {page < SLIDES.length - 1 && (
            <Pressable onPress={() => { void markOnboardingDone(); onDone(); }}>
              <Text style={s.skipText}>{sq ? 'Kalo' : 'Skip'}</Text>
            </Pressable>
          )}
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  scrollView: { flex: 1 },
  langRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, paddingTop: 12 },
  langChip: { borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: '#FFFFFFAA' },
  langChipOn: { backgroundColor: '#1A1714' },
  langText: { fontSize: 14, fontWeight: '700', color: '#3D3530' },
  langTextOn: { color: '#FFFFFF' },
  slide: {
    flex: 1, paddingHorizontal: 32, paddingTop: 60,
    alignItems: 'center', gap: 24,
  },
  emojiCircle: {
    width: 160, height: 160, borderRadius: 80,
    alignItems: 'center', justifyContent: 'center',
  },
  emoji: { fontSize: 80 },
  title: {
    fontSize: 36, fontWeight: '800', textAlign: 'center',
    letterSpacing: -1.2, color: '#1A1714', lineHeight: 42,
  },
  body: {
    fontSize: 17, lineHeight: 26, textAlign: 'center', color: '#5A5560',
  },
  dotsRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 16,
  },
  dot: { height: 8, borderRadius: 4 },
  footer: { paddingHorizontal: 24, paddingBottom: 20, gap: 12 },
  nextBtn: {
    borderRadius: 999, paddingVertical: 18,
    alignItems: 'center',
  },
  nextBtnText: { fontSize: 18, fontWeight: '800', color: '#FFFFFF' },
  skipText: {
    fontSize: 15, color: '#A0A0A8', textAlign: 'center', fontWeight: '600',
  },
});
