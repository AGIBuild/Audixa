import type { SubtitleItem } from '../../data';
import { PanelHeader } from './PanelHeader';
import { SubtitleList } from '../domain/SubtitleList';

type SubtitlePanelProps = {
  items: SubtitleItem[];
  activeId: string;
  onSelect: (id: string) => void;
};

export function SubtitlePanel({ items, activeId, onSelect }: SubtitlePanelProps) {
  return (
    <>
      <PanelHeader title="Subtitle List" hint="SRT / EN-CN" />
      <SubtitleList items={items} activeId={activeId} onSelect={onSelect} />
    </>
  );
}
