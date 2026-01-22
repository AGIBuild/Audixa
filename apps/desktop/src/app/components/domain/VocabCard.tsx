import styles from '../../app.module.css';
import type { VocabItem } from '../../data';
import { Card } from '../atoms/Card';
import { VocabBody } from './VocabBody';
import { VocabHeader } from './VocabHeader';

type VocabCardProps = {
  item: VocabItem;
};

export function VocabCard({ item }: VocabCardProps) {
  return (
    <Card className={styles.vocabCard}>
      <VocabHeader word={item.word} phonetic={item.phonetic} />
      <VocabBody
        definition={item.definition}
        example={item.example}
        source={item.source}
      />
    </Card>
  );
}
