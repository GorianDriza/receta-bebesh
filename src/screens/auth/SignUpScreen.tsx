import { useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from 'react-native-paper';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { firebaseAuth, mapAuthError } from '../../lib/auth';
import { getFirebaseConfigErrorMessage, isFirebaseConfigured } from '../../lib/firebase';
import { createUserProfile } from '../../lib/users';
import { DatePickerField } from '../../components/DatePickerField';
import { useLanguage } from '../../providers/LanguageProvider';
import { AuthInput } from './AuthInput';

const L = {
  'sq-AL': {
    title: 'Krijoni llogarinë 👶',
    subtitle: 'Filloni të planifikoni ushqimin e bebës suaj',
    name: 'Emri juaj',
    babyName: 'Emri i bebës',
    babyBirthdate: 'Datëlindja e bebës',
    email: 'Email',
    password: 'Fjalëkalimi',
    passHelp: 'Minimum 6 karaktere',
    createBtn: 'Krijoni llogarinë',
    hasAccount: 'Keni tashmë llogari?',
    loginLink: 'Hyni',
    nameMissing: 'Vendosni emrin tuaj',
    emailMissing: 'Vendosni emailin',
    passMissing: 'Fjalëkalimi min 6 karaktere',
    continueGuest: 'Vazhdo si vizitor',
  },
  en: {
    title: 'Create account 👶',
    subtitle: "Start planning your baby's meals",
    name: 'Your name',
    babyName: "Baby's name",
    babyBirthdate: "Baby's birthdate",
    email: 'Email',
    password: 'Password',
    passHelp: 'Minimum 6 characters',
    createBtn: 'Create Account',
    hasAccount: 'Already have an account?',
    loginLink: 'Sign In',
    nameMissing: 'Enter your name',
    emailMissing: 'Enter your email',
    passMissing: 'Password must be at least 6 characters',
    continueGuest: 'Continue as guest',
  },
} as const;

type Props = { onGoLogin: () => void; onGuestContinue?: () => void };

export function SignUpScreen({ onGoLogin, onGuestContinue }: Props) {
  const { language, t } = useLanguage();
  const insets = useSafeAreaInsets();
  const l = t[language].auth.signup;
  const firebaseConfigError = getFirebaseConfigErrorMessage();

  const [name, setName]               = useState('');
  const [babyName, setBabyName]       = useState('');
  const [babyBd, setBabyBd]           = useState('');
  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [showPass, setShowPass]       = useState(false);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState<string | null>(null);

  async function handleSignUp() {
    if (!firebaseAuth) {
      setError(firebaseConfigError);
      return;
    }
    if (!name.trim()) { setError(l.nameMissing); return; }
    if (!email.trim()) { setError(l.emailMissing); return; }
    if (password.length < 6) { setError(l.passMissing); return; }

    setLoading(true);
    setError(null);
    try {
      const cred = await createUserWithEmailAndPassword(
        firebaseAuth,
        email.trim(),
        password,
      );
      await updateProfile(cred.user, { displayName: name.trim() });
      await createUserProfile({
        uid: cred.user.uid,
        displayName: name.trim(),
        email: email.trim(),
        babyName: babyName.trim(),
        babyBirthdate: babyBd.trim(),
        language,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } catch (err: any) {
      setError(mapAuthError(err.code ?? '', language));
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={s.root}>
      <View style={s.blob1} />
      <View style={s.blob2} />

      {/* Back button */}
      <Pressable
        style={[s.backBtn, { top: insets.top + 8 }]}
        onPress={onGoLogin}
        hitSlop={8}
      >
        <Text style={s.backIcon}>←</Text>
      </Pressable>

      <KeyboardAvoidingView
        style={s.kav}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            s.scroll,
            { paddingTop: Math.max(insets.top, 8) + 40 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo */}
          <View style={s.logoRow}>
            <Image
              source={require('../../../assets/icon.png')}
              style={s.logo}
              resizeMode="contain"
            />
          </View>

          {/* Card */}
          <View style={s.card}>
            <Text style={s.title}>{l.title}</Text>
            <Text style={s.subtitle}>{l.subtitle}</Text>

            <View style={s.fields}>
              <AuthInput
                label={l.name}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                autoComplete="name"
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
              <AuthInput
                label={l.email}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
              <AuthInput
                label={l.password}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPass}
                autoComplete="new-password"
                helperText={l.passHelp}
                right={
                  <Pressable
                    onPress={() => setShowPass((v) => !v)}
                    style={s.eyeBtn}
                    hitSlop={8}
                  >
                    <Text style={s.eyeIcon}>{showPass ? '🙈' : '👁️'}</Text>
                  </Pressable>
                }
              />
            </View>

            {!isFirebaseConfigured && <Text style={s.error}>{firebaseConfigError}</Text>}
            {error != null && <Text style={s.error}>{error}</Text>}

            <Pressable
              style={[s.btn, loading && s.btnDisabled]}
              onPress={handleSignUp}
              disabled={loading || !firebaseAuth}
            >
              <Text style={s.btnLabel}>{loading ? '...' : l.createBtn}</Text>
            </Pressable>
          </View>

          {/* Login row */}
          <View style={s.switchRow}>
            <Text style={s.switchText}>{l.hasAccount} </Text>
            <Pressable onPress={onGoLogin} hitSlop={8}>
              <Text style={s.switchLink}>{l.loginLink}</Text>
            </Pressable>
          </View>

          {onGuestContinue != null && (
            <Pressable onPress={onGuestContinue} hitSlop={8} style={s.guestBtn}>
              <Text style={s.guestLabel}>{l.continueGuest}</Text>
            </Pressable>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFF9F5' },
  blob1: {
    position: 'absolute', top: -60, right: -50,
    width: 200, height: 200, borderRadius: 100,
    backgroundColor: '#FFD97D', opacity: 0.22,
  },
  blob2: {
    position: 'absolute', bottom: 60, left: -60,
    width: 180, height: 180, borderRadius: 90,
    backgroundColor: '#6ECAC0', opacity: 0.18,
  },
  backBtn: {
    position: 'absolute',
    top: 16, left: 16,
    zIndex: 10,
    width: 44, height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFFCC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: { fontSize: 20, color: '#1A1714' },

  kav: { flex: 1 },
  scroll: { paddingHorizontal: 24, paddingTop: 48, paddingBottom: 32, gap: 24 },

  logoRow: { alignItems: 'center' },
  logo: { width: 64, height: 64, borderRadius: 16 },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 32,
    padding: 24,
    gap: 16,
    shadowColor: '#1A1330',
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  title: { fontSize: 24, fontWeight: '800', color: '#1A1714', letterSpacing: -0.8 },
  subtitle: { fontSize: 15, color: '#6E6560', lineHeight: 22, marginTop: -8 },

  fields: { gap: 14 },
  eyeBtn: { paddingRight: 4 },
  eyeIcon: { fontSize: 18 },

  error: { fontSize: 14, color: '#E05252', fontWeight: '600' },

  btn: {
    backgroundColor: '#6ECAC0',
    borderRadius: 999,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 4,
  },
  btnDisabled: { opacity: 0.6 },
  btnLabel: { fontSize: 17, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.3 },

  switchRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  switchText: { fontSize: 15, color: '#6E6560' },
  switchLink: { fontSize: 15, fontWeight: '700', color: '#6ECAC0' },
  guestBtn: { alignItems: 'center', paddingVertical: 4 },
  guestLabel: { fontSize: 14, color: '#A09599', textDecorationLine: 'underline' },
});
