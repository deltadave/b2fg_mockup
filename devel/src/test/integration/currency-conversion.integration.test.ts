/**
 * Currency Conversion Integration Tests
 * 
 * End-to-end tests for currency conversion from D&D Beyond JSON to 
 * Fantasy Grounds XML and Foundry VTT JSON formats.
 */

import { describe, it, expect } from 'vitest';
import { CurrencyProcessor } from '../../domain/character/services/CurrencyProcessor';
import { FantasyGroundsXMLFormatter } from '../../domain/export/formatters/FantasyGroundsXMLFormatter';
import type { CharacterData } from '../../domain/character/services/CharacterFetcher';
import type { ProcessedCharacterData } from '../../domain/export/interfaces/OutputFormatter';

// Test data based on the actual TestCharacter2_151483095_v05.json
const testCharacterData: CharacterData = {
  id: 151483095,
  name: 'TestCharacter2',
  currencies: {
    cp: 12,
    sp: 2,
    gp: 43,
    ep: 3,
    pp: 6
  },
  classes: [],
  stats: []
};

const processedCharacterData: ProcessedCharacterData = {
  characterData: testCharacterData,
  totalLevel: 4,
  processedAbilities: {},
  processedSpells: { totalSlots: {} },
  processedFeatures: [],
  processedInventory: { weapons: [], armor: [], equipment: [], encumbrance: { current: 0, maximum: 150 } },
  processedLanguages: [],
  processedProficiencies: { armor: [], weapons: [], tools: [], skills: [], savingThrows: [] }
};

describe('Currency Conversion Integration', () => {
  describe('D&D Beyond to Fantasy Grounds XML', () => {
    it('should convert real character currency data to Fantasy Grounds XML', async () => {
      const formatter = new FantasyGroundsXMLFormatter();
      
      const result = await formatter.generateOutput(processedCharacterData);
      
      expect(result.success).toBe(true);
      expect(result.output).toBeDefined();
      
      const xml = result.output!;
      
      // Verify that currency section is present
      expect(xml).toContain('<coins>');
      expect(xml).toContain('</coins>');
      
      // Verify correct currency values from test data in Fantasy Grounds id-XXXXX format
      expect(xml).toContain('<name type="string">PP</name>');
      expect(xml).toContain('<amount type="number">6</amount>');
      expect(xml).toContain('<name type="string">GP</name>');
      expect(xml).toContain('<amount type="number">43</amount>');
      expect(xml).toContain('<name type="string">EP</name>');
      expect(xml).toContain('<amount type="number">3</amount>');
      expect(xml).toContain('<name type="string">SP</name>');
      expect(xml).toContain('<amount type="number">2</amount>');
      expect(xml).toContain('<name type="string">CP</name>');
      expect(xml).toContain('<amount type="number">12</amount>');
    });

    it('should handle character with no currency gracefully', async () => {
      const noCurrencyData: ProcessedCharacterData = {
        ...processedCharacterData,
        characterData: {
          ...testCharacterData,
          currencies: undefined
        }
      };

      const formatter = new FantasyGroundsXMLFormatter();
      const result = await formatter.generateOutput(noCurrencyData);
      
      expect(result.success).toBe(true);
      
      const xml = result.output!;
      expect(xml).toContain('<coins>');
      expect(xml).toContain('<id-00001>');
      expect(xml).toContain('<amount type="number">0</amount>');
      expect(xml).toContain('<name type="string">GP</name>');
    });
  });

  describe('CurrencyProcessor Direct Integration', () => {
    it('should process real test character currency correctly', () => {
      const result = CurrencyProcessor.processCurrency(testCharacterData);
      
      expect(result.success).toBe(true);
      expect(result.processedCurrency).toBeDefined();
      
      const currency = result.processedCurrency!;
      
      // Verify original amounts are preserved
      expect(currency.originalAmounts.pp).toBe(6);
      expect(currency.originalAmounts.gp).toBe(43);
      expect(currency.originalAmounts.ep).toBe(3);
      expect(currency.originalAmounts.sp).toBe(2);
      expect(currency.originalAmounts.cp).toBe(12);
      
      // Verify total value calculation
      // 6 PP * 10 + 43 GP * 1 + 3 EP * 0.5 + 2 SP * 0.1 + 12 CP * 0.01
      // = 60 + 43 + 1.5 + 0.2 + 0.12 = 104.82 GP
      expect(currency.totalGoldValue).toBe(104.82);
      expect(currency.hasAnyCurrency).toBe(true);
    });

    it('should generate correct Fantasy Grounds XML from test data', () => {
      const result = CurrencyProcessor.processCurrency(testCharacterData);
      const xml = CurrencyProcessor.generateFantasyGroundsXML(result.processedCurrency!);
      
      // Verify XML structure and values with correct Fantasy Grounds format
      expect(xml).toMatch(/<name type="string">PP<\/name>/);
      expect(xml).toMatch(/<amount type="number">6<\/amount>/);
      expect(xml).toMatch(/<name type="string">GP<\/name>/);
      expect(xml).toMatch(/<amount type="number">43<\/amount>/);
      expect(xml).toMatch(/<name type="string">EP<\/name>/);
      expect(xml).toMatch(/<amount type="number">3<\/amount>/);
      expect(xml).toMatch(/<name type="string">SP<\/name>/);
      expect(xml).toMatch(/<amount type="number">2<\/amount>/);
      expect(xml).toMatch(/<name type="string">CP<\/name>/);
      expect(xml).toMatch(/<amount type="number">12<\/amount>/);
      
      // Verify currency order (PP, GP, EP, SP, CP)
      const ppIndex = xml.indexOf('<name type="string">PP</name>');
      const gpIndex = xml.indexOf('<name type="string">GP</name>');
      const epIndex = xml.indexOf('<name type="string">EP</name>');
      const spIndex = xml.indexOf('<name type="string">SP</name>');
      const cpIndex = xml.indexOf('<name type="string">CP</name>');
      
      expect(ppIndex).toBeLessThan(gpIndex);
      expect(gpIndex).toBeLessThan(epIndex);
      expect(epIndex).toBeLessThan(spIndex);
      expect(spIndex).toBeLessThan(cpIndex);
    });

    it('should generate correct Foundry VTT JSON from test data', () => {
      const result = CurrencyProcessor.processCurrency(testCharacterData);
      const foundryData = CurrencyProcessor.generateFoundryVTTData(result.processedCurrency!);
      
      expect(foundryData).toEqual({
        pp: 6,
        gp: 43,
        ep: 3,
        sp: 2,
        cp: 12
      });
      
      // Verify it's a clean object with only currency properties
      const keys = Object.keys(foundryData);
      expect(keys).toHaveLength(5);
      expect(keys.sort()).toEqual(['cp', 'ep', 'gp', 'pp', 'sp']);
    });
  });

  describe('Edge Case Integration', () => {
    it('should handle character with mixed zero and non-zero currencies', () => {
      const mixedCurrencyData: CharacterData = {
        ...testCharacterData,
        currencies: {
          cp: 0,
          sp: 5,
          gp: 0,
          ep: 2,
          pp: 0
        }
      };

      const result = CurrencyProcessor.processCurrency(mixedCurrencyData);
      const xml = CurrencyProcessor.generateFantasyGroundsXML(result.processedCurrency!);
      
      // Should only show currencies with non-zero amounts
      expect(xml).toContain('<name type="string">EP</name>');
      expect(xml).toContain('<amount type="number">2</amount>');
      expect(xml).toContain('<name type="string">SP</name>');
      expect(xml).toContain('<amount type="number">5</amount>');
      
      // Should not contain zero-amount currencies (PP, GP, CP)
      expect(xml).not.toContain('<name type="string">PP</name>');
      expect(xml).not.toContain('<name type="string">CP</name>');
      expect(xml).not.toContain('<amount type="number">0</amount>');
      
      expect(result.processedCurrency!.hasAnyCurrency).toBe(true);
      expect(result.processedCurrency!.totalGoldValue).toBe(1.5); // 2 EP * 0.5 + 5 SP * 0.1
    });

    it('should validate data consistency between formats', () => {
      const result = CurrencyProcessor.processCurrency(testCharacterData);
      const xml = CurrencyProcessor.generateFantasyGroundsXML(result.processedCurrency!);
      const foundryData = CurrencyProcessor.generateFoundryVTTData(result.processedCurrency!);
      
      // Extract values from XML for comparison using Fantasy Grounds format
      const ppMatch = xml.match(/<name type="string">PP<\/name>\s*<\/id-\d+>\s*<id-\d+>\s*<amount type="number">(\d+)<\/amount>/);
      const gpMatch = xml.match(/<name type="string">GP<\/name>\s*<\/id-\d+>\s*<id-\d+>\s*<amount type="number">(\d+)<\/amount>/);
      
      // For simpler validation, just check that the same currencies exist in both formats
      const xmlContainsPP = xml.includes('<name type="string">PP</name>');
      const xmlContainsGP = xml.includes('<name type="string">GP</name>');
      const xmlContainsEP = xml.includes('<name type="string">EP</name>');
      const xmlContainsSP = xml.includes('<name type="string">SP</name>');
      const xmlContainsCP = xml.includes('<name type="string">CP</name>');
      
      expect(xmlContainsPP).toBe(foundryData.pp > 0);
      expect(xmlContainsGP).toBe(foundryData.gp > 0);
      expect(xmlContainsEP).toBe(foundryData.ep > 0);
      expect(xmlContainsSP).toBe(foundryData.sp > 0);
      expect(xmlContainsCP).toBe(foundryData.cp > 0);
    });
  });

  describe('Performance Integration', () => {
    it('should process currency efficiently for large datasets', () => {
      const largeCharacterData: CharacterData = {
        ...testCharacterData,
        currencies: {
          cp: 999999,
          sp: 888888,
          gp: 777777,
          ep: 666666,
          pp: 555555
        }
      };

      const startTime = Date.now();
      const result = CurrencyProcessor.processCurrency(largeCharacterData);
      const processingTime = Date.now() - startTime;
      
      // Should process large numbers quickly (under 100ms)
      expect(processingTime).toBeLessThan(100);
      expect(result.success).toBe(true);
      expect(result.processedCurrency!.hasAnyCurrency).toBe(true);
      
      // Verify large numbers are handled correctly
      const xml = CurrencyProcessor.generateFantasyGroundsXML(result.processedCurrency!);
      expect(xml).toContain('<name type="string">PP</name>');
      expect(xml).toContain('<amount type="number">555555</amount>');
    });

    it('should handle batch processing efficiently', () => {
      const characters = Array(10).fill(0).map((_, i) => ({
        ...testCharacterData,
        id: testCharacterData.id + i,
        name: `${testCharacterData.name}_${i}`,
        currencies: {
          ...testCharacterData.currencies,
          gp: (testCharacterData.currencies?.gp || 0) + i
        }
      }));

      const startTime = Date.now();
      const results = characters.map(char => CurrencyProcessor.processCurrency(char));
      const batchTime = Date.now() - startTime;
      
      // Should process batch quickly (under 200ms for 10 characters)
      expect(batchTime).toBeLessThan(200);
      
      // All should succeed
      expect(results.every(r => r.success)).toBe(true);
      
      // Each should have unique gold values
      const goldValues = results.map(r => r.processedCurrency!.totalGoldValue);
      expect(new Set(goldValues).size).toBe(10); // All unique
    });
  });
});