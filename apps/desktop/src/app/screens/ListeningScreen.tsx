import styles from '../app.module.css';
import { AppButton } from '../components/atoms/AppButton';
import { CollectionList } from '../components/blocks/CollectionList';
import { SectionHeader } from '../components/blocks/SectionHeader';
import type { ListeningItem } from '../data';

type ListeningScreenProps = {
  listeningItems: ListeningItem[];
  listeningFilter: string;
  onFilterChange: (value: string) => void;
};

const filters = ['All', 'Recent', 'Favorites'];

export function ListeningScreen({
  listeningItems,
  listeningFilter,
  onFilterChange,
}: ListeningScreenProps) {
  return (
    <section className={styles.screen}>
      <SectionHeader
        title="Listening Library"
        actions={
          <div className={styles.filterRow}>
            {filters.map((filter) => (
              <AppButton
                key={filter}
                variant="filter"
                isActive={listeningFilter === filter}
                activeClassName={styles.filterButtonActive}
                onClick={() => onFilterChange(filter)}
              >
                {filter}
              </AppButton>
            ))}
          </div>
        }
      />
      <CollectionList items={listeningItems} />
    </section>
  );
}
