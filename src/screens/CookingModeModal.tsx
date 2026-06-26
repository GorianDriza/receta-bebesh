import { useKeepAwake } from 'expo-keep-awake';
import * as Speech from 'expo-speech';
import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { IconButton, Text } from 'react-native-paper';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { AppLanguage } from '../i18n/translations';
import { RecipeRecord } from '../lib/recipes';
import { useLanguage } from '../providers/LanguageProvider';

const L: Record<AppLanguage, {
  step: string; of: string; done: string; finish: string; prev: string; next: string;
  timer: string; timerDone: string; startTimer: string;
}> = {
  'sq-AL': { step: 'Hapi', of: 'nga', done: 'Gatuar!', finish: 'Mbaro', prev: 'Mbrapa', next: 'Përpara', timer: 'Kronometër', timerDone: '⏰ Koha mbaroi!', startTimer: 'Fillo' },
  en:      { step: 'Step', of: 'of',  done: 'Done!',   finish: 'Finish', prev: 'Back',  next: 'Next',    timer: 'Timer',      timerDone: '⏰ Time\'s up!',    startTimer: 'Start' },
};

function parseStepMinutes(text: string): number | null {
  const minsMatch = text.match(/(\d+)\s*(?:min(?:ute)?s?|minuta|minut)/i);
  if (minsMatch) return parseInt(minsMatch[1], 10);
  const secsMatch = text.match(/(\d+)\s*(?:sec(?:ond)?s?|sekonda?)/i);
  if (secsMatch) return Math.ceil(parseInt(secsMatch[1], 10) / 60);
  return null;
}

const SPEECH_LANG: Record<AppLanguage, string> = {
  'sq-AL': 'sq',
  en:      'en-US',
};

type Props = { recipe: RecipeRecord; visible: boolean; onClose: () => void };

export function CookingModeModal({ recipe, visible, onClose }: Props) {
  useKeepAwake();

  const { language } = useLanguage();
  const labels = L[language];
  const steps = recipe.steps[language] ?? [];
  const [step, setStep] = useState(0);
  const [speaking, setSpeaking] = useState(false);
  const [timerSecs, setTimerSecs] = useState<number | null>(null);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerDone, setTimerDone] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stepMinutes = parseStepMinutes(steps[step] ?? '');

  function startTimer(mins: number) {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimerSecs(mins * 60);
    setTimerRunning(true);
    setTimerDone(false);
    timerRef.current = setInterval(() => {
      setTimerSecs((prev) => {
        if (prev == null || prev <= 1) {
          clearInterval(timerRef.current!);
          setTimerRunning(false);
          setTimerDone(true);
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  function stopTimer() {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimerRunning(false);
    setTimerSecs(null);
    setTimerDone(false);
  }

  useEffect(() => {
    stopTimer();
    setTimerDone(false);
  }, [step]);

  useEffect(() => {
    if (!visible) { stopTimer(); Speech.stop(); }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [visible]);


  function speakStep() {
    const text = steps[step];
    if (!text) return;
    if (speaking) {
      Speech.stop();
      setSpeaking(false);
    } else {
      setSpeaking(true);
      Speech.speak(text, {
        language: SPEECH_LANG[language],
        rate: 0.9,
        onDone: () => setSpeaking(false),
        onStopped: () => setSpeaking(false),
        onError: () => setSpeaking(false),
      });
    }
  }

  function goNext() {
    Speech.stop(); setSpeaking(false);
    if (step < steps.length - 1) setStep(step + 1);
  }
  function goPrev() {
    Speech.stop(); setSpeaking(false);
    if (step > 0) setStep(step - 1);
  }

  const isLast = step === steps.length - 1;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <SafeAreaProvider>
        <SafeAreaView style={s.root}>
          {/* Top bar */}
          <View style={s.topBar}>
            <IconButton icon="close" size={24} iconColor="#FFFFFF" style={s.icon0} onPress={onClose} />
            <Text style={s.recipeName} numberOfLines={1}>{recipe.title[language]}</Text>
            <Pressable style={[s.speakBtn, speaking && s.speakBtnOn]} onPress={speakStep} hitSlop={8}>
              <Text style={s.speakIcon}>{speaking ? '⏹' : '🔊'}</Text>
            </Pressable>
          </View>

          {/* Progress dots */}
          <View style={s.dotsRow}>
            {steps.map((_, i) => (
              <Pressable key={i} onPress={() => setStep(i)}>
                <View style={[s.dot, i === step && s.dotActive, i < step && s.dotDone]} />
              </Pressable>
            ))}
          </View>

          {/* Step counter */}
          <Text style={s.stepCounter}>{labels.step} {step + 1} {labels.of} {steps.length}</Text>

          {/* Step content */}
          <Animated.View key={step} entering={FadeIn.duration(200)} exiting={FadeOut.duration(150)} style={s.stepCard}>
            <Text style={s.stepNumBig}>{step + 1}</Text>
            <Text style={s.stepText}>{steps[step]}</Text>
          </Animated.View>

          {/* Timer */}
          <View style={s.timerRow}>
            {timerDone ? (
              <Pressable style={s.timerDoneBtn} onPress={stopTimer}>
                <Text style={s.timerDoneText}>{labels.timerDone} ✕</Text>
              </Pressable>
            ) : timerRunning && timerSecs != null ? (
              <Pressable style={s.timerRunning} onPress={stopTimer}>
                <Text style={s.timerSecs}>
                  {String(Math.floor(timerSecs / 60)).padStart(2, '0')}:{String(timerSecs % 60).padStart(2, '0')}
                </Text>
                <Text style={s.timerStopLabel}>✕</Text>
              </Pressable>
            ) : stepMinutes != null ? (
              <Pressable style={s.timerStartBtn} onPress={() => startTimer(stepMinutes)}>
                <Text style={s.timerStartText}>⏱ {labels.startTimer} {stepMinutes} min</Text>
              </Pressable>
            ) : null}
          </View>

          {/* Navigation */}
          <View style={s.navRow}>
            <Pressable style={[s.navBtn, s.navBtnSecondary, step === 0 && s.navBtnDisabled]} onPress={goPrev} disabled={step === 0}>
              <Text style={[s.navLabel, s.navLabelSecondary]}>← {labels.prev}</Text>
            </Pressable>
            <Pressable style={[s.navBtn, isLast && s.navBtnFinish]} onPress={isLast ? onClose : goNext}>
              <Text style={s.navLabel}>{isLast ? `🎉 ${labels.finish}` : `${labels.next} →`}</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#1C1730' },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 8, paddingVertical: 4,
  },
  icon0: { margin: 0 },
  icon0Placeholder: { width: 48 },
  recipeName: { flex: 1, textAlign: 'center', fontSize: 15, fontWeight: '700', color: '#FFFFFFCC', numberOfLines: 1 } as object,

  dotsRow: {
    flexDirection: 'row', justifyContent: 'center',
    flexWrap: 'wrap', gap: 6, paddingHorizontal: 24, marginTop: 8,
  },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#FFFFFF33' },
  dotActive: { backgroundColor: '#6ECAC0', width: 22, borderRadius: 4 },
  dotDone:   { backgroundColor: '#6ECAC066' },

  stepCounter: {
    textAlign: 'center', marginTop: 16,
    fontSize: 14, fontWeight: '600', color: '#9E99B2', letterSpacing: 1,
    textTransform: 'uppercase',
  },

  stepCard: {
    flex: 1, marginHorizontal: 24, marginTop: 24,
    alignItems: 'flex-start', justifyContent: 'center',
  },
  stepNumBig: {
    fontSize: 80, fontWeight: '900', color: '#FFFFFF11',
    position: 'absolute', top: 0, left: -8, lineHeight: 80,
  },
  stepText: {
    fontSize: 28, lineHeight: 40, fontWeight: '600',
    color: '#F2F0FF', letterSpacing: -0.5,
  },

  navRow: {
    flexDirection: 'row', gap: 12,
    paddingHorizontal: 24, paddingVertical: 24,
  },
  navBtn: {
    flex: 1, backgroundColor: '#6ECAC0',
    borderRadius: 20, paddingVertical: 20, alignItems: 'center',
  },
  navBtnSecondary: { backgroundColor: '#2D2748' },
  navBtnFinish:    { backgroundColor: '#FFD600' },
  navBtnDisabled:  { opacity: 0.3 },
  navLabel: { fontSize: 17, fontWeight: '800', color: '#FFFFFF' },
  navLabelSecondary: { color: '#FFFFFFAA' },
  speakBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#2D2748', alignItems: 'center', justifyContent: 'center' },
  speakBtnOn: { backgroundColor: '#6ECAC0' },
  speakIcon: { fontSize: 20 },

  timerRow: { paddingHorizontal: 24, paddingBottom: 8, alignItems: 'center' },
  timerStartBtn: {
    backgroundColor: '#2D2748', borderRadius: 999,
    paddingHorizontal: 20, paddingVertical: 10,
    borderWidth: 1, borderColor: '#6ECAC044',
  },
  timerStartText: { fontSize: 14, fontWeight: '700', color: '#6ECAC0' },
  timerRunning: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#6ECAC0', borderRadius: 999,
    paddingHorizontal: 20, paddingVertical: 10,
  },
  timerSecs: { fontSize: 22, fontWeight: '900', color: '#1C1730', letterSpacing: 2 },
  timerStopLabel: { fontSize: 14, fontWeight: '700', color: '#1C173088' },
  timerDoneBtn: {
    backgroundColor: '#FFD600', borderRadius: 999,
    paddingHorizontal: 20, paddingVertical: 10,
  },
  timerDoneText: { fontSize: 15, fontWeight: '800', color: '#1C1730' },
});
