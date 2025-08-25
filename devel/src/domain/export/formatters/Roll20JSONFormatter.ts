/**
 * Roll20 JSON Output Formatter
 * 
 * Converts processed character data to Roll20 D&D 5e character sheet JSON format.
 * Roll20 uses a specific character sheet structure for importing characters.
 */

import type { 
  OutputFormatter, 
  FormatOptions, 
  FormatResult, 
  ProcessedCharacterData,
  FormatError,
  FormatWarning
} from '../interfaces/OutputFormatter';
import { gameConfigService } from '../../../shared/services/GameConfigService';
import { StringSanitizer } from '../../../shared/utils/StringSanitizer';
import { SafeAccess } from '../../../shared/utils/SafeAccess';

export class Roll20JSONFormatter implements OutputFormatter {
  readonly format = 'roll20-json';
  readonly version = '1.0';
  readonly supportedFeatures = [
    'abilities', 'skills', 'combat', 'basic-spells', 'equipment', 
    'basic-features', 'proficiencies'
  ];

  async generateOutput(
    processedData: ProcessedCharacterData, 
    options?: FormatOptions
  ): Promise<FormatResult> {
    try {
      const character = processedData.characterData;
      const errors: FormatError[] = [];
      const warnings: FormatWarning[] = [];

      // Build Roll20 character structure
      const roll20Character = {
        // Basic character info
        name: StringSanitizer.sanitizeText(character.name || 'Unknown Character'),
        avatar: this.getCharacterImage(character),
        bio: this.buildBiography(character, options),
        gmnotes: this.buildGMNotes(character),
        archived: false,
        tags: this.buildTags(character),
        controlledby: '', // Will be set by GM
        _displayname: StringSanitizer.sanitizeText(character.name || 'Unknown Character'),
        
        // Character sheet attributes (Roll20 5e OGL format)
        attribs: this.buildAttributes(processedData),
        
        // Character abilities and calculations
        abilities: this.buildAbilities(processedData),
        
        // Additional Roll20-specific data
        _type: 'character',
        _subtype: '',
        _charactermancer_data: this.buildCharacterMancerData(processedData)
      };

      // Add warnings for unsupported features
      if (character.spells?.class?.length > 0) {
        warnings.push({
          type: 'feature_limitation',
          message: 'Spells require manual setup in Roll20 - only basic spell information exported'
        });
      }

      if (character.classes?.length > 1) {
        warnings.push({
          type: 'feature_limitation', 
          message: 'Multiclass characters may need manual adjustment in Roll20'
        });
      }

      // Generate filename
      const sanitizedName = StringSanitizer.sanitizeText(character.name || 'character')
        .replace(/[^a-zA-Z0-9_-]/g, '_');
      const characterId = character.id || 'unknown';
      const filename = `${sanitizedName}_${characterId}_roll20.json`;

      return {
        success: true,
        output: JSON.stringify(roll20Character, null, 2),
        filename,
        mimeType: 'application/json',
        errors: errors.length > 0 ? errors : undefined,
        warnings: warnings.length > 0 ? warnings : undefined
      };

    } catch (error) {
      return {
        success: false,
        errors: [{
          type: 'generation_error',
          message: error instanceof Error ? error.message : 'Unknown error occurred during Roll20 export'
        }]
      };
    }
  }

  private buildAttributes(processedData: ProcessedCharacterData): any[] {
    const character = processedData.characterData;
    const totalLevel = processedData.totalLevel || 1;
    const proficiencyBonus = processedData.proficiencyBonus || 2;

    const attributes = [];

    // Basic character info
    attributes.push({ name: 'character_name', current: character.name || '', max: '' });
    attributes.push({ name: 'level', current: totalLevel.toString(), max: '' });
    attributes.push({ name: 'pb', current: proficiencyBonus.toString(), max: '' });

    // Race and class
    const raceName = SafeAccess.get(character, 'race.fullName') || SafeAccess.get(character, 'race.name') || '';
    attributes.push({ name: 'race', current: raceName, max: '' });
    
    const className = character.classes?.[0]?.definition?.name || '';
    attributes.push({ name: 'class', current: className, max: '' });
    attributes.push({ name: 'base_level', current: totalLevel.toString(), max: '' });

    // Abilities (Roll20 uses full ability names)
    const stats = SafeAccess.get(character, 'stats') || [];
    const abilityMapping = {
      1: 'strength',     // STR
      2: 'dexterity',    // DEX
      3: 'constitution', // CON
      4: 'intelligence', // INT
      5: 'wisdom',       // WIS
      6: 'charisma'      // CHA
    };

    for (const stat of stats) {
      const abilityName = abilityMapping[stat.id];
      if (abilityName) {
        const score = stat.value || 10;
        const modifier = Math.floor((score - 10) / 2);
        
        attributes.push({ name: abilityName, current: score.toString(), max: '' });
        attributes.push({ name: `${abilityName}_mod`, current: modifier.toString(), max: '' });
        
        // Save proficiency (basic implementation)
        const saveProficient = this.isAbilitySaveProficient(character, abilityName);
        attributes.push({ 
          name: `${abilityName}_save_prof`, 
          current: saveProficient ? proficiencyBonus.toString() : '0', 
          max: '' 
        });
      }
    }

    // HP calculation
    const baseHP = this.calculateHitPoints(character, totalLevel);
    attributes.push({ name: 'hp', current: baseHP.toString(), max: baseHP.toString() });

    // AC calculation (basic)
    const ac = this.calculateArmorClass(character);
    attributes.push({ name: 'ac', current: ac.toString(), max: '' });

    // Speed
    const speed = this.getMovementSpeed(character);
    attributes.push({ name: 'speed', current: speed.toString(), max: '' });

    return attributes;
  }

  private buildAbilities(processedData: ProcessedCharacterData): any {
    return {
      // Roll20 stores abilities differently than Foundry
      // This is a simplified structure
      core: {
        abilities: this.mapAbilitiesForRoll20(processedData.characterData)
      }
    };
  }

  private mapAbilitiesForRoll20(character: any): any {
    const abilities = {};
    const stats = SafeAccess.get(character, 'stats') || [];
    
    const abilityMapping = {
      1: 'str',  2: 'dex',  3: 'con',
      4: 'int',  5: 'wis',  6: 'cha'
    };

    for (const stat of stats) {
      const abilityName = abilityMapping[stat.id];
      if (abilityName) {
        const score = stat.value || 10;
        const modifier = Math.floor((score - 10) / 2);
        
        abilities[abilityName] = {
          score: score,
          modifier: modifier
        };
      }
    }

    return abilities;
  }

  private buildCharacterMancerData(processedData: ProcessedCharacterData): any {
    const character = processedData.characterData;
    
    return {
      step: 'completed',
      race: character.race?.fullName || '',
      class: character.classes?.[0]?.definition?.name || '',
      level: processedData.totalLevel || 1,
      background: character.background?.name || '',
      alignment: gameConfigService.getAlignmentName(character.alignmentId) || ''
    };
  }

  private buildBiography(character: any, options?: FormatOptions): string {
    if (!options?.includeDescription) return '';
    
    const parts = [];
    
    if (character.race?.fullName) {
      parts.push(`**Race:** ${character.race.fullName}`);
    }
    
    if (character.classes?.length > 0) {
      const classInfo = character.classes.map(cls => 
        `${cls.definition?.name} ${cls.level}`
      ).join(', ');
      parts.push(`**Classes:** ${classInfo}`);
    }
    
    if (character.background?.name) {
      parts.push(`**Background:** ${character.background.name}`);
    }

    return StringSanitizer.sanitizeText(parts.join('\n\n'));
  }

  private buildGMNotes(character: any): string {
    const notes = [`Character ID: ${character.id || 'Unknown'}`];
    
    if (character.classes?.length > 1) {
      notes.push('Note: Multiclass character - may need manual adjustment');
    }
    
    notes.push('Exported from D&D Beyond via b2fg converter');
    
    return notes.join('\n');
  }

  private buildTags(character: any): string[] {
    const tags = [];
    
    if (character.race?.fullName) {
      tags.push(character.race.fullName.replace(/\s+/g, ''));
    }
    
    if (character.classes?.length > 0) {
      character.classes.forEach(cls => {
        if (cls.definition?.name) {
          tags.push(cls.definition.name);
        }
      });
    }
    
    if (character.background?.name) {
      tags.push(character.background.name.replace(/\s+/g, ''));
    }
    
    return tags;
  }

  private getCharacterImage(character: any): string {
    // Roll20 expects image URLs
    const avatarUrl = SafeAccess.get(character, 'decorations.avatarUrl') || 
                     SafeAccess.get(character, 'avatarUrl') || '';
    
    return StringSanitizer.sanitizeText(avatarUrl);
  }

  private calculateHitPoints(character: any, totalLevel: number): number {
    // Basic HP calculation - can be enhanced
    const stats = SafeAccess.get(character, 'stats') || [];
    const conStat = stats.find(stat => stat.id === 3); // Constitution
    const conModifier = conStat ? Math.floor((conStat.value - 10) / 2) : 0;
    
    const baseHP = SafeAccess.get(character, 'baseHitPoints') || 0;
    const bonusHP = SafeAccess.get(character, 'bonusHitPoints') || 0;
    
    return Math.max(1, baseHP + bonusHP + (conModifier * totalLevel));
  }

  private calculateArmorClass(character: any): number {
    // Basic AC calculation - Roll20 will handle equipment-based AC
    const stats = SafeAccess.get(character, 'stats') || [];
    const dexStat = stats.find(stat => stat.id === 2); // Dexterity
    const dexModifier = dexStat ? Math.floor((dexStat.value - 10) / 2) : 0;
    
    // Base AC (10 + Dex mod) - equipment will be handled separately
    return 10 + dexModifier;
  }

  private getMovementSpeed(character: any): number {
    // Basic movement speed - Roll20 can handle race-specific bonuses
    return SafeAccess.get(character, 'race.movementSpeed') || 30;
  }

  private isAbilitySaveProficient(character: any, abilityName: string): boolean {
    // Basic save proficiency check - can be enhanced with class data
    const savingThrows = SafeAccess.get(character, 'modifiers.class') || [];
    return savingThrows.some(modifier => 
      modifier.subType === `${abilityName}-saving-throws` && 
      modifier.type === 'proficiency'
    );
  }

  async validateOutput(output: string): Promise<{isValid: boolean; errors?: string[]}> {
    try {
      const parsed = JSON.parse(output);
      const errors = [];

      if (!parsed.name) {
        errors.push('Missing character name');
      }

      if (!parsed.attribs || !Array.isArray(parsed.attribs)) {
        errors.push('Invalid or missing attributes array');
      }

      return {
        isValid: errors.length === 0,
        errors: errors.length > 0 ? errors : undefined
      };
    } catch (error) {
      return {
        isValid: false,
        errors: ['Invalid JSON format']
      };
    }
  }

  getDefaultOptions(): FormatOptions {
    return {
      includeDescription: true,
      includeNotes: true,
      spellFormat: 'individual',
      featureDetail: 'summary',
      imageHandling: 'reference'
    };
  }

  async getSampleOutput(): Promise<string> {
    return JSON.stringify({
      name: "Sample Character",
      avatar: "",
      bio: "**Race:** Human\n\n**Classes:** Fighter 3",
      gmnotes: "Exported from D&D Beyond via b2fg converter",
      archived: false,
      tags: ["Human", "Fighter"],
      controlledby: "",
      _displayname: "Sample Character",
      attribs: [
        { name: "character_name", current: "Sample Character", max: "" },
        { name: "level", current: "3", max: "" },
        { name: "pb", current: "2", max: "" },
        { name: "strength", current: "16", max: "" },
        { name: "strength_mod", current: "3", max: "" }
      ],
      abilities: {
        core: {
          abilities: {
            str: { score: 16, modifier: 3 }
          }
        }
      },
      _type: "character",
      _subtype: "",
      _charactermancer_data: {
        step: "completed",
        race: "Human",
        class: "Fighter",
        level: 3
      }
    }, null, 2);
  }
}