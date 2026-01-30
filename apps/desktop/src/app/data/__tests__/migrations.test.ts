import { describe, expect, it } from 'vitest';
import { applyMigrations, getLatestSchemaVersion } from '../migrations';
import type { SqlClient } from '../sqliteClient';

function createMockSqlClient() {
  const executed: string[] = [];
  let currentVersion = 0;

  const client: SqlClient = {
    async execute(sql, bindValues) {
      executed.push(sql);
      if (sql.startsWith('INSERT INTO schema_migrations')) {
        const nextVersion = Number(bindValues?.[0] ?? 0);
        if (nextVersion > currentVersion) {
          currentVersion = nextVersion;
        }
      }
    },
    async select(sql) {
      if (sql.includes('FROM schema_migrations')) {
        return currentVersion ? [{ version: currentVersion }] : [];
      }
      return [];
    },
  };

  return { client, executed, getVersion: () => currentVersion };
}

describe('schema migrations', () => {
  it('applies migrations in order and updates schema version', async () => {
    const { client, executed, getVersion } = createMockSqlClient();

    await applyMigrations(client);

    expect(getVersion()).toBe(getLatestSchemaVersion());
    expect(executed.some((sql) => sql.includes('CREATE TABLE IF NOT EXISTS media_sources'))).toBe(true);
    expect(executed.some((sql) => sql.includes('CREATE TABLE IF NOT EXISTS vocab_items'))).toBe(true);
    expect(executed.some((sql) => sql.includes('CREATE TABLE IF NOT EXISTS libraries'))).toBe(true);
    expect(executed.some((sql) => sql.includes('CREATE TABLE IF NOT EXISTS app_state'))).toBe(true);
  });
});
