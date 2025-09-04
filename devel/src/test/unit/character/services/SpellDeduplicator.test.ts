/**
 * SpellDeduplicator Unit Tests
 * 
 * Tests spell deduplication logic for handling duplicate spells from multiple sources
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { SpellDeduplicator } from '@/domain/character/services/SpellDeduplicator';
import type { NormalizedSpell, SpellLevel, SpellSource } from '@/domain/character/models/Spells';

describe('SpellDeduplicator', () => {
  let deduplicator: SpellDeduplicator;

  beforeEach(() => {
    deduplicator = new SpellDeduplicator();
  });

  const createSpell = (overrides: Partial<NormalizedSpell> = {}): NormalizedSpell => ({
    id: '1',
    name: 'Magic Missile',
    level: 1 as SpellLevel,
    school: 'evocation',
    source: 'class',
    castingTime: { count: 1, unit: 'action' },
    range: { type: 'ranged', distance: 120, unit: 'feet' },
    duration: { type: 'instantaneous' },
    components: { verbal: true, somatic: true, material: false },
    description: 'You create three glowing darts of magical force.',
    ritual: false,
    concentration: false,
    damageTypes: ['force'],
    savingThrow: null,
    attackType: 'ranged',
    ...overrides
  });

  describe('deduplicateSpells', () => {
    it('should return spells unchanged when no duplicates exist', () => {
      const spells = [
        createSpell({ id: '1', name: 'Magic Missile' }),
        createSpell({ id: '2', name: 'Fireball', level: 3 }),
        createSpell({ id: '3', name: 'Cure Wounds', school: 'evocation' })
      ];

      const result = deduplicator.deduplicateSpells(spells);

      expect(result.success).toBe(true);
      expect(result.deduplicatedSpells).toHaveLength(3);
      expect(result.duplicatesRemoved).toBe(0);
      expect(result.conflicts).toHaveLength(0);
    });

    it('should identify duplicates by spell definition ID', () => {
      const spells = [
        createSpell({ id: '1', definitionId: '123', name: 'Magic Missile', source: 'class' }),
        createSpell({ id: '2', definitionId: '123', name: 'Magic Missile', source: 'race' })
      ];

      const result = deduplicator.deduplicateSpells(spells);

      expect(result.success).toBe(true);
      expect(result.deduplicatedSpells).toHaveLength(1);
      expect(result.duplicatesRemoved).toBe(1);
    });

    it('should identify duplicates by name when definition IDs are different', () => {
      const spells = [
        createSpell({ id: '1', definitionId: '123', name: 'Magic Missile', source: 'class' }),
        createSpell({ id: '2', definitionId: '456', name: 'Magic Missile', source: 'item' })
      ];

      const result = deduplicator.deduplicateSpells(spells, {
        matchByName: true
      });

      expect(result.success).toBe(true);
      expect(result.deduplicatedSpells).toHaveLength(1);
      expect(result.duplicatesRemoved).toBe(1);
    });

    it('should prioritize class spells over other sources', () => {
      const spells = [
        createSpell({ id: '1', name: 'Magic Missile', source: 'race', prepared: false }),
        createSpell({ id: '2', name: 'Magic Missile', source: 'class', prepared: true }),
        createSpell({ id: '3', name: 'Magic Missile', source: 'item', prepared: false })
      ];

      const result = deduplicator.deduplicateSpells(spells, {
        strategy: 'prioritize_source'
      });

      expect(result.success).toBe(true);
      expect(result.deduplicatedSpells).toHaveLength(1);
      expect(result.deduplicatedSpells[0].source).toBe('class');
      expect(result.deduplicatedSpells[0].prepared).toBe(true);
      expect(result.duplicatesRemoved).toBe(2);
    });

    it('should merge spell data when using merge strategy', () => {
      const spells = [
        createSpell({ 
          id: '1', 
          name: 'Magic Missile', 
          source: 'race',
          prepared: false,
          alwaysPrepared: true
        }),
        createSpell({ 
          id: '2', 
          name: 'Magic Missile', 
          source: 'class',
          prepared: true,
          alwaysPrepared: false
        })
      ];

      const result = deduplicator.deduplicateSpells(spells, {
        strategy: 'merge'
      });

      expect(result.success).toBe(true);
      expect(result.deduplicatedSpells).toHaveLength(1);
      
      const mergedSpell = result.deduplicatedSpells[0];
      expect(mergedSpell.source).toBe('class'); // Higher priority source
      expect(mergedSpell.prepared).toBe(true); // Merged preparation status
      expect(mergedSpell.alwaysPrepared).toBe(true); // Merged always prepared
      expect(mergedSpell.sources).toEqual(['race', 'class']); // Track all sources
    });

    it('should handle conflicts during merging', () => {
      const spells = [
        createSpell({ 
          id: '1', 
          name: 'Magic Missile', 
          source: 'class',
          level: 1,
          description: 'Version 1 description'
        }),
        createSpell({ 
          id: '2', 
          name: 'Magic Missile', 
          source: 'item',
          level: 2, // Different level - conflict!
          description: 'Version 2 description'
        })
      ];

      const result = deduplicator.deduplicateSpells(spells, {
        strategy: 'merge',
        handleConflicts: true
      });

      expect(result.success).toBe(true);
      expect(result.conflicts).toHaveLength(1);
      expect(result.conflicts[0]).toEqual(expect.objectContaining({
        spellName: 'Magic Missile',
        conflictType: 'level',
        values: [1, 2],
        resolution: 'kept_first'
      }));
    });

    it('should keep first spell when using keep_first strategy', () => {
      const spells = [
        createSpell({ id: '1', name: 'Magic Missile', source: 'race' }),
        createSpell({ id: '2', name: 'Magic Missile', source: 'class' })
      ];

      const result = deduplicator.deduplicateSpells(spells, {
        strategy: 'keep_first'
      });

      expect(result.success).toBe(true);
      expect(result.deduplicatedSpells).toHaveLength(1);
      expect(result.deduplicatedSpells[0].source).toBe('race');
    });

    it('should keep last spell when using keep_last strategy', () => {
      const spells = [
        createSpell({ id: '1', name: 'Magic Missile', source: 'race' }),
        createSpell({ id: '2', name: 'Magic Missile', source: 'class' })
      ];

      const result = deduplicator.deduplicateSpells(spells, {
        strategy: 'keep_last'
      });

      expect(result.success).toBe(true);
      expect(result.deduplicatedSpells).toHaveLength(1);
      expect(result.deduplicatedSpells[0].source).toBe('class');
    });

    it('should handle complex deduplication scenarios', () => {
      const spells = [
        // Three versions of Magic Missile
        createSpell({ id: '1', name: 'Magic Missile', source: 'race', prepared: false }),
        createSpell({ id: '2', name: 'Magic Missile', source: 'class', prepared: true }),
        createSpell({ id: '3', name: 'Magic Missile', source: 'item', prepared: false }),
        
        // Two versions of Fireball
        createSpell({ id: '4', name: 'Fireball', level: 3, source: 'class', prepared: true }),
        createSpell({ id: '5', name: 'Fireball', level: 3, source: 'item', prepared: false }),
        
        // Unique spell
        createSpell({ id: '6', name: 'Cure Wounds', level: 1, source: 'class', prepared: true })
      ];

      const result = deduplicator.deduplicateSpells(spells, {
        strategy: 'prioritize_source'
      });

      expect(result.success).toBe(true);
      expect(result.deduplicatedSpells).toHaveLength(3);
      expect(result.duplicatesRemoved).toBe(3);
      
      const spellNames = result.deduplicatedSpells.map(s => s.name);
      expect(spellNames).toContain('Magic Missile');
      expect(spellNames).toContain('Fireball');
      expect(spellNames).toContain('Cure Wounds');
      
      // All should be class spells (highest priority)
      expect(result.deduplicatedSpells.every(s => s.source === 'class')).toBe(true);
    });

    it('should preserve spell order when possible', () => {
      const spells = [
        createSpell({ id: '1', name: 'A Spell', source: 'class' }),
        createSpell({ id: '2', name: 'B Spell', source: 'class' }),
        createSpell({ id: '3', name: 'A Spell', source: 'race' }), // Duplicate
        createSpell({ id: '4', name: 'C Spell', source: 'class' })
      ];

      const result = deduplicator.deduplicateSpells(spells, {
        strategy: 'keep_first',
        preserveOrder: true
      });

      expect(result.success).toBe(true);
      expect(result.deduplicatedSpells).toHaveLength(3);
      
      const names = result.deduplicatedSpells.map(s => s.name);
      expect(names).toEqual(['A Spell', 'B Spell', 'C Spell']);
    });
  });

  describe('identifyDuplicates', () => {
    it('should identify duplicates by definition ID', () => {
      const spells = [
        createSpell({ id: '1', definitionId: '123', name: 'Spell A' }),
        createSpell({ id: '2', definitionId: '456', name: 'Spell B' }),
        createSpell({ id: '3', definitionId: '123', name: 'Spell A' }) // Duplicate
      ];

      const duplicateGroups = (deduplicator as any).identifyDuplicates(spells, { matchByName: false });

      expect(duplicateGroups).toHaveLength(1);
      expect(duplicateGroups[0]).toHaveLength(2);
      expect(duplicateGroups[0].every(s => s.definitionId === '123')).toBe(true);
    });

    it('should identify duplicates by name when specified', () => {
      const spells = [
        createSpell({ id: '1', definitionId: '123', name: 'Magic Missile' }),
        createSpell({ id: '2', definitionId: '456', name: 'Fireball' }),
        createSpell({ id: '3', definitionId: '789', name: 'Magic Missile' }) // Same name, different ID
      ];

      const duplicateGroups = (deduplicator as any).identifyDuplicates(spells, { matchByName: true });

      expect(duplicateGroups).toHaveLength(1);
      expect(duplicateGroups[0]).toHaveLength(2);
      expect(duplicateGroups[0].every(s => s.name === 'Magic Missile')).toBe(true);
    });
  });

  describe('performance', () => {
    it('should handle large spell lists efficiently', () => {
      // Create a list with many duplicates
      const baseSpells = Array.from({ length: 50 }, (_, i) => 
        createSpell({ 
          id: String(i + 1), 
          name: `Spell ${i % 10}`, // Create duplicates by using modulo
          level: (i % 9 + 1) as SpellLevel 
        })
      );

      const startTime = performance.now();
      const result = deduplicator.deduplicateSpells(baseSpells);
      const endTime = performance.now();

      expect(result.success).toBe(true);
      expect(result.deduplicatedSpells.length).toBeLessThan(baseSpells.length);
      expect(result.duplicatesRemoved).toBeGreaterThan(0);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete in less than 1 second
    });
  });

  describe('edge cases', () => {
    it('should handle empty spell list', () => {
      const result = deduplicator.deduplicateSpells([]);

      expect(result.success).toBe(true);
      expect(result.deduplicatedSpells).toHaveLength(0);
      expect(result.duplicatesRemoved).toBe(0);
    });

    it('should handle single spell', () => {
      const spells = [createSpell({ name: 'Magic Missile' })];
      const result = deduplicator.deduplicateSpells(spells);

      expect(result.success).toBe(true);
      expect(result.deduplicatedSpells).toHaveLength(1);
      expect(result.duplicatesRemoved).toBe(0);
    });

    it('should handle spells with missing names gracefully', () => {
      const spells = [
        createSpell({ id: '1', name: 'Magic Missile' }),
        createSpell({ id: '2', name: '' }), // Empty name
        createSpell({ id: '3', name: 'Fireball' })
      ];

      const result = deduplicator.deduplicateSpells(spells);

      expect(result.success).toBe(true);
      expect(result.deduplicatedSpells).toHaveLength(2); // Should skip empty name
      expect(result.warnings).toContain(expect.objectContaining({
        code: 'EMPTY_SPELL_NAME'
      }));
    });

    it('should handle spells with null or undefined properties', () => {
      const spells = [
        createSpell({ 
          id: '1', 
          name: 'Test Spell',
          definitionId: undefined,
          prepared: undefined
        })
      ];

      const result = deduplicator.deduplicateSpells(spells);

      expect(result.success).toBe(true);
      expect(result.deduplicatedSpells).toHaveLength(1);
    });
  });
});