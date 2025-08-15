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
import { SpellSlotCalculator, type ClassInfo } from '@/domain/character/services/SpellSlotCalculator';

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
          console.log('Caster Level Breakdown:', spellSlotResult.casterBreakdown);
          console.log('Class Contributions:', spellSlotResult.debugInfo.classContributions);
          console.log(`Calculation Method: ${spellSlotResult.debugInfo.calculationMethod}`);
          
          // Demonstrate legacy format compatibility
          const legacySpellSlots = SpellSlotCalculator.toLegacyFormat(spellSlotResult.spellSlots);
          console.log('Legacy Format Spell Slots:', legacySpellSlots.filter(slot => slot.slots > 0));
          
          // Validate class information
          const classValidation = SpellSlotCalculator.validateClassInfo(classInfo);
          console.log('Class Data Validation:', {
            isValid: classValidation.isValid,
            issueCount: classValidation.issues.length,
            warningCount: classValidation.warnings.length
          });
          
          if (classValidation.warnings.length > 0) {
            console.warn('Class Data Warnings:', classValidation.warnings);
          }
          if (classValidation.issues.length > 0) {
            console.error('Class Data Issues:', classValidation.issues);
          }
        }
        
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
    <bonds type="string"></bonds>
    <flaws type="string"></flaws>
    <ideals type="string"></ideals>
    <personalitytraits type="string"></personalitytraits>
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
    <notes type="string">${this.sanitizeString(`Character converted from D&D Beyond (ID: ${characterId}) using Modern Converter v2.0`)}</notes>
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
      ${gameConfigService.getCurrencies().map((currency, index) => 
        `<slot${index + 1}>
        <amount type="number">0</amount>
        <name type="string">${this.sanitizeString(currency.name)}</name>
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
      ${this.generatePowerGroupXML(characterData)}
    </powergrouplist>
    
    <skilllist>
      <!-- Skills will be added in Phase 2 -->
    </skilllist>
    
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
      
      // Check if character has warlock levels (pact magic) - check this FIRST
      const hasWarlock = classInfo.some(c => c.name === 'warlock');
      
      // Check if character has any spell slots OR is a warlock (pact magic)
      const hasAnySlots = Object.values(slots).some((count: number) => count > 0);
      if (!hasAnySlots && !hasWarlock) {
        return '<!-- Character has no spell slots -->';
      }
      
      if (hasWarlock) {
        // Generate pact magic powergroup for warlock
        return this.generatePactMagicPowerGroupXML(characterData, classInfo);
      } else {
        // Generate regular spell powergroups
        return this.generateRegularSpellPowerGroupXML(slots, spellSlotResult.casterBreakdown);
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

      const slots = spellSlotResult.spellSlots;
      
      // Check if character has warlock levels (pact magic) - check this FIRST
      const hasWarlock = classInfo.some(c => c.name === 'warlock');
      
      // Check if character has any spell slots OR is a warlock (pact magic)
      const hasAnySlots = Object.values(slots).some((count: number) => count > 0);
      if (!hasAnySlots && !hasWarlock) {
        return '<!-- Character has no spell slot meta -->';
      }
      
      if (hasWarlock) {
        // Generate pact magic meta for warlock
        const warlockClass = classInfo.find(c => c.name === 'warlock');
        if (warlockClass) {
          const pactMagicSlots = this.getWarlockPactMagicSlots(warlockClass.level);
          return `    <powermeta>
      <pactmagicslots1><max type="number">${pactMagicSlots.level1 || 0}</max></pactmagicslots1>
      <pactmagicslots2><max type="number">${pactMagicSlots.level2 || 0}</max></pactmagicslots2>
      <pactmagicslots3><max type="number">${pactMagicSlots.level3 || 0}</max></pactmagicslots3>
      <pactmagicslots4><max type="number">${pactMagicSlots.level4 || 0}</max></pactmagicslots4>
      <pactmagicslots5><max type="number">${pactMagicSlots.level5 || 0}</max></pactmagicslots5>
      <pactmagicslots6><max type="number">${pactMagicSlots.level6 || 0}</max></pactmagicslots6>
      <pactmagicslots7><max type="number">${pactMagicSlots.level7 || 0}</max></pactmagicslots7>
      <pactmagicslots8><max type="number">${pactMagicSlots.level8 || 0}</max></pactmagicslots8>
      <pactmagicslots9><max type="number">${pactMagicSlots.level9 || 0}</max></pactmagicslots9>
    </powermeta>`;
        }
      } else {
        // Generate regular spell slot meta
        return `    <powermeta>
      <spellslots1><max type="number">${slots.level1 || 0}</max></spellslots1>
      <spellslots2><max type="number">${slots.level2 || 0}</max></spellslots2>
      <spellslots3><max type="number">${slots.level3 || 0}</max></spellslots3>
      <spellslots4><max type="number">${slots.level4 || 0}</max></spellslots4>
      <spellslots5><max type="number">${slots.level5 || 0}</max></spellslots5>
      <spellslots6><max type="number">${slots.level6 || 0}</max></spellslots6>
      <spellslots7><max type="number">${slots.level7 || 0}</max></spellslots7>
      <spellslots8><max type="number">${slots.level8 || 0}</max></spellslots8>
      <spellslots9><max type="number">${slots.level9 || 0}</max></spellslots9>
    </powermeta>`;
      }
      
      return '<!-- No valid caster type found -->';
      
    } catch (error) {
      console.error('Error generating powermeta XML:', error);
      return '<!-- Error generating powermeta -->';
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
  extractClassInfo(characterData: CharacterData): ClassInfo[] {
    if (!characterData.classes || !Array.isArray(characterData.classes)) {
      return [];
    }

    return characterData.classes.map((classData: any) => {
      const className = (classData.definition?.name || 'unknown').toLowerCase();
      const level = classData.level || 1;
      const subclass = classData.subclassDefinition?.name?.toLowerCase();

      // Map D&D Beyond class names to our internal format
      let mappedClassName: any = className;
      switch (className) {
        case 'fighter':
          // Check for Eldritch Knight
          if (subclass?.includes('eldritch') || subclass?.includes('knight')) {
            mappedClassName = 'fighter';
          }
          break;
        case 'rogue':
          // Check for Arcane Trickster
          if (subclass?.includes('arcane') || subclass?.includes('trickster')) {
            mappedClassName = 'rogue';
          }
          break;
        default:
          // Most classes map directly
          break;
      }

      // Determine caster type based on class
      const { type: casterType } = SpellSlotCalculator.getClassCasterInfo(mappedClassName, level, subclass);

      return {
        name: mappedClassName,
        level,
        subclass,
        casterType
      } as ClassInfo;
    });
  }

  /**
   * Calculate spell slots using either modern SpellSlotCalculator or legacy method
   * Based on feature flags for gradual migration
   * 
   * @param classInfo - Array of class information
   * @returns Spell slot calculation result
   */
  calculateSpellSlots(classInfo: ClassInfo[]): any {
    if (featureFlags.isEnabled('spell_slot_calculator')) {
      return SpellSlotCalculator.calculateSpellSlots(classInfo);
    } else {
      // Legacy fallback - would call legacy getSpellSlots function
      // For now, we'll use the compatibility function
      return SpellSlotCalculator.calculateSpellSlots(classInfo);
    }
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
      debug_spell_slot_calculator: featureFlags.isEnabled('debug_spell_slot_calculator')
    };
  }
}

// Export singleton instance
export const characterConverterFacade = new CharacterConverterFacade();