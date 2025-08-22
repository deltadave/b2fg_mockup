/**
 * Foundry VTT Format Adapter
 * 
 * Converts D&D Beyond character data to Foundry VTT JSON format compatible with
 * the D&D 5e system. Based on research from foundry-research-summary.md.
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

export interface FoundryVTTCharacter {
  _id: string;
  name: string;
  type: "character";
  img: string;
  system: FoundryVTTSystem;
  items: FoundryVTTItem[];
  effects: any[];
  prototypeToken: FoundryVTTToken;
  folder: null;
  sort: number;
  ownership: Record<string, number>;
  flags: Record<string, any>;
}

export interface FoundryVTTSystem {
  abilities: Record<string, FoundryVTTAbility>;
  attributes: FoundryVTTAttributes;
  details: FoundryVTTDetails;
  traits: FoundryVTTTraits;
  currency: FoundryVTTCurrency;
  skills: Record<string, FoundryVTTSkill>;
  spells: FoundryVTTSpells;
  bonuses: FoundryVTTBonuses;
  resources: FoundryVTTResources;
}

export interface FoundryVTTAbility {
  value: number;
  proficient: number;
  bonuses: {
    check: string;
    save: string;
  };
}

export interface FoundryVTTAttributes {
  ac: { value: number; min: number; calc: string; formula: string };
  hp: { value: number; min: number; max: number; temp: number; tempmax: number };
  init: { value: number; bonus: number };
  movement: { burrow: number; climb: number; fly: number; swim: number; walk: number; units: string; hover: boolean };
  senses: { darkvision: number; blindsight: number; tremorsense: number; truesight: number; units: string; special: string };
  spellcasting: string;
  prof: number;
}

export interface FoundryVTTDetails {
  biography: { value: string; public: string };
  alignment: string;
  race: string;
  background: string;
  originalClass: string;
  class: string;
  level: number;
  xp: { value: number; min: number; max: number };
}

export interface FoundryVTTTraits {
  size: string;
  di: { value: string[]; bypasses: string[]; custom: string };
  dr: { value: string[]; bypasses: string[]; custom: string };
  dv: { value: string[]; bypasses: string[]; custom: string };
  ci: { value: string[]; custom: string };
  languages: { value: string[]; custom: string };
  weaponProf: { value: string[]; custom: string };
  armorProf: { value: string[]; custom: string };
  toolProf: { value: string[]; custom: string };
}

export interface FoundryVTTCurrency {
  pp: number;
  gp: number;
  ep: number;
  sp: number;
  cp: number;
}

export interface FoundryVTTSkill {
  value: number;
  ability: string;
  bonuses: {
    check: string;
    passive: string;
  };
}

export interface FoundryVTTSpells {
  spell1: FoundryVTTSpellSlot;
  spell2: FoundryVTTSpellSlot;
  spell3: FoundryVTTSpellSlot;
  spell4: FoundryVTTSpellSlot;
  spell5: FoundryVTTSpellSlot;
  spell6: FoundryVTTSpellSlot;
  spell7: FoundryVTTSpellSlot;
  spell8: FoundryVTTSpellSlot;
  spell9: FoundryVTTSpellSlot;
  pact: FoundryVTTSpellSlot;
  spelldc: { value: number; ability: string; mod: number };
}

export interface FoundryVTTSpellSlot {
  value: number;
  max: number;
  override?: number;
}

export interface FoundryVTTBonuses {
  mwak: { attack: string; damage: string };
  rwak: { attack: string; damage: string };
  msak: { attack: string; damage: string };
  rsak: { attack: string; damage: string };
  abilities: { check: string; save: string; skill: string };
  spell: { dc: string };
}

export interface FoundryVTTResources {
  primary: { value: number; max: number; sr: boolean; lr: boolean; label: string };
  secondary: { value: number; max: number; sr: boolean; lr: boolean; label: string };
  tertiary: { value: number; max: number; sr: boolean; lr: boolean; label: string };
}

export interface FoundryVTTItem {
  _id: string;
  name: string;
  type: string;
  img: string;
  system: any;
  effects: any[];
  folder: null;
  sort: number;
  ownership: Record<string, number>;
  flags: Record<string, any>;
}

export interface FoundryVTTToken {
  name: string;
  displayName: number;
  width: number;
  height: number;
  texture: {
    src: string;
    scaleX: number;
    scaleY: number;
    offsetX: number;
    offsetY: number;
    rotation: number;
  };
  sight: {
    enabled: boolean;
    range: number;
    angle: number;
    visionMode: string;
    color: null;
    attenuation: number;
    brightness: number;
    saturation: number;
    contrast: number;
  };
  detectionModes: any[];
  flags: Record<string, any>;
  randomImg: boolean;
}

export class FoundryVTTAdapter implements FormatAdapter {
  private readonly SKILL_MAP = {
    'acrobatics': 'acr',
    'animal-handling': 'ani',
    'arcana': 'arc',
    'athletics': 'ath',
    'deception': 'dec',
    'history': 'his',
    'insight': 'ins',
    'intimidation': 'inti',
    'investigation': 'inv',
    'medicine': 'med',
    'nature': 'nat',
    'perception': 'prc',
    'performance': 'per',
    'persuasion': 'pers',
    'religion': 'rel',
    'sleight-of-hand': 'slt',
    'stealth': 'ste',
    'survival': 'sur'
  };

  private readonly ABILITY_MAP = {
    'strength': 'str',
    'dexterity': 'dex',
    'constitution': 'con',
    'intelligence': 'int',
    'wisdom': 'wis',
    'charisma': 'cha'
  };

  getMetadata(): FormatMetadata {
    return {
      id: 'foundry-vtt',
      name: 'Foundry VTT',
      description: 'JSON format for Foundry Virtual Tabletop D&D 5e system',
      fileExtension: 'json',
      mimeType: 'application/json',
      version: '4.0.0',
      documentationUrl: 'https://foundryvtt.com/article/actors/',
      website: 'https://foundryvtt.com'
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
      { feature: 'magic_items', support: 'partial', limitations: 'Complex magical effects may need manual configuration' },
      { feature: 'class_features', support: 'partial', limitations: 'Features converted as basic items, may need Active Effects setup' },
      { feature: 'racial_features', support: 'partial', limitations: 'Features converted as basic items, automation may be limited' },
      { feature: 'feats', support: 'partial', limitations: 'Feats converted as basic items, complex interactions may not work' },
      { feature: 'homebrew_content', support: 'partial', limitations: 'Homebrew items created but may lack system integration', impact: 'medium' }
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
          error: 'Character data is missing required fields for Foundry VTT conversion'
        };
      }

      const foundryCharacter = this.convertToFoundryFormat(characterData, options);
      const conversionTime = performance.now() - startTime;
      const jsonData = JSON.stringify(foundryCharacter, null, 2);

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
        error: `Foundry VTT conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private convertToFoundryFormat(characterData: CharacterData, options?: ConversionOptions): FoundryVTTCharacter {
    const characterId = this.generateId();
    
    return {
      _id: characterId,
      name: characterData.name,
      type: "character",
      img: "icons/svg/mystery-man.svg",
      system: this.convertSystemData(characterData),
      items: this.convertItems(characterData),
      effects: [],
      prototypeToken: this.createPrototypeToken(characterData),
      folder: null,
      sort: 0,
      ownership: { default: 0 },
      flags: {
        'dnd5e': {},
        'ddb-importer': {
          source: 'b2fg-converter',
          characterId: characterData.id,
          version: '1.0.0'
        }
      }
    };
  }

  private convertSystemData(characterData: CharacterData): FoundryVTTSystem {
    return {
      abilities: this.convertAbilities(characterData),
      attributes: this.convertAttributes(characterData),
      details: this.convertDetails(characterData),
      traits: this.convertTraits(characterData),
      currency: this.convertCurrency(characterData),
      skills: this.convertSkills(characterData),
      spells: this.convertSpells(characterData),
      bonuses: this.createEmptyBonuses(),
      resources: this.convertResources(characterData)
    };
  }

  private convertAbilities(characterData: CharacterData): Record<string, FoundryVTTAbility> {
    const abilities: Record<string, FoundryVTTAbility> = {};
    const stats = characterData.stats || [];
    
    // Map D&D Beyond stats to Foundry abilities
    const abilityMapping = [
      { dndbId: 1, foundryKey: 'str' },
      { dndbId: 2, foundryKey: 'dex' },
      { dndbId: 3, foundryKey: 'con' },
      { dndbId: 4, foundryKey: 'int' },
      { dndbId: 5, foundryKey: 'wis' },
      { dndbId: 6, foundryKey: 'cha' }
    ];

    abilityMapping.forEach(({ dndbId, foundryKey }) => {
      const stat = stats.find(s => s.id === dndbId);
      const value = stat?.value || 10;
      const proficient = this.hasAbilitySaveProficiency(characterData, foundryKey) ? 1 : 0;

      abilities[foundryKey] = {
        value,
        proficient,
        bonuses: {
          check: "",
          save: ""
        }
      };
    });

    return abilities;
  }

  private convertAttributes(characterData: CharacterData): FoundryVTTAttributes {
    const level = this.calculateTotalLevel(characterData);
    const proficiencyBonus = Math.ceil(level / 4) + 1;
    const constitution = this.getAbilityScore(characterData, 'con');
    const conModifier = AbilityScoreUtils.getModifier(constitution);
    
    // Calculate hit points (simplified)
    const hitDie = this.getAverageHitDie(characterData);
    const baseHP = Math.max(1, hitDie + conModifier);
    const additionalHP = Math.max(0, (level - 1) * (Math.floor(hitDie / 2) + 1 + conModifier));
    const maxHP = baseHP + additionalHP;

    return {
      ac: {
        value: this.calculateAC(characterData),
        min: 0,
        calc: "default",
        formula: ""
      },
      hp: {
        value: maxHP,
        min: 0,
        max: maxHP,
        temp: 0,
        tempmax: 0
      },
      init: {
        value: 0,
        bonus: AbilityScoreUtils.getModifier(this.getAbilityScore(characterData, 'dex'))
      },
      movement: {
        burrow: 0,
        climb: 0,
        fly: 0,
        swim: 0,
        walk: this.getMovementSpeed(characterData),
        units: "ft",
        hover: false
      },
      senses: {
        darkvision: this.getDarkvisionRange(characterData),
        blindsight: 0,
        tremorsense: 0,
        truesight: 0,
        units: "ft",
        special: ""
      },
      spellcasting: this.getPrimarySpellcastingAbility(characterData),
      prof: proficiencyBonus
    };
  }

  private convertDetails(characterData: CharacterData): FoundryVTTDetails {
    const classes = characterData.classes || [];
    const primaryClass = classes[0];
    
    return {
      biography: {
        value: this.generateBiography(characterData),
        public: ""
      },
      alignment: characterData.alignment?.name || "Neutral",
      race: characterData.race?.fullName || characterData.race?.baseName || "Unknown",
      background: characterData.background?.definition?.name || "Unknown",
      originalClass: primaryClass?.definition?.name || "Unknown",
      class: this.generateClassString(characterData),
      level: this.calculateTotalLevel(characterData),
      xp: {
        value: characterData.currentXp || 0,
        min: 0,
        max: this.getXPForNextLevel(this.calculateTotalLevel(characterData))
      }
    };
  }

  private convertTraits(characterData: CharacterData): FoundryVTTTraits {
    return {
      size: this.getRaceSize(characterData),
      di: { value: [], bypasses: [], custom: "" },
      dr: { value: [], bypasses: [], custom: "" },
      dv: { value: [], bypasses: [], custom: "" },
      ci: { value: [], custom: "" },
      languages: this.getLanguages(characterData),
      weaponProf: { value: [], custom: "" },
      armorProf: { value: [], custom: "" },
      toolProf: { value: [], custom: "" }
    };
  }

  private convertCurrency(characterData: CharacterData): FoundryVTTCurrency {
    const currencies = characterData.currencies || {};
    return {
      pp: currencies.pp || 0,
      gp: currencies.gp || 0,
      ep: currencies.ep || 0,
      sp: currencies.sp || 0,
      cp: currencies.cp || 0
    };
  }

  private convertSkills(characterData: CharacterData): Record<string, FoundryVTTSkill> {
    const skills: Record<string, FoundryVTTSkill> = {};
    
    // Initialize all D&D 5e skills
    const skillDefinitions = [
      { key: 'acr', ability: 'dex', name: 'Acrobatics' },
      { key: 'ani', ability: 'wis', name: 'Animal Handling' },
      { key: 'arc', ability: 'int', name: 'Arcana' },
      { key: 'ath', ability: 'str', name: 'Athletics' },
      { key: 'dec', ability: 'cha', name: 'Deception' },
      { key: 'his', ability: 'int', name: 'History' },
      { key: 'ins', ability: 'wis', name: 'Insight' },
      { key: 'inti', ability: 'cha', name: 'Intimidation' },
      { key: 'inv', ability: 'int', name: 'Investigation' },
      { key: 'med', ability: 'wis', name: 'Medicine' },
      { key: 'nat', ability: 'int', name: 'Nature' },
      { key: 'prc', ability: 'wis', name: 'Perception' },
      { key: 'per', ability: 'cha', name: 'Performance' },
      { key: 'pers', ability: 'cha', name: 'Persuasion' },
      { key: 'rel', ability: 'int', name: 'Religion' },
      { key: 'slt', ability: 'dex', name: 'Sleight of Hand' },
      { key: 'ste', ability: 'dex', name: 'Stealth' },
      { key: 'sur', ability: 'wis', name: 'Survival' }
    ];

    skillDefinitions.forEach(skill => {
      const proficiency = this.getSkillProficiency(characterData, skill.name);
      skills[skill.key] = {
        value: proficiency,
        ability: skill.ability,
        bonuses: {
          check: "",
          passive: ""
        }
      };
    });

    return skills;
  }

  private convertSpells(characterData: CharacterData): FoundryVTTSpells {
    const spellSlots = this.calculateSpellSlots(characterData);
    const pactSlots = this.calculatePactMagicSlots(characterData);
    const spellcastingAbility = this.getPrimarySpellcastingAbility(characterData);
    const spellDC = this.calculateSpellDC(characterData, spellcastingAbility);

    return {
      spell1: { value: spellSlots[1] || 0, max: spellSlots[1] || 0 },
      spell2: { value: spellSlots[2] || 0, max: spellSlots[2] || 0 },
      spell3: { value: spellSlots[3] || 0, max: spellSlots[3] || 0 },
      spell4: { value: spellSlots[4] || 0, max: spellSlots[4] || 0 },
      spell5: { value: spellSlots[5] || 0, max: spellSlots[5] || 0 },
      spell6: { value: spellSlots[6] || 0, max: spellSlots[6] || 0 },
      spell7: { value: spellSlots[7] || 0, max: spellSlots[7] || 0 },
      spell8: { value: spellSlots[8] || 0, max: spellSlots[8] || 0 },
      spell9: { value: spellSlots[9] || 0, max: spellSlots[9] || 0 },
      pact: { value: pactSlots.slots || 0, max: pactSlots.slots || 0 },
      spelldc: { value: spellDC, ability: spellcastingAbility, mod: 0 }
    };
  }

  private convertResources(characterData: CharacterData): FoundryVTTResources {
    // Convert class resources like Rage, Ki, Spell Slots, etc.
    return {
      primary: { value: 0, max: 0, sr: false, lr: true, label: "" },
      secondary: { value: 0, max: 0, sr: false, lr: true, label: "" },
      tertiary: { value: 0, max: 0, sr: false, lr: true, label: "" }
    };
  }

  private convertItems(characterData: CharacterData): FoundryVTTItem[] {
    const items: FoundryVTTItem[] = [];
    
    // Convert inventory items
    const inventory = characterData.inventory || [];
    inventory.forEach(item => {
      items.push(this.convertInventoryItem(item));
    });

    // Convert spells
    const spells = characterData.spells || {};
    if (spells.class) {
      spells.class.forEach((spell: any) => {
        items.push(this.convertSpell(spell));
      });
    }

    // Convert features (simplified)
    const features = this.extractFeatures(characterData);
    features.forEach(feature => {
      items.push(this.convertFeature(feature));
    });

    return items;
  }

  private convertInventoryItem(item: any): FoundryVTTItem {
    const definition = item.definition || {};
    
    return {
      _id: this.generateId(),
      name: definition.name || 'Unknown Item',
      type: this.getFoundryItemType(definition),
      img: definition.avatarUrl || "icons/svg/item-bag.svg",
      system: this.convertItemSystemData(item),
      effects: [],
      folder: null,
      sort: 0,
      ownership: { default: 0 },
      flags: {}
    };
  }

  private convertSpell(spell: any): FoundryVTTItem {
    const definition = spell.definition || {};
    
    return {
      _id: this.generateId(),
      name: definition.name || 'Unknown Spell',
      type: 'spell',
      img: "icons/svg/book.svg",
      system: {
        description: { value: definition.description || "", chat: "", unidentified: "" },
        source: definition.source || "",
        activation: { type: "action", cost: 1, condition: "" },
        duration: { value: null, units: "" },
        target: { value: null, width: null, units: "", type: "" },
        range: { value: null, long: null, units: "" },
        uses: { value: null, max: "", per: null },
        consume: { type: "", target: null, amount: null },
        ability: "",
        actionType: "",
        attackBonus: 0,
        chatFlavor: "",
        critical: { threshold: null, damage: "" },
        damage: { parts: [], versatile: "" },
        formula: "",
        save: { ability: "", dc: null, scaling: "spell" },
        level: definition.level || 0,
        school: definition.school || "evocation",
        components: { vocal: false, somatic: false, material: false, ritual: false, concentration: false },
        materials: { value: "", consumed: false, cost: 0, supply: 0 },
        preparation: { mode: "prepared", prepared: spell.prepared || false },
        scaling: { mode: "none", formula: "" }
      },
      effects: [],
      folder: null,
      sort: 0,
      ownership: { default: 0 },
      flags: {}
    };
  }

  private convertFeature(feature: any): FoundryVTTItem {
    return {
      _id: this.generateId(),
      name: feature.name || 'Unknown Feature',
      type: 'feat',
      img: "icons/svg/upgrade.svg",
      system: {
        description: { value: feature.description || "", chat: "", unidentified: "" },
        source: feature.source || "",
        activation: { type: "", cost: 0, condition: "" },
        duration: { value: null, units: "" },
        target: { value: null, width: null, units: "", type: "" },
        range: { value: null, long: null, units: "" },
        uses: { value: null, max: "", per: null },
        consume: { type: "", target: null, amount: null },
        ability: null,
        actionType: "",
        attackBonus: 0,
        chatFlavor: "",
        critical: { threshold: null, damage: "" },
        damage: { parts: [], versatile: "" },
        formula: "",
        save: { ability: "", dc: null, scaling: "spell" },
        requirements: "",
        recharge: { value: null, charged: true }
      },
      effects: [],
      folder: null,
      sort: 0,
      ownership: { default: 0 },
      flags: {}
    };
  }

  // Helper methods

  private generateId(): string {
    return 'x' + Math.random().toString(36).substr(2, 16);
  }

  private createPrototypeToken(characterData: CharacterData): FoundryVTTToken {
    return {
      name: characterData.name,
      displayName: 20,
      width: 1,
      height: 1,
      texture: {
        src: characterData.avatarUrl || "icons/svg/mystery-man.svg",
        scaleX: 1,
        scaleY: 1,
        offsetX: 0,
        offsetY: 0,
        rotation: 0
      },
      sight: {
        enabled: false,
        range: 0,
        angle: 360,
        visionMode: "basic",
        color: null,
        attenuation: 0.1,
        brightness: 0,
        saturation: 0,
        contrast: 0
      },
      detectionModes: [],
      flags: {},
      randomImg: false
    };
  }

  private createEmptyBonuses(): FoundryVTTBonuses {
    return {
      mwak: { attack: "", damage: "" },
      rwak: { attack: "", damage: "" },
      msak: { attack: "", damage: "" },
      rsak: { attack: "", damage: "" },
      abilities: { check: "", save: "", skill: "" },
      spell: { dc: "" }
    };
  }

  private hasAbilitySaveProficiency(characterData: CharacterData, ability: string): boolean {
    // Check for saving throw proficiencies
    const modifiers = characterData.modifiers || {};
    const savingThrows = modifiers.savingThrow || [];
    
    return savingThrows.some((mod: any) => {
      const subType = mod.subType?.toLowerCase();
      return subType === `${ability}-saving-throws`;
    });
  }

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

  private calculateAC(characterData: CharacterData): number {
    // Simplified AC calculation - should be enhanced with armor/shield logic
    const dexModifier = AbilityScoreUtils.getModifier(this.getAbilityScore(characterData, 'dex'));
    return 10 + dexModifier;
  }

  private getAverageHitDie(characterData: CharacterData): number {
    const classes = characterData.classes || [];
    if (classes.length === 0) return 8;
    
    // Get primary class hit die (simplified)
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
    // Get base movement speed from race or default to 30
    return characterData.race?.weightSpeeds?.normal?.walk || 30;
  }

  private getDarkvisionRange(characterData: CharacterData): number {
    // Check for darkvision in racial traits
    const race = characterData.race;
    if (race?.racialTraits) {
      const darkvision = race.racialTraits.find((trait: any) => 
        trait.definition?.name?.toLowerCase().includes('darkvision')
      );
      if (darkvision) return 60; // Default darkvision range
    }
    return 0;
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
    const level = this.calculateTotalLevel(characterData);
    const proficiencyBonus = Math.ceil(level / 4) + 1;
    const abilityModifier = AbilityScoreUtils.getModifier(this.getAbilityScore(characterData, ability));
    
    return 8 + proficiencyBonus + abilityModifier;
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

  private getSpellSlotsByClassAndLevel(className: string, level: number): Record<number, number> {
    // Simplified spell slot table - should be enhanced with full D&D 5e data
    const fullCasters = ['wizard', 'sorcerer', 'bard', 'cleric', 'druid'];
    const halfCasters = ['paladin', 'ranger'];
    
    if (fullCasters.includes(className)) {
      // Full caster progression
      if (level >= 1) return { 1: Math.min(4, level + 1) };
      return {};
    }
    
    if (halfCasters.includes(className) && level >= 2) {
      // Half caster progression
      const casterLevel = Math.floor(level / 2);
      if (casterLevel >= 1) return { 1: Math.min(4, casterLevel + 1) };
    }
    
    return {};
  }

  private getSkillProficiency(characterData: CharacterData, skillName: string): number {
    const modifiers = characterData.modifiers || {};
    const skillModifiers = modifiers.skill || [];
    
    const proficiency = skillModifiers.find((mod: any) => 
      mod.friendlySubtypeName?.toLowerCase().includes(skillName.toLowerCase())
    );
    
    if (!proficiency) return 0;
    
    // Check for expertise (double proficiency)
    if (proficiency.value && proficiency.value >= 2) return 2;
    return 1;
  }

  private generateClassString(characterData: CharacterData): string {
    const classes = characterData.classes || [];
    if (classes.length === 0) return "Unknown";
    
    return classes.map(cls => 
      `${cls.definition?.name || 'Unknown'} ${cls.level}`
    ).join(' / ');
  }

  private generateBiography(characterData: CharacterData): string {
    const parts = [];
    
    if (characterData.race?.fullName) {
      parts.push(`<p><strong>Race:</strong> ${characterData.race.fullName}</p>`);
    }
    
    if (characterData.background?.definition?.name) {
      parts.push(`<p><strong>Background:</strong> ${characterData.background.definition.name}</p>`);
    }
    
    const classString = this.generateClassString(characterData);
    if (classString !== "Unknown") {
      parts.push(`<p><strong>Class:</strong> ${classString}</p>`);
    }
    
    if (characterData.notes?.backstory) {
      parts.push(`<p><strong>Backstory:</strong></p><p>${characterData.notes.backstory}</p>`);
    }
    
    return parts.join('\n');
  }

  private getRaceSize(characterData: CharacterData): string {
    const size = characterData.race?.size;
    if (!size) return "Medium";
    
    const sizeMap: Record<string, string> = {
      'Small': 'sm',
      'Medium': 'med',
      'Large': 'lg',
      'Huge': 'huge',
      'Gargantuan': 'grg',
      'Tiny': 'tiny'
    };
    
    return sizeMap[size] || 'med';
  }

  private getLanguages(characterData: CharacterData): { value: string[]; custom: string } {
    const languages: string[] = [];
    
    // Get racial languages
    if (characterData.race?.racialTraits) {
      characterData.race.racialTraits.forEach((trait: any) => {
        if (trait.definition?.name?.toLowerCase().includes('language')) {
          // Parse languages from trait description
          // This is simplified - would need more sophisticated parsing
          languages.push('Common');
        }
      });
    }
    
    return { value: languages, custom: "" };
  }

  private getXPForNextLevel(level: number): number {
    const xpTable = [0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000, 85000, 100000, 120000, 140000, 165000, 195000, 225000, 265000, 305000, 355000];
    return xpTable[level] || 355000;
  }

  private getFoundryItemType(definition: any): string {
    const filterType = definition.filterType?.toLowerCase();
    
    if (filterType === 'weapon') return 'weapon';
    if (filterType === 'armor') return 'equipment';
    if (definition.magic || definition.rarity !== 'Common') return 'equipment';
    return 'loot';
  }

  private convertItemSystemData(item: any): any {
    const definition = item.definition || {};
    
    // Basic item data structure for Foundry
    return {
      description: { value: definition.description || "", chat: "", unidentified: "" },
      source: definition.sourceBook || "",
      quantity: item.quantity || 1,
      weight: definition.weight || 0,
      price: { value: definition.cost || 0, denomination: "gp" },
      attunement: definition.requiresAttunement ? 1 : 0,
      equipped: item.equipped || false,
      rarity: definition.rarity || "common",
      identified: true
    };
  }

  private extractFeatures(characterData: CharacterData): any[] {
    const features: any[] = [];
    
    // Class features
    const classes = characterData.classes || [];
    classes.forEach(cls => {
      if (cls.classFeatures) {
        cls.classFeatures.forEach((feature: any) => {
          features.push({
            name: feature.definition?.name || 'Unknown Feature',
            description: feature.definition?.description || '',
            source: `${cls.definition?.name} Feature`
          });
        });
      }
    });
    
    // Racial features
    if (characterData.race?.racialTraits) {
      characterData.race.racialTraits.forEach((trait: any) => {
        features.push({
          name: trait.definition?.name || 'Unknown Trait',
          description: trait.definition?.description || '',
          source: 'Racial Trait'
        });
      });
    }
    
    return features;
  }

  private generateWarnings(characterData: CharacterData): string[] {
    const warnings: string[] = [];
    
    if (this.hasComplexFeatures(characterData)) {
      warnings.push('Complex class features may require manual setup of Active Effects in Foundry VTT');
    }
    
    if (this.hasMagicItems(characterData)) {
      warnings.push('Magic item effects may need manual configuration in Foundry VTT');
    }
    
    if (this.hasHomebrewContent(characterData)) {
      warnings.push('Homebrew content may not have full system integration');
    }
    
    return warnings;
  }

  private hasComplexFeatures(characterData: CharacterData): boolean {
    const classes = characterData.classes || [];
    return classes.some(cls => cls.classFeatures?.length > 0);
  }

  private hasMagicItems(characterData: CharacterData): boolean {
    const inventory = characterData.inventory || [];
    return inventory.some(item => 
      item.definition?.magic || 
      (item.definition?.rarity && item.definition?.rarity !== 'Common')
    );
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
}