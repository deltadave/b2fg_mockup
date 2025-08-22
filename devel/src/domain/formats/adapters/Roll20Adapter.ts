/**
 * Roll20 Format Adapter
 * 
 * Converts D&D Beyond character data to Roll20 character sheet format.
 * Roll20 uses a specific JSON structure for character data import.
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
import { AbilityScoreUtils } from '@/domain/character/constants/AbilityConstants';

export interface Roll20Character {
  name: string;
  avatar: string;
  bio: string;
  gmnotes: string;
  archived: boolean;
  inplayerjournals: string;
  controlledby: string;
  
  // Character Sheet Attributes
  [key: string]: string | number | boolean;
}

export class Roll20Adapter implements FormatAdapter {
  getMetadata(): FormatMetadata {
    return {
      id: 'roll20',
      name: 'Roll20',
      description: 'JSON format for Roll20 D&D 5e character sheets',
      fileExtension: 'json',
      mimeType: 'application/json',
      version: '5e-shaped',
      documentationUrl: 'https://wiki.roll20.net/5th_Edition_OGL_by_Roll20',
      website: 'https://roll20.net'
    };
  }

  getSupportedFeatures(): FormatCapability[] {
    return [
      { feature: 'abilities', support: 'full' },
      { feature: 'skills', support: 'full' },
      { feature: 'saving_throws', support: 'full' },
      { feature: 'spellcasting', support: 'partial', limitations: 'Basic spell data only, complex spell effects not supported' },
      { feature: 'spell_slots', support: 'full' },
      { feature: 'weapons', support: 'partial', limitations: 'Basic weapon stats, complex properties may be lost' },
      { feature: 'armor', support: 'partial', limitations: 'Basic armor stats, special properties may be simplified' },
      { feature: 'magic_items', support: 'partial', limitations: 'Magic items imported as equipment, effects not automated' },
      { feature: 'class_features', support: 'partial', limitations: 'Features listed in bio, no automation' },
      { feature: 'racial_features', support: 'partial', limitations: 'Features listed in bio, no automation' },
      { feature: 'feats', support: 'partial', limitations: 'Feats listed in bio, no automation' },
      { feature: 'homebrew_content', support: 'partial', limitations: 'Homebrew content imported as basic data', impact: 'medium' }
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
          error: 'Character data is missing required fields for Roll20 conversion'
        };
      }

      const roll20Character = this.convertToRoll20Format(characterData, options);
      const conversionTime = performance.now() - startTime;
      const jsonData = JSON.stringify(roll20Character, null, 2);

      return {
        success: true,
        data: jsonData,
        performance: {
          conversionTime: Math.round(conversionTime),
          dataSize: jsonData.length
        },
        warnings: this.generateWarnings(characterData)
      };

    } catch (error) {
      return {
        success: false,
        error: `Roll20 conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private convertToRoll20Format(characterData: CharacterData, options?: ConversionOptions): Roll20Character {
    const character: Roll20Character = {
      name: characterData.name,
      avatar: characterData.avatarUrl || '',
      bio: this.generateBio(characterData),
      gmnotes: '',
      archived: false,
      inplayerjournals: '',
      controlledby: '',
      
      // Basic Character Info
      character_name: characterData.name,
      race: characterData.race?.fullName || characterData.race?.baseName || '',
      background: characterData.background?.definition?.name || '',
      alignment: characterData.alignment?.name || '',
      experience_points: characterData.currentXp || 0,
      
      // Level and Class
      level: this.calculateTotalLevel(characterData),
      class_display: this.generateClassString(characterData),
      
      // Abilities
      ...this.convertAbilities(characterData),
      
      // Skills
      ...this.convertSkills(characterData),
      
      // Combat Stats
      armor_class: this.calculateAC(characterData),
      hit_point_max: this.calculateMaxHP(characterData),
      hit_points: this.calculateMaxHP(characterData),
      speed: this.getMovementSpeed(characterData),
      
      // Spellcasting
      ...this.convertSpellcasting(characterData),
      
      // Proficiency Bonus
      pb: this.calculateProficiencyBonus(characterData),
      
      // Initiative
      initiative_bonus: AbilityScoreUtils.getModifier(this.getAbilityScore(characterData, 'dex')),
      
      // Senses
      passive_wisdom: 10 + this.getSkillModifier(characterData, 'Perception'),
      
      // Equipment
      cp: characterData.currencies?.cp || 0,
      sp: characterData.currencies?.sp || 0,
      ep: characterData.currencies?.ep || 0,
      gp: characterData.currencies?.gp || 0,
      pp: characterData.currencies?.pp || 0,
      
      // Features and Traits
      features_and_traits: this.generateFeaturesText(characterData),
      
      // Equipment list
      equipment: this.generateEquipmentText(characterData)
    };

    return character;
  }

  private convertAbilities(characterData: CharacterData): Record<string, number> {
    const abilities: Record<string, number> = {};
    const stats = characterData.stats || [];
    
    const abilityMapping = [
      { dndbId: 1, name: 'strength' },
      { dndbId: 2, name: 'dexterity' },
      { dndbId: 3, name: 'constitution' },
      { dndbId: 4, name: 'intelligence' },
      { dndbId: 5, name: 'wisdom' },
      { dndbId: 6, name: 'charisma' }
    ];

    abilityMapping.forEach(({ dndbId, name }) => {
      const stat = stats.find(s => s.id === dndbId);
      const value = stat?.value || 10;
      const modifier = AbilityScoreUtils.getModifier(value);
      
      abilities[name] = value;
      abilities[`${name}_mod`] = modifier;
      abilities[`${name}_save_prof`] = this.hasAbilitySaveProficiency(characterData, name) ? 1 : 0;
      abilities[`${name}_save_mod`] = modifier + (abilities[`${name}_save_prof`] ? this.calculateProficiencyBonus(characterData) : 0);
    });

    return abilities;
  }

  private convertSkills(characterData: CharacterData): Record<string, number> {
    const skills: Record<string, number> = {};
    
    const skillDefinitions = [
      { name: 'Acrobatics', ability: 'dex', key: 'acrobatics' },
      { name: 'Animal Handling', ability: 'wis', key: 'animal_handling' },
      { name: 'Arcana', ability: 'int', key: 'arcana' },
      { name: 'Athletics', ability: 'str', key: 'athletics' },
      { name: 'Deception', ability: 'cha', key: 'deception' },
      { name: 'History', ability: 'int', key: 'history' },
      { name: 'Insight', ability: 'wis', key: 'insight' },
      { name: 'Intimidation', ability: 'cha', key: 'intimidation' },
      { name: 'Investigation', ability: 'int', key: 'investigation' },
      { name: 'Medicine', ability: 'wis', key: 'medicine' },
      { name: 'Nature', ability: 'int', key: 'nature' },
      { name: 'Perception', ability: 'wis', key: 'perception' },
      { name: 'Performance', ability: 'cha', key: 'performance' },
      { name: 'Persuasion', ability: 'cha', key: 'persuasion' },
      { name: 'Religion', ability: 'int', key: 'religion' },
      { name: 'Sleight of Hand', ability: 'dex', key: 'sleight_of_hand' },
      { name: 'Stealth', ability: 'dex', key: 'stealth' },
      { name: 'Survival', ability: 'wis', key: 'survival' }
    ];

    skillDefinitions.forEach(skill => {
      const proficiency = this.getSkillProficiency(characterData, skill.name);
      const abilityMod = AbilityScoreUtils.getModifier(this.getAbilityScore(characterData, skill.ability));
      const profBonus = proficiency > 0 ? this.calculateProficiencyBonus(characterData) * proficiency : 0;
      
      skills[`${skill.key}_prof`] = proficiency;
      skills[`${skill.key}_mod`] = abilityMod + profBonus;
    });

    return skills;
  }

  private convertSpellcasting(characterData: CharacterData): Record<string, any> {
    const spellcasting: Record<string, any> = {};
    
    const spellcastingAbility = this.getPrimarySpellcastingAbility(characterData);
    const spellDC = this.calculateSpellDC(characterData, spellcastingAbility);
    const spellAttackBonus = this.calculateSpellAttackBonus(characterData, spellcastingAbility);
    
    spellcasting.spellcasting_ability = spellcastingAbility;
    spellcasting.spell_save_dc = spellDC;
    spellcasting.spell_attack_bonus = spellAttackBonus;
    
    // Spell slots
    const spellSlots = this.calculateSpellSlots(characterData);
    for (let level = 1; level <= 9; level++) {
      spellcasting[`lvl${level}_slots_total`] = spellSlots[level] || 0;
      spellcasting[`lvl${level}_slots_expended`] = 0;
    }
    
    return spellcasting;
  }

  private generateBio(characterData: CharacterData): string {
    const parts: string[] = [];
    
    // Basic info
    const race = characterData.race?.fullName || characterData.race?.baseName;
    const background = characterData.background?.definition?.name;
    const classString = this.generateClassString(characterData);
    
    if (race) parts.push(`**Race:** ${race}`);
    if (background) parts.push(`**Background:** ${background}`);
    if (classString) parts.push(`**Class:** ${classString}`);
    
    // Features
    const features = this.extractAllFeatures(characterData);
    if (features.length > 0) {
      parts.push('**Features:**');
      features.forEach(feature => {
        parts.push(`• ${feature.name}`);
      });
    }
    
    // Backstory
    if (characterData.notes?.backstory) {
      parts.push('**Backstory:**');
      parts.push(characterData.notes.backstory);
    }
    
    return parts.join('\n');
  }

  private generateFeaturesText(characterData: CharacterData): string {
    const features = this.extractAllFeatures(characterData);
    return features.map(feature => 
      `${feature.name}: ${feature.description || 'No description available.'}`
    ).join('\n\n');
  }

  private generateEquipmentText(characterData: CharacterData): string {
    const inventory = characterData.inventory || [];
    return inventory.map(item => {
      const def = item.definition || {};
      const quantity = item.quantity > 1 ? ` (${item.quantity})` : '';
      return `${def.name || 'Unknown Item'}${quantity}`;
    }).join(', ');
  }

  // Helper methods (similar to FoundryVTT adapter but adapted for Roll20)

  private calculateTotalLevel(characterData: CharacterData): number {
    const classes = characterData.classes || [];
    return classes.reduce((total, cls) => total + (cls.level || 0), 0);
  }

  private getAbilityScore(characterData: CharacterData, ability: string): number {
    const abilityMap: Record<string, number> = {
      'str': 1, 'dex': 2, 'con': 3, 'int': 4, 'wis': 5, 'cha': 6
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
    if (proficiency.value && proficiency.value >= 2) return 2; // Expertise
    return 1; // Proficient
  }

  private getSkillModifier(characterData: CharacterData, skillName: string): number {
    const skillAbilityMap: Record<string, string> = {
      'Perception': 'wis',
      'Insight': 'wis',
      'Investigation': 'int',
      // Add more as needed
    };
    
    const ability = skillAbilityMap[skillName] || 'wis';
    const abilityMod = AbilityScoreUtils.getModifier(this.getAbilityScore(characterData, ability));
    const proficiency = this.getSkillProficiency(characterData, skillName);
    const profBonus = proficiency > 0 ? this.calculateProficiencyBonus(characterData) * proficiency : 0;
    
    return abilityMod + profBonus;
  }

  private calculateAC(characterData: CharacterData): number {
    // Simplified AC calculation
    const dexModifier = AbilityScoreUtils.getModifier(this.getAbilityScore(characterData, 'dex'));
    return 10 + dexModifier;
  }

  private calculateMaxHP(characterData: CharacterData): number {
    const level = this.calculateTotalLevel(characterData);
    const constitution = this.getAbilityScore(characterData, 'con');
    const conModifier = AbilityScoreUtils.getModifier(constitution);
    
    // Simplified HP calculation
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

  private getMovementSpeed(characterData: CharacterData): number {
    return characterData.race?.weightSpeeds?.normal?.walk || 30;
  }

  private generateClassString(characterData: CharacterData): string {
    const classes = characterData.classes || [];
    if (classes.length === 0) return '';
    
    return classes.map(cls => 
      `${cls.definition?.name || 'Unknown'} ${cls.level}`
    ).join(' / ');
  }

  private getPrimarySpellcastingAbility(characterData: CharacterData): string {
    const classes = characterData.classes || [];
    const spellcastingClass = classes.find(cls => 
      this.isSpellcastingClass(cls.definition?.name)
    );
    
    if (!spellcastingClass) return 'int';
    
    const className = spellcastingClass.definition?.name?.toLowerCase() || '';
    const spellcastingAbilities: Record<string, string> = {
      'wizard': 'int', 'artificer': 'int',
      'cleric': 'wis', 'druid': 'wis', 'ranger': 'wis',
      'bard': 'cha', 'paladin': 'cha', 'sorcerer': 'cha', 'warlock': 'cha'
    };
    
    return spellcastingAbilities[className] || 'int';
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
    const abilityModifier = AbilityScoreUtils.getModifier(this.getAbilityScore(characterData, ability));
    
    return 8 + proficiencyBonus + abilityModifier;
  }

  private calculateSpellAttackBonus(characterData: CharacterData, ability: string): number {
    const proficiencyBonus = this.calculateProficiencyBonus(characterData);
    const abilityModifier = AbilityScoreUtils.getModifier(this.getAbilityScore(characterData, ability));
    
    return proficiencyBonus + abilityModifier;
  }

  private calculateSpellSlots(characterData: CharacterData): Record<number, number> {
    // Simplified spell slot calculation
    const slots: Record<number, number> = {};
    const classes = characterData.classes || [];
    
    classes.forEach(cls => {
      const className = cls.definition?.name?.toLowerCase() || '';
      const level = cls.level || 0;
      
      if (this.isSpellcastingClass(className) && className !== 'warlock') {
        const classSlots = this.getSpellSlotsByClassAndLevel(className, level);
        Object.entries(classSlots).forEach(([spellLevel, count]) => {
          const slotLevel = parseInt(spellLevel);
          slots[slotLevel] = (slots[slotLevel] || 0) + count;
        });
      }
    });
    
    return slots;
  }

  private getSpellSlotsByClassAndLevel(className: string, level: number): Record<number, number> {
    // Simplified spell slot table
    const fullCasters = ['wizard', 'sorcerer', 'bard', 'cleric', 'druid'];
    const halfCasters = ['paladin', 'ranger'];
    
    if (fullCasters.includes(className)) {
      if (level >= 1) return { 1: Math.min(4, level + 1) };
      return {};
    }
    
    if (halfCasters.includes(className) && level >= 2) {
      const casterLevel = Math.floor(level / 2);
      if (casterLevel >= 1) return { 1: Math.min(4, casterLevel + 1) };
    }
    
    return {};
  }

  private extractAllFeatures(characterData: CharacterData): Array<{name: string; description?: string}> {
    const features: Array<{name: string; description?: string}> = [];
    
    // Class features
    const classes = characterData.classes || [];
    classes.forEach(cls => {
      if (cls.classFeatures) {
        cls.classFeatures.forEach((feature: any) => {
          features.push({
            name: feature.definition?.name || 'Unknown Feature',
            description: feature.definition?.description || ''
          });
        });
      }
    });
    
    // Racial features
    if (characterData.race?.racialTraits) {
      characterData.race.racialTraits.forEach((trait: any) => {
        features.push({
          name: trait.definition?.name || 'Unknown Trait',
          description: trait.definition?.description || ''
        });
      });
    }
    
    // Feats
    const feats = characterData.feats || [];
    feats.forEach((feat: any) => {
      features.push({
        name: feat.definition?.name || 'Unknown Feat',
        description: feat.definition?.description || ''
      });
    });
    
    return features;
  }

  private generateWarnings(characterData: CharacterData): string[] {
    const warnings: string[] = [];
    
    warnings.push('Roll20 format has limited automation - most features will be descriptive text only');
    
    if (this.hasComplexSpellcasting(characterData)) {
      warnings.push('Complex spellcasting features may need manual setup in Roll20');
    }
    
    if (this.hasMagicItems(characterData)) {
      warnings.push('Magic item effects will not be automated in Roll20');
    }
    
    return warnings;
  }

  private hasComplexSpellcasting(characterData: CharacterData): boolean {
    const classes = characterData.classes || [];
    const spellcastingClasses = classes.filter(cls => 
      this.isSpellcastingClass(cls.definition?.name)
    );
    
    return spellcastingClasses.length > 1 || 
           classes.some(cls => cls.definition?.name?.toLowerCase() === 'warlock');
  }

  private hasMagicItems(characterData: CharacterData): boolean {
    const inventory = characterData.inventory || [];
    return inventory.some(item => 
      item.definition?.magic || 
      (item.definition?.rarity && item.definition?.rarity !== 'Common')
    );
  }
}