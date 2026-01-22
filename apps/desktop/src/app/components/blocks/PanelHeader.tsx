import styles from '../../app.module.css';

type PanelHeaderProps = {
  title: string;
  hint?: string;
};

export function PanelHeader({ title, hint }: PanelHeaderProps) {
  return (
    <div className={styles.sidebarHeader}>
      <span>{title}</span>
      {hint ? <span className={styles.sidebarHint}>{hint}</span> : null}
    </div>
  );
}
