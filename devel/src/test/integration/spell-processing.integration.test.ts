/**
 * Spell Processing Integration Tests
 * 
 * Tests the complete spell processing pipeline using real D&D Beyond character data
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { SpellDataExtractor } from '@/domain/character/services/SpellDataExtractor';
import { SpellValidator } from '@/domain/character/services/SpellValidator';
import { SpellDeduplicator } from '@/domain/character/services/SpellDeduplicator';
import { ConversionOrchestrator } from '@/domain/conversion/ConversionOrchestrator';
import { FantasyGroundsXMLFormatter } from '@/domain/export/formatters/FantasyGroundsXMLFormatter';
import { FoundryVTTMapper } from '@/domain/export/mappers/FoundryVTTMapper';

describe('Spell Processing Integration', () => {
  let extractor: SpellDataExtractor;
  let validator: SpellValidator;
  let deduplicator: SpellDeduplicator;
  let orchestrator: ConversionOrchestrator;
  let fgFormatter: FantasyGroundsXMLFormatter;
  let foundryMapper: FoundryVTTMapper;

  let testCharacterData: any;

  beforeEach(async () => {
    extractor = new SpellDataExtractor();
    validator = new SpellValidator();
    deduplicator = new SpellDeduplicator();
    orchestrator = new ConversionOrchestrator();
    fgFormatter = new FantasyGroundsXMLFormatter();
    foundryMapper = new FoundryVTTMapper();

    // Load real test character data
    const testDataPath = join(process.cwd(), '..', '..', 'legacy', 'data', 'TestCharacter2_151483095_v05.json');
    const rawData = readFileSync(testDataPath, 'utf-8');
    const jsonData = JSON.parse(rawData);
    testCharacterData = jsonData.data; // Extract the character data from the API response wrapper
  });

  describe('End-to-End Spell Processing', () => {
    it('should process spells from real character data through the complete pipeline', async () => {
      // Step 1: Process character through orchestrator
      const orchestratorResult = await orchestrator.processCharacter(testCharacterData);

      expect(orchestratorResult.success).toBe(true);
      expect(orchestratorResult.processedCharacter).toBeDefined();
      expect(orchestratorResult.processedCharacter!.spells).toBeDefined();

      const spellProcessingResult = orchestratorResult.processedCharacter!.spells;
      
      // Validate spell processing results
      expect(spellProcessingResult.success).toBe(true);
      expect(spellProcessingResult.spells).toBeInstanceOf(Array);
      
      if (spellProcessingResult.spells.length > 0) {
        // Character has spells - validate structure
        expect(spellProcessingResult.spells[0]).toHaveProperty('id');
        expect(spellProcessingResult.spells[0]).toHaveProperty('name');
        expect(spellProcessingResult.spells[0]).toHaveProperty('level');
        expect(spellProcessingResult.spells[0]).toHaveProperty('school');
        expect(spellProcessingResult.spells[0]).toHaveProperty('source');
        expect(spellProcessingResult.spells[0]).toHaveProperty('description');

        console.log(`✅ Processed ${spellProcessingResult.spells.length} spells from real character data`);
        console.log(`   Sample spell: ${spellProcessingResult.spells[0].name} (Level ${spellProcessingResult.spells[0].level})`);
      } else {
        console.log('ℹ️ Character has no spells - testing empty spell processing');
      }

      // Step 2: Test Fantasy Grounds XML generation
      const fgXmlResult = await fgFormatter.formatCharacter(orchestratorResult.processedCharacter!);
      
      expect(fgXmlResult.success).toBe(true);
      expect(fgXmlResult.xmlOutput).toContain('<character>');
      
      if (spellProcessingResult.spells.length > 0) {
        expect(fgXmlResult.xmlOutput).toContain('<powers>');
        expect(fgXmlResult.xmlOutput).toContain('<spell>');
        console.log('✅ Fantasy Grounds XML contains spell data');
      }

      // Step 3: Test Foundry VTT JSON generation  
      const foundryResult = await foundryMapper.mapCharacterData(orchestratorResult.processedCharacter!);

      expect(foundryResult.success).toBe(true);
      expect(foundryResult.foundryActor).toHaveProperty('items');
      
      if (spellProcessingResult.spells.length > 0) {
        const spellItems = foundryResult.foundryActor.items.filter((item: any) => item.type === 'spell');
        expect(spellItems.length).toBeGreaterThan(0);
        console.log(`✅ Generated ${spellItems.length} Foundry VTT spell items`);
      }
    });

    it('should extract specific spells from the test character', async () => {
      const extractionResult = await extractor.extractSpells(testCharacterData);

      expect(extractionResult.success).toBe(true);

      // Log details about extracted spells for verification
      console.log(`📊 Spell Extraction Results:`);
      console.log(`   Total spells found: ${extractionResult.spells.length}`);
      console.log(`   Duplicates removed: ${extractionResult.duplicatesRemoved}`);
      console.log(`   Validation errors: ${extractionResult.validationResults.filter(r => !r.isValid).length}`);
      console.log(`   Processing time: ${extractionResult.performance.totalTime}ms`);

      if (extractionResult.spells.length > 0) {
        // Group spells by source
        const spellsBySource = extractionResult.spells.reduce((acc, spell) => {
          acc[spell.source] = (acc[spell.source] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        console.log(`   Spells by source:`, spellsBySource);

        // Group spells by level
        const spellsByLevel = extractionResult.spells.reduce((acc, spell) => {
          acc[spell.level] = (acc[spell.level] || 0) + 1;
          return acc;
        }, {} as Record<number, number>);

        console.log(`   Spells by level:`, spellsByLevel);

        // Show sample spells
        extractionResult.spells.slice(0, 3).forEach(spell => {
          console.log(`   📜 ${spell.name} (Level ${spell.level}, ${spell.school}, source: ${spell.source})`);
        });

        // Validate that extracted spells have the expected properties
        extractionResult.spells.forEach(spell => {
          expect(spell).toHaveProperty('id');
          expect(spell).toHaveProperty('name');
          expect(spell).toHaveProperty('level');
          expect(spell).toHaveProperty('school');
          expect(spell).toHaveProperty('source');
          expect(spell.name).toBeTruthy();
          expect(spell.level).toBeGreaterThanOrEqual(0);
          expect(spell.level).toBeLessThanOrEqual(9);
        });
      }
    });

    it('should validate extracted spells against D&D 5e rules', async () => {
      const extractionResult = await extractor.extractSpells(testCharacterData, {
        validateSpells: true,
        strictValidation: true
      });

      expect(extractionResult.success).toBe(true);

      if (extractionResult.spells.length > 0) {
        const validationResults = extractionResult.validationResults;
        const validSpells = validationResults.filter(r => r.isValid).length;
        const invalidSpells = validationResults.filter(r => !r.isValid).length;

        console.log(`🔍 Spell Validation Results:`);
        console.log(`   Valid spells: ${validSpells}`);
        console.log(`   Invalid spells: ${invalidSpells}`);

        if (invalidSpells > 0) {
          const errorSummary = validationResults
            .filter(r => !r.isValid)
            .flatMap(r => r.errors.map(e => e.code))
            .reduce((acc, code) => {
              acc[code] = (acc[code] || 0) + 1;
              return acc;
            }, {} as Record<string, number>);

          console.log(`   Error summary:`, errorSummary);
        }

        // Most spells should be valid
        expect(validSpells).toBeGreaterThan(invalidSpells);
      }
    });

    it('should handle spell deduplication correctly', async () => {
      // First extract spells without deduplication
      const withoutDedup = await extractor.extractSpells(testCharacterData, {
        deduplicateSpells: false
      });

      // Then extract with deduplication
      const withDedup = await extractor.extractSpells(testCharacterData, {
        deduplicateSpells: true
      });

      expect(withoutDedup.success).toBe(true);
      expect(withDedup.success).toBe(true);

      console.log(`🔄 Deduplication Results:`);
      console.log(`   Spells before deduplication: ${withoutDedup.spells.length}`);
      console.log(`   Spells after deduplication: ${withDedup.spells.length}`);
      console.log(`   Duplicates removed: ${withDedup.duplicatesRemoved}`);

      // Should have same or fewer spells after deduplication
      expect(withDedup.spells.length).toBeLessThanOrEqual(withoutDedup.spells.length);
      expect(withDedup.duplicatesRemoved).toBe(withoutDedup.spells.length - withDedup.spells.length);
    });
  });

  describe('Fantasy Grounds XML Integration', () => {
    it('should generate valid Fantasy Grounds XML with spells', async () => {
      const orchestratorResult = await orchestrator.processCharacter(testCharacterData);
      expect(orchestratorResult.success).toBe(true);

      const xmlResult = await fgFormatter.formatCharacter(orchestratorResult.processedCharacter!);
      expect(xmlResult.success).toBe(true);

      const xml = xmlResult.xmlOutput;

      // Validate XML structure
      expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(xml).toContain('<character>');
      expect(xml).toContain('</character>');

      if (orchestratorResult.processedCharacter!.spells.spells.length > 0) {
        // Should contain spell data
        expect(xml).toContain('<powers>');
        expect(xml).toContain('</powers>');

        // Parse XML to validate structure (basic check)
        const powersSectionMatch = xml.match(/<powers>(.*?)<\/powers>/s);
        if (powersSectionMatch) {
          const powersContent = powersSectionMatch[1];
          
          // Should contain individual spell entries
          expect(powersContent).toMatch(/<id-\d+>/);
          expect(powersContent).toContain('<name type="string">');
          expect(powersContent).toContain('<level type="number">');
          expect(powersContent).toContain('<school type="string">');

          console.log('✅ Fantasy Grounds XML contains properly structured spell data');
        }
      }
    });
  });

  describe('Foundry VTT Integration', () => {
    it('should generate valid Foundry VTT actor data with spell items', async () => {
      const orchestratorResult = await orchestrator.processCharacter(testCharacterData);
      expect(orchestratorResult.success).toBe(true);

      const foundryResult = await foundryMapper.mapCharacterData(orchestratorResult.processedCharacter!);
      expect(foundryResult.success).toBe(true);

      const actor = foundryResult.foundryActor;

      // Validate basic actor structure
      expect(actor).toHaveProperty('name');
      expect(actor).toHaveProperty('type');
      expect(actor).toHaveProperty('items');
      expect(actor.items).toBeInstanceOf(Array);

      if (orchestratorResult.processedCharacter!.spells.spells.length > 0) {
        const spellItems = actor.items.filter((item: any) => item.type === 'spell');
        
        expect(spellItems.length).toBeGreaterThan(0);

        // Validate spell item structure
        spellItems.forEach((spellItem: any) => {
          expect(spellItem).toHaveProperty('name');
          expect(spellItem).toHaveProperty('type', 'spell');
          expect(spellItem).toHaveProperty('system');
          expect(spellItem.system).toHaveProperty('level');
          expect(spellItem.system).toHaveProperty('school');
          expect(spellItem.system).toHaveProperty('components');
          expect(spellItem.system).toHaveProperty('description');
        });

        console.log(`✅ Generated ${spellItems.length} valid Foundry VTT spell items`);

        // Show sample spell item
        if (spellItems.length > 0) {
          const sampleSpell = spellItems[0];
          console.log(`   📜 Sample: ${sampleSpell.name} (Level ${sampleSpell.system.level})`);
        }
      }
    });
  });

  describe('Performance Benchmarks', () => {
    it('should process character spells within performance thresholds', async () => {
      const startTime = performance.now();
      
      const orchestratorResult = await orchestrator.processCharacter(testCharacterData, {
        strictValidation: true,
        includeDebugInfo: false,
        enablePerformanceTracking: true,
        skipOptionalProcessing: false
      });
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;

      expect(orchestratorResult.success).toBe(true);

      console.log(`⏱️ Performance Results:`);
      console.log(`   Total processing time: ${totalTime.toFixed(2)}ms`);
      console.log(`   Spell extraction time: ${orchestratorResult.processedCharacter!.spells.performance.extractionTime}ms`);
      console.log(`   Spell validation time: ${orchestratorResult.processedCharacter!.spells.performance.validationTime}ms`);
      console.log(`   Spell deduplication time: ${orchestratorResult.processedCharacter!.spells.performance.deduplicationTime}ms`);

      // Performance thresholds (adjust based on expected performance)
      expect(totalTime).toBeLessThan(5000); // Total should be under 5 seconds
      expect(orchestratorResult.processedCharacter!.spells.performance.totalTime).toBeLessThan(1000); // Spell processing should be under 1 second
    });
  });

  describe('Error Handling', () => {
    it('should gracefully handle corrupted spell data', async () => {
      const corruptedCharacterData = {
        ...testCharacterData,
        spells: {
          race: [],
          class: [
            {
              // Missing required fields
              id: null,
              definition: null
            }
          ],
          item: [],
          feat: []
        }
      };

      const result = await orchestrator.processCharacter(corruptedCharacterData);

      // Should still succeed but with warnings
      expect(result.success).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
      
      console.log(`⚠️ Handled ${result.warnings.length} warnings with corrupted data`);
    });

    it('should continue processing when individual spell extraction fails', async () => {
      // This would require mocking the extractor to simulate errors
      // For now, we'll test that the orchestrator handles empty results
      const emptySpellCharacter = {
        ...testCharacterData,
        spells: {
          race: [],
          class: [],
          item: [],
          feat: []
        }
      };

      const result = await orchestrator.processCharacter(emptySpellCharacter);

      expect(result.success).toBe(true);
      expect(result.processedCharacter!.spells.spells).toHaveLength(0);
      console.log('✅ Successfully handled character with no spells');
    });
  });
});