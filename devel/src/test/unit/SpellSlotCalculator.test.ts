/**
 * SpellSlotCalculator Unit Tests
 * 
 * Tests the modernized spell slot calculation logic extracted from legacy spellSlots.js
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { SpellSlotCalculator } from '@/domain/character/services/SpellSlotCalculator';
import { 
  CharacterClass, 
  FULL_CASTER_SPELL_SLOTS, 
  HALF_CASTER_SPELL_SLOTS,
  THIRD_CASTER_SPELL_SLOTS,
  PACT_MAGIC_PROGRESSION 
} from '@/domain/character/models/SpellSlots';

describe('SpellSlotCalculator', () => {
  let calculator: SpellSlotCalculator;

  beforeEach(() => {
    calculator = new SpellSlotCalculator();
  });

  describe('Single Class Spell Slots', () => {
    it('should calculate spell slots for a 5th level wizard', () => {
      const wizardClass: CharacterClass = {
        id: 1,
        level: 5,
        classDefinition: {
          id: 1,
          name: 'Wizard',
          canCastSpells: true,
          spellCastingAbilityId: 4 // Intelligence
        }
      };

      const result = calculator.calculateSpellSlots([wizardClass]);
      
      expect(result.spellSlots).toEqual({
        1: 4, 2: 3, 3: 2, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0
      });
      expect(result.multiclassCasterLevel).toBe(5);
      expect(result.totalCasterClasses).toBe(1);
      expect(result.debugInfo.calculationMethod).toBe('single_class');
    });

    it('should calculate spell slots for a 5th level paladin (half caster)', () => {
      const paladinClass: CharacterClass = {
        id: 1,
        level: 5,
        classDefinition: {
          id: 1,
          name: 'Paladin',
          canCastSpells: true,
          spellCastingAbilityId: 6 // Charisma
        }
      };

      const result = calculator.calculateSpellSlots([paladinClass]);
      
      expect(result.spellSlots).toEqual({
        1: 4, 2: 2, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0
      });
      expect(result.multiclassCasterLevel).toBe(2); // level / 2 = 2.5 -> 2
      expect(result.totalCasterClasses).toBe(1);
    });

    it('should calculate spell slots for a 3rd level eldritch knight fighter', () => {
      const fighterClass: CharacterClass = {
        id: 1,
        level: 3,
        classDefinition: {
          id: 1,
          name: 'Fighter',
          canCastSpells: true,
          spellCastingAbilityId: 4 // Intelligence
        },
        subclassDefinition: {
          id: 1,
          name: 'Eldritch Knight'
        }
      };

      const result = calculator.calculateSpellSlots([fighterClass]);
      
      expect(result.spellSlots).toEqual({
        1: 2, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0
      });
      expect(result.multiclassCasterLevel).toBe(1); // level / 3 = 1
    });

    it('should handle non-spellcasting fighter', () => {
      const fighterClass: CharacterClass = {
        id: 1,
        level: 5,
        classDefinition: {
          id: 1,
          name: 'Fighter',
          canCastSpells: false
        },
        subclassDefinition: {
          id: 1,
          name: 'Champion'
        }
      };

      const result = calculator.calculateSpellSlots([fighterClass]);
      
      expect(result.spellSlots).toEqual({
        1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0
      });
      expect(result.multiclassCasterLevel).toBe(0);
      expect(result.totalCasterClasses).toBe(0);
    });

    it('should calculate pact magic for a 5th level warlock', () => {
      const warlockClass: CharacterClass = {
        id: 1,
        level: 5,
        classDefinition: {
          id: 1,
          name: 'Warlock',
          canCastSpells: true,
          spellCastingAbilityId: 6 // Charisma
        }
      };

      const result = calculator.calculateSpellSlots([warlockClass]);
      
      // Warlock should have empty regular slots but pact magic slots
      expect(result.spellSlots).toEqual({
        1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0
      });
      expect(result.pactMagicSlots).toEqual({
        1: 0, 2: 0, 3: 2, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0
      });
      expect(result.multiclassCasterLevel).toBe(0); // Pact magic doesn't contribute
      expect(result.debugInfo.calculationMethod).toBe('pact_magic_only');
    });
  });

  describe('Multiclass Spell Slots', () => {
    it('should calculate multiclass spell slots for wizard 3 + cleric 2', () => {
      const classes: CharacterClass[] = [
        {
          id: 1,
          level: 3,
          classDefinition: {
            id: 1,
            name: 'Wizard',
            canCastSpells: true,
            spellCastingAbilityId: 4
          }
        },
        {
          id: 2,
          level: 2,
          classDefinition: {
            id: 2,
            name: 'Cleric',
            canCastSpells: true,
            spellCastingAbilityId: 5
          }
        }
      ];

      const result = calculator.calculateSpellSlots(classes);
      
      // Total caster level = 3 + 2 = 5, so use 5th level full caster table
      expect(result.spellSlots).toEqual({
        1: 4, 2: 3, 3: 2, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0
      });
      expect(result.multiclassCasterLevel).toBe(5);
      expect(result.totalCasterClasses).toBe(2);
      expect(result.debugInfo.calculationMethod).toBe('multiclass');
    });

    it('should calculate multiclass spell slots for paladin 4 + ranger 4', () => {
      const classes: CharacterClass[] = [
        {
          id: 1,
          level: 4,
          classDefinition: {
            id: 1,
            name: 'Paladin',
            canCastSpells: true,
            spellCastingAbilityId: 6
          }
        },
        {
          id: 2,
          level: 4,
          classDefinition: {
            id: 2,
            name: 'Ranger',
            canCastSpells: true,
            spellCastingAbilityId: 5
          }
        }
      ];

      const result = calculator.calculateSpellSlots(classes);
      
      // Total caster level = floor(4/2) + floor(4/2) = 2 + 2 = 4
      expect(result.spellSlots).toEqual({
        1: 4, 2: 3, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0
      });
      expect(result.multiclassCasterLevel).toBe(4);
      expect(result.totalCasterClasses).toBe(2);
    });

    it('should handle warlock multiclass with other casters', () => {
      const classes: CharacterClass[] = [
        {
          id: 1,
          level: 3,
          classDefinition: {
            id: 1,
            name: 'Warlock',
            canCastSpells: true,
            spellCastingAbilityId: 6
          }
        },
        {
          id: 2,
          level: 2,
          classDefinition: {
            id: 2,
            name: 'Sorcerer',
            canCastSpells: true,
            spellCastingAbilityId: 6
          }
        }
      ];

      const result = calculator.calculateSpellSlots(classes);
      
      // Regular slots from sorcerer 2 (warlock doesn't contribute to multiclass)
      expect(result.spellSlots).toEqual({
        1: 3, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0
      });
      // Pact magic from warlock 3
      expect(result.pactMagicSlots).toEqual({
        1: 0, 2: 2, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0
      });
      expect(result.multiclassCasterLevel).toBe(2); // Only sorcerer contributes
      expect(result.debugInfo.calculationMethod).toBe('multiclass');
    });
  });

  describe('XML Generation', () => {
    it('should generate proper spell slot XML', () => {
      const wizardClass: CharacterClass = {
        id: 1,
        level: 3,
        classDefinition: {
          id: 1,
          name: 'Wizard',
          canCastSpells: true,
          spellCastingAbilityId: 4
        }
      };

      const result = calculator.calculateSpellSlots([wizardClass]);
      const xmlResult = calculator.generateSpellSlotsXML(result);

      expect(xmlResult.spellSlotsXML).toContain('<spellslots1>');
      expect(xmlResult.spellSlotsXML).toContain('<max type="number">4</max>');
      expect(xmlResult.spellSlotsXML).toContain('<spellslots2>');
      expect(xmlResult.spellSlotsXML).toContain('<max type="number">2</max>');
      expect(xmlResult.combinedXML).toContain('<powermeta>');
      expect(xmlResult.combinedXML).toContain('</powermeta>');
    });

    it('should generate proper pact magic XML', () => {
      const warlockClass: CharacterClass = {
        id: 1,
        level: 3,
        classDefinition: {
          id: 1,
          name: 'Warlock',
          canCastSpells: true,
          spellCastingAbilityId: 6
        }
      };

      const result = calculator.calculateSpellSlots([warlockClass]);
      const xmlResult = calculator.generateSpellSlotsXML(result);

      expect(xmlResult.pactMagicXML).toContain('<pactmagicslots2>');
      expect(xmlResult.pactMagicXML).toContain('<max type="number">2</max>');
      expect(xmlResult.combinedXML).toContain('<powermeta>');
    });
  });

  describe('Data Validation', () => {
    it('should validate valid character class data', () => {
      const classes: CharacterClass[] = [
        {
          id: 1,
          level: 5,
          classDefinition: {
            id: 1,
            name: 'Wizard',
            canCastSpells: true
          }
        }
      ];

      const validation = SpellSlotCalculator.validateClassData(classes);
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should detect invalid level data', () => {
      const classes: CharacterClass[] = [
        {
          id: 1,
          level: 25, // Invalid level
          classDefinition: {
            id: 1,
            name: 'Wizard',
            canCastSpells: true
          }
        }
      ];

      const validation = SpellSlotCalculator.validateClassData(classes);
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Class Wizard has invalid level: 25');
    });

    it('should detect missing class name', () => {
      const classes: CharacterClass[] = [
        {
          id: 1,
          level: 5,
          classDefinition: {
            id: 1,
            name: '', // Missing name
            canCastSpells: true
          }
        }
      ];

      const validation = SpellSlotCalculator.validateClassData(classes);
      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Debug Mode', () => {
    it('should enable and disable debug mode', () => {
      // Test that setDebugMode doesn't throw an error
      expect(() => SpellSlotCalculator.setDebugMode(true)).not.toThrow();
      expect(() => SpellSlotCalculator.setDebugMode(false)).not.toThrow();
    });
  });

  describe('Legacy Compatibility Methods', () => {
    it('should convert spell slots to legacy format', () => {
      const spellSlots = { 1: 4, 2: 3, 3: 2, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 };
      const legacy = SpellSlotCalculator.toLegacyFormat(spellSlots);
      
      expect(legacy).toEqual([
        { level: 1, slots: 4 },
        { level: 2, slots: 3 },
        { level: 3, slots: 2 },
        { level: 4, slots: 0 },
        { level: 5, slots: 0 },
        { level: 6, slots: 0 },
        { level: 7, slots: 0 },
        { level: 8, slots: 0 },
        { level: 9, slots: 0 }
      ]);
    });

    it('should support filtering on legacy format (for existing code compatibility)', () => {
      const spellSlots = { 1: 4, 2: 3, 3: 2, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 };
      const legacy = SpellSlotCalculator.toLegacyFormat(spellSlots);
      
      // Test that filter method works (this is what the existing code expects)
      const nonZeroSlots = legacy.filter(slot => slot.slots > 0);
      
      expect(nonZeroSlots).toEqual([
        { level: 1, slots: 4 },
        { level: 2, slots: 3 },
        { level: 3, slots: 2 }
      ]);
    });

    it('should validate class info', () => {
      const validClass = {
        classDefinition: { name: 'Wizard' },
        level: 5
      };
      
      const validation = SpellSlotCalculator.validateClassInfo(validClass);
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should detect invalid class info', () => {
      const invalidClass = {
        classDefinition: { name: '' },
        level: 25
      };
      
      const validation = SpellSlotCalculator.validateClassInfo(invalidClass);
      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
      expect(validation.errors).toContain('Class definition name is required');
      expect(validation.errors).toContain('Class level must be between 1 and 20');
    });

    it('should return correct validation structure', () => {
      const validClass = {
        classDefinition: { name: 'Wizard' },
        level: 5
      };
      
      const validation = SpellSlotCalculator.validateClassInfo(validClass);
      expect(validation).toHaveProperty('isValid');
      expect(validation).toHaveProperty('errors');
      expect(Array.isArray(validation.errors)).toBe(true);
    });
  });

  describe('Static Helper Methods', () => {
    it('should get spell slots for specific class/level', () => {
      const spellSlots = SpellSlotCalculator.getSpellSlotsForClass('Wizard', 5);
      
      expect(spellSlots).toEqual({
        1: 4, 2: 3, 3: 2, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0
      });
    });

    it('should handle spellless ranger', () => {
      const spellSlots = SpellSlotCalculator.getSpellSlotsForClass('Ranger', 5, 'Spellless');
      
      expect(spellSlots).toEqual({
        1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0
      });
    });
  });
});