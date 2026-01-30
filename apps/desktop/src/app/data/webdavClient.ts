import { fetch } from '@tauri-apps/plugin-http';
import type { MediaKind } from './types';
import { getFileStem, inferMediaKind } from './utils';

export type WebDavItem = {
  title: string;
  uri: string;
  kind: MediaKind;
};

export async function listWebDavMedia(
  baseUrl: string,
  username: string,
  password: string,
): Promise<WebDavItem[]> {
  const normalizedBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  const auth = btoa(`${username}:${password}`);
  const response = await fetch(normalizedBase, {
    method: 'PROPFIND',
    headers: {
      Depth: '1',
      Authorization: `Basic ${auth}`,
    },
  });

  if (!response.ok) {
    throw new Error(`WebDAV request failed (${response.status}).`);
  }

  const xml = await response.text();
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, 'application/xml');
  const responses = Array.from(doc.getElementsByTagNameNS('*', 'response'));
  const items: WebDavItem[] = [];

  for (const node of responses) {
    const href = node.getElementsByTagNameNS('*', 'href')[0]?.textContent ?? '';
    if (!href) {
      continue;
    }
    const resourceType = node.getElementsByTagNameNS('*', 'resourcetype')[0];
    const isCollection = Boolean(resourceType?.getElementsByTagNameNS('*', 'collection')[0]);
    if (isCollection) {
      continue;
    }
    const uri = new URL(href, normalizedBase).toString();
    const kind = inferMediaKind(uri);
    if (kind === 'unknown') {
      continue;
    }
    items.push({
      title: getFileStem(decodeURIComponent(uri)),
      uri,
      kind,
    });
  }

  return items;
}
