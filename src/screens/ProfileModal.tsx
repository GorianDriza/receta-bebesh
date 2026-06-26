import { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Chip, IconButton, Text } from 'react-native-paper';
import { signOut } from 'firebase/auth';
import { firebaseAuth } from '../lib/auth';
import { DatePickerField } from '../components/DatePickerField';
import { updateUserProfile, formatBabyAge, computeAgeStage } from '../lib/users';
import { useAuth } from '../providers/AuthProvider';
import { useLanguage } from '../providers/LanguageProvider';
import { AppLanguage, translations } from '../i18n/translations';
import { AuthInput } from './auth/AuthInput';
import { FoodTrackerModal } from './FoodTrackerModal';

const L = {
  'sq-AL': {
    title: 'Profili',
    displayName: 'Emri juaj',
    babyName: 'Emri i bebës',
    babyBirthdate: 'Datëlindja e bebës',
    language: 'Gjuha',
    ageStage: 'Faza e moshës',
    saveBtn: 'Ruaj',
    saving: 'Duke ruajtur...',
    saved: 'U ruajt!',
    logoutBtn: 'Dilni',
    logoutConfirm: 'Jeni të sigurtë që doni të dilni?',
    logoutYes: 'Po, dil',
    logoutNo: 'Anulo',
    email: 'Email',
    foodTracker: 'Ushqimet e Provuara',
  },
  en: {
    title: 'Profile',
    displayName: 'Your name',
    babyName: "Baby's name",
    babyBirthdate: "Baby's birthdate",
    language: 'Language',
    ageStage: 'Age stage',
    saveBtn: 'Save',
    saving: 'Saving...',
    saved: 'Saved!',
    logoutBtn: 'Sign Out',
    logoutConfirm: 'Are you sure you want to sign out?',
    logoutYes: 'Sign Out',
    logoutNo: 'Cancel',
    email: 'Email',
    foodTracker: 'Foods Introduced',
  },
} as const;

type Props = { visible: boolean; onClose: () => void };
type ImagePickerModule = typeof import('expo-image-picker');
type ImageManipulatorModule = typeof import('expo-image-manipulator');

function getPhotoModuleAlert(language: AppLanguage) {
  const command = Platform.OS === 'ios' ? 'npx expo run:ios' : 'npx expo run:android';
  const profile = translations[language].profile;

  return {
    title: profile.photoRebuildTitle,
    message: profile.photoRebuildBody(command),
  };
}

function loadPhotoModules():
  | { picker: ImagePickerModule; manipulator: ImageManipulatorModule }
  | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const picker = require('expo-image-picker') as Partial<ImagePickerModule>;
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const manipulator = require('expo-image-manipulator') as Partial<ImageManipulatorModule>;

    if (
      typeof picker.requestMediaLibraryPermissionsAsync !== 'function' ||
      typeof picker.launchImageLibraryAsync !== 'function' ||
      typeof manipulator.manipulateAsync !== 'function' ||
      !manipulator.SaveFormat?.JPEG
    ) {
      return null;
    }

    return {
      picker: picker as ImagePickerModule,
      manipulator: manipulator as ImageManipulatorModule,
    };
  } catch {
    return null;
  }
}

export function ProfileModal({ visible, onClose }: Props) {
  const { language, setLanguage, t } = useLanguage();
  const { user, userProfile, refreshProfile } = useAuth();
  const l = t[language].profile;

  const [name, setName]             = useState('');
  const [babyName, setBabyName]     = useState('');
  const [babyBd, setBabyBd]         = useState('');
  const [photoBase64, setPhotoBase64] = useState<string | undefined>(undefined);
  const [saving, setSaving]         = useState(false);
  const [saved, setSaved]           = useState(false);
  const [foodTrackerOpen, setFoodTrackerOpen] = useState(false);

  // Sync fields each time modal opens or profile loads from cache/Firebase
  useEffect(() => {
    if (!visible) return;
    setName(userProfile?.displayName ?? user?.displayName ?? '');
    setBabyName(userProfile?.babyName ?? '');
    setBabyBd(userProfile?.babyBirthdate ?? '');
    setPhotoBase64(userProfile?.photoBase64 ?? undefined);
  }, [visible, userProfile, user?.displayName]);

  async function handlePickPhoto() {
    const photoModules = loadPhotoModules();
    if (!photoModules) {
      const alert = getPhotoModuleAlert(language);
      Alert.alert(alert.title, alert.message);
      return;
    }

    const photoPicker = photoModules.picker;
    const photoManipulator = photoModules.manipulator;
    const permission = await photoPicker.requestMediaLibraryPermissionsAsync();
    if (permission.status !== 'granted') {
      Alert.alert(l.photoPermissionTitle, l.photoPermissionBody);
      return;
    }

    const pickerResult = await photoPicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
    if (pickerResult.canceled) return;

    const resizedImage = await photoManipulator.manipulateAsync(
      pickerResult.assets[0].uri,
      [{ resize: { width: 200, height: 200 } }],
      { compress: 0.6, format: photoManipulator.SaveFormat.JPEG, base64: true },
    );
    if (resizedImage.base64) {
      setPhotoBase64(`data:image/jpeg;base64,${resizedImage.base64}`);
    }
  }

  const babyAge = babyBd ? formatBabyAge(babyBd, language) : '';
  const stage   = babyBd ? computeAgeStage(babyBd) : null;

  const initials = (name || user?.displayName || '?')
    .split(' ')
    .map((w) => w[0]?.toUpperCase() ?? '')
    .slice(0, 2)
    .join('');

  async function handleSave() {
    if (!user) return;
    setSaving(true);
    setSaved(false);
    try {
      await updateUserProfile(user.uid, {
        displayName: name.trim(),
        babyName: babyName.trim(),
        babyBirthdate: babyBd.trim(),
        language,
        ...(photoBase64 !== undefined && { photoBase64 }),
      });
      await refreshProfile();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  function handleLogout() {
    Alert.alert(
      l.logoutConfirm,
      undefined,
      [
        { text: l.logoutNo, style: 'cancel' },
        {
          text: l.logoutYes,
          style: 'destructive',
          onPress: async () => {
            if (firebaseAuth) await signOut(firebaseAuth);
            onClose();
          },
        },
      ],
    );
  }

  const langOptions: Array<{ id: AppLanguage; label: string }> = [
    { id: 'sq-AL', label: 'Shqip' },
    { id: 'en',    label: 'English' },
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <SafeAreaProvider>
      <SafeAreaView style={s.root}>
        {/* Top bar */}
        <View style={s.topBar}>
          <View style={s.closeBubble}>
            <IconButton
              icon="arrow-left"
              size={22}
              iconColor="#1A1714"
              style={s.icon0}
              onPress={onClose}
            />
          </View>
          <Text style={s.topTitle}>{l.title}</Text>
          <View style={{ width: 44 }} />
        </View>

        <KeyboardAvoidingView
          style={s.kav}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={s.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Avatar */}
            <View style={s.avatarWrap}>
              <Pressable style={s.avatarOuter} onPress={handlePickPhoto}>
                {photoBase64 ? (
                  <Image source={{ uri: photoBase64 }} style={s.avatarImg} />
                ) : (
                  <View style={s.avatar}>
                    <Text style={s.avatarText}>{initials}</Text>
                  </View>
                )}
                <View style={s.cameraBadge}>
                  <Text style={s.cameraIcon}>📷</Text>
                </View>
              </Pressable>
              {user?.email && <Text style={s.email}>{user.email}</Text>}
              {babyAge !== '' && stage && (
                <View style={s.agePill}>
                  <Text style={s.agePillText}>👶 {babyAge} · {stage}</Text>
                </View>
              )}
            </View>

            {/* Edit card */}
            <View style={s.card}>
              <View style={s.fields}>
                <AuthInput
                  label={l.displayName}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
                <AuthInput
                  label={l.babyName}
                  value={babyName}
                  onChangeText={setBabyName}
                  autoCapitalize="words"
                />
                <DatePickerField
                  label={l.babyBirthdate}
                  value={babyBd}
                  onChange={setBabyBd}
                  language={language}
                />
              </View>

              {/* Language */}
              <View style={s.langSection}>
                <Text style={s.sectionLabel}>{l.language}</Text>
                <View style={s.langChips}>
                  {langOptions.map((o) => (
                    <Chip
                      key={o.id}
                      selected={language === o.id}
                      onPress={() => void setLanguage(o.id)}
                      compact
                      style={[s.chip, language === o.id && s.chipOn]}
                      textStyle={[s.chipText, language === o.id && s.chipTextOn]}
                    >
                      {o.label}
                    </Chip>
                  ))}
                </View>
              </View>

              <Pressable
                style={[s.saveBtn, saving && s.saveBtnDisabled]}
                onPress={handleSave}
                disabled={saving}
              >
                <Text style={s.saveBtnLabel}>
                  {saving ? l.saving : saved ? l.saved : l.saveBtn}
                </Text>
              </Pressable>
            </View>

            {/* Food Tracker */}
            <Pressable style={s.foodTrackerBtn} onPress={() => setFoodTrackerOpen(true)}>
              <Text style={s.foodTrackerIcon}>🍎</Text>
              <Text style={s.foodTrackerLabel}>{L[language].foodTracker}</Text>
              <Text style={s.foodTrackerArrow}>›</Text>
            </Pressable>

            {/* Logout */}
            <Pressable style={s.logoutBtn} onPress={handleLogout}>
              <Text style={s.logoutLabel}>{l.logoutBtn}</Text>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
      </SafeAreaProvider>
      <FoodTrackerModal visible={foodTrackerOpen} onClose={() => setFoodTrackerOpen(false)} />
    </Modal>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFF9F5' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  closeBubble: {
    width: 44, height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFFCC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon0: { margin: 0 },
  topTitle: { fontSize: 18, fontWeight: '800', color: '#1A1714', letterSpacing: -0.4 },

  kav: { flex: 1 },
  scroll: { paddingHorizontal: 24, paddingBottom: 40, gap: 20 },

  avatarWrap: { alignItems: 'center', gap: 10, paddingTop: 8 },
  avatarOuter: { position: 'relative', width: 92, height: 92 },
  avatar: {
    width: 92, height: 92,
    borderRadius: 46,
    backgroundColor: '#6ECAC0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImg: { width: 92, height: 92, borderRadius: 46 },
  avatarText: { fontSize: 32, fontWeight: '800', color: '#FFFFFF' },
  cameraBadge: {
    position: 'absolute', bottom: 0, right: 0,
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: '#FFFFFF',
    borderWidth: 2, borderColor: '#F4F1EE',
    alignItems: 'center', justifyContent: 'center',
  },
  cameraIcon: { fontSize: 14 },
  email: { fontSize: 14, color: '#6E6560' },
  agePill: {
    backgroundColor: '#E8F8F6',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  agePillText: { fontSize: 15, fontWeight: '700', color: '#3D9C72' },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 32,
    padding: 24,
    gap: 18,
    shadowColor: '#1A1330',
    shadowOpacity: 0.07,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  fields: { gap: 14 },

  langSection: { gap: 10 },
  sectionLabel: { fontSize: 14, fontWeight: '700', color: '#3D3530' },
  langChips: { flexDirection: 'row', gap: 10 },
  chip: { borderRadius: 999, backgroundColor: '#F3EEE9', paddingHorizontal: 6 },
  chipOn: { backgroundColor: '#1A1714' },
  chipText: { fontSize: 14, fontWeight: '600', color: '#3D3530' },
  chipTextOn: { color: '#FFFFFF' },

  saveBtn: {
    backgroundColor: '#6ECAC0',
    borderRadius: 999,
    paddingVertical: 18,
    alignItems: 'center',
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnLabel: { fontSize: 17, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.3 },

  foodTrackerBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#E8FAF8', borderRadius: 18,
    paddingHorizontal: 18, paddingVertical: 16, marginBottom: 8,
  },
  foodTrackerIcon: { fontSize: 22 },
  foodTrackerLabel: { flex: 1, fontSize: 16, fontWeight: '700', color: '#2A6B66' },
  foodTrackerArrow: { fontSize: 22, color: '#3AABA0', fontWeight: '300' },

  logoutBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    paddingVertical: 18,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFCCC8',
  },
  logoutLabel: { fontSize: 16, fontWeight: '700', color: '#E05252' },
});
