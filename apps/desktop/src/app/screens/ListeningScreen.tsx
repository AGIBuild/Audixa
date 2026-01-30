import styles from '../app.module.css';
import { AppButton } from '../components/atoms/AppButton';
import { CollectionList } from '../components/blocks/CollectionList';
import { SectionHeader } from '../components/blocks/SectionHeader';
import type { ListeningItem } from '../data/types';

type ListeningScreenProps = {
  listeningItems: ListeningItem[];
  listeningFilter: string;
  onFilterChange: (value: string) => void;
  onSelectItem: (listeningItemId: string) => void;
  onEditTitle: (id: string, title: string) => void;
  onToggleFavorite: (id: string) => void;
  onDeleteItem: (id: string) => void;
};

const filters = ['All', 'Recent', 'Favorites'];

export function ListeningScreen({
  listeningItems,
  listeningFilter,
  onFilterChange,
  onSelectItem,
  onEditTitle,
  onToggleFavorite,
  onDeleteItem,
}: ListeningScreenProps) {
  const filteredItems = listeningItems
    .filter((item) => {
      if (listeningFilter === 'Favorites') {
        return item.isFavorite;
      }
      return true;
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const displayItems =
    listeningFilter === 'Recent' ? filteredItems.slice(0, 20) : filteredItems;
  return (
    <section className={styles.screen}>
      <div className={styles.screenBody}>
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
        <div className={styles.scrollArea}>
          <CollectionList
            items={displayItems}
            compact
            onSelect={onSelectItem}
            onEditTitle={onEditTitle}
            onToggleFavorite={onToggleFavorite}
            onDelete={onDeleteItem}
          />
        </div>
      </div>
    </section>
  );
}
