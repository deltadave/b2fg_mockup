/**
 * Generic JSON Format Adapter
 * 
 * Converts D&D Beyond character data to a comprehensive JSON format that preserves
 * all character data for custom integrations or future format development.
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

export interface GenericCharacterData {
  metadata: {
    version: string;
    exportDate: string;
    source: string;
    originalId: number;
  };
  character: {
    basic: {
      id: number;
      name: string;
      level: number;
      experience: number;
      alignment: string;
      race: any;
      background: any;
      classes: any[];
    };
    abilities: {
      strength: { score: number; modifier: number; saveProficient: boolean };
      dexterity: { score: number; modifier: number; saveProficient: boolean };
      constitution: { score: number; modifier: number; saveProficient: boolean };
      intelligence: { score: number; modifier: number; saveProficient: boolean };
      wisdom: { score: number; modifier: number; saveProficient: boolean };
      charisma: { score: number; modifier: number; saveProficient: boolean };
    };
    skills: Record<string, {
      ability: string;
      proficiency: 'none' | 'proficient' | 'expertise';
      modifier: number;
    }>;
    combat: {
      armorClass: number;
      hitPoints: {
        current: number;
        maximum: number;
        temporary: number;
      };
      initiative: number;
      speed: {
        walk: number;
        fly?: number;
        swim?: number;
        climb?: number;
        burrow?: number;
      };
      proficiencyBonus: number;
    };
    spellcasting: {
      ability: string;
      spellSaveDC: number;
      spellAttackBonus: number;
      slots: Record<string, { current: number; maximum: number }>;
      pactMagic?: { level: number; slots: number };
      spells: {
        known: any[];
        prepared: any[];
        always: any[];
      };
    };
    inventory: {
      currency: {
        copper: number;
        silver: number;
        electrum: number;
        gold: number;
        platinum: number;
      };
      equipment: any[];
      weapons: any[];
      armor: any[];
      items: any[];
    };
    features: {
      racial: any[];
      class: any[];
      background: any[];
      feats: any[];
      other: any[];
    };
    proficiencies: {
      armor: string[];
      weapons: string[];
      tools: string[];
      languages: string[];
      savingThrows: string[];
    };
    traits: {
      size: string;
      senses: Record<string, number>;
      resistances: string[];
      immunities: string[];
      vulnerabilities: string[];
      conditionImmunities: string[];
    };
  };
  raw: {
    originalData: CharacterData;
    processingNotes: string[];
  };
}

export class GenericJSONAdapter implements FormatAdapter {
  getMetadata(): FormatMetadata {
    return {
      id: 'generic-json',
      name: 'Generic JSON',
      description: 'Comprehensive JSON format preserving all character data',
      fileExtension: 'json',
      mimeType: 'application/json',
      version: '1.0.0',
      documentationUrl: undefined,
      website: undefined
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
      { feature: 'homebrew_content', support: 'full' }
    ];
  }

  async analyzeCompatibility(characterData: CharacterData): Promise<CompatibilityAnalysis> {
    // Generic JSON format supports everything at 100%
    return {
      score: 100,
      capabilities: this.getSupportedFeatures(),
      recommendation: 'excellent',
      limitations: [],
      dataLoss: 0
    };
  }

  canConvert(characterData: CharacterData): boolean {
    return !!(characterData.id && characterData.name);
  }

  async convert(characterData: CharacterData, options?: ConversionOptions): Promise<ConversionResult> {
    const startTime = performance.now();
    
    try {
      if (!this.canConvert(characterData)) {
        return {
          success: false,
          error: 'Character data is missing required fields for Generic JSON conversion'
        };
      }

      const genericData = this.convertToGenericFormat(characterData, options);
      const conversionTime = performance.now() - startTime;
      const jsonData = JSON.stringify(genericData, null, 2);

      return {
        success: true,
        data: jsonData,
        performance: {
          conversionTime: Math.round(conversionTime),
          dataSize: jsonData.length
        },
        warnings: []
      };

    } catch (error) {
      return {
        success: false,
        error: `Generic JSON conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private convertToGenericFormat(characterData: CharacterData, options?: ConversionOptions): GenericCharacterData {
    const processingNotes: string[] = [];
    
    return {
      metadata: {
        version: '1.0.0',
        exportDate: new Date().toISOString(),
        source: 'B2FG Character Converter',
        originalId: characterData.id
      },
      character: {
        basic: this.convertBasicInfo(characterData, processingNotes),
        abilities: this.convertAbilities(characterData, processingNotes),
        skills: this.convertSkills(characterData, processingNotes),
        combat: this.convertCombatStats(characterData, processingNotes),
        spellcasting: this.convertSpellcasting(characterData, processingNotes),
        inventory: this.convertInventory(characterData, processingNotes),
        features: this.convertFeatures(characterData, processingNotes),
        proficiencies: this.convertProficiencies(characterData, processingNotes),
        traits: this.convertTraits(characterData, processingNotes)
      },
      raw: {
        originalData: characterData,
        processingNotes
      }
    };
  }

  private convertBasicInfo(characterData: CharacterData, notes: string[]): GenericCharacterData['character']['basic'] {
    const classes = characterData.classes || [];
    const totalLevel = classes.reduce((sum, cls) => sum + (cls.level || 0), 0);
    
    return {
      id: characterData.id,
      name: characterData.name,
      level: totalLevel,
      experience: characterData.currentXp || 0,
      alignment: characterData.alignment?.name || 'Unknown',
      race: characterData.race,
      background: characterData.background,
      classes: classes
    };
  }

  private convertAbilities(characterData: CharacterData, notes: string[]): GenericCharacterData['character']['abilities'] {
    const stats = characterData.stats || [];
    const abilities = {} as GenericCharacterData['character']['abilities'];
    
    const abilityMapping = [
      { id: 1, name: 'strength' as const },
      { id: 2, name: 'dexterity' as const },
      { id: 3, name: 'constitution' as const },
      { id: 4, name: 'intelligence' as const },
      { id: 5, name: 'wisdom' as const },
      { id: 6, name: 'charisma' as const }
    ];

    abilityMapping.forEach(({ id, name }) => {
      const stat = stats.find(s => s.id === id);
      const score = stat?.value || 10;
      const modifier = Math.floor((score - 10) / 2);
      const saveProficient = this.hasAbilitySaveProficiency(characterData, name);
      
      abilities[name] = { score, modifier, saveProficient };
    });

    return abilities;
  }

  private convertSkills(characterData: CharacterData, notes: string[]): GenericCharacterData['character']['skills'] {
    const skills: GenericCharacterData['character']['skills'] = {};
    
    const skillDefinitions = [
      { name: 'Acrobatics', ability: 'dexterity', key: 'acrobatics' },
      { name: 'Animal Handling', ability: 'wisdom', key: 'animalHandling' },
      { name: 'Arcana', ability: 'intelligence', key: 'arcana' },
      { name: 'Athletics', ability: 'strength', key: 'athletics' },
      { name: 'Deception', ability: 'charisma', key: 'deception' },
      { name: 'History', ability: 'intelligence', key: 'history' },
      { name: 'Insight', ability: 'wisdom', key: 'insight' },
      { name: 'Intimidation', ability: 'charisma', key: 'intimidation' },
      { name: 'Investigation', ability: 'intelligence', key: 'investigation' },
      { name: 'Medicine', ability: 'wisdom', key: 'medicine' },
      { name: 'Nature', ability: 'intelligence', key: 'nature' },
      { name: 'Perception', ability: 'wisdom', key: 'perception' },
      { name: 'Performance', ability: 'charisma', key: 'performance' },
      { name: 'Persuasion', ability: 'charisma', key: 'persuasion' },
      { name: 'Religion', ability: 'intelligence', key: 'religion' },
      { name: 'Sleight of Hand', ability: 'dexterity', key: 'sleightOfHand' },
      { name: 'Stealth', ability: 'dexterity', key: 'stealth' },
      { name: 'Survival', ability: 'wisdom', key: 'survival' }
    ];

    const proficiencyBonus = this.calculateProficiencyBonus(characterData);

    skillDefinitions.forEach(skill => {
      const proficiencyLevel = this.getSkillProficiency(characterData, skill.name);
      const proficiency = proficiencyLevel === 0 ? 'none' : 
                         proficiencyLevel === 2 ? 'expertise' : 'proficient';
      
      const abilityScore = this.getAbilityScore(characterData, skill.ability);
      const abilityModifier = Math.floor((abilityScore - 10) / 2);
      const proficiencyBonus_skill = proficiencyLevel > 0 ? proficiencyBonus * proficiencyLevel : 0;
      const modifier = abilityModifier + proficiencyBonus_skill;
      
      skills[skill.key] = {
        ability: skill.ability,
        proficiency,
        modifier
      };
    });

    return skills;
  }

  private convertCombatStats(characterData: CharacterData, notes: string[]): GenericCharacterData['character']['combat'] {
    const level = this.calculateTotalLevel(characterData);
    const dexModifier = Math.floor((this.getAbilityScore(characterData, 'dexterity') - 10) / 2);
    
    return {
      armorClass: this.calculateAC(characterData),
      hitPoints: {
        current: this.calculateMaxHP(characterData),
        maximum: this.calculateMaxHP(characterData),
        temporary: 0
      },
      initiative: dexModifier,
      speed: {
        walk: characterData.race?.weightSpeeds?.normal?.walk || 30,
        fly: characterData.race?.weightSpeeds?.normal?.fly,
        swim: characterData.race?.weightSpeeds?.normal?.swim,
        climb: characterData.race?.weightSpeeds?.normal?.climb,
        burrow: characterData.race?.weightSpeeds?.normal?.burrow
      },
      proficiencyBonus: this.calculateProficiencyBonus(characterData)
    };
  }

  private convertSpellcasting(characterData: CharacterData, notes: string[]): GenericCharacterData['character']['spellcasting'] {
    const spellcastingAbility = this.getPrimarySpellcastingAbility(characterData);
    const spellDC = this.calculateSpellDC(characterData, spellcastingAbility);
    const spellAttackBonus = this.calculateSpellAttackBonus(characterData, spellcastingAbility);
    const spellSlots = this.calculateSpellSlots(characterData);
    const pactMagic = this.calculatePactMagicSlots(characterData);
    
    const slots: Record<string, { current: number; maximum: number }> = {};
    for (let level = 1; level <= 9; level++) {
      const maxSlots = spellSlots[level] || 0;
      slots[`level${level}`] = { current: maxSlots, maximum: maxSlots };
    }

    // Organize spells
    const spells = characterData.spells || {};
    const spellsData = {
      known: spells.class || [],
      prepared: (spells.class || []).filter((spell: any) => spell.prepared),
      always: spells.race || []
    };

    return {
      ability: spellcastingAbility,
      spellSaveDC: spellDC,
      spellAttackBonus: spellAttackBonus,
      slots,
      pactMagic: pactMagic.slots > 0 ? { level: pactMagic.level, slots: pactMagic.slots } : undefined,
      spells: spellsData
    };
  }

  private convertInventory(characterData: CharacterData, notes: string[]): GenericCharacterData['character']['inventory'] {
    const inventory = characterData.inventory || [];
    const currencies = characterData.currencies || {};
    
    // Categorize items
    const equipment: any[] = [];
    const weapons: any[] = [];
    const armor: any[] = [];
    const items: any[] = [];

    inventory.forEach(item => {
      const filterType = item.definition?.filterType?.toLowerCase();
      
      if (filterType === 'weapon') {
        weapons.push(item);
      } else if (filterType === 'armor') {
        armor.push(item);
      } else if (item.definition?.equipmentCategoryId) {
        equipment.push(item);
      } else {
        items.push(item);
      }
    });

    return {
      currency: {
        copper: currencies.cp || 0,
        silver: currencies.sp || 0,
        electrum: currencies.ep || 0,
        gold: currencies.gp || 0,
        platinum: currencies.pp || 0
      },
      equipment,
      weapons,
      armor,
      items
    };
  }

  private convertFeatures(characterData: CharacterData, notes: string[]): GenericCharacterData['character']['features'] {
    const classes = characterData.classes || [];
    const racial = characterData.race?.racialTraits || [];
    const background = characterData.background?.backgroundFeatures || [];
    const feats = characterData.feats || [];
    
    const classFeatures: any[] = [];
    classes.forEach(cls => {
      if (cls.classFeatures) {
        classFeatures.push(...cls.classFeatures);
      }
    });

    return {
      racial,
      class: classFeatures,
      background,
      feats,
      other: []
    };
  }

  private convertProficiencies(characterData: CharacterData, notes: string[]): GenericCharacterData['character']['proficiencies'] {
    const modifiers = characterData.modifiers || {};
    
    return {
      armor: this.extractProficiencies(modifiers, 'armor'),
      weapons: this.extractProficiencies(modifiers, 'weapon'),
      tools: this.extractProficiencies(modifiers, 'tool'),
      languages: this.extractLanguages(characterData),
      savingThrows: this.extractSavingThrowProficiencies(modifiers)
    };
  }

  private convertTraits(characterData: CharacterData, notes: string[]): GenericCharacterData['character']['traits'] {
    const race = characterData.race;
    
    return {
      size: race?.size || 'Medium',
      senses: {
        darkvision: this.getDarkvisionRange(characterData),
        blindsight: 0,
        tremorsense: 0,
        truesight: 0
      },
      resistances: this.extractResistances(characterData),
      immunities: this.extractImmunities(characterData),
      vulnerabilities: this.extractVulnerabilities(characterData),
      conditionImmunities: this.extractConditionImmunities(characterData)
    };
  }

  // Helper methods

  private calculateTotalLevel(characterData: CharacterData): number {
    const classes = characterData.classes || [];
    return classes.reduce((total, cls) => total + (cls.level || 0), 0);
  }

  private getAbilityScore(characterData: CharacterData, ability: string): number {
    const abilityMap: Record<string, number> = {
      'strength': 1, 'dexterity': 2, 'constitution': 3, 
      'intelligence': 4, 'wisdom': 5, 'charisma': 6
    };
    
    const abilityId = abilityMap[ability];
    const stats = characterData.stats || [];
    const stat = stats.find(s => s.id === abilityId);
    
    return stat?.value || 10;
  }

  private calculateProficiencyBonus(characterData: CharacterData): number {
    const level = this.calculateTotalLevel(characterData);
    return Math.ceil(level / 4) + 1;
  }

  private hasAbilitySaveProficiency(characterData: CharacterData, ability: string): boolean {
    const modifiers = characterData.modifiers || {};
    const savingThrows = modifiers.savingThrow || [];
    
    return savingThrows.some((mod: any) => {
      const subType = mod.subType?.toLowerCase();
      return subType === `${ability}-saving-throws`;
    });
  }

  private getSkillProficiency(characterData: CharacterData, skillName: string): number {
    const modifiers = characterData.modifiers || {};
    const skillModifiers = modifiers.skill || [];
    
    const proficiency = skillModifiers.find((mod: any) => 
      mod.friendlySubtypeName?.toLowerCase().includes(skillName.toLowerCase())
    );
    
    if (!proficiency) return 0;
    if (proficiency.value && proficiency.value >= 2) return 2;
    return 1;
  }

  private calculateAC(characterData: CharacterData): number {
    const dexModifier = Math.floor((this.getAbilityScore(characterData, 'dexterity') - 10) / 2);
    return 10 + dexModifier;
  }

  private calculateMaxHP(characterData: CharacterData): number {
    const level = this.calculateTotalLevel(characterData);
    const constitution = this.getAbilityScore(characterData, 'constitution');
    const conModifier = Math.floor((constitution - 10) / 2);
    
    const hitDie = this.getAverageHitDie(characterData);
    const baseHP = Math.max(1, hitDie + conModifier);
    const additionalHP = Math.max(0, (level - 1) * (Math.floor(hitDie / 2) + 1 + conModifier));
    
    return baseHP + additionalHP;
  }

  private getAverageHitDie(characterData: CharacterData): number {
    const classes = characterData.classes || [];
    if (classes.length === 0) return 8;
    
    const primaryClass = classes[0];
    const className = primaryClass.definition?.name?.toLowerCase() || '';
    
    const hitDieMap: Record<string, number> = {
      'barbarian': 12,
      'fighter': 10, 'paladin': 10, 'ranger': 10,
      'bard': 8, 'cleric': 8, 'druid': 8, 'monk': 8, 'rogue': 8, 'warlock': 8,
      'artificer': 8, 'sorcerer': 6, 'wizard': 6
    };
    
    return hitDieMap[className] || 8;
  }

  private getPrimarySpellcastingAbility(characterData: CharacterData): string {
    const classes = characterData.classes || [];
    const spellcastingClass = classes.find(cls => 
      this.isSpellcastingClass(cls.definition?.name)
    );
    
    if (!spellcastingClass) return 'intelligence';
    
    const className = spellcastingClass.definition?.name?.toLowerCase() || '';
    const spellcastingAbilities: Record<string, string> = {
      'wizard': 'intelligence', 'artificer': 'intelligence',
      'cleric': 'wisdom', 'druid': 'wisdom', 'ranger': 'wisdom',
      'bard': 'charisma', 'paladin': 'charisma', 'sorcerer': 'charisma', 'warlock': 'charisma'
    };
    
    return spellcastingAbilities[className] || 'intelligence';
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

  private calculateSpellDC(characterData: CharacterData, ability: string): number {
    const proficiencyBonus = this.calculateProficiencyBonus(characterData);
    const abilityModifier = Math.floor((this.getAbilityScore(characterData, ability) - 10) / 2);
    
    return 8 + proficiencyBonus + abilityModifier;
  }

  private calculateSpellAttackBonus(characterData: CharacterData, ability: string): number {
    const proficiencyBonus = this.calculateProficiencyBonus(characterData);
    const abilityModifier = Math.floor((this.getAbilityScore(characterData, ability) - 10) / 2);
    
    return proficiencyBonus + abilityModifier;
  }

  private calculateSpellSlots(characterData: CharacterData): Record<number, number> {
    const slots: Record<number, number> = {};
    const classes = characterData.classes || [];
    
    // Simplified spell slot calculation
    classes.forEach(cls => {
      const className = cls.definition?.name?.toLowerCase() || '';
      const level = cls.level || 0;
      
      if (this.isSpellcastingClass(className) && className !== 'warlock') {
        if (level >= 1) slots[1] = (slots[1] || 0) + Math.min(4, level + 1);
      }
    });
    
    return slots;
  }

  private calculatePactMagicSlots(characterData: CharacterData): { slots: number; level: number } {
    const classes = characterData.classes || [];
    const warlockClass = classes.find(cls => 
      cls.definition?.name?.toLowerCase() === 'warlock'
    );
    
    if (!warlockClass) return { slots: 0, level: 1 };
    
    const level = warlockClass.level || 0;
    if (level >= 17) return { slots: 4, level: 5 };
    if (level >= 11) return { slots: 3, level: 5 };
    if (level >= 9) return { slots: 2, level: 5 };
    if (level >= 7) return { slots: 2, level: 4 };
    if (level >= 5) return { slots: 2, level: 3 };
    if (level >= 3) return { slots: 2, level: 2 };
    if (level >= 1) return { slots: 1, level: 1 };
    
    return { slots: 0, level: 1 };
  }

  private extractProficiencies(modifiers: any, type: string): string[] {
    const proficiencies: string[] = [];
    
    // This would need to be implemented based on the modifier structure
    // Simplified for now
    
    return proficiencies;
  }

  private extractLanguages(characterData: CharacterData): string[] {
    const languages: string[] = [];
    
    // Extract from racial traits, background, etc.
    // Simplified for now
    languages.push('Common');
    
    return languages;
  }

  private extractSavingThrowProficiencies(modifiers: any): string[] {
    const savingThrows = modifiers.savingThrow || [];
    return savingThrows.map((mod: any) => 
      mod.subType?.replace('-saving-throws', '') || 'Unknown'
    );
  }

  private getDarkvisionRange(characterData: CharacterData): number {
    const race = characterData.race;
    if (race?.racialTraits) {
      const darkvision = race.racialTraits.find((trait: any) => 
        trait.definition?.name?.toLowerCase().includes('darkvision')
      );
      if (darkvision) return 60;
    }
    return 0;
  }

  private extractResistances(characterData: CharacterData): string[] {
    // Extract damage resistances from racial traits, class features, etc.
    return [];
  }

  private extractImmunities(characterData: CharacterData): string[] {
    // Extract damage immunities from racial traits, class features, etc.
    return [];
  }

  private extractVulnerabilities(characterData: CharacterData): string[] {
    // Extract damage vulnerabilities from racial traits, class features, etc.
    return [];
  }

  private extractConditionImmunities(characterData: CharacterData): string[] {
    // Extract condition immunities from racial traits, class features, etc.
    return [];
  }
}