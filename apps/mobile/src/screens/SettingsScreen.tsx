import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, fontSize } from '@audixa/ui';
import type { TabScreenProps } from '../navigation/types';

type Props = TabScreenProps<'Settings'>;

type SettingItemProps = {
  title: string;
  subtitle?: string;
  rightElement?: React.ReactNode;
  onPress?: () => void;
};

function SettingItem({ title, subtitle, rightElement, onPress }: SettingItemProps) {
  return (
    <TouchableOpacity style={styles.settingItem} onPress={onPress} disabled={!onPress}>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      {rightElement}
    </TouchableOpacity>
  );
}

function SettingSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionContent}>{children}</View>
    </View>
  );
}

export function SettingsScreen(_props: Props) {
  const insets = useSafeAreaInsets();
  const [autoPlay, setAutoPlay] = React.useState(true);
  const [showTranslation, setShowTranslation] = React.useState(true);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <SettingSection title="Playback">
          <SettingItem
            title="Auto-play next"
            subtitle="Automatically play next item in queue"
            rightElement={
              <Switch
                value={autoPlay}
                onValueChange={setAutoPlay}
                trackColor={{ false: colors.bgHover, true: colors.primaryDark }}
                thumbColor={autoPlay ? colors.primary : colors.textDim}
              />
            }
          />
          <SettingItem
            title="Default playback speed"
            subtitle="1.0x"
            onPress={() => {}}
          />
        </SettingSection>

        <SettingSection title="Subtitles">
          <SettingItem
            title="Show translation"
            subtitle="Display Chinese translation"
            rightElement={
              <Switch
                value={showTranslation}
                onValueChange={setShowTranslation}
                trackColor={{ false: colors.bgHover, true: colors.primaryDark }}
                thumbColor={showTranslation ? colors.primary : colors.textDim}
              />
            }
          />
          <SettingItem
            title="Subtitle font size"
            subtitle="Medium"
            onPress={() => {}}
          />
          <SettingItem
            title="Subtitle style"
            subtitle="Default"
            onPress={() => {}}
          />
        </SettingSection>

        <SettingSection title="Storage">
          <SettingItem
            title="Clear cache"
            subtitle="Free up storage space"
            onPress={() => {}}
          />
          <SettingItem
            title="Export vocabulary"
            onPress={() => {}}
          />
        </SettingSection>

        <SettingSection title="About">
          <SettingItem
            title="Version"
            subtitle="0.0.1"
          />
          <SettingItem
            title="Open source licenses"
            onPress={() => {}}
          />
        </SettingSection>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgDark,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  title: {
    fontSize: fontSize['2xl'],
    fontWeight: '700',
    color: colors.textMain,
  },
  scrollContent: {
    paddingBottom: spacing['4xl'],
  },
  section: {
    marginTop: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textDim,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  sectionContent: {
    backgroundColor: colors.bgPanel,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: fontSize.base,
    color: colors.textMain,
  },
  settingSubtitle: {
    fontSize: fontSize.sm,
    color: colors.textDim,
    marginTop: 2,
  },
});
