import type { HTMLAttributes } from 'react';
import styles from '../../app.module.css';

type CardProps = HTMLAttributes<HTMLDivElement>;

export function Card({ className, ...props }: CardProps) {
  const classes = [styles.cardBase, className].filter(Boolean).join(' ');
  return <div className={classes} {...props} />;
}
