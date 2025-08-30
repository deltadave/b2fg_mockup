import type { CharacterData } from '../models/CharacterData';
import type { LanguageConstants } from '../constants/LanguageConstants';

export interface ProcessedLanguage {
  id: string;
  name: string;
  subType: string;
  source: 'race' | 'class' | 'background' | 'feat' | 'other';
  isGranted: boolean;
}

export interface ProcessedLanguages {
  languages: ProcessedLanguage[];
  choices: LanguageChoice[];
  skipped: ProcessedLanguage[];
  totalLanguages: number;
}

export interface LanguageChoice {
  id: string;
  label: string;
  subType: string;
  isOptional: boolean;
  availableOptions?: string[];
}

/**
 * LanguageProcessor
 * 
 * Processes character language data from D&D Beyond format, extracting granted
 * languages and mapping them to proper display names for output formatters.
 * 
 * Follows the established processor pattern with validation, error handling,
 * and comprehensive processing options.
 */
export class LanguageProcessor {
  private static readonly LANGUAGE_MAPPING = {
    // Standard D&D 5e Languages
    'common': 'Common',
    'common-sign-language': 'Common Sign Language',
    'dwarvish': 'Dwarvish',
    'elvish': 'Elvish',
    'giant': 'Giant',
    'gnomish': 'Gnomish',
    'goblin': 'Goblin',
    'halfling': 'Halfling',
    'orc': 'Orc',
    'draconic': 'Draconic',
    
    // Exotic Languages
    'abyssal': 'Abyssal',
    'celestial': 'Celestial',
    'deep-speech': 'Deep Speech',
    'infernal': 'Infernal',
    'primordial': 'Primordial',
    'sylvan': 'Sylvan',
    'undercommon': 'Undercommon',
    'aquan': 'Aquan',
    'auran': 'Auran',
    'ignan': 'Ignan',
    'terran': 'Terran',
    
    // Special Languages
    'thieves-cant': "Thieves' Cant",
    'druidcraft': 'Druidic',
    
    // Regional and Rare Languages
    'aarakocra': 'Aarakocra',
    'gith': 'Gith',
    'githyanki': 'Githyanki',
    'githzerai': 'Githzerai',
    'sphinx': 'Sphinx',
    'telepathic': 'Telepathy'
  };

  private static readonly CHOICE_PATTERNS = [
    'choose-a-language',
    'choose-a-standard-language',
    'select-a-language',
    'additional-language'
  ];

  /**
   * Process all character languages from D&D Beyond data
   */
  processCharacterLanguages(characterData: CharacterData, options: {
    includeChoicesInOutput?: boolean;
    includeRacialOnly?: boolean;
  } = {}): ProcessedLanguages {
    
    const languages: ProcessedLanguage[] = [];
    const choices: LanguageChoice[] = [];
    const skipped: ProcessedLanguage[] = [];
    const seenLanguages = new Set<string>();

    // Extract languages from modifiers object - organized by source (race, class, background, etc.)
    if (characterData.modifiers && typeof characterData.modifiers === 'object') {
      let modifierIndex = 0;
      
      // Process each modifier source category
      Object.keys(characterData.modifiers).forEach(sourceKey => {
        const modifierGroup = characterData.modifiers[sourceKey];
        
        if (Array.isArray(modifierGroup)) {
          modifierGroup.forEach((modifier) => {
            if (modifier.type === 'language') {
              const processedLanguage = this.processLanguageModifier(modifier, modifierIndex++);
              
              if (!processedLanguage) {
                return; // Skip invalid modifiers
              }

              // Set source based on the modifier group
              processedLanguage.source = this.mapSourceKey(sourceKey);

              // Handle choice patterns - these become choices, never languages
              if (this.isChoiceLanguage(processedLanguage.subType)) {
                const choice = this.processLanguageChoice(modifier, modifierIndex);
                if (choice) {
                  choices.push(choice);
                }
                return; // Never add choices to the language list
              }

              // Only include granted languages
              if (!processedLanguage.isGranted) {
                skipped.push(processedLanguage);
                return;
              }

              // Avoid duplicates
              const languageKey = processedLanguage.subType.toLowerCase();
              if (seenLanguages.has(languageKey)) {
                skipped.push(processedLanguage);
                return;
              }

              seenLanguages.add(languageKey);
              languages.push(processedLanguage);
            }
          });
        }
      });
    }

    // Also extract language choices from characterData.choices if present
    this.extractChoicesFromCharacterChoices(characterData, choices);

    return {
      languages: this.sortLanguages(languages),
      choices: this.sortChoices(choices),
      skipped,
      totalLanguages: languages.length
    };
  }

  /**
   * Process individual language modifier
   */
  private processLanguageModifier(modifier: any, index: number): ProcessedLanguage | null {
    if (!modifier.subType || typeof modifier.subType !== 'string') {
      return null;
    }

    const displayName = this.getLanguageDisplayName(modifier.subType);
    const source = this.determineLanguageSource(modifier);

    return {
      id: `language-${index}`,
      name: displayName,
      subType: modifier.subType,
      source,
      isGranted: Boolean(modifier.isGranted)
    };
  }

  /**
   * Get proper display name for language
   */
  private getLanguageDisplayName(subType: string): string {
    const normalized = subType.toLowerCase().replace(/[^a-z-]/g, '');
    return LanguageProcessor.LANGUAGE_MAPPING[normalized] || this.formatLanguageName(subType);
  }

  /**
   * Format language name from subType when not in mapping
   */
  private formatLanguageName(subType: string): string {
    return subType
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  /**
   * Determine the source of a language (race, class, etc.)
   */
  private determineLanguageSource(modifier: any): ProcessedLanguage['source'] {
    // This could be enhanced with more sophisticated source detection
    // For now, we'll default to 'other' and let specific cases be handled
    
    if (modifier.componentId || modifier.componentTypeId) {
      // Could map component types to sources
      return 'other';
    }
    
    return 'other';
  }

  /**
   * Map D&D Beyond modifier source key to our ProcessedLanguage source type
   */
  private mapSourceKey(sourceKey: string): ProcessedLanguage['source'] {
    switch (sourceKey.toLowerCase()) {
      case 'race':
        return 'race';
      case 'class':
        return 'class';
      case 'background':
        return 'background';
      case 'feat':
        return 'feat';
      case 'item':
      case 'condition':
      default:
        return 'other';
    }
  }

  /**
   * Check if a language subType represents a choice rather than a specific language
   */
  private isChoiceLanguage(subType: string): boolean {
    return LanguageProcessor.CHOICE_PATTERNS.some(pattern => 
      subType.toLowerCase().includes(pattern.toLowerCase())
    );
  }

  /**
   * Process a language choice modifier
   */
  private processLanguageChoice(modifier: any, index: number): LanguageChoice | null {
    if (!modifier.subType || typeof modifier.subType !== 'string') {
      return null;
    }

    return {
      id: `language-choice-${index}`,
      label: modifier.friendlySubtypeName || this.formatLanguageName(modifier.subType),
      subType: modifier.subType,
      isOptional: Boolean(modifier.isOptional),
      availableOptions: this.getAvailableLanguageOptions(modifier)
    };
  }

  /**
   * Extract language choices from characterData.choices array
   */
  private extractChoicesFromCharacterChoices(characterData: CharacterData, choices: LanguageChoice[]): void {
    if (!characterData.choices || !Array.isArray(characterData.choices)) {
      return;
    }

    characterData.choices.forEach((choice, index) => {
      // Look for language-related choices
      if (choice.label && typeof choice.label === 'string' && 
          (choice.label.toLowerCase().includes('language') || 
           choice.label.toLowerCase().includes('standard language'))) {
        
        const languageChoice: LanguageChoice = {
          id: `choice-${index}`,
          label: choice.label,
          subType: choice.subType || 'language-choice',
          isOptional: Boolean(choice.isOptional),
          availableOptions: this.extractOptionsFromChoice(choice)
        };

        choices.push(languageChoice);
      }
    });
  }

  /**
   * Get available language options for a choice
   */
  private getAvailableLanguageOptions(modifier: any): string[] | undefined {
    // This could be enhanced to extract specific options if available in the data
    // For now, return undefined to indicate standard language selection
    return undefined;
  }

  /**
   * Extract available options from a choice object
   */
  private extractOptionsFromChoice(choice: any): string[] | undefined {
    if (choice.options && Array.isArray(choice.options)) {
      return choice.options.map((option: any) => option.label || option.name).filter(Boolean);
    }
    return undefined;
  }

  /**
   * Sort languages alphabetically by name
   */
  private sortLanguages(languages: ProcessedLanguage[]): ProcessedLanguage[] {
    return languages.sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Sort choices alphabetically by label
   */
  private sortChoices(choices: LanguageChoice[]): LanguageChoice[] {
    return choices.sort((a, b) => a.label.localeCompare(b.label));
  }

  /**
   * Generate Fantasy Grounds XML for languages
   */
  generateLanguagesXML(languages: ProcessedLanguage[]): string {
    if (languages.length === 0) {
      return '';
    }

    let xml = '';
    
    languages.forEach((language, index) => {
      const id = String(index + 1).padStart(5, '0');
      xml += `
			<id-${id}>
				<name type="string">${this.escapeXml(language.name)}</name>
			</id-${id}>`;
    });

    return xml;
  }

  /**
   * Generate FoundryVTT languages data
   */
  generateFoundryVTTLanguages(languages: ProcessedLanguage[]): {
    value: string[];
    custom: string;
  } {
    const standardLanguages: string[] = [];
    const customLanguages: string[] = [];

    languages.forEach(language => {
      const foundryKey = this.getFoundryLanguageKey(language.subType);
      
      if (foundryKey) {
        standardLanguages.push(foundryKey);
      } else {
        customLanguages.push(language.name);
      }
    });

    return {
      value: standardLanguages,
      custom: customLanguages.join('; ')
    };
  }

  /**
   * Map D&D Beyond language subType to FoundryVTT language key
   */
  private getFoundryLanguageKey(subType: string): string | null {
    // FoundryVTT uses different keys than display names
    const foundryMapping: Record<string, string> = {
      'common': 'common',
      'dwarvish': 'dwarvish',
      'elvish': 'elvish',
      'giant': 'giant',
      'gnomish': 'gnomish',
      'goblin': 'goblin',
      'halfling': 'halfling',
      'orc': 'orc',
      'draconic': 'draconic',
      'abyssal': 'abyssal',
      'celestial': 'celestial',
      'deep-speech': 'deep',
      'infernal': 'infernal',
      'primordial': 'primordial',
      'sylvan': 'sylvan',
      'undercommon': 'undercommon',
      'thieves-cant': 'cant'
    };

    return foundryMapping[subType.toLowerCase()] || null;
  }

  /**
   * Validate character data for language processing
   */
  static validateCharacterData(characterData: CharacterData): {
    isValid: boolean;
    issues: string[];
    warnings: string[];
  } {
    const issues: string[] = [];
    const warnings: string[] = [];

    if (!characterData) {
      issues.push('Character data is null or undefined');
      return { isValid: false, issues, warnings };
    }

    if (!characterData.modifiers || typeof characterData.modifiers !== 'object') {
      warnings.push('No modifiers found - character may have no languages');
    } else {
      let languageModifiers: any[] = [];
      
      // Collect all language modifiers from all sources
      Object.keys(characterData.modifiers).forEach(sourceKey => {
        const modifierGroup = characterData.modifiers[sourceKey];
        if (Array.isArray(modifierGroup)) {
          const sourceLangModifiers = modifierGroup.filter(m => m.type === 'language');
          languageModifiers = languageModifiers.concat(sourceLangModifiers);
        }
      });
      
      if (languageModifiers.length === 0) {
        warnings.push('No language modifiers found - character may not speak any languages');
      }

      // Check for at least Common language
      const hasCommon = languageModifiers.some(m => 
        m.subType === 'common' && m.isGranted
      );
      
      if (!hasCommon) {
        warnings.push('Character does not have Common language - this is unusual for player characters');
      }
    }

    return {
      isValid: issues.length === 0,
      issues,
      warnings
    };
  }

  /**
   * XML escape utility
   */
  private escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}