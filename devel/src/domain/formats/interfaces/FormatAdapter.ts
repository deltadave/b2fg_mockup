/**
 * Format Adapter Interface
 * 
 * Defines the contract for converting D&D Beyond character data to different VTT formats.
 * Each format adapter implements this interface to provide consistent conversion capabilities.
 */

import type { CharacterData } from '@/domain/character/services/CharacterFetcher';

export interface FormatCapability {
  /** Feature identifier (e.g., 'spells', 'equipment', 'class_features') */
  feature: string;
  /** Support level: 'full', 'partial', 'none' */
  support: 'full' | 'partial' | 'none';
  /** Description of limitations for partial/none support */
  limitations?: string;
  /** Impact on character functionality */
  impact?: 'low' | 'medium' | 'high';
}

export interface FormatMetadata {
  /** Format identifier */
  id: string;
  /** Display name */
  name: string;
  /** Short description */
  description: string;
  /** File extension for exports */
  fileExtension: string;
  /** MIME type for downloads */
  mimeType: string;
  /** Version of the format specification */
  version: string;
  /** URL to format documentation */
  documentationUrl?: string;
  /** Official website */
  website?: string;
}

export interface ConversionOptions {
  /** Include debug information in output */
  includeDebugInfo?: boolean;
  /** Format version to target */
  targetVersion?: string;
  /** Additional format-specific options */
  formatOptions?: Record<string, any>;
}

export interface ConversionResult {
  /** Whether conversion was successful */
  success: boolean;
  /** Converted data (format-specific) */
  data?: string | object;
  /** Error message if conversion failed */
  error?: string;
  /** Warnings about data loss or limitations */
  warnings?: string[];
  /** Performance metrics */
  performance?: {
    conversionTime: number;
    dataSize: number;
  };
}

export interface CompatibilityAnalysis {
  /** Overall compatibility score (0-100) */
  score: number;
  /** Feature-by-feature compatibility breakdown */
  capabilities: FormatCapability[];
  /** Overall recommendation */
  recommendation: 'excellent' | 'good' | 'fair' | 'poor';
  /** Summary of major limitations */
  limitations: string[];
  /** Estimated data loss percentage */
  dataLoss: number;
}

/**
 * Base interface for all format adapters
 */
export interface FormatAdapter {
  /** Format metadata */
  getMetadata(): FormatMetadata;
  
  /** Analyze compatibility for a specific character */
  analyzeCompatibility(characterData: CharacterData): Promise<CompatibilityAnalysis>;
  
  /** Convert character data to target format */
  convert(characterData: CharacterData, options?: ConversionOptions): Promise<ConversionResult>;
  
  /** Get list of supported features */
  getSupportedFeatures(): FormatCapability[];
  
  /** Validate if character data can be converted */
  canConvert(characterData: CharacterData): boolean;
  
  /** Get format-specific conversion options */
  getConversionOptions?(): Record<string, any>;
}

/**
 * Registry for format adapters
 */
export interface FormatAdapterRegistry {
  /** Register a new format adapter */
  register(adapter: FormatAdapter): void;
  
  /** Get adapter by format ID */
  getAdapter(formatId: string): FormatAdapter | undefined;
  
  /** Get all registered adapters */
  getAllAdapters(): FormatAdapter[];
  
  /** Get adapters sorted by compatibility score for a character */
  getAdaptersByCompatibility(characterData: CharacterData): Promise<Array<{
    adapter: FormatAdapter;
    compatibility: CompatibilityAnalysis;
  }>>;
}