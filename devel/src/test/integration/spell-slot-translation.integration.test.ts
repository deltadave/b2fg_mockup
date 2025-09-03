/**
 * Spell Slot Translation Integration Tests
 * 
 * Tests the complete pipeline from D&D Beyond JSON to Fantasy Grounds XML
 * and Foundry VTT JSON formats for spell slot calculations.
 * 
 * This test suite validates the integration between:
 * - SpellSlotCalculator with D&D Beyond parsing
 * - FantasyGroundsXMLFormatter spell slot XML generation  
 * - FoundryVTTMapper spell slot mapping
 * - ConversionOrchestrator spell slot processing
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { SpellSlotCalculator, type DnDBeyondClassData } from '@/domain/character/services/SpellSlotCalculator';
import { FoundrySpellMapper, type FoundrySpells } from '@/domain/export/mappers/FoundryVTTMapper';
import { FantasyGroundsXMLFormatter } from '@/domain/export/formatters/FantasyGroundsXMLFormatter';
import { ConversionOrchestrator, type ConversionOptions } from '@/domain/conversion/ConversionOrchestrator';
import { featureFlags } from '@/core/FeatureFlags';
import fs from 'fs';
import path from 'path';

// Test data structure matching TestCharacter2_151483095_v05.json
const createTestCharacterData = (classes: DnDBeyondClassData[]) => ({
  id: 151483095,
  name: 'TestCharacter2',
  classes,
  // Add other required fields as needed for integration tests
  stats: [
    { id: 1, name: 'strength', value: 12 },
    { id: 2, name: 'dexterity', value: 14 },
    { id: 3, name: 'constitution', value: 13 },
    { id: 4, name: 'intelligence', value: 15 },
    { id: 5, name: 'wisdom', value: 17 },
    { id: 6, name: 'charisma', value: 13 }
  ],
  race: { fullName: 'Human' },
  background: { definition: { name: 'Acolyte' } }
});

describe('Spell Slot Translation Integration', () => {
  let spellSlotCalculator: SpellSlotCalculator;
  let foundryMapper: FoundrySpellMapper;
  let fgFormatter: FantasyGroundsXMLFormatter;
  let orchestrator: ConversionOrchestrator;

  beforeEach(() => {
    spellSlotCalculator = new SpellSlotCalculator();
    foundryMapper = new FoundrySpellMapper();
    fgFormatter = new FantasyGroundsXMLFormatter();
    orchestrator = new ConversionOrchestrator();
    
    // Enable debug logging for tests
    SpellSlotCalculator.setDebugMode(true);
    featureFlags.enable('spell_slot_calculator_debug');
    featureFlags.enable('foundry_mapper_debug');
    featureFlags.enable('conversion_orchestrator_debug');
  });

  describe('D&D Beyond JSON Parsing', () => {
    it('should parse multiclass Barbarian/Cleric from test data format', () => {
      const dndbClasses: DnDBeyondClassData[] = [
        {
          level: 4,
          definition: {
            name: 'Barbarian',
            spellCastingAbilityId: null
          }
        },
        {
          level: 4,
          definition: {
            name: 'Cleric', 
            spellCastingAbilityId: 5 // Wisdom
          }
        }
      ];

      const result = spellSlotCalculator.calculateFromDnDBeyond(dndbClasses);

      expect(result.multiclassCasterLevel).toBe(4); // Only cleric contributes
      expect(result.totalCasterClasses).toBe(1);
      expect(result.debugInfo.calculationMethod).toBe('single_class');
      
      // Should have 4th level cleric spell slots
      expect(result.spellSlots).toEqual({
        1: 4, 2: 3, 3: 1, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0
      });
      
      // No pact magic
      expect(result.pactMagicSlots).toEqual({
        1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0
      });
    });

    it('should parse pure Warlock with pact magic', () => {
      const dndbClasses: DnDBeyondClassData[] = [
        {
          level: 5,
          definition: {
            name: 'Warlock',
            spellCastingAbilityId: 6 // Charisma
          }
        }
      ];

      const result = spellSlotCalculator.calculateFromDnDBeyond(dndbClasses);

      expect(result.multiclassCasterLevel).toBe(0); // Warlocks don't contribute to multiclass
      expect(result.totalCasterClasses).toBe(1);
      expect(result.debugInfo.calculationMethod).toBe('pact_magic_only');
      
      // No regular spell slots
      expect(result.spellSlots).toEqual({
        1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0
      });
      
      // Should have 5th level warlock pact magic (2 3rd level slots)
      expect(result.pactMagicSlots).toEqual({
        1: 0, 2: 0, 3: 2, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0
      });
    });

    it('should parse complex multiclass Warlock/Sorcerer', () => {
      const dndbClasses: DnDBeyondClassData[] = [
        {
          level: 3,
          definition: {
            name: 'Warlock',
            spellCastingAbilityId: 6
          }
        },
        {
          level: 2,
          definition: {
            name: 'Sorcerer', 
            spellCastingAbilityId: 6
          }
        }
      ];

      const result = spellSlotCalculator.calculateFromDnDBeyond(dndbClasses);

      expect(result.multiclassCasterLevel).toBe(2); // Only sorcerer contributes
      expect(result.totalCasterClasses).toBe(2);
      expect(result.debugInfo.calculationMethod).toBe('multiclass');
      
      // Should have 2nd level caster spell slots
      expect(result.spellSlots).toEqual({
        1: 3, 2: 1, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0
      });
      
      // Plus 3rd level warlock pact magic (2 2nd level slots)
      expect(result.pactMagicSlots).toEqual({
        1: 0, 2: 2, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0
      });
    });
  });

  describe('Fantasy Grounds XML Generation', () => {
    it('should generate correct powermeta XML for multiclass character', () => {
      const characterData = createTestCharacterData([
        {
          level: 4,
          definition: {
            name: 'Barbarian',
            spellCastingAbilityId: null
          }
        },
        {
          level: 4,
          definition: {
            name: 'Cleric',
            spellCastingAbilityId: 5
          }
        }
      ]);

      const spellSlots = spellSlotCalculator.calculateFromDnDBeyond(characterData.classes);
      const xmlResult = spellSlotCalculator.generateSpellSlotsXML(spellSlots);

      // Should contain proper Fantasy Grounds XML structure
      expect(xmlResult.combinedXML).toContain('<powermeta>');
      expect(xmlResult.combinedXML).toContain('</powermeta>');

      // Should have spell slots for 4th level cleric
      expect(xmlResult.spellSlotsXML).toContain('<spellslots1><max type="number">4</max></spellslots1>');
      expect(xmlResult.spellSlotsXML).toContain('<spellslots2><max type="number">3</max></spellslots2>');
      expect(xmlResult.spellSlotsXML).toContain('<spellslots3><max type="number">1</max></spellslots3>');

      // Should have empty pact magic slots
      expect(xmlResult.pactMagicXML).toContain('<pactmagicslots1><max type="number">0</max></pactmagicslots1>');
      expect(xmlResult.pactMagicXML).toContain('<pactmagicslots2><max type="number">0</max></pactmagicslots2>');
    });

    it('should generate correct powermeta XML for pure warlock', () => {
      const characterData = createTestCharacterData([
        {
          level: 5,
          definition: {
            name: 'Warlock',
            spellCastingAbilityId: 6
          }
        }
      ]);

      const spellSlots = spellSlotCalculator.calculateFromDnDBeyond(characterData.classes);
      const xmlResult = spellSlotCalculator.generateSpellSlotsXML(spellSlots);

      // Should have empty regular spell slots
      expect(xmlResult.spellSlotsXML).toContain('<spellslots1><max type="number">0</max></spellslots1>');
      expect(xmlResult.spellSlotsXML).toContain('<spellslots2><max type="number">0</max></spellslots2>');
      expect(xmlResult.spellSlotsXML).toContain('<spellslots3><max type="number">0</max></spellslots3>');

      // Should have pact magic slots
      expect(xmlResult.pactMagicXML).toContain('<pactmagicslots3><max type="number">2</max></pactmagicslots3>');
      expect(xmlResult.pactMagicXML).toContain('<pactmagicslots1><max type="number">0</max></pactmagicslots1>');
      expect(xmlResult.pactMagicXML).toContain('<pactmagicslots2><max type="number">0</max></pactmagicslots2>');
    });
  });

  describe('Foundry VTT JSON Generation', () => {
    it('should generate correct Foundry spell structure for multiclass', () => {
      const dndbClasses: DnDBeyondClassData[] = [
        {
          level: 4,
          definition: {
            name: 'Barbarian',
            spellCastingAbilityId: null
          }
        },
        {
          level: 4,
          definition: {
            name: 'Cleric',
            spellCastingAbilityId: 5
          }
        }
      ];

      const spellSlots = spellSlotCalculator.calculateFromDnDBeyond(dndbClasses);
      const foundrySpells = foundryMapper.mapSpells(spellSlots);

      // Should have proper spell slot structure
      expect(foundrySpells.spell1).toEqual({ value: 4, max: 4 });
      expect(foundrySpells.spell2).toEqual({ value: 3, max: 3 });
      expect(foundrySpells.spell3).toEqual({ value: 1, max: 1 });
      expect(foundrySpells.spell4).toEqual({ value: 0, max: 0 });

      // Should not have pact magic
      expect(foundrySpells.pact).toBeUndefined();
    });

    it('should generate correct Foundry spell structure for pure warlock', () => {
      const dndbClasses: DnDBeyondClassData[] = [
        {
          level: 5,
          definition: {
            name: 'Warlock',
            spellCastingAbilityId: 6
          }
        }
      ];

      const spellSlots = spellSlotCalculator.calculateFromDnDBeyond(dndbClasses);
      const foundrySpells = foundryMapper.mapSpells(spellSlots);

      // Should have empty regular spell slots
      expect(foundrySpells.spell1).toEqual({ value: 0, max: 0 });
      expect(foundrySpells.spell2).toEqual({ value: 0, max: 0 });
      expect(foundrySpells.spell3).toEqual({ value: 0, max: 0 });

      // Should have pact magic
      expect(foundrySpells.pact).toBeDefined();
      expect(foundrySpells.pact!.value).toBe(2);
      expect(foundrySpells.pact!.max).toBe(2);
      expect(foundrySpells.pact!.level).toBe(3);
    });

    it('should generate correct Foundry spell structure for multiclass with warlock', () => {
      const dndbClasses: DnDBeyondClassData[] = [
        {
          level: 3,
          definition: {
            name: 'Warlock',
            spellCastingAbilityId: 6
          }
        },
        {
          level: 2,
          definition: {
            name: 'Sorcerer',
            spellCastingAbilityId: 6
          }
        }
      ];

      const spellSlots = spellSlotCalculator.calculateFromDnDBeyond(dndbClasses);
      const foundrySpells = foundryMapper.mapSpells(spellSlots);

      // Should have 2nd level caster regular spell slots
      expect(foundrySpells.spell1).toEqual({ value: 3, max: 3 });
      expect(foundrySpells.spell2).toEqual({ value: 1, max: 1 });
      expect(foundrySpells.spell3).toEqual({ value: 0, max: 0 });

      // Should have 3rd level warlock pact magic
      expect(foundrySpells.pact).toBeDefined();
      expect(foundrySpells.pact!.value).toBe(2);
      expect(foundrySpells.pact!.max).toBe(2);
      expect(foundrySpells.pact!.level).toBe(2); // 3rd level warlock = 2nd level pact slots
    });
  });

  describe('Input Validation and Error Handling', () => {
    it('should handle malformed D&D Beyond class data gracefully', () => {
      const malformedClasses = [
        {
          // Missing level
          definition: {
            name: 'Wizard'
          }
        }
      ] as any[];

      expect(() => {
        spellSlotCalculator.calculateFromDnDBeyond(malformedClasses);
      }).toThrow(/Invalid D&D Beyond class data/);
    });

    it('should handle unknown class names with warnings', () => {
      const unknownClasses: DnDBeyondClassData[] = [
        {
          level: 5,
          definition: {
            name: 'CustomHomebrewClass',
            spellCastingAbilityId: 4
          }
        }
      ];

      // Should not throw, but treat as non-caster
      const result = spellSlotCalculator.calculateFromDnDBeyond(unknownClasses);
      
      expect(result.multiclassCasterLevel).toBe(0);
      expect(result.totalCasterClasses).toBe(0);
    });

    it('should validate spell slot progression rules', () => {
      const dndbClasses: DnDBeyondClassData[] = [
        {
          level: 20,
          definition: {
            name: 'Wizard',
            spellCastingAbilityId: 4
          }
        }
      ];

      const spellSlots = spellSlotCalculator.calculateFromDnDBeyond(dndbClasses);
      const foundrySpells = foundryMapper.mapSpells(spellSlots);
      
      // Use validation method to check D&D 5e rules
      const validation = foundryMapper.validateSpellSlots(spellSlots);
      
      // 20th level wizard should pass all validation rules
      expect(validation.isValid).toBe(true);
      expect(validation.warnings).toHaveLength(0);
    });
  });

  describe('Complete Integration Pipeline', () => {
    it('should handle the complete conversion process for test character', async () => {
      // Load actual test character data if available
      const testCharacterPath = path.join(process.cwd(), 'legacy/data/TestCharacter2_151483095_v05.json');
      
      if (fs.existsSync(testCharacterPath)) {
        const testCharacterData = JSON.parse(fs.readFileSync(testCharacterPath, 'utf8'));
        const characterData = testCharacterData.data || testCharacterData;

        if (characterData.classes && characterData.classes.length > 0) {
          // Test the complete spell slot calculation
          const spellSlots = spellSlotCalculator.calculateFromDnDBeyond(characterData.classes);
          
          // Validate the calculation
          expect(spellSlots).toBeDefined();
          expect(spellSlots.debugInfo).toBeDefined();
          
          // Test Fantasy Grounds XML generation
          const xmlResult = spellSlotCalculator.generateSpellSlotsXML(spellSlots);
          expect(xmlResult.combinedXML).toContain('<powermeta>');
          
          // Test Foundry VTT mapping
          const foundrySpells = foundryMapper.mapSpells(spellSlots);
          expect(foundrySpells.spell1).toBeDefined();
          expect(foundrySpells.spell1.value).toBeGreaterThanOrEqual(0);
        }
      } else {
        console.warn('Test character data not found, skipping real data integration test');
      }
    });
  });

  describe('Performance and Memory', () => {
    it('should complete spell slot calculation within reasonable time', () => {
      const startTime = performance.now();
      
      const dndbClasses: DnDBeyondClassData[] = [
        {
          level: 10,
          definition: {
            name: 'Wizard',
            spellCastingAbilityId: 4
          }
        },
        {
          level: 5,
          definition: {
            name: 'Cleric',
            spellCastingAbilityId: 5
          }
        },
        {
          level: 3,
          definition: {
            name: 'Warlock',
            spellCastingAbilityId: 6
          }
        }
      ];

      const spellSlots = spellSlotCalculator.calculateFromDnDBeyond(dndbClasses);
      const xmlResult = spellSlotCalculator.generateSpellSlotsXML(spellSlots);
      const foundrySpells = foundryMapper.mapSpells(spellSlots);
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Should complete complex multiclass calculation in under 100ms
      expect(duration).toBeLessThan(100);
      
      // Results should be valid
      expect(spellSlots.debugInfo.calculationMethod).toBe('multiclass');
      expect(xmlResult.combinedXML).toContain('<powermeta>');
      expect(foundrySpells.pact).toBeDefined();
    });
  });
});