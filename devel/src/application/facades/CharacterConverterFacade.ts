/**
 * CharacterConverterFacade
 * 
 * Provides a unified interface for character conversion that can use either
 * the legacy fetching mechanism or the new CharacterFetcher service based on
 * feature flags. This implements the Strangler Fig pattern for gradual migration.
 */

import { CharacterFetcher, type FetchResult, type CharacterData } from '@/domain/character/services/CharacterFetcher';
import { featureFlags } from '@/core/FeatureFlags';

export interface ConversionProgress {
  step: string;
  percentage: number;
  message?: string;
}

export interface ConversionResult {
  success: boolean;
  xml?: string;
  error?: string;
  characterData?: CharacterData;
  performance?: {
    fetchTime: number;
    parseTime: number;
    totalTime: number;
  };
}

export class CharacterConverterFacade {
  private characterFetcher: CharacterFetcher;
  public onProgress?: (step: string, percentage: number) => void;

  constructor() {
    this.characterFetcher = new CharacterFetcher();
  }

  /**
   * Main conversion method that handles feature flag routing
   */
  async convertFromDNDBeyond(characterId: string): Promise<ConversionResult> {
    const performanceStart = performance.now();
    
    try {
      this.reportProgress('Validating character ID', 10);

      // Step 1: Fetch character data
      const fetchResult = await this.fetchCharacterData(characterId);
      if (!fetchResult.success) {
        return {
          success: false,
          error: fetchResult.error
        };
      }

      const characterData = fetchResult.data!;
      const fetchTime = performance.now() - performanceStart;
      
      // Debug logging if feature flag is enabled
      if (featureFlags.isEnabled('debug_character_data')) {
        console.group('🔍 Character Data Debug Info');
        console.log('📋 Basic Info:', {
          id: characterData.id,
          name: characterData.name,
          level: this.calculateTotalLevel(characterData),
          race: characterData.race?.fullName || 'Unknown',
          classes: characterData.classes?.map(c => `${c.definition?.name} ${c.level}`).join(', ') || 'None'
        });
        
        console.log('📊 Stats & Bonuses:', {
          stats: characterData.stats,
          bonusStats: characterData.bonusStats,
          overrideStats: characterData.overrideStats
        });
        
        console.log('🎒 Equipment & Inventory:', {
          inventoryCount: characterData.inventory?.length || 0,
          inventory: characterData.inventory?.slice(0, 5), // First 5 items
          hasMore: (characterData.inventory?.length || 0) > 5
        });
        
        console.log('✨ Spells & Features:', {
          spellsKnown: characterData.spells?.length || 0,
          classFeatures: characterData.classes?.reduce((total: number, cls: any) => 
            total + (cls.classFeatures?.length || 0), 0) || 0,
          raceFeatures: characterData.race?.racialTraits?.length || 0
        });
        
        console.log('🔧 Modifiers & Bonuses:', {
          modifiers: characterData.modifiers ? Object.keys(characterData.modifiers) : [],
          bonuses: characterData.bonuses ? Object.keys(characterData.bonuses) : []
        });
        
        console.log('📄 Full Character Object:', characterData);
        console.groupEnd();
      }
      
      this.reportProgress('Parsing character data', 50);

      // Step 2: Parse character data (legacy for now)
      const parseStart = performance.now();
      const xml = await this.parseCharacterToXML(characterData);
      const parseTime = performance.now() - parseStart;

      this.reportProgress('Generating XML', 90);
      
      const totalTime = performance.now() - performanceStart;

      this.reportProgress('Conversion complete', 100);

      return {
        success: true,
        xml,
        characterData,
        performance: {
          fetchTime,
          parseTime,
          totalTime
        }
      };

    } catch (error) {
      console.error('Conversion error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown conversion error'
      };
    }
  }

  /**
   * Fetch character data using either new or legacy method based on feature flags
   */
  private async fetchCharacterData(characterId: string): Promise<FetchResult> {
    if (featureFlags.isEnabled('character_fetcher')) {
      console.log('Using new CharacterFetcher service');
      this.reportProgress('Fetching from D&D Beyond (new)', 25);
      return await this.characterFetcher.fetchCharacter(characterId);
    } else {
      console.log('Using legacy character fetching');
      this.reportProgress('Fetching from D&D Beyond (legacy)', 25);
      return await this.fetchCharacterLegacy(characterId);
    }
  }

  /**
   * Legacy character fetching method - bridges to existing app.js functionality
   * This will be removed once the new CharacterFetcher is fully rolled out
   */
  private async fetchCharacterLegacy(characterId: string): Promise<FetchResult> {
    try {
      // Basic validation using new service
      const validation = this.characterFetcher.validateCharacterID(characterId);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      const sanitizedId = validation.sanitized!;

      // Use legacy fetch approach (from app.js lines 88-140)
      const proxyUrl = 'https://uakari-indigo.fly.dev/';
      const apiUrl = 'https://character-service.dndbeyond.com/character/v5/character/';
      const fetchUrl = `${proxyUrl}${apiUrl}${sanitizedId}`;

      const response = await fetch(fetchUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Origin': 'https://www.dndbeyond.com',
          'X-Requested-With': 'XMLHttpRequest'
        }
      });

      if (!response.ok) {
        let errorMessage: string;
        switch (response.status) {
          case 401:
          case 403:
            errorMessage = 'Character not found or not public. Ensure character visibility is set to Public.';
            break;
          case 404:
            errorMessage = 'Character not found. Please check the character ID.';
            break;
          default:
            errorMessage = `Unable to fetch character data (Error ${response.status}). Please try again.`;
        }
        return { success: false, error: errorMessage, statusCode: response.status };
      }

      const apiResponse = await response.json();

      // Handle proxy wrapper format: {success: true, data: {...}}
      let characterData;
      if (apiResponse.success && apiResponse.data) {
        characterData = apiResponse.data;
      } else if (apiResponse.id && apiResponse.name) {
        // Direct character data format
        characterData = apiResponse;
      } else {
        return { success: false, error: 'Invalid response format from D&D Beyond API' };
      }

      // Basic validation
      if (!characterData || typeof characterData.id !== 'number' || !characterData.name) {
        return { success: false, error: 'Invalid character data received from D&D Beyond' };
      }

      return { success: true, data: characterData };

    } catch (error) {
      console.error('Legacy fetch error:', error);
      
      let errorMessage = 'Network error occurred while fetching character data';
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
          errorMessage = 'Network error. Please check your internet connection and try again.';
        } else {
          errorMessage = error.message;
        }
      }
      
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Parse character data to XML (currently calls legacy logic)
   * This will be replaced with new parsing services in future phases
   */
  private async parseCharacterToXML(characterData: CharacterData): Promise<string> {
    console.log('parseCharacterToXML called with:', {
      characterId: characterData.id,
      characterName: characterData.name,
      dataKeys: Object.keys(characterData)
    });

    // For now, we'll create a simple mock XML since the legacy parser isn't available
    // This demonstrates that the data fetch is working correctly
    const characterName = characterData.name || 'Unknown Character';
    const characterId = characterData.id || 0;
    
    // Simple mock XML for demonstration
    const mockXML = `<?xml version="1.0" encoding="UTF-8"?>
<character>
  <name type="string">${characterName}</name>
  <id type="number">${characterId}</id>
  <stats>
    ${characterData.stats?.map((stat: any) => 
      `<stat${stat.id} type="number">${stat.value || 10}</stat${stat.id}>`
    ).join('\n    ') || ''}
  </stats>
  <classes>
    ${characterData.classes?.map((cls: any) => 
      `<class name="${cls.definition?.name || 'Unknown'}" level="${cls.level || 1}"/>`
    ).join('\n    ') || ''}
  </classes>
  <!-- This is a simplified mock XML for testing the fetch functionality -->
  <!-- Full XML generation will be implemented in Phase 2 of the refactor -->
</character>`;

    console.log('Generated mock XML for character:', characterName);
    return mockXML;
  }

  /**
   * Report progress to callback if set
   */
  private reportProgress(step: string, percentage: number, message?: string): void {
    if (this.onProgress) {
      this.onProgress(step, percentage);
    }
    console.log(`Progress: ${step} (${percentage}%)${message ? ` - ${message}` : ''}`);
  }

  /**
   * Check if the service dependencies are available
   */
  async checkServiceAvailability(): Promise<{
    proxyService: boolean;
    legacyParser: boolean;
    usingNewFetcher: boolean;
  }> {
    const usingNewFetcher = featureFlags.isEnabled('character_fetcher');
    
    return {
      proxyService: await this.characterFetcher.checkServiceHealth(),
      legacyParser: typeof window !== 'undefined' && !!(window as any).parseCharacter,
      usingNewFetcher
    };
  }

  /**
   * Calculate total character level across all classes
   */
  private calculateTotalLevel(characterData: CharacterData): number {
    if (!characterData.classes || !Array.isArray(characterData.classes)) {
      return 1;
    }
    
    return characterData.classes.reduce((total: number, cls: any) => {
      return total + (cls.level || 0);
    }, 0) || 1;
  }

  /**
   * Get current feature flag status for debugging
   */
  getFeatureFlagStatus(): Record<string, boolean> {
    return {
      character_fetcher: featureFlags.isEnabled('character_fetcher'),
      modern_converter: featureFlags.isEnabled('modern_converter'),
      legacy_fallback: featureFlags.isEnabled('legacy_fallback'),
      debug_character_data: featureFlags.isEnabled('debug_character_data')
    };
  }
}

// Export singleton instance
export const characterConverterFacade = new CharacterConverterFacade();