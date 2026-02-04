import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, fontSize } from '@audixa/ui';
import type { TabScreenProps } from '../navigation/types';

type Props = TabScreenProps<'Library'>;

export function LibraryScreen(_props: Props) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  // Placeholder data
  const libraries = [
    { id: '1', name: 'Local Files', itemCount: 12 },
    { id: '2', name: 'Downloads', itemCount: 5 },
  ];

  const recentItems = [
    { id: 'r1', title: 'English Podcast Episode 42', kind: 'audio' as const },
    { id: 'r2', title: 'Movie - The Shawshank Redemption', kind: 'video' as const },
  ];

  const handleItemPress = (itemId: string) => {
    navigation.navigate('Player', { sourceId: itemId });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Library</Text>
      </View>

      <FlatList
        data={libraries}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Libraries</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.libraryCard}>
            <Text style={styles.libraryName}>{item.name}</Text>
            <Text style={styles.libraryCount}>{item.itemCount} items</Text>
          </TouchableOpacity>
        )}
        ListFooterComponent={
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Recent</Text>
            </View>
            {recentItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.recentCard}
                onPress={() => handleItemPress(item.id)}
              >
                <View style={styles.recentIcon}>
                  <Text style={styles.recentIconText}>
                    {item.kind === 'audio' ? '🎵' : '🎬'}
                  </Text>
                </View>
                <Text style={styles.recentTitle} numberOfLines={1}>
                  {item.title}
                </Text>
              </TouchableOpacity>
            ))}
          </>
        }
        contentContainerStyle={styles.listContent}
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
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  section: {
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textDim,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  libraryCard: {
    backgroundColor: colors.bgCard,
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.sm,
  },
  libraryName: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.textMain,
  },
  libraryCount: {
    fontSize: fontSize.sm,
    color: colors.textDim,
    marginTop: spacing.xs,
  },
  recentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  recentIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: colors.bgHover,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  recentIconText: {
    fontSize: 20,
  },
  recentTitle: {
    flex: 1,
    fontSize: fontSize.base,
    color: colors.textMain,
  },
});
