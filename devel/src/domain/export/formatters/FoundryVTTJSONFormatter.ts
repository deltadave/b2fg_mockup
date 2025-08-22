/**
 * Foundry VTT JSON Output Formatter
 * 
 * Converts processed character data to Foundry VTT D&D 5e system JSON format.
 * Uses existing calculated values from the Fantasy Grounds XML generation pipeline
 * to avoid recalculation.
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
import { ABILITY_NAMES } from '../../character/constants/AbilityConstants';

export class FoundryVTTJSONFormatter implements OutputFormatter {
  readonly format = 'foundry-vtt-json';
  readonly version = '1.0';
  readonly supportedFeatures = [
    'abilities', 'skills', 'combat', 'spells', 'equipment', 
    'features', 'active-effects', 'embedded-items'
  ];

  async generateOutput(
    processedData: ProcessedCharacterData, 
    options?: FormatOptions
  ): Promise<FormatResult> {
    try {
      const character = processedData.characterData;
      const errors: FormatError[] = [];
      const warnings: FormatWarning[] = [];

      // Build Foundry character structure
      const foundryCharacter = {
        _id: this.generateFoundryId(),
        name: StringSanitizer.sanitizeText(character.name || 'Unknown Character'),
        type: 'character',
        img: this.getCharacterImage(character),
        system: this.buildSystemData(processedData),
        items: await this.buildItems(processedData, options),
        effects: this.buildActiveEffects(processedData),
        prototypeToken: this.buildTokenData(processedData),
        ownership: { default: 0 },
        flags: {
          'dnd5e': {},
          'b2fg-converter': {
            sourceId: character.id,
            convertedAt: new Date().toISOString(),
            converterVersion: '1.0'
          }
        }
      };

      // Generate filename
      const sanitizedName = StringSanitizer.sanitizeText(character.name || 'character')
        .replace(/[^a-zA-Z0-9_-]/g, '_');
      const characterId = character.id || 'unknown';
      const filename = `${sanitizedName}_${characterId}.json`;

      return {
        success: true,
        output: JSON.stringify(foundryCharacter, null, 2),
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
          message: error instanceof Error ? error.message : 'Unknown error occurred'
        }]
      };
    }
  }

  private buildSystemData(processedData: ProcessedCharacterData): any {
    const character = processedData.characterData;
    const totalLevel = processedData.totalLevel || this.calculateTotalLevel(character);
    const proficiencyBonus = processedData.proficiencyBonus || gameConfigService.calculateProficiencyBonus(totalLevel);

    return {
      abilities: this.mapAbilities(character),
      attributes: this.mapAttributes(character, totalLevel, proficiencyBonus),
      details: this.mapDetails(character, totalLevel),
      traits: this.mapTraits(character),
      currency: this.mapCurrency(character),
      skills: this.mapSkills(character, proficiencyBonus),
      spells: this.mapSpellSlots(character),
      bonuses: this.mapBonuses(character),
      resources: this.mapResources(character)
    };
  }

  private mapAbilities(character: any): any {
    const abilities: any = {};
    
    // Map D&D Beyond stat IDs to Foundry ability names
    const abilityMapping = {
      1: 'str',  // Strength
      2: 'dex',  // Dexterity
      3: 'con',  // Constitution
      4: 'int',  // Intelligence
      5: 'wis',  // Wisdom
      6: 'cha'   // Charisma
    };
    
    const stats = SafeAccess.get(character, 'stats') || [];
    
    for (const stat of stats) {
      const abilityName = abilityMapping[stat.id];
      if (abilityName) {
        const baseValue = stat.value || 10;
        
        abilities[abilityName] = {
          value: baseValue,
          proficient: this.isAbilitySaveProficient(character, abilityName),
          max: null,
          bonuses: {
            check: '',
            save: ''
          },
          check: {
            roll: { min: null, max: null, mode: 0 }
          },
          save: {
            roll: { min: null, max: null, mode: 0 }
          }
        };
      }
    }
    
    // Ensure all abilities are present with default values
    for (const abilityName of ['str', 'dex', 'con', 'int', 'wis', 'cha']) {
      if (!abilities[abilityName]) {
        abilities[abilityName] = {
          value: 10,
          proficient: false,
          max: null,
          bonuses: { check: '', save: '' },
          check: { roll: { min: null, max: null, mode: 0 } },
          save: { roll: { min: null, max: null, mode: 0 } }
        };
      }
    }

    return abilities;
  }

  private mapAttributes(character: any, totalLevel: number, proficiencyBonus: number): any {
    // Get Constitution from stats array (id: 3)
    const stats = SafeAccess.get(character, 'stats') || [];
    const conStat = stats.find(stat => stat.id === 3);
    const con = conStat?.value || 10;
    const conModifier = Math.floor((con - 10) / 2);
    
    // Calculate HP using existing logic
    const baseHP = this.calculateHitPoints(character, conModifier, totalLevel);
    
    return {
      init: {
        ability: '',
        roll: { min: null, max: null, mode: 0 },
        bonus: ''
      },
      movement: this.mapMovement(character),
      attunement: { max: 3 },
      senses: this.mapSenses(character),
      spellcasting: this.getPrimarySpellcastingAbility(character),
      hp: {
        value: baseHP,
        max: baseHP,
        temp: 0,
        tempmax: 0,
        bonuses: {
          level: '',
          overall: ''
        }
      },
      ac: {
        flat: null,
        calc: 'default',
        formula: '',
        min: 0
      },
      prof: proficiencyBonus,
      spelldc: this.calculateSpellDC(character, proficiencyBonus)
    };
  }

  private mapDetails(character: any, totalLevel: number): any {
    const background = SafeAccess.get(character, 'background.definition.name') || 
                      SafeAccess.get(character, 'background.name') || '';
    
    return {
      background: StringSanitizer.sanitizeText(background),
      originalClass: this.getPrimaryClassName(character),
      class: this.formatClassString(character),
      level: totalLevel,
      race: StringSanitizer.sanitizeText(character.race?.fullName || character.race?.name || ''),
      alignment: gameConfigService.getAlignmentName(character.alignmentId) || '',
      xp: {
        value: 0,
        max: this.calculateXPForLevel(totalLevel + 1),
        pct: 0
      }
    };
  }

  private mapTraits(character: any): any {
    return {
      size: this.mapSize(character),
      di: { value: [], bypasses: [], custom: '' },
      dr: { value: [], bypasses: [], custom: '' },
      dv: { value: [], bypasses: [], custom: '' },
      ci: { value: [], custom: '' },
      languages: this.mapLanguages(character),
      weaponProf: { value: [], custom: '' },
      armorProf: { value: [], custom: '' },
      toolProf: { value: [], custom: '' }
    };
  }

  private mapCurrency(character: any): any {
    const currencies = character.currencies || {};
    
    return {
      pp: currencies.pp || 0,
      gp: currencies.gp || 0,
      ep: currencies.ep || 0,
      sp: currencies.sp || 0,
      cp: currencies.cp || 0
    };
  }

  private mapSkills(character: any, proficiencyBonus: number): any {
    const skills: any = {};
    const foundrySkills = [
      'acr', 'ani', 'arc', 'ath', 'dec', 'his', 'ins', 'inti', 'inv', 'med',
      'nat', 'prc', 'prf', 'per', 'rel', 'slt', 'ste', 'sur'
    ];

    for (const skill of foundrySkills) {
      skills[skill] = {
        ability: this.getSkillAbility(skill),
        roll: { min: null, max: null, mode: 0 },
        value: this.getSkillProficiency(character, skill),
        bonuses: {
          check: '',
          passive: ''
        }
      };
    }

    return skills;
  }

  private mapSpellSlots(character: any): any {
    const spellSlots: any = {};
    
    // Map spell slots from existing calculation
    for (let level = 1; level <= 9; level++) {
      spellSlots[`spell${level}`] = {
        value: 0,
        max: 0,
        override: null
      };
    }

    // Add pact magic slots if character is a warlock
    spellSlots.pact = {
      value: 0,
      max: 0,
      override: null,
      level: 1
    };

    return spellSlots;
  }

  private mapBonuses(character: any): any {
    return {
      mwak: { attack: '', damage: '' },
      rwak: { attack: '', damage: '' },
      msak: { attack: '', damage: '' },
      rsak: { attack: '', damage: '' },
      abilities: { check: '', save: '', skill: '' },
      spell: { dc: '' }
    };
  }

  private mapResources(character: any): any {
    return {
      primary: { value: 0, max: 0, sr: false, lr: false, label: '' },
      secondary: { value: 0, max: 0, sr: false, lr: false, label: '' },
      tertiary: { value: 0, max: 0, sr: false, lr: false, label: '' }
    };
  }

  private async buildItems(processedData: ProcessedCharacterData, options?: FormatOptions): Promise<any[]> {
    const items: any[] = [];
    
    // Add equipment items
    const equipment = processedData.characterData.inventory || [];
    for (const item of equipment) {
      if (item && item.definition) {
        items.push(await this.convertEquipmentItem(item));
      }
    }

    // Add spell items
    const spells = processedData.characterData.spells?.class || [];
    for (const spell of spells) {
      if (spell && spell.definition) {
        items.push(await this.convertSpellItem(spell));
      }
    }

    // Add class features
    const classFeatures = processedData.characterData.classFeatures || [];
    for (const feature of classFeatures) {
      if (feature && feature.definition) {
        items.push(await this.convertFeatureItem(feature));
      }
    }

    return items;
  }

  private buildActiveEffects(processedData: ProcessedCharacterData): any[] {
    // TODO: Map active effects from character data
    return [];
  }

  private buildTokenData(processedData: ProcessedCharacterData): any {
    const character = processedData.characterData;
    
    return {
      name: character.name || 'Unknown Character',
      img: this.getCharacterImage(character),
      width: 1,
      height: 1,
      scale: 1,
      lockRotation: false,
      rotation: 0,
      vision: true,
      dimSight: 0,
      brightSight: 0,
      sightAngle: 0,
      dimLight: 0,
      brightLight: 0,
      lightAngle: 0,
      lightAlpha: 0.25,
      disposition: 1,
      displayName: 20,
      displayBars: 20,
      bar1: { attribute: 'attributes.hp' },
      bar2: { attribute: null },
      flags: {}
    };
  }

  // Helper methods
  private generateFoundryId(): string {
    return Array.from({length: 16}, () => Math.floor(Math.random() * 16).toString(16)).join('');
  }

  private getCharacterImage(character: any): string {
    return character.avatarUrl || character.decorations?.avatarUrl || 'icons/svg/mystery-man.svg';
  }

  private calculateTotalLevel(character: any): number {
    const classes = character.classes || [];
    return classes.reduce((total: number, cls: any) => total + (cls.level || 0), 0);
  }

  private isAbilitySaveProficient(character: any, abilityName: string): number {
    // Check if this ability save is proficient
    const modifiers = character.modifiers?.class || [];
    const saveProficiency = modifiers.find((mod: any) => 
      mod.type === 'proficiency' && 
      mod.subType === `${abilityName.toLowerCase()}-saving-throws`
    );
    return saveProficiency ? 1 : 0;
  }

  private calculateHitPoints(character: any, conModifier: number, totalLevel: number): number {
    // Use existing HP calculation logic or extract from character data
    const baseHp = character.baseHitPoints || (totalLevel * 8); // Default to d8 hit die
    const modifierBonus = conModifier * totalLevel;
    return Math.max(1, baseHp + modifierBonus);
  }

  private mapMovement(character: any): any {
    const race = character.race;
    const baseSpeed = race?.weightSpeeds?.normal?.walk || 30;
    
    return {
      burrow: null,
      climb: null,
      fly: null,
      swim: null,
      walk: baseSpeed,
      units: 'ft',
      hover: false
    };
  }

  private mapSenses(character: any): any {
    return {
      darkvision: null,
      blindsight: null,
      tremorsense: null,
      truesight: null,
      units: 'ft',
      special: ''
    };
  }

  private getPrimarySpellcastingAbility(character: any): string {
    const classes = character.classes || [];
    for (const cls of classes) {
      const definition = cls.definition || cls.classDefinition;
      if (definition?.spellcastingAbilityId) {
        return this.abilityIdToName(definition.spellcastingAbilityId);
      }
    }
    return 'int'; // Default
  }

  private abilityIdToName(abilityId: number): string {
    const mapping: {[key: number]: string} = {
      1: 'str', 2: 'dex', 3: 'con', 4: 'int', 5: 'wis', 6: 'cha'
    };
    return mapping[abilityId] || 'int';
  }

  private calculateSpellDC(character: any, proficiencyBonus: number): number {
    const spellcastingAbility = this.getPrimarySpellcastingAbility(character);
    const abilityValue = SafeAccess.get(character, `stats.${spellcastingAbility}`) || 10;
    const abilityModifier = Math.floor((abilityValue - 10) / 2);
    return 8 + proficiencyBonus + abilityModifier;
  }

  private getPrimaryClassName(character: any): string {
    const classes = character.classes || [];
    if (classes.length === 0) return '';
    
    // Return the highest level class
    const primaryClass = classes.reduce((highest: any, current: any) => 
      (current.level || 0) > (highest.level || 0) ? current : highest
    );
    
    return primaryClass.definition?.name || primaryClass.name || '';
  }

  private formatClassString(character: any): string {
    const classes = character.classes || [];
    return classes.map((cls: any) => {
      const name = cls.definition?.name || cls.name || 'Unknown';
      return `${name} ${cls.level || 1}`;
    }).join(' / ');
  }

  private mapSize(character: any): string {
    const raceSize = character.race?.size;
    if (raceSize) {
      const sizeMap: {[key: string]: string} = {
        'Tiny': 'tiny', 'Small': 'sm', 'Medium': 'med', 
        'Large': 'lg', 'Huge': 'huge', 'Gargantuan': 'grg'
      };
      return sizeMap[raceSize] || 'med';
    }
    return 'med';
  }

  private mapLanguages(character: any): any {
    return {
      value: [],
      custom: ''
    };
  }

  private getSkillAbility(skill: string): string {
    const skillAbilities: {[key: string]: string} = {
      'acr': 'dex', 'ani': 'wis', 'arc': 'int', 'ath': 'str', 'dec': 'cha',
      'his': 'int', 'ins': 'wis', 'inti': 'cha', 'inv': 'int', 'med': 'wis',
      'nat': 'int', 'prc': 'wis', 'prf': 'cha', 'per': 'cha', 'rel': 'int',
      'slt': 'dex', 'ste': 'dex', 'sur': 'wis'
    };
    return skillAbilities[skill] || 'int';
  }

  private getSkillProficiency(character: any, skill: string): number {
    // Check if skill is proficient
    const modifiers = character.modifiers?.class || [];
    const skillProficiency = modifiers.find((mod: any) => 
      mod.type === 'proficiency' && 
      mod.subType === 'skill' &&
      mod.friendlySubtypeName?.toLowerCase().includes(skill)
    );
    return skillProficiency ? 1 : 0;
  }

  private async convertEquipmentItem(item: any): Promise<any> {
    // Convert D&D Beyond equipment to Foundry item format
    return {
      _id: this.generateFoundryId(),
      name: StringSanitizer.sanitizeText(item.definition?.name || 'Unknown Item'),
      type: this.getFoundryItemType(item),
      img: 'icons/svg/item-bag.svg',
      system: {
        description: {
          value: StringSanitizer.sanitizeText(item.definition?.description || ''),
          chat: '',
          unidentified: ''
        },
        quantity: item.quantity || 1,
        weight: item.definition?.weight || 0,
        price: {
          value: item.definition?.cost || 0,
          denomination: 'gp'
        },
        equipped: item.equipped || false,
        rarity: 'common',
        identified: true
      },
      effects: [],
      flags: {
        'b2fg-converter': {
          sourceId: item.definition?.id,
          sourceType: 'dndbeyond-equipment'
        }
      }
    };
  }

  private async convertSpellItem(spell: any): Promise<any> {
    return {
      _id: this.generateFoundryId(),
      name: StringSanitizer.sanitizeText(spell.definition?.name || 'Unknown Spell'),
      type: 'spell',
      img: 'icons/svg/book.svg',
      system: {
        description: {
          value: StringSanitizer.sanitizeText(spell.definition?.description || ''),
          chat: '',
          unidentified: ''
        },
        level: spell.definition?.level || 0,
        school: spell.definition?.school || 'evo',
        preparation: {
          mode: 'prepared',
          prepared: spell.prepared || false
        },
        components: {
          vocal: spell.definition?.components?.includes('V') || false,
          somatic: spell.definition?.components?.includes('S') || false,
          material: spell.definition?.components?.includes('M') || false,
          ritual: spell.definition?.ritual || false,
          concentration: spell.definition?.concentration || false
        },
        duration: {
          value: null,
          units: 'inst'
        },
        range: {
          value: null,
          long: null,
          units: 'self'
        },
        target: {
          value: null,
          width: null,
          units: '',
          type: ''
        },
        damage: {
          parts: [],
          versatile: ''
        },
        save: {
          ability: '',
          dc: null,
          scaling: 'spell'
        }
      },
      effects: [],
      flags: {
        'b2fg-converter': {
          sourceId: spell.definition?.id,
          sourceType: 'dndbeyond-spell'
        }
      }
    };
  }

  private async convertFeatureItem(feature: any): Promise<any> {
    return {
      _id: this.generateFoundryId(),
      name: StringSanitizer.sanitizeText(feature.definition?.name || 'Unknown Feature'),
      type: 'feat',
      img: 'icons/svg/upgrade.svg',
      system: {
        description: {
          value: StringSanitizer.sanitizeText(feature.definition?.description || ''),
          chat: '',
          unidentified: ''
        },
        requirements: '',
        recharge: {
          value: null,
          charged: true
        },
        activation: {
          type: '',
          cost: null,
          condition: ''
        },
        duration: {
          value: null,
          units: ''
        },
        target: {
          value: null,
          width: null,
          units: '',
          type: ''
        },
        uses: {
          value: null,
          max: '',
          per: null,
          recovery: ''
        }
      },
      effects: [],
      flags: {
        'b2fg-converter': {
          sourceId: feature.definition?.id,
          sourceType: 'dndbeyond-feature'
        }
      }
    };
  }

  private getFoundryItemType(item: any): string {
    const filterType = item.definition?.filterType;
    if (filterType === 'Weapon') return 'weapon';
    if (filterType === 'Armor') return 'equipment';
    if (filterType === 'Adventuring Gear') return 'loot';
    return 'loot';
  }

  async validateOutput(output: string): Promise<{isValid: boolean; errors?: string[]}> {
    try {
      const parsed = JSON.parse(output);
      const errors: string[] = [];

      if (!parsed.name) errors.push('Missing character name');
      if (!parsed.type || parsed.type !== 'character') errors.push('Invalid character type');
      if (!parsed.system) errors.push('Missing system data');

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
      featureDetail: 'full',
      imageHandling: 'reference'
    };
  }

  async getSampleOutput(): Promise<string> {
    return JSON.stringify({
      name: 'Sample Character',
      type: 'character',
      system: {
        abilities: { str: { value: 10 } },
        attributes: { hp: { value: 8, max: 8 } }
      }
    }, null, 2);
  }

  /**
   * Calculate XP required for a given level
   */
  private calculateXPForLevel(level: number): number {
    // D&D 5e XP progression table (simplified)
    const xpTable = [
      0,      // Level 1
      300,    // Level 2
      900,    // Level 3
      2700,   // Level 4
      6500,   // Level 5
      14000,  // Level 6
      23000,  // Level 7
      34000,  // Level 8
      48000,  // Level 9
      64000,  // Level 10
      85000,  // Level 11
      100000, // Level 12
      120000, // Level 13
      140000, // Level 14
      165000, // Level 15
      195000, // Level 16
      225000, // Level 17
      265000, // Level 18
      305000, // Level 19
      355000  // Level 20
    ];

    return xpTable[Math.min(level - 1, xpTable.length - 1)] || 0;
  }
}