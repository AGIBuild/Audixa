import styles from './app.module.css';
import {
  listeningItems,
  recentItems,
  sources,
  subtitleItems,
  vocabItems,
} from './data';
import { AppButton } from './components/atoms/AppButton';
import { LibraryScreen } from './screens/LibraryScreen';
import { ListeningScreen } from './screens/ListeningScreen';
import { PlayerScreen } from './screens/PlayerScreen';
import { VocabularyScreen } from './screens/VocabularyScreen';
import { getMaskLabel, useUiStore } from './state/uiStore';
import { usePlayerStore } from './state/playerStore';
import { usePlayerTicker } from './state/usePlayerTicker';
import { useSubtitleSync } from './state/useSubtitleSync';

const screens = [
  { id: 'library', label: 'Library' },
  { id: 'player', label: 'Player' },
  { id: 'listening', label: 'Listening Library' },
  { id: 'vocabulary', label: 'Vocabulary' },
] as const;

type ScreenId = (typeof screens)[number]['id'];

export function App() {
  const {
    activeScreen,
    maskState,
    activeSubtitle,
    listeningFilter,
    vocabTab,
    setActiveScreen,
    toggleMask,
    setActiveSubtitle,
    setListeningFilter,
    setVocabTab,
  } = useUiStore();

  const maskLabel = getMaskLabel(maskState);

  const {
    isPlaying,
    playbackRate,
    progress,
    loopState,
    loopA,
    loopB,
    togglePlay,
    toggleLoop,
    setProgress,
    cyclePlaybackRate,
  } = usePlayerStore();

  usePlayerTicker();
  useSubtitleSync(subtitleItems);

  return (
    <div className={styles.appShell}>
      <header className={styles.topNav}>
        <div className={styles.logo}>Audixa</div>
        <nav className={styles.navLinks}>
          {screens.map((screen) => (
            <AppButton
              key={screen.id}
              variant="nav"
              isActive={activeScreen === screen.id}
              activeClassName={styles.navButtonActive}
              onClick={() => setActiveScreen(screen.id)}
            >
              {screen.label}
            </AppButton>
          ))}
        </nav>
      </header>

      <main className={styles.mainArea}>
        {activeScreen === 'library' && (
          <LibraryScreen sources={sources} recentItems={recentItems} />
        )}

        {activeScreen === 'player' && (
          <PlayerScreen
            subtitleItems={subtitleItems}
            activeSubtitle={activeSubtitle}
            maskState={maskState}
            maskLabel={maskLabel}
            isPlaying={isPlaying}
            playbackRate={playbackRate}
            progress={progress}
            loopState={loopState}
            loopA={loopA}
            loopB={loopB}
            onMaskToggle={toggleMask}
            onTogglePlay={togglePlay}
            onToggleLoop={toggleLoop}
            onSeek={setProgress}
            onCycleRate={cyclePlaybackRate}
            onSelectSubtitle={setActiveSubtitle}
          />
        )}

        {activeScreen === 'listening' && (
          <ListeningScreen
            listeningItems={listeningItems}
            listeningFilter={listeningFilter}
            onFilterChange={setListeningFilter}
          />
        )}

        {activeScreen === 'vocabulary' && (
          <VocabularyScreen
            vocabItems={vocabItems}
            vocabTab={vocabTab}
            onTabChange={setVocabTab}
          />
        )}
      </main>
    </div>
  );
}

export default App;

if (import.meta.vitest) {
  // add tests related to your file here
  // For more information please visit the Vitest docs site here: https://vitest.dev/guide/in-source.html

  const { it, expect, beforeEach } = import.meta.vitest;
  let render: typeof import('@testing-library/react').render;

  beforeEach(async () => {
    render = (await import('@testing-library/react')).render;
  });

  it('should render successfully', () => {
    const { baseElement } = render(<App />);
    expect(baseElement).toBeTruthy();
  });

  it('should show the default screen', () => {
    const { getByText } = render(<App />);
    expect(getByText('Add Source')).toBeTruthy();
  });
}
