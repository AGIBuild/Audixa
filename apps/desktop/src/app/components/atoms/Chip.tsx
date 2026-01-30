import type { HTMLAttributes } from 'react';
import styles from '../../app.module.css';

type ChipProps = HTMLAttributes<HTMLSpanElement>;

export function Chip({ className, ...props }: ChipProps) {
  const classes = [styles.tag, className].filter(Boolean).join(' ');
  return <span className={classes} {...props} />;
}
