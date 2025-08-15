import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  SpellSlotCalculator, 
  type ClassInfo, 
  type SpellSlots,
  type SpellcasterType 
} from '@/domain/character/services/SpellSlotCalculator';

describe('SpellSlotCalculator', () => {
  describe('getClassCasterInfo()', () => {
    it('should identify full caster classes correctly', () => {
      const fullCasters = ['bard', 'cleric', 'druid', 'sorcerer', 'wizard'] as const;
      
      fullCasters.forEach(className => {
        const result = SpellSlotCalculator.getClassCasterInfo(className, 5);
        expect(result.type).toBe('full');
        expect(result.contribution).toBe(5);
      });
    });

    it('should identify half caster classes correctly', () => {
      expect(SpellSlotCalculator.getClassCasterInfo('paladin', 6)).toEqual({
        type: 'half',
        contribution: 3
      });

      expect(SpellSlotCalculator.getClassCasterInfo('ranger', 8)).toEqual({
        type: 'half',
        contribution: 4
      });

      expect(SpellSlotCalculator.getClassCasterInfo('artificer', 10)).toEqual({
        type: 'half',
        contribution: 5
      });
    });

    it('should handle spellless ranger correctly', () => {
      expect(SpellSlotCalculator.getClassCasterInfo('ranger', 5, 'spellless')).toEqual({
        type: 'none',
        contribution: 0
      });
    });

    it('should identify third caster subclasses correctly', () => {
      expect(SpellSlotCalculator.getClassCasterInfo('fighter', 9, 'eldritch_knight')).toEqual({
        type: 'third',
        contribution: 3
      });

      expect(SpellSlotCalculator.getClassCasterInfo('rogue', 12, 'arcane_trickster')).toEqual({
        type: 'third',
        contribution: 4
      });
    });

    it('should handle non-caster classes and subclasses', () => {
      expect(SpellSlotCalculator.getClassCasterInfo('fighter', 5)).toEqual({
        type: 'none',
        contribution: 0
      });

      expect(SpellSlotCalculator.getClassCasterInfo('rogue', 5)).toEqual({
        type: 'none',
        contribution: 0
      });

      expect(SpellSlotCalculator.getClassCasterInfo('fighter', 5, 'champion')).toEqual({
        type: 'none',
        contribution: 0
      });
    });

    it('should handle warlock pact magic', () => {
      expect(SpellSlotCalculator.getClassCasterInfo('warlock', 5)).toEqual({
        type: 'pact',
        contribution: 0
      });
    });
  });

  describe('calculateCasterLevels()', () => {
    it('should calculate single class caster levels', () => {
      const classes: ClassInfo[] = [
        { name: 'wizard', level: 5, casterType: 'full' }
      ];

      const result = SpellSlotCalculator.calculateCasterLevels(classes);

      expect(result).toEqual({
        fullCasterLevels: 5,
        halfCasterLevels: 0,
        thirdCasterLevels: 0,
        totalCasterLevel: 5,
        casterClassCount: 1,
        isMulticlass: false
      });
    });

    it('should calculate multiclass caster levels', () => {
      const classes: ClassInfo[] = [
        { name: 'wizard', level: 3, casterType: 'full' },
        { name: 'cleric', level: 2, casterType: 'full' },
        { name: 'paladin', level: 4, casterType: 'half' }
      ];

      const result = SpellSlotCalculator.calculateCasterLevels(classes);

      expect(result).toEqual({
        fullCasterLevels: 5, // 3 + 2
        halfCasterLevels: 2, // floor(4/2)
        thirdCasterLevels: 0,
        totalCasterLevel: 7, // 5 + 2 + 0
        casterClassCount: 3,
        isMulticlass: true
      });
    });

    it('should handle mixed caster types correctly', () => {
      const classes: ClassInfo[] = [
        { name: 'sorcerer', level: 5, casterType: 'full' },
        { name: 'fighter', level: 6, subclass: 'eldritch_knight', casterType: 'third' },
        { name: 'ranger', level: 4, casterType: 'half' }
      ];

      const result = SpellSlotCalculator.calculateCasterLevels(classes);

      expect(result).toEqual({
        fullCasterLevels: 5,
        halfCasterLevels: 2, // floor(4/2)
        thirdCasterLevels: 2, // floor(6/3)
        totalCasterLevel: 9, // 5 + 2 + 2
        casterClassCount: 3,
        isMulticlass: true
      });
    });

    it('should ignore non-caster classes', () => {
      const classes: ClassInfo[] = [
        { name: 'wizard', level: 5, casterType: 'full' },
        { name: 'fighter', level: 3, casterType: 'none' }, // No subclass = non-caster
        { name: 'ranger', level: 2, subclass: 'spellless', casterType: 'none' }
      ];

      const result = SpellSlotCalculator.calculateCasterLevels(classes);

      expect(result).toEqual({
        fullCasterLevels: 5,
        halfCasterLevels: 0,
        thirdCasterLevels: 0,
        totalCasterLevel: 5,
        casterClassCount: 1,
        isMulticlass: false
      });
    });

    it('should ignore warlock pact magic in multiclass calculations', () => {
      const classes: ClassInfo[] = [
        { name: 'wizard', level: 3, casterType: 'full' },
        { name: 'warlock', level: 5, casterType: 'pact' }
      ];

      const result = SpellSlotCalculator.calculateCasterLevels(classes);

      expect(result).toEqual({
        fullCasterLevels: 3,
        halfCasterLevels: 0,
        thirdCasterLevels: 0,
        totalCasterLevel: 3,
        casterClassCount: 1,
        isMulticlass: false
      });
    });
  });

  describe('getSingleClassSpellSlots()', () => {
    it('should return correct spell slots for full casters', () => {
      const level5Wizard = SpellSlotCalculator.getSingleClassSpellSlots('wizard', 5);
      expect(level5Wizard).toEqual({
        level1: 4, level2: 3, level3: 2, level4: 0, level5: 0,
        level6: 0, level7: 0, level8: 0, level9: 0
      });

      const level1Sorcerer = SpellSlotCalculator.getSingleClassSpellSlots('sorcerer', 1);
      expect(level1Sorcerer).toEqual({
        level1: 2, level2: 0, level3: 0, level4: 0, level5: 0,
        level6: 0, level7: 0, level8: 0, level9: 0
      });

      const level20Cleric = SpellSlotCalculator.getSingleClassSpellSlots('cleric', 20);
      expect(level20Cleric).toEqual({
        level1: 4, level2: 3, level3: 3, level4: 3, level5: 3,
        level6: 2, level7: 2, level8: 1, level9: 1
      });
    });

    it('should return correct spell slots for half casters', () => {
      const level2Paladin = SpellSlotCalculator.getSingleClassSpellSlots('paladin', 2);
      expect(level2Paladin).toEqual({
        level1: 2, level2: 0, level3: 0, level4: 0, level5: 0,
        level6: 0, level7: 0, level8: 0, level9: 0
      });

      const level1Paladin = SpellSlotCalculator.getSingleClassSpellSlots('paladin', 1);
      expect(level1Paladin).toEqual({
        level1: 0, level2: 0, level3: 0, level4: 0, level5: 0,
        level6: 0, level7: 0, level8: 0, level9: 0
      });

      const level20Ranger = SpellSlotCalculator.getSingleClassSpellSlots('ranger', 20);
      expect(level20Ranger).toEqual({
        level1: 4, level2: 3, level3: 3, level4: 3, level5: 2,
        level6: 0, level7: 0, level8: 0, level9: 0
      });
    });

    it('should return correct spell slots for artificer', () => {
      const level1Artificer = SpellSlotCalculator.getSingleClassSpellSlots('artificer', 1);
      expect(level1Artificer).toEqual({
        level1: 2, level2: 0, level3: 0, level4: 0, level5: 0,
        level6: 0, level7: 0, level8: 0, level9: 0
      });

      const level20Artificer = SpellSlotCalculator.getSingleClassSpellSlots('artificer', 20);
      expect(level20Artificer).toEqual({
        level1: 4, level2: 3, level3: 3, level4: 3, level5: 2,
        level6: 0, level7: 0, level8: 0, level9: 0
      });
    });

    it('should return correct spell slots for third casters', () => {
      const level3EK = SpellSlotCalculator.getSingleClassSpellSlots('fighter', 3, 'eldritch_knight');
      expect(level3EK).toEqual({
        level1: 2, level2: 0, level3: 0, level4: 0, level5: 0,
        level6: 0, level7: 0, level8: 0, level9: 0
      });

      const level2EK = SpellSlotCalculator.getSingleClassSpellSlots('fighter', 2, 'eldritch_knight');
      expect(level2EK).toEqual({
        level1: 0, level2: 0, level3: 0, level4: 0, level5: 0,
        level6: 0, level7: 0, level8: 0, level9: 0
      });

      const level20AT = SpellSlotCalculator.getSingleClassSpellSlots('rogue', 20, 'arcane_trickster');
      expect(level20AT).toEqual({
        level1: 4, level2: 3, level3: 3, level4: 1, level5: 0,
        level6: 0, level7: 0, level8: 0, level9: 0
      });
    });

    it('should handle spellless ranger', () => {
      const result = SpellSlotCalculator.getSingleClassSpellSlots('ranger', 5, 'spellless');
      expect(result).toEqual({
        level1: 0, level2: 0, level3: 0, level4: 0, level5: 0,
        level6: 0, level7: 0, level8: 0, level9: 0
      });
    });

    it('should handle non-caster classes', () => {
      const championFighter = SpellSlotCalculator.getSingleClassSpellSlots('fighter', 5);
      expect(championFighter).toEqual({
        level1: 0, level2: 0, level3: 0, level4: 0, level5: 0,
        level6: 0, level7: 0, level8: 0, level9: 0
      });
    });

    it('should handle warlock pact magic', () => {
      const warlock = SpellSlotCalculator.getSingleClassSpellSlots('warlock', 5);
      expect(warlock).toEqual({
        level1: 0, level2: 0, level3: 0, level4: 0, level5: 0,
        level6: 0, level7: 0, level8: 0, level9: 0
      });
    });
  });

  describe('getMulticlassSpellSlots()', () => {
    it('should return correct multiclass spell slots', () => {
      const level1 = SpellSlotCalculator.getMulticlassSpellSlots(1);
      expect(level1).toEqual({
        level1: 2, level2: 0, level3: 0, level4: 0, level5: 0,
        level6: 0, level7: 0, level8: 0, level9: 0
      });

      const level5 = SpellSlotCalculator.getMulticlassSpellSlots(5);
      expect(level5).toEqual({
        level1: 4, level2: 3, level3: 2, level4: 0, level5: 0,
        level6: 0, level7: 0, level8: 0, level9: 0
      });

      const level20 = SpellSlotCalculator.getMulticlassSpellSlots(20);
      expect(level20).toEqual({
        level1: 4, level2: 3, level3: 3, level4: 3, level5: 3,
        level6: 2, level7: 2, level8: 1, level9: 1
      });
    });

    it('should cap at level 20', () => {
      const overLevel = SpellSlotCalculator.getMulticlassSpellSlots(25);
      const level20 = SpellSlotCalculator.getMulticlassSpellSlots(20);
      expect(overLevel).toEqual(level20);
    });
  });

  describe('calculateSpellSlots() - Main Function', () => {
    beforeEach(() => {
      SpellSlotCalculator.setDebugMode(false);
    });

    it('should calculate single class full caster correctly', () => {
      const classes: ClassInfo[] = [
        { name: 'wizard', level: 5, casterType: 'full' }
      ];

      const result = SpellSlotCalculator.calculateSpellSlots(classes);

      expect(result.spellSlots).toEqual({
        level1: 4, level2: 3, level3: 2, level4: 0, level5: 0,
        level6: 0, level7: 0, level8: 0, level9: 0
      });

      expect(result.casterBreakdown.isMulticlass).toBe(false);
      expect(result.casterBreakdown.totalCasterLevel).toBe(5);
      expect(result.debugInfo.calculationMethod).toBe('single-class');
    });

    it('should calculate single class half caster correctly', () => {
      const classes: ClassInfo[] = [
        { name: 'paladin', level: 6, casterType: 'half' }
      ];

      const result = SpellSlotCalculator.calculateSpellSlots(classes);

      expect(result.spellSlots).toEqual({
        level1: 4, level2: 2, level3: 0, level4: 0, level5: 0,
        level6: 0, level7: 0, level8: 0, level9: 0
      });

      expect(result.casterBreakdown.isMulticlass).toBe(false);
      expect(result.casterBreakdown.totalCasterLevel).toBe(3);
      expect(result.debugInfo.calculationMethod).toBe('single-class');
    });

    it('should calculate single class third caster correctly', () => {
      const classes: ClassInfo[] = [
        { name: 'fighter', level: 7, subclass: 'eldritch_knight', casterType: 'third' }
      ];

      const result = SpellSlotCalculator.calculateSpellSlots(classes);

      expect(result.spellSlots).toEqual({
        level1: 4, level2: 2, level3: 0, level4: 0, level5: 0,
        level6: 0, level7: 0, level8: 0, level9: 0
      });

      expect(result.casterBreakdown.isMulticlass).toBe(false);
      expect(result.casterBreakdown.totalCasterLevel).toBe(2);
      expect(result.debugInfo.calculationMethod).toBe('single-class');
    });

    it('should calculate multiclass spell slots correctly', () => {
      const classes: ClassInfo[] = [
        { name: 'wizard', level: 3, casterType: 'full' },
        { name: 'cleric', level: 2, casterType: 'full' },
        { name: 'paladin', level: 4, casterType: 'half' }
      ];

      const result = SpellSlotCalculator.calculateSpellSlots(classes);

      // Total caster level = 3 + 2 + floor(4/2) = 7
      expect(result.spellSlots).toEqual({
        level1: 4, level2: 3, level3: 3, level4: 1, level5: 0,
        level6: 0, level7: 0, level8: 0, level9: 0
      });

      expect(result.casterBreakdown.isMulticlass).toBe(true);
      expect(result.casterBreakdown.totalCasterLevel).toBe(7);
      expect(result.debugInfo.calculationMethod).toBe('multiclass');
    });

    it('should handle mixed casters with non-casters', () => {
      const classes: ClassInfo[] = [
        { name: 'sorcerer', level: 4, casterType: 'full' },
        { name: 'fighter', level: 6, casterType: 'none' }, // Champion fighter
        { name: 'rogue', level: 3, subclass: 'arcane_trickster', casterType: 'third' }
      ];

      const result = SpellSlotCalculator.calculateSpellSlots(classes);

      // Total caster level = 4 + 0 + floor(3/3) = 5
      expect(result.spellSlots).toEqual({
        level1: 4, level2: 3, level3: 2, level4: 0, level5: 0,
        level6: 0, level7: 0, level8: 0, level9: 0
      });

      expect(result.casterBreakdown.isMulticlass).toBe(true);
      expect(result.casterBreakdown.totalCasterLevel).toBe(5);
      expect(result.casterBreakdown.casterClassCount).toBe(2);
    });

    it('should handle all non-caster classes', () => {
      const classes: ClassInfo[] = [
        { name: 'fighter', level: 5, casterType: 'none' },
        { name: 'rogue', level: 3, casterType: 'none' }
      ];

      const result = SpellSlotCalculator.calculateSpellSlots(classes);

      expect(result.spellSlots).toEqual({
        level1: 0, level2: 0, level3: 0, level4: 0, level5: 0,
        level6: 0, level7: 0, level8: 0, level9: 0
      });

      expect(result.casterBreakdown.isMulticlass).toBe(false);
      expect(result.casterBreakdown.totalCasterLevel).toBe(0);
      expect(result.casterBreakdown.casterClassCount).toBe(0);
    });

    it('should ignore warlock in multiclass calculations', () => {
      const classes: ClassInfo[] = [
        { name: 'wizard', level: 3, casterType: 'full' },
        { name: 'warlock', level: 5, casterType: 'pact' }
      ];

      const result = SpellSlotCalculator.calculateSpellSlots(classes);

      // Only wizard contributes to spell slots
      expect(result.spellSlots).toEqual({
        level1: 4, level2: 2, level3: 0, level4: 0, level5: 0,
        level6: 0, level7: 0, level8: 0, level9: 0
      });

      expect(result.casterBreakdown.isMulticlass).toBe(false);
      expect(result.casterBreakdown.totalCasterLevel).toBe(3);
      expect(result.casterBreakdown.casterClassCount).toBe(1);
    });

    it('should provide detailed debug information', () => {
      const classes: ClassInfo[] = [
        { name: 'wizard', level: 5, casterType: 'full' },
        { name: 'paladin', level: 4, casterType: 'half' },
        { name: 'fighter', level: 3, casterType: 'none' }
      ];

      const result = SpellSlotCalculator.calculateSpellSlots(classes);

      expect(result.debugInfo.classContributions).toHaveLength(3);
      expect(result.debugInfo.classContributions[0]).toEqual({
        className: 'wizard',
        level: 5,
        casterType: 'full',
        contribution: 5
      });
      expect(result.debugInfo.classContributions[1]).toEqual({
        className: 'paladin',
        level: 4,
        casterType: 'half',
        contribution: 2
      });
      expect(result.debugInfo.classContributions[2]).toEqual({
        className: 'fighter',
        level: 3,
        casterType: 'none',
        contribution: 0
      });
    });
  });

  describe('toLegacyFormat()', () => {
    it('should convert spell slots to legacy format', () => {
      const spellSlots: SpellSlots = {
        level1: 4, level2: 3, level3: 2, level4: 1, level5: 0,
        level6: 0, level7: 0, level8: 0, level9: 0
      };

      const legacy = SpellSlotCalculator.toLegacyFormat(spellSlots);

      expect(legacy).toEqual([
        { level: 1, slots: 4 },
        { level: 2, slots: 3 },
        { level: 3, slots: 2 },
        { level: 4, slots: 1 },
        { level: 5, slots: 0 },
        { level: 6, slots: 0 },
        { level: 7, slots: 0 },
        { level: 8, slots: 0 },
        { level: 9, slots: 0 }
      ]);
    });
  });

  describe('validateClassInfo()', () => {
    it('should validate proper class information', () => {
      const classes: ClassInfo[] = [
        { name: 'wizard', level: 5, casterType: 'full' },
        { name: 'fighter', level: 3, subclass: 'eldritch_knight', casterType: 'third' }
      ];

      const result = SpellSlotCalculator.validateClassInfo(classes);

      expect(result.isValid).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    it('should return invalid for null or non-array input', () => {
      const result1 = SpellSlotCalculator.validateClassInfo(null as any);
      const result2 = SpellSlotCalculator.validateClassInfo('not an array' as any);

      expect(result1.isValid).toBe(false);
      expect(result1.issues).toContain('Classes data is null or not an array');

      expect(result2.isValid).toBe(false);
      expect(result2.issues).toContain('Classes data is null or not an array');
    });

    it('should warn about missing class names', () => {
      const classes = [
        { level: 5, casterType: 'full' as SpellcasterType }
      ] as ClassInfo[];

      const result = SpellSlotCalculator.validateClassInfo(classes);

      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('Class 1 is missing name');
    });

    it('should warn about invalid levels', () => {
      const classes: ClassInfo[] = [
        { name: 'wizard', level: 0, casterType: 'full' },
        { name: 'cleric', level: 25, casterType: 'full' },
        { name: 'paladin', level: -1, casterType: 'half' }
      ];

      const result = SpellSlotCalculator.validateClassInfo(classes);

      expect(result.warnings).toContain('Class 1 (wizard) has invalid level: 0');
      expect(result.warnings).toContain('Class 2 (cleric) has invalid level: 25');
      expect(result.warnings).toContain('Class 3 (paladin) has invalid level: -1');
    });

    it('should warn about missing subclasses for relevant classes', () => {
      const classes: ClassInfo[] = [
        { name: 'fighter', level: 5, casterType: 'none' },
        { name: 'rogue', level: 3, casterType: 'none' },
        { name: 'ranger', level: 4, casterType: 'half' }
      ];

      const result = SpellSlotCalculator.validateClassInfo(classes);

      expect(result.warnings).toContain('Fighter class is missing subclass - assuming non-spellcaster');
      expect(result.warnings).toContain('Rogue class is missing subclass - assuming non-spellcaster');
      expect(result.warnings).toContain('Ranger class is missing subclass - assuming standard ranger');
    });
  });

  describe('Debug Functionality', () => {
    it('should enable and disable debug mode', () => {
      const classes: ClassInfo[] = [
        { name: 'wizard', level: 5, casterType: 'full' }
      ];

      // Test debug mode toggle
      SpellSlotCalculator.setDebugMode(true);
      
      const consoleSpy = vi.spyOn(console, 'group');
      SpellSlotCalculator.calculateSpellSlots(classes);
      expect(consoleSpy).toHaveBeenCalledWith('🪄 Spell Slot Calculation');
      
      // Disable debug mode
      SpellSlotCalculator.setDebugMode(false);
      consoleSpy.mockClear();
      
      // Should not run debug output when disabled
      SpellSlotCalculator.calculateSpellSlots(classes);
      expect(consoleSpy).not.toHaveBeenCalledWith('🪄 Spell Slot Calculation');
      
      consoleSpy.mockRestore();
    });
  });

  describe('Real D&D Character Scenarios', () => {
    it('should handle typical single-class wizard', () => {
      const classes: ClassInfo[] = [
        { name: 'wizard', level: 9, casterType: 'full' }
      ];

      const result = SpellSlotCalculator.calculateSpellSlots(classes);

      expect(result.spellSlots).toEqual({
        level1: 4, level2: 3, level3: 3, level4: 3, level5: 1,
        level6: 0, level7: 0, level8: 0, level9: 0
      });
    });

    it('should handle typical paladin/sorcerer multiclass', () => {
      const classes: ClassInfo[] = [
        { name: 'paladin', level: 6, casterType: 'half' },
        { name: 'sorcerer', level: 4, casterType: 'full' }
      ];

      const result = SpellSlotCalculator.calculateSpellSlots(classes);

      // Total caster level = floor(6/2) + 4 = 3 + 4 = 7
      expect(result.spellSlots).toEqual({
        level1: 4, level2: 3, level3: 3, level4: 1, level5: 0,
        level6: 0, level7: 0, level8: 0, level9: 0
      });

      expect(result.casterBreakdown.isMulticlass).toBe(true);
      expect(result.casterBreakdown.totalCasterLevel).toBe(7);
    });

    it('should handle fighter/wizard multiclass', () => {
      const classes: ClassInfo[] = [
        { name: 'fighter', level: 11, subclass: 'eldritch_knight', casterType: 'third' },
        { name: 'wizard', level: 9, casterType: 'full' }
      ];

      const result = SpellSlotCalculator.calculateSpellSlots(classes);

      // Total caster level = floor(11/3) + 9 = 3 + 9 = 12
      expect(result.spellSlots).toEqual({
        level1: 4, level2: 3, level3: 3, level4: 3, level5: 2,
        level6: 1, level7: 0, level8: 0, level9: 0
      });

      expect(result.casterBreakdown.totalCasterLevel).toBe(12);
    });

    it('should handle complex four-class multiclass', () => {
      const classes: ClassInfo[] = [
        { name: 'bard', level: 5, casterType: 'full' },
        { name: 'cleric', level: 3, casterType: 'full' },
        { name: 'paladin', level: 6, casterType: 'half' },
        { name: 'rogue', level: 6, subclass: 'arcane_trickster', casterType: 'third' }
      ];

      const result = SpellSlotCalculator.calculateSpellSlots(classes);

      // Total caster level = 5 + 3 + floor(6/2) + floor(6/3) = 5 + 3 + 3 + 2 = 13
      expect(result.spellSlots).toEqual({
        level1: 4, level2: 3, level3: 3, level4: 3, level5: 2,
        level6: 1, level7: 1, level8: 0, level9: 0
      });

      expect(result.casterBreakdown.isMulticlass).toBe(true);
      expect(result.casterBreakdown.totalCasterLevel).toBe(13);
      expect(result.casterBreakdown.casterClassCount).toBe(4);
    });

    it('should handle artificer correctly', () => {
      const classes: ClassInfo[] = [
        { name: 'artificer', level: 11, casterType: 'half' }
      ];

      const result = SpellSlotCalculator.calculateSpellSlots(classes);

      // Artificer uses its own table, not the half-caster table
      expect(result.spellSlots).toEqual({
        level1: 4, level2: 3, level3: 3, level4: 0, level5: 0,
        level6: 0, level7: 0, level8: 0, level9: 0
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty class array', () => {
      const result = SpellSlotCalculator.calculateSpellSlots([]);

      expect(result.spellSlots).toEqual({
        level1: 0, level2: 0, level3: 0, level4: 0, level5: 0,
        level6: 0, level7: 0, level8: 0, level9: 0
      });

      expect(result.casterBreakdown.totalCasterLevel).toBe(0);
      expect(result.casterBreakdown.casterClassCount).toBe(0);
    });

    it('should handle level 0 characters', () => {
      const classes: ClassInfo[] = [
        { name: 'wizard', level: 0, casterType: 'full' }
      ];

      const result = SpellSlotCalculator.calculateSpellSlots(classes);

      expect(result.spellSlots).toEqual({
        level1: 0, level2: 0, level3: 0, level4: 0, level5: 0,
        level6: 0, level7: 0, level8: 0, level9: 0
      });
    });

    it('should cap levels at 20', () => {
      const classes: ClassInfo[] = [
        { name: 'wizard', level: 25, casterType: 'full' }
      ];

      const result = SpellSlotCalculator.calculateSpellSlots(classes);

      // Should use level 20 spell slots, not higher
      const level20Slots = SpellSlotCalculator.getSingleClassSpellSlots('wizard', 20);
      expect(result.spellSlots).toEqual(level20Slots);
    });
  });
});