/**
 * Format Registry System
 * 
 * Manages available output formatters and provides a unified interface
 * for format discovery and execution.
 */

import type { OutputFormatter, FormatInfo, ProcessedCharacterData, FormatOptions, FormatResult } from '../interfaces/OutputFormatter';
import { FoundryVTTJSONFormatter } from '../formatters/FoundryVTTJSONFormatter';
import { Roll205eDefaultJSONFormatter } from '../formatters/Roll20JSONFormatter';
import { FantasyGroundsXMLFormatter } from '../formatters/FantasyGroundsXMLFormatter';
import { GenericJSONFormatter } from '../formatters/GenericJSONFormatter';

export class FormatRegistry {
  private formatters = new Map<string, OutputFormatter>();
  private formatInfoCache = new Map<string, FormatInfo>();

  constructor() {
    this.initializeDefaultFormatters();
  }

  private initializeDefaultFormatters(): void {
    // Register available formatters
    this.register(new FantasyGroundsXMLFormatter());
    this.register(new FoundryVTTJSONFormatter());
    this.register(new Roll205eDefaultJSONFormatter());
    this.register(new GenericJSONFormatter());
  }

  /**
   * Register a new output formatter
   */
  register(formatter: OutputFormatter): void {
    this.formatters.set(formatter.format, formatter);
    
    // Clear cache for this format
    this.formatInfoCache.delete(formatter.format);
    
    console.log(`📋 Registered output formatter: ${formatter.format} v${formatter.version}`);
  }

  /**
   * Get a specific formatter by format ID
   */
  getFormatter(format: string): OutputFormatter {
    const formatter = this.formatters.get(format);
    if (!formatter) {
      throw new Error(`Unknown output format: ${format}`);
    }
    return formatter;
  }

  /**
   * Check if a format is supported
   */
  isFormatSupported(format: string): boolean {
    return this.formatters.has(format);
  }

  /**
   * Get all supported format information
   */
  getSupportedFormats(): FormatInfo[] {
    return Array.from(this.formatters.values()).map(formatter => this.getFormatInfo(formatter));
  }

  /**
   * Get format information for a specific formatter
   */
  private getFormatInfo(formatter: OutputFormatter): FormatInfo {
    const cached = this.formatInfoCache.get(formatter.format);
    if (cached) {
      return cached;
    }

    const info: FormatInfo = {
      format: formatter.format,
      name: this.getFormatDisplayName(formatter.format),
      description: this.getFormatDescription(formatter.format),
      version: formatter.version,
      supportedFeatures: formatter.supportedFeatures,
      fileExtension: this.getFileExtension(formatter.format),
      mimeType: this.getMimeType(formatter.format),
      icon: this.getFormatIcon(formatter.format)
    };

    this.formatInfoCache.set(formatter.format, info);
    return info;
  }

  /**
   * Generate output for a specific format
   */
  async generateOutput(
    format: string,
    processedData: ProcessedCharacterData,
    options?: FormatOptions
  ): Promise<FormatResult> {
    const formatter = this.getFormatter(format);
    
    console.log(`🔄 Generating ${format} output for character: ${processedData.characterData.name}`);
    
    try {
      const result = await formatter.generateOutput(processedData, options);
      
      if (result.success) {
        console.log(`✅ Successfully generated ${format} output`);
      } else {
        console.error(`❌ Failed to generate ${format} output:`, result.errors);
      }
      
      return result;
    } catch (error) {
      console.error(`💥 Error generating ${format} output:`, error);
      return {
        success: false,
        errors: [{
          type: 'generation_error',
          message: error instanceof Error ? error.message : 'Unknown error occurred'
        }]
      };
    }
  }

  /**
   * Validate format support for required features
   */
  validateFormatSupport(format: string, requiredFeatures: string[]): boolean {
    const formatter = this.formatters.get(format);
    if (!formatter) return false;

    return requiredFeatures.every(feature => 
      formatter.supportedFeatures.includes(feature)
    );
  }

  /**
   * Get compatibility information for a character with different formats
   */
  getFormatCompatibility(processedData: ProcessedCharacterData): Map<string, FormatCompatibilityInfo> {
    const compatibility = new Map<string, FormatCompatibilityInfo>();
    
    for (const [formatId, formatter] of this.formatters) {
      const info = this.analyzeCompatibility(processedData, formatter);
      compatibility.set(formatId, info);
    }
    
    return compatibility;
  }

  private analyzeCompatibility(
    processedData: ProcessedCharacterData, 
    formatter: OutputFormatter
  ): FormatCompatibilityInfo {
    const character = processedData.characterData;
    const warnings: string[] = [];
    let score = 100;

    // Check for multiclass characters
    const classes = character.classes || [];
    if (classes.length > 1) {
      if (!formatter.supportedFeatures.includes('multiclass')) {
        warnings.push('Multiclass characters may not be fully supported');
        score -= 20;
      }
    }

    // Check for spells
    const hasSpells = (character.spells?.class?.length || 0) > 0;
    if (hasSpells && !formatter.supportedFeatures.includes('spells')) {
      warnings.push('Spells may not be included');
      score -= 15;
    }

    // Check for complex features
    const hasFeatures = (character.classFeatures?.length || 0) > 0;
    if (hasFeatures && !formatter.supportedFeatures.includes('features')) {
      warnings.push('Class features may be simplified');
      score -= 10;
    }

    // Determine recommendation level
    let recommendation: 'excellent' | 'good' | 'fair' | 'poor';
    if (score >= 90) recommendation = 'excellent';
    else if (score >= 75) recommendation = 'good';
    else if (score >= 60) recommendation = 'fair';
    else recommendation = 'poor';

    return {
      score,
      recommendation,
      warnings,
      dataLoss: Math.max(0, 100 - score)
    };
  }

  private getFormatDisplayName(format: string): string {
    const names: {[key: string]: string} = {
      'foundry-vtt-json': 'Foundry VTT',
      'fantasy-grounds-xml': 'Fantasy Grounds',
      'roll20-5e-default-json': 'Roll20 5e Default',
      'generic-json': 'Generic JSON'
    };
    return names[format] || format;
  }

  private getFormatDescription(format: string): string {
    const descriptions: {[key: string]: string} = {
      'foundry-vtt-json': 'JSON format for Foundry Virtual Tabletop D&D 5e system',
      'fantasy-grounds-xml': 'XML format for Fantasy Grounds Unity and Classic',
      'roll20-5e-default-json': 'JSON character sheet format for Roll20 D&D 5e Default sheet',
      'generic-json': 'Raw character data in JSON format'
    };
    return descriptions[format] || 'Character export format';
  }

  private getFileExtension(format: string): string {
    const extensions: {[key: string]: string} = {
      'foundry-vtt-json': '.json',
      'fantasy-grounds-xml': '.xml',
      'roll20-5e-default-json': '.json',
      'generic-json': '.json'
    };
    return extensions[format] || '.txt';
  }

  private getMimeType(format: string): string {
    const mimeTypes: {[key: string]: string} = {
      'foundry-vtt-json': 'application/json',
      'fantasy-grounds-xml': 'application/xml',
      'roll20-5e-default-json': 'application/json',
      'generic-json': 'application/json'
    };
    return mimeTypes[format] || 'text/plain';
  }

  private getFormatIcon(format: string): string {
    const icons: {[key: string]: string} = {
      'foundry-vtt-json': '⚒️',
      'fantasy-grounds-xml': '🏰',
      'roll20-5e-default-json': '🎲',
      'generic-json': '📄'
    };
    return icons[format] || '📁';
  }

  /**
   * Get list of format IDs only
   */
  getAvailableFormats(): string[] {
    return Array.from(this.formatters.keys());
  }

  /**
   * Get default options for a specific format
   */
  getDefaultOptions(format: string): FormatOptions {
    const formatter = this.getFormatter(format);
    return formatter.getDefaultOptions();
  }

  /**
   * Validate output for a specific format
   */
  async validateOutput(format: string, output: string): Promise<{isValid: boolean; errors?: string[]}> {
    const formatter = this.getFormatter(format);
    return formatter.validateOutput(output);
  }
}

export interface FormatCompatibilityInfo {
  score: number; // 0-100
  recommendation: 'excellent' | 'good' | 'fair' | 'poor';
  warnings: string[];
  dataLoss: number; // 0-100 percentage
}

// Export singleton instance
export const formatRegistry = new FormatRegistry();

console.log('📋 Format Registry initialized with formatters:', formatRegistry.getAvailableFormats());