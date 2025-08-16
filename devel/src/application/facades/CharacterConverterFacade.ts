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
  private inventoryProcessor: InventoryProcessor;
  private encumbranceCalculator: EncumbranceCalculator;
  private spellSlotCalculator: SpellSlotCalculator;
  private featureProcessor: FeatureProcessor;
  public onProgress?: (step: string, percentage: number) => void;

  constructor() {
    this.characterFetcher = new CharacterFetcher();
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
}

// Export singleton instance
export const characterConverterFacade = new CharacterConverterFacade();