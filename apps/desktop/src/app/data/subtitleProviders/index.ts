/**
 * Subtitle provider registry.
 *
 * This module provides a central registry for managing multiple subtitle providers.
 * To add a new provider:
 * 1. Create a new file implementing SubtitleProvider (e.g., assrt.ts)
 * 2. Import and register it in the defaultProviders array below
 */

import type { SubtitleProvider, SubtitleProviderRegistry } from './types';
import { openSubtitlesProvider } from './openSubtitles';

// Re-export types for convenience
export type {
  SubtitleProvider,
  SubtitleSearchOptions,
  SubtitleSearchResult,
  SubtitleDownloadResult,
  SubtitleProviderRegistry,
} from './types';

// Re-export providers
export { openSubtitlesProvider } from './openSubtitles';

/** Default providers registered at startup */
const defaultProviders: SubtitleProvider[] = [
  openSubtitlesProvider,
  // Add new providers here:
  // assrtProvider,
  // subsceneProvider,
];

class SubtitleProviderRegistryImpl implements SubtitleProviderRegistry {
  private providers: Map<string, SubtitleProvider> = new Map();

  constructor(initialProviders: SubtitleProvider[] = []) {
    for (const provider of initialProviders) {
      this.registerProvider(provider);
    }
  }

  getProviders(): SubtitleProvider[] {
    return Array.from(this.providers.values());
  }

  getProvider(id: string): SubtitleProvider | undefined {
    return this.providers.get(id);
  }

  registerProvider(provider: SubtitleProvider): void {
    if (this.providers.has(provider.id)) {
      console.warn(`Subtitle provider "${provider.id}" is already registered. Overwriting.`);
    }
    this.providers.set(provider.id, provider);
  }
}

/** Global provider registry instance */
export const subtitleProviderRegistry = new SubtitleProviderRegistryImpl(defaultProviders);

/**
 * Get a provider by ID.
 * Convenience function for accessing the global registry.
 */
export function getSubtitleProvider(id: string): SubtitleProvider | undefined {
  return subtitleProviderRegistry.getProvider(id);
}

/**
 * Get all registered providers.
 * Convenience function for accessing the global registry.
 */
export function getAllSubtitleProviders(): SubtitleProvider[] {
  return subtitleProviderRegistry.getProviders();
}
