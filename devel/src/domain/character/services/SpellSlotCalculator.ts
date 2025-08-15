/**
 * SpellSlotCalculator Service
 * 
 * Modern replacement for legacy getSpellSlots() function from spellSlots.js.
 * Handles D&D 5e spell slot calculations for single and multiclass characters
 * across all spellcasting classes including full casters, half casters, and 
 * third casters (Artificer).
 * 
 * Migrated from legacy spellSlots.js (811 lines)
 */

export type SpellcasterType = 'full' | 'half' | 'third' | 'pact' | 'none';
export type ClassName = 'bard' | 'cleric' | 'druid' | 'sorcerer' | 'wizard' | 'warlock' | 
                       'paladin' | 'ranger' | 'artificer' | 'fighter' | 'rogue';

export interface ClassInfo {
  name: ClassName;
  level: number;
  subclass?: string;
  casterType: SpellcasterType;
}

export interface SpellSlots {
  level1: number;
  level2: number;
  level3: number;
  level4: number;
  level5: number;
  level6: number;
  level7: number;
  level8: number;
  level9: number;
}

export interface CasterLevelBreakdown {
  fullCasterLevels: number;
  halfCasterLevels: number;
  thirdCasterLevels: number;
  totalCasterLevel: number;
  casterClassCount: number;
  isMulticlass: boolean;
}

export interface SpellSlotCalculationResult {
  spellSlots: SpellSlots;
  casterBreakdown: CasterLevelBreakdown;
  debugInfo: {
    classContributions: Array<{
      className: string;
      level: number;
      casterType: SpellcasterType;
      contribution: number;
    }>;
    calculationMethod: 'single-class' | 'multiclass';
    totalCasterLevel: number;
  };
}

export class SpellSlotCalculator {
  /**
   * Enable or disable detailed debugging output
   */
  private static debugEnabled: boolean = false;
  
  /**
   * Set debug mode for detailed console output
   */
  static setDebugMode(enabled: boolean): void {
    this.debugEnabled = enabled;
  }

  /**
   * Full caster spell slot table (Bard, Cleric, Druid, Sorcerer, Wizard)
   */
  private static readonly FULL_CASTER_SLOTS: Record<number, SpellSlots> = {
    0: { level1: 0, level2: 0, level3: 0, level4: 0, level5: 0, level6: 0, level7: 0, level8: 0, level9: 0 },
    1: { level1: 2, level2: 0, level3: 0, level4: 0, level5: 0, level6: 0, level7: 0, level8: 0, level9: 0 },
    2: { level1: 3, level2: 0, level3: 0, level4: 0, level5: 0, level6: 0, level7: 0, level8: 0, level9: 0 },
    3: { level1: 4, level2: 2, level3: 0, level4: 0, level5: 0, level6: 0, level7: 0, level8: 0, level9: 0 },
    4: { level1: 4, level2: 3, level3: 0, level4: 0, level5: 0, level6: 0, level7: 0, level8: 0, level9: 0 },
    5: { level1: 4, level2: 3, level3: 2, level4: 0, level5: 0, level6: 0, level7: 0, level8: 0, level9: 0 },
    6: { level1: 4, level2: 3, level3: 3, level4: 0, level5: 0, level6: 0, level7: 0, level8: 0, level9: 0 },
    7: { level1: 4, level2: 3, level3: 3, level4: 1, level5: 0, level6: 0, level7: 0, level8: 0, level9: 0 },
    8: { level1: 4, level2: 3, level3: 3, level4: 2, level5: 0, level6: 0, level7: 0, level8: 0, level9: 0 },
    9: { level1: 4, level2: 3, level3: 3, level4: 3, level5: 1, level6: 0, level7: 0, level8: 0, level9: 0 },
    10: { level1: 4, level2: 3, level3: 3, level4: 3, level5: 2, level6: 0, level7: 0, level8: 0, level9: 0 },
    11: { level1: 4, level2: 3, level3: 3, level4: 3, level5: 2, level6: 1, level7: 0, level8: 0, level9: 0 },
    12: { level1: 4, level2: 3, level3: 3, level4: 3, level5: 2, level6: 1, level7: 0, level8: 0, level9: 0 },
    13: { level1: 4, level2: 3, level3: 3, level4: 3, level5: 2, level6: 1, level7: 1, level8: 0, level9: 0 },
    14: { level1: 4, level2: 3, level3: 3, level4: 3, level5: 2, level6: 1, level7: 1, level8: 0, level9: 0 },
    15: { level1: 4, level2: 3, level3: 3, level4: 3, level5: 2, level6: 1, level7: 1, level8: 1, level9: 0 },
    16: { level1: 4, level2: 3, level3: 3, level4: 3, level5: 2, level6: 1, level7: 1, level8: 1, level9: 0 },
    17: { level1: 4, level2: 3, level3: 3, level4: 3, level5: 2, level6: 1, level7: 1, level8: 1, level9: 1 },
    18: { level1: 4, level2: 3, level3: 3, level4: 3, level5: 3, level6: 1, level7: 1, level8: 1, level9: 1 },
    19: { level1: 4, level2: 3, level3: 3, level4: 3, level5: 3, level6: 2, level7: 1, level8: 1, level9: 1 },
    20: { level1: 4, level2: 3, level3: 3, level4: 3, level5: 3, level6: 2, level7: 2, level8: 1, level9: 1 }
  };

  /**
   * Half caster spell slot table (Paladin, Ranger)
   */
  private static readonly HALF_CASTER_SLOTS: Record<number, SpellSlots> = {
    0: { level1: 0, level2: 0, level3: 0, level4: 0, level5: 0, level6: 0, level7: 0, level8: 0, level9: 0 },
    1: { level1: 0, level2: 0, level3: 0, level4: 0, level5: 0, level6: 0, level7: 0, level8: 0, level9: 0 },
    2: { level1: 2, level2: 0, level3: 0, level4: 0, level5: 0, level6: 0, level7: 0, level8: 0, level9: 0 },
    3: { level1: 3, level2: 0, level3: 0, level4: 0, level5: 0, level6: 0, level7: 0, level8: 0, level9: 0 },
    4: { level1: 3, level2: 0, level3: 0, level4: 0, level5: 0, level6: 0, level7: 0, level8: 0, level9: 0 },
    5: { level1: 4, level2: 2, level3: 0, level4: 0, level5: 0, level6: 0, level7: 0, level8: 0, level9: 0 },
    6: { level1: 4, level2: 2, level3: 0, level4: 0, level5: 0, level6: 0, level7: 0, level8: 0, level9: 0 },
    7: { level1: 4, level2: 3, level3: 0, level4: 0, level5: 0, level6: 0, level7: 0, level8: 0, level9: 0 },
    8: { level1: 4, level2: 3, level3: 0, level4: 0, level5: 0, level6: 0, level7: 0, level8: 0, level9: 0 },
    9: { level1: 4, level2: 3, level3: 2, level4: 0, level5: 0, level6: 0, level7: 0, level8: 0, level9: 0 },
    10: { level1: 4, level2: 3, level3: 2, level4: 0, level5: 0, level6: 0, level7: 0, level8: 0, level9: 0 },
    11: { level1: 4, level2: 3, level3: 3, level4: 0, level5: 0, level6: 0, level7: 0, level8: 0, level9: 0 },
    12: { level1: 4, level2: 3, level3: 3, level4: 0, level5: 0, level6: 0, level7: 0, level8: 0, level9: 0 },
    13: { level1: 4, level2: 3, level3: 3, level4: 1, level5: 0, level6: 0, level7: 0, level8: 0, level9: 0 },
    14: { level1: 4, level2: 3, level3: 3, level4: 1, level5: 0, level6: 0, level7: 0, level8: 0, level9: 0 },
    15: { level1: 4, level2: 3, level3: 3, level4: 2, level5: 0, level6: 0, level7: 0, level8: 0, level9: 0 },
    16: { level1: 4, level2: 3, level3: 3, level4: 2, level5: 0, level6: 0, level7: 0, level8: 0, level9: 0 },
    17: { level1: 4, level2: 3, level3: 3, level4: 3, level5: 1, level6: 0, level7: 0, level8: 0, level9: 0 },
    18: { level1: 4, level2: 3, level3: 3, level4: 3, level5: 1, level6: 0, level7: 0, level8: 0, level9: 0 },
    19: { level1: 4, level2: 3, level3: 3, level4: 3, level5: 2, level6: 0, level7: 0, level8: 0, level9: 0 },
    20: { level1: 4, level2: 3, level3: 3, level4: 3, level5: 2, level6: 0, level7: 0, level8: 0, level9: 0 }
  };

  /**
   * Third caster spell slot table (Eldritch Knight Fighter, Arcane Trickster Rogue, Artificer)
   */
  private static readonly THIRD_CASTER_SLOTS: Record<number, SpellSlots> = {
    0: { level1: 0, level2: 0, level3: 0, level4: 0, level5: 0, level6: 0, level7: 0, level8: 0, level9: 0 },
    1: { level1: 0, level2: 0, level3: 0, level4: 0, level5: 0, level6: 0, level7: 0, level8: 0, level9: 0 },
    2: { level1: 0, level2: 0, level3: 0, level4: 0, level5: 0, level6: 0, level7: 0, level8: 0, level9: 0 },
    3: { level1: 2, level2: 0, level3: 0, level4: 0, level5: 0, level6: 0, level7: 0, level8: 0, level9: 0 },
    4: { level1: 3, level2: 0, level3: 0, level4: 0, level5: 0, level6: 0, level7: 0, level8: 0, level9: 0 },
    5: { level1: 3, level2: 0, level3: 0, level4: 0, level5: 0, level6: 0, level7: 0, level8: 0, level9: 0 },
    6: { level1: 3, level2: 0, level3: 0, level4: 0, level5: 0, level6: 0, level7: 0, level8: 0, level9: 0 },
    7: { level1: 4, level2: 2, level3: 0, level4: 0, level5: 0, level6: 0, level7: 0, level8: 0, level9: 0 },
    8: { level1: 4, level2: 2, level3: 0, level4: 0, level5: 0, level6: 0, level7: 0, level8: 0, level9: 0 },
    9: { level1: 4, level2: 2, level3: 0, level4: 0, level5: 0, level6: 0, level7: 0, level8: 0, level9: 0 },
    10: { level1: 4, level2: 3, level3: 0, level4: 0, level5: 0, level6: 0, level7: 0, level8: 0, level9: 0 },
    11: { level1: 4, level2: 3, level3: 0, level4: 0, level5: 0, level6: 0, level7: 0, level8: 0, level9: 0 },
    12: { level1: 4, level2: 3, level3: 0, level4: 0, level5: 0, level6: 0, level7: 0, level8: 0, level9: 0 },
    13: { level1: 4, level2: 3, level3: 2, level4: 0, level5: 0, level6: 0, level7: 0, level8: 0, level9: 0 },
    14: { level1: 4, level2: 3, level3: 2, level4: 0, level5: 0, level6: 0, level7: 0, level8: 0, level9: 0 },
    15: { level1: 4, level2: 3, level3: 2, level4: 0, level5: 0, level6: 0, level7: 0, level8: 0, level9: 0 },
    16: { level1: 4, level2: 3, level3: 3, level4: 0, level5: 0, level6: 0, level7: 0, level8: 0, level9: 0 },
    17: { level1: 4, level2: 3, level3: 3, level4: 0, level5: 0, level6: 0, level7: 0, level8: 0, level9: 0 },
    18: { level1: 4, level2: 3, level3: 3, level4: 0, level5: 0, level6: 0, level7: 0, level8: 0, level9: 0 },
    19: { level1: 4, level2: 3, level3: 3, level4: 1, level5: 0, level6: 0, level7: 0, level8: 0, level9: 0 },
    20: { level1: 4, level2: 3, level3: 3, level4: 1, level5: 0, level6: 0, level7: 0, level8: 0, level9: 0 }
  };

  /**
   * Artificer has unique spell slot progression
   */
  private static readonly ARTIFICER_SLOTS: Record<number, SpellSlots> = {
    0: { level1: 0, level2: 0, level3: 0, level4: 0, level5: 0, level6: 0, level7: 0, level8: 0, level9: 0 },
    1: { level1: 2, level2: 0, level3: 0, level4: 0, level5: 0, level6: 0, level7: 0, level8: 0, level9: 0 },
    2: { level1: 2, level2: 0, level3: 0, level4: 0, level5: 0, level6: 0, level7: 0, level8: 0, level9: 0 },
    3: { level1: 3, level2: 0, level3: 0, level4: 0, level5: 0, level6: 0, level7: 0, level8: 0, level9: 0 },
    4: { level1: 3, level2: 0, level3: 0, level4: 0, level5: 0, level6: 0, level7: 0, level8: 0, level9: 0 },
    5: { level1: 4, level2: 2, level3: 0, level4: 0, level5: 0, level6: 0, level7: 0, level8: 0, level9: 0 },
    6: { level1: 4, level2: 2, level3: 0, level4: 0, level5: 0, level6: 0, level7: 0, level8: 0, level9: 0 },
    7: { level1: 4, level2: 3, level3: 0, level4: 0, level5: 0, level6: 0, level7: 0, level8: 0, level9: 0 },
    8: { level1: 4, level2: 3, level3: 0, level4: 0, level5: 0, level6: 0, level7: 0, level8: 0, level9: 0 },
    9: { level1: 4, level2: 3, level3: 2, level4: 0, level5: 0, level6: 0, level7: 0, level8: 0, level9: 0 },
    10: { level1: 4, level2: 3, level3: 2, level4: 0, level5: 0, level6: 0, level7: 0, level8: 0, level9: 0 },
    11: { level1: 4, level2: 3, level3: 3, level4: 0, level5: 0, level6: 0, level7: 0, level8: 0, level9: 0 },
    12: { level1: 4, level2: 3, level3: 3, level4: 0, level5: 0, level6: 0, level7: 0, level8: 0, level9: 0 },
    13: { level1: 4, level2: 3, level3: 3, level4: 1, level5: 0, level6: 0, level7: 0, level8: 0, level9: 0 },
    14: { level1: 4, level2: 3, level3: 3, level4: 1, level5: 0, level6: 0, level7: 0, level8: 0, level9: 0 },
    15: { level1: 4, level2: 3, level3: 3, level4: 2, level5: 0, level6: 0, level7: 0, level8: 0, level9: 0 },
    16: { level1: 4, level2: 3, level3: 3, level4: 2, level5: 0, level6: 0, level7: 0, level8: 0, level9: 0 },
    17: { level1: 4, level2: 3, level3: 3, level4: 3, level5: 1, level6: 0, level7: 0, level8: 0, level9: 0 },
    18: { level1: 4, level2: 3, level3: 3, level4: 3, level5: 1, level6: 0, level7: 0, level8: 0, level9: 0 },
    19: { level1: 4, level2: 3, level3: 3, level4: 3, level5: 2, level6: 0, level7: 0, level8: 0, level9: 0 },
    20: { level1: 4, level2: 3, level3: 3, level4: 3, level5: 2, level6: 0, level7: 0, level8: 0, level9: 0 }
  };

  /**
   * Determine spellcaster type and level contribution for multiclassing
   */
  static getClassCasterInfo(className: ClassName, level: number, subclass?: string): { type: SpellcasterType; contribution: number } {
    switch (className) {
      case 'bard':
      case 'cleric':
      case 'druid':
      case 'sorcerer':
      case 'wizard':
        return { type: 'full', contribution: level };

      case 'paladin':
      case 'ranger':
        // Special handling for spellless ranger
        if (className === 'ranger' && subclass === 'spellless') {
          return { type: 'none', contribution: 0 };
        }
        return { type: 'half', contribution: Math.floor(level / 2) };

      case 'artificer':
        return { type: 'half', contribution: Math.floor(level / 2) };

      case 'fighter':
        if (subclass === 'eldritch_knight') {
          return { type: 'third', contribution: Math.floor(level / 3) };
        }
        return { type: 'none', contribution: 0 };

      case 'rogue':
        if (subclass === 'arcane_trickster') {
          return { type: 'third', contribution: Math.floor(level / 3) };
        }
        return { type: 'none', contribution: 0 };

      case 'warlock':
        // Warlocks use Pact Magic, handled separately
        return { type: 'pact', contribution: 0 };

      default:
        return { type: 'none', contribution: 0 };
    }
  }

  /**
   * Calculate caster level breakdown for multiclassing
   */
  static calculateCasterLevels(classes: ClassInfo[]): CasterLevelBreakdown {
    let fullCasterLevels = 0;
    let halfCasterLevels = 0;
    let thirdCasterLevels = 0;
    let casterClassCount = 0;

    for (const classInfo of classes) {
      const { type, contribution } = this.getClassCasterInfo(classInfo.name, classInfo.level, classInfo.subclass);
      
      if (type !== 'none' && type !== 'pact' && contribution > 0) {
        casterClassCount++;
        
        switch (type) {
          case 'full':
            fullCasterLevels += contribution;
            break;
          case 'half':
            halfCasterLevels += contribution;
            break;
          case 'third':
            thirdCasterLevels += contribution;
            break;
        }
      }
    }

    const totalCasterLevel = fullCasterLevels + halfCasterLevels + thirdCasterLevels;
    const isMulticlass = casterClassCount > 1;

    return {
      fullCasterLevels,
      halfCasterLevels,
      thirdCasterLevels,
      totalCasterLevel,
      casterClassCount,
      isMulticlass
    };
  }

  /**
   * Get spell slots for a single class
   */
  static getSingleClassSpellSlots(className: ClassName, level: number, subclass?: string): SpellSlots {
    const { type } = this.getClassCasterInfo(className, level, subclass);
    const emptySlots: SpellSlots = { level1: 0, level2: 0, level3: 0, level4: 0, level5: 0, level6: 0, level7: 0, level8: 0, level9: 0 };

    switch (type) {
      case 'full':
        return this.FULL_CASTER_SLOTS[Math.min(level, 20)] ?? emptySlots;

      case 'half':
        if (className === 'artificer') {
          return this.ARTIFICER_SLOTS[Math.min(level, 20)] ?? emptySlots;
        }
        return this.HALF_CASTER_SLOTS[Math.min(level, 20)] ?? emptySlots;

      case 'third':
        return this.THIRD_CASTER_SLOTS[Math.min(level, 20)] ?? emptySlots;

      case 'pact':
        // Warlock Pact Magic handled separately
        return emptySlots;

      default:
        return emptySlots;
    }
  }

  /**
   * Get multiclass spell slots based on total caster level
   */
  static getMulticlassSpellSlots(totalCasterLevel: number): SpellSlots {
    const emptySlots: SpellSlots = { level1: 0, level2: 0, level3: 0, level4: 0, level5: 0, level6: 0, level7: 0, level8: 0, level9: 0 };
    return this.FULL_CASTER_SLOTS[Math.min(totalCasterLevel, 20)] ?? emptySlots;
  }

  /**
   * Main spell slot calculation function
   * Modern replacement for legacy getSpellSlots() function
   */
  static calculateSpellSlots(classes: ClassInfo[]): SpellSlotCalculationResult {
    if (this.debugEnabled) {
      console.group('🪄 Spell Slot Calculation');
      console.log('Classes:', classes);
    }

    const casterBreakdown = this.calculateCasterLevels(classes);
    const debugInfo = {
      classContributions: [] as Array<{ className: string; level: number; casterType: SpellcasterType; contribution: number }>,
      calculationMethod: 'single-class' as 'single-class' | 'multiclass',
      totalCasterLevel: casterBreakdown.totalCasterLevel
    };

    // Build debug info
    for (const classInfo of classes) {
      const { type, contribution } = this.getClassCasterInfo(classInfo.name, classInfo.level, classInfo.subclass);
      debugInfo.classContributions.push({
        className: classInfo.name,
        level: classInfo.level,
        casterType: type,
        contribution
      });
    }

    let spellSlots: SpellSlots;

    if (casterBreakdown.isMulticlass) {
      // Multiclass spellcasting: use combined caster level
      debugInfo.calculationMethod = 'multiclass';
      spellSlots = this.getMulticlassSpellSlots(casterBreakdown.totalCasterLevel);
      
      if (this.debugEnabled) {
        console.log(`Multiclass calculation: ${casterBreakdown.totalCasterLevel} total caster levels`);
        console.log(`Full: ${casterBreakdown.fullCasterLevels}, Half: ${casterBreakdown.halfCasterLevels}, Third: ${casterBreakdown.thirdCasterLevels}`);
      }
    } else if (casterBreakdown.casterClassCount === 1) {
      // Single caster class: use class-specific table
      debugInfo.calculationMethod = 'single-class';
      const casterClass = classes.find(c => {
        const { type } = this.getClassCasterInfo(c.name, c.level, c.subclass);
        return type !== 'none' && type !== 'pact';
      });
      
      if (casterClass) {
        spellSlots = this.getSingleClassSpellSlots(casterClass.name, casterClass.level, casterClass.subclass);
        
        if (this.debugEnabled) {
          console.log(`Single class calculation: ${casterClass.name} level ${casterClass.level}`);
        }
      } else {
        spellSlots = { level1: 0, level2: 0, level3: 0, level4: 0, level5: 0, level6: 0, level7: 0, level8: 0, level9: 0 };
      }
    } else {
      // No caster classes
      spellSlots = { level1: 0, level2: 0, level3: 0, level4: 0, level5: 0, level6: 0, level7: 0, level8: 0, level9: 0 };
      
      if (this.debugEnabled) {
        console.log('No spellcasting classes found');
      }
    }

    if (this.debugEnabled) {
      console.log('Final spell slots:', spellSlots);
      console.groupEnd();
    }

    return {
      spellSlots,
      casterBreakdown,
      debugInfo
    };
  }

  /**
   * Convert spell slots to legacy global variable format
   * For compatibility with existing characterParser.js usage
   */
  static toLegacyFormat(spellSlots: SpellSlots): Array<{ level: number; slots: number }> {
    return [
      { level: 1, slots: spellSlots.level1 },
      { level: 2, slots: spellSlots.level2 },
      { level: 3, slots: spellSlots.level3 },
      { level: 4, slots: spellSlots.level4 },
      { level: 5, slots: spellSlots.level5 },
      { level: 6, slots: spellSlots.level6 },
      { level: 7, slots: spellSlots.level7 },
      { level: 8, slots: spellSlots.level8 },
      { level: 9, slots: spellSlots.level9 }
    ];
  }

  /**
   * Validate class information for spell slot calculation
   */
  static validateClassInfo(classes: ClassInfo[]): {
    isValid: boolean;
    issues: string[];
    warnings: string[];
  } {
    const issues: string[] = [];
    const warnings: string[] = [];

    if (!classes || !Array.isArray(classes)) {
      issues.push('Classes data is null or not an array');
      return { isValid: false, issues, warnings };
    }

    for (let i = 0; i < classes.length; i++) {
      const classInfo = classes[i];
      
      if (!classInfo?.name) {
        warnings.push(`Class ${i + 1} is missing name`);
      }
      
      if (!classInfo || typeof classInfo.level !== 'number' || classInfo.level < 1 || classInfo.level > 20) {
        warnings.push(`Class ${i + 1} (${classInfo?.name || 'unknown'}) has invalid level: ${classInfo?.level}`);
      }

      // Check for subclass requirements
      if (classInfo?.name === 'fighter' && !classInfo.subclass) {
        warnings.push(`Fighter class is missing subclass - assuming non-spellcaster`);
      }
      
      if (classInfo?.name === 'rogue' && !classInfo.subclass) {
        warnings.push(`Rogue class is missing subclass - assuming non-spellcaster`);
      }
      
      if (classInfo?.name === 'ranger' && !classInfo.subclass) {
        warnings.push(`Ranger class is missing subclass - assuming standard ranger`);
      }
    }

    return {
      isValid: issues.length === 0,
      issues,
      warnings
    };
  }
}