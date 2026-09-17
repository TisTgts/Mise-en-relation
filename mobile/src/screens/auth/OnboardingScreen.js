import React, { useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../components/ui';
import { colors, radii, spacing } from '../../config/theme';
import { markOnboardingDone } from '../../utils/onboarding';
import { hapticLight } from '../../utils/haptics';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    key: 'match',
    icon: 'git-compare-outline',
    title: 'Trouvez le bon partenaire',
    body: 'Publiez un besoin ou une prestation, puis lancez le matching pour être mis en relation.',
  },
  {
    key: 'collab',
    icon: 'chatbubbles-outline',
    title: 'Collaborez en toute clarté',
    body: 'Suivez devis, messages et avancement dans un seul endroit, sur votre téléphone.',
  },
];

export default function OnboardingScreen({ onDone }) {
  const insets = useSafeAreaInsets();
  const listRef = useRef(null);
  const [index, setIndex] = useState(0);

  const finish = async () => {
    hapticLight();
    await markOnboardingDone();
    onDone?.();
  };

  const goNext = () => {
    hapticLight();
    if (index >= SLIDES.length - 1) {
      finish();
      return;
    }
    const next = index + 1;
    listRef.current?.scrollToIndex({ index: next, animated: true });
    setIndex(next);
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.lg }]}>
      <Pressable onPress={finish} style={styles.skip} hitSlop={12}>
        <Text style={styles.skipText}>Passer</Text>
      </Pressable>

      <View style={styles.brandRow}>
        <Image source={require('../../../assets/logo.png')} style={styles.logo} />
        <Text style={styles.brand}>Toghinis</Text>
      </View>

      <FlatList
        ref={listRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(i) => i.key}
        onMomentumScrollEnd={(e) => {
          const i = Math.round(e.nativeEvent.contentOffset.x / width);
          setIndex(i);
        }}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width }]}>
            <View style={styles.iconWrap}>
              <Ionicons name={item.icon} size={40} color={colors.primary} />
            </View>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.body}>{item.body}</Text>
          </View>
        )}
      />

      <View style={styles.dots}>
        {SLIDES.map((s, i) => (
          <View key={s.key} style={[styles.dot, i === index && styles.dotOn]} />
        ))}
      </View>

      <View style={styles.actions}>
        <Button
          title={index >= SLIDES.length - 1 ? 'Commencer' : 'Continuer'}
          onPress={goNext}
          icon={index >= SLIDES.length - 1 ? 'arrow-forward' : undefined}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  skip: {
    alignSelf: 'flex-end',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  skipText: { color: colors.textMuted, fontWeight: '600', fontSize: 15 },
  brandRow: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  logo: { width: 56, height: 56, borderRadius: 14, marginBottom: spacing.sm },
  brand: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.3,
  },
  slide: {
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrap: {
    width: 88,
    height: 88,
    borderRadius: radii.lg,
    backgroundColor: colors.primarySoft || colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.textMuted,
    textAlign: 'center',
    maxWidth: 320,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: spacing.lg,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  dotOn: { backgroundColor: colors.primary, width: 20 },
  actions: { paddingHorizontal: spacing.lg },
});
