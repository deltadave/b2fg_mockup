/**
 * CharacterConverterFacade
 * 
 * Provides a unified interface for character conversion that can use either
 * the legacy fetching mechanism or the new CharacterFetcher service based on
 * feature flags. This implements the Strangler Fig pattern for gradual migration.
 */

import { CharacterFetcher, type FetchResult, type CharacterData } from '@/domain/character/services/CharacterFetcher';
import { ConversionOrchestrator, type ConversionResult as OrchestrationResult, type ConversionOptions, type ProcessedCharacterData as OrchProcessedData } from '@/domain/conversion/ConversionOrchestrator';
import { featureFlags } from '@/core/FeatureFlags';
import { gameConfigService } from '@/shared/services/GameConfigService';
import { ObjectSearch } from '@/shared/utils/ObjectSearch';
import { StringSanitizer } from '@/shared/utils/StringSanitizer';
import { SafeAccess } from '@/shared/utils/SafeAccess';
import { AbilityScoreUtils, ABILITY_NAMES } from '@/domain/character/constants/AbilityConstants';
import { AbilityScoreProcessor } from '@/domain/character/services/AbilityScoreProcessor';
import { SpellSlotCalculator } from '@/domain/character/services/SpellSlotCalculator';
import { type CharacterClass } from '@/domain/character/models/SpellSlots';
import { InventoryProcessor, type InventoryProcessingOptions } from '@/domain/character/services/InventoryProcessor';
import { EncumbranceCalculator, type CharacterStrength, type EncumbranceOptions } from '@/domain/character/services/EncumbranceCalculator';
import { FeatureProcessor } from '@/domain/character/services/FeatureProcessor';
import { type InventoryItem } from '@/domain/character/models/Inventory';
import { formatRegistry, type FormatCompatibilityInfo } from '@/domain/export/registry/FormatRegistry';
import type { ProcessedCharacterData, FormatOptions, FormatResult, FormatInfo } from '@/domain/export/interfaces/OutputFormatter';

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
  private conversionOrchestrator: ConversionOrchestrator;
  private inventoryProcessor: InventoryProcessor;
  private encumbranceCalculator: EncumbranceCalculator;
  private spellSlotCalculator: SpellSlotCalculator;
  private featureProcessor: FeatureProcessor;
  public onProgress?: (step: string, percentage: number) => void;

  constructor() {
    this.characterFetcher = new CharacterFetcher();
    this.conversionOrchestrator = new ConversionOrchestrator();
    this.inventoryProcessor = new InventoryProcessor();
    this.encumbranceCalculator = new EncumbranceCalculator();
    this.spellSlotCalculator = new SpellSlotCalculator();
    this.featureProcessor = new FeatureProcessor();
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
        
        // Demonstrate ObjectSearch service if enabled
        if (featureFlags.isEnabled('object_search_service')) {
          console.log('🔍 ObjectSearch Service Demo:');
          
          // Find proficiency modifiers
          const proficiencies = ObjectSearch.findByType(characterData, 'proficiency');
          console.log(`Found ${proficiencies.length} proficiency modifiers:`, proficiencies);
          
          // Find class features
          const classFeatures = ObjectSearch.findByType(characterData, 'feature');
          console.log(`Found ${classFeatures.length} class features:`, classFeatures.slice(0, 3));
          
          // Find by entity type (common D&D Beyond pattern)
          const classesList = ObjectSearch.findByEntityType(characterData, '1446578651'); // Classes
          console.log(`Found ${classesList.length} classes via entityTypeId:`, classesList);
          
          // Show available keys for debugging
          const allKeys = ObjectSearch.getAllKeys(characterData, 5);
          console.log(`Available keys (depth 5): ${allKeys.length} total`, allKeys.slice(0, 20));
        }
        
        // Demonstrate StringSanitizer service if enabled
        if (featureFlags.isEnabled('string_sanitizer_service')) {
          console.log('🧹 StringSanitizer Service Demo:');
          
          // Test with potentially dangerous content
          const testStrings = [
            characterData.name || 'Unknown Character',
            '<script>alert("XSS")</script>Test Name',
            'Character "The Bold" & Strong',
            'javascript:alert(1)',
            'Text with\nnewlines\tand control\x00chars'
          ];
          
          testStrings.forEach((testString, index) => {
            const sanitized = this.sanitizeString(testString);
            const report = StringSanitizer.sanitizeWithReport(testString);
            console.log(`Test ${index + 1}:`, {
              original: testString,
              sanitized: sanitized,
              wasModified: report.wasModified,
              removedPatterns: report.removedPatterns
            });
          });
        }
        
        // Demonstrate SafeAccess service if enabled
        if (featureFlags.isEnabled('safe_access_service')) {
          console.log('🛡️ SafeAccess Service Demo:');
          
          // Test various access patterns common in D&D Beyond data
          const testPaths = [
            'name',
            'race.fullName',
            'race.definition.name',
            'classes.0.definition.name',
            'classes.0.level',
            'stats.0.value',
            'nonexistent.path',
            'race.racialTraits.0.definition.name',
            'preferences.privacy.showStats'
          ];
          
          testPaths.forEach(path => {
            const value = this.safeAccess(characterData, path);
            const result = SafeAccess.getWithResult(characterData, path);
            console.log(`Path: ${path}`, {
              value: value,
              found: result.found,
              type: typeof value,
              depth: result.depth
            });
          });
          
          // Demonstrate advanced features
          const multipleResults = SafeAccess.getMultiple(characterData, [
            'name', 'race.fullName', 'classes.0.level'
          ]);
          console.log('Multiple path access:', multipleResults);
          
          // Show all available paths (limited depth for readability)
          const availablePaths = SafeAccess.getAllPaths(characterData, 3);
          console.log(`Available paths (depth 3): ${availablePaths.length} total`, availablePaths.slice(0, 15));
        }
        
        // Demonstrate AbilityConstants if enabled
        if (featureFlags.isEnabled('ability_constants')) {
          console.log('💪 AbilityConstants Demo:');
          
          // Test ability score calculations with character data
          const abilities = this.getAbilityScores(characterData);
          console.log('Character Ability Scores:', abilities);
          
          // Calculate modifiers for all abilities
          const modifiers: Record<string, number> = {};
          ABILITY_NAMES.forEach(ability => {
            const score = abilities[ability] || 10;
            modifiers[ability] = AbilityScoreUtils.calculateModifier(score);
          });
          console.log('Ability Modifiers:', modifiers);
          
          // Demonstrate utility functions
          console.log('Ability Mappings:', {
            strengthId: AbilityScoreUtils.getAbilityIdByName('strength'),
            dexterityAbbr: AbilityScoreUtils.getAbbreviation('dexterity'),
            constitutionById: AbilityScoreUtils.getAbilityById(3)?.name,
            validScores: {
              normal: AbilityScoreUtils.isValidScore(18, false),
              withMagic: AbilityScoreUtils.isValidScore(22, true)
            }
          });
          
          // Show carrying capacity if strength is available
          if (abilities.strength) {
            const carryingCapacity = AbilityScoreUtils.calculateCarryingCapacity(abilities.strength);
            console.log(`Carrying Capacity (STR ${abilities.strength}):`, carryingCapacity);
          }
        }
        
        // Demonstrate AbilityScoreProcessor if enabled
        if (featureFlags.isEnabled('ability_score_processor')) {
          console.log('⚡ AbilityScoreProcessor Service Demo:');
          
          // Enable detailed debugging if flag is set
          if (featureFlags.isEnabled('debug_ability_score_processor')) {
            AbilityScoreProcessor.setDebugMode(true);
            console.log('🔍 Debug mode enabled for ability score processing');
          }
          
          // Process ability score bonuses with detailed breakdown
          const abilityResult = this.processAbilityBonuses(characterData);
          console.log('Processed Ability Scores:', abilityResult.totalScores);
          
          // Reset debug mode
          AbilityScoreProcessor.setDebugMode(false);
          
          // Show bonus breakdown if any bonuses were applied
          if (abilityResult.debugInfo.appliedBonuses.length > 0) {
            console.log('Applied Bonuses:', abilityResult.debugInfo.appliedBonuses);
            console.log('Final Bonus Summary:', abilityResult.debugInfo.finalBonusSummary);
          }
          
          // Demonstrate legacy format compatibility
          const legacyFormat = AbilityScoreProcessor.processLegacyFormat(characterData);
          console.log('Legacy Format Output:', legacyFormat.slice(0, 3)); // Show first 3 abilities
          
          // Show individual ability score calculations
          console.log('Individual Score Calculations:');
          ABILITY_NAMES.forEach((ability, index) => {
            const abilityId = index + 1;
            const totalScore = AbilityScoreProcessor.getTotalAbilityScore(characterData, abilityId);
            console.log(`  ${ability} (ID ${abilityId}): ${totalScore} (modifier: ${AbilityScoreUtils.calculateModifier(totalScore)})`);
          });
          
          // Validate character data structure
          const validation = AbilityScoreProcessor.validateCharacterData(characterData);
          console.log('Character Data Validation:', {
            isValid: validation.isValid,
            issueCount: validation.issues.length,
            warningCount: validation.warnings.length
          });
          
          if (validation.warnings.length > 0) {
            console.warn('Character Data Warnings:', validation.warnings);
          }
          if (validation.issues.length > 0) {
            console.error('Character Data Issues:', validation.issues);
          }
        }
        
        // Demonstrate SpellSlotCalculator if enabled
        if (featureFlags.isEnabled('spell_slot_calculator')) {
          console.log('🪄 SpellSlotCalculator Service Demo:');
          
          // Enable detailed debugging if flag is set
          if (featureFlags.isEnabled('debug_spell_slot_calculator')) {
            SpellSlotCalculator.setDebugMode(true);
            console.log('🔍 Debug mode enabled for spell slot calculation');
          }
          
          // Extract class information from character data
          const classInfo = this.extractClassInfo(characterData);
          console.log('Extracted Classes:', classInfo);
          
          // Calculate spell slots
          const spellSlotResult = this.calculateSpellSlots(classInfo);
          console.log('Calculated Spell Slots:', spellSlotResult.spellSlots);
          
          // Reset debug mode
          SpellSlotCalculator.setDebugMode(false);
          
          // Show detailed breakdown
          console.log('Caster Level Breakdown:', spellSlotResult.debugInfo.casterLevelCalculation);
          console.log('Class Breakdown:', spellSlotResult.debugInfo.classBreakdown);
          console.log(`Calculation Method: ${spellSlotResult.debugInfo.calculationMethod}`);
          
          // Demonstrate legacy format compatibility
          const legacySpellSlots = SpellSlotCalculator.toLegacyFormat(spellSlotResult.spellSlots);
          console.log('Legacy Format Spell Slots:', legacySpellSlots.filter(slot => slot.slots > 0));
          
          // Validate class information
          const classValidation = SpellSlotCalculator.validateClassInfo(classInfo);
          console.log('Class Data Validation:', {
            isValid: classValidation.isValid,
            errorCount: classValidation.errors.length
          });
          
          if (classValidation.errors.length > 0) {
            console.error('Class Data Errors:', classValidation.errors);
          }
        }
        
        console.groupEnd();
      }
      
      this.reportProgress('Parsing character data', 50);

      // Debug: Log personality traits information
      if (featureFlags.isEnabled('debug_character_data')) {
        const traits = characterData.traits || {};
        console.log('🎭 Personality Traits:', {
          personalityTraits: traits.personalityTraits ? `${traits.personalityTraits.substring(0, 50)}...` : 'None',
          ideals: traits.ideals ? `${traits.ideals.substring(0, 50)}...` : 'None',
          bonds: traits.bonds ? `${traits.bonds.substring(0, 50)}...` : 'None',
          flaws: traits.flaws ? `${traits.flaws.substring(0, 50)}...` : 'None'
        });
      }

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
   * Convert character data directly to Fantasy Grounds XML
   * Used when character data is already available (e.g., from file upload)
   */
  async convertCharacterData(characterData: CharacterData): Promise<ConversionResult> {
    const performanceStart = performance.now();
    
    try {
      console.log('Converting character data directly:', characterData.name);
      this.reportProgress('Initializing conversion', 10);

      // Initialize game configuration
      await this.initializeGameConfig();
      this.reportProgress('Parsing character data', 50);

      // Step 2: Parse character data to XML
      const parseStart = performance.now();
      const xml = await this.parseCharacterToXML(characterData);
      const parseTime = performance.now() - parseStart;

      this.reportProgress('Conversion complete', 100);

      const totalTime = performance.now() - performanceStart;

      return {
        success: true,
        xml,
        characterData,
        performance: {
          fetchTime: 0, // No fetching since data was provided
          parseTime,
          totalTime
        }
      };
    } catch (error) {
      console.error('Character data conversion error:', error);
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
    const characterName = this.sanitizeString(characterData.name || 'Unknown Character');
    const characterId = characterData.id || 0;
    
    // Generate Fantasy Grounds compatible XML using the proper template structure
    const totalLevel = this.calculateTotalLevel(characterData);
    const proficiencyBonus = gameConfigService.calculateProficiencyBonus(totalLevel);
    
    const mockXML = `<?xml version="1.0" encoding="UTF-8"?>
<root version="4.7" dataversion="20241002" release="8.1|CoreRPG:7">
  <character>
    <name type="string">${characterName}</name>
    <gender type="string">${this.sanitizeString(characterData.gender || '')}</gender>
    <deity type="string">${this.sanitizeString(characterData.faith || '')}</deity>
    <age type="string">${this.sanitizeString(characterData.age || '')}</age>
    <appearance type="string">${this.sanitizeString(characterData.hair ? `Hair: ${characterData.hair}, Eyes: ${characterData.eyes || ''}, Skin: ${characterData.skin || ''}` : '')}</appearance>
    <height type="string">${this.sanitizeString(characterData.height || '')}</height>
    <weight type="string">${this.sanitizeString(characterData.weight ? characterData.weight.toString() : '')}</weight>
    <size type="string">${gameConfigService.getDefaultSize()}</size>
    <alignment type="string">${this.sanitizeString(gameConfigService.getAlignmentName(characterData.alignmentId))}</alignment>
    <bonds type="string">${this.sanitizeString(characterData.traits?.bonds || '')}</bonds>
    <flaws type="string">${this.sanitizeString(characterData.traits?.flaws || '')}</flaws>
    <ideals type="string">${this.sanitizeString(characterData.traits?.ideals || '')}</ideals>
    <personalitytraits type="string">${this.sanitizeString(characterData.traits?.personalityTraits || '')}</personalitytraits>
    <race type="string">${this.sanitizeString(characterData.race?.fullName || 'Unknown')}</race>
    <racelink type="windowreference">
      <class>reference_race</class>
      <recordname>reference.race.${this.sanitizeString((characterData.race?.fullName || 'unknown').toLowerCase().replace(/\s+/g, ''))}@*</recordname>
    </racelink>
    <background type="string">${this.sanitizeString(characterData.background?.definition?.name || '')}</background>
    <backgroundlink type="windowreference">
      <class>reference_background</class>
      <recordname>reference.background.${this.sanitizeString((characterData.background?.definition?.name || 'unknown').toLowerCase().replace(/\s+/g, ''))}@*</recordname>
    </backgroundlink>
    <level type="number">${totalLevel}</level>
    <profbonus type="number">${proficiencyBonus}</profbonus>
    <notes type="string">${this.generateNotesText(characterData, characterId)}</notes>
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
        <name type="string">${this.sanitizeString(cls.definition?.name || 'Unknown')}</name>
        <shortcut type="windowreference">
          <class>reference_class</class>
          <recordname>reference.class.${this.sanitizeString((cls.definition?.name || 'unknown').toLowerCase())}@*</recordname>
        </shortcut>
      </id-${String(index + 1).padStart(5, '0')}>`
      ).join('\n      ') || ''}
    </classes>
    
    <!-- Currency -->
    <coins>
      ${this.generateCoinsXML(characterData)}
    </coins>
    
    <!-- Hit Points -->
    <hp>
      <total type="number">${this.calculateHP(characterData)}</total>
      <wounds type="number">0</wounds>
      <temporary type="number">0</temporary>
    </hp>

    <!-- Defenses -->
    <defenses>
      <ac>
        ${this.generateACComponents(characterData)}
      </ac>
    </defenses>
    
    ${this.generateEncumbranceXML(characterData)}
    
    <!-- Placeholder sections for Phase 2 -->
    <featlist>
      ${this.generateFeatsXML(characterData)}
    </featlist>
    
    <featurelist>
      ${this.generateFeaturesXML(characterData)}
    </featurelist>
    
    ${this.generateInventoryXML(characterData)}
    
    <languagelist>
      ${this.generateLanguagesXML(characterData)}
    </languagelist>
    
    <powergrouplist>
      ${this.generatePowerGroupXML(characterData)}
    </powergrouplist>
    
    <skilllist>
      ${this.generateSkillsXML(characterData)}
    </skilllist>
    
    <proficiencylist>
      ${this.generateProficienciesXML(characterData)}
    </proficiencylist>
    
    <traitlist>
      ${this.generateTraitsXML(characterData)}
    </traitlist>
    
    <weaponlist>
      ${this.generateWeaponsXML(characterData)}
    </weaponlist>
    
    <powers>
      ${this.generateSpellsXML(characterData)}
    </powers>
    
    ${this.generatePowerMetaXML(characterData)}
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
   * Generate powergroup XML for spell casting (goes in powergrouplist)
   */
  private generatePowerGroupXML(characterData: CharacterData): string {
    if (!featureFlags.isEnabled('spell_slot_calculator')) {
      return '<!-- Spell slots disabled by feature flag -->';
    }

    try {
      // Extract class information and calculate spell slots
      const classInfo = this.extractClassInfo(characterData);
      const spellSlotResult = this.calculateSpellSlots(classInfo);
      
      if (!spellSlotResult || !spellSlotResult.spellSlots) {
        return '<!-- No spell slots calculated -->';
      }

      const slots = spellSlotResult.spellSlots;
      
      // Check if character has warlock levels (pact magic)
      const hasWarlock = classInfo.some(c => c.classDefinition.name.toLowerCase() === 'warlock');
      
      // Check if character has any spell slots OR pact magic
      const hasAnySlots = Object.values(spellSlotResult.spellSlots).some(count => count > 0);
      const hasPactMagic = Object.values(spellSlotResult.pactMagicSlots).some(count => count > 0);
      
      if (!hasAnySlots && !hasPactMagic) {
        return '<!-- Character has no spell slots -->';
      }
      
      if (hasWarlock && hasPactMagic) {
        // Generate pact magic powergroup for warlock
        return this.generatePactMagicPowerGroupXML(characterData, classInfo);
      } else {
        // Generate regular spell powergroups
        return this.generateRegularSpellPowerGroupXML(spellSlotResult.spellSlots, spellSlotResult.debugInfo);
      }
    } catch (error) {
      console.error('Error generating spell slots XML:', error);
      return '<!-- Error generating spell slots -->';
    }
  }

  /**
   * Generate regular spell powergroups XML (non-warlock) - goes in powergrouplist
   */
  private generateRegularSpellPowerGroupXML(slots: any, casterBreakdown: any): string {
    const spellLevels = [
      { key: 'level1', name: '1st Level' },
      { key: 'level2', name: '2nd Level' },
      { key: 'level3', name: '3rd Level' },
      { key: 'level4', name: '4th Level' },
      { key: 'level5', name: '5th Level' },
      { key: 'level6', name: '6th Level' },
      { key: 'level7', name: '7th Level' },
      { key: 'level8', name: '8th Level' },
      { key: 'level9', name: '9th Level' }
    ];

    let xml = '';
    let groupId = 1;

    spellLevels.forEach(level => {
      const slotCount = slots[level.key] || 0;
      if (slotCount > 0) {
        xml += `      <id-${String(groupId).padStart(5, '0')}>
        <castertype type="string">memorized</castertype>
        <name type="string">${this.sanitizeString(level.name + ' Spells')}</name>
        <stat type="string">charisma</stat>
        <powers>
          <!-- Spell slots: ${slotCount} -->
        </powers>
      </id-${String(groupId).padStart(5, '0')}>
`;
        groupId++;
      }
    });

    return xml || '<!-- No spell slots available -->';
  }

  /**
   * Generate pact magic powergroup XML for warlock - goes in powergrouplist
   */
  private generatePactMagicPowerGroupXML(characterData: CharacterData, classInfo: any[]): string {
    const warlockClass = classInfo.find(c => c.name === 'warlock');
    if (!warlockClass) {
      return '<!-- No warlock class found -->';
    }

    // Warlock pact magic progression (different from regular spell slots)
    const pactMagicSlots = this.getWarlockPactMagicSlots(warlockClass.level);
    
    let xml = `      <id-00001>
        <castertype type="string">pact</castertype>
        <name type="string">Pact Magic</name>
        <stat type="string">charisma</stat>
        <powers>
          <!-- Warlock spells -->
        </powers>
      </id-00001>
`;

    return xml;
  }

  /**
   * Get warlock pact magic slots (different progression than regular casters)
   */
  private getWarlockPactMagicSlots(level: number): any {
    // Warlock pact magic progression from PHB Table 1-1
    // Warlocks get pact magic slots, not regular spell slots
    
    if (level >= 17) return { level5: 4 };      // 17-20: 4 5th-level pact slots
    if (level >= 15) return { level5: 3 };      // 15-16: 3 5th-level pact slots  
    if (level >= 11) return { level5: 2 };      // 11-14: 2 5th-level pact slots
    if (level >= 9) return { level5: 2 };       // 9-10: 2 5th-level pact slots
    if (level >= 7) return { level4: 2 };       // 7-8: 2 4th-level pact slots
    if (level >= 5) return { level3: 2 };       // 5-6: 2 3rd-level pact slots
    if (level >= 3) return { level2: 2 };       // 3-4: 2 2nd-level pact slots
    if (level >= 2) return { level1: 2 };       // 2: 2 1st-level pact slots
    if (level >= 1) return { level1: 1 };       // 1: 1 1st-level pact slot
    
    return {};
  }

  /**
   * Generate powermeta XML section with spell slot counts
   */
  private generatePowerMetaXML(characterData: CharacterData): string {
    if (!featureFlags.isEnabled('spell_slot_calculator')) {
      return '<!-- Spell slot meta disabled by feature flag -->';
    }

    try {
      // Extract class information and calculate spell slots
      const classInfo = this.extractClassInfo(characterData);
      const spellSlotResult = this.calculateSpellSlots(classInfo);
      
      if (!spellSlotResult || !spellSlotResult.spellSlots) {
        return '<!-- No spell slot meta calculated -->';
      }

      // Generate XML using the new service
      const xmlResult = this.spellSlotCalculator.generateSpellSlotsXML(spellSlotResult);
      return `    ${xmlResult.combinedXML}`;
    } catch (error) {
      console.error('Failed to generate spell slot meta XML:', error);
      return '<!-- Spell slot meta generation failed -->';
    }
  }

  /**
   * Generate power group XML for spellcasting (gets power slot information)
   */
  private generateSpellSlotsXML(characterData: CharacterData): string {
    if (!featureFlags.isEnabled('spell_slot_calculator')) {
      return '<!-- Spell slots disabled by feature flag -->';
    }

    try {
      // Extract class information and calculate spell slots
      const classInfo = this.extractClassInfo(characterData);
      const spellSlotResult = this.calculateSpellSlots(classInfo);
      
      if (!spellSlotResult || !spellSlotResult.spellSlots) {
        return '<!-- No spell slots calculated -->';
      }

      // Generate XML using the new service
      const xmlResult = this.spellSlotCalculator.generateSpellSlotsXML(spellSlotResult);
      
      // Check if character has any spell slots or pact magic
      const hasAnySlots = Object.values(spellSlotResult.spellSlots).some(count => count > 0);
      const hasPactMagic = Object.values(spellSlotResult.pactMagicSlots).some(count => count > 0);
      
      if (!hasAnySlots && !hasPactMagic) {
        return '<!-- Character has no spell slots -->';
      }
      
      return xmlResult.spellSlotsXML || xmlResult.pactMagicXML;
    } catch (error) {
      console.error('Failed to generate spell slots XML:', error);
      return '<!-- Spell slots generation failed -->';
    }
  }

  /**
   * Generate abilities XML with proper template structure
   */
  private generateAbilitiesXML(characterData: CharacterData): string {
    const abilities = gameConfigService.getAbilities();
    
    // Get properly calculated ability scores (uses our corrected logic)
    const calculatedAbilities = this.getAbilityScores(characterData);
    
    return abilities.map((ability) => {
      // Use our properly calculated final scores instead of raw bonusStats
      const finalScore = calculatedAbilities[ability.name] || gameConfigService.getDefaultAbilityScore();
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
   * Sanitize string content using either new StringSanitizer or legacy method
   * Based on feature flags for gradual migration
   * 
   * @param input - String to sanitize
   * @returns Sanitized string safe for XML
   */
  private sanitizeString(input: unknown): string {
    if (featureFlags.isEnabled('string_sanitizer_service')) {
      return StringSanitizer.sanitizeForXML(input);
    } else {
      // Legacy fallback - would call legacy fixQuote function
      // For now, we'll use the compatibility function
      return StringSanitizer.sanitizeForXML(input);
    }
  }

  /**
   * Safely access nested object properties using either new SafeAccess or legacy method
   * Based on feature flags for gradual migration
   * 
   * @param obj - Object to access
   * @param path - Dot-separated path
   * @param defaultValue - Default value if path not found
   * @returns Value at path or defaultValue
   */
  private safeAccess(obj: unknown, path: string, defaultValue: any = null): any {
    if (featureFlags.isEnabled('safe_access_service')) {
      return SafeAccess.get(obj, path, defaultValue);
    } else {
      // Legacy fallback - would call legacy safeAccess function
      // For now, we'll use the compatibility function
      return SafeAccess.get(obj, path, defaultValue);
    }
  }

  /**
   * Process ability score bonuses using either modern AbilityScoreProcessor or legacy method
   * Based on feature flags for gradual migration
   * 
   * @param characterData - Character data from D&D Beyond
   * @returns Processed ability score result with bonuses and totals
   */
  private processAbilityBonuses(characterData: CharacterData): any {
    if (featureFlags.isEnabled('ability_score_processor')) {
      return AbilityScoreProcessor.processAbilityScoreBonuses(characterData);
    } else {
      // Legacy fallback - would call legacy processAbilityScoreBonuses function
      // For now, we'll use the compatibility function
      return AbilityScoreProcessor.processAbilityScoreBonuses(characterData);
    }
  }

  /**
   * Get ability scores using either modern AbilityScoreProcessor or legacy method
   * Based on feature flags for gradual migration
   * 
   * @param characterData - Character data from D&D Beyond
   * @returns Object with ability names as keys and scores as values
   */
  private getAbilityScores(characterData: CharacterData): Record<string, number> {
    if (featureFlags.isEnabled('ability_score_processor')) {
      // Use the modern AbilityScoreProcessor to get properly calculated scores
      const result = AbilityScoreProcessor.processAbilityScoreBonuses(characterData);
      const abilities: Record<string, number> = {};
      
      // Extract total scores from the processed result
      ABILITY_NAMES.forEach(abilityName => {
        abilities[abilityName] = result.totalScores[abilityName]?.total || 10;
      });
      
      return abilities;
    } else if (featureFlags.isEnabled('ability_constants')) {
      // Use AbilityConstants but with original bonusStats (legacy behavior)
      return AbilityScoreUtils.convertLegacyAbilities(
        characterData.stats || [],
        characterData.bonusStats,
        characterData.overrideStats
      );
    } else {
      // Legacy fallback - manual processing
      const abilities: Record<string, number> = {};
      const abilityNames = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];
      
      abilityNames.forEach((name, index) => {
        const baseStat = characterData.stats?.[index]?.value || 10;
        const bonus = characterData.bonusStats?.[index]?.value || 0;
        const override = characterData.overrideStats?.[index]?.value;
        
        abilities[name] = override !== null && override !== undefined ? override : baseStat + bonus;
      });
      
      return abilities;
    }
  }

  /**
   * Enable or disable ability score processor debugging
   */
  enableAbilityScoreDebug(enabled: boolean = true): void {
    AbilityScoreProcessor.setDebugMode(enabled);
    console.log(`🔍 Ability Score Processor debug mode ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Enable or disable spell slot calculator debugging
   */
  enableSpellSlotDebug(enabled: boolean = true): void {
    SpellSlotCalculator.setDebugMode(enabled);
    console.log(`🪄 Spell Slot Calculator debug mode ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Extract class information from D&D Beyond character data
   * Converts D&D Beyond class structure to SpellSlotCalculator format
   * 
   * @param characterData - Character data from D&D Beyond
   * @returns Array of ClassInfo objects for spell slot calculation
   */
  extractClassInfo(characterData: CharacterData): CharacterClass[] {
    if (!characterData.classes || !Array.isArray(characterData.classes)) {
      return [];
    }

    return characterData.classes.map((classData: any, index: number) => {
      const className = (classData.definition?.name || 'unknown');
      const level = classData.level || 1;
      const subclass = classData.subclassDefinition?.name;

      return {
        id: classData.definition?.id || index + 1,
        level,
        classDefinition: {
          id: classData.definition?.id || index + 1,
          name: className,
          canCastSpells: classData.definition?.canCastSpells || false,
          spellCastingAbilityId: classData.definition?.spellCastingAbilityId
        },
        subclassDefinition: subclass ? {
          id: classData.subclassDefinition?.id || 0,
          name: subclass
        } : undefined
      } as CharacterClass;
    });
  }

  /**
   * Calculate spell slots using either modern SpellSlotCalculator or legacy method
   * Based on feature flags for gradual migration
   * 
   * @param classInfo - Array of class information
   * @returns Spell slot calculation result
   */
  calculateSpellSlots(classes: CharacterClass[]): any {
    if (featureFlags.isEnabled('spell_slot_calculator')) {
      return this.spellSlotCalculator.calculateSpellSlots(classes);
    } else {
      // Legacy fallback - would call legacy getSpellSlots function
      // For now, we'll use the compatibility function
      return this.spellSlotCalculator.calculateSpellSlots(classes);
    }
  }

  /**
   * Generate encumbrance XML using modern services or legacy fallback
   * 
   * @param characterData - Character data from D&D Beyond
   * @returns Encumbrance XML string for Fantasy Grounds
   */
  private generateEncumbranceXML(characterData: CharacterData): string {
    try {
      const encumbranceResult = this.calculateEncumbrance(characterData);
      
      if (encumbranceResult) {
        console.log(`⚖️ Generated encumbrance XML: ${encumbranceResult.totalWeight} lbs, ${encumbranceResult.encumbranceLevel}`);
        
        return `<!-- Encumbrance -->
    <encumbrance>
      <encumbered type="number">${encumbranceResult.carryingCapacity.normal}</encumbered>
      <encumberedheavy type="number">${encumbranceResult.carryingCapacity.normal * 2}</encumberedheavy>
      <liftpushdrag type="number">${encumbranceResult.carryingCapacity.push}</liftpushdrag>
      <load type="number">${Math.round(encumbranceResult.totalWeight)}</load>
      <max type="number">${encumbranceResult.carryingCapacity.normal}</max>
    </encumbrance>`;
      } else {
        console.warn('No encumbrance data calculated');
        return `<!-- Encumbrance -->
    <encumbrance>
      <encumbered type="number">0</encumbered>
      <encumberedheavy type="number">0</encumberedheavy>
      <liftpushdrag type="number">0</liftpushdrag>
      <load type="number">0</load>
      <max type="number">0</max>
    </encumbrance>`;
      }
    } catch (error) {
      console.error('Failed to generate encumbrance XML:', error);
      return `<!-- Encumbrance generation failed -->
    <encumbrance>
      <encumbered type="number">0</encumbered>
      <encumberedheavy type="number">0</encumberedheavy>
      <liftpushdrag type="number">0</liftpushdrag>
      <load type="number">0</load>
      <max type="number">0</max>
    </encumbrance>`;
    }
  }

  /**
   * Generate inventory XML using modern services or legacy fallback
   * 
   * @param characterData - Character data from D&D Beyond
   * @returns Inventory XML string for Fantasy Grounds
   */
  private generateInventoryXML(characterData: CharacterData): string {
    try {
      const inventoryResult = this.processInventory(characterData);
      
      if (inventoryResult.xmlResult && inventoryResult.xmlResult.xml) {
        console.log(`📦 Generated inventory XML: ${inventoryResult.statistics.totalItems} items`);
        return inventoryResult.xmlResult.xml;
      } else {
        console.warn('No inventory XML generated');
        return '<inventorylist>\n\t\t\t<!-- No inventory items -->\n\t\t</inventorylist>';
      }
    } catch (error) {
      console.error('Failed to generate inventory XML:', error);
      return '<inventorylist>\n\t\t\t<!-- Inventory generation failed -->\n\t\t</inventorylist>';
    }
  }

  /**
   * Generate Fantasy Grounds XML for character features using FeatureProcessor
   * 
   * @param characterData - Character data from D&D Beyond
   * @returns Fantasy Grounds feature list XML
   */
  private generateFeaturesXML(characterData: CharacterData): string {
    if (featureFlags.isEnabled('feature_processor')) {
      try {
        console.log('🎭 Using modern FeatureProcessor service for class features');
        
        // Enable debug mode if feature flag is set
        if (featureFlags.isEnabled('feature_processor_debug')) {
          FeatureProcessor.setDebugMode(true);
        }
        
        // Process character features
        const processedFeatures = this.featureProcessor.processCharacterFeatures(characterData);
        
        // Generate XML from processed features
        const featuresXML = this.featureProcessor.generateFeaturesXML(processedFeatures);
        
        // Reset debug mode
        FeatureProcessor.setDebugMode(false);
        
        // Show detailed breakdown if debug is enabled
        if (featureFlags.isEnabled('feature_processor_debug')) {
          console.log('Class Features Breakdown:', processedFeatures.debugInfo.classBreakdown);
          console.log(`Processing Method: ${processedFeatures.debugInfo.processingMethod}`);
          
          // Show features grouped by source
          console.log('Features by Class:', processedFeatures.featuresByClass);
          console.log('Traits by Race:', processedFeatures.traitsByRace);
          
          // Validate feature data
          const featureValidation = FeatureProcessor.validateCharacterData(characterData);
          console.log('Feature Data Validation:', {
            isValid: featureValidation.isValid,
            errorCount: featureValidation.errors.length
          });
          
          if (featureValidation.errors.length > 0) {
            console.error('Feature Data Errors:', featureValidation.errors);
          }
        }
        
        console.log(`🎭 Generated features XML: ${processedFeatures.totalFeatures} total features`);
        return featuresXML;
        
      } catch (error) {
        console.error('Failed to generate features XML:', error);
        return '<!-- Feature processing failed -->';
      }
    } else {
      console.log('🎭 Using legacy feature processing (placeholder)');
      return '<!-- Legacy feature processing not yet implemented -->';
    }
  }

  private generateTraitsXML(characterData: CharacterData): string {
    if (featureFlags.isEnabled('feature_processor')) {
      try {
        console.log('🎭 Using modern FeatureProcessor service for racial traits');
        
        // Enable debug mode if feature flag is set
        if (featureFlags.isEnabled('feature_processor_debug')) {
          FeatureProcessor.setDebugMode(true);
        }
        
        // Process character features
        const processedFeatures = this.featureProcessor.processCharacterFeatures(characterData);
        
        // Generate XML from processed traits
        const traitsXML = this.featureProcessor.generateTraitsXML(processedFeatures);
        
        // Reset debug mode
        FeatureProcessor.setDebugMode(false);
        
        // Show detailed breakdown if debug is enabled
        if (featureFlags.isEnabled('feature_processor_debug')) {
          console.log('Racial Traits Breakdown:', processedFeatures.debugInfo.raceBreakdown);
          console.log(`Processing Method: ${processedFeatures.debugInfo.processingMethod}`);
          console.log('Traits by Race:', processedFeatures.traitsByRace);
        }
        
        console.log(`🎭 Generated traits XML: ${processedFeatures.debugInfo.raceBreakdown.traitCount} total traits`);
        return traitsXML;
        
      } catch (error) {
        console.error('Failed to generate traits XML:', error);
        return '<!-- Trait processing failed -->';
      }
    } else {
      console.log('🎭 Using legacy trait processing (placeholder)');
      return '<!-- Legacy trait processing not yet implemented -->';
    }
  }

  /**
   * Generate weaponlist XML from character inventory data
   */
  private generateWeaponsXML(characterData: CharacterData): string {
    try {
      console.log('⚔️ Generating weapons XML');
      
      if (!featureFlags.isEnabled('inventory_processor')) {
        console.log('⚔️ Inventory processor disabled by feature flag');
        return '<!-- Inventory processor disabled -->';
      }

      // Process inventory to get weapons
      console.log('⚔️ Character inventory data:', {
        hasInventory: !!characterData.inventory,
        inventoryLength: characterData.inventory?.length || 0,
        inventoryType: Array.isArray(characterData.inventory) ? 'array' : typeof characterData.inventory
      });

      const inventoryResult = this.inventoryProcessor.processInventory(
        characterData.inventory || [],
        characterData.id,
        {
          includeZeroQuantityItems: false,
          respectContainerHierarchy: true,
          generateDetailedXML: true,
          sanitizeOutput: true,
          includeCostInformation: false,
          markItemsAsIdentified: true
        }
      );

      console.log('⚔️ Inventory processing result:', {
        hasResult: !!inventoryResult,
        hasNestedStructure: !!inventoryResult?.nestedStructure,
        hasRootItems: !!inventoryResult?.nestedStructure?.rootItems,
        rootItemsType: Array.isArray(inventoryResult?.nestedStructure?.rootItems) ? 'array' : typeof inventoryResult?.nestedStructure?.rootItems,
        rootItemsLength: inventoryResult?.nestedStructure?.rootItems?.length || 0
      });

      const weapons: Array<{
        id: number;
        name: string;
        properties: string;
        attackBonus: number;
        attackStat: string;
        damage: {
          dice: string;
          bonus: number;
          type: string;
        };
        weaponType: number; // 0: Melee, 1: Ranged, 2: Thrown
        maxAmmo?: number;
        shortcut: string;
      }> = [];

      // Extract weapon items from inventory
      let weaponIndex = 0;
      
      // Safety check for inventory result structure
      if (!inventoryResult || !inventoryResult.nestedStructure || !inventoryResult.nestedStructure.rootItems) {
        console.log('⚔️ No inventory items found or invalid inventory structure');
        return '<!-- No inventory items found -->';
      }
      
      const items = inventoryResult.nestedStructure.rootItems;
      const containers = inventoryResult.nestedStructure.containers;
      const totalItems = items.length;
      
      if (featureFlags.isEnabled('weaponlist_debug')) {
        console.log(`⚔️ Processing ${totalItems} root items + ${containers.size} containers for weapons`);
      }
      
      // Check root items first
      for (const item of items) {
        if (featureFlags.isEnabled('weaponlist_debug')) {
          console.log(`⚔️ Checking item: ${item.definition.name}`, {
            filterType: item.definition.filterType,
            isWeapon: item.definition.filterType === 'Weapon',
            itemType: item.definition.type,
            equipped: item.equipped,
            hasWeaponBehaviors: !!item.definition.weaponBehaviors
          });
        }
        
        if (this.isWeapon(item)) {
          if (featureFlags.isEnabled('weaponlist_debug')) {
            console.log(`⚔️ Found weapon: ${item.definition.name}`);
          }
          const weaponData = this.extractWeaponData(item, weaponIndex);
          if (weaponData) {
            weapons.push(weaponData);
            weaponIndex++;
            
            // Handle thrown weapons - they appear twice (melee and ranged)
            if (this.isThrown(item)) {
              const thrownData = this.extractThrownWeaponData(item, weaponIndex);
              if (thrownData) {
                weapons.push(thrownData);
                weaponIndex++;
              }
            }
          }
        }
      }

      // Check items inside containers
      if (featureFlags.isEnabled('weaponlist_debug')) {
        console.log(`⚔️ Checking ${containers.size} containers for weapons`);
      }
      
      containers.forEach((container, containerId) => {
        if (featureFlags.isEnabled('weaponlist_debug')) {
          console.log(`⚔️ Checking container: ${container.definition.name} with ${container.contents.length} items`);
        }
        
        for (const item of container.contents) {
          if (featureFlags.isEnabled('weaponlist_debug')) {
            console.log(`⚔️ Checking container item: ${item.definition.name}`, {
              filterType: item.definition.filterType,
              isWeapon: item.definition.filterType === 'Weapon',
              containerName: container.definition.name
            });
          }
          
          if (this.isWeapon(item)) {
            if (featureFlags.isEnabled('weaponlist_debug')) {
              console.log(`⚔️ Found weapon in container: ${item.definition.name}`);
            }
            const weaponData = this.extractWeaponData(item, weaponIndex);
            if (weaponData) {
              weapons.push(weaponData);
              weaponIndex++;
              
              // Handle thrown weapons - they appear twice (melee and ranged)
              if (this.isThrown(item)) {
                const thrownData = this.extractThrownWeaponData(item, weaponIndex);
                if (thrownData) {
                  weapons.push(thrownData);
                  weaponIndex++;
                }
              }
            }
          }
        }
      });

      // Link ammunition to weapons that require it
      this.linkAmmoToWeapons(weapons, inventoryResult.nestedStructure);

      // Add monk unarmed strike if character is a monk
      const isMonk = this.isCharacterMonk(characterData);
      if (isMonk) {
        weapons.push(this.getMonkUnarmedStrike(weaponIndex));
      }

      console.log(`⚔️ Final weapons array length: ${weapons.length}`, weapons);

      // Generate XML
      let xml = '';
      weapons.forEach((weapon, index) => {
        const weaponId = String(index + 1).padStart(5, '0');
        xml += `      <id-${weaponId}>
        <attackbonus type="number">${weapon.attackBonus}</attackbonus>
        <attackstat type="string">${weapon.attackStat}</attackstat>
        <carried type="number">1</carried>
        <damagelist>
          <id-00001>
            <bonus type="number">${weapon.damage.bonus}</bonus>
            <dice type="dice">${weapon.damage.dice}</dice>
            <stat type="string">${weapon.attackStat}</stat>
            <type type="string">${weapon.damage.type}</type>
          </id-00001>
        </damagelist>
        <handling type="number">0</handling>
        <isidentified type="number">1</isidentified>
        <name type="string">${this.sanitizeString(weapon.name)}</name>
        <properties type="string">${this.sanitizeString(weapon.properties)}</properties>
        <shortcut type="windowreference">
          <class>item</class>
          <recordname>${weapon.shortcut}</recordname>
        </shortcut>
        <type type="number">${weapon.weaponType}</type>`;
        
        if (weapon.maxAmmo !== undefined) {
          xml += `
        <maxammo type="number">${weapon.maxAmmo}</maxammo>`;
        }
        
        xml += `
      </id-${weaponId}>
`;
      });

      console.log(`⚔️ Generated weapons XML: ${weapons.length} weapons`);
      return xml;
      
    } catch (error) {
      console.error('Failed to generate weapons XML:', error);
      return '<!-- Weapon processing failed -->';
    }
  }

  /**
   * Generate spelllist XML from character spell data
   */
  private generateSpellsXML(characterData: CharacterData): string {
    try {
      console.log('🪄 Generating spells XML');
      
      // Check if character has spells
      if (!characterData.spells || !characterData.classSpells) {
        console.log('🪄 No spell data found');
        return '<!-- No spells found -->';
      }

      const spells: Array<{
        id: number;
        name: string;
        level: number;
        school: string;
        source: string;
        prepared: boolean;
        description: string;
        components: string;
        castingTime: string;
        range: string;
        duration: string;
        concentration: boolean;
        ritual: boolean;
        saveDc?: number;
        attackRoll?: boolean;
      }> = [];

      let spellIndex = 0;

      // Process class spells (primary source)
      if (featureFlags.isEnabled('spelllist_debug')) {
        console.log(`🪄 Processing ${characterData.classSpells?.length || 0} class spell collections`);
      }
      
      characterData.classSpells?.forEach(classSpellData => {
        const className = this.getClassNameById(characterData, classSpellData.characterClassId);
        
        if (featureFlags.isEnabled('spelllist_debug')) {
          console.log(`🪄 Processing ${className} spells: ${classSpellData.spells?.length || 0} spells`);
        }
        
        classSpellData.spells?.forEach(spell => {
          const spellData = this.extractSpellData(spell, className);
          if (spellData) {
            if (featureFlags.isEnabled('spelllist_debug')) {
              console.log(`🪄 Added ${className} spell: ${spellData.name} (Level ${spellData.level})`);
            }
            spells.push(spellData);
            spellIndex++;
          }
        });
      });

      // Process other spell sources
      if (characterData.spells.class) {
        characterData.spells.class.forEach(spell => {
          const spellData = this.extractSpellData(spell, 'Class');
          if (spellData) {
            spells.push(spellData);
            spellIndex++;
          }
        });
      }

      // Add race spells
      if (characterData.spells.race) {
        characterData.spells.race.forEach(spell => {
          const spellData = this.extractSpellData(spell, 'Race');
          if (spellData) {
            spells.push(spellData);
            spellIndex++;
          }
        });
      }

      // Add feat spells
      if (characterData.spells.feat) {
        characterData.spells.feat.forEach(spell => {
          const spellData = this.extractSpellData(spell, 'Feat');
          if (spellData) {
            spells.push(spellData);
            spellIndex++;
          }
        });
      }

      // Add item spells
      if (characterData.spells.item) {
        characterData.spells.item.forEach(spell => {
          const spellData = this.extractSpellData(spell, 'Item');
          if (spellData) {
            spells.push(spellData);
            spellIndex++;
          }
        });
      }

      console.log(`🪄 Found ${spells.length} spells total`);

      // Add class features and racial traits as powers
      const features = this.extractActivePowers(characterData);
      
      if (featureFlags.isEnabled('spelllist_debug')) {
        console.log(`🪄 Found ${features.length} active features/traits to add as powers`);
        features.forEach(feature => {
          console.log(`🪄 Feature found: ${feature.name} (${feature.source})`);
        });
      }
      
      features.forEach(feature => spells.push(feature));
      
      console.log(`🪄 Found ${features.length} active features/traits to add as powers`);
      console.log(`🪄 Total powers (spells + features): ${spells.length}`);

      // Generate XML in Fantasy Grounds powers format
      let xml = '';
      spells.forEach((spell, index) => {
        const spellId = String(index + 1).padStart(5, '0');
        xml += `      <id-${spellId}>`;

        // Generate actions first (this is the core of the power)
        const actions = this.generateSpellActions(spell);
        if (actions) {
          xml += `
        <actions>
${actions}        </actions>`;
        }
        
        // Add metadata - different for spells vs features
        if (spell.powerType === 'feature') {
          // Feature metadata
          xml += `
        <cast type="number">0</cast>
        <description type="formattedtext">
          <p>${this.sanitizeString(spell.description)}</p>
        </description>
        <group type="string">${this.sanitizeString(spell.group)}</group>
        <level type="number">${spell.level}</level>
        <locked type="number">1</locked>
        <name type="string">${this.sanitizeString(spell.name)}</name>
        <prepared type="number">${spell.prepared}</prepared>
        <ritual type="number">${spell.ritual ? 1 : 0}</ritual>
        <source type="string">${this.sanitizeString(spell.source)}</source>`;
        } else {
          // Spell metadata
          xml += `
        <castingtime type="string">${this.sanitizeString(spell.castingTime)}</castingtime>
        <components type="string">${this.sanitizeString(spell.components)}</components>
        <description type="formattedtext">
          <p>${this.sanitizeString(spell.description)}</p>
        </description>
        <duration type="string">${this.sanitizeString(spell.duration)}</duration>
        <group type="string">Spells</group>
        <level type="number">${spell.level}</level>
        <name type="string">${this.sanitizeString(spell.name)}</name>
        <prepared type="number">${spell.prepared ? 1 : 0}</prepared>
        <range type="string">${this.sanitizeString(spell.range)}</range>
        <ritual type="number">${spell.ritual ? 1 : 0}</ritual>
        <school type="string">${this.sanitizeString(spell.school)}</school>
        <source type="string">${this.sanitizeString(spell.source)}</source>`;
        }
        
        xml += `
      </id-${spellId}>
`;
      });

      console.log(`🪄 Generated spells XML: ${spells.length} spells`);
      return xml;
      
    } catch (error) {
      console.error('Failed to generate spells XML:', error);
      return '<!-- Spell processing failed -->';
    }
  }

  /**
   * Generate featlist XML from character feat data
   */
  private generateFeatsXML(characterData: CharacterData): string {
    try {
      console.log('📜 Generating feats XML');
      
      const feats = characterData.feats || [];
      if (!Array.isArray(feats)) {
        console.log('📜 No feats array found in character data');
        return '<!-- No feats data found -->';
      }

      if (feats.length === 0) {
        console.log('📜 Character has no feats');
        return '<!-- Character has no feats -->';
      }

      let xml = '';
      feats.forEach((feat, index) => {
        const featId = String(index + 1).padStart(5, '0');
        const featName = feat.definition?.name || feat.name || 'Unknown Feat';
        const featDescription = feat.definition?.description || feat.description || '';
        
        xml += `      <id-${featId}>
        <locked type="number">1</locked>
        <name type="string">${this.sanitizeString(featName)}</name>
        <text type="formattedtext">
          <p>${this.sanitizeString(featDescription)}</p>
        </text>
      </id-${featId}>
`;
        
        // Check for special feats that affect character stats (like legacy code)
        if (featName === "Medium Armor Master") {
          console.log('📜 Found Medium Armor Master feat');
        } else if (featName === "Alert") {
          console.log('📜 Found Alert feat');
        } else if (featName === "Mobile") {
          console.log('📜 Found Mobile feat');
        } else if (featName === "Observant") {
          console.log('📜 Found Observant feat');
        }
      });

      console.log(`📜 Generated feats XML: ${feats.length} feats`);
      return xml;
      
    } catch (error) {
      console.error('Failed to generate feats XML:', error);
      return '<!-- Feat processing failed -->';
    }
  }

  /**
   * Generate coins XML from character currency data
   */
  private generateCoinsXML(characterData: CharacterData): string {
    try {
      console.log('💰 Generating coins XML');
      
      // Extract currency data from character
      const currencies = characterData.currencies || {};
      
      if (Object.keys(currencies).length === 0) {
        console.log('💰 No currency data found in character');
        // Return default structure with zeros
      }

      // D&D 5e standard currencies in order: PP, GP, EP, SP, CP
      const currencyOrder = [
        { key: 'pp', name: 'PP', amount: currencies.pp || 0 },
        { key: 'gp', name: 'GP', amount: currencies.gp || 0 },
        { key: 'ep', name: 'EP', amount: currencies.ep || 0 },
        { key: 'sp', name: 'SP', amount: currencies.sp || 0 },
        { key: 'cp', name: 'CP', amount: currencies.cp || 0 }
      ];

      let xml = '';
      currencyOrder.forEach((currency, index) => {
        const slotNumber = index + 1;
        xml += `      <slot${slotNumber}>
        <amount type="number">${currency.amount}</amount>
        <name type="string">${currency.name}</name>
      </slot${slotNumber}>
`;
      });

      // Add empty slot6 (like legacy code)
      xml += `      <slot6>
        <amount type="number">0</amount>
      </slot6>
`;

      console.log(`💰 Generated coins XML:`, currencyOrder.map(c => `${c.name}: ${c.amount}`).join(', '));
      return xml;
      
    } catch (error) {
      console.error('Failed to generate coins XML:', error);
      return '<!-- Coin processing failed -->';
    }
  }

  /**
   * Generate character notes text from D&D Beyond notes data
   */
  private generateNotesText(characterData: CharacterData, characterId: string): string {
    try {
      console.log('📝 Generating character notes');
      
      let allNotes = '';
      
      // Add character ID header (like legacy code)
      allNotes += `D&D Beyond Character ID: ${characterId}\\n`;
      
      // Process character notes if they exist
      if (characterData.notes && typeof characterData.notes === 'object') {
        const noteEntries = Object.entries(characterData.notes);
        
        if (noteEntries.length > 0) {
          console.log(`📝 Found ${noteEntries.length} note categories`);
          
          noteEntries.forEach(([key, value]) => {
            if (value !== null && value !== undefined && value !== '') {
              // Capitalize first letter of the key (like legacy code)
              const capitalizedKey = key.charAt(0).toUpperCase() + key.substring(1);
              
              // Clean and format the value
              const cleanValue = this.sanitizeString(value).trim();
              
              allNotes += `${capitalizedKey}: ${cleanValue}\\n`;
              
              console.log(`📝 Added note: ${capitalizedKey} (${cleanValue.length} chars)`);
            }
          });
        } else {
          console.log('📝 Notes object exists but is empty');
        }
      } else {
        console.log('📝 No notes found in character data');
      }
      
      // Remove any trailing newlines and return
      const finalNotes = allNotes.replace(/\\n$/, '');
      console.log(`📝 Generated notes text (${finalNotes.length} chars total)`);
      
      return this.sanitizeString(finalNotes);
      
    } catch (error) {
      console.error('Failed to generate notes text:', error);
      return this.sanitizeString(`Character converted from D&D Beyond (ID: ${characterId}) using Modern Converter v2.0`);
    }
  }

  private generateProficienciesXML(characterData: CharacterData): string {
    try {
      console.log('🛠️ Generating proficiencies XML');
      
      const proficiencies = new Set<string>();
      
      // Extract proficiencies from modifiers
      if (characterData.modifiers) {
        Object.values(characterData.modifiers).forEach(modifierArray => {
          if (Array.isArray(modifierArray)) {
            modifierArray.forEach(modifier => {
              if (modifier.type === 'proficiency' && modifier.isGranted) {
                const profName = modifier.friendlySubtypeName || modifier.subType;
                
                // Filter out skills (already handled in skilllist), saving throws, and placeholder proficiencies
                if (!this.isSkillProficiency(modifier.subType) && 
                    !this.isSavingThrowProficiency(modifier.subType) &&
                    !this.isPlaceholderProficiency(profName)) {
                  proficiencies.add(profName);
                }
              }
            });
          }
        });
      }
      
      // Generate XML for proficiencies
      let xml = '';
      let index = 1;
      
      proficiencies.forEach(proficiency => {
        const profId = String(index).padStart(5, '0');
        xml += `      <id-${profId}>
        <name type="string">${proficiency}</name>
      </id-${profId}>
`;
        index++;
      });
      
      console.log(`🛠️ Generated ${proficiencies.size} proficiencies`);
      return xml;
      
    } catch (error) {
      console.error('Error generating proficiencies XML:', error);
      return '<!-- Error generating proficiencies -->';
    }
  }

  private isSkillProficiency(subType: string): boolean {
    const skillProficiencies = [
      'acrobatics', 'animal-handling', 'arcana', 'athletics', 'deception',
      'history', 'insight', 'intimidation', 'investigation', 'medicine',
      'nature', 'perception', 'performance', 'persuasion', 'religion',
      'sleight-of-hand', 'stealth', 'survival'
    ];
    
    return skillProficiencies.includes(subType);
  }

  private isSavingThrowProficiency(subType: string): boolean {
    return subType.includes('saving-throws');
  }

  private isPlaceholderProficiency(proficiencyName: string): boolean {
    const placeholderProficiencies = [
      'Choose a Barbarian Skill',
      'Choose a Sorcerer Skill Proficiency',
      'Choose a Sorcerer Skill Proficiency ' // Note the trailing space in the actual data
    ];
    
    return placeholderProficiencies.includes(proficiencyName);
  }

  /**
   * Process character inventory using modern services or legacy fallback
   * 
   * @param characterData - Character data from D&D Beyond
   * @returns Processed inventory result with XML and statistics
   */
  processInventory(characterData: CharacterData): any {
    if (featureFlags.isEnabled('inventory_processor')) {
      try {
        console.log('🎒 Using modern InventoryProcessor service');
        
        // Convert D&D Beyond inventory format to our domain model
        const inventory = this.convertToInventoryItems(characterData.inventory || []);
        const characterId = characterData.id;
        
        const options: InventoryProcessingOptions = {
          includeZeroQuantityItems: false,
          respectContainerHierarchy: true,
          generateDetailedXML: false,
          sanitizeOutput: featureFlags.isEnabled('string_sanitizer_service'),
          includeCostInformation: true,
          markItemsAsIdentified: true
        };
        
        return this.inventoryProcessor.processInventory(inventory, characterId, options);
      } catch (error) {
        console.warn('InventoryProcessor failed, falling back to legacy:', error);
        // Fall through to legacy
      }
    }
    
    // Legacy fallback - would call legacy buildNestedInventory() function
    console.log('📦 Using legacy inventory processing');
    return {
      nestedStructure: { characterId: characterData.id, rootItems: [], containers: new Map(), totalItems: 0, totalWeight: 0 },
      xmlResult: { xml: '<!-- Legacy inventory processing not implemented -->', itemCount: 0, totalWeight: 0, containerCount: 0, debugInfo: { processedItems: 0, skippedItems: 0, containerItems: 0, magicContainers: [] } },
      statistics: { totalItems: 0, containerCount: 0, magicContainers: 0, totalWeight: 0 }
    };
  }

  /**
   * Calculate character encumbrance using modern services or legacy fallback
   * 
   * @param characterData - Character data from D&D Beyond  
   * @returns Encumbrance calculation with carrying capacity and penalties
   */
  calculateEncumbrance(characterData: CharacterData): any {
    if (featureFlags.isEnabled('encumbrance_calculator')) {
      try {
        console.log('⚖️ Using modern EncumbranceCalculator service');
        
        // Convert character data to required format
        const characterStrength: CharacterStrength = {
          id: characterData.id,
          strengthScore: this.getAbilityScore(characterData, 1), // STR = id 1
          hasPowerfulBuild: EncumbranceCalculator.hasPowerfulBuild(characterData)
        };
        
        const inventory = this.convertToInventoryItems(characterData.inventory || []);
        
        const options: EncumbranceOptions = {
          includeContainerWeights: true,
          respectMagicContainers: true,
          applyRacialTraits: true
        };
        
        return this.encumbranceCalculator.calculateEncumbrance(characterStrength, inventory, options);
      } catch (error) {
        console.warn('EncumbranceCalculator failed, falling back to legacy:', error);
        // Fall through to legacy
      }
    }
    
    // Legacy fallback - would call legacy calculateEncumbrance() function
    console.log('⚖️ Using legacy encumbrance calculation');
    return {
      totalWeight: 0,
      carryingCapacity: { normal: 0, push: 0, lift: 0, powerfulBuild: false },
      encumbranceLevel: 'unencumbered' as const,
      speedPenalty: 0,
      disadvantageOnChecks: false
    };
  }

  /**
   * Convert D&D Beyond inventory format to domain model
   */
  private convertToInventoryItems(ddbInventory: any[]): InventoryItem[] {
    return ddbInventory.map(item => ({
      id: item.id,
      entityTypeId: item.entityTypeId,
      definition: {
        id: item.definition.id,
        name: item.definition.name,
        weight: item.definition.weight || 0,
        bundleSize: item.definition.bundleSize || 1,
        isContainer: item.definition.isContainer || false,
        weightMultiplier: item.definition.weightMultiplier,
        filterType: item.definition.filterType,
        subType: item.definition.subType,
        description: item.definition.description,
        cost: item.definition.cost ? {
          quantity: item.definition.cost.quantity,
          unit: item.definition.cost.unit as 'cp' | 'sp' | 'ep' | 'gp' | 'pp'
        } : undefined
      },
      quantity: item.quantity,
      isAttuned: item.isAttuned || false,
      equipped: item.equipped || false,
      containerEntityId: item.containerEntityId,
      charges: item.charges,
      customName: item.customName,
      customWeight: item.customWeight,
      customCost: item.customCost
    }));
  }

  /**
   * Get ability score from character data
   */
  private getAbilityScore(characterData: CharacterData, abilityId: number): number {
    const stat = characterData.stats?.find(s => s.id === abilityId);
    const bonusStat = characterData.bonusStats?.find(s => s.id === abilityId);
    return (stat?.value || 10) + (bonusStat?.value || 0);
  }

  /**
   * Generate Fantasy Grounds XML for character skills
   * 
   * Based on D&D 5e standard skills with proficiency detection
   */
  private generateSkillsXML(characterData: CharacterData): string {
    // D&D 5e standard skills (from legacy gameConstants.js)
    const skills = [
      "acrobatics", "animal_handling", "arcana", "athletics", "deception",
      "history", "insight", "intimidation", "investigation", "medicine", 
      "nature", "perception", "performance", "persuasion", "religion", 
      "sleight_of_hand", "stealth", "survival"
    ];

    // Corresponding ability scores for each skill
    const skillsRef = [
      "dexterity", "wisdom", "intelligence", "strength", "charisma",
      "intelligence", "wisdom", "charisma", "intelligence", "wisdom",
      "intelligence", "wisdom", "charisma", "charisma", "intelligence",
      "dexterity", "dexterity", "wisdom"
    ];

    let xml = '';
    
    skills.forEach((skill, index) => {
      const skillId = String(index + 1).padStart(5, '0');
      let skillName = skill;
      
      // Format special skill names
      if (skill.match(/^sleight/)) {
        skillName = 'Sleight of Hand';
      } else if (skill.includes('animal')) {
        skillName = 'Animal Handling';
      } else {
        skillName = skill.split('_').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
      }

      // Determine proficiency level
      let profValue = 0;
      
      // Check for proficiency
      const proficiencies = ObjectSearch.find(characterData, 'type', 'proficiency');
      if (proficiencies && proficiencies.length > 0) {
        const hasProf = proficiencies.some((prof: any) => {
          const skillKey = prof.subType?.replace(/-/g, '_');
          return skillKey === skill;
        });
        if (hasProf) profValue = 1;
      }
      
      // Check for expertise (overrides proficiency)
      const expertise = ObjectSearch.find(characterData, 'type', 'expertise');
      if (expertise && expertise.length > 0) {
        const hasExpertise = expertise.some((exp: any) => {
          const skillKey = exp.subType?.replace(/-/g, '_');
          return skillKey === skill;
        });
        if (hasExpertise) profValue = 2;
      }
      
      // Check for half proficiency (Jack of All Trades, etc.)
      const halfProf = ObjectSearch.find(characterData, 'type', 'half-proficiency');
      if (halfProf && halfProf.length > 0 && profValue === 0) {
        const hasHalfProf = halfProf.some((half: any) => {
          const skillKey = half.subType?.replace(/-/g, '_');
          return skillKey === skill;
        });
        if (hasHalfProf) profValue = 3;
      }

      xml += `      <id-${skillId}>\n`;
      xml += `        <misc type="number">0</misc>\n`;
      xml += `        <name type="string">${skillName}</name>\n`;
      xml += `        <stat type="string">${skillsRef[index]}</stat>\n`;
      xml += `        <prof type="number">${profValue}</prof>\n`;
      xml += `      </id-${skillId}>\n`;
    });

    return xml;
  }

  /**
   * Generate Fantasy Grounds XML for character languages
   * 
   * Extracts languages from character modifiers and racial traits
   */
  private generateLanguagesXML(characterData: CharacterData): string {
    let xml = '';
    const languages = new Set<string>(); // Use Set to avoid duplicates
    
    // Extract languages from modifiers
    const languageModifiers = ObjectSearch.find(characterData, 'type', 'language');
    if (languageModifiers && languageModifiers.length > 0) {
      languageModifiers.forEach((langMod: any) => {
        const languageName = langMod.friendlySubtypeName || langMod.subType || 'Unknown Language';
        languages.add(languageName);
      });
    }
    
    // Extract languages from racial traits
    if (characterData.race?.racialTraits) {
      characterData.race.racialTraits.forEach((trait: any) => {
        if (trait.definition?.name?.toLowerCase().includes('language')) {
          // Try to extract language name from description
          const desc = trait.definition.description || '';
          const commonLanguages = ['Common', 'Elvish', 'Dwarvish', 'Halfling', 'Orcish', 'Gnomish', 'Giant', 'Draconic'];
          commonLanguages.forEach(lang => {
            if (desc.includes(lang)) {
              languages.add(lang);
            }
          });
        }
      });
    }

    // Convert Set to sorted array and generate XML
    const sortedLanguages = Array.from(languages).sort();
    sortedLanguages.forEach((language, index) => {
      const langId = String(index + 1).padStart(5, '0');
      xml += `      <id-${langId}>\n`;
      xml += `        <name type="string">${this.sanitizeString(language)}</name>\n`;
      xml += `      </id-${langId}>\n`;
    });

    return xml;
  }

  /**
   * Generate output in multiple formats
   */
  async generateMultiFormatOutput(
    characterData: CharacterData, 
    formats: string[], 
    options?: FormatOptions
  ): Promise<Map<string, FormatResult>> {
    console.log(`🔄 Generating multi-format output for character: ${characterData.name}`);
    console.log(`📋 Requested formats: ${formats.join(', ')}`);
    
    // Prepare processed character data that all formatters can use
    const processedData: ProcessedCharacterData = await this.prepareProcessedCharacterData(characterData);
    
    const results = new Map<string, FormatResult>();
    
    for (const format of formats) {
      try {
        console.log(`🔄 Generating ${format} output...`);
        const result = await formatRegistry.generateOutput(format, processedData, options);
        results.set(format, result);
        
        if (result.success) {
          console.log(`✅ Successfully generated ${format} output`);
        } else {
          console.error(`❌ Failed to generate ${format} output:`, result.errors);
        }
      } catch (error) {
        console.error(`💥 Error generating ${format} output:`, error);
        results.set(format, {
          success: false,
          errors: [{
            type: 'generation_error',
            message: error instanceof Error ? error.message : 'Unknown error occurred'
          }]
        });
      }
    }
    
    return results;
  }

  /**
   * Generate output in a specific format using the format registry
   */
  async generateFormatOutput(
    characterData: CharacterData,
    format: string,
    options?: FormatOptions
  ): Promise<FormatResult> {
    console.log(`🔄 Generating ${format} output for character: ${characterData.name}`);
    
    // Prepare processed character data
    const processedData = await this.prepareProcessedCharacterData(characterData);
    
    // Generate output using the format registry
    return formatRegistry.generateOutput(format, processedData, options);
  }

  /**
   * Prepare processed character data that can be reused by all formatters
   * Simplified version that creates minimal processed data structure
   */
  private async prepareProcessedCharacterData(characterData: CharacterData): Promise<ProcessedCharacterData> {
    // Calculate basic values
    const totalLevel = characterData.classes?.reduce((total, cls) => total + (cls.level || 0), 0) || 1;
    const proficiencyBonus = Math.ceil(totalLevel / 4) + 1;

    // Create minimal processed data structure
    return {
      characterData,
      totalLevel,
      proficiencyBonus,
      // Add basic data mapping from character
      abilities: characterData.stats || null,
      spellSlots: null, // TODO: Add spell slot calculation when needed
      inventory: null,  // TODO: Add inventory processing when needed
      features: null    // TODO: Add feature processing when needed
    };
  }

  /**
   * Get format compatibility information for a character
   */
  async getFormatCompatibility(characterData: CharacterData): Promise<Map<string, FormatCompatibilityInfo>> {
    const processedData = await this.prepareProcessedCharacterData(characterData);
    return formatRegistry.getFormatCompatibility(processedData);
  }

  /**
   * Get available output formats
   */
  getAvailableFormats(): FormatInfo[] {
    return formatRegistry.getSupportedFormats();
  }

  /**
   * Check if a format is supported
   */
  isFormatSupported(format: string): boolean {
    return formatRegistry.isFormatSupported(format);
  }

  /**
   * Get default options for a specific format
   */
  getFormatDefaultOptions(format: string): FormatOptions {
    return formatRegistry.getDefaultOptions(format);
  }

  /**
   * Get current feature flag status for debugging
   */
  getFeatureFlagStatus(): Record<string, boolean> {
    return {
      character_fetcher: featureFlags.isEnabled('character_fetcher'),
      modern_converter: featureFlags.isEnabled('modern_converter'),
      legacy_fallback: featureFlags.isEnabled('legacy_fallback'),
      debug_character_data: featureFlags.isEnabled('debug_character_data'),
      object_search_service: featureFlags.isEnabled('object_search_service'),
      string_sanitizer_service: featureFlags.isEnabled('string_sanitizer_service'),
      safe_access_service: featureFlags.isEnabled('safe_access_service'),
      ability_constants: featureFlags.isEnabled('ability_constants'),
      ability_score_processor: featureFlags.isEnabled('ability_score_processor'),
      debug_ability_score_processor: featureFlags.isEnabled('debug_ability_score_processor'),
      spell_slot_calculator: featureFlags.isEnabled('spell_slot_calculator'),
      debug_spell_slot_calculator: featureFlags.isEnabled('debug_spell_slot_calculator'),
      inventory_processor: featureFlags.isEnabled('inventory_processor'),
      encumbrance_calculator: featureFlags.isEnabled('encumbrance_calculator'),
      inventory_processor_debug: featureFlags.isEnabled('inventory_processor_debug'),
      encumbrance_calculator_debug: featureFlags.isEnabled('encumbrance_calculator_debug'),
      feature_processor_debug: featureFlags.isEnabled('feature_processor_debug'),
      weaponlist_debug: featureFlags.isEnabled('weaponlist_debug')
    };
  }

  /**
   * Check if an inventory item is a weapon
   */
  private isWeapon(item: InventoryItem): boolean {
    // Primary method: Check filterType for "Weapon"
    return item.definition.filterType === 'Weapon';
  }

  /**
   * Check if a weapon has the "thrown" property
   */
  private isThrown(item: InventoryItem): boolean {
    const properties = item.definition.weaponBehaviors?.[0]?.properties || [];
    return properties.some(prop => prop.toLowerCase().includes('thrown'));
  }

  /**
   * Extract weapon data from inventory item
   */
  private extractWeaponData(item: InventoryItem, index: number): any {
    if (featureFlags.isEnabled('weaponlist_debug')) {
      console.log(`⚔️ Extracting weapon data for: ${item.definition.name}`);
    }
    
    // Try to get weapon behavior first, but handle missing weaponBehaviors
    const behavior = item.definition.weaponBehaviors?.[0];
    const properties = behavior?.properties || [];
    
    // If no weaponBehaviors, try to infer properties from other data
    let weaponProperties = properties;
    if (weaponProperties.length === 0) {
      // Try to infer from item name and type
      weaponProperties = this.inferWeaponProperties(item);
    }
    
    const isRanged = weaponProperties.some(prop => prop.toLowerCase().includes('range')) ||
                    weaponProperties.some(prop => prop.toLowerCase().includes('ranged')) ||
                    this.isRangedWeapon(item.definition.name);
    const isThrown = weaponProperties.some(prop => prop.toLowerCase().includes('thrown'));

    // Calculate attack bonus and stat (simplified calculation)
    const attackStat = this.getWeaponAttackStat(item, isRanged);
    const attackBonus = 0; // Would need proficiency bonus + ability modifier calculation

    // Extract damage information - try multiple sources
    const damage = this.extractWeaponDamage(item);

    // Determine weapon type
    let weaponType = 0; // Melee
    if (isThrown) {
      weaponType = 2; // Thrown
    } else if (isRanged) {
      weaponType = 1; // Ranged
    }

    // Generate shortcut reference
    const inventoryId = String(item.id).padStart(5, '0');
    const shortcut = `....inventorylist.id-${inventoryId}`;

    const weaponData = {
      id: item.id,
      name: item.definition.name,
      properties: weaponProperties.join(', '),
      attackBonus: attackBonus,
      attackStat: attackStat,
      damage: damage,
      weaponType: weaponType,
      shortcut: shortcut
    };
    
    if (featureFlags.isEnabled('weaponlist_debug')) {
      console.log(`⚔️ Extracted weapon data:`, weaponData);
    }
    return weaponData;
  }

  /**
   * Extract thrown weapon data (appears as melee entry)
   */
  private extractThrownWeaponData(item: InventoryItem, index: number): any {
    const weaponData = this.extractWeaponData(item, index);
    if (!weaponData) return null;

    // Thrown weapons appear twice - once as ranged (type 2), once as melee (type 0)
    return {
      ...weaponData,
      weaponType: 0 // Melee version of thrown weapon
    };
  }

  /**
   * Determine the attack stat for a weapon
   */
  private getWeaponAttackStat(item: InventoryItem, isRanged: boolean): string {
    // Simple logic - would need to be more sophisticated for finesse weapons
    return isRanged ? 'dexterity' : 'strength';
  }

  /**
   * Check if character is a monk
   */
  private isCharacterMonk(characterData: CharacterData): boolean {
    if (!characterData.classes) return false;
    return characterData.classes.some(cls => 
      cls.definition?.name?.toLowerCase() === 'monk'
    );
  }

  /**
   * Generate monk unarmed strike data
   */
  private getMonkUnarmedStrike(index: number): any {
    return {
      id: 999999, // Special ID for unarmed strike
      name: 'Unarmed Strike',
      properties: 'Monk, Unarmed',
      attackBonus: 0, // Would need proper calculation
      attackStat: 'dexterity', // Monks use DEX for unarmed strikes
      damage: {
        dice: '1d4', // Default monk unarmed damage
        bonus: 0,
        type: 'bludgeoning'
      },
      weaponType: 0, // Melee
      shortcut: '' // No inventory reference for unarmed strike
    };
  }

  /**
   * Link ammunition to weapons that require it
   */
  private linkAmmoToWeapons(weapons: any[], nestedStructure: any): void {
    if (featureFlags.isEnabled('weaponlist_debug')) {
      console.log(`⚔️ Linking ammunition to ${weapons.length} weapons`);
    }

    // Find all ammunition items in inventory
    const ammoItems: any[] = [];
    
    // Check root items for ammo
    nestedStructure.rootItems.forEach((item: any) => {
      if (this.isAmmunition(item)) {
        ammoItems.push(item);
      }
    });
    
    // Check container contents for ammo  
    nestedStructure.containers.forEach((container: any) => {
      container.contents.forEach((item: any) => {
        if (this.isAmmunition(item)) {
          ammoItems.push(item);
        }
      });
    });

    if (featureFlags.isEnabled('weaponlist_debug')) {
      console.log(`⚔️ Found ${ammoItems.length} ammunition items:`, ammoItems.map(item => ({
        name: item.definition.name,
        quantity: item.quantity,
        subType: item.definition.subType
      })));
    }

    // Link ammo to weapons
    weapons.forEach((weapon, index) => {
      // Check if this is a thrown weapon - they use their own quantity as ammo
      if (weapon.weaponType === 2) { // Thrown weapon type
        weapon.maxAmmo = this.getThrownWeaponQuantity(weapon, nestedStructure);
        if (featureFlags.isEnabled('weaponlist_debug')) {
          console.log(`⚔️ Set thrown weapon ${weapon.name} maxAmmo to ${weapon.maxAmmo} (using item quantity)`);
        }
      } else {
        // For ranged weapons that require separate ammunition
        const compatibleAmmo = this.findCompatibleAmmo(weapon, ammoItems);
        if (compatibleAmmo) {
          weapon.maxAmmo = compatibleAmmo.quantity;
          if (featureFlags.isEnabled('weaponlist_debug')) {
            console.log(`⚔️ Linked ${weapon.name} to ${compatibleAmmo.definition.name} (${compatibleAmmo.quantity})`);
          }
        }
      }
    });
  }

  /**
   * Get the quantity of a thrown weapon from inventory
   */
  private getThrownWeaponQuantity(weapon: any, nestedStructure: any): number {
    // Search for the weapon item in inventory to get its quantity
    const weaponId = weapon.id;
    
    // Check root items
    for (const item of nestedStructure.rootItems) {
      if (item.id === weaponId) {
        return item.quantity;
      }
    }
    
    // Check container contents
    for (const [containerId, container] of nestedStructure.containers) {
      for (const item of container.contents) {
        if (item.id === weaponId) {
          return item.quantity;
        }
      }
    }
    
    // Default to 1 if not found
    return 1;
  }

  /**
   * Check if an item is ammunition
   */
  private isAmmunition(item: any): boolean {
    return item.definition.subType === 'Ammunition' || 
           (item.definition.isConsumable && item.definition.filterType === 'Other Gear');
  }

  /**
   * Find compatible ammunition for a weapon
   */
  private findCompatibleAmmo(weapon: any, ammoItems: any[]): any | null {
    const weaponName = weapon.name.toLowerCase();
    
    // Simple mapping of weapons to ammo types
    for (const ammo of ammoItems) {
      const ammoName = ammo.definition.name.toLowerCase();
      
      // Crossbow -> Bolts
      if (weaponName.includes('crossbow') && ammoName.includes('bolt')) {
        return ammo;
      }
      
      // Bow -> Arrows  
      if (weaponName.includes('bow') && ammoName.includes('arrow')) {
        return ammo;
      }
      
      // Sling -> Bullets/Stones
      if (weaponName.includes('sling') && (ammoName.includes('bullet') || ammoName.includes('stone'))) {
        return ammo;
      }
      
      // Blowgun -> Needles
      if (weaponName.includes('blowgun') && ammoName.includes('needle')) {
        return ammo;
      }
    }
    
    return null;
  }

  /**
   * Infer weapon properties from item name and type when weaponBehaviors is missing
   */
  private inferWeaponProperties(item: InventoryItem): string[] {
    const properties: string[] = [];
    const itemName = item.definition.name?.toLowerCase() || '';
    
    // Ranged weapons
    if (this.isRangedWeapon(itemName)) {
      properties.push('Ranged');
    }
    
    // Two-handed weapons
    const twoHandedWeapons = ['greatsword', 'maul', 'pike', 'glaive', 'halberd', 'longbow', 'heavy crossbow'];
    if (twoHandedWeapons.some(weapon => itemName.includes(weapon))) {
      properties.push('Two-handed');
    }
    
    // Light weapons
    const lightWeapons = ['dagger', 'dart', 'javelin', 'light hammer', 'sickle', 'scimitar', 'shortsword', 'handaxe'];
    if (lightWeapons.some(weapon => itemName.includes(weapon))) {
      properties.push('Light');
    }
    
    // Finesse weapons
    const finesseWeapons = ['dagger', 'dart', 'rapier', 'scimitar', 'shortsword', 'whip'];
    if (finesseWeapons.some(weapon => itemName.includes(weapon))) {
      properties.push('Finesse');
    }
    
    // Thrown weapons
    const thrownWeapons = ['dart', 'javelin', 'light hammer', 'handaxe', 'spear', 'trident'];
    if (thrownWeapons.some(weapon => itemName.includes(weapon))) {
      properties.push('Thrown');
    }
    
    return properties;
  }

  /**
   * Check if a weapon is ranged based on its name
   */
  private isRangedWeapon(itemName: string): boolean {
    const rangedWeapons = ['bow', 'crossbow', 'dart', 'javelin', 'sling', 'blowgun'];
    return rangedWeapons.some(weapon => itemName.toLowerCase().includes(weapon));
  }

  /**
   * Extract weapon damage information from multiple possible sources
   */
  private extractWeaponDamage(item: InventoryItem): { dice: string; bonus: number; type: string } {
    // Try weaponBehaviors first
    const behavior = item.definition.weaponBehaviors?.[0];
    if (behavior?.damage) {
      return {
        dice: behavior.damage.diceString || '1d6',
        bonus: behavior.damage.fixedValue || 0,
        type: behavior.damage.damageTypeId ? this.getDamageTypeName(behavior.damage.damageTypeId) : 'slashing'
      };
    }
    
    // Try item definition damage
    if (item.definition.damage) {
      return {
        dice: item.definition.damage.diceString || '1d6',
        bonus: item.definition.damage.fixedValue || 0,
        type: item.definition.damage.damageTypeId ? this.getDamageTypeName(item.definition.damage.damageTypeId) : 'slashing'
      };
    }
    
    // Default based on weapon name
    const itemName = item.definition.name?.toLowerCase() || '';
    if (itemName.includes('dagger')) return { dice: '1d4', bonus: 0, type: 'piercing' };
    if (itemName.includes('shortsword')) return { dice: '1d6', bonus: 0, type: 'piercing' };
    if (itemName.includes('longsword')) return { dice: '1d8', bonus: 0, type: 'slashing' };
    if (itemName.includes('greatsword')) return { dice: '2d6', bonus: 0, type: 'slashing' };
    if (itemName.includes('mace')) return { dice: '1d6', bonus: 0, type: 'bludgeoning' };
    if (itemName.includes('warhammer')) return { dice: '1d8', bonus: 0, type: 'bludgeoning' };
    
    // Default
    return { dice: '1d6', bonus: 0, type: 'slashing' };
  }

  /**
   * Get damage type name from damage type ID
   */
  private getDamageTypeName(damageTypeId: number): string {
    const damageTypes: Record<number, string> = {
      1: 'bludgeoning',
      2: 'piercing', 
      3: 'slashing',
      4: 'necrotic',
      5: 'acid',
      6: 'cold',
      7: 'fire',
      8: 'lightning',
      9: 'thunder',
      10: 'poison',
      11: 'psychic',
      12: 'radiant',
      13: 'force'
    };
    
    return damageTypes[damageTypeId] || 'slashing';
  }

  /**
   * Get class name by character class ID
   */
  private getClassNameById(characterData: CharacterData, characterClassId: number): string {
    const characterClass = characterData.classes?.find(cls => cls.id === characterClassId);
    return characterClass?.definition?.name || 'Unknown';
  }

  /**
   * Extract spell data from D&D Beyond spell object
   */
  private extractSpellData(spell: any, source: string): any {
    try {
      const definition = spell.definition;
      if (!definition) return null;

      // Extract components
      const components = this.formatSpellComponents(definition.components || []);
      
      // Extract casting time
      const castingTime = this.formatCastingTime(definition.activation);
      
      // Extract range
      const range = this.formatSpellRange(definition.range);
      
      // Extract duration
      const duration = this.formatSpellDuration(definition.duration);
      
      // Extract description (strip HTML)
      const description = this.stripHTML(definition.description || '');

      return {
        id: definition.id,
        name: definition.name,
        level: definition.level,
        school: definition.school || 'Divination',
        source: source,
        prepared: spell.prepared || false,
        description: description,
        components: components,
        castingTime: castingTime,
        range: range,
        duration: duration,
        concentration: definition.concentration || false,
        ritual: definition.ritual || false,
        saveDc: spell.overrideSaveDc || null,
        attackRoll: definition.requiresAttackRoll || false,
        requiresSavingThrow: definition.requiresSavingThrow || false,
        definition: definition // Include full definition for action generation
      };
    } catch (error) {
      console.error('Failed to extract spell data:', error);
      return null;
    }
  }

  /**
   * Format spell components for display
   */
  private formatSpellComponents(components: number[]): string {
    const componentNames: string[] = [];
    
    if (components.includes(1)) componentNames.push('V'); // Verbal
    if (components.includes(2)) componentNames.push('S'); // Somatic
    if (components.includes(3)) componentNames.push('M'); // Material
    
    return componentNames.join(', ');
  }

  /**
   * Format casting time from activation data
   */
  private formatCastingTime(activation: any): string {
    if (!activation) return '1 action';
    
    const time = activation.activationTime || 1;
    const type = activation.activationType;
    
    // Map activation types (these are common D&D Beyond values)
    const typeMap: Record<number, string> = {
      1: 'action',
      2: 'bonus action', 
      3: 'reaction',
      4: 'minute',
      5: 'hour',
      6: 'no action'
    };
    
    const typeName = typeMap[type] || 'action';
    return time === 1 ? `1 ${typeName}` : `${time} ${typeName}s`;
  }

  /**
   * Format spell range from range data
   */
  private formatSpellRange(range: any): string {
    if (!range) return 'Touch';
    
    if (range.origin === 'Self') {
      if (range.aoeType && range.aoeValue) {
        return `Self (${range.aoeValue}-foot ${range.aoeType.toLowerCase()})`;
      }
      return 'Self';
    }
    
    if (range.rangeValue) {
      return `${range.rangeValue} feet`;
    }
    
    return range.origin || 'Touch';
  }

  /**
   * Format spell duration from duration data
   */
  private formatSpellDuration(duration: any): string {
    if (!duration) return 'Instantaneous';
    
    const interval = duration.durationInterval || 1;
    const unit = duration.durationUnit?.toLowerCase() || 'round';
    const type = duration.durationType;
    
    let durationStr = interval === 1 ? `1 ${unit}` : `${interval} ${unit}s`;
    
    if (type === 'Concentration') {
      durationStr = `Concentration, up to ${durationStr}`;
    }
    
    return durationStr;
  }

  /**
   * Strip HTML tags from text
   */
  private stripHTML(html: string): string {
    return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
  }

  /**
   * Generate spell actions for Fantasy Grounds powers format
   */
  private generateSpellActions(spell: any): string {
    let actions = '';
    let actionOrder = 1;

    // Check if this is a feature or spell
    const isFeature = spell.powerType === 'feature';

    if (isFeature) {
      // Generate feature-specific action (effect type)
      actions += this.generateFeatureAction(spell, actionOrder);
    } else {
      // Cast action (always first for spells)
      actions += `          <id-${String(actionOrder).padStart(5, '0')}>
            <order type="number">${actionOrder}</order>
            <type type="string">cast</type>`;
    
      // Add save information if spell requires a saving throw
      if (spell.requiresSavingThrow || spell.saveDc) {
        actions += `
            <savemagic type="number">1</savemagic>`;
        
        // Try to determine save type from spell data
        const saveType = this.determineSaveType(spell);
        if (saveType) {
          actions += `
            <savetype type="string">${saveType}</savetype>`;
        }
      }
      
      actions += `
          </id-${String(actionOrder).padStart(5, '0')}>
`;
      actionOrder++;

      // Damage action if spell deals damage
      const damageInfo = this.extractSpellDamageInfo(spell);
      if (damageInfo) {
        actions += `          <id-${String(actionOrder).padStart(5, '0')}>
            <damagelist>
              <id-00001>
                <bonus type="number">${damageInfo.bonus}</bonus>
                <dice type="dice">${damageInfo.dice}</dice>
                <type type="string">${damageInfo.type}</type>
              </id-00001>
            </damagelist>
            <order type="number">${actionOrder}</order>
            <type type="string">damage</type>
          </id-${String(actionOrder).padStart(5, '0')}>
`;
        actionOrder++;
      }

      // Healing action if spell provides healing
      const healingInfo = this.extractSpellHealingInfo(spell);
      if (healingInfo) {
        actions += `          <id-${String(actionOrder).padStart(5, '0')}>
            <order type="number">${actionOrder}</order>
            <type type="string">heal</type>
            <heallist>
              <id-00001>
                <bonus type="number">${healingInfo.bonus}</bonus>
                <dice type="dice">${healingInfo.dice}</dice>
              </id-00001>
            </heallist>
          </id-${String(actionOrder).padStart(5, '0')}>
`;
        actionOrder++;
      }
    }

    return actions;
  }

  /**
   * Generate feature-specific action for powers like Rage
   */
  private generateFeatureAction(feature: any, actionOrder: number): string {
    const featureName = feature.name?.toLowerCase() || '';
    
    // Generate effect action for features like Rage
    let action = `          <id-${String(actionOrder).padStart(5, '0')}>`;
    
    // Add duration for features that have it
    if (feature.duration && feature.duration !== 'Instantaneous') {
      if (feature.duration.includes('minute')) {
        const minutes = feature.duration.match(/(\d+)/)?.[1] || '1';
        action += `
            <durmod type="number">${minutes}</durmod>
            <durunit type="string">minute</durunit>`;
      }
    }
    
    // Generate feature-specific label based on feature type
    let label = '';
    if (featureName.includes('rage')) {
      label = 'Rage; ADVCHK: strength; ADVSAV: strength; DMG: 2, melee; RESIST: bludgeoning, piercing, slashing';
    } else if (featureName.includes('stone\'s endurance')) {
      label = 'Stone\'s Endurance; Reduce damage by 1d12 + CON modifier';
    } else {
      label = feature.name;
    }
    
    action += `
            <label type="string">${label}</label>
            <order type="number">${actionOrder}</order>
            <targeting type="string">self</targeting>
            <type type="string">effect</type>
          </id-${String(actionOrder).padStart(5, '0')}>
`;

    return action;
  }

  /**
   * Determine save type from spell data
   */
  private determineSaveType(spell: any): string | null {
    const description = spell.description?.toLowerCase() || '';
    
    // Look for save types in description
    if (description.includes('dexterity saving throw')) return 'dexterity';
    if (description.includes('constitution saving throw')) return 'constitution';
    if (description.includes('wisdom saving throw')) return 'wisdom';
    if (description.includes('intelligence saving throw')) return 'intelligence';
    if (description.includes('charisma saving throw')) return 'charisma';
    if (description.includes('strength saving throw')) return 'strength';
    
    // Check spell definition if available
    if (spell.definition?.saveDcAbilityId) {
      const abilityMap: Record<number, string> = {
        1: 'strength',
        2: 'dexterity', 
        3: 'constitution',
        4: 'intelligence',
        5: 'wisdom',
        6: 'charisma'
      };
      return abilityMap[spell.definition.saveDcAbilityId] || null;
    }
    
    return null;
  }

  /**
   * Extract damage information from spell
   */
  private extractSpellDamageInfo(spell: any): { dice: string; bonus: number; type: string } | null {
    const description = spell.description?.toLowerCase() || '';
    
    // Look for damage patterns in description
    const damagePattern = /(\d+d\d+).*?(acid|cold|fire|lightning|thunder|poison|psychic|radiant|necrotic|force|bludgeoning|piercing|slashing)/i;
    const match = description.match(damagePattern);
    
    if (match) {
      return {
        dice: this.formatDiceForFantasyGrounds(match[1]),
        bonus: 0,
        type: match[2].toLowerCase()
      };
    }
    
    // Check spell definition for damage
    if (spell.definition?.damage) {
      return {
        dice: this.formatDiceForFantasyGrounds(spell.definition.damage.diceString || '1d6'),
        bonus: spell.definition.damage.fixedValue || 0,
        type: this.getDamageTypeName(spell.definition.damage.damageTypeId) || 'force'
      };
    }
    
    return null;
  }

  /**
   * Extract healing information from spell
   */
  private extractSpellHealingInfo(spell: any): { dice: string; bonus: number } | null {
    const description = spell.description?.toLowerCase() || '';
    
    // Look for healing patterns
    const healPattern = /(\d+d\d+).*?hit points/i;
    const match = description.match(healPattern);
    
    if (match) {
      return {
        dice: this.formatDiceForFantasyGrounds(match[1]),
        bonus: 0
      };
    }
    
    // Check for healing spells by name
    const spellName = spell.name?.toLowerCase() || '';
    if (spellName.includes('cure') || spellName.includes('heal') || spellName.includes('vitality')) {
      return {
        dice: this.formatDiceForFantasyGrounds('1d8'),
        bonus: 0
      };
    }
    
    return null;
  }

  /**
   * Format dice string for Fantasy Grounds (converts "1d6" to "d6")
   */
  private formatDiceForFantasyGrounds(diceString: string): string {
    // Fantasy Grounds uses "d6" format instead of "1d6" for single dice
    return diceString.replace(/^1d/, 'd');
  }

  /**
   * Extract active powers from class features and racial traits
   */
  private extractActivePowers(characterData: CharacterData): any[] {
    const powers: any[] = [];

    if (featureFlags.isEnabled('spelllist_debug')) {
      console.log('🪄 Extracting active class features and racial traits as powers');
      console.log('🪄 Character classes:', characterData.classes?.length || 0);
      console.log('🪄 Character race:', characterData.race?.fullName);
    }

    // Extract class features with active abilities
    characterData.classes?.forEach(characterClass => {
      const className = characterClass.definition?.name || 'Unknown';
      
      // Check class features
      if (featureFlags.isEnabled('spelllist_debug')) {
        console.log(`🪄 Checking ${className}: ${characterClass.classFeatures?.length || 0} class features`);
      }
      
      characterClass.classFeatures?.forEach(feature => {
        if (featureFlags.isEnabled('spelllist_debug')) {
          console.log(`🪄 Checking class feature: ${feature.definition?.name} - isActivePower: ${this.isActivePower(feature)}`);
          
          if (feature.definition?.name?.toLowerCase().includes('rage')) {
            console.log(`🪄 Raw Rage feature data:`, feature);
            console.log(`🪄 Rage feature.levelScales:`, feature.levelScales);
          }
        }
        
        if (this.isActivePower(feature)) {
          const powerData = this.extractFeaturePowerData(feature, className, characterData);
          if (powerData) {
            powers.push(powerData);
            if (featureFlags.isEnabled('spelllist_debug')) {
              console.log(`🪄 Added ${className} feature: ${powerData.name}`);
            }
          } else {
            if (featureFlags.isEnabled('spelllist_debug')) {
              console.log(`🪄 Failed to extract power data for: ${feature.definition?.name}`);
            }
          }
        }
      });

      // Check subclass features
      characterClass.subclassFeatures?.forEach(feature => {
        if (this.isActivePower(feature)) {
          const subclassName = feature.definition?.name || className;
          const powerData = this.extractFeaturePowerData(feature, `${className} (${subclassName})`, characterData);
          if (powerData) {
            powers.push(powerData);
            if (featureFlags.isEnabled('spelllist_debug')) {
              console.log(`🪄 Added ${className} subclass feature: ${powerData.name}`);
            }
          }
        }
      });
    });

    // Extract racial traits with active abilities  
    characterData.race?.racialTraits?.forEach(trait => {
      if (this.isActivePower(trait)) {
        const powerData = this.extractFeaturePowerData(trait, `${characterData.race?.fullName || 'Racial'} Traits`, characterData);
        if (powerData) {
          powers.push(powerData);
          if (featureFlags.isEnabled('spelllist_debug')) {
            console.log(`🪄 Added racial trait: ${powerData.name}`);
          }
        }
      }
    });

    return powers;
  }

  /**
   * Check if a feature should be treated as an active power
   */
  private isActivePower(feature: any): boolean {
    if (!feature?.definition) return false;

    // Features with limited uses are usually active powers
    if (feature.limitedUse) return true;

    // Check for specific power-like features by name
    const name = feature.definition.name?.toLowerCase() || '';
    const activePowerNames = [
      'rage', 'reckless attack', 'stone\'s endurance', 'form of the beast',
      'action surge', 'second wind', 'bardic inspiration', 'channel divinity',
      'wild shape', 'lay on hands', 'divine smite', 'sneak attack'
    ];

    return activePowerNames.some(powerName => name.includes(powerName));
  }

  /**
   * Extract power data from a class feature or racial trait
   */
  private extractFeaturePowerData(feature: any, source: string, characterData: CharacterData): any {
    try {
      const definition = feature.definition;
      if (!definition) return null;

      // Extract description (strip HTML but preserve structure)
      const description = this.stripHTML(definition.description || '');

      // Determine uses and reset type
      let usesMax = 0;
      let resetType = 'long rest';
      let actionType = 'action';

      if (feature.limitedUse) {
        usesMax = feature.limitedUse.maxUses || 1;
        // resetType: 1 = short rest, 2 = long rest
        resetType = feature.limitedUse.resetType === 1 ? 'short rest' : 'long rest';
        
        // actionType: 3 seems to be bonus action/reaction
        if (feature.limitedUse.actionType === 3) {
          actionType = this.determineActionTypeFromDescription(description);
        }
        
        if (featureFlags.isEnabled('spelllist_debug') && definition.name?.toLowerCase().includes('rage')) {
          console.log(`🪄 Rage limitedUse data:`, feature.limitedUse);
        }
      }

      // Handle level scaling for features that scale with character level
      usesMax = this.calculateScaledFeatureUses(feature, characterData, usesMax);
      
      if (featureFlags.isEnabled('spelllist_debug') && definition.name?.toLowerCase().includes('rage')) {
        console.log(`🪄 Final Rage debug:`, {
          featureName: definition.name,
          characterLevel: this.getCharacterLevelForFeature(feature, characterData),
          originalMaxUses: feature.limitedUse?.maxUses || 0,
          finalUsesMax: usesMax,
          hasLevelScales: !!feature.levelScales,
          levelScalesData: feature.levelScales
        });
      }

      return {
        id: definition.id,
        name: definition.name,
        level: 0, // Features don't have spell levels
        school: '', // Not applicable for features
        source: source,
        prepared: usesMax, // Use prepared field for max uses
        description: description,
        components: '', // Not applicable for features
        castingTime: actionType,
        range: this.determineRangeFromDescription(description),
        duration: this.determineDurationFromDescription(description),
        concentration: false, // Features typically don't use concentration
        ritual: false, // Features are not rituals
        group: source, // Group by source (class name, racial traits, etc.)
        powerType: 'feature', // Mark as feature vs spell
        resetType: resetType,
        definition: definition // Include for action generation
      };
    } catch (error) {
      console.error('Failed to extract feature power data:', error);
      return null;
    }
  }

  /**
   * Determine action type from feature description
   */
  private determineActionTypeFromDescription(description: string): string {
    const desc = description.toLowerCase();
    
    if (desc.includes('bonus action')) return 'bonus action';
    if (desc.includes('reaction')) return 'reaction';
    if (desc.includes('no action')) return 'no action';
    
    return 'action';
  }

  /**
   * Determine range from feature description
   */
  private determineRangeFromDescription(description: string): string {
    const desc = description.toLowerCase();
    
    if (desc.includes('self') || desc.includes('yourself')) return 'Self';
    if (desc.includes('touch')) return 'Touch';
    
    // Look for specific ranges
    const rangePattern = /(\d+)\s*feet/i;
    const match = desc.match(rangePattern);
    if (match) return `${match[1]} feet`;
    
    return 'Self';
  }

  /**
   * Determine duration from feature description
   */
  private determineDurationFromDescription(description: string): string {
    const desc = description.toLowerCase();
    
    if (desc.includes('1 minute')) return '1 minute';
    if (desc.includes('10 minutes')) return '10 minutes';
    if (desc.includes('1 hour')) return '1 hour';
    if (desc.includes('until')) return 'Until condition met';
    if (desc.includes('instantaneous')) return 'Instantaneous';
    
    return 'Instantaneous';
  }

  /**
   * Calculate scaled feature uses based on character level and levelScales
   */
  private calculateScaledFeatureUses(feature: any, characterData: CharacterData, defaultUses: number): number {
    // Find the character's level in the class that has this feature
    const characterLevel = this.getCharacterLevelForFeature(feature, characterData);
    
    // Find the class that contains this feature to get its levelScales
    const levelScales = this.findClassFeatureLevelScales(feature, characterData);
    
    if (!levelScales || !Array.isArray(levelScales)) {
      if (featureFlags.isEnabled('spelllist_debug')) {
        console.log(`🪄 No level scales found for ${feature.definition?.name}, using default: ${defaultUses}`);
      }
      return defaultUses;
    }

    if (featureFlags.isEnabled('spelllist_debug')) {
      console.log(`🪄 Calculating scaled uses for ${feature.definition?.name}: character level ${characterLevel}`);
      console.log(`🪄 Level scales available:`, levelScales);
    }

    // Look for usage-related levelScales first (prefer non-damage scaling)
    // Some features may have multiple levelScales for different aspects (damage vs usage count)
    const usageLevelScales = levelScales.filter(scale => 
      scale.description && 
      !scale.description.toLowerCase().includes('damage') &&
      !scale.description.toLowerCase().includes('+')
    );
    
    // If we have usage-specific levelScales, use those; otherwise use all levelScales
    const applicableLevelScales = usageLevelScales.length > 0 ? usageLevelScales : levelScales;
    
    if (featureFlags.isEnabled('spelllist_debug') && usageLevelScales.length > 0) {
      console.log(`🪄 Found ${usageLevelScales.length} usage-specific level scales (filtering out damage scaling)`);
    }

    // Find the appropriate level scale entry
    // Sort level scales by level to ensure we get the highest applicable level
    const sortedLevelScales = applicableLevelScales.sort((a, b) => a.level - b.level);
    let applicableUses = defaultUses;
    
    for (const levelScale of sortedLevelScales) {
      // If character level is at or above this scale level, use its value
      if (characterLevel >= levelScale.level && levelScale.fixedValue !== undefined && levelScale.fixedValue !== null) {
        applicableUses = levelScale.fixedValue;
        
        if (featureFlags.isEnabled('spelllist_debug')) {
          console.log(`🪄 Applied level scale at level ${levelScale.level}: ${applicableUses} uses (${levelScale.description || 'no description'})`);
        }
      } else if (featureFlags.isEnabled('spelllist_debug')) {
        if (characterLevel < levelScale.level) {
          console.log(`🪄 Skipping level ${levelScale.level} (character level ${characterLevel} too low)`);
        } else if (levelScale.fixedValue === undefined || levelScale.fixedValue === null) {
          console.log(`🪄 Skipping level ${levelScale.level} (no fixedValue: ${levelScale.fixedValue})`);
        }
      }
    }

    if (featureFlags.isEnabled('spelllist_debug')) {
      console.log(`🪄 Final scaled uses for ${feature.definition?.name}: ${applicableUses}`);
    }

    return applicableUses;
  }

  /**
   * Find levelScales for a feature from the class that contains it
   */
  private findClassFeatureLevelScales(feature: any, characterData: CharacterData): any[] | null {
    if (!feature.definition?.id) {
      return null;
    }

    // Search through each class to find the one containing this feature
    for (const characterClass of characterData.classes || []) {
      // Check if this class has the feature in its classFeatures
      const hasClassFeature = characterClass.classFeatures?.some(cf => cf.definition?.id === feature.definition.id);
      
      // Check if this class has the feature in its subclassFeatures  
      const hasSubclassFeature = characterClass.subclassFeatures?.some(sf => sf.definition?.id === feature.definition.id);
      
      if (hasClassFeature || hasSubclassFeature) {
        if (featureFlags.isEnabled('spelllist_debug')) {
          console.log(`🪄 Found class ${characterClass.definition?.name} containing feature ${feature.definition.name}`);
        }
        
        // Found the class! Now look for levelScales in its classFeatures
        for (const classFeature of characterClass.classFeatures || []) {
          if (classFeature.definition?.id === feature.definition.id) {
            if (featureFlags.isEnabled('spelllist_debug')) {
              console.log(`🪄 Examining class feature ${classFeature.definition?.name}:`, {
                hasLevelScales: !!classFeature.levelScales,
                levelScalesLength: classFeature.levelScales?.length || 0,
                levelScales: classFeature.levelScales,
                hasDefinitionLevelScales: !!classFeature.definition?.levelScales,
                definitionLevelScales: classFeature.definition?.levelScales
              });
            }
            
            // Check for levelScales on the feature instance
            if (classFeature.levelScales && classFeature.levelScales.length > 0) {
              return classFeature.levelScales;
            }
            
            // Check for levelScales on the feature definition
            if (classFeature.definition?.levelScales && classFeature.definition.levelScales.length > 0) {
              return classFeature.definition.levelScales;
            }
          }
        }
        
        // Also check subclass features for levelScales
        for (const subclassFeature of characterClass.subclassFeatures || []) {
          if (subclassFeature.definition?.id === feature.definition.id) {
            if (featureFlags.isEnabled('spelllist_debug')) {
              console.log(`🪄 Examining subclass feature ${subclassFeature.definition?.name}:`, {
                hasLevelScales: !!subclassFeature.levelScales,
                levelScales: subclassFeature.levelScales,
                hasDefinitionLevelScales: !!subclassFeature.definition?.levelScales,
                definitionLevelScales: subclassFeature.definition?.levelScales
              });
            }
            
            if (subclassFeature.levelScales && subclassFeature.levelScales.length > 0) {
              return subclassFeature.levelScales;
            }
            
            if (subclassFeature.definition?.levelScales && subclassFeature.definition.levelScales.length > 0) {
              return subclassFeature.definition.levelScales;
            }
          }
        }
        
        // Found the class but no levelScales in this specific feature
        if (featureFlags.isEnabled('spelllist_debug')) {
          console.log(`🪄 Found class for ${feature.definition.name} but no levelScales found anywhere`);
        }
        return null;
      }
    }

    if (featureFlags.isEnabled('spelllist_debug')) {
      console.log(`🪄 Could not find class containing feature ${feature.definition.name}`);
    }
    return null;
  }

  /**
   * Get character level for the class that has this feature
   */
  private getCharacterLevelForFeature(feature: any, characterData: CharacterData): number {
    // Try to find which class this feature belongs to
    for (const characterClass of characterData.classes || []) {
      // Check class features
      if (characterClass.classFeatures?.some(cf => cf.definition?.id === feature.definition?.id)) {
        return characterClass.level || 1;
      }
      
      // Check subclass features
      if (characterClass.subclassFeatures?.some(sf => sf.definition?.id === feature.definition?.id)) {
        return characterClass.level || 1;
      }
    }

    // If not found in classes, might be racial - use total character level
    return characterData.classes?.reduce((total, cls) => total + (cls.level || 0), 0) || 1;
  }

  /**
   * Calculate Hit Points for the character
   * Based on baseHitPoints + (Constitution modifier × total level)
   */
  private calculateHP(characterData: CharacterData): number {
    const baseHP = characterData.baseHitPoints || 0;
    const totalLevel = this.calculateTotalLevel(characterData);
    const constitutionModifier = this.getConstitutionModifier(characterData);
    
    return baseHP + (constitutionModifier * totalLevel);
  }

  /**
   * Calculate Armor Class for the character
   * Takes into account Unarmored Defense for Barbarians and Monks
   */
  private calculateAC(characterData: CharacterData): number {
    console.log('🛡️ Calculating AC for character:', characterData.name);
    
    // Debug: Log character classes
    const classes = characterData.classes?.map(cls => cls.definition?.name) || [];
    console.log('🏛️ Character classes:', classes);
    
    // Check for Unarmored Defense (Barbarian): 10 + DEX mod + CON mod
    const hasBarbUnarmoredDefense = characterData.classes?.some((cls: any) => 
      cls.definition?.name?.toLowerCase() === 'barbarian'
    );
    
    // Check for Unarmored Defense (Monk): 10 + DEX mod + WIS mod
    const hasMonkUnarmoredDefense = characterData.classes?.some((cls: any) => 
      cls.definition?.name?.toLowerCase() === 'monk'
    );
    
    console.log('🛡️ Unarmored Defense checks:', {
      barbarian: hasBarbUnarmoredDefense,
      monk: hasMonkUnarmoredDefense
    });
    
    if (hasBarbUnarmoredDefense) {
      try {
        const abilities = this.getAbilityScores(characterData);
        console.log('⚡ Barbarian ability scores:', abilities);
        
        const dexModifier = Math.floor((abilities.dexterity - 10) / 2);
        const conModifier = Math.floor((abilities.constitution - 10) / 2);
        const calculatedAC = 10 + dexModifier + conModifier;
        
        console.log(`🛡️ Barbarian Unarmored Defense: 10 + ${dexModifier} (DEX) + ${conModifier} (CON) = ${calculatedAC}`);
        return calculatedAC;
      } catch (error) {
        console.error('Error calculating Barbarian Unarmored Defense AC:', error);
      }
    }
    
    if (hasMonkUnarmoredDefense) {
      try {
        const abilities = this.getAbilityScores(characterData);
        console.log('⚡ Monk ability scores:', abilities);
        
        const dexModifier = Math.floor((abilities.dexterity - 10) / 2);
        const wisModifier = Math.floor((abilities.wisdom - 10) / 2);
        const calculatedAC = 10 + dexModifier + wisModifier;
        
        console.log(`🛡️ Monk Unarmored Defense: 10 + ${dexModifier} (DEX) + ${wisModifier} (WIS) = ${calculatedAC}`);
        return calculatedAC;
      } catch (error) {
        console.error('Error calculating Monk Unarmored Defense AC:', error);
      }
    }
    
    // Fallback to character data AC or base AC
    const fallbackAC = characterData.armorClass || gameConfigService.getBaseArmorClass();
    console.log('🛡️ Using fallback AC:', fallbackAC, '(from characterData.armorClass:', characterData.armorClass, ')');
    
    return fallbackAC;
  }

  /**
   * Get Constitution modifier for HP calculation
   */
  private getConstitutionModifier(characterData: CharacterData): number {
    try {
      const abilities = this.getAbilityScores(characterData);
      return Math.floor((abilities.constitution - 10) / 2);
    } catch (error) {
      console.error('Error calculating Constitution modifier:', error);
      return 0;
    }
  }

  /**
   * Generate AC components for Fantasy Grounds XML
   * Properly distributes AC calculation into Fantasy Grounds fields
   */
  private generateACComponents(characterData: CharacterData): string {
    console.log('🛡️ Generating AC components for Fantasy Grounds');
    
    // Check for Unarmored Defense classes
    const hasBarbUnarmoredDefense = characterData.classes?.some((cls: any) => 
      cls.definition?.name?.toLowerCase() === 'barbarian'
    );
    
    const hasMonkUnarmoredDefense = characterData.classes?.some((cls: any) => 
      cls.definition?.name?.toLowerCase() === 'monk'
    );
    
    const abilities = this.getAbilityScores(characterData);
    const dexModifier = Math.floor((abilities.dexterity - 10) / 2);
    
    if (hasBarbUnarmoredDefense) {
      const conModifier = Math.floor((abilities.constitution - 10) / 2);
      const totalAC = 10 + dexModifier + conModifier;
      
      console.log(`🛡️ Barbarian Unarmored Defense: 10 + DEX ${dexModifier} + CON ${conModifier} = ${totalAC}`);
      console.log('🛡️ Using Fantasy Grounds format: armor=0, stat2=constitution, total=' + totalAC);
      
      return `
        <armor type="number">0</armor>
        <disstealth type="number">0</disstealth>
        <misc type="number">0</misc>
        <prof type="number">0</prof>
        <shield type="number">0</shield>
        <stat2 type="string">constitution</stat2>
        <temporary type="number">0</temporary>
        <total type="number">${totalAC}</total>`;
    }
    
    if (hasMonkUnarmoredDefense) {
      const wisModifier = Math.floor((abilities.wisdom - 10) / 2);
      const totalAC = 10 + dexModifier + wisModifier;
      
      console.log(`🛡️ Monk AC Components: Base 10 + DEX ${dexModifier} + WIS ${wisModifier} = ${totalAC}`);
      
      return `
        <armor type="number">10</armor>
        <misc type="number">${wisModifier}</misc>
        <prof type="number">0</prof>
        <shield type="number">0</shield>
        <stat type="number">${dexModifier}</stat>
        <stat2 type="string">dexterity</stat2>
        <temporary type="number">0</temporary>
        <total type="number">${totalAC}</total>`;
    }
    
    // Fallback for non-Unarmored Defense characters
    const fallbackAC = characterData.armorClass || gameConfigService.getBaseArmorClass();
    console.log('🛡️ Standard AC Components, total:', fallbackAC);
    
    return `
        <armor type="number">${Math.max(0, fallbackAC - dexModifier)}</armor>
        <misc type="number">0</misc>
        <prof type="number">0</prof>
        <shield type="number">0</shield>
        <stat type="number">${dexModifier}</stat>
        <stat2 type="string">dexterity</stat2>
        <temporary type="number">0</temporary>
        <total type="number">${fallbackAC}</total>`;
  }

  /**
   * Modern conversion method using ConversionOrchestrator
   * 
   * This provides the new service-driven architecture for character processing,
   * completely independent of the legacy system. Uses Chain of Responsibility
   * pattern for processing character data through specialized services.
   * 
   * @param characterId - Character ID or URL
   * @param options - Conversion processing options
   * @returns Comprehensive conversion result with processed character data
   */
  async convertCharacterModern(
    characterId: string, 
    options: ConversionOptions = {
      strictValidation: true,
      includeDebugInfo: featureFlags.isEnabled('debug_character_processing'),
      enablePerformanceTracking: true,
      skipOptionalProcessing: false
    }
  ): Promise<OrchestrationResult> {
    
    const performanceStart = performance.now();
    
    if (featureFlags.isEnabled('conversion_orchestrator_debug') || options.includeDebugInfo) {
      console.log('🚀 CharacterConverterFacade: Starting modern conversion', {
        characterId,
        options,
        timestamp: new Date().toISOString()
      });
    }
    
    try {
      // Step 1: Fetch character data using modern fetcher
      this.reportProgress('Fetching character data', 10);
      
      const fetchResult = await this.characterFetcher.fetchCharacter(characterId);
      if (!fetchResult.success || !fetchResult.data) {
        return {
          success: false,
          errors: [{
            step: 'fetch',
            type: 'data',
            message: fetchResult.error || 'Failed to fetch character data',
            recoverable: false
          }],
          warnings: [],
          performance: {
            totalTime: performance.now() - performanceStart,
            stepBreakdown: []
          }
        };
      }
      
      const characterData = fetchResult.data;
      
      // Step 2: Validate character data
      this.reportProgress('Validating character data', 20);
      
      const validation = this.conversionOrchestrator.validateCharacterData(characterData);
      if (!validation.isValid) {
        return {
          success: false,
          errors: validation.errors.map(error => ({
            step: 'validation',
            type: 'validation',
            message: error,
            recoverable: false
          })),
          warnings: [],
          performance: {
            totalTime: performance.now() - performanceStart,
            stepBreakdown: []
          }
        };
      }
      
      // Step 3: Process character through orchestrator
      this.reportProgress('Processing character data', 30);
      
      const orchestrationResult = await this.conversionOrchestrator.processCharacter(
        characterData, 
        options
      );
      
      if (!orchestrationResult.success) {
        this.reportProgress('Processing failed', 100);
        return orchestrationResult;
      }
      
      // Step 4: Complete processing
      this.reportProgress('Conversion complete', 100);
      
      const finalResult: OrchestrationResult = {
        ...orchestrationResult,
        performance: {
          ...orchestrationResult.performance,
          totalTime: performance.now() - performanceStart
        }
      };
      
      if (featureFlags.isEnabled('conversion_orchestrator_debug') || options.includeDebugInfo) {
        console.log('🚀 CharacterConverterFacade: Modern conversion complete', {
          success: true,
          characterName: characterData.name,
          totalTime: finalResult.performance.totalTime,
          warningCount: finalResult.warnings.length,
          errorCount: finalResult.errors.length,
          processedCharacter: finalResult.processedCharacter ? {
            id: finalResult.processedCharacter.id,
            name: finalResult.processedCharacter.name,
            level: finalResult.processedCharacter.level,
            hasAbilities: !!finalResult.processedCharacter.abilities,
            hasSpellSlots: !!finalResult.processedCharacter.spellSlots,
            hasInventory: !!finalResult.processedCharacter.inventory,
            hasFeatures: !!finalResult.processedCharacter.features,
            hasEncumbrance: !!finalResult.processedCharacter.encumbrance
          } : null
        });
      }
      
      return finalResult;
      
    } catch (error) {
      const totalTime = performance.now() - performanceStart;
      
      console.error('🚀 CharacterConverterFacade: Modern conversion failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        characterId,
        totalTime
      });
      
      return {
        success: false,
        errors: [{
          step: 'system',
          type: 'system',
          message: error instanceof Error ? error.message : 'Unknown system error during modern conversion',
          recoverable: false
        }],
        warnings: [],
        performance: {
          totalTime,
          stepBreakdown: []
        }
      };
    }
  }
  
  /**
   * Convert processed character data to specified output format
   * 
   * Takes the output from convertCharacterModern() and generates the requested format.
   * This separates processing from formatting for better architecture.
   * 
   * @param processedCharacter - Result from convertCharacterModern()
   * @param format - Target output format ('fantasy-grounds', 'foundry-vtt', etc.)
   * @param options - Format-specific options
   * @returns Formatted output result
   */
  async convertToFormat(
    processedCharacter: OrchProcessedData,
    format: string,
    options: FormatOptions = {}
  ): Promise<FormatResult> {
    
    if (featureFlags.isEnabled('format_conversion_debug')) {
      console.log('📄 CharacterConverterFacade: Converting to format', {
        format,
        characterName: processedCharacter.name,
        characterLevel: processedCharacter.level,
        options
      });
    }
    
    try {
      // Get the appropriate formatter from the registry
      const formatter = formatRegistry.getFormatter(format);
      if (!formatter) {
        return {
          success: false,
          error: `Unsupported output format: ${format}`,
          supportedFormats: formatRegistry.getSupportedFormats().map(f => f.id)
        };
      }
      
      // Convert processed character data to the format expected by the formatter
      const formatterInput: ProcessedCharacterData = {
        id: processedCharacter.id,
        name: processedCharacter.name,
        level: processedCharacter.level,
        abilities: processedCharacter.abilities,
        spells: processedCharacter.spellSlots,
        inventory: processedCharacter.inventory,
        features: processedCharacter.features,
        // Add any additional mappings needed
      };
      
      // Generate the formatted output
      const formatResult = await formatter.generateOutput(formatterInput, options);
      
      if (featureFlags.isEnabled('format_conversion_debug')) {
        console.log('📄 CharacterConverterFacade: Format conversion complete', {
          format,
          success: formatResult.success,
          outputLength: formatResult.output?.length || 0,
          warningCount: formatResult.warnings?.length || 0
        });
      }
      
      return formatResult;
      
    } catch (error) {
      console.error('📄 CharacterConverterFacade: Format conversion failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        format,
        characterName: processedCharacter.name
      });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during format conversion'
      };
    }
  }
  
  /**
   * Complete modern conversion pipeline: fetch -> process -> format
   * 
   * This is the main entry point for the new architecture that combines
   * character processing with format generation in a single call.
   * 
   * @param characterId - Character ID or URL  
   * @param format - Target output format
   * @param conversionOptions - Processing options
   * @param formatOptions - Format-specific options
   * @returns Complete conversion result with formatted output
   */
  async convertCharacterComplete(
    characterId: string,
    format: string = 'fantasy-grounds',
    conversionOptions?: ConversionOptions,
    formatOptions?: FormatOptions
  ): Promise<ConversionResult> {
    
    const performanceStart = performance.now();
    
    try {
      // Step 1: Process character using modern orchestrator
      const processingResult = await this.convertCharacterModern(characterId, conversionOptions);
      
      if (!processingResult.success || !processingResult.processedCharacter) {
        return {
          success: false,
          error: processingResult.errors.map(e => e.message).join('; '),
          performance: {
            fetchTime: 0,
            parseTime: processingResult.performance.totalTime,
            totalTime: performance.now() - performanceStart
          }
        };
      }
      
      // Step 2: Convert to requested format
      const formatResult = await this.convertToFormat(
        processingResult.processedCharacter,
        format,
        formatOptions
      );
      
      if (!formatResult.success) {
        return {
          success: false,
          error: formatResult.error,
          characterData: processingResult.processedCharacter as any, // Type compatibility
          performance: {
            fetchTime: 0,
            parseTime: processingResult.performance.totalTime,
            totalTime: performance.now() - performanceStart
          }
        };
      }
      
      // Step 3: Return complete result
      return {
        success: true,
        xml: formatResult.output,
        characterData: processingResult.processedCharacter as any, // Type compatibility
        performance: {
          fetchTime: 0,
          parseTime: processingResult.performance.totalTime,
          totalTime: performance.now() - performanceStart
        }
      };
      
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during complete conversion',
        performance: {
          fetchTime: 0,
          parseTime: 0,
          totalTime: performance.now() - performanceStart
        }
      };
    }
  }
}

// Export singleton instance
export const characterConverterFacade = new CharacterConverterFacade();