import { useEffect, useState } from 'react';
import styles from '../app.module.css';
import { AppButton } from '../components/atoms/AppButton';
import { SectionHeader } from '../components/blocks/SectionHeader';
import { getDesktopRepository } from '../data/repository';

export function SettingsScreen() {
  const [apiKey, setApiKey] = useState('');
  const [ocrLanguages, setOcrLanguages] = useState('eng');
  const [status, setStatus] = useState<'idle' | 'saved' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void getDesktopRepository()
      .then(async (repo) => {
        const [apiKeyValue, ocrValue] = await Promise.all([
          repo.getAppSetting('openSubtitlesApiKey'),
          repo.getAppSetting('ocrLanguages'),
        ]);
        if (!active) {
          return;
        }
        setApiKey(apiKeyValue ?? '');
        setOcrLanguages(ocrValue ?? 'eng');
      })
      .catch((err) => {
        if (!active) {
          return;
        }
        setStatus('error');
        setError(err instanceof Error ? err.message : 'Failed to load settings.');
      });
    return () => {
      active = false;
    };
  }, []);

  const handleSave = async () => {
    try {
      const repo = await getDesktopRepository();
      await repo.setAppSetting('openSubtitlesApiKey', apiKey.trim());
      await repo.setAppSetting('ocrLanguages', ocrLanguages.trim() || 'eng');
      setStatus('saved');
      setError(null);
      setTimeout(() => setStatus('idle'), 2000);
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Failed to save settings.');
    }
  };

  return (
    <section className={styles.screen}>
      <SectionHeader title="Settings" hint="OpenSubtitles" />
      <div className={styles.libraryCreateCard}>
        <div className={styles.libraryCreateTitle}>OpenSubtitles API Key</div>
        <div className={styles.libraryCreateFields}>
          <input
            className={styles.inputField}
            placeholder="Paste your OpenSubtitles API key"
            value={apiKey}
            onChange={(event) => setApiKey(event.target.value)}
          />
        </div>
        <div className={styles.libraryCreateTitle}>OCR Languages</div>
        <div className={styles.libraryCreateFields}>
          <input
            className={styles.inputField}
            placeholder="eng,chi_sim,jpn,kor"
            value={ocrLanguages}
            onChange={(event) => setOcrLanguages(event.target.value)}
          />
          <div className={styles.sidebarHint}>
            Use Tesseract language codes, separated by commas.
          </div>
        </div>
        {status === 'saved' ? (
          <div className={styles.sidebarHint}>Saved.</div>
        ) : null}
        {status === 'error' && error ? (
          <div className={styles.errorBanner}>{error}</div>
        ) : null}
        <div className={styles.libraryCreateRow}>
          <AppButton variant="secondary" onClick={handleSave}>
            Save
          </AppButton>
        </div>
      </div>
    </section>
  );
}
