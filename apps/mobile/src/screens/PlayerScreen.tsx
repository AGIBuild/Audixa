import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { colors, spacing, fontSize, layoutSizes } from '@audixa/ui';
import type { RootStackScreenProps } from '../navigation/types';

type Props = RootStackScreenProps<'Player'>;

export function PlayerScreen(_props: Props) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute<Props['route']>();
  const { sourceId } = route.params;

  // Placeholder state
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [progress, setProgress] = React.useState(35);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()}>
          <Text style={styles.closeIcon}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          Now Playing
        </Text>
        <TouchableOpacity style={styles.moreButton}>
          <Text style={styles.moreIcon}>⋯</Text>
        </TouchableOpacity>
      </View>

      {/* Media Surface Placeholder */}
      <View style={styles.mediaSurface}>
        <View style={styles.mediaPlaceholder}>
          <Text style={styles.mediaIcon}>🎬</Text>
          <Text style={styles.mediaText}>Media ID: {sourceId}</Text>
        </View>
      </View>

      {/* Subtitle Display */}
      <View style={styles.subtitleContainer}>
        <Text style={styles.subtitleEn}>
          Hello, how are you today?
        </Text>
        <Text style={styles.subtitleCn}>
          你好，你今天怎么样？
        </Text>
      </View>

      {/* Timeline */}
      <View style={styles.timeline}>
        <View style={styles.timelineTrack}>
          <View style={[styles.timelineProgress, { width: `${progress}%` }]} />
          <View style={[styles.timelineThumb, { left: `${progress}%` }]} />
        </View>
        <View style={styles.timeLabels}>
          <Text style={styles.timeText}>1:23</Text>
          <Text style={styles.timeText}>3:45</Text>
        </View>
      </View>

      {/* Transport Controls */}
      <View style={[styles.transport, { paddingBottom: insets.bottom + spacing.lg }]}>
        <TouchableOpacity style={styles.controlButton}>
          <Text style={styles.controlIcon}>🔀</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlButton}>
          <Text style={styles.controlIconLarge}>⏮</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.playButton}
          onPress={() => setIsPlaying(!isPlaying)}
        >
          <Text style={styles.playIcon}>{isPlaying ? '⏸' : '▶️'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlButton}>
          <Text style={styles.controlIconLarge}>⏭</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlButton}>
          <Text style={styles.controlIcon}>🔁</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgDark,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    height: layoutSizes.navBarHeight,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: {
    fontSize: 20,
    color: colors.textMain,
  },
  headerTitle: {
    flex: 1,
    fontSize: fontSize.base,
    fontWeight: '600',
    color: colors.textMain,
    textAlign: 'center',
  },
  moreButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreIcon: {
    fontSize: 20,
    color: colors.textMain,
  },
  mediaSurface: {
    aspectRatio: 16 / 9,
    backgroundColor: colors.bgPanel,
    margin: spacing.lg,
    borderRadius: 12,
    overflow: 'hidden',
  },
  mediaPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  mediaText: {
    fontSize: fontSize.sm,
    color: colors.textDim,
  },
  subtitleContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  subtitleEn: {
    fontSize: fontSize.xl,
    fontWeight: '500',
    color: colors.textMain,
    textAlign: 'center',
    lineHeight: 28,
  },
  subtitleCn: {
    fontSize: fontSize.lg,
    color: colors.textDim,
    textAlign: 'center',
    lineHeight: 24,
  },
  timeline: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.lg,
  },
  timelineTrack: {
    height: layoutSizes.timelineHeight,
    backgroundColor: colors.bgHover,
    borderRadius: 2,
    position: 'relative',
  },
  timelineProgress: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  timelineThumb: {
    position: 'absolute',
    top: -6,
    width: layoutSizes.timelineThumbSize,
    height: layoutSizes.timelineThumbSize,
    borderRadius: layoutSizes.timelineThumbSize / 2,
    backgroundColor: colors.primary,
    marginLeft: -layoutSizes.timelineThumbSize / 2,
  },
  timeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  timeText: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  transport: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.lg,
  },
  controlButton: {
    width: layoutSizes.buttonMedium,
    height: layoutSizes.buttonMedium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlIcon: {
    fontSize: 24,
  },
  controlIconLarge: {
    fontSize: 28,
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIcon: {
    fontSize: 28,
  },
});
