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
  isPlaying: boolean;
  playbackRate: number;
  progress: number;
  loopState: number;
  loopA: number;
  loopB: number;
  onMaskToggle: () => void;
  onTogglePlay: () => void;
  onToggleLoop: () => void;
  onSeek: (value: number) => void;
  onCycleRate: () => void;
  onSelectSubtitle: (id: string) => void;
};

export function PlayerScreen({
  subtitleItems,
  activeSubtitle,
  maskState,
  maskLabel,
  isPlaying,
  playbackRate,
  progress,
  loopState,
  loopA,
  loopB,
  onMaskToggle,
  onTogglePlay,
  onToggleLoop,
  onSeek,
  onCycleRate,
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
          isPlaying={isPlaying}
          playbackRate={playbackRate}
          progress={progress}
          loopState={loopState}
          loopA={loopA}
          loopB={loopB}
          onMaskToggle={onMaskToggle}
          onTogglePlay={onTogglePlay}
          onToggleLoop={onToggleLoop}
          onSeek={onSeek}
          onCycleRate={onCycleRate}
        />
      </div>
    </section>
  );
}
