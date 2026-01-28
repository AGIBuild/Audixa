import styles from '../../app.module.css';

type VocabHeaderProps = {
  word: string;
  pronunciation: string | null;
};

export function VocabHeader({ word, pronunciation }: VocabHeaderProps) {
  return (
    <div className={styles.vocabHeader}>
      <div className={styles.vocabWord}>
        {word}
        {pronunciation ? (
          <span className={styles.vocabPhonetic}>{pronunciation}</span>
        ) : null}
      </div>
    </div>
  );
}
