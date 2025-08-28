/**
 * Generic JSON Output Formatter
 * 
 * Converts processed character data to a generic JSON format with all character information.
 * This format provides raw character data for custom processing or debugging purposes.
 */

import type { 
  OutputFormatter, 
  FormatOptions, 
  FormatResult, 
  ProcessedCharacterData,
  FormatError,
  FormatWarning
} from '../interfaces/OutputFormatter';
import { StringSanitizer } from '../../../shared/utils/StringSanitizer';

export class GenericJSONFormatter implements OutputFormatter {
  readonly format = 'generic-json';
  readonly version = '1.0';
  readonly supportedFeatures = [
    'abilities', 'skills', 'saving-throws', 'combat', 'spells', 'spell-slots',
    'equipment', 'weapons', 'armor', 'features', 'feats', 'proficiencies',
    'multiclass', 'homebrew-support', 'raw-data'
  ];

  async generateOutput(
    processedData: ProcessedCharacterData, 
    options?: FormatOptions
  ): Promise<FormatResult> {
    try {
      const character = processedData.characterData;
      const warnings: FormatWarning[] = [];

      // Build comprehensive JSON output
      const jsonOutput = {
        metadata: {
          format: this.format,
          version: this.version,
          exportDate: new Date().toISOString(),
          characterId: character.id,
          characterName: character.name
        },
        character: {
          // Basic information
          id: character.id,
          name: character.name,
          level: processedData.totalLevel || 1,
          proficiencyBonus: processedData.proficiencyBonus || 2,
          
          // Character details
          race: character.race,
          classes: character.classes,
          background: character.background,
          alignmentId: character.alignmentId,
          
          // Abilities and stats
          stats: character.stats,
          abilities: processedData.abilities,
          
          // Character progression
          hitPoints: {
            base: character.baseHitPoints || 0,
            bonus: character.bonusHitPoints || 0,
            current: character.currentHitPoints,
            maximum: character.maximumHitPoints
          },
          
          // Experience and advancement
          currentXp: character.currentXp || 0,
          
          // Equipment and inventory
          inventory: character.inventory,
          equipment: character.equipment,
          
          // Spellcasting
          spells: character.spells,
          spellSlots: processedData.spellSlots,
          
          // Features and abilities
          classFeatures: character.classFeatures,
          raceFeatures: character.race?.racialTraits,
          feats: character.feats,
          
          // Additional data
          modifiers: character.modifiers,
          preferences: character.preferences,
          notes: character.notes,
          
          // Processed data
          processed: {
            totalLevel: processedData.totalLevel,
            proficiencyBonus: processedData.proficiencyBonus,
            features: processedData.features,
            inventory: processedData.inventory
          }
        },
        
        // Export options
        options: options || this.getDefaultOptions(),
        
        // Additional metadata
        supportedFeatures: this.supportedFeatures,
        rawData: options?.includeDescription ? character : null
      };

      // Generate filename
      const sanitizedName = StringSanitizer.sanitizeText(character.name || 'character')
        .replace(/[^a-zA-Z0-9_-]/g, '_');
      const characterId = character.id || 'unknown';
      const filename = `${sanitizedName}_${characterId}_generic.json`;

      return {
        success: true,
        output: JSON.stringify(jsonOutput, null, 2),
        filename,
        mimeType: 'application/json',
        warnings: warnings.length > 0 ? warnings : undefined
      };

    } catch (error) {
      return {
        success: false,
        errors: [{
          type: 'generation_error',
          message: error instanceof Error ? error.message : 'Unknown error occurred during Generic JSON export'
        }]
      };
    }
  }

  async validateOutput(output: string): Promise<{isValid: boolean; errors?: string[]}> {
    try {
      const parsed = JSON.parse(output);
      const errors = [];

      if (!parsed.metadata) {
        errors.push('Missing metadata object');
      }

      if (!parsed.character) {
        errors.push('Missing character object');
      }

      if (!parsed.character?.id) {
        errors.push('Missing character ID');
      }

      if (!parsed.character?.name) {
        errors.push('Missing character name');
      }

      return {
        isValid: errors.length === 0,
        errors: errors.length > 0 ? errors : undefined
      };
    } catch (error) {
      return {
        isValid: false,
        errors: ['Invalid JSON format: ' + (error instanceof Error ? error.message : 'Parse error')]
      };
    }
  }

  getDefaultOptions(): FormatOptions {
    return {
      includeDescription: true,
      includeNotes: true,
      spellFormat: 'individual',
      featureDetail: 'full',
      imageHandling: 'reference'
    };
  }

  async getSampleOutput(): Promise<string> {
    return JSON.stringify({
      metadata: {
        format: "generic-json",
        version: "1.0",
        exportDate: "2024-01-01T00:00:00.000Z",
        characterId: "12345678",
        characterName: "Sample Character"
      },
      character: {
        id: "12345678",
        name: "Sample Character",
        level: 3,
        proficiencyBonus: 2,
        race: {
          name: "Human",
          fullName: "Variant Human"
        },
        classes: [
          {
            definition: { name: "Fighter" },
            level: 3
          }
        ],
        stats: [
          { id: 1, value: 16 }, // Strength
          { id: 2, value: 14 }, // Dexterity
          { id: 3, value: 15 }  // Constitution
        ],
        hitPoints: {
          base: 28,
          bonus: 0,
          current: 28,
          maximum: 28
        },
        currentXp: 900,
        inventory: [],
        spells: null,
        processed: {
          totalLevel: 3,
          proficiencyBonus: 2
        }
      },
      options: {
        includeDescription: true,
        includeNotes: true,
        spellFormat: "individual",
        featureDetail: "full",
        imageHandling: "reference"
      },
      supportedFeatures: [
        "abilities", "skills", "raw-data"
      ]
    }, null, 2);
  }
}