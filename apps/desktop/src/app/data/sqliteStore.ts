import type {
  DesktopDataStore,
  AppStateRecord,
  LibraryCredentialRecord,
  LibraryItemRecord,
  LibraryRecord,
  LibrarySourceRecord,
  ListeningItemRecord,
  MediaSourceRecord,
  RecentPlaybackRecord,
  SubtitleTrackRecord,
  VocabItemRecord,
} from './store';
import type { SqlClient } from './sqliteClient';

export function createSqliteStore(client: SqlClient): DesktopDataStore {
  return {
    async listMediaSources() {
      return client.select<MediaSourceRecord>(
        `SELECT id, title, uri, kind, created_at as createdAt, updated_at as updatedAt
         FROM media_sources
         ORDER BY updated_at DESC`,
      );
    },
    async findMediaSourceByUri(uri) {
      const rows = await client.select<MediaSourceRecord>(
        `SELECT id, title, uri, kind, created_at as createdAt, updated_at as updatedAt
         FROM media_sources
         WHERE uri = ?
         LIMIT 1`,
        [uri],
      );
      return rows[0] ?? null;
    },
    async insertMediaSource(record) {
      await client.execute(
        `INSERT INTO media_sources (id, title, uri, kind, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          record.id,
          record.title,
          record.uri,
          record.kind,
          record.createdAt,
          record.updatedAt,
        ],
      );
    },
    async updateMediaSource(record) {
      await client.execute(
        `UPDATE media_sources
         SET title = ?, uri = ?, kind = ?, updated_at = ?
         WHERE id = ?`,
        [record.title, record.uri, record.kind, record.updatedAt, record.id],
      );
    },
    async listRecentPlaybacks() {
      return client.select<RecentPlaybackRecord>(
        `SELECT id, media_source_id as mediaSourceId, progress, last_played_at as lastPlayedAt
         FROM recent_playbacks
         ORDER BY last_played_at DESC`,
      );
    },
    async upsertRecentPlayback(record) {
      await client.execute(
        `INSERT INTO recent_playbacks (id, media_source_id, progress, last_played_at)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(media_source_id) DO UPDATE SET
           progress = excluded.progress,
           last_played_at = excluded.last_played_at`,
        [
          record.id,
          record.mediaSourceId,
          record.progress,
          record.lastPlayedAt,
        ],
      );
    },
    async listSubtitleTracks(mediaSourceId) {
      return client.select<SubtitleTrackRecord>(
        `SELECT id, media_source_id as mediaSourceId, language, uri, created_at as createdAt
         FROM subtitle_tracks
         WHERE media_source_id = ?
         ORDER BY created_at DESC`,
        [mediaSourceId],
      );
    },
    async insertSubtitleTrack(record) {
      await client.execute(
        `INSERT INTO subtitle_tracks (id, media_source_id, language, uri, created_at)
         VALUES (?, ?, ?, ?, ?)`,
        [
          record.id,
          record.mediaSourceId,
          record.language,
          record.uri,
          record.createdAt,
        ],
      );
    },
    async listListeningItems() {
      return client.select<ListeningItemRecord>(
        `SELECT id,
          media_source_id as mediaSourceId,
          sentence_id as sentenceId,
          sentence_text as sentenceText,
          start_ms as startMs,
          end_ms as endMs,
          created_at as createdAt,
          title_override as titleOverride,
          is_favorite as isFavorite
         FROM listening_items
         ORDER BY created_at DESC`,
      );
    },
    async insertListeningItem(record) {
      await client.execute(
        `INSERT INTO listening_items (
          id,
          media_source_id,
          sentence_id,
          sentence_text,
          start_ms,
          end_ms,
          created_at,
          title_override,
          is_favorite
        )
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          record.id,
          record.mediaSourceId,
          record.sentenceId,
          record.sentenceText,
          record.startMs,
          record.endMs,
          record.createdAt,
          record.titleOverride ?? null,
          record.isFavorite ?? 0,
        ],
      );
    },
    async updateListeningItemTitle(id, title) {
      await client.execute(
        `UPDATE listening_items SET title_override = ? WHERE id = ?`,
        [title, id],
      );
    },
    async updateListeningItemFavorite(id, isFavorite) {
      await client.execute(
        `UPDATE listening_items SET is_favorite = ? WHERE id = ?`,
        [isFavorite, id],
      );
    },
    async deleteListeningItem(id) {
      await client.execute(`DELETE FROM listening_items WHERE id = ?`, [id]);
    },
    async listVocabItems() {
      return client.select<VocabItemRecord>(
        `SELECT id, word, canonical_word as canonicalWord, locale, definition, example, source,
          pronunciation, is_favorite as isFavorite, is_mastered as isMastered,
          created_at as createdAt, last_seen_at as lastSeenAt
         FROM vocab_items
         ORDER BY last_seen_at DESC`,
      );
    },
    async upsertVocabItem(record) {
      await client.execute(
        `INSERT INTO vocab_items (
          id,
          word,
          canonical_word,
          locale,
          definition,
          example,
          source,
          pronunciation,
          is_favorite,
          is_mastered,
          created_at,
          last_seen_at
        )
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(canonical_word, locale) DO UPDATE SET
           word = excluded.word,
           definition = excluded.definition,
           example = excluded.example,
           source = excluded.source,
           pronunciation = excluded.pronunciation,
           is_favorite = excluded.is_favorite,
           is_mastered = excluded.is_mastered,
           last_seen_at = excluded.last_seen_at`,
        [
          record.id,
          record.word,
          record.canonicalWord,
          record.locale,
          record.definition,
          record.example,
          record.source,
          record.pronunciation ?? null,
          record.isFavorite ?? 0,
          record.isMastered ?? 0,
          record.createdAt,
          record.lastSeenAt,
        ],
      );
    },
    async updateVocabItem(record) {
      await client.execute(
        `UPDATE vocab_items
         SET word = ?,
           canonical_word = ?,
           locale = ?,
           definition = ?,
           example = ?,
           source = ?,
           pronunciation = ?,
           is_favorite = ?,
           is_mastered = ?,
           created_at = ?,
           last_seen_at = ?
         WHERE id = ?`,
        [
          record.word,
          record.canonicalWord,
          record.locale,
          record.definition,
          record.example,
          record.source,
          record.pronunciation ?? null,
          record.isFavorite ?? 0,
          record.isMastered ?? 0,
          record.createdAt,
          record.lastSeenAt,
          record.id,
        ],
      );
    },
    async deleteVocabItem(id) {
      await client.execute(`DELETE FROM vocab_items WHERE id = ?`, [id]);
    },
    async listLibraries() {
      return client.select<LibraryRecord>(
        `SELECT id, name, type, created_at as createdAt, updated_at as updatedAt
         FROM libraries
         ORDER BY updated_at DESC`,
      );
    },
    async insertLibrary(record) {
      await client.execute(
        `INSERT INTO libraries (id, name, type, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?)`,
        [
          record.id,
          record.name,
          record.type,
          record.createdAt,
          record.updatedAt,
        ],
      );
    },
    async updateLibraryTimestamp(libraryId, updatedAt) {
      await client.execute(
        `UPDATE libraries
         SET updated_at = ?
         WHERE id = ?`,
        [updatedAt, libraryId],
      );
    },
    async listLibrarySources(libraryId) {
      return client.select<LibrarySourceRecord>(
        `SELECT id, library_id as libraryId, kind, path_or_url as pathOrUrl,
          metadata_json as metadataJson, created_at as createdAt
         FROM library_sources
         WHERE library_id = ?
         ORDER BY created_at ASC`,
        [libraryId],
      );
    },
    async insertLibrarySource(record) {
      await client.execute(
        `INSERT INTO library_sources (id, library_id, kind, path_or_url, metadata_json, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          record.id,
          record.libraryId,
          record.kind,
          record.pathOrUrl,
          record.metadataJson,
          record.createdAt,
        ],
      );
    },
    async listLibraryItems(libraryId) {
      return client.select<LibraryItemRecord>(
        `SELECT id, library_id as libraryId, source_id as sourceId, title, uri, kind,
          created_at as createdAt, updated_at as updatedAt
         FROM library_items
         WHERE library_id = ?
         ORDER BY updated_at DESC`,
        [libraryId],
      );
    },
    async upsertLibraryItem(record) {
      await client.execute(
        `INSERT INTO library_items (id, library_id, source_id, title, uri, kind, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(library_id, uri) DO UPDATE SET
           source_id = excluded.source_id,
           title = excluded.title,
           kind = excluded.kind,
           updated_at = excluded.updated_at`,
        [
          record.id,
          record.libraryId,
          record.sourceId,
          record.title,
          record.uri,
          record.kind,
          record.createdAt,
          record.updatedAt,
        ],
      );
    },
    async updateLibraryItem(record) {
      await client.execute(
        `UPDATE library_items
         SET title = ?, uri = ?, kind = ?, updated_at = ?
         WHERE id = ?`,
        [record.title, record.uri, record.kind, record.updatedAt, record.id],
      );
    },
    async deleteLibraryItemByUri(libraryId, uri) {
      await client.execute(
        `DELETE FROM library_items
         WHERE library_id = ? AND uri = ?`,
        [libraryId, uri],
      );
    },
    async deleteLibraryItem(id) {
      await client.execute(`DELETE FROM library_items WHERE id = ?`, [id]);
    },
    async deleteLibraryItemsByLibraryId(libraryId) {
      await client.execute(
        `DELETE FROM library_items
         WHERE library_id = ?`,
        [libraryId],
      );
    },
    async deleteLibrarySourcesByLibraryId(libraryId) {
      await client.execute(
        `DELETE FROM library_sources
         WHERE library_id = ?`,
        [libraryId],
      );
    },
    async deleteLibraryCredentialsByLibraryId(libraryId) {
      await client.execute(
        `DELETE FROM library_credentials
         WHERE library_id = ?`,
        [libraryId],
      );
    },
    async deleteLibrary(libraryId) {
      await client.execute(
        `DELETE FROM libraries
         WHERE id = ?`,
        [libraryId],
      );
    },
    async listLibraryCredentials(libraryId) {
      return client.select<LibraryCredentialRecord>(
        `SELECT id, library_id as libraryId, keyring_key as keyringKey, created_at as createdAt
         FROM library_credentials
         WHERE library_id = ?
         LIMIT 1`,
        [libraryId],
      );
    },
    async upsertLibraryCredential(record) {
      await client.execute(
        `INSERT INTO library_credentials (id, library_id, keyring_key, created_at)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(library_id) DO UPDATE SET
           keyring_key = excluded.keyring_key,
           created_at = excluded.created_at`,
        [
          record.id,
          record.libraryId,
          record.keyringKey,
          record.createdAt,
        ],
      );
    },
    async getAppState(key) {
      const rows = await client.select<AppStateRecord>(
        `SELECT key, value, updated_at as updatedAt
         FROM app_state
         WHERE key = ?
         LIMIT 1`,
        [key],
      );
      return rows[0] ?? null;
    },
    async upsertAppState(record) {
      await client.execute(
        `INSERT INTO app_state (key, value, updated_at)
         VALUES (?, ?, ?)
         ON CONFLICT(key) DO UPDATE SET
           value = excluded.value,
           updated_at = excluded.updated_at`,
        [record.key, record.value, record.updatedAt],
      );
    },
  };
}
