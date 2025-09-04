/**
 * SpellValidator Unit Tests
 * 
 * Tests spell validation logic for D&D 5e rules compliance
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { SpellValidator } from '@/domain/character/services/SpellValidator';
import type { NormalizedSpell, SpellLevel, MagicSchool, SpellSource } from '@/domain/character/models/Spells';

describe('SpellValidator', () => {
  let validator: SpellValidator;

  beforeEach(() => {
    validator = new SpellValidator();
  });

  const createValidSpell = (overrides: Partial<NormalizedSpell> = {}): NormalizedSpell => ({
    id: '1',
    name: 'Magic Missile',
    level: 1 as SpellLevel,
    school: 'evocation' as MagicSchool,
    source: 'class' as SpellSource,
    castingTime: {
      count: 1,
      unit: 'action'
    },
    range: {
      type: 'ranged',
      distance: 120,
      unit: 'feet'
    },
    duration: {
      type: 'instantaneous'
    },
    components: {
      verbal: true,
      somatic: true,
      material: false
    },
    description: 'You create three glowing darts of magical force.',
    ritual: false,
    concentration: false,
    damageTypes: ['force'],
    savingThrow: null,
    attackType: 'ranged',
    ...overrides
  });

  describe('validateSpell', () => {
    it('should validate a correct spell', () => {
      const spell = createValidSpell();
      const result = validator.validateSpell(spell);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    it('should validate spell level range', () => {
      const invalidSpell = createValidSpell({ level: -1 as SpellLevel });
      const result = validator.validateSpell(invalidSpell);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(expect.objectContaining({
        code: 'INVALID_SPELL_LEVEL',
        message: 'Spell level must be between 0 and 9'
      }));
    });

    it('should validate spell level upper bound', () => {
      const invalidSpell = createValidSpell({ level: 10 as SpellLevel });
      const result = validator.validateSpell(invalidSpell);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(expect.objectContaining({
        code: 'INVALID_SPELL_LEVEL',
        message: 'Spell level must be between 0 and 9'
      }));
    });

    it('should validate magic school', () => {
      const invalidSpell = createValidSpell({ school: 'invalid-school' as MagicSchool });
      const result = validator.validateSpell(invalidSpell);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(expect.objectContaining({
        code: 'INVALID_SCHOOL',
        message: 'Magic school must be one of the eight D&D 5e schools'
      }));
    });

    it('should validate spell source', () => {
      const invalidSpell = createValidSpell({ source: 'invalid-source' as SpellSource });
      const result = validator.validateSpell(invalidSpell);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(expect.objectContaining({
        code: 'INVALID_SOURCE',
        message: 'Spell source must be class, race, item, or feat'
      }));
    });

    it('should validate required spell name', () => {
      const invalidSpell = createValidSpell({ name: '' });
      const result = validator.validateSpell(invalidSpell);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(expect.objectContaining({
        code: 'MISSING_NAME',
        message: 'Spell must have a name'
      }));
    });

    it('should validate required spell description', () => {
      const invalidSpell = createValidSpell({ description: '' });
      const result = validator.validateSpell(invalidSpell);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(expect.objectContaining({
        code: 'MISSING_DESCRIPTION',
        message: 'Spell must have a description'
      }));
    });

    it('should validate casting time', () => {
      const invalidSpell = createValidSpell({
        castingTime: {
          count: 0,
          unit: 'action'
        }
      });
      const result = validator.validateSpell(invalidSpell);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(expect.objectContaining({
        code: 'INVALID_CASTING_TIME',
        message: 'Casting time count must be positive'
      }));
    });

    it('should validate range for targeted spells', () => {
      const invalidSpell = createValidSpell({
        range: {
          type: 'ranged',
          distance: -10,
          unit: 'feet'
        }
      });
      const result = validator.validateSpell(invalidSpell);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(expect.objectContaining({
        code: 'INVALID_RANGE',
        message: 'Range distance must be positive for ranged spells'
      }));
    });

    it('should validate components', () => {
      const invalidSpell = createValidSpell({
        components: {
          verbal: false,
          somatic: false,
          material: false
        }
      });
      const result = validator.validateSpell(invalidSpell);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(expect.objectContaining({
        code: 'NO_COMPONENTS',
        message: 'Spell must have at least one component (V, S, or M)'
      }));
    });

    it('should validate material components require materials text', () => {
      const invalidSpell = createValidSpell({
        components: {
          verbal: true,
          somatic: true,
          material: true,
          materials: ''
        }
      });

      const result = validator.validateSpell(invalidSpell, { strictValidation: true });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(expect.objectContaining({
        code: 'MISSING_MATERIALS',
        message: 'Spell with material components must specify required materials'
      }));
    });

    it('should validate concentration and ritual flags', () => {
      const validConcentrationSpell = createValidSpell({
        concentration: true,
        duration: {
          type: 'concentration',
          value: 10,
          unit: 'minutes'
        }
      });

      const result = validator.validateSpell(validConcentrationSpell);
      expect(result.isValid).toBe(true);
    });

    it('should validate damage types', () => {
      const invalidSpell = createValidSpell({
        damageTypes: ['invalid-damage-type']
      });

      const result = validator.validateSpell(invalidSpell);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(expect.objectContaining({
        code: 'INVALID_DAMAGE_TYPE',
        message: 'Invalid damage type: invalid-damage-type'
      }));
    });

    it('should validate saving throw abilities', () => {
      const invalidSpell = createValidSpell({
        savingThrow: {
          ability: 'invalid-ability',
          dc: 13
        }
      });

      const result = validator.validateSpell(invalidSpell);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(expect.objectContaining({
        code: 'INVALID_SAVING_THROW_ABILITY'
      }));
    });

    it('should allow cantrips (level 0 spells)', () => {
      const cantrip = createValidSpell({
        name: 'Eldritch Blast',
        level: 0 as SpellLevel
      });

      const result = validator.validateSpell(cantrip);
      expect(result.isValid).toBe(true);
    });

    it('should validate healing spells', () => {
      const healingSpell = createValidSpell({
        name: 'Cure Wounds',
        school: 'evocation',
        healing: {
          type: 'hit_points',
          diceCount: 1,
          diceType: 8,
          bonus: 0,
          canCritical: false
        }
      });

      const result = validator.validateSpell(healingSpell);
      expect(result.isValid).toBe(true);
    });
  });

  describe('validateSpellList', () => {
    it('should validate multiple spells', () => {
      const spells = [
        createValidSpell({ name: 'Magic Missile' }),
        createValidSpell({ name: 'Fireball', level: 3 }),
        createValidSpell({ name: 'Invalid Spell', level: -1 as SpellLevel })
      ];

      const results = validator.validateSpellList(spells);

      expect(results).toHaveLength(3);
      expect(results[0].isValid).toBe(true);
      expect(results[1].isValid).toBe(true);
      expect(results[2].isValid).toBe(false);
    });

    it('should aggregate validation statistics', () => {
      const spells = [
        createValidSpell({ name: 'Valid Spell 1' }),
        createValidSpell({ name: 'Valid Spell 2' }),
        createValidSpell({ name: 'Invalid Spell', level: 10 as SpellLevel })
      ];

      const results = validator.validateSpellList(spells);
      const validCount = results.filter(r => r.isValid).length;
      const invalidCount = results.filter(r => !r.isValid).length;

      expect(validCount).toBe(2);
      expect(invalidCount).toBe(1);
    });
  });

  describe('validation context', () => {
    it('should use character context for validation', () => {
      const spell = createValidSpell();
      const context = {
        characterLevel: 5,
        characterClass: 'wizard',
        spellcastingAbility: 'intelligence'
      };

      const result = validator.validateSpell(spell, { includeContext: true }, context);

      expect(result.isValid).toBe(true);
      expect(result.context).toEqual(context);
    });

    it('should validate spell accessibility for character level', () => {
      const highLevelSpell = createValidSpell({
        name: 'Wish',
        level: 9 as SpellLevel
      });

      const context = {
        characterLevel: 5,
        characterClass: 'wizard',
        spellcastingAbility: 'intelligence'
      };

      const result = validator.validateSpell(highLevelSpell, { checkSpellAccess: true }, context);

      expect(result.warnings).toContain(expect.objectContaining({
        code: 'SPELL_LEVEL_TOO_HIGH',
        message: 'Spell level 9 may not be accessible at character level 5'
      }));
    });
  });

  describe('performance validation', () => {
    it('should validate large spell lists efficiently', () => {
      const spells = Array.from({ length: 1000 }, (_, i) => 
        createValidSpell({ 
          id: String(i + 1),
          name: `Spell ${i + 1}`,
          level: (i % 10) as SpellLevel 
        })
      );

      const startTime = performance.now();
      const results = validator.validateSpellList(spells);
      const endTime = performance.now();

      expect(results).toHaveLength(1000);
      expect(results.every(r => r.isValid)).toBe(true);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete in less than 1 second
    });
  });
});