import styles from '../../app.module.css';
import type { SubtitleItem } from '../../data/types';
import { PanelHeader } from './PanelHeader';
import { SubtitleList } from '../domain/SubtitleList';
import { IconButton } from '../atoms/IconButton';
import { IconGlyph } from '../atoms/IconGlyph';

type SubtitlePanelProps = {
  items: SubtitleItem[];
  activeId: string;
  onSelect: (id: string) => void;
  error?: string | null;
  onToggleCollapse: () => void;
  onSaveItem: (item: SubtitleItem) => void;
  formatLabel?: string | null;
};

export function SubtitlePanel({
  items,
  activeId,
  onSelect,
  error,
  onToggleCollapse,
  onSaveItem,
  formatLabel,
}: SubtitlePanelProps) {
  const hint = getSubtitleHint(items, formatLabel);
  return (
    <>
      <PanelHeader
        title="Subtitle List"
        hint={hint}
        actions={
          <>
            <IconButton aria-label="Collapse subtitle panel" title="Collapse" onClick={onToggleCollapse}>
              <IconGlyph name="chevronRight" />
            </IconButton>
          </>
        }
      />
      {error ? <div className={styles.errorBanner}>{error}</div> : null}
      <SubtitleList items={items} activeId={activeId} onSelect={onSelect} onSave={onSaveItem} />
    </>
  );
}

function getSubtitleHint(items: SubtitleItem[], formatLabel?: string | null) {
  const format = formatLabel ? formatLabel.toUpperCase() : 'SUB';
  const hasEn = items.some((item) => item.en?.trim());
  const hasCn = items.some((item) => item.cn?.trim());
  if (!items.length) {
    return formatLabel ? `${format} / No subtitles` : 'No subtitles';
  }
  if (hasEn && hasCn) {
    return `${format} / EN-CN`;
  }
  if (hasEn) {
    return `${format} / EN`;
  }
  if (hasCn) {
    return `${format} / CN`;
  }
  return `${format} / Subtitles`;
}
