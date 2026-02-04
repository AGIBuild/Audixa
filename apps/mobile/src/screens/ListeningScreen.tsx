import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, fontSize } from '@audixa/ui';
import type { TabScreenProps } from '../navigation/types';

type Props = TabScreenProps<'Listening'>;

type ListeningItem = {
  id: string;
  title: string;
  source: string;
  duration: string;
  isFavorite: boolean;
};

export function ListeningScreen(_props: Props) {
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<'all' | 'favorites'>('all');

  // Placeholder data
  const items: ListeningItem[] = [
    { id: '1', title: 'Hello, how are you today?', source: 'English Podcast', duration: '0:03', isFavorite: true },
    { id: '2', title: 'The weather is beautiful', source: 'Daily Conversation', duration: '0:05', isFavorite: false },
    { id: '3', title: 'I would like to order coffee', source: 'Travel English', duration: '0:04', isFavorite: true },
  ];

  const filteredItems = filter === 'favorites' ? items.filter(i => i.isFavorite) : items;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Listening Library</Text>
      </View>

      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
            All
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'favorites' && styles.filterButtonActive]}
          onPress={() => setFilter('favorites')}
        >
          <Text style={[styles.filterText, filter === 'favorites' && styles.filterTextActive]}>
            Favorites
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredItems}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.itemCard}>
            <View style={styles.itemContent}>
              <Text style={styles.itemTitle} numberOfLines={2}>
                {item.title}
              </Text>
              <View style={styles.itemMeta}>
                <Text style={styles.itemSource}>{item.source}</Text>
                <Text style={styles.itemDuration}>{item.duration}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.favoriteButton}>
              <Text style={styles.favoriteIcon}>
                {item.isFavorite ? '❤️' : '🤍'}
              </Text>
            </TouchableOpacity>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No listening items yet</Text>
            <Text style={styles.emptySubtext}>
              Save sentences from the player to practice listening
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
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  filterButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    backgroundColor: colors.bgCard,
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
  },
  filterText: {
    fontSize: fontSize.sm,
    fontWeight: '500',
    color: colors.textDim,
  },
  filterTextActive: {
    color: colors.textMain,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    fontSize: fontSize.base,
    fontWeight: '500',
    color: colors.textMain,
    marginBottom: spacing.xs,
  },
  itemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  itemSource: {
    fontSize: fontSize.sm,
    color: colors.textDim,
  },
  itemDuration: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  favoriteButton: {
    padding: spacing.sm,
  },
  favoriteIcon: {
    fontSize: 20,
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
