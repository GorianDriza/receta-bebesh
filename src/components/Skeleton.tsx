import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, ViewStyle } from 'react-native';

type Props = { width?: number | string; height: number; borderRadius?: number; style?: ViewStyle };

export function Skeleton({ width = '100%', height, borderRadius = 12, style }: Props) {
  const opacity = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.75, duration: 650, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.35, duration: 650, useNativeDriver: true }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        s.bone,
        { width: width as any, height, borderRadius, opacity },
        style,
      ]}
    />
  );
}

export function RecipeCardSkeleton() {
  return (
    <View style={s.card}>
      <View style={s.cardTop}>
        <View style={s.cardLeft}>
          <Skeleton width="75%" height={22} borderRadius={8} style={s.mb8} />
          <Skeleton width="55%" height={16} borderRadius={6} />
          <View style={s.durationRow}>
            <Skeleton width={80} height={14} borderRadius={7} />
          </View>
        </View>
        <Skeleton width={126} height={126} borderRadius={63} />
      </View>
    </View>
  );
}

export function SlotSkeleton() {
  return (
    <View style={s.slot}>
      <View style={s.slotHeader}>
        <Skeleton width={28} height={28} borderRadius={14} style={s.mr8} />
        <Skeleton width="40%" height={18} borderRadius={6} />
      </View>
      <View style={s.slotRow}>
        <Skeleton width={64} height={64} borderRadius={14} style={s.mr12} />
        <Skeleton width="55%" height={16} borderRadius={6} />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  bone: { backgroundColor: '#D0CAC5' },

  card: {
    minHeight: 176, borderRadius: 30,
    backgroundColor: '#FFFFF0',
    padding: 18, overflow: 'hidden',
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardLeft: { flex: 1, paddingRight: 16, gap: 8, justifyContent: 'center' },
  mb8: { marginBottom: 0 },
  durationRow: { marginTop: 14 },

  slot: {
    borderRadius: 24, backgroundColor: '#FFFFFF',
    padding: 16, gap: 14,
  },
  slotHeader: { flexDirection: 'row', alignItems: 'center' },
  slotRow: { flexDirection: 'row', alignItems: 'center' },
  mr8: { marginRight: 8 },
  mr12: { marginRight: 12 },
});
