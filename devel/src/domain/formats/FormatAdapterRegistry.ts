/**
 * Format Adapter Registry
 * 
 * Central registry for managing format adapters and providing compatibility-based
 * recommendations for character conversion.
 */

import type { CharacterData } from '@/domain/character/services/CharacterFetcher';
import type { FormatAdapter, CompatibilityAnalysis, FormatAdapterRegistry as IFormatAdapterRegistry } from './interfaces/FormatAdapter';

export class FormatAdapterRegistry implements IFormatAdapterRegistry {
  private adapters = new Map<string, FormatAdapter>();

  /**
   * Register a new format adapter
   */
  register(adapter: FormatAdapter): void {
    const metadata = adapter.getMetadata();
    console.log(`Registering format adapter: ${metadata.name} (${metadata.id})`);
    this.adapters.set(metadata.id, adapter);
  }

  /**
   * Get adapter by format ID
   */
  getAdapter(formatId: string): FormatAdapter | undefined {
    return this.adapters.get(formatId);
  }

  /**
   * Get all registered adapters
   */
  getAllAdapters(): FormatAdapter[] {
    return Array.from(this.adapters.values());
  }

  /**
   * Get adapters sorted by compatibility score for a character
   */
  async getAdaptersByCompatibility(characterData: CharacterData): Promise<Array<{
    adapter: FormatAdapter;
    compatibility: CompatibilityAnalysis;
  }>> {
    const results: Array<{
      adapter: FormatAdapter;
      compatibility: CompatibilityAnalysis;
    }> = [];

    for (const adapter of this.adapters.values()) {
      try {
        const compatibility = await adapter.analyzeCompatibility(characterData);
        results.push({ adapter, compatibility });
      } catch (error) {
        console.warn(`Failed to analyze compatibility for ${adapter.getMetadata().name}:`, error);
        // Create a fallback compatibility analysis for failed adapters
        const fallbackCompatibility: CompatibilityAnalysis = {
          score: 0,
          capabilities: [],
          recommendation: 'poor',
          limitations: ['Analysis failed'],
          dataLoss: 100
        };
        results.push({ adapter, compatibility: fallbackCompatibility });
      }
    }

    // Sort by compatibility score (highest first)
    results.sort((a, b) => b.compatibility.score - a.compatibility.score);

    return results;
  }

  /**
   * Get supported format IDs
   */
  getSupportedFormatIds(): string[] {
    return Array.from(this.adapters.keys());
  }

  /**
   * Check if a format is supported
   */
  isFormatSupported(formatId: string): boolean {
    return this.adapters.has(formatId);
  }

  /**
   * Get format metadata for all adapters
   */
  getAllFormatMetadata() {
    return Array.from(this.adapters.values()).map(adapter => adapter.getMetadata());
  }

  /**
   * Unregister a format adapter
   */
  unregister(formatId: string): boolean {
    return this.adapters.delete(formatId);
  }

  /**
   * Clear all registered adapters
   */
  clear(): void {
    this.adapters.clear();
  }

  /**
   * Get adapter count
   */
  size(): number {
    return this.adapters.size;
  }
}

// Export singleton instance
export const formatAdapterRegistry = new FormatAdapterRegistry();