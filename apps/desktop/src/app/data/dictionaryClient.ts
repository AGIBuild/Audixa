import { fetch } from '@tauri-apps/plugin-http';
import { canonicalizeWord } from './utils';

const DICTIONARY_BASE = 'https://api.dictionaryapi.dev/api/v2/entries';

type DictionaryApiEntry = {
  word?: string;
  phonetic?: string;
  phonetics?: Array<{ text?: string }>;
  meanings?: Array<{
    definitions?: Array<{
      definition?: string;
      example?: string;
    }>;
  }>;
};

export type DictionaryLookupSuccess = {
  status: 'success';
  word: string;
  definition: string;
  pronunciation: string | null;
};

export type DictionaryLookupUnavailable = {
  status: 'unavailable';
  word: string;
  reason: string;
};

export type DictionaryLookupResult = DictionaryLookupSuccess | DictionaryLookupUnavailable;

export function parseDictionaryResponse(payload: unknown, fallbackWord: string) {
  if (!Array.isArray(payload) || payload.length === 0) {
    return null;
  }
  const entry = payload[0] as DictionaryApiEntry;
  const word =
    typeof entry.word === 'string' && entry.word.trim() ? entry.word.trim() : fallbackWord;

  const phonetics = Array.isArray(entry.phonetics) ? entry.phonetics : [];
  const phonetic =
    phonetics.find((item) => typeof item?.text === 'string' && item.text?.trim())?.text?.trim() ??
    (typeof entry.phonetic === 'string' && entry.phonetic.trim() ? entry.phonetic.trim() : null);

  const meanings = Array.isArray(entry.meanings) ? entry.meanings : [];
  let definition = '';
  for (const meaning of meanings) {
    const definitions = Array.isArray(meaning?.definitions) ? meaning.definitions : [];
    const first = definitions.find(
      (item) => typeof item?.definition === 'string' && item.definition.trim(),
    );
    if (first?.definition) {
      definition = first.definition.trim();
      break;
    }
  }

  if (!definition) {
    return null;
  }

  return {
    word,
    definition,
    pronunciation: phonetic ?? null,
  };
}

export async function lookupDictionaryWord(word: string): Promise<DictionaryLookupResult> {
  const normalized = canonicalizeWord(word);
  if (!normalized) {
    return { status: 'unavailable', word, reason: 'No word selected.' };
  }
  try {
    const response = await fetch(
      `${DICTIONARY_BASE}/en/${encodeURIComponent(normalized)}`,
      {
        method: 'GET',
      },
    );
    if (!response.ok) {
      return { status: 'unavailable', word, reason: 'Lookup unavailable.' };
    }
    const payload = (await response.json()) as unknown;
    const parsed = parseDictionaryResponse(payload, word);
    if (!parsed) {
      return { status: 'unavailable', word, reason: 'No definition found.' };
    }
    return {
      status: 'success',
      word: parsed.word || word,
      definition: parsed.definition,
      pronunciation: parsed.pronunciation,
    };
  } catch (error) {
    return {
      status: 'unavailable',
      word,
      reason: error instanceof Error ? error.message : 'Lookup unavailable.',
    };
  }
}
