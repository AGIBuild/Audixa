import styles from '../../app.module.css';
import { StatCard } from '../domain/StatCard';

type StatItem = {
  value: string;
  label: string;
};

type StatRowProps = {
  items: StatItem[];
};

export function StatRow({ items }: StatRowProps) {
  return (
    <div className={styles.statsRow}>
      {items.map((item) => (
        <StatCard key={item.label} value={item.value} label={item.label} />
      ))}
    </div>
  );
}
