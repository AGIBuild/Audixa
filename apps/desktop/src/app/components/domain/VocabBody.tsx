import styles from '../../app.module.css';

type VocabBodyProps = {
  definition: string;
  example: string;
  source: string;
};

export function VocabBody({ definition, example, source }: VocabBodyProps) {
  return (
    <>
      <div className={styles.vocabDefinition}>{definition}</div>
      <div className={styles.vocabExample}>{example}</div>
      <div className={styles.vocabSource}>Source: {source}</div>
    </>
  );
}
