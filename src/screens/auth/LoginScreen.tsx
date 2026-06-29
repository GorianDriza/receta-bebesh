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
import { sendPasswordResetEmail, signInWithEmailAndPassword } from 'firebase/auth';
import { firebaseAuth, mapAuthError } from '../../lib/auth';
import { getFirebaseConfigErrorMessage, isFirebaseConfigured } from '../../lib/firebase';
import { useLanguage } from '../../providers/LanguageProvider';
import { useGoogleSignIn } from '../../hooks/useGoogleSignIn';
import { AuthInput } from './AuthInput';

const L = {
  'sq-AL': {
    title: 'Mirë se vini 👶',
    subtitle: 'Hyni për të parë recetat e bebës suaj',
    email: 'Email',
    password: 'Fjalëkalimi',
    loginBtn: 'Hyni',
    noAccount: 'Nuk keni llogari?',
    signUpLink: 'Regjistrohuni',
    forgot: 'Keni harruar fjalëkalimin?',
    resetSent: 'Email rivendosjeje u dërgua!',
    enterEmailFirst: 'Vendosni emailin e parë',
    continueGuest: 'Vazhdo si vizitor',
    orDivider: 'ose',
    googleBtn: 'Vazhdo me Google',
  },
  en: {
    title: 'Welcome back 👶',
    subtitle: 'Sign in to see recipes for your baby',
    email: 'Email',
    password: 'Password',
    loginBtn: 'Sign In',
    noAccount: "Don't have an account?",
    signUpLink: 'Sign Up',
    forgot: 'Forgot your password?',
    resetSent: 'Password reset email sent!',
    enterEmailFirst: 'Enter your email first',
    continueGuest: 'Continue as guest',
    orDivider: 'or',
    googleBtn: 'Continue with Google',
  },
} as const;

type Props = { onGoSignUp: () => void; onGuestContinue?: () => void };

export function LoginScreen({ onGoSignUp, onGuestContinue }: Props) {
  const { language, t } = useLanguage();
  const insets = useSafeAreaInsets();
  const l = t[language].auth.login;
  const ll = L[language];
  const firebaseConfigError = getFirebaseConfigErrorMessage();

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [resetMsg, setResetMsg] = useState<string | null>(null);
  const [showPass, setShowPass] = useState(false);

  const google = useGoogleSignIn();

  async function handleLogin() {
    if (!firebaseAuth) {
      setError(firebaseConfigError);
      return;
    }
    setLoading(true);
    setError(null);
    setResetMsg(null);
    try {
      await signInWithEmailAndPassword(firebaseAuth, email.trim(), password);
    } catch (err: any) {
      setError(mapAuthError(err.code ?? '', language));
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword() {
    if (!firebaseAuth) {
      setError(firebaseConfigError);
      return;
    }
    if (!email.trim()) { setError(l.enterEmailFirst); return; }
    try {
      await sendPasswordResetEmail(firebaseAuth, email.trim());
      setResetMsg(l.resetSent);
      setError(null);
    } catch (err: any) {
      setError(mapAuthError(err.code ?? '', language));
    }
  }

  return (
    <SafeAreaView style={s.root}>
      <View style={s.blob1} />
      <View style={s.blob2} />
      <KeyboardAvoidingView
        style={s.kav}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            s.scroll,
            { paddingTop: Math.max(insets.top, 8) + 16 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={s.logoRow}>
            <Image
              source={require('../../../assets/icon.png')}
              style={s.logo}
              resizeMode="contain"
            />
            <Text style={s.appName}>Receta Bebesh</Text>
          </View>

          <View style={s.card}>
            <Text style={s.title}>{l.title}</Text>
            <Text style={s.subtitle}>{l.subtitle}</Text>

            <View style={s.fields}>
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
                autoComplete="current-password"
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
            {error != null   && <Text style={s.error}>{error}</Text>}
            {google.error != null && <Text style={s.error}>{google.error}</Text>}
            {resetMsg != null && <Text style={s.success}>{resetMsg}</Text>}

            <Pressable
              style={[s.btn, loading && s.btnDisabled]}
              onPress={handleLogin}
              disabled={loading || !firebaseAuth}
            >
              <Text style={s.btnLabel}>{loading ? '...' : l.loginBtn}</Text>
            </Pressable>

            <Pressable onPress={handleForgotPassword} hitSlop={8} disabled={!firebaseAuth}>
              <Text style={s.forgotLink}>{l.forgot}</Text>
            </Pressable>

            <View style={s.dividerRow}>
              <View style={s.dividerLine} />
              <Text style={s.dividerText}>{ll.orDivider}</Text>
              <View style={s.dividerLine} />
            </View>

            <Pressable
              style={[s.googleBtn, google.loading && s.btnDisabled]}
              onPress={() => { google.clearError(); void google.promptAsync(); }}
              disabled={google.loading || !google.isAvailable || !firebaseAuth}
            >
              <Text style={s.googleG}>G</Text>
              <Text style={s.googleLabel}>{ll.googleBtn}</Text>
            </Pressable>
          </View>

          <View style={s.switchRow}>
            <Text style={s.switchText}>{l.noAccount} </Text>
            <Pressable onPress={onGoSignUp} hitSlop={8}>
              <Text style={s.switchLink}>{l.signUpLink}</Text>
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
    position: 'absolute', top: -80, right: -60,
    width: 240, height: 240, borderRadius: 120,
    backgroundColor: '#FFD97D', opacity: 0.25,
  },
  blob2: {
    position: 'absolute', bottom: 80, left: -80,
    width: 200, height: 200, borderRadius: 100,
    backgroundColor: '#6ECAC0', opacity: 0.18,
  },
  kav: { flex: 1 },
  scroll: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 32, gap: 24 },

  logoRow: { alignItems: 'center', gap: 12, paddingTop: 8 },
  logo: { width: 80, height: 80, borderRadius: 20 },
  appName: { fontSize: 22, fontWeight: '800', color: '#1A1714', letterSpacing: -0.6 },

  card: {
    backgroundColor: '#FFFFFF', borderRadius: 32, padding: 24, gap: 16,
    shadowColor: '#1A1330', shadowOpacity: 0.08, shadowRadius: 20,
    shadowOffset: { width: 0, height: 6 }, elevation: 3,
  },
  title:    { fontSize: 26, fontWeight: '800', color: '#1A1714', letterSpacing: -0.8 },
  subtitle: { fontSize: 15, color: '#6E6560', lineHeight: 22, marginTop: -8 },
  fields:   { gap: 14 },
  eyeBtn:   { paddingRight: 4 },
  eyeIcon:  { fontSize: 18 },
  error:    { fontSize: 14, color: '#E05252', fontWeight: '600' },
  success:  { fontSize: 14, color: '#3D9C72', fontWeight: '600' },

  btn: {
    backgroundColor: '#6ECAC0', borderRadius: 999,
    paddingVertical: 18, alignItems: 'center', marginTop: 4,
  },
  btnDisabled: { opacity: 0.6 },
  btnLabel:    { fontSize: 17, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.3 },
  forgotLink:  { fontSize: 14, color: '#6ECAC0', textAlign: 'center', fontWeight: '600' },

  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#EDE9E4' },
  dividerText: { fontSize: 13, color: '#A09599', fontWeight: '600' },

  googleBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    borderRadius: 999, paddingVertical: 16,
    borderWidth: 1.5, borderColor: '#E0DDD9', backgroundColor: '#FFFFFF',
  },
  googleG: { fontSize: 18, fontWeight: '800', color: '#EA4335' },
  googleLabel: { fontSize: 16, fontWeight: '700', color: '#1A1714' },

  switchRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  switchText: { fontSize: 15, color: '#6E6560' },
  switchLink: { fontSize: 15, fontWeight: '700', color: '#6ECAC0' },
  guestBtn:   { alignItems: 'center', paddingVertical: 4 },
  guestLabel: { fontSize: 14, color: '#A09599', textDecorationLine: 'underline' },
});
