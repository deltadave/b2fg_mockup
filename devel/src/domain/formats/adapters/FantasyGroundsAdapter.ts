/**
 * Fantasy Grounds Format Adapter
 * 
 * Adapter for the existing Fantasy Grounds XML conversion system.
 * Wraps the legacy conversion logic to provide compatibility with the new format system.
 */

import type { CharacterData } from '@/domain/character/services/CharacterFetcher';
import type { 
  FormatAdapter, 
  FormatMetadata, 
  CompatibilityAnalysis, 
  ConversionResult, 
  ConversionOptions, 
  FormatCapability 
} from '../interfaces/FormatAdapter';
import { compatibilityEngine } from '../CompatibilityEngine';

export class FantasyGroundsAdapter implements FormatAdapter {
  getMetadata(): FormatMetadata {
    return {
      id: 'fantasy-grounds',
      name: 'Fantasy Grounds',
      description: 'XML format for Fantasy Grounds Unity and Classic',
      fileExtension: 'xml',
      mimeType: 'application/xml',
      version: 'Unity/Classic',
      documentationUrl: 'https://www.fantasygrounds.com/home/home.php',
      website: 'https://www.fantasygrounds.com'
    };
  }

  getSupportedFeatures(): FormatCapability[] {
    return [
      { feature: 'abilities', support: 'full' },
      { feature: 'skills', support: 'full' },
      { feature: 'saving_throws', support: 'full' },
      { feature: 'spellcasting', support: 'full' },
      { feature: 'spell_slots', support: 'full' },
      { feature: 'weapons', support: 'full' },
      { feature: 'armor', support: 'full' },
      { feature: 'magic_items', support: 'full' },
      { feature: 'class_features', support: 'full' },
      { feature: 'racial_features', support: 'full' },
      { feature: 'feats', support: 'full' },
      { feature: 'homebrew_content', support: 'partial', limitations: 'Homebrew content may need manual review', impact: 'low' }
    ];
  }

  async analyzeCompatibility(characterData: CharacterData): Promise<CompatibilityAnalysis> {
    const features = compatibilityEngine.analyzeFeatures(characterData);
    const capabilities = this.getSupportedFeatures();
    
    return compatibilityEngine.generateCompatibilityAnalysis(characterData, capabilities);
  }

  canConvert(characterData: CharacterData): boolean {
    return !!(characterData.id && characterData.name && characterData.stats?.length);
  }

  async convert(characterData: CharacterData, options?: ConversionOptions): Promise<ConversionResult> {
    const startTime = performance.now();
    
    try {
      if (!this.canConvert(characterData)) {
        return {
          success: false,
          error: 'Character data is missing required fields for Fantasy Grounds conversion'
        };
      }

      // Use the existing CharacterConverterFacade for conversion
      const facade = (window as any).characterConverterFacade;
      if (!facade) {
        return {
          success: false,
          error: 'Fantasy Grounds converter not available'
        };
      }

      // The facade expects a character ID, but we have the data
      // We need to implement a direct data conversion method
      const result = await this.convertCharacterData(characterData, facade);
      
      if (!result.success) {
        return {
          success: false,
          error: result.error || 'Fantasy Grounds conversion failed'
        };
      }

      const conversionTime = performance.now() - startTime;

      return {
        success: true,
        data: result.xml,
        performance: {
          conversionTime: Math.round(conversionTime),
          dataSize: result.xml?.length || 0
        },
        warnings: this.generateWarnings(characterData)
      };

    } catch (error) {
      return {
        success: false,
        error: `Fantasy Grounds conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Convert character data directly using the facade's internal methods
   */
  private async convertCharacterData(characterData: CharacterData, facade: any): Promise<{success: boolean; xml?: string; error?: string}> {
    try {
      // Check if facade has a direct data conversion method
      if (typeof facade.convertCharacterData === 'function') {
        return await facade.convertCharacterData(characterData);
      }

      // Fallback: create a temporary character entry and use existing conversion
      // This is a simplified approach - in a full implementation, we'd want to
      // refactor the facade to support direct data conversion
      
      // For now, we'll indicate that direct data conversion is not available
      return {
        success: false,
        error: 'Direct character data conversion not yet implemented. Please use character ID conversion.'
      };

    } catch (error) {
      return {
        success: false,
        error: `Fantasy Grounds conversion error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private generateWarnings(characterData: CharacterData): string[] {
    const warnings: string[] = [];
    
    if (this.hasHomebrewContent(characterData)) {
      warnings.push('Homebrew content may require manual review in Fantasy Grounds');
    }
    
    if (this.hasComplexSpellcasting(characterData)) {
      warnings.push('Complex multiclass spellcasting has been validated but please verify spell slot calculations');
    }
    
    return warnings;
  }

  private hasHomebrewContent(characterData: CharacterData): boolean {
    const classes = characterData.classes || [];
    const race = characterData.race;
    const inventory = characterData.inventory || [];
    
    return !!(
      classes.some(cls => cls.definition?.isHomebrew) ||
      race?.isHomebrew ||
      inventory.some(item => item.definition?.isHomebrew)
    );
  }

  private hasComplexSpellcasting(characterData: CharacterData): boolean {
    const classes = characterData.classes || [];
    const spellcastingClasses = classes.filter(cls => 
      this.isSpellcastingClass(cls.definition?.name)
    );
    
    return spellcastingClasses.length > 1 || 
           classes.some(cls => cls.definition?.name?.toLowerCase() === 'warlock');
  }

  private isSpellcastingClass(className?: string): boolean {
    if (!className) return false;
    const spellcastingClasses = [
      'wizard', 'sorcerer', 'warlock', 'bard', 'cleric', 'druid',
      'paladin', 'ranger', 'artificer'
    ];
    return spellcastingClasses.some(cls => 
      className.toLowerCase().includes(cls)
    );
  }
}