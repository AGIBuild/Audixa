import { useMemo, useState } from 'react';
import styles from '../app.module.css';
import { AppButton } from '../components/atoms/AppButton';
import { IconButton } from '../components/atoms/IconButton';
import { IconGlyph } from '../components/atoms/IconGlyph';
import { RecentList } from '../components/blocks/RecentList';
import { SectionHeader } from '../components/blocks/SectionHeader';
import { LibraryCard } from '../components/domain/LibraryCard';
import { LibraryItemCard } from '../components/domain/LibraryItemCard';
import type { Library, LibraryItem, RecentItem } from '../data/types';

type LibraryScreenProps = {
  libraries: Library[];
  libraryItems: LibraryItem[];
  activeLibraryId: string | null;
  libraryLoading: boolean;
  error: string | null;
  recentItems: RecentItem[];
  onSelectLibrary: (libraryId: string) => void;
  onSelectLibraryItem: (itemId: string) => void;
  onRefreshLibrary: () => void;
  onAddManualItem: () => void;
  onCreateManualLibrary: (name: string) => void;
  onCreateWebDavLibrary: (input: {
    name: string;
    baseUrl: string;
    username: string;
    password: string;
  }) => void;
  onCreateCloudDriveLibrary: (name: string) => void;
  onSelectRecent: (sourceId: string) => void;
  onDeleteLibrary: () => void;
  onRenameLibraryItem: (itemId: string, nextName: string) => void;
  onDeleteLibraryItem: (itemId: string) => void;
};

export function LibraryScreen({
  libraries,
  libraryItems,
  activeLibraryId,
  libraryLoading,
  error,
  recentItems,
  onSelectLibrary,
  onSelectLibraryItem,
  onRefreshLibrary,
  onAddManualItem,
  onCreateManualLibrary,
  onCreateWebDavLibrary,
  onCreateCloudDriveLibrary,
  onSelectRecent,
  onDeleteLibrary,
  onRenameLibraryItem,
  onDeleteLibraryItem,
}: LibraryScreenProps) {
  const [activeTab, setActiveTab] = useState<'library' | 'continue'>('continue');
  const activeLibrary = useMemo(
    () => libraries.find((library) => library.id === activeLibraryId) ?? null,
    [libraries, activeLibraryId],
  );
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newName, setNewName] = useState('My Library');
  const [createStep, setCreateStep] = useState<'type' | 'details'>('type');
  const [createType, setCreateType] = useState<
    'local-manual' | 'webdav' | 'cloud-drive' | null
  >(null);
  const [webDavUrl, setWebDavUrl] = useState('');
  const [webDavUser, setWebDavUser] = useState('');
  const [webDavPass, setWebDavPass] = useState('');
  const libraryTabLabel = activeLibrary?.name ?? 'Library';
  const canModifyItems = activeLibrary?.type === 'local-manual';

  const handleCreateManual = () => {
    onCreateManualLibrary(newName.trim() || 'Manual Library');
    setIsCreateOpen(false);
  };

  const handleCreateWebDav = () => {
    if (!webDavUrl.trim() || !webDavUser.trim() || !webDavPass) {
      return;
    }
    onCreateWebDavLibrary({
      name: newName.trim() || 'WebDAV Library',
      baseUrl: webDavUrl.trim(),
      username: webDavUser.trim(),
      password: webDavPass,
    });
    setIsCreateOpen(false);
  };

  const handleCreateCloud = () => {
    onCreateCloudDriveLibrary(newName.trim() || 'Cloud Library');
    setIsCreateOpen(false);
  };

  const handleOpenCreate = () => {
    setCreateStep('type');
    setCreateType(null);
    setIsCreateOpen(true);
  };

  const handleSelectLibraryCard = (libraryId: string) => {
    onSelectLibrary(libraryId);
    setActiveTab('library');
  };

  const handleCloseCreate = () => {
    setIsCreateOpen(false);
  };

  return (
    <section className={styles.screen}>
      <div className={styles.screenBody}>
        {error ? <div className={styles.errorBanner}>{error}</div> : null}
        <SectionHeader
          title="Libraries"
          hint="Your media collections"
          actions={
            <IconButton
              onClick={handleOpenCreate}
              aria-label="Create library"
              title="Create library"
            >
              <IconGlyph name="add" size={16} />
            </IconButton>
          }
        />
        {libraries.length === 0 ? (
          <div className={styles.emptyState}>Create your first library.</div>
        ) : (
          <div className={styles.scrollAreaCompact}>
            <div className={styles.libraryGrid}>
              {libraries.map((library) => (
                <LibraryCard
                  key={library.id}
                  item={library}
                  isActive={library.id === activeLibraryId}
                  onSelect={() => handleSelectLibraryCard(library.id)}
                />
              ))}
            </div>
          </div>
        )}

        <div className={styles.sectionHeader}>
          <div className={styles.sectionHeaderMain}>
            <div className={styles.tabRow}>
              <AppButton
                variant="tab"
                isActive={activeTab === 'continue'}
                activeClassName={styles.tabButtonActive}
                onClick={() => setActiveTab('continue')}
              >
                Continue Learning
              </AppButton>
              <AppButton
                variant="tab"
                isActive={activeTab === 'library'}
                activeClassName={styles.tabButtonActive}
                onClick={() => setActiveTab('library')}
              >
                {libraryTabLabel}
              </AppButton>
            </div>
            <span className={styles.libraryDetailHint}>
              {activeTab === 'library'
                ? activeLibrary
                  ? `Type: ${activeLibrary.type}`
                  : 'Select a library'
                : 'Recently played'}
            </span>
          </div>
          <div className={styles.sectionActions}>
            {activeTab === 'library'
              ? activeLibrary?.type === 'local-manual'
                ? (
                  <>
                    <IconButton
                      onClick={onAddManualItem}
                      aria-label="Add file"
                      title="Add file"
                    >
                      <IconGlyph name="add" size={16} />
                    </IconButton>
                    <IconButton
                      onClick={onDeleteLibrary}
                      aria-label="Delete library"
                      title="Delete library"
                    >
                      <IconGlyph name="trash" size={16} />
                    </IconButton>
                  </>
                )
                : activeLibrary?.type === 'webdav'
                  ? (
                    <>
                      <IconButton
                        onClick={onRefreshLibrary}
                        aria-label="Refresh library"
                        title="Refresh library"
                      >
                        <IconGlyph name="refresh" size={16} />
                      </IconButton>
                      <IconButton
                        onClick={onDeleteLibrary}
                        aria-label="Delete library"
                        title="Delete library"
                      >
                        <IconGlyph name="trash" size={16} />
                      </IconButton>
                    </>
                  )
                  : activeLibrary ? (
                    <IconButton
                      onClick={onDeleteLibrary}
                      aria-label="Delete library"
                      title="Delete library"
                    >
                      <IconGlyph name="trash" size={16} />
                    </IconButton>
                  ) : null
              : null}
          </div>
        </div>

        {activeTab === 'library' ? (
          <div className={styles.scrollArea}>
            {activeLibrary?.type === 'cloud-drive' ? (
              <div className={styles.emptyState}>
                Cloud drive integration is not connected yet.
              </div>
            ) : libraryLoading ? (
              <div className={styles.emptyState}>Loading library items...</div>
            ) : libraryItems.length === 0 ? (
              <div className={styles.emptyState}>No items in this library.</div>
            ) : (
              <div className={styles.libraryItemList}>
                {libraryItems.map((item) => (
                  <LibraryItemCard
                    key={item.id}
                    item={item}
                    onSelect={() => onSelectLibraryItem(item.id)}
                    onRename={
                      canModifyItems
                        ? (nextName) => onRenameLibraryItem(item.id, nextName)
                        : undefined
                    }
                    onDelete={canModifyItems ? () => onDeleteLibraryItem(item.id) : undefined}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className={styles.scrollArea}>
            <RecentList items={recentItems} onSelect={onSelectRecent} />
          </div>
        )}
      </div>

      {isCreateOpen ? (
        <div className={styles.modalBackdrop} role="presentation">
          <div className={styles.modalCard} role="dialog" aria-modal="true">
            <div className={styles.modalHeader}>
              <div className={styles.modalTitle}>Create Library</div>
            <IconButton
                onClick={handleCloseCreate}
              aria-label="Close"
              title="Close"
              >
              <IconGlyph name="close" size={16} />
            </IconButton>
            </div>
            <div className={styles.modalBody}>
              {createStep === 'type' ? (
                <>
                  <div className={styles.modalSectionTitle}>
                    Choose library type
                  </div>
                  <div className={styles.modalRow}>
                  <IconButton
                      onClick={() => {
                        setCreateType('local-manual');
                        setCreateStep('details');
                      }}
                    aria-label="Manual library"
                    title="Manual library"
                    >
                    <IconGlyph name="book" size={16} />
                  </IconButton>
                  <IconButton
                      onClick={() => {
                        setCreateType('webdav');
                        setCreateStep('details');
                      }}
                    aria-label="WebDAV library"
                    title="WebDAV library"
                    >
                    <IconGlyph name="link" size={16} />
                  </IconButton>
                  <IconButton
                      onClick={() => {
                        setCreateType('cloud-drive');
                        setCreateStep('details');
                      }}
                    aria-label="Cloud library"
                    title="Cloud library"
                    >
                    <IconGlyph name="cloud" size={16} />
                  </IconButton>
                  </div>
                </>
              ) : (
                <>
                  <input
                    className={styles.inputField}
                    placeholder="Library name"
                    value={newName}
                    onChange={(event) => setNewName(event.target.value)}
                  />
                  {createType === 'webdav' ? (
                    <div className={styles.modalSection}>
                      <div className={styles.modalSectionTitle}>WebDAV</div>
                      <input
                        className={styles.inputField}
                        placeholder="WebDAV URL"
                        value={webDavUrl}
                        onChange={(event) => setWebDavUrl(event.target.value)}
                      />
                      <input
                        className={styles.inputField}
                        placeholder="WebDAV username"
                        value={webDavUser}
                        onChange={(event) => setWebDavUser(event.target.value)}
                      />
                      <input
                        className={styles.inputField}
                        type="password"
                        placeholder="WebDAV password"
                        value={webDavPass}
                        onChange={(event) => setWebDavPass(event.target.value)}
                      />
                    </div>
                  ) : null}
                  <div className={styles.modalRow}>
                    <IconButton
                      onClick={() => setCreateStep('type')}
                      aria-label="Back"
                      title="Back"
                    >
                      <IconGlyph name="chevronLeft" size={16} />
                    </IconButton>
                    <IconButton
                      onClick={() => {
                        if (createType === 'local-manual') {
                          handleCreateManual();
                        } else if (createType === 'webdav') {
                          handleCreateWebDav();
                        } else if (createType === 'cloud-drive') {
                          handleCreateCloud();
                        }
                      }}
                      aria-label="Create library"
                      title="Create library"
                    >
                      <IconGlyph name="check" size={16} />
                    </IconButton>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
