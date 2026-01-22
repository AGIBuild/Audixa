import styles from '../app.module.css';
import { AppButton } from '../components/atoms/AppButton';
import { SectionHeader } from '../components/blocks/SectionHeader';
import { MediaList } from '../components/blocks/MediaList';
import { StatRow } from '../components/blocks/StatRow';
import { VocabCard } from '../components/domain/VocabCard';
import type { VocabItem } from '../data';

type VocabularyScreenProps = {
  vocabItems: VocabItem[];
  vocabTab: string;
  onTabChange: (value: string) => void;
};

const tabs = ['Vocabulary', 'Saved Sentences', 'History'];

export function VocabularyScreen({
  vocabItems,
  vocabTab,
  onTabChange,
}: VocabularyScreenProps) {
  return (
    <section className={styles.screen}>
      <SectionHeader
        title="Vocabulary"
        actions={
          <div className={styles.tabRow}>
            {tabs.map((tab) => (
              <AppButton
                key={tab}
                variant="tab"
                isActive={vocabTab === tab}
                activeClassName={styles.tabButtonActive}
                onClick={() => onTabChange(tab)}
              >
                {tab}
              </AppButton>
            ))}
          </div>
        }
      />
      <StatRow
        items={[
          { value: '124', label: 'Words collected' },
          { value: '45', label: 'Reviewed today' },
          { value: '12h', label: 'Weekly time' },
        ]}
      />
      <MediaList
        items={vocabItems}
        variant="vocab"
        renderItem={(item) => <VocabCard key={item.id} item={item} />}
      />
    </section>
  );
}
