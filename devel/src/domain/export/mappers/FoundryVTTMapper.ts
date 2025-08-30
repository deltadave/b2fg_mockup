/**
 * FoundryVTTMapper - Data Transformation Services
 * 
 * Provides specialized mapping services to convert processed character data
 * to Foundry VTT D&D 5e system format. Uses domain-driven design principles
 * with single-responsibility mappers for each system component.
 * 
 * Based on fvtt-Actor-testcharacter-wgyeGYaSKcQ04K0U.json template structure
 */

import type { ProcessedCharacterData as OrchProcessedData } from '@/domain/conversion/ConversionOrchestrator';
import type { ProcessedAbilityScores } from '@/domain/character/services/AbilityScoreProcessor';
import type { SpellSlotCalculationResult } from '@/domain/character/services/SpellSlotCalculator';
import type { ProcessedInventory } from '@/domain/character/services/InventoryProcessor';
import type { ProcessedFeatures } from '@/domain/character/services/FeatureProcessor';
import type { EncumbranceResult } from '@/domain/character/services/EncumbranceCalculator';
import type { CharacterData } from '@/domain/character/services/CharacterFetcher';
import { StringSanitizer } from '@/shared/utils/StringSanitizer';
import { SafeAccess } from '@/shared/utils/SafeAccess';
import { AbilityScoreUtils, ABILITY_NAMES } from '@/domain/character/constants/AbilityConstants';
import { FoundryVTTFeatureMapper } from './FoundryVTTFeatureMapper';
import { featureFlags } from '@/core/FeatureFlags';

// Foundry VTT D&D 5e System Interfaces
export interface FoundryActor {
  _id?: string;
  name: string;
  type: 'character';
  img: string;
  system: FoundrySystemData;
  items: FoundryItem[];
  effects: FoundryActiveEffect[];
  prototypeToken: FoundryTokenData;
  ownership: { default: number; [userId: string]: number };
  flags: FoundryFlags;
  sort: number;
  folder?: string;
}

export interface FoundrySystemData {
  abilities: FoundryAbilities;
  attributes: FoundryAttributes;
  skills: FoundrySkills;
  traits: FoundryTraits;
  currency: FoundryCurrency;
  details: FoundryDetails;
  spells: FoundrySpells;
  bonuses: FoundryBonuses;
  resources: FoundryResources;
}

export interface FoundryAbilities {
  str: FoundryAbility;
  dex: FoundryAbility;
  con: FoundryAbility;
  int: FoundryAbility;
  wis: FoundryAbility;
  cha: FoundryAbility;
}

export interface FoundryAbility {
  value: number;
  proficient: number; // 0 = not proficient, 1 = proficient, 0.5 = half proficient, 2 = expertise
  max: number | null;
  bonuses: {
    check: string;
    save: string;
  };
  check: FoundryRoll;
  save: FoundryRoll;
}

export interface FoundryRoll {
  roll: {
    min: number | null;
    max: number | null;
    mode: number; // 0 = normal, 1 = advantage, -1 = disadvantage
  };
}

export interface FoundryAttributes {
  ac: {
    calc: string; // "default", "natural", "mage", "draconic", etc.
    formula?: string;
  };
  init: {
    ability: string;
    bonus: string;
    roll: FoundryRoll;
  };
  movement: {
    burrow: number | null;
    climb: number | null;
    fly: number | null;
    swim: number | null;
    walk: number | null;
    units: string | null;
    hover: boolean;
  };
  senses: {
    darkvision: number;
    blindsight: number;
    tremorsense: number;
    truesight: number;
    units: string;
    special: string;
  };
  hp: {
    value: number;
    min: number;
    max: number;
    temp: number;
    tempmax: number;
    formula?: string;
  };
  death: {
    success: number;
    failure: number;
  };
  exhaustion: number;
  inspiration: boolean;
}

export interface FoundrySkills {
  [key: string]: {
    ability: string;
    value: number; // 0 = not proficient, 0.5 = half, 1 = proficient, 2 = expertise
    bonuses: {
      check: string;
      passive: string;
    };
    roll: FoundryRoll;
  };
}

export interface FoundryTraits {
  size: string;
  di: { value: string[]; custom: string };  // damage immunities
  dr: { value: string[]; custom: string };  // damage resistances
  dv: { value: string[]; custom: string };  // damage vulnerabilities
  ci: { value: string[]; custom: string };  // condition immunities
  languages: { value: string[]; custom: string };
  weaponProf: { value: string[]; custom: string };
  armorProf: { value: string[]; custom: string };
  toolProf: { value: string[]; custom: string };
}

export interface FoundryCurrency {
  pp: number;
  gp: number;
  ep: number;
  sp: number;
  cp: number;
}

export interface FoundryDetails {
  biography: {
    value: string;
    public: string;
  };
  alignment: string;
  race: string;
  background: string;
  originalClass?: string;
  xp: {
    value: number;
    min: number;
    max: number;
  };
  appearance: string;
  trait: string;
  ideal: string;
  bond: string;
  flaw: string;
  level: number;
  age?: string;
  height?: string;
  weight?: string;
  eyes?: string;
  skin?: string;
  hair?: string;
  gender?: string;
}

export interface FoundrySpells {
  spell1: { value: number; override?: number; max: number };
  spell2: { value: number; override?: number; max: number };
  spell3: { value: number; override?: number; max: number };
  spell4: { value: number; override?: number; max: number };
  spell5: { value: number; override?: number; max: number };
  spell6: { value: number; override?: number; max: number };
  spell7: { value: number; override?: number; max: number };
  spell8: { value: number; override?: number; max: number };
  spell9: { value: number; override?: number; max: number };
  pact?: {
    value: number;
    override?: number;
    max: number;
    level: number;
  };
}

export interface FoundryBonuses {
  mwak: { attack: string; damage: string };
  rwak: { attack: string; damage: string };
  msak: { attack: string; damage: string };
  rsak: { attack: string; damage: string };
  abilities: { check: string; save: string; skill: string };
  spell: { dc: string };
}

export interface FoundryResources {
  primary: FoundryResource;
  secondary: FoundryResource;
  tertiary: FoundryResource;
}

export interface FoundryResource {
  value: number;
  max: number;
  sr: boolean; // short rest recovery
  lr: boolean; // long rest recovery
  label: string;
}

export interface FoundryItem {
  _id: string;
  name: string;
  type: string;
  img: string;
  system: any; // Item-specific system data
  effects: FoundryActiveEffect[];
  ownership: { default: number };
  flags: any;
  sort: number;
}

export interface FoundryActiveEffect {
  _id: string;
  name: string;
  changes: Array<{
    key: string;
    mode: number;
    value: string;
    priority?: number;
  }>;
  disabled: boolean;
  duration: {
    startTime?: number;
    seconds?: number;
    combat?: number;
    rounds?: number;
    turns?: number;
    startRound?: number;
    startTurn?: number;
  };
  description?: string;
  icon?: string;
  tint?: string;
  transfer: boolean;
  statuses: string[];
  flags: any;
}

export interface FoundryTokenData {
  name: string;
  displayName: number;
  img: string;
  width: number;
  height: number;
  scale: number;
  mirrorX: boolean;
  mirrorY: boolean;
  tint?: string;
  alpha: number;
  disposition: number; // -1 = hostile, 0 = neutral, 1 = friendly
  displayBars: number;
  bar1: { attribute: string };
  bar2: { attribute: string };
  vision: boolean;
  dimSight: number;
  brightSight: number;
  dimLight: number;
  brightLight: number;
  sightAngle: number;
  lightAngle: number;
  lightColor?: string;
  lightAlpha: number;
  lightAnimation: {
    type?: string;
    speed?: number;
    intensity?: number;
  };
  actorLink: boolean;
  lockRotation: boolean;
  rotation: number;
  effects: string[];
}

export interface FoundryFlags {
  'dnd5e'?: {
    [key: string]: any;
  };
  [system: string]: any;
}

/**
 * Core mapper that orchestrates all specialized mappers
 */
export class FoundryVTTMapper {
  private abilityMapper = new FoundryAbilityMapper();
  private attributeMapper = new FoundryAttributeMapper();
  private skillMapper = new FoundrySkillMapper();
  private spellMapper = new FoundrySpellMapper();
  private traitMapper = new FoundryTraitMapper();
  private detailMapper = new FoundryDetailMapper();
  private itemMapper = new FoundryItemMapper();
  private effectMapper = new FoundryEffectMapper();
  private tokenMapper = new FoundryTokenMapper();
  private featureMapper = new FoundryVTTFeatureMapper();

  /**
   * Convert processed character data to complete Foundry VTT Actor
   */
  mapToFoundryActor(processedData: OrchProcessedData, originalData: CharacterData): FoundryActor {
    if (featureFlags.isEnabled('foundry_mapper_debug')) {
      console.log('🗺️ FoundryVTTMapper: Starting character mapping', {
        characterName: processedData.name,
        characterLevel: processedData.level
      });
    }

    const foundryActor: FoundryActor = {
      _id: this.generateFoundryId(),
      name: StringSanitizer.sanitizeText(processedData.name || 'Unknown Character'),
      type: 'character',
      img: this.getCharacterImage(originalData),
      system: {
        abilities: this.abilityMapper.mapAbilities(processedData.abilities, originalData),
        attributes: this.attributeMapper.mapAttributes(processedData, originalData),
        skills: this.skillMapper.mapSkills(processedData.abilities, originalData),
        traits: this.traitMapper.mapTraits(originalData),
        currency: this.mapCurrency(originalData),
        details: this.detailMapper.mapDetails(processedData, originalData),
        spells: this.spellMapper.mapSpells(processedData.spellSlots),
        bonuses: this.mapBonuses(originalData),
        resources: this.mapResources(processedData.features, originalData)
      },
      items: [
        ...this.itemMapper.mapItems(processedData.inventory, originalData),
        ...this.featureMapper.mapFeaturesToFoundryItems(processedData.features)
      ],
      effects: this.effectMapper.mapEffects(processedData, originalData),
      prototypeToken: this.tokenMapper.mapToken(processedData, originalData),
      ownership: { default: 0 },
      flags: this.mapFlags(originalData),
      sort: 0
    };

    if (featureFlags.isEnabled('foundry_mapper_debug')) {
      console.log('🗺️ FoundryVTTMapper: Character mapping complete', {
        systemDataKeys: Object.keys(foundryActor.system),
        itemCount: foundryActor.items.length,
        effectCount: foundryActor.effects.length
      });
    }

    return foundryActor;
  }

  private generateFoundryId(): string {
    // Generate a valid Foundry ID (16 character alphanumeric)
    return Array.from({ length: 16 }, () => 
      Math.random().toString(36)[Math.floor(Math.random() * 36)]
    ).join('');
  }

  private getCharacterImage(character: CharacterData): string {
    // Use D&D Beyond avatar if available, otherwise default
    if (character.decorations?.avatarUrl) {
      return character.decorations.avatarUrl;
    }
    if (character.decorations?.defaultBackdrop?.backdropAvatarUrl) {
      return character.decorations.defaultBackdrop.backdropAvatarUrl;
    }
    return 'icons/svg/mystery-man.svg';
  }

  private mapCurrency(character: CharacterData): FoundryCurrency {
    const currencies = character.currencies || [];
    return {
      pp: currencies.find(c => c.entityTypeId === 2) ? currencies.find(c => c.entityTypeId === 2)!.quantity : 0,
      gp: currencies.find(c => c.entityTypeId === 1) ? currencies.find(c => c.entityTypeId === 1)!.quantity : 0,
      ep: currencies.find(c => c.entityTypeId === 3) ? currencies.find(c => c.entityTypeId === 3)!.quantity : 0,
      sp: currencies.find(c => c.entityTypeId === 4) ? currencies.find(c => c.entityTypeId === 4)!.quantity : 0,
      cp: currencies.find(c => c.entityTypeId === 5) ? currencies.find(c => c.entityTypeId === 5)!.quantity : 0
    };
  }

  private mapBonuses(character: CharacterData): FoundryBonuses {
    // TODO: Extract bonuses from character modifiers
    return {
      mwak: { attack: '', damage: '' },
      rwak: { attack: '', damage: '' },
      msak: { attack: '', damage: '' },
      rsak: { attack: '', damage: '' },
      abilities: { check: '', save: '', skill: '' },
      spell: { dc: '' }
    };
  }

  private mapResources(features: ProcessedFeatures, character: CharacterData): FoundryResources {
    // TODO: Extract class resources from processed features
    return {
      primary: { value: 0, max: 0, sr: false, lr: true, label: '' },
      secondary: { value: 0, max: 0, sr: false, lr: true, label: '' },
      tertiary: { value: 0, max: 0, sr: false, lr: true, label: '' }
    };
  }

  private mapFlags(character: CharacterData): FoundryFlags {
    return {
      'dnd5e': {
        sourceId: `dndbeyond.character.${character.id}`,
        importVersion: '1.0.0',
        originalId: character.id
      }
    };
  }
}

/**
 * Specialized mapper for abilities
 */
export class FoundryAbilityMapper {
  mapAbilities(abilities: ProcessedAbilityScores, character: CharacterData): FoundryAbilities {
    const abilityMap: { [key: string]: string } = {
      'strength': 'str',
      'dexterity': 'dex', 
      'constitution': 'con',
      'intelligence': 'int',
      'wisdom': 'wis',
      'charisma': 'cha'
    };

    const foundryAbilities: any = {};

    ABILITY_NAMES.forEach((abilityName, index) => {
      const foundryKey = abilityMap[abilityName];
      const abilityData = abilities[abilityName];
      const isProficient = this.hasSavingThrowProficiency(character, abilityName);

      foundryAbilities[foundryKey] = {
        value: abilityData?.total || 10,
        proficient: isProficient ? 1 : 0,
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
    });

    return foundryAbilities as FoundryAbilities;
  }

  private hasSavingThrowProficiency(character: CharacterData, abilityName: string): boolean {
    // Check class-based saving throw proficiencies
    if (character.classes && Array.isArray(character.classes)) {
      for (const cls of character.classes) {
        const savingThrowProfs = cls.definition?.savingThrowProficiencies;
        if (savingThrowProfs && Array.isArray(savingThrowProfs)) {
          const hasProf = savingThrowProfs.some(prof => 
            prof.name?.toLowerCase().includes(abilityName.toLowerCase())
          );
          if (hasProf) return true;
        }
      }
    }

    // Check modifiers for saving throw proficiency bonuses
    if (character.modifiers) {
      const sources = ['class', 'race', 'background', 'feat', 'item'];
      for (const source of sources) {
        const modifiers = character.modifiers[source];
        if (modifiers && Array.isArray(modifiers)) {
          const hasProf = modifiers.some(mod => 
            mod.type === 'proficiency' && 
            mod.subType === 'saving-throws' &&
            mod.friendlySubtypeName?.toLowerCase().includes(abilityName.toLowerCase())
          );
          if (hasProf) return true;
        }
      }
    }

    return false;
  }
}

/**
 * Specialized mapper for attributes (HP, AC, movement, etc.)
 */
export class FoundryAttributeMapper {
  mapAttributes(processedData: OrchProcessedData, character: CharacterData): FoundryAttributes {
    const dexModifier = processedData.abilities?.dexterity?.modifier || 0;
    
    return {
      ac: {
        calc: 'default' // TODO: Detect armor calculations
      },
      init: {
        ability: 'dex',
        bonus: '',
        roll: { roll: { min: null, max: null, mode: 0 } }
      },
      movement: this.mapMovement(character),
      senses: this.mapSenses(character),
      hp: this.mapHitPoints(character),
      death: {
        success: 0,
        failure: 0
      },
      exhaustion: 0,
      inspiration: character.inspiration || false
    };
  }

  private mapMovement(character: CharacterData) {
    // Default movement is 30 feet for most races
    let baseSpeed = 30;
    
    // Check for race-specific movement speeds
    if (character.race?.weightSpeeds?.normal?.walk) {
      baseSpeed = character.race.weightSpeeds.normal.walk;
    }

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

  private mapSenses(character: CharacterData) {
    let darkvision = 0;
    let blindsight = 0;
    let tremorsense = 0;
    let truesight = 0;
    let special = '';

    // Check racial traits for senses
    if (character.race?.racialTraits) {
      character.race.racialTraits.forEach(trait => {
        const description = trait.definition?.description?.toLowerCase() || '';
        if (description.includes('darkvision')) {
          const match = description.match(/(\d+)\s*feet?/);
          if (match) darkvision = parseInt(match[1]);
        }
        if (description.includes('blindsight')) {
          const match = description.match(/(\d+)\s*feet?/);
          if (match) blindsight = parseInt(match[1]);
        }
      });
    }

    return {
      darkvision,
      blindsight,
      tremorsense,
      truesight,
      units: 'ft',
      special
    };
  }

  private mapHitPoints(character: CharacterData) {
    const baseHp = character.baseHitPoints || 0;
    const bonusHp = character.bonusHitPoints || 0;
    const overrideHp = character.overrideHitPoints;
    const removedHp = character.removedHitPoints || 0;
    const tempHp = character.temporaryHitPoints || 0;

    const maxHp = overrideHp !== null ? overrideHp : baseHp + bonusHp;
    const currentHp = maxHp - removedHp;

    return {
      value: Math.max(0, currentHp),
      min: 0,
      max: maxHp,
      temp: tempHp,
      tempmax: 0
    };
  }
}

/**
 * Specialized mapper for skills
 */
export class FoundrySkillMapper {
  private readonly skillMap = {
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
    'performance': 'prf',
    'persuasion': 'per',
    'religion': 'rel',
    'sleight-of-hand': 'slt',
    'stealth': 'ste',
    'survival': 'sur'
  };

  private readonly skillAbilities = {
    'acr': 'dex',
    'ani': 'wis',
    'arc': 'int',
    'ath': 'str',
    'dec': 'cha',
    'his': 'int',
    'ins': 'wis',
    'inti': 'cha',
    'inv': 'int',
    'med': 'wis',
    'nat': 'int',
    'prc': 'wis',
    'prf': 'cha',
    'per': 'cha',
    'rel': 'int',
    'slt': 'dex',
    'ste': 'dex',
    'sur': 'wis'
  };

  mapSkills(abilities: ProcessedAbilityScores, character: CharacterData): FoundrySkills {
    const skills: FoundrySkills = {};

    Object.entries(this.skillMap).forEach(([skillName, foundryKey]) => {
      const proficiencyLevel = this.getSkillProficiency(character, skillName);
      
      skills[foundryKey] = {
        ability: this.skillAbilities[foundryKey],
        value: proficiencyLevel,
        bonuses: {
          check: '',
          passive: ''
        },
        roll: { roll: { min: null, max: null, mode: 0 } }
      };
    });

    return skills;
  }

  private getSkillProficiency(character: CharacterData, skillName: string): number {
    // Check for skill proficiencies in modifiers
    if (character.modifiers) {
      const sources = ['class', 'race', 'background', 'feat', 'item'];
      
      for (const source of sources) {
        const modifiers = character.modifiers[source];
        if (modifiers && Array.isArray(modifiers)) {
          for (const mod of modifiers) {
            if (mod.type === 'proficiency' && mod.subType === skillName) {
              return 1; // Proficient
            }
            if (mod.type === 'expertise' && mod.subType === skillName) {
              return 2; // Expertise
            }
          }
        }
      }
    }

    return 0; // Not proficient
  }
}

/**
 * Specialized mapper for spells
 */
export class FoundrySpellMapper {
  mapSpells(spellSlots: SpellSlotCalculationResult): FoundrySpells {
    const foundrySpells: FoundrySpells = {
      spell1: { value: spellSlots.spellSlots[1] || 0, max: spellSlots.spellSlots[1] || 0 },
      spell2: { value: spellSlots.spellSlots[2] || 0, max: spellSlots.spellSlots[2] || 0 },
      spell3: { value: spellSlots.spellSlots[3] || 0, max: spellSlots.spellSlots[3] || 0 },
      spell4: { value: spellSlots.spellSlots[4] || 0, max: spellSlots.spellSlots[4] || 0 },
      spell5: { value: spellSlots.spellSlots[5] || 0, max: spellSlots.spellSlots[5] || 0 },
      spell6: { value: spellSlots.spellSlots[6] || 0, max: spellSlots.spellSlots[6] || 0 },
      spell7: { value: spellSlots.spellSlots[7] || 0, max: spellSlots.spellSlots[7] || 0 },
      spell8: { value: spellSlots.spellSlots[8] || 0, max: spellSlots.spellSlots[8] || 0 },
      spell9: { value: spellSlots.spellSlots[9] || 0, max: spellSlots.spellSlots[9] || 0 }
    };

    // Add pact magic if present
    if (this.hasPactMagic(spellSlots)) {
      const pactLevel = this.getPactMagicLevel(spellSlots);
      const pactSlots = this.getPactMagicSlots(spellSlots);
      
      foundrySpells.pact = {
        value: pactSlots,
        max: pactSlots,
        level: pactLevel
      };
    }

    return foundrySpells;
  }

  private hasPactMagic(spellSlots: SpellSlotCalculationResult): boolean {
    return Object.values(spellSlots.pactMagicSlots).some(count => count > 0);
  }

  private getPactMagicLevel(spellSlots: SpellSlotCalculationResult): number {
    // Find the highest level with pact magic slots
    for (let level = 9; level >= 1; level--) {
      if (spellSlots.pactMagicSlots[level as keyof typeof spellSlots.pactMagicSlots] > 0) {
        return level;
      }
    }
    return 1;
  }

  private getPactMagicSlots(spellSlots: SpellSlotCalculationResult): number {
    // Get the number of pact magic slots at the highest level
    const level = this.getPactMagicLevel(spellSlots);
    return spellSlots.pactMagicSlots[level as keyof typeof spellSlots.pactMagicSlots] || 0;
  }
}

/**
 * Specialized mapper for traits (proficiencies, resistances, etc.)
 */
export class FoundryTraitMapper {
  mapTraits(character: CharacterData): FoundryTraits {
    return {
      size: this.getSize(character),
      di: this.getDamageImmunities(character),
      dr: this.getDamageResistances(character),
      dv: this.getDamageVulnerabilities(character),
      ci: this.getConditionImmunities(character),
      languages: this.getLanguages(character),
      weaponProf: this.getWeaponProficiencies(character),
      armorProf: this.getArmorProficiencies(character),
      toolProf: this.getToolProficiencies(character)
    };
  }

  private getSize(character: CharacterData): string {
    const raceSize = character.race?.size;
    if (raceSize) {
      switch(raceSize.toLowerCase()) {
        case 'tiny': return 'tiny';
        case 'small': return 'sm';
        case 'medium': return 'med';
        case 'large': return 'lg';
        case 'huge': return 'huge';
        case 'gargantuan': return 'grg';
        default: return 'med';
      }
    }
    return 'med';
  }

  private getDamageImmunities(character: CharacterData) {
    // TODO: Extract from racial traits and features
    return { value: [], custom: '' };
  }

  private getDamageResistances(character: CharacterData) {
    // TODO: Extract from racial traits and features
    return { value: [], custom: '' };
  }

  private getDamageVulnerabilities(character: CharacterData) {
    // TODO: Extract from racial traits and features
    return { value: [], custom: '' };
  }

  private getConditionImmunities(character: CharacterData) {
    // TODO: Extract from racial traits and features
    return { value: [], custom: '' };
  }

  private getLanguages(character: CharacterData) {
    const languages: string[] = [];
    
    // Extract from modifiers
    if (character.modifiers) {
      const sources = ['race', 'class', 'background', 'feat'];
      sources.forEach(source => {
        const modifiers = character.modifiers[source];
        if (modifiers && Array.isArray(modifiers)) {
          modifiers.forEach(mod => {
            if (mod.type === 'language') {
              languages.push(mod.friendlySubtypeName || mod.subType || '');
            }
          });
        }
      });
    }

    return { value: languages.filter(Boolean), custom: '' };
  }

  private getWeaponProficiencies(character: CharacterData) {
    // TODO: Extract weapon proficiencies from modifiers
    return { value: [], custom: '' };
  }

  private getArmorProficiencies(character: CharacterData) {
    // TODO: Extract armor proficiencies from modifiers
    return { value: [], custom: '' };
  }

  private getToolProficiencies(character: CharacterData) {
    // TODO: Extract tool proficiencies from modifiers
    return { value: [], custom: '' };
  }
}

/**
 * Specialized mapper for character details
 */
export class FoundryDetailMapper {
  mapDetails(processedData: OrchProcessedData, character: CharacterData): FoundryDetails {
    return {
      biography: {
        value: this.getBiography(character),
        public: ''
      },
      alignment: this.getAlignment(character),
      race: character.race?.fullName || character.race?.baseRaceName || 'Unknown',
      background: character.background?.definition?.name || 'Unknown',
      originalClass: this.getOriginalClass(character),
      xp: {
        value: character.currentXp || 0,
        min: 0,
        max: this.getXpForNextLevel(processedData.level)
      },
      appearance: this.getAppearance(character),
      trait: character.traits?.personalityTraits || '',
      ideal: character.traits?.ideals || '',
      bond: character.traits?.bonds || '',
      flaw: character.traits?.flaws || '',
      level: processedData.level,
      age: character.age?.toString() || '',
      height: character.height || '',
      weight: character.weight?.toString() || '',
      eyes: character.eyes || '',
      skin: character.skin || '',
      hair: character.hair || '',
      gender: character.gender || ''
    };
  }

  private getBiography(character: CharacterData): string {
    // Combine various character details into biography
    const parts = [];
    
    if (character.backstory) {
      parts.push(character.backstory);
    }
    
    if (character.personalityTraits) {
      parts.push(`**Personality Traits:** ${character.personalityTraits}`);
    }
    
    return parts.join('\n\n');
  }

  private getAlignment(character: CharacterData): string {
    const alignmentMap: { [key: number]: string } = {
      1: 'lg', // Lawful Good
      2: 'ng', // Neutral Good
      3: 'cg', // Chaotic Good
      4: 'ln', // Lawful Neutral
      5: 'n',  // True Neutral
      6: 'cn', // Chaotic Neutral
      7: 'le', // Lawful Evil
      8: 'ne', // Neutral Evil
      9: 'ce'  // Chaotic Evil
    };
    
    return alignmentMap[character.alignmentId || 5] || 'n';
  }

  private getOriginalClass(character: CharacterData): string {
    if (character.classes && character.classes.length > 0) {
      return character.classes[0].definition?.name || 'Unknown';
    }
    return 'Unknown';
  }

  private getXpForNextLevel(level: number): number {
    const xpTable = [0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000, 85000, 100000, 120000, 140000, 165000, 195000, 225000, 265000, 305000, 355000];
    return xpTable[Math.min(level, 19)] || 355000;
  }

  private getAppearance(character: CharacterData): string {
    const appearance = [];
    if (character.age) appearance.push(`Age: ${character.age}`);
    if (character.height) appearance.push(`Height: ${character.height}`);
    if (character.weight) appearance.push(`Weight: ${character.weight}`);
    if (character.eyes) appearance.push(`Eyes: ${character.eyes}`);
    if (character.hair) appearance.push(`Hair: ${character.hair}`);
    if (character.skin) appearance.push(`Skin: ${character.skin}`);
    
    return appearance.join(', ');
  }
}

/**
 * Placeholder mappers - will be implemented in subsequent phases
 */
export class FoundryItemMapper {
  mapItems(inventory: ProcessedInventory, character: CharacterData): FoundryItem[] {
    // TODO: Full item mapping implementation
    return [];
  }
}

export class FoundryEffectMapper {
  mapEffects(processedData: OrchProcessedData, character: CharacterData): FoundryActiveEffect[] {
    // TODO: Active effects implementation
    return [];
  }
}

export class FoundryTokenMapper {
  mapToken(processedData: OrchProcessedData, character: CharacterData): FoundryTokenData {
    return {
      name: processedData.name,
      displayName: 40, // Always display name
      img: character.decorations?.avatarUrl || 'icons/svg/mystery-man.svg',
      width: 1,
      height: 1,
      scale: 1,
      mirrorX: false,
      mirrorY: false,
      alpha: 1,
      disposition: 1, // Friendly
      displayBars: 40, // Always display bars
      bar1: { attribute: 'attributes.hp' },
      bar2: { attribute: 'attributes.ac' },
      vision: true,
      dimSight: 0,
      brightSight: 0,
      dimLight: 0,
      brightLight: 0,
      sightAngle: 360,
      lightAngle: 360,
      lightAlpha: 0.25,
      lightAnimation: { type: '', speed: 5, intensity: 5 },
      actorLink: true,
      lockRotation: false,
      rotation: 0,
      effects: []
    };
  }
}