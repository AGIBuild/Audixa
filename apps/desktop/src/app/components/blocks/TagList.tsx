import styles from '../../app.module.css';
import { Chip } from '../atoms/Chip';

type TagListProps = {
  tags: string[];
  className?: string;
};

export function TagList({ tags, className }: TagListProps) {
  const classes = [styles.tagRow, className].filter(Boolean).join(' ');
  return (
    <div className={classes}>
      {tags.map((tag) => (
        <Chip key={tag}>{tag}</Chip>
      ))}
    </div>
  );
}
