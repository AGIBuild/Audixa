/**
 * Subtitle provider types for multi-source subtitle downloading.
 */

export type SubtitleSearchOptions = {
  /** Search query (title or release name) */
  query?: string;
  /** Video file hash for precise matching */
  moviehash?: string;
  /** Language codes (e.g., 'en', 'zh-cn', 'ja') */
  languages?: string;
  /** Content type filter */
  type?: 'movie' | 'episode' | 'all';
  /** Release year */
  year?: number;
  /** IMDB ID for precise matching */
  imdbId?: string;
};

export type SubtitleSearchResult = {
  /** Unique identifier within the provider */
  id: string;
  /** File ID for downloading (provider-specific) */
  fileId: string | number;
  /** Language code */
  language: string;
  /** Subtitle format (srt, vtt, ass, etc.) */
  format: string;
  /** Display file name */
  fileName: string;
  /** Release name */
  release: string;
  /** Download count (for ranking) */
  downloads: number;
  /** Provider ID */
  providerId: string;
};

export type SubtitleDownloadResult = {
  /** Local file path where subtitle was saved */
  path: string;
  /** File name */
  fileName: string;
};

/**
 * Interface for subtitle providers.
 * Implement this interface to add new subtitle sources.
 */
export interface SubtitleProvider {
  /** Unique provider identifier */
  readonly id: string;

  /** Human-readable provider name */
  readonly name: string;

  /** Whether this provider requires an API key */
  readonly requiresApiKey: boolean;

  /** Settings key for storing API key (if required) */
  readonly apiKeySettingKey?: string;

  /**
   * Search for subtitles matching the given criteria.
   * @param options Search options
   * @param apiKey API key (if required)
   * @returns Promise resolving to search results
   */
  search(options: SubtitleSearchOptions, apiKey?: string): Promise<SubtitleSearchResult[]>;

  /**
   * Download a subtitle file.
   * @param fileId Provider-specific file ID
   * @param apiKey API key (if required)
   * @returns Promise resolving to download result with local file path
   */
  download(fileId: string | number, apiKey?: string): Promise<SubtitleDownloadResult>;
}

/**
 * Provider registry for managing multiple subtitle providers.
 */
export interface SubtitleProviderRegistry {
  /** Get all registered providers */
  getProviders(): SubtitleProvider[];

  /** Get a provider by ID */
  getProvider(id: string): SubtitleProvider | undefined;

  /** Register a new provider */
  registerProvider(provider: SubtitleProvider): void;
}
