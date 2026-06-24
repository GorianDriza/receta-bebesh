import { useEffect, useRef } from 'react';
import { Animated, Image, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

type Props = { onDone: () => void };

export function SplashScreen({ onDone }: Props) {
  const logoOpacity  = useRef(new Animated.Value(0)).current;
  const logoScale    = useRef(new Animated.Value(0.72)).current;
  const textOpacity  = useRef(new Animated.Value(0)).current;
  const screenOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      // logo pops in
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1, duration: 600, useNativeDriver: true,
        }),
        Animated.spring(logoScale, {
          toValue: 1, tension: 55, friction: 7, useNativeDriver: true,
        }),
      ]),
      // tagline fades in
      Animated.timing(textOpacity, {
        toValue: 1, duration: 400, useNativeDriver: true,
      }),
      // hold
      Animated.delay(1100),
      // everything fades out
      Animated.timing(screenOpacity, {
        toValue: 0, duration: 520, useNativeDriver: true,
      }),
    ]).start(() => onDone());
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Animated.View style={[s.root, { opacity: screenOpacity }]}>
      <View style={s.blob1} />
      <View style={s.blob2} />

      <Animated.View
        style={[s.logoWrap, { opacity: logoOpacity, transform: [{ scale: logoScale }] }]}
      >
        <Image
          source={require('../../assets/icon.png')}
          style={s.logo}
          resizeMode="contain"
        />
      </Animated.View>

      <Animated.View style={{ opacity: textOpacity }}>
        <Text style={s.tagline}>Receta Bebesh</Text>
        <Text style={s.sub}>ushqim i shëndetshëm për beben tuaj</Text>
      </Animated.View>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFill,
    zIndex: 999,
    backgroundColor: '#FFF9F5',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 28,
  },
  blob1: {
    position: 'absolute',
    top: -80, right: -60,
    width: 280, height: 280,
    borderRadius: 140,
    backgroundColor: '#FFD97D',
    opacity: 0.28,
  },
  blob2: {
    position: 'absolute',
    bottom: -60, left: -80,
    width: 260, height: 260,
    borderRadius: 130,
    backgroundColor: '#6ECAC0',
    opacity: 0.22,
  },
  logoWrap: {
    shadowColor: '#F09080',
    shadowOpacity: 0.22,
    shadowRadius: 32,
    shadowOffset: { width: 0, height: 12 },
  },
  logo: {
    width: 168,
    height: 168,
    borderRadius: 38,
  },
  tagline: {
    textAlign: 'center',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.8,
    color: '#1A1714',
  },
  sub: {
    textAlign: 'center',
    marginTop: 4,
    fontSize: 14,
    color: '#6E6560',
  },
});
