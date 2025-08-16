/**
 * SpellSlotCalculator Service
 * 
 * Calculates D&D 5e spell slots for single class and multiclass characters.
 * Handles full casters, half casters, third casters, and Pact Magic.
 * Includes XML generation for Fantasy Grounds integration.
 * 
 * Migrated from legacy getSpellSlots() function in spellSlots.js (810 lines)
 */

import {
  CharacterClass,
  SpellcastingProgression,
  SpellSlotsByLevel,
  SpellSlotCalculationResult,
  FULL_CASTER_SPELL_SLOTS,
  HALF_CASTER_SPELL_SLOTS,
  THIRD_CASTER_SPELL_SLOTS,
  PACT_MAGIC_PROGRESSION,
  CLASS_CASTER_TYPES,
  SPELLCASTING_SUBCLASSES,
  CasterLevel,
  SpellSlotCount
} from '@/domain/character/models/SpellSlots';
import { featureFlags } from '@/core/FeatureFlags';

export interface SpellSlotCalculationOptions {
  includeDebugInfo: boolean;
  strictMulticlassRules: boolean;
  handleSpelllessRanger: boolean;
  includePactMagicInMainSlots: boolean;
}

export interface SpellSlotXMLResult {
  spellSlotsXML: string;
  pactMagicXML: string;
  combinedXML: string;
}

export class SpellSlotCalculator {
  private static debugEnabled: boolean = false;

  /**
   * Enable or disable debug mode for SpellSlotCalculator
   */
  static setDebugMode(enabled: boolean): void {
    this.debugEnabled = enabled;
  }

  /**
   * Calculate spell slots for a character with their class levels
   * 
   * @param classes - Array of character classes with levels
   * @param options - Calculation options
   * @returns Complete spell slot calculation result
   */
  calculateSpellSlots(
    classes: CharacterClass[],
    options: SpellSlotCalculationOptions = this.getDefaultOptions()
  ): SpellSlotCalculationResult {
    
    if (SpellSlotCalculator.debugEnabled || featureFlags.isEnabled('spell_slot_calculator_debug')) {
      console.log('🔮 SpellSlotCalculator: Calculating spell slots', {
        classCount: classes.length,
        classes: classes.map(c => `${c.classDefinition.name}${c.level}`),
        options
      });
    }

    // Analyze spellcasting progression for each class
    const progressions = this.analyzeSpellcastingClasses(classes, options);
    
    // Determine calculation method
    const casterClasses = progressions.filter(p => p.casterType !== 'none');
    const hasPactMagic = casterClasses.some(p => p.isPactMagic);
    const hasRegularCasting = casterClasses.some(p => !p.isPactMagic && p.casterType !== 'none');
    
    let calculationMethod: SpellSlotCalculationResult['debugInfo']['calculationMethod'];
    let spellSlots: SpellSlotsByLevel;
    let pactMagicSlots: SpellSlotsByLevel;
    let multiclassCasterLevel: number;

    if (hasPactMagic && !hasRegularCasting) {
      // Pure warlock
      calculationMethod = 'pact_magic_only';
      spellSlots = this.getEmptySpellSlots();
      pactMagicSlots = this.calculatePactMagicSlots(progressions);
      multiclassCasterLevel = 0;
    } else if (casterClasses.length === 1) {
      // Single class caster
      calculationMethod = 'single_class';
      spellSlots = this.calculateSingleClassSpellSlots(casterClasses[0]);
      pactMagicSlots = this.getEmptySpellSlots();
      multiclassCasterLevel = casterClasses[0].casterLevel;
    } else if (casterClasses.length > 1) {
      // Multiclass caster
      calculationMethod = 'multiclass';
      const multiclassResult = this.calculateMulticlassSpellSlots(progressions, options);
      spellSlots = multiclassResult.regularSpellSlots;
      pactMagicSlots = multiclassResult.pactMagicSlots;
      multiclassCasterLevel = multiclassResult.totalCasterLevel;
    } else {
      // Non-caster
      calculationMethod = 'single_class';
      spellSlots = this.getEmptySpellSlots();
      pactMagicSlots = this.getEmptySpellSlots();
      multiclassCasterLevel = 0;
    }

    const result: SpellSlotCalculationResult = {
      spellSlots,
      pactMagicSlots,
      multiclassCasterLevel,
      totalCasterClasses: casterClasses.length,
      debugInfo: {
        classBreakdown: progressions,
        calculationMethod,
        casterLevelCalculation: this.buildCasterLevelCalculation(progressions)
      }
    };

    if (SpellSlotCalculator.debugEnabled || featureFlags.isEnabled('spell_slot_calculator_debug')) {
      console.log('🔮 SpellSlotCalculator: Result', {
        method: calculationMethod,
        multiclassCasterLevel,
        totalCasterClasses: casterClasses.length,
        spellSlots: this.summarizeSpellSlots(spellSlots),
        pactMagic: this.summarizeSpellSlots(pactMagicSlots)
      });
    }

    return result;
  }

  /**
   * Generate Fantasy Grounds XML for spell slots
   * 
   * @param result - Spell slot calculation result
   * @returns XML strings for spell slots
   */
  generateSpellSlotsXML(result: SpellSlotCalculationResult): SpellSlotXMLResult {
    const spellSlotsXML = this.generateRegularSpellSlotsXML(result.spellSlots);
    const pactMagicXML = this.generatePactMagicSlotsXML(result.pactMagicSlots);
    const combinedXML = this.combineSpellSlotXML(spellSlotsXML, pactMagicXML);

    return {
      spellSlotsXML,
      pactMagicXML,
      combinedXML
    };
  }

  /**
   * Analyze spellcasting for each class
   */
  private analyzeSpellcastingClasses(
    classes: CharacterClass[], 
    options: SpellSlotCalculationOptions
  ): SpellcastingProgression[] {
    return classes.map(classInfo => {
      const className = classInfo.classDefinition.name.toLowerCase();
      const baseCasterType = CLASS_CASTER_TYPES[className] || 'none';
      
      // Handle subclass spellcasting requirements
      let casterType = baseCasterType;
      if (baseCasterType === 'third' || baseCasterType === 'none') {
        const hasSpellcastingSubclass = this.checkSpellcastingSubclass(classInfo);
        if (!hasSpellcastingSubclass) {
          casterType = 'none';
        }
      }

      // Handle spellless ranger variant
      if (className === 'ranger' && options.handleSpelllessRanger) {
        const subclassName = classInfo.subclassDefinition?.name.toLowerCase().replace(/\s+/g, '_');
        if (subclassName === 'spellless' || subclassName === 'beast_master_spellless') {
          casterType = 'none';
        }
      }

      const casterLevel = this.calculateClassCasterLevel(classInfo, casterType);
      const isPactMagic = className === 'warlock';

      return {
        className,
        casterType,
        casterLevel,
        spellSlots: this.getSpellSlotsForProgression(casterType, classInfo.level, className),
        isPactMagic,
        spellcastingAbility: this.getSpellcastingAbility(className),
        actualClassLevel: classInfo.level // Store the actual class level for reference
      };
    });
  }

  /**
   * Check if a class/subclass combination grants spellcasting
   */
  private checkSpellcastingSubclass(classInfo: CharacterClass): boolean {
    const className = classInfo.classDefinition.name.toLowerCase();
    const subclassName = classInfo.subclassDefinition?.name.toLowerCase().replace(/\s+/g, '_');
    
    if (!subclassName) {
      return false;
    }

    const validSubclasses = SPELLCASTING_SUBCLASSES[className];
    if (!validSubclasses) {
      return false;
    }

    return validSubclasses.length === 0 || validSubclasses.includes(subclassName);
  }

  /**
   * Calculate effective caster level for a class
   */
  private calculateClassCasterLevel(classInfo: CharacterClass, casterType: string): number {
    switch (casterType) {
      case 'full':
        return classInfo.level;
      case 'half':
        return Math.floor(classInfo.level / 2);
      case 'third':
        return Math.floor(classInfo.level / 3);
      case 'pact':
        return 0; // Pact magic doesn't contribute to multiclass caster level
      default:
        return 0;
    }
  }

  /**
   * Get spell slots for a specific progression type and level
   */
  private getSpellSlotsForProgression(casterType: string, level: number, className: string): SpellSlotsByLevel {
    if (casterType === 'none') {
      return this.getEmptySpellSlots();
    }

    switch (casterType) {
      case 'full':
        return FULL_CASTER_SPELL_SLOTS[level] || this.getEmptySpellSlots();
      case 'half':
        return HALF_CASTER_SPELL_SLOTS[level] || this.getEmptySpellSlots();
      case 'third':
        // Special handling for different third caster starting levels
        if (className === 'artificer') {
          return THIRD_CASTER_SPELL_SLOTS[level] || this.getEmptySpellSlots();
        } else {
          // EK/AT start spellcasting at 3rd level
          if (level < 3) {
            return this.getEmptySpellSlots();
          }
          return THIRD_CASTER_SPELL_SLOTS[level] || this.getEmptySpellSlots();
        }
      case 'pact':
        return this.convertPactMagicToSpellSlots(level);
      default:
        return this.getEmptySpellSlots();
    }
  }

  /**
   * Calculate spell slots for single class characters
   */
  private calculateSingleClassSpellSlots(progression: SpellcastingProgression): SpellSlotsByLevel {
    return progression.spellSlots;
  }

  /**
   * Calculate spell slots for multiclass characters
   */
  private calculateMulticlassSpellSlots(
    progressions: SpellcastingProgression[],
    options: SpellSlotCalculationOptions
  ): { regularSpellSlots: SpellSlotsByLevel; pactMagicSlots: SpellSlotsByLevel; totalCasterLevel: number } {
    
    const regularCasters = progressions.filter(p => !p.isPactMagic && p.casterType !== 'none');
    const pactCasters = progressions.filter(p => p.isPactMagic);
    
    // Calculate total multiclass caster level (excluding warlock)
    const totalCasterLevel = regularCasters.reduce((total, progression) => {
      return total + progression.casterLevel;
    }, 0);
    
    // Get regular spell slots from multiclass table
    const regularSpellSlots = FULL_CASTER_SPELL_SLOTS[totalCasterLevel] || this.getEmptySpellSlots();
    
    // Calculate pact magic separately
    const pactMagicSlots = pactCasters.length > 0 
      ? this.calculatePactMagicSlots(pactCasters)
      : this.getEmptySpellSlots();

    return {
      regularSpellSlots,
      pactMagicSlots,
      totalCasterLevel
    };
  }

  /**
   * Calculate Pact Magic spell slots for warlocks
   */
  private calculatePactMagicSlots(progressions: SpellcastingProgression[]): SpellSlotsByLevel {
    const warlockProgression = progressions.find(p => p.className === 'warlock');
    if (!warlockProgression || !warlockProgression.actualClassLevel) {
      return this.getEmptySpellSlots();
    }

    // Use the actual warlock class level to get pact magic slots
    return this.convertPactMagicToSpellSlots(warlockProgression.actualClassLevel);
  }

  /**
   * Convert warlock level to Pact Magic spell slots
   */
  private convertPactMagicToSpellSlots(warlockLevel: number): SpellSlotsByLevel {
    const pactProgression = PACT_MAGIC_PROGRESSION[warlockLevel];
    if (!pactProgression) {
      return this.getEmptySpellSlots();
    }

    const spellSlots = this.getEmptySpellSlots();
    spellSlots[pactProgression.slotLevel as keyof SpellSlotsByLevel] = pactProgression.slotCount;
    
    return spellSlots;
  }

  /**
   * Generate XML for regular spell slots
   */
  private generateRegularSpellSlotsXML(spellSlots: SpellSlotsByLevel): string {
    let xml = '';
    
    for (let level = 1; level <= 9; level++) {
      const slotCount = spellSlots[level as keyof SpellSlotsByLevel];
      xml += `\t\t\t<spellslots${level}>\n`;
      xml += `\t\t\t\t<max type=\"number\">${slotCount}</max>\n`;
      xml += `\t\t\t</spellslots${level}>\n`;
    }
    
    return xml;
  }

  /**
   * Generate XML for Pact Magic spell slots
   */
  private generatePactMagicSlotsXML(pactSlots: SpellSlotsByLevel): string {
    let xml = '';
    
    for (let level = 1; level <= 9; level++) {
      const slotCount = pactSlots[level as keyof SpellSlotsByLevel];
      xml += `\t\t\t<pactmagicslots${level}>\n`;
      xml += `\t\t\t\t<max type=\"number\">${slotCount}</max>\n`;
      xml += `\t\t\t</pactmagicslots${level}>\n`;
    }
    
    return xml;
  }

  /**
   * Combine regular and pact magic XML
   */
  private combineSpellSlotXML(regularXML: string, pactMagicXML: string): string {
    let combinedXML = '\t\t<powermeta>\n';
    combinedXML += pactMagicXML;
    combinedXML += regularXML;
    combinedXML += '\t\t</powermeta>';
    return combinedXML;
  }

  /**
   * Get spellcasting ability for a class
   */
  private getSpellcastingAbility(className: string): 'INT' | 'WIS' | 'CHA' | undefined {
    const abilityMap: Record<string, 'INT' | 'WIS' | 'CHA'> = {
      'wizard': 'INT',
      'artificer': 'INT',
      'fighter': 'INT', // Eldritch Knight
      'rogue': 'INT', // Arcane Trickster
      'cleric': 'WIS',
      'druid': 'WIS',
      'ranger': 'WIS',
      'bard': 'CHA',
      'sorcerer': 'CHA',
      'warlock': 'CHA',
      'paladin': 'CHA'
    };
    
    return abilityMap[className];
  }

  /**
   * Build caster level calculation breakdown
   */
  private buildCasterLevelCalculation(progressions: SpellcastingProgression[]): Array<{
    className: string;
    level: number;
    casterType: string;
    contributesToCasterLevel: number;
  }> {
    return progressions.map(progression => ({
      className: progression.className,
      level: progression.casterLevel,
      casterType: progression.casterType,
      contributesToCasterLevel: progression.isPactMagic ? 0 : progression.casterLevel
    }));
  }

  /**
   * Get empty spell slots structure
   */
  private getEmptySpellSlots(): SpellSlotsByLevel {
    return { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 };
  }

  /**
   * Summarize spell slots for logging
   */
  private summarizeSpellSlots(slots: SpellSlotsByLevel): string {
    const nonZeroSlots = Object.entries(slots)
      .filter(([_, count]) => count > 0)
      .map(([level, count]) => `${level}:${count}`)
      .join(', ');
    return nonZeroSlots || 'none';
  }

  /**
   * Get default calculation options
   */
  private getDefaultOptions(): SpellSlotCalculationOptions {
    return {
      includeDebugInfo: true,
      strictMulticlassRules: true,
      handleSpelllessRanger: true,
      includePactMagicInMainSlots: false
    };
  }

  /**
   * Validate character class data
   */
  static validateClassData(classes: CharacterClass[]): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    classes.forEach((classInfo, index) => {
      if (!classInfo.classDefinition?.name) {
        errors.push(`Class at index ${index} missing name`);
      }
      
      if (typeof classInfo.level !== 'number' || classInfo.level < 1 || classInfo.level > 20) {
        errors.push(`Class ${classInfo.classDefinition?.name || index} has invalid level: ${classInfo.level}`);
      }
    });
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Get spell slot information for a specific class and level
   * Used for direct spell slot queries
   */
  static getSpellSlotsForClass(className: string, level: number, subclassName?: string): SpellSlotsByLevel {
    const calculator = new SpellSlotCalculator();
    const mockClass: CharacterClass = {
      id: 1,
      level,
      classDefinition: {
        id: 1,
        name: className,
        canCastSpells: true
      },
      subclassDefinition: subclassName ? {
        id: 1,
        name: subclassName
      } : undefined
    };

    const result = calculator.calculateSpellSlots([mockClass]);
    return result.spellSlots;
  }

  /**
   * Convert spell slots to legacy format (for backward compatibility)
   */
  static toLegacyFormat(spellSlots: SpellSlotsByLevel): Array<{ level: number; slots: number }> {
    return Object.entries(spellSlots).map(([level, count]) => ({
      level: parseInt(level),
      slots: count
    }));
  }

  /**
   * Validate class info (for backward compatibility)
   */
  static validateClassInfo(classInfo: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!classInfo || typeof classInfo !== 'object') {
      errors.push('Class info must be an object');
      return { isValid: false, errors };
    }
    
    if (!Array.isArray(classInfo)) {
      // Single class object validation
      if (!classInfo.classDefinition?.name) {
        errors.push('Class definition name is required');
      }
      if (typeof classInfo.level !== 'number' || classInfo.level < 1 || classInfo.level > 20) {
        errors.push('Class level must be between 1 and 20');
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}