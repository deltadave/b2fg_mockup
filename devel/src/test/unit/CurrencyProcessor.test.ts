/**
 * CurrencyProcessor Unit Tests
 * 
 * Comprehensive test suite for the CurrencyProcessor service following the
 * testing patterns established in the codebase.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CurrencyProcessor, type CurrencyAmounts, type ProcessedCurrency } from '../../domain/character/services/CurrencyProcessor';
import type { CharacterData } from '../../domain/character/services/CharacterFetcher';

// Test data setup
const mockCharacterWithCurrency: Partial<CharacterData> = {
  id: 151483095,
  name: 'TestCharacter2',
  currencies: {
    cp: 12,
    sp: 2,
    gp: 43,
    ep: 3,
    pp: 6
  }
};

const mockCharacterNoCurrency: Partial<CharacterData> = {
  id: 123456789,
  name: 'TestCharacterEmpty'
};

const mockCharacterInvalidCurrency: Partial<CharacterData> = {
  id: 123456790,
  name: 'TestCharacterInvalid',
  currencies: {
    cp: -5,        // Negative value should be corrected
    sp: 2.7,       // Fractional value should be rounded
    gp: 'invalid', // Invalid type should be handled
    ep: null,      // Null value should be handled
    pp: undefined  // Undefined value should be handled
  }
};

const mockCharacterEmptyData: null = null;

describe('CurrencyProcessor', () => {
  beforeEach(() => {
    // Reset debug mode before each test
    CurrencyProcessor.setDebugMode(false);
  });

  describe('processCurrency', () => {
    it('should process valid currency data correctly', () => {
      const result = CurrencyProcessor.processCurrency(mockCharacterWithCurrency as CharacterData);
      
      expect(result.success).toBe(true);
      expect(result.processedCurrency).toBeDefined();
      
      const currency = result.processedCurrency!;
      expect(currency.originalAmounts.cp).toBe(12);
      expect(currency.originalAmounts.sp).toBe(2);
      expect(currency.originalAmounts.gp).toBe(43);
      expect(currency.originalAmounts.ep).toBe(3);
      expect(currency.originalAmounts.pp).toBe(6);
      expect(currency.hasAnyCurrency).toBe(true);
    });

    it('should calculate total gold value correctly', () => {
      const result = CurrencyProcessor.processCurrency(mockCharacterWithCurrency as CharacterData);
      
      expect(result.success).toBe(true);
      const currency = result.processedCurrency!;
      
      // Expected calculation:
      // 6 PP * 10 GP/PP = 60 GP
      // 43 GP * 1 GP/GP = 43 GP
      // 3 EP * 0.5 GP/EP = 1.5 GP
      // 2 SP * 0.1 GP/SP = 0.2 GP
      // 12 CP * 0.01 GP/CP = 0.12 GP
      // Total = 60 + 43 + 1.5 + 0.2 + 0.12 = 104.82 GP
      expect(currency.totalGoldValue).toBe(104.82);
      expect(currency.totalCopperValue).toBe(10482); // 104.82 * 100
    });

    it('should handle characters with no currency', () => {
      const result = CurrencyProcessor.processCurrency(mockCharacterNoCurrency as CharacterData);
      
      expect(result.success).toBe(true);
      expect(result.processedCurrency).toBeDefined();
      
      const currency = result.processedCurrency!;
      expect(currency.hasAnyCurrency).toBe(false);
      expect(currency.totalGoldValue).toBe(0);
      expect(currency.totalCopperValue).toBe(0);
      
      // All currency amounts should be 0
      expect(currency.originalAmounts.pp).toBe(0);
      expect(currency.originalAmounts.gp).toBe(0);
      expect(currency.originalAmounts.ep).toBe(0);
      expect(currency.originalAmounts.sp).toBe(0);
      expect(currency.originalAmounts.cp).toBe(0);
    });

    it('should handle invalid currency values with warnings', () => {
      const result = CurrencyProcessor.processCurrency(mockCharacterInvalidCurrency as CharacterData);
      
      expect(result.success).toBe(true);
      expect(result.processedCurrency).toBeDefined();
      expect(result.warnings).toBeDefined();
      expect(result.warnings!.length).toBeGreaterThan(0);
      
      const currency = result.processedCurrency!;
      
      // Invalid values should be corrected
      expect(currency.originalAmounts.cp).toBe(0);  // Negative corrected to 0
      expect(currency.originalAmounts.sp).toBe(2);  // Fractional rounded down
      expect(currency.originalAmounts.gp).toBe(0);  // Invalid string becomes 0
      expect(currency.originalAmounts.ep).toBe(0);  // Null becomes 0
      expect(currency.originalAmounts.pp).toBe(0);  // Undefined becomes 0
      
      // Should contain warnings about the corrections
      const warningsText = result.warnings!.join(' ');
      expect(warningsText).toContain('Negative cp value');
      expect(warningsText).toContain('Fractional sp value');
    });

    it('should handle null character data gracefully', () => {
      const result = CurrencyProcessor.processCurrency(mockCharacterEmptyData as any);
      
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors![0]).toContain('Character data is null or undefined');
    });

    it('should include debug information', () => {
      const result = CurrencyProcessor.processCurrency(mockCharacterWithCurrency as CharacterData);
      
      expect(result.success).toBe(true);
      const currency = result.processedCurrency!;
      
      expect(currency.debugInfo).toBeDefined();
      expect(currency.debugInfo.originalData).toEqual(mockCharacterWithCurrency.currencies);
      expect(currency.debugInfo.conversionRates).toBeDefined();
      expect(currency.debugInfo.processedCount).toBe(5); // 5 currency types
    });
  });

  describe('generateFantasyGroundsXML', () => {
    it('should generate correct XML for character with currency', () => {
      const result = CurrencyProcessor.processCurrency(mockCharacterWithCurrency as CharacterData);
      const xml = CurrencyProcessor.generateFantasyGroundsXML(result.processedCurrency!);
      
      // Check for correct Fantasy Grounds XML structure with id-XXXXX entries
      expect(xml).toContain('<id-00001>');
      expect(xml).toContain('<name type="string">PP</name>');
      expect(xml).toContain('<amount type="number">6</amount>');
      
      expect(xml).toContain('<id-00002>');
      expect(xml).toContain('<name type="string">GP</name>');
      expect(xml).toContain('<amount type="number">43</amount>');
      
      expect(xml).toContain('<id-00003>');
      expect(xml).toContain('<name type="string">EP</name>');
      expect(xml).toContain('<amount type="number">3</amount>');
      
      expect(xml).toContain('<id-00004>');
      expect(xml).toContain('<name type="string">SP</name>');
      expect(xml).toContain('<amount type="number">2</amount>');
      
      expect(xml).toContain('<id-00005>');
      expect(xml).toContain('<name type="string">CP</name>');
      expect(xml).toContain('<amount type="number">12</amount>');
      
      // Check that currency appears in the correct order (PP, GP, EP, SP, CP)
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

    it('should generate empty currency XML for character with no currency', () => {
      const result = CurrencyProcessor.processCurrency(mockCharacterNoCurrency as CharacterData);
      const xml = CurrencyProcessor.generateFantasyGroundsXML(result.processedCurrency!);
      
      // Should generate a single entry with 0 GP when no currency exists
      expect(xml).toContain('<id-00001>');
      expect(xml).toContain('<amount type="number">0</amount>');
      expect(xml).toContain('<name type="string">GP</name>');
      expect(xml).toContain('</id-00001>');
    });

    it('should handle malformed processed currency gracefully', () => {
      const malformedCurrency = {} as ProcessedCurrency;
      
      // Should not throw and should return safe fallback XML
      const xml = CurrencyProcessor.generateFantasyGroundsXML(malformedCurrency);
      
      expect(xml).toContain('<id-00001>');
      expect(xml).toContain('<amount type="number">0</amount>');
      expect(xml).toContain('<name type="string">GP</name>');
      expect(xml).toContain('</id-00001>');
    });
  });

  describe('generateFoundryVTTData', () => {
    it('should generate correct Foundry VTT data', () => {
      const result = CurrencyProcessor.processCurrency(mockCharacterWithCurrency as CharacterData);
      const foundryData = CurrencyProcessor.generateFoundryVTTData(result.processedCurrency!);
      
      expect(foundryData).toEqual({
        pp: 6,
        gp: 43,
        ep: 3,
        sp: 2,
        cp: 12
      });
    });

    it('should handle empty currency for Foundry VTT', () => {
      const result = CurrencyProcessor.processCurrency(mockCharacterNoCurrency as CharacterData);
      const foundryData = CurrencyProcessor.generateFoundryVTTData(result.processedCurrency!);
      
      expect(foundryData).toEqual({
        pp: 0,
        gp: 0,
        ep: 0,
        sp: 0,
        cp: 0
      });
    });

    it('should handle malformed processed currency gracefully', () => {
      const malformedCurrency = {} as ProcessedCurrency;
      
      // Should not throw and should return safe fallback data
      const foundryData = CurrencyProcessor.generateFoundryVTTData(malformedCurrency);
      
      expect(foundryData).toEqual({
        pp: 0,
        gp: 0,
        ep: 0,
        sp: 0,
        cp: 0
      });
    });
  });

  describe('validateCharacterData', () => {
    it('should validate valid character data', () => {
      const validation = CurrencyProcessor.validateCharacterData(mockCharacterWithCurrency);
      
      expect(validation.isValid).toBe(true);
      expect(validation.issues).toHaveLength(0);
    });

    it('should handle null character data', () => {
      const validation = CurrencyProcessor.validateCharacterData(null);
      
      expect(validation.isValid).toBe(false);
      expect(validation.issues).toContain('Character data is null or undefined');
    });

    it('should warn about missing currencies', () => {
      const validation = CurrencyProcessor.validateCharacterData(mockCharacterNoCurrency);
      
      expect(validation.isValid).toBe(true);
      expect(validation.warnings).toContain('No currencies found in character data - will use zero values');
    });

    it('should warn about invalid currency structure', () => {
      const invalidCharacter = {
        id: 123,
        name: 'Test',
        currencies: 'invalid'  // Should be object
      };
      
      const validation = CurrencyProcessor.validateCharacterData(invalidCharacter);
      
      expect(validation.isValid).toBe(true);
      expect(validation.warnings).toContain('Character currencies is not an object - will use empty currency data');
    });

    it('should warn about unknown currency denominations', () => {
      const characterWithUnknownCurrency = {
        id: 123,
        name: 'Test',
        currencies: {
          gp: 10,
          ap: 5  // Unknown denomination
        }
      };
      
      const validation = CurrencyProcessor.validateCharacterData(characterWithUnknownCurrency);
      
      expect(validation.isValid).toBe(true);
      expect(validation.warnings.some(w => w.includes('Unknown currency denomination'))).toBe(true);
    });
  });

  describe('processLegacyFormat', () => {
    it('should return legacy format for valid currency', () => {
      const legacyData = CurrencyProcessor.processLegacyFormat(mockCharacterWithCurrency);
      
      expect(legacyData).toEqual({
        pp: 6,
        gp: 43,
        ep: 3,
        sp: 2,
        cp: 12,
        totalGoldValue: 104.82
      });
    });

    it('should return zero values for failed processing', () => {
      const legacyData = CurrencyProcessor.processLegacyFormat(null);
      
      expect(legacyData).toEqual({
        pp: 0,
        gp: 0,
        ep: 0,
        sp: 0,
        cp: 0,
        totalGoldValue: 0
      });
    });
  });

  describe('debug mode', () => {
    it('should enable debug mode', () => {
      CurrencyProcessor.setDebugMode(true);
      
      // Capture console output
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      CurrencyProcessor.processCurrency(mockCharacterWithCurrency as CharacterData);
      
      // Should have logged debug information
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('CurrencyProcessor: Processing currency data')
      );
      
      consoleSpy.mockRestore();
    });

    it('should disable debug mode', () => {
      CurrencyProcessor.setDebugMode(false);
      
      // Capture console output
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      CurrencyProcessor.processCurrency(mockCharacterWithCurrency as CharacterData);
      
      // Should not have logged debug information
      expect(consoleSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('CurrencyProcessor: Processing currency data')
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('error handling', () => {
    it('should handle processing errors gracefully', () => {
      // Mock a scenario that could cause processing errors
      const characterWithMalformedData = {
        id: 123,
        name: 'Test',
        currencies: {
          get gp() {
            throw new Error('Test error');
          }
        }
      };
      
      const result = CurrencyProcessor.processCurrency(characterWithMalformedData as any);
      
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors![0]).toContain('Currency processing failed');
    });
  });

  describe('integration scenarios', () => {
    it('should handle real D&D Beyond character data structure', () => {
      const realCharacterData = {
        id: 151483095,
        name: 'TestCharacter2',
        currencies: {
          cp: 12,
          sp: 2,
          gp: 43,
          ep: 3,
          pp: 6
        },
        // Include other properties that might exist in real data
        classes: [],
        stats: [],
        inventory: []
      };
      
      const result = CurrencyProcessor.processCurrency(realCharacterData as CharacterData);
      
      expect(result.success).toBe(true);
      expect(result.processedCurrency!.hasAnyCurrency).toBe(true);
      
      // Test both output formats
      const fgXml = CurrencyProcessor.generateFantasyGroundsXML(result.processedCurrency!);
      const foundryData = CurrencyProcessor.generateFoundryVTTData(result.processedCurrency!);
      
      expect(fgXml).toContain('<name type="string">GP</name>');
      expect(fgXml).toContain('<amount type="number">43</amount>');
      expect(foundryData.gp).toBe(43);
    });

    it('should handle edge case of all zero currencies', () => {
      const characterWithZeroCurrencies = {
        id: 123,
        name: 'Test',
        currencies: {
          cp: 0,
          sp: 0,
          gp: 0,
          ep: 0,
          pp: 0
        }
      };
      
      const result = CurrencyProcessor.processCurrency(characterWithZeroCurrencies as CharacterData);
      
      expect(result.success).toBe(true);
      expect(result.processedCurrency!.hasAnyCurrency).toBe(false);
      expect(result.processedCurrency!.totalGoldValue).toBe(0);
    });

    it('should handle very large currency values', () => {
      const characterWithLargeCurrencies = {
        id: 123,
        name: 'Test',
        currencies: {
          cp: 999999,
          sp: 888888,
          gp: 777777,
          ep: 666666,
          pp: 555555
        }
      };
      
      const result = CurrencyProcessor.processCurrency(characterWithLargeCurrencies as CharacterData);
      
      expect(result.success).toBe(true);
      expect(result.processedCurrency!.hasAnyCurrency).toBe(true);
      expect(result.processedCurrency!.totalGoldValue).toBeGreaterThan(0);
      
      // Should handle large numbers without overflow
      const xml = CurrencyProcessor.generateFantasyGroundsXML(result.processedCurrency!);
      expect(xml).toContain('<name type="string">PP</name>');
      expect(xml).toContain('<amount type="number">555555</amount>');
    });
  });
});