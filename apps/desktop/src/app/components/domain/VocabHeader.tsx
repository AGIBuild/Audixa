import styles from '../../app.module.css';
import { IconButton } from '../atoms/IconButton';

type VocabHeaderProps = {
  word: string;
  phonetic: string;
};

export function VocabHeader({ word, phonetic }: VocabHeaderProps) {
  return (
    <div className={styles.vocabHeader}>
      <div className={styles.vocabWord}>
        {word}
        <span className={styles.vocabPhonetic}>{phonetic}</span>
      </div>
      <IconButton className={styles.audioButton}>Audio</IconButton>
    </div>
  );
}
