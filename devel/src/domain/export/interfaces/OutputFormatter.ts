/**
 * OutputFormatter Interface
 * 
 * Defines the contract for generating different character export formats.
 * Implementations should use existing processed character data rather than
 * recalculating values.
 */

import type { CharacterData } from '../../character/services/CharacterFetcher';

export interface FormatOptions {
  includeDescription?: boolean;
  includeNotes?: boolean;
  spellFormat?: 'grouped' | 'individual';
  featureDetail?: 'full' | 'summary';
  imageHandling?: 'embed' | 'reference' | 'skip';
}

export interface FormatResult {
  success: boolean;
  output?: string;
  filename?: string;
  mimeType?: string;
  errors?: FormatError[];
  warnings?: FormatWarning[];
}

export interface FormatError {
  type: string;
  message: string;
  field?: string;
}

export interface FormatWarning {
  type: string;
  message: string;
  field?: string;
}

export interface ProcessedCharacterData {
  characterData: CharacterData;
  abilities?: any;
  spellSlots?: any;
  inventory?: any;
  features?: any;
  totalLevel?: number;
  proficiencyBonus?: number;
}

/**
 * Base interface for output formatters
 */
export interface OutputFormatter {
  readonly format: string;
  readonly version: string;
  readonly supportedFeatures: string[];
  
  generateOutput(
    processedData: ProcessedCharacterData, 
    options?: FormatOptions
  ): Promise<FormatResult>;
  
  validateOutput(output: string): Promise<{isValid: boolean; errors?: string[]}>;
  getDefaultOptions(): FormatOptions;
  getSampleOutput(): Promise<string>;
}

/**
 * Format metadata for UI display
 */
export interface FormatInfo {
  format: string;
  name: string;
  description: string;
  version: string;
  supportedFeatures: string[];
  fileExtension: string;
  mimeType: string;
  icon: string;
}