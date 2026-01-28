import type { ReactNode } from 'react';
import styles from '../../app.module.css';

type PanelHeaderProps = {
  title: string;
  hint?: string;
  actions?: ReactNode;
};

export function PanelHeader({ title, hint, actions }: PanelHeaderProps) {
  return (
    <div className={styles.sidebarHeader}>
      <span>{title}</span>
      <div className={styles.sidebarHeaderActions}>
        {hint ? <span className={styles.sidebarHint}>{hint}</span> : null}
        {actions}
      </div>
    </div>
  );
}
