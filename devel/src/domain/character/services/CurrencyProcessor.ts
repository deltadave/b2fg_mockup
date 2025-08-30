/**
 * CurrencyProcessor Service
 * 
 * Modern currency processing service that handles D&D Beyond currency data and converts it
 * to various output formats. Follows established patterns from AbilityScoreProcessor.
 * 
 * Handles coinage conversion from D&D Beyond JSON format to:
 * - Fantasy Grounds XML format
 * - Foundry VTT JSON format
 * - Total value calculations and optimized denominations
 */

import type { CharacterData } from './CharacterFetcher';
import { gameConfigService } from '../../../shared/services/GameConfigService';

export type CurrencyDenomination = 'pp' | 'gp' | 'ep' | 'sp' | 'cp';

export interface CurrencyAmounts {
  readonly pp: number;
  readonly gp: number;
  readonly ep: number;
  readonly sp: number;
  readonly cp: number;
}

export interface ProcessedCurrency {
  readonly originalAmounts: CurrencyAmounts;
  readonly totalGoldValue: number;
  readonly totalCopperValue: number;
  readonly hasAnyCurrency: boolean;
  readonly debugInfo: {
    readonly originalData: any;
    readonly conversionRates: Record<CurrencyDenomination, number>;
    readonly processedCount: number;
  };
}

export interface CurrencyProcessingResult {
  readonly success: boolean;
  readonly processedCurrency?: ProcessedCurrency;
  readonly warnings?: string[];
  readonly errors?: string[];
}

export class CurrencyProcessor {
  /**
   * Currency order for Fantasy Grounds XML generation (PP, GP, EP, SP, CP)
   */
  private static readonly CURRENCY_ORDER: readonly CurrencyDenomination[] = ['pp', 'gp', 'ep', 'sp', 'cp'] as const;
  
  /**
   * Default currency conversion rates (in gold pieces)
   * Loaded from currencies.json config or fallback values
   */
  private static readonly DEFAULT_CONVERSION_RATES: Record<CurrencyDenomination, number> = {
    pp: 10,    // 1 PP = 10 GP
    gp: 1,     // 1 GP = 1 GP (base)
    ep: 0.5,   // 1 EP = 0.5 GP
    sp: 0.1,   // 1 SP = 0.1 GP
    cp: 0.01   // 1 CP = 0.01 GP
  };

  /**
   * Enable or disable detailed debugging output
   */
  private static debugEnabled: boolean = false;

  /**
   * Set debug mode for detailed console output
   */
  static setDebugMode(enabled: boolean): void {
    this.debugEnabled = enabled;
  }

  /**
   * Process character currency data from D&D Beyond format
   * Following the pattern established by AbilityScoreProcessor.processAbilityScoreBonuses()
   * 
   * @param character - Character data from D&D Beyond
   * @returns Processing result with currency data and metadata
   */
  static processCurrency(character: CharacterData): CurrencyProcessingResult {
    if (this.debugEnabled) {
      console.log('CurrencyProcessor: Processing currency data...');
    }

    try {
      // Validate character data
      if (!character) {
        return {
          success: false,
          errors: ['Character data is null or undefined']
        };
      }

      // Extract currency data from character
      const currencies = character.currencies || {};
      
      if (this.debugEnabled) {
        console.log('Original currency data:', currencies);
      }

      // Load conversion rates from config
      const conversionRates = this.loadConversionRates();

      // Process currency amounts with validation
      const processedAmounts: CurrencyAmounts = {
        pp: Math.max(0, Math.floor(Number(currencies.pp) || 0)),
        gp: Math.max(0, Math.floor(Number(currencies.gp) || 0)),
        ep: Math.max(0, Math.floor(Number(currencies.ep) || 0)),
        sp: Math.max(0, Math.floor(Number(currencies.sp) || 0)),
        cp: Math.max(0, Math.floor(Number(currencies.cp) || 0))
      };

      // Calculate total values
      const totalGoldValue = this.calculateTotalGoldValue(processedAmounts, conversionRates);
      const totalCopperValue = Math.floor(totalGoldValue * 100);
      const hasAnyCurrency = totalGoldValue > 0;

      // Create processed currency result
      const processedCurrency: ProcessedCurrency = {
        originalAmounts: processedAmounts,
        totalGoldValue,
        totalCopperValue,
        hasAnyCurrency,
        debugInfo: {
          originalData: currencies,
          conversionRates,
          processedCount: Object.keys(currencies).length
        }
      };

      if (this.debugEnabled) {
        console.log('Processed currency:', {
          originalAmounts: processedAmounts,
          totalGoldValue,
          totalCopperValue,
          hasAnyCurrency
        });
      }

      return {
        success: true,
        processedCurrency,
        warnings: this.generateWarnings(currencies, processedAmounts)
      };

    } catch (error) {
      console.error('CurrencyProcessor: Processing error:', error);
      return {
        success: false,
        errors: [`Currency processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
      };
    }
  }

  /**
   * Generate Fantasy Grounds XML format for currency
   * Uses the correct Fantasy Grounds structure with id-XXXXX entries containing amount and name
   * 
   * @param processedCurrency - Processed currency data
   * @returns Fantasy Grounds XML string for currency section
   */
  static generateFantasyGroundsXML(processedCurrency: ProcessedCurrency): string {
    try {
      if (!processedCurrency.hasAnyCurrency) {
        // Return minimal currency structure when no currency exists
        // Fantasy Grounds expects at least one entry, so we'll add an empty GP entry
        return `      <id-00001>
        <amount type="number">0</amount>
        <name type="string">GP</name>
      </id-00001>`;
      }

      // Generate XML entries for each currency denomination with non-zero amounts
      const currencyEntries: string[] = [];
      let entryIndex = 1;

      // Process currencies in the correct order (PP, GP, EP, SP, CP)
      for (const denomination of this.CURRENCY_ORDER) {
        const amount = processedCurrency.originalAmounts[denomination];
        
        if (amount > 0) {
          const paddedIndex = String(entryIndex).padStart(5, '0');
          const displayName = denomination.toUpperCase();
          
          currencyEntries.push(`      <id-${paddedIndex}>
        <amount type="number">${amount}</amount>
        <name type="string">${displayName}</name>
      </id-${paddedIndex}>`);
          
          entryIndex++;
        }
      }

      // If no currencies have positive amounts, return a zero GP entry
      if (currencyEntries.length === 0) {
        return `      <id-00001>
        <amount type="number">0</amount>
        <name type="string">GP</name>
      </id-00001>`;
      }

      return currencyEntries.join('\n');

    } catch (error) {
      console.error('CurrencyProcessor: Fantasy Grounds XML generation error:', error);
      // Return safe fallback with correct Fantasy Grounds structure
      return `      <id-00001>
        <amount type="number">0</amount>
        <name type="string">GP</name>
      </id-00001>`;
    }
  }

  /**
   * Generate Foundry VTT JSON format for currency
   * 
   * @param processedCurrency - Processed currency data
   * @returns Currency object for Foundry VTT actor data
   */
  static generateFoundryVTTData(processedCurrency: ProcessedCurrency): Record<string, number> {
    try {
      if (!processedCurrency?.originalAmounts) {
        throw new Error('Invalid processed currency data');
      }
      
      return {
        pp: processedCurrency.originalAmounts.pp,
        gp: processedCurrency.originalAmounts.gp,
        ep: processedCurrency.originalAmounts.ep,
        sp: processedCurrency.originalAmounts.sp,
        cp: processedCurrency.originalAmounts.cp
      };
    } catch (error) {
      console.error('CurrencyProcessor: Foundry VTT data generation error:', error);
      // Return safe fallback
      return { pp: 0, gp: 0, ep: 0, sp: 0, cp: 0 };
    }
  }

  /**
   * Calculate total gold value of all currencies
   * 
   * @param currencies - Currency amounts
   * @param conversionRates - Conversion rates to gold
   * @returns Total value in gold pieces
   */
  private static calculateTotalGoldValue(
    currencies: CurrencyAmounts, 
    conversionRates: Record<CurrencyDenomination, number>
  ): number {
    let totalGold = 0;

    for (const [denomination, amount] of Object.entries(currencies)) {
      const rate = conversionRates[denomination as CurrencyDenomination] || 0;
      totalGold += amount * rate;
    }

    // Round to 2 decimal places to avoid floating point precision issues
    return Math.round(totalGold * 100) / 100;
  }

  /**
   * Load currency conversion rates from game configuration
   * Falls back to default rates if configuration is unavailable
   */
  private static loadConversionRates(): Record<CurrencyDenomination, number> {
    try {
      const currencyConfig = gameConfigService.getCurrencies();
      
      if (currencyConfig?.currencies) {
        const rates: Record<string, number> = {};
        
        // Convert config format to our internal format
        currencyConfig.currencies.forEach((currency: any) => {
          if (currency.name && currency.value !== undefined) {
            const denomKey = currency.name.toLowerCase();
            rates[denomKey] = Number(currency.value) || 0;
          }
        });

        // Return rates if we have all denominations
        if (rates.pp && rates.gp && rates.ep && rates.sp && rates.cp) {
          return rates as Record<CurrencyDenomination, number>;
        }
      }
    } catch (error) {
      if (this.debugEnabled) {
        console.warn('CurrencyProcessor: Failed to load currency config, using defaults:', error);
      }
    }

    // Return default rates
    return { ...this.DEFAULT_CONVERSION_RATES };
  }

  /**
   * Generate warnings for currency processing issues
   */
  private static generateWarnings(original: any, processed: CurrencyAmounts): string[] {
    const warnings: string[] = [];

    // Check for invalid values that were corrected
    for (const [key, value] of Object.entries(original)) {
      if (key in processed) {
        const originalValue = Number(value);
        const processedValue = processed[key as CurrencyDenomination];
        
        if (originalValue !== processedValue) {
          if (originalValue < 0) {
            warnings.push(`Negative ${key} value (${originalValue}) was set to 0`);
          } else if (!Number.isInteger(originalValue)) {
            warnings.push(`Fractional ${key} value (${originalValue}) was rounded to ${processedValue}`);
          }
        }
      }
    }

    return warnings;
  }

  /**
   * Validate character data structure for currency processing
   * Following the pattern from AbilityScoreProcessor.validateCharacterData()
   * 
   * @param character - Character data to validate
   * @returns Validation result with any issues found
   */
  static validateCharacterData(character: any): {
    isValid: boolean;
    issues: string[];
    warnings: string[];
  } {
    const issues: string[] = [];
    const warnings: string[] = [];

    if (!character) {
      issues.push('Character data is null or undefined');
      return { isValid: false, issues, warnings };
    }

    // Check currencies structure
    if (character.currencies) {
      if (typeof character.currencies !== 'object') {
        warnings.push('Character currencies is not an object - will use empty currency data');
      } else {
        // Check for valid currency denominations
        for (const [key, value] of Object.entries(character.currencies)) {
          if (!this.CURRENCY_ORDER.includes(key as CurrencyDenomination)) {
            warnings.push(`Unknown currency denomination '${key}' - will be ignored`);
          } else if (typeof value !== 'number' && value !== null && value !== undefined) {
            warnings.push(`Invalid currency value for ${key}: ${value} - will attempt conversion`);
          }
        }
      }
    } else {
      warnings.push('No currencies found in character data - will use zero values');
    }

    return {
      isValid: issues.length === 0,
      issues,
      warnings
    };
  }

  /**
   * Process currency for legacy format compatibility
   * Returns currency data in a format compatible with existing legacy code
   * 
   * @param character - Character data from D&D Beyond
   * @returns Currency data in legacy format
   */
  static processLegacyFormat(character: any): {
    pp: number;
    gp: number;
    ep: number;
    sp: number;
    cp: number;
    totalGoldValue: number;
  } {
    const result = this.processCurrency(character);
    
    if (!result.success || !result.processedCurrency) {
      return {
        pp: 0, gp: 0, ep: 0, sp: 0, cp: 0,
        totalGoldValue: 0
      };
    }

    const currency = result.processedCurrency;
    return {
      pp: currency.originalAmounts.pp,
      gp: currency.originalAmounts.gp,
      ep: currency.originalAmounts.ep,
      sp: currency.originalAmounts.sp,
      cp: currency.originalAmounts.cp,
      totalGoldValue: currency.totalGoldValue
    };
  }
}