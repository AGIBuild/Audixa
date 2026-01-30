import type { ReactNode } from 'react';
import styles from '../../app.module.css';

type SectionHeaderProps = {
  title: string;
  hint?: string;
  actions?: ReactNode;
};

export function SectionHeader({ title, hint, actions }: SectionHeaderProps) {
  return (
    <div className={styles.sectionHeader}>
      <div className={styles.sectionHeaderMain}>
        <h2>{title}</h2>
        {hint ? <span className={styles.sectionHint}>{hint}</span> : null}
      </div>
      {actions ? <div className={styles.sectionActions}>{actions}</div> : null}
    </div>
  );
}
