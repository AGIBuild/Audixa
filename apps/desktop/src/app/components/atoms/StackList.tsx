import type { HTMLAttributes } from 'react';
import styles from '../../app.module.css';

type ListVariant = 'recent' | 'subtitle' | 'vocab';

const variantClasses: Record<ListVariant, string> = {
  recent: styles.recentList,
  subtitle: styles.subtitleList,
  vocab: styles.vocabList,
};

type StackListProps = HTMLAttributes<HTMLDivElement> & {
  variant: ListVariant;
};

export function StackList({ variant, className, ...props }: StackListProps) {
  const classes = [variantClasses[variant], className].filter(Boolean).join(' ');
  return <div className={classes} {...props} />;
}
