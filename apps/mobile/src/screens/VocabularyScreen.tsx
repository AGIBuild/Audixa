import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, fontSize } from '@audixa/ui';
import type { TabScreenProps } from '../navigation/types';

type Props = TabScreenProps<'Vocabulary'>;

type VocabItem = {
  id: string;
  word: string;
  definition: string;
  pronunciation: string | null;
  isFavorite: boolean;
  isMastered: boolean;
};

export function VocabularyScreen(_props: Props) {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<'all' | 'learning' | 'mastered'>('all');

  // Placeholder data
  const items: VocabItem[] = [
    { id: '1', word: 'serendipity', definition: 'The occurrence of events by chance in a happy way', pronunciation: '/ˌserənˈdɪpɪti/', isFavorite: true, isMastered: false },
    { id: '2', word: 'ephemeral', definition: 'Lasting for a very short time', pronunciation: '/ɪˈfemərəl/', isFavorite: false, isMastered: true },
    { id: '3', word: 'ubiquitous', definition: 'Present, appearing, or found everywhere', pronunciation: '/juːˈbɪkwɪtəs/', isFavorite: false, isMastered: false },
  ];

  const filteredItems = tab === 'mastered' 
    ? items.filter(i => i.isMastered)
    : tab === 'learning'
    ? items.filter(i => !i.isMastered)
    : items;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Vocabulary</Text>
        <Text style={styles.subtitle}>
          {items.length} words · {items.filter(i => i.isMastered).length} mastered
        </Text>
      </View>

      <View style={styles.tabRow}>
        {(['all', 'learning', 'mastered'] as const).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, tab === t && styles.tabActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredItems}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.wordCard}>
            <View style={styles.wordHeader}>
              <Text style={styles.word}>{item.word}</Text>
              {item.pronunciation && (
                <Text style={styles.pronunciation}>{item.pronunciation}</Text>
              )}
            </View>
            <Text style={styles.definition} numberOfLines={2}>
              {item.definition}
            </Text>
            <View style={styles.wordMeta}>
              {item.isFavorite && <Text style={styles.badge}>❤️</Text>}
              {item.isMastered && <Text style={styles.badge}>✅</Text>}
            </View>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No vocabulary items</Text>
            <Text style={styles.emptySubtext}>
              Add words from the player to build your vocabulary
            </Text>
          </View>
        }
      />
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
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.textDim,
    marginTop: spacing.xs,
  },
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  tab: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    backgroundColor: colors.bgCard,
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: fontSize.sm,
    fontWeight: '500',
    color: colors.textDim,
  },
  tabTextActive: {
    color: colors.textMain,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  wordCard: {
    backgroundColor: colors.bgCard,
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.sm,
  },
  wordHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'wrap',
    marginBottom: spacing.xs,
  },
  word: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.primary,
    marginRight: spacing.sm,
  },
  pronunciation: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  definition: {
    fontSize: fontSize.base,
    color: colors.textMain,
    lineHeight: 22,
  },
  wordMeta: {
    flexDirection: 'row',
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  badge: {
    fontSize: 14,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing['4xl'],
  },
  emptyText: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.textDim,
    marginBottom: spacing.sm,
  },
  emptySubtext: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
