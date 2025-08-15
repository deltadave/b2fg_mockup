/**
 * D&D 5E Ability Score Constants
 * 
 * Core ability score definitions, mappings, and calculations for D&D 5th Edition.
 * Migrated from legacy gameConstants.js with modern TypeScript implementation
 * and enhanced type safety.
 */

export interface AbilityScore {
  id: number;
  name: string;
  abbreviation: string;
  description: string;
}

export interface AbilityModifier {
  score: number;
  modifier: number;
}

/**
 * The six core D&D ability scores in their canonical order
 */
export const ABILITY_NAMES = [
  'strength',
  'dexterity', 
  'constitution',
  'intelligence',
  'wisdom',
  'charisma'
] as const;

/**
 * Legacy justAbilities array for backward compatibility
 * @deprecated Use ABILITY_NAMES instead
 */
export const justAbilities = [...ABILITY_NAMES];

/**
 * Ability score ID to abbreviation mapping (1-based indexing)
 */
export const ABILITY_ABBREVIATIONS: Record<number, string> = {
  1: 'STR',
  2: 'DEX', 
  3: 'CON',
  4: 'INT',
  5: 'WIS',
  6: 'CHA'
} as const;

/**
 * Ability abbreviation to full name mapping
 */
export const ABILITY_FULL_NAMES: Record<string, string> = {
  'STR': 'strength',
  'DEX': 'dexterity',
  'CON': 'constitution', 
  'INT': 'intelligence',
  'WIS': 'wisdom',
  'CHA': 'charisma'
} as const;

/**
 * Complete ability score definitions with metadata
 */
export const ABILITY_SCORES: AbilityScore[] = [
  {
    id: 1,
    name: 'strength',
    abbreviation: 'STR',
    description: 'Measures physical power and carrying capacity'
  },
  {
    id: 2,
    name: 'dexterity',
    abbreviation: 'DEX', 
    description: 'Measures agility, reflexes, and balance'
  },
  {
    id: 3,
    name: 'constitution',
    abbreviation: 'CON',
    description: 'Measures health, stamina, and vital force'
  },
  {
    id: 4,
    name: 'intelligence',
    abbreviation: 'INT',
    description: 'Measures reasoning ability, memory, and analytical thinking'
  },
  {
    id: 5,
    name: 'wisdom',
    abbreviation: 'WIS',
    description: 'Measures awareness, intuition, and insight'
  },
  {
    id: 6,
    name: 'charisma',
    abbreviation: 'CHA',
    description: 'Measures force of personality, leadership, and confidence'
  }
] as const;

/**
 * Default ability score values
 */
export const DEFAULT_ABILITY_SCORE = 10;
export const MIN_ABILITY_SCORE = 1;
export const MAX_ABILITY_SCORE = 30; // Theoretical maximum with magic items
export const STANDARD_MAX_ABILITY_SCORE = 20; // Standard maximum without magic

/**
 * Ability score arrays for point buy system
 */
export const POINT_BUY_COSTS: Record<number, number> = {
  8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9
} as const;

export const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8] as const;

/**
 * Utility class for ability score operations
 */
export class AbilityScoreUtils {
  /**
   * Calculate ability modifier from ability score
   * Formula: floor((score - 10) / 2)
   */
  static calculateModifier(score: number): number {
    return Math.floor((score - 10) / 2);
  }

  /**
   * Get ability score by ID (1-based)
   */
  static getAbilityById(id: number): AbilityScore | null {
    return ABILITY_SCORES.find(ability => ability.id === id) || null;
  }

  /**
   * Get ability score by name
   */
  static getAbilityByName(name: string): AbilityScore | null {
    return ABILITY_SCORES.find(ability => ability.name.toLowerCase() === name.toLowerCase()) || null;
  }

  /**
   * Get ability ID by name (1-based, compatible with legacy code)
   */
  static getAbilityIdByName(name: string): number {
    const index = ABILITY_NAMES.indexOf(name.toLowerCase() as any);
    return index >= 0 ? index + 1 : 0;
  }

  /**
   * Get ability name by ID (1-based)
   */
  static getAbilityNameById(id: number): string | null {
    return ABILITY_NAMES[id - 1] || null;
  }

  /**
   * Get abbreviation by ability name
   */
  static getAbbreviation(name: string): string | null {
    const ability = this.getAbilityByName(name);
    return ability ? ability.abbreviation : null;
  }

  /**
   * Validate ability score is within acceptable range
   */
  static isValidScore(score: number, allowMagicItems: boolean = true): boolean {
    const min = MIN_ABILITY_SCORE;
    const max = allowMagicItems ? MAX_ABILITY_SCORE : STANDARD_MAX_ABILITY_SCORE;
    return score >= min && score <= max;
  }

  /**
   * Generate all ability modifiers for a given score array
   */
  static calculateAllModifiers(scores: number[]): AbilityModifier[] {
    return scores.map((score, index) => ({
      score,
      modifier: this.calculateModifier(score)
    }));
  }

  /**
   * Get ability save proficiency bonus calculation
   * Used for determining saving throw bonuses
   */
  static calculateSaveBonus(abilityScore: number, proficiencyBonus: number, isProficient: boolean): number {
    const modifier = this.calculateModifier(abilityScore);
    return modifier + (isProficient ? proficiencyBonus : 0);
  }

  /**
   * Get carrying capacity based on Strength score
   * Base capacity is Strength × 15 pounds
   */
  static calculateCarryingCapacity(strengthScore: number, hasPowerfulBuild: boolean = false): {
    normal: number;
    encumbered: number;
    heavilyEncumbered: number;
    maximum: number;
    liftPushDrag: number;
  } {
    const multiplier = hasPowerfulBuild ? 2 : 1;
    const baseCapacity = strengthScore * 15 * multiplier;
    
    return {
      normal: strengthScore * 5 * multiplier,
      encumbered: strengthScore * 10 * multiplier,
      heavilyEncumbered: baseCapacity,
      maximum: baseCapacity,
      liftPushDrag: strengthScore * 30 * multiplier
    };
  }

  /**
   * Convert legacy ability arrays to modern format
   * Useful for migrating existing character data
   */
  static convertLegacyAbilities(stats: any[], bonusStats?: any[], overrideStats?: any[]): Record<string, number> {
    const result: Record<string, number> = {};
    
    ABILITY_NAMES.forEach((name, index) => {
      const baseStat = stats?.[index]?.value || DEFAULT_ABILITY_SCORE;
      const bonus = bonusStats?.[index]?.value || 0;
      const override = overrideStats?.[index]?.value;
      
      result[name] = override !== null && override !== undefined ? override : baseStat + bonus;
    });
    
    return result;
  }
}

/**
 * Type definitions for ability-related data structures
 */
export type AbilityName = typeof ABILITY_NAMES[number];
export type AbilityAbbreviation = keyof typeof ABILITY_FULL_NAMES;
export type AbilityScores = Record<AbilityName, number>;
export type AbilityModifiers = Record<AbilityName, number>;