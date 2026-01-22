import styles from '../app.module.css';
import { PlayerControls } from '../components/blocks/PlayerControls';
import { SubtitleOverlay } from '../components/blocks/SubtitleOverlay';
import { SubtitlePanel } from '../components/blocks/SubtitlePanel';
import type { SubtitleItem } from '../data';

type PlayerScreenProps = {
  subtitleItems: SubtitleItem[];
  activeSubtitle: string;
  maskState: number;
  maskLabel: string;
  abState: number;
  onMaskToggle: () => void;
  onAbToggle: () => void;
  onSelectSubtitle: (id: string) => void;
};

export function PlayerScreen({
  subtitleItems,
  activeSubtitle,
  maskState,
  maskLabel,
  abState,
  onMaskToggle,
  onAbToggle,
  onSelectSubtitle,
}: PlayerScreenProps) {
  return (
    <section className={`${styles.screen} ${styles.playerScreen}`}>
      <div className={styles.playerLayout}>
        <div className={styles.videoArea}>
          <div className={styles.videoPlaceholder}>Video</div>
          <SubtitleOverlay maskState={maskState} />
        </div>

        <aside className={styles.playerSidebar}>
          <SubtitlePanel
            items={subtitleItems}
            activeId={activeSubtitle}
            onSelect={onSelectSubtitle}
          />
        </aside>

        <PlayerControls
          maskLabel={maskLabel}
          abState={abState}
          onMaskToggle={onMaskToggle}
          onAbToggle={onAbToggle}
        />
      </div>
    </section>
  );
}
