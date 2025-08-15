import { describe, it, expect } from 'vitest';
import {
  ABILITY_NAMES,
  justAbilities,
  ABILITY_ABBREVIATIONS,
  ABILITY_FULL_NAMES,
  ABILITY_SCORES,
  DEFAULT_ABILITY_SCORE,
  MIN_ABILITY_SCORE,
  MAX_ABILITY_SCORE,
  STANDARD_MAX_ABILITY_SCORE,
  POINT_BUY_COSTS,
  STANDARD_ARRAY,
  AbilityScoreUtils,
  type AbilityName,
  type AbilityScores
} from '@/domain/character/constants/AbilityConstants';

describe('AbilityConstants', () => {
  describe('Core Constants', () => {
    it('should have six ability names in correct order', () => {
      expect(ABILITY_NAMES).toEqual([
        'strength',
        'dexterity',
        'constitution',
        'intelligence',
        'wisdom',
        'charisma'
      ]);
      expect(ABILITY_NAMES).toHaveLength(6);
    });

    it('should maintain legacy justAbilities compatibility', () => {
      expect(justAbilities).toEqual(ABILITY_NAMES);
      expect(justAbilities).toEqual([
        'strength',
        'dexterity',
        'constitution',
        'intelligence',
        'wisdom',
        'charisma'
      ]);
    });

    it('should have correct ability abbreviations mapping', () => {
      expect(ABILITY_ABBREVIATIONS).toEqual({
        1: 'STR',
        2: 'DEX',
        3: 'CON',
        4: 'INT',
        5: 'WIS',
        6: 'CHA'
      });
    });

    it('should have correct full names mapping', () => {
      expect(ABILITY_FULL_NAMES).toEqual({
        'STR': 'strength',
        'DEX': 'dexterity',
        'CON': 'constitution',
        'INT': 'intelligence',
        'WIS': 'wisdom',
        'CHA': 'charisma'
      });
    });

    it('should have complete ability score definitions', () => {
      expect(ABILITY_SCORES).toHaveLength(6);
      
      const strengthAbility = ABILITY_SCORES[0];
      expect(strengthAbility).toEqual({
        id: 1,
        name: 'strength',
        abbreviation: 'STR',
        description: 'Measures physical power and carrying capacity'
      });

      const charismaAbility = ABILITY_SCORES[5];
      expect(charismaAbility).toEqual({
        id: 6,
        name: 'charisma',
        abbreviation: 'CHA',
        description: 'Measures force of personality, leadership, and confidence'
      });
    });

    it('should have correct default values', () => {
      expect(DEFAULT_ABILITY_SCORE).toBe(10);
      expect(MIN_ABILITY_SCORE).toBe(1);
      expect(MAX_ABILITY_SCORE).toBe(30);
      expect(STANDARD_MAX_ABILITY_SCORE).toBe(20);
    });

    it('should have point buy costs', () => {
      expect(POINT_BUY_COSTS[8]).toBe(0);
      expect(POINT_BUY_COSTS[15]).toBe(9);
      expect(Object.keys(POINT_BUY_COSTS)).toHaveLength(8);
    });

    it('should have standard array', () => {
      expect(STANDARD_ARRAY).toEqual([15, 14, 13, 12, 10, 8]);
      expect(STANDARD_ARRAY).toHaveLength(6);
    });
  });

  describe('AbilityScoreUtils', () => {
    describe('calculateModifier()', () => {
      it('should calculate correct ability modifiers', () => {
        expect(AbilityScoreUtils.calculateModifier(1)).toBe(-5);
        expect(AbilityScoreUtils.calculateModifier(8)).toBe(-1);
        expect(AbilityScoreUtils.calculateModifier(9)).toBe(-1);
        expect(AbilityScoreUtils.calculateModifier(10)).toBe(0);
        expect(AbilityScoreUtils.calculateModifier(11)).toBe(0);
        expect(AbilityScoreUtils.calculateModifier(12)).toBe(1);
        expect(AbilityScoreUtils.calculateModifier(13)).toBe(1);
        expect(AbilityScoreUtils.calculateModifier(14)).toBe(2);
        expect(AbilityScoreUtils.calculateModifier(15)).toBe(2);
        expect(AbilityScoreUtils.calculateModifier(16)).toBe(3);
        expect(AbilityScoreUtils.calculateModifier(17)).toBe(3);
        expect(AbilityScoreUtils.calculateModifier(18)).toBe(4);
        expect(AbilityScoreUtils.calculateModifier(19)).toBe(4);
        expect(AbilityScoreUtils.calculateModifier(20)).toBe(5);
        expect(AbilityScoreUtils.calculateModifier(30)).toBe(10);
      });

      it('should handle edge cases', () => {
        expect(AbilityScoreUtils.calculateModifier(0)).toBe(-5);
        expect(AbilityScoreUtils.calculateModifier(-1)).toBe(-6);
      });
    });

    describe('getAbilityById()', () => {
      it('should return ability by ID', () => {
        const strength = AbilityScoreUtils.getAbilityById(1);
        expect(strength?.name).toBe('strength');
        expect(strength?.abbreviation).toBe('STR');

        const charisma = AbilityScoreUtils.getAbilityById(6);
        expect(charisma?.name).toBe('charisma');
        expect(charisma?.abbreviation).toBe('CHA');
      });

      it('should return null for invalid ID', () => {
        expect(AbilityScoreUtils.getAbilityById(0)).toBe(null);
        expect(AbilityScoreUtils.getAbilityById(7)).toBe(null);
        expect(AbilityScoreUtils.getAbilityById(-1)).toBe(null);
      });
    });

    describe('getAbilityByName()', () => {
      it('should return ability by name', () => {
        const strength = AbilityScoreUtils.getAbilityByName('strength');
        expect(strength?.id).toBe(1);
        expect(strength?.abbreviation).toBe('STR');

        const wisdom = AbilityScoreUtils.getAbilityByName('wisdom');
        expect(wisdom?.id).toBe(5);
        expect(wisdom?.abbreviation).toBe('WIS');
      });

      it('should be case insensitive', () => {
        const dexterity = AbilityScoreUtils.getAbilityByName('DEXTERITY');
        expect(dexterity?.id).toBe(2);

        const constitution = AbilityScoreUtils.getAbilityByName('Constitution');
        expect(constitution?.id).toBe(3);
      });

      it('should return null for invalid name', () => {
        expect(AbilityScoreUtils.getAbilityByName('invalid')).toBe(null);
        expect(AbilityScoreUtils.getAbilityByName('')).toBe(null);
      });
    });

    describe('getAbilityIdByName()', () => {
      it('should return correct IDs (1-based)', () => {
        expect(AbilityScoreUtils.getAbilityIdByName('strength')).toBe(1);
        expect(AbilityScoreUtils.getAbilityIdByName('dexterity')).toBe(2);
        expect(AbilityScoreUtils.getAbilityIdByName('constitution')).toBe(3);
        expect(AbilityScoreUtils.getAbilityIdByName('intelligence')).toBe(4);
        expect(AbilityScoreUtils.getAbilityIdByName('wisdom')).toBe(5);
        expect(AbilityScoreUtils.getAbilityIdByName('charisma')).toBe(6);
      });

      it('should return 0 for invalid names', () => {
        expect(AbilityScoreUtils.getAbilityIdByName('invalid')).toBe(0);
        expect(AbilityScoreUtils.getAbilityIdByName('')).toBe(0);
      });

      it('should maintain legacy compatibility', () => {
        // Test that this matches the pattern used in legacy utilities.js
        // const abilityId = justAbilities.indexOf(abilityName) + 1;
        ABILITY_NAMES.forEach((name, index) => {
          const legacyId = justAbilities.indexOf(name) + 1;
          const modernId = AbilityScoreUtils.getAbilityIdByName(name);
          expect(modernId).toBe(legacyId);
          expect(modernId).toBe(index + 1);
        });
      });
    });

    describe('getAbilityNameById()', () => {
      it('should return correct names for valid IDs', () => {
        expect(AbilityScoreUtils.getAbilityNameById(1)).toBe('strength');
        expect(AbilityScoreUtils.getAbilityNameById(2)).toBe('dexterity');
        expect(AbilityScoreUtils.getAbilityNameById(3)).toBe('constitution');
        expect(AbilityScoreUtils.getAbilityNameById(4)).toBe('intelligence');
        expect(AbilityScoreUtils.getAbilityNameById(5)).toBe('wisdom');
        expect(AbilityScoreUtils.getAbilityNameById(6)).toBe('charisma');
      });

      it('should return null for invalid IDs', () => {
        expect(AbilityScoreUtils.getAbilityNameById(0)).toBe(null);
        expect(AbilityScoreUtils.getAbilityNameById(7)).toBe(null);
        expect(AbilityScoreUtils.getAbilityNameById(-1)).toBe(null);
      });
    });

    describe('getAbbreviation()', () => {
      it('should return correct abbreviations', () => {
        expect(AbilityScoreUtils.getAbbreviation('strength')).toBe('STR');
        expect(AbilityScoreUtils.getAbbreviation('dexterity')).toBe('DEX');
        expect(AbilityScoreUtils.getAbbreviation('constitution')).toBe('CON');
        expect(AbilityScoreUtils.getAbbreviation('intelligence')).toBe('INT');
        expect(AbilityScoreUtils.getAbbreviation('wisdom')).toBe('WIS');
        expect(AbilityScoreUtils.getAbbreviation('charisma')).toBe('CHA');
      });

      it('should be case insensitive', () => {
        expect(AbilityScoreUtils.getAbbreviation('STRENGTH')).toBe('STR');
        expect(AbilityScoreUtils.getAbbreviation('Dexterity')).toBe('DEX');
      });

      it('should return null for invalid names', () => {
        expect(AbilityScoreUtils.getAbbreviation('invalid')).toBe(null);
        expect(AbilityScoreUtils.getAbbreviation('')).toBe(null);
      });
    });

    describe('isValidScore()', () => {
      it('should validate scores within standard range', () => {
        expect(AbilityScoreUtils.isValidScore(1, false)).toBe(true);
        expect(AbilityScoreUtils.isValidScore(10, false)).toBe(true);
        expect(AbilityScoreUtils.isValidScore(20, false)).toBe(true);
        
        expect(AbilityScoreUtils.isValidScore(0, false)).toBe(false);
        expect(AbilityScoreUtils.isValidScore(21, false)).toBe(false);
        expect(AbilityScoreUtils.isValidScore(30, false)).toBe(false);
      });

      it('should validate scores with magic items allowed', () => {
        expect(AbilityScoreUtils.isValidScore(21, true)).toBe(true);
        expect(AbilityScoreUtils.isValidScore(30, true)).toBe(true);
        
        expect(AbilityScoreUtils.isValidScore(31, true)).toBe(false);
        expect(AbilityScoreUtils.isValidScore(0, true)).toBe(false);
      });

      it('should default to allowing magic items', () => {
        expect(AbilityScoreUtils.isValidScore(25)).toBe(true);
        expect(AbilityScoreUtils.isValidScore(30)).toBe(true);
        expect(AbilityScoreUtils.isValidScore(31)).toBe(false);
      });
    });

    describe('calculateAllModifiers()', () => {
      it('should calculate modifiers for score array', () => {
        const scores = [15, 14, 13, 12, 10, 8];
        const modifiers = AbilityScoreUtils.calculateAllModifiers(scores);
        
        expect(modifiers).toEqual([
          { score: 15, modifier: 2 },
          { score: 14, modifier: 2 },
          { score: 13, modifier: 1 },
          { score: 12, modifier: 1 },
          { score: 10, modifier: 0 },
          { score: 8, modifier: -1 }
        ]);
      });

      it('should handle empty array', () => {
        const modifiers = AbilityScoreUtils.calculateAllModifiers([]);
        expect(modifiers).toEqual([]);
      });
    });

    describe('calculateSaveBonus()', () => {
      it('should calculate save bonus without proficiency', () => {
        expect(AbilityScoreUtils.calculateSaveBonus(14, 3, false)).toBe(2); // +2 mod, no prof
        expect(AbilityScoreUtils.calculateSaveBonus(8, 3, false)).toBe(-1); // -1 mod, no prof
      });

      it('should calculate save bonus with proficiency', () => {
        expect(AbilityScoreUtils.calculateSaveBonus(14, 3, true)).toBe(5); // +2 mod, +3 prof
        expect(AbilityScoreUtils.calculateSaveBonus(8, 3, true)).toBe(2); // -1 mod, +3 prof
      });

      it('should work with various proficiency bonuses', () => {
        expect(AbilityScoreUtils.calculateSaveBonus(16, 2, true)).toBe(5); // +3 mod, +2 prof (level 1-4)
        expect(AbilityScoreUtils.calculateSaveBonus(16, 6, true)).toBe(9); // +3 mod, +6 prof (level 17-20)
      });
    });

    describe('calculateCarryingCapacity()', () => {
      it('should calculate standard carrying capacity', () => {
        const capacity = AbilityScoreUtils.calculateCarryingCapacity(15, false);
        
        expect(capacity).toEqual({
          normal: 75,        // Str × 5
          encumbered: 150,   // Str × 10  
          heavilyEncumbered: 225, // Str × 15
          maximum: 225,      // Str × 15
          liftPushDrag: 450  // Str × 30
        });
      });

      it('should calculate carrying capacity with Powerful Build', () => {
        const capacity = AbilityScoreUtils.calculateCarryingCapacity(15, true);
        
        expect(capacity).toEqual({
          normal: 150,       // (Str × 5) × 2
          encumbered: 300,   // (Str × 10) × 2
          heavilyEncumbered: 450, // (Str × 15) × 2
          maximum: 450,      // (Str × 15) × 2
          liftPushDrag: 900  // (Str × 30) × 2
        });
      });

      it('should handle edge cases', () => {
        const lowStr = AbilityScoreUtils.calculateCarryingCapacity(8, false);
        expect(lowStr.normal).toBe(40);
        expect(lowStr.maximum).toBe(120);

        const highStr = AbilityScoreUtils.calculateCarryingCapacity(20, false);
        expect(highStr.normal).toBe(100);
        expect(highStr.maximum).toBe(300);
      });
    });

    describe('convertLegacyAbilities()', () => {
      it('should convert legacy ability arrays', () => {
        const stats = [
          { id: 1, value: 15 },
          { id: 2, value: 14 },
          { id: 3, value: 13 },
          { id: 4, value: 12 },
          { id: 5, value: 10 },
          { id: 6, value: 8 }
        ];

        const bonusStats = [
          { id: 1, value: 2 },
          { id: 2, value: 0 },
          { id: 3, value: 1 },
          { id: 4, value: 0 },
          { id: 5, value: 0 },
          { id: 6, value: 0 }
        ];

        const result = AbilityScoreUtils.convertLegacyAbilities(stats, bonusStats);
        
        expect(result).toEqual({
          strength: 17,     // 15 + 2
          dexterity: 14,    // 14 + 0
          constitution: 14, // 13 + 1
          intelligence: 12, // 12 + 0
          wisdom: 10,       // 10 + 0
          charisma: 8       // 8 + 0
        });
      });

      it('should handle override stats', () => {
        const stats = [{ id: 1, value: 15 }];
        const bonusStats = [{ id: 1, value: 2 }];
        const overrideStats = [{ id: 1, value: 20 }];

        const result = AbilityScoreUtils.convertLegacyAbilities(stats, bonusStats, overrideStats);
        
        expect(result.strength).toBe(20); // Override takes precedence
      });

      it('should use defaults for missing data', () => {
        const result = AbilityScoreUtils.convertLegacyAbilities([]);
        
        ABILITY_NAMES.forEach(name => {
          expect(result[name]).toBe(DEFAULT_ABILITY_SCORE);
        });
      });

      it('should handle partial data', () => {
        const stats = [
          { id: 1, value: 16 },
          { id: 2, value: 14 }
          // Missing entries for other abilities
        ];

        const result = AbilityScoreUtils.convertLegacyAbilities(stats);
        
        expect(result.strength).toBe(16);
        expect(result.dexterity).toBe(14);
        expect(result.constitution).toBe(DEFAULT_ABILITY_SCORE);
        expect(result.intelligence).toBe(DEFAULT_ABILITY_SCORE);
        expect(result.wisdom).toBe(DEFAULT_ABILITY_SCORE);
        expect(result.charisma).toBe(DEFAULT_ABILITY_SCORE);
      });
    });
  });

  describe('Type Safety', () => {
    it('should enforce AbilityName type', () => {
      const validNames: AbilityName[] = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];
      expect(validNames).toHaveLength(6);
    });

    it('should create proper AbilityScores object', () => {
      const scores: AbilityScores = {
        strength: 15,
        dexterity: 14,
        constitution: 13,
        intelligence: 12,
        wisdom: 10,
        charisma: 8
      };

      expect(Object.keys(scores)).toHaveLength(6);
      expect(scores.strength).toBe(15);
      expect(scores.charisma).toBe(8);
    });
  });

  describe('Legacy Compatibility', () => {
    it('should maintain exact compatibility with legacy justAbilities usage', () => {
      // Test the exact pattern from utilities.js:
      // const abilityId = justAbilities.indexOf(abilityName) + 1;
      
      const testCases = [
        { name: 'strength', expectedId: 1 },
        { name: 'dexterity', expectedId: 2 },
        { name: 'constitution', expectedId: 3 },
        { name: 'intelligence', expectedId: 4 },
        { name: 'wisdom', expectedId: 5 },
        { name: 'charisma', expectedId: 6 }
      ];

      testCases.forEach(({ name, expectedId }) => {
        const legacyId = justAbilities.indexOf(name) + 1;
        const modernId = AbilityScoreUtils.getAbilityIdByName(name);
        
        expect(legacyId).toBe(expectedId);
        expect(modernId).toBe(expectedId);
        expect(legacyId).toBe(modernId);
      });
    });

    it('should work with legacy forEach pattern', () => {
      // Test the pattern from utilities.js:
      // justAbilities.forEach((ability, index) => { ... });
      
      const results: Array<{ ability: string; index: number; id: number }> = [];
      
      justAbilities.forEach((ability, index) => {
        const id = index + 1; // Legacy 1-based ID calculation
        results.push({ ability, index, id });
      });

      expect(results).toEqual([
        { ability: 'strength', index: 0, id: 1 },
        { ability: 'dexterity', index: 1, id: 2 },
        { ability: 'constitution', index: 2, id: 3 },
        { ability: 'intelligence', index: 3, id: 4 },
        { ability: 'wisdom', index: 4, id: 5 },
        { ability: 'charisma', index: 5, id: 6 }
      ]);
    });
  });

  describe('Integration with D&D Beyond patterns', () => {
    it('should work with D&D Beyond character stat arrays', () => {
      // Simulate D&D Beyond character.stats array
      const characterStats = [
        { id: 1, name: 'strength', value: 15 },
        { id: 2, name: 'dexterity', value: 14 },
        { id: 3, name: 'constitution', value: 13 },
        { id: 4, name: 'intelligence', value: 12 },
        { id: 5, name: 'wisdom', value: 10 },
        { id: 6, name: 'charisma', value: 8 }
      ];

      characterStats.forEach(stat => {
        const ability = AbilityScoreUtils.getAbilityById(stat.id);
        expect(ability).toBeTruthy();
        expect(ability?.name).toBe(stat.name);
        
        const modifier = AbilityScoreUtils.calculateModifier(stat.value);
        expect(typeof modifier).toBe('number');
      });
    });

    it('should handle ability score modifiers from character data', () => {
      // Pattern common in D&D Beyond processing
      const testModifiers = [
        { type: 'bonus', subType: 'strength-score', fixedValue: 2 },
        { type: 'bonus', subType: 'dexterity-score', fixedValue: 1 },
        { type: 'bonus', subType: 'constitution-score', fixedValue: 1 }
      ];

      testModifiers.forEach(modifier => {
        const abilityName = modifier.subType.replace('-score', '');
        const abilityId = AbilityScoreUtils.getAbilityIdByName(abilityName);
        
        expect(abilityId).toBeGreaterThan(0);
        expect(modifier.fixedValue).toBeGreaterThan(0);
      });
    });
  });
});