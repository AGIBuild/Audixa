import styles from '../../app.module.css';

type ProgressVariant = 'default' | 'compact';

const variantClasses: Record<ProgressVariant, { track: string; fill: string }> = {
  default: {
    track: styles.progressBar,
    fill: styles.progressFill,
  },
  compact: {
    track: styles.progressTrackSmall,
    fill: styles.progressActive,
  },
};

type ProgressBarProps = {
  value: number;
  variant?: ProgressVariant;
};

export function ProgressBar({ value, variant = 'default' }: ProgressBarProps) {
  const classes = variantClasses[variant];
  return (
    <div className={classes.track}>
      <div className={classes.fill} style={{ width: `${value}%` }} />
    </div>
  );
}
