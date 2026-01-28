import { readDir, watchImmediate } from '@tauri-apps/plugin-fs';
import type { MediaKind } from './types';
import { getFileStem, inferMediaKind, isSupportedMediaPath } from './utils';

export type FolderMediaItem = {
  title: string;
  uri: string;
  kind: MediaKind;
};

export async function scanMediaFolder(path: string): Promise<FolderMediaItem[]> {
  const entries = await readDir(path, { recursive: true });
  const items: FolderMediaItem[] = [];
  const collect = (nodes: typeof entries) => {
    for (const entry of nodes) {
      if (entry.children && entry.children.length > 0) {
        collect(entry.children);
        continue;
      }
      const uri = entry.path;
      if (!uri) {
        continue;
      }
      if (!isSupportedMediaPath(uri)) {
        continue;
      }
      items.push({
        title: getFileStem(entry.name ?? uri),
        uri,
        kind: inferMediaKind(uri),
      });
    }
  };
  collect(entries);
  return items;
}

export async function watchFolder(path: string, onChange: () => void) {
  return watchImmediate(path, () => {
    onChange();
  });
}
