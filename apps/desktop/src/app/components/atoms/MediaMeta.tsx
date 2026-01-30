import styles from '../../app.module.css';

type MediaMetaProps = {
  title: string;
  subtitle?: string;
  titleClassName?: string;
  subtitleClassName?: string;
  className?: string;
};

export function MediaMeta({
  title,
  subtitle,
  titleClassName,
  subtitleClassName,
  className,
}: MediaMetaProps) {
  const titleClasses = [styles.itemTitle, titleClassName].filter(Boolean).join(' ');
  const subtitleClasses = [styles.itemMeta, subtitleClassName].filter(Boolean).join(' ');

  return (
    <div className={className}>
      <div className={titleClasses}>{title}</div>
      {subtitle ? <div className={subtitleClasses}>{subtitle}</div> : null}
    </div>
  );
}
