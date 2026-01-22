import styles from '../app.module.css';
import { RecentList } from '../components/blocks/RecentList';
import { SectionHeader } from '../components/blocks/SectionHeader';
import { SourceGrid } from '../components/blocks/SourceGrid';
import type { RecentItem, SourceItem } from '../data';

type LibraryScreenProps = {
  sources: SourceItem[];
  recentItems: RecentItem[];
};

export function LibraryScreen({ sources, recentItems }: LibraryScreenProps) {
  return (
    <section className={styles.screen}>
      <SectionHeader title="Add Source" hint="All sources in one place" />
      <SourceGrid sources={sources} />

      <SectionHeader title="Continue Learning" hint="Recently played" />
      <RecentList items={recentItems} />
    </section>
  );
}
