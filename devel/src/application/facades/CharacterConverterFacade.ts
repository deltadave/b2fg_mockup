/**
 * CharacterConverterFacade
 * 
 * Provides a unified interface for character conversion that can use either
 * the legacy fetching mechanism or the new CharacterFetcher service based on
 * feature flags. This implements the Strangler Fig pattern for gradual migration.
 */

import { CharacterFetcher, type FetchResult, type CharacterData } from '@/domain/character/services/CharacterFetcher';
import { featureFlags } from '@/core/FeatureFlags';
import { gameConfigService } from '@/shared/services/GameConfigService';

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
    this.initializeGameConfig();
  }

  /**
   * Initialize game configuration
   */
  private async initializeGameConfig(): Promise<void> {
    if (!gameConfigService.isLoaded()) {
      try {
        await gameConfigService.loadConfigs();
      } catch (error) {
        console.warn('Failed to load game configuration, using fallback values:', error);
      }
    }
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
    
    // Generate Fantasy Grounds compatible XML using the proper template structure
    const totalLevel = this.calculateTotalLevel(characterData);
    const proficiencyBonus = gameConfigService.calculateProficiencyBonus(totalLevel);
    
    const mockXML = `<?xml version="1.0" encoding="UTF-8"?>
<root version="4.7" dataversion="20241002" release="8.1|CoreRPG:7">
  <character>
    <name type="string">${characterName}</name>
    <gender type="string">${characterData.gender || ''}</gender>
    <deity type="string">${characterData.faith || ''}</deity>
    <age type="string">${characterData.age || ''}</age>
    <appearance type="string">${characterData.hair ? `Hair: ${characterData.hair}, Eyes: ${characterData.eyes || ''}, Skin: ${characterData.skin || ''}` : ''}</appearance>
    <height type="string">${characterData.height || ''}</height>
    <weight type="string">${characterData.weight ? characterData.weight.toString() : ''}</weight>
    <size type="string">${gameConfigService.getDefaultSize()}</size>
    <alignment type="string">${gameConfigService.getAlignmentName(characterData.alignmentId)}</alignment>
    <bonds type="string"></bonds>
    <flaws type="string"></flaws>
    <ideals type="string"></ideals>
    <personalitytraits type="string"></personalitytraits>
    <race type="string">${characterData.race?.fullName || 'Unknown'}</race>
    <racelink type="windowreference">
      <class>reference_race</class>
      <recordname>reference.race.${(characterData.race?.fullName || 'unknown').toLowerCase().replace(/\s+/g, '')}@*</recordname>
    </racelink>
    <background type="string">${characterData.background?.definition?.name || ''}</background>
    <backgroundlink type="windowreference">
      <class>reference_background</class>
      <recordname>reference.background.${(characterData.background?.definition?.name || 'unknown').toLowerCase().replace(/\s+/g, '')}@*</recordname>
    </backgroundlink>
    <level type="number">${totalLevel}</level>
    <profbonus type="number">${proficiencyBonus}</profbonus>
    <notes type="formattedtext">
      <p>Character converted from D&D Beyond (ID: ${characterId}) using Modern Converter v2.0</p>
      <p>This demonstrates the new character fetching system with proper Fantasy Grounds template structure.</p>
      <p>Full character parsing will be implemented in Phase 2 of the refactor.</p>
    </notes>
    <perception type="number">0</perception>
    <perceptionmodifier type="number">0</perceptionmodifier>
    <exp type="number">${characterData.currentXp || 0}</exp>
    <expneeded type="number">0</expneeded>
    
    <!-- Abilities with proper template structure -->
    <abilities>
      ${this.generateAbilitiesXML(characterData)}
    </abilities>
    
    <!-- Classes with template structure -->
    <classes>
      ${characterData.classes?.map((cls: any, index: number) => 
        `<id-${String(index + 1).padStart(5, '0')}>
        <casterpactmagic type="number">0</casterpactmagic>
        <hddie type="dice">${cls.definition?.hitDie ? `d${cls.definition.hitDie}` : gameConfigService.getDefaultHitDie()}</hddie>
        <hdused type="number">0</hdused>
        <level type="number">${cls.level || 1}</level>
        <name type="string">${cls.definition?.name || 'Unknown'}</name>
        <shortcut type="windowreference">
          <class>reference_class</class>
          <recordname>reference.class.${(cls.definition?.name || 'unknown').toLowerCase()}@*</recordname>
        </shortcut>
      </id-${String(index + 1).padStart(5, '0')}>`
      ).join('\n      ') || ''}
    </classes>
    
    <!-- Currency -->
    <coins>
      ${gameConfigService.getCurrencies().map((currency, index) => 
        `<slot${index + 1}>
        <amount type="number">0</amount>
        <name type="string">${currency.name}</name>
      </slot${index + 1}>`
      ).join('\n      ')}
    </coins>
    
    <!-- Defenses -->
    <defenses>
      <ac>
        <armor type="number">0</armor>
        <misc type="number">0</misc>
        <prof type="number">0</prof>
        <shield type="number">0</shield>
        <stat2 type="string">dexterity</stat2>
        <temporary type="number">0</temporary>
        <total type="number">${gameConfigService.getBaseArmorClass()}</total>
      </ac>
    </defenses>
    
    <!-- Encumbrance -->
    <encumbrance>
      <encumbered type="number">0</encumbered>
      <encumberedheavy type="number">0</encumberedheavy>
      <liftpushdrag type="number">0</liftpushdrag>
      <load type="number">0</load>
      <max type="number">0</max>
    </encumbrance>
    
    <!-- Placeholder sections for Phase 2 -->
    <featlist>
      <!-- Feats will be added in Phase 2 -->
    </featlist>
    
    <featurelist>
      <!-- Class/Race features will be added in Phase 2 -->
    </featurelist>
    
    <inventorylist>
      <!-- Equipment will be added in Phase 2 -->
    </inventorylist>
    
    <languagelist>
      <!-- Languages will be added in Phase 2 -->
    </languagelist>
    
    <powergrouplist>
      <!-- Spells/Powers will be added in Phase 2 -->
    </powergrouplist>
    
    <skilllist>
      <!-- Skills will be added in Phase 2 -->
    </skilllist>
  </character>
</root>`;

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
   * Generate abilities XML with proper template structure
   */
  private generateAbilitiesXML(characterData: CharacterData): string {
    const abilities = gameConfigService.getAbilities();
    
    return abilities.map((ability) => {
      const stat = characterData.stats?.find((s: any) => s.id === ability.id);
      const bonusStat = characterData.bonusStats?.find((b: any) => b.id === ability.id);
      const overrideStat = characterData.overrideStats?.find((o: any) => o.id === ability.id);
      
      // Calculate final score
      const baseScore = stat?.value || gameConfigService.getDefaultAbilityScore();
      const bonusValue = bonusStat?.value || 0;
      const finalScore = overrideStat?.value || (baseScore + bonusValue);
      const modifier = gameConfigService.calculateAbilityModifier(finalScore);
      
      return `<${ability.name}>
        <bonus type="number">${modifier}</bonus>
        <save type="number">${modifier}</save>
        <savemodifier type="number">0</savemodifier>
        <saveprof type="number">0</saveprof>
        <score type="number">${finalScore}</score>
      </${ability.name}>`;
    }).join('\n      ');
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