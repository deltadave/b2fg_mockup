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
import { FoundryVTTInventoryMapper } from './FoundryVTTInventoryMapper';
import { LanguageProcessor } from '@/domain/character/services/LanguageProcessor';
import { SpellDataExtractor } from '@/domain/character/services/SpellDataExtractor';
import { SpellDeduplicator } from '@/domain/character/services/SpellDeduplicator';
import type { NormalizedSpell } from '@/domain/character/models/Spells';
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
 * Specialized mapper for spells with enhanced pact magic support and individual spell conversion
 */
export class FoundrySpellMapper {
  private spellExtractor = new SpellDataExtractor();
  private spellDeduplicator = new SpellDeduplicator();
  /**
   * Map spell slot calculation results to Foundry VTT spell format
   * 
   * @param spellSlots - Calculated spell slots from SpellSlotCalculator
   * @returns Foundry VTT spell slot structure
   */
  mapSpells(spellSlots: SpellSlotCalculationResult): FoundrySpells {
    if (featureFlags.isEnabled('foundry_mapper_debug')) {
      console.log('🔮 FoundrySpellMapper: Mapping spell slots', {
        regularSlots: this.summarizeSpellSlots(spellSlots.spellSlots),
        pactSlots: this.summarizeSpellSlots(spellSlots.pactMagicSlots),
        multiclassCasterLevel: spellSlots.multiclassCasterLevel,
        calculationMethod: spellSlots.debugInfo.calculationMethod
      });
    }

    // Map regular spell slots
    const foundrySpells: FoundrySpells = {
      spell1: this.createSpellSlot(spellSlots.spellSlots[1]),
      spell2: this.createSpellSlot(spellSlots.spellSlots[2]),
      spell3: this.createSpellSlot(spellSlots.spellSlots[3]),
      spell4: this.createSpellSlot(spellSlots.spellSlots[4]),
      spell5: this.createSpellSlot(spellSlots.spellSlots[5]),
      spell6: this.createSpellSlot(spellSlots.spellSlots[6]),
      spell7: this.createSpellSlot(spellSlots.spellSlots[7]),
      spell8: this.createSpellSlot(spellSlots.spellSlots[8]),
      spell9: this.createSpellSlot(spellSlots.spellSlots[9])
    };

    // Add pact magic if present with enhanced validation
    const pactMagicData = this.processPactMagic(spellSlots);
    if (pactMagicData) {
      foundrySpells.pact = pactMagicData;
      
      if (featureFlags.isEnabled('foundry_mapper_debug')) {
        console.log('🔮 FoundrySpellMapper: Added pact magic', {
          level: pactMagicData.level,
          slots: pactMagicData.max,
          calculationMethod: spellSlots.debugInfo.calculationMethod
        });
      }
    }

    return foundrySpells;
  }

  /**
   * Create a standardized spell slot object
   */
  private createSpellSlot(slotCount: number): { value: number; max: number } {
    const count = Math.max(0, slotCount || 0); // Ensure non-negative
    return {
      value: count,
      max: count
    };
  }

  /**
   * Process pact magic slots with enhanced logic and validation
   */
  private processPactMagic(spellSlots: SpellSlotCalculationResult): FoundrySpells['pact'] | undefined {
    if (!this.hasPactMagic(spellSlots)) {
      return undefined;
    }

    const pactLevel = this.getPactMagicLevel(spellSlots);
    const pactSlots = this.getPactMagicSlots(spellSlots);

    // Validate pact magic data
    if (pactLevel < 1 || pactLevel > 5) {
      console.warn('⚠️ FoundrySpellMapper: Invalid pact magic level:', pactLevel);
      return undefined;
    }

    if (pactSlots <= 0) {
      console.warn('⚠️ FoundrySpellMapper: Invalid pact magic slot count:', pactSlots);
      return undefined;
    }

    // Ensure pact magic follows D&D 5e rules
    const maxPactSlots = this.getMaxPactSlotsForLevel(pactLevel);
    const validatedSlots = Math.min(pactSlots, maxPactSlots);

    if (validatedSlots !== pactSlots) {
      console.warn('⚠️ FoundrySpellMapper: Capped pact magic slots', {
        calculated: pactSlots,
        capped: validatedSlots,
        level: pactLevel
      });
    }

    return {
      value: validatedSlots,
      max: validatedSlots,
      level: pactLevel
    };
  }

  /**
   * Check if character has any pact magic slots
   */
  private hasPactMagic(spellSlots: SpellSlotCalculationResult): boolean {
    return Object.values(spellSlots.pactMagicSlots).some(count => count > 0);
  }

  /**
   * Get the level of pact magic slots (1-5 for warlocks)
   */
  private getPactMagicLevel(spellSlots: SpellSlotCalculationResult): number {
    // Find the highest level with pact magic slots
    for (let level = 5; level >= 1; level--) {
      const slotCount = spellSlots.pactMagicSlots[level as keyof typeof spellSlots.pactMagicSlots];
      if (slotCount > 0) {
        return level;
      }
    }
    return 1; // Default fallback
  }

  /**
   * Get the number of pact magic slots at the appropriate level
   */
  private getPactMagicSlots(spellSlots: SpellSlotCalculationResult): number {
    const level = this.getPactMagicLevel(spellSlots);
    return spellSlots.pactMagicSlots[level as keyof typeof spellSlots.pactMagicSlots] || 0;
  }

  /**
   * Get maximum allowed pact magic slots for a given spell level
   * Based on D&D 5e Warlock progression
   */
  private getMaxPactSlotsForLevel(spellLevel: number): number {
    // Warlock pact magic progression:
    // - Levels 1-2: 1 slot
    // - Levels 3-10: 2 slots  
    // - Levels 11-16: 3 slots
    // - Levels 17-20: 4 slots
    // But spell slot level caps at 5th level
    
    switch (spellLevel) {
      case 1:
      case 2:
      case 3:
      case 4:
      case 5:
        return 4; // Maximum at warlock level 17+
      default:
        return 0; // Warlocks don't get 6th+ level slots
    }
  }

  /**
   * Create a summary string of non-zero spell slots for logging
   */
  private summarizeSpellSlots(slots: { [level: number]: number }): string {
    const nonZeroSlots = Object.entries(slots)
      .filter(([_, count]) => count > 0)
      .map(([level, count]) => `${level}:${count}`)
      .join(', ');
    return nonZeroSlots || 'none';
  }

  /**
   * Convert character spells to Foundry VTT spell items
   * 
   * @param character - Character data with spells
   * @returns Array of Foundry VTT spell items
   */
  async mapSpellsToItems(character: CharacterData): Promise<FoundryItem[]> {
    try {
      if (!featureFlags.isEnabled('spell_processing')) {
        return [];
      }

      // Extract spells from character data
      const extractionResult = await this.spellExtractor.extractSpells(character, {
        sanitizeContent: true,
        validateSpells: true,
        includeDuplicates: false,
        includeHomebrew: true
      });

      if (!extractionResult.success || extractionResult.spells.length === 0) {
        if (featureFlags.isEnabled('foundry_mapper_debug')) {
          console.log('🔮 FoundrySpellMapper: No spells found for character', {
            characterId: character.id,
            errors: extractionResult.errors.length
          });
        }
        return [];
      }

      // Deduplicate spells
      const deduplicationResult = this.spellDeduplicator.deduplicateSpells(
        extractionResult.spells,
        {
          strategy: 'merge',
          preserveMulticlassSpells: true,
          mergePreparedStatus: true,
          preferOfficialSources: true,
          priorityOrder: ['class', 'race', 'feat', 'item', 'background', 'multiclass', 'other']
        }
      );

      if (deduplicationResult.uniqueSpells.length === 0) {
        return [];
      }

      // Convert each spell to a Foundry VTT item
      const foundrySpellItems: FoundryItem[] = [];

      for (const spell of deduplicationResult.uniqueSpells) {
        const foundrySpell = this.convertSpellToFoundryItem(spell);
        if (foundrySpell) {
          foundrySpellItems.push(foundrySpell);
        }
      }

      if (featureFlags.isEnabled('foundry_mapper_debug')) {
        console.log('🔮 FoundrySpellMapper: Converted spells to items', {
          characterId: character.id,
          totalSpells: deduplicationResult.uniqueSpells.length,
          convertedItems: foundrySpellItems.length,
          duplicatesRemoved: deduplicationResult.duplicatesRemoved.length
        });
      }

      return foundrySpellItems;

    } catch (error) {
      console.error('❌ FoundrySpellMapper: Failed to map spells to items:', error);
      return [];
    }
  }

  /**
   * Convert a normalized spell to a Foundry VTT spell item
   */
  private convertSpellToFoundryItem(spell: NormalizedSpell): FoundryItem | null {
    try {
      const foundrySpell: FoundryItem = {
        _id: this.generateFoundryId(),
        name: StringSanitizer.sanitizeText(spell.name),
        type: 'spell',
        img: this.getSpellIcon(spell),
        system: {
          description: {
            value: StringSanitizer.sanitizeHTML(spell.description),
            chat: StringSanitizer.sanitizeHTML(spell.description.substring(0, 200) + '...'),
            unidentified: ''
          },
          source: spell.sourceReference?.book || 'D&D Beyond',
          activation: this.mapActivation(spell),
          duration: this.mapDuration(spell),
          target: this.mapTarget(spell),
          range: this.mapRange(spell),
          uses: this.mapUses(spell),
          consume: this.mapConsume(spell),
          ability: this.getSpellcastingAbility(spell),
          actionType: this.getActionType(spell),
          attackBonus: '',
          chatFlavor: '',
          critical: { threshold: null, damage: '' },
          damage: this.mapDamage(spell),
          formula: '',
          save: this.mapSave(spell),
          level: spell.level,
          school: this.mapSchool(spell.school),
          components: this.mapComponents(spell),
          materials: this.mapMaterials(spell),
          preparation: this.mapPreparation(spell),
          scaling: this.mapScaling(spell)
        },
        effects: [],
        ownership: { default: 0 },
        flags: {
          'dnd5e': {
            originalSpellId: spell.id,
            spellSource: spell.source
          }
        },
        sort: 0
      };

      return foundrySpell;

    } catch (error) {
      console.warn(`Failed to convert spell ${spell.name} to Foundry item:`, error);
      return null;
    }
  }

  /**
   * Map spell activation to Foundry format
   */
  private mapActivation(spell: NormalizedSpell): any {
    const activationTypeMap: Record<string, string> = {
      'action': 'action',
      'bonus_action': 'bonus',
      'reaction': 'reaction',
      'minute': 'minute',
      'hour': 'hour',
      'special': 'special'
    };

    return {
      type: activationTypeMap[spell.castingTime.type] || 'action',
      cost: spell.castingTime.value || 1,
      condition: spell.castingTime.condition || ''
    };
  }

  /**
   * Map spell duration to Foundry format
   */
  private mapDuration(spell: NormalizedSpell): any {
    const durationUnitMap: Record<string, string> = {
      'minute': 'minute',
      'hour': 'hour',
      'day': 'day'
    };

    let units = 'inst'; // instantaneous
    let value = null;

    if (spell.duration.type === 'timed') {
      value = spell.duration.value || 1;
      units = durationUnitMap[spell.duration.unit || 'minute'] || 'minute';
    } else if (spell.duration.type === 'until_dispelled') {
      units = 'perm';
    }

    return {
      value,
      units
    };
  }

  /**
   * Map spell target to Foundry format
   */
  private mapTarget(spell: NormalizedSpell): any {
    if (spell.range.areaOfEffect) {
      const aoe = spell.range.areaOfEffect;
      return {
        value: aoe.size,
        width: aoe.type === 'line' ? aoe.size : null,
        units: 'ft',
        type: aoe.type
      };
    }

    // Default to single creature
    return {
      value: 1,
      width: null,
      units: '',
      type: 'creature'
    };
  }

  /**
   * Map spell range to Foundry format
   */
  private mapRange(spell: NormalizedSpell): any {
    if (spell.range.type === 'self') {
      return { value: null, long: null, units: 'self' };
    } else if (spell.range.type === 'touch') {
      return { value: null, long: null, units: 'touch' };
    } else if (spell.range.type === 'ranged' && spell.range.value) {
      return { value: spell.range.value, long: null, units: 'ft' };
    } else if (spell.range.type === 'sight') {
      return { value: null, long: null, units: 'spec' };
    }

    return { value: 30, long: null, units: 'ft' };
  }

  /**
   * Map spell limited uses to Foundry format
   */
  private mapUses(spell: NormalizedSpell): any {
    if (spell.limitedUse) {
      const resetMap: Record<string, string> = {
        'short_rest': 'sr',
        'long_rest': 'lr',
        'daily': 'day',
        'weekly': 'week'
      };

      return {
        value: spell.limitedUse.maxUses - spell.limitedUse.usedUses,
        max: spell.limitedUse.maxUses.toString(),
        per: resetMap[spell.limitedUse.resetType] || 'lr',
        recovery: ''
      };
    }

    return {
      value: null,
      max: '',
      per: null,
      recovery: ''
    };
  }

  /**
   * Map spell consume requirements to Foundry format
   */
  private mapConsume(spell: NormalizedSpell): any {
    if (spell.usesSpellSlot) {
      return {
        type: 'spell',
        target: '',
        amount: 1
      };
    }

    return {
      type: '',
      target: '',
      amount: null
    };
  }

  /**
   * Get spellcasting ability from spell overrides or default
   */
  private getSpellcastingAbility(spell: NormalizedSpell): string {
    const abilityMap: Record<string, string> = {
      'intelligence': 'int',
      'wisdom': 'wis',
      'charisma': 'cha'
    };

    if (spell.overrides?.spellcastingAbility) {
      return abilityMap[spell.overrides.spellcastingAbility] || 'int';
    }

    // Default based on spell source
    switch (spell.source) {
      case 'class':
        return 'int'; // Default, should be determined by class
      default:
        return 'int';
    }
  }

  /**
   * Get action type for spell
   */
  private getActionType(spell: NormalizedSpell): string {
    if (spell.attackRoll) {
      return spell.attackRoll.type === 'ranged_spell' ? 'rsak' : 'msak';
    } else if (spell.savingThrow) {
      return 'save';
    } else if (spell.healing) {
      return 'heal';
    } else if (spell.damage) {
      return 'other';
    }
    return 'util';
  }

  /**
   * Map spell damage to Foundry format
   */
  private mapDamage(spell: NormalizedSpell): any {
    if (!spell.damage || spell.damage.rolls.length === 0) {
      return {
        parts: [],
        versatile: ''
      };
    }

    const parts: [string, string][] = [];

    for (const roll of spell.damage.rolls) {
      let formula = '';
      if (roll.diceCount > 0) {
        formula = `${roll.diceCount}d${roll.diceSize}`;
        if (roll.bonus !== 0) {
          formula += roll.bonus > 0 ? `+${roll.bonus}` : `${roll.bonus}`;
        }
      } else {
        formula = roll.bonus.toString();
      }
      
      parts.push([formula, roll.damageType]);
    }

    return {
      parts,
      versatile: ''
    };
  }

  /**
   * Map spell saving throw to Foundry format
   */
  private mapSave(spell: NormalizedSpell): any {
    if (!spell.savingThrow) {
      return {
        ability: '',
        dc: null,
        scaling: 'spell'
      };
    }

    const abilityMap: Record<string, string> = {
      'strength': 'str',
      'dexterity': 'dex',
      'constitution': 'con',
      'intelligence': 'int',
      'wisdom': 'wis',
      'charisma': 'cha'
    };

    return {
      ability: abilityMap[spell.savingThrow.ability] || 'wis',
      dc: spell.overrides?.saveDc || null,
      scaling: 'spell'
    };
  }

  /**
   * Map spell school to Foundry format
   */
  private mapSchool(school: string): string {
    return school.toLowerCase().substring(0, 3); // e.g., "Evocation" -> "evo"
  }

  /**
   * Map spell components to Foundry format
   */
  private mapComponents(spell: NormalizedSpell): any {
    return {
      vocal: spell.components.verbal,
      somatic: spell.components.somatic,
      material: spell.components.material,
      ritual: spell.ritual,
      concentration: spell.concentration
    };
  }

  /**
   * Map spell material components to Foundry format
   */
  private mapMaterials(spell: NormalizedSpell): any {
    if (!spell.components.material || !spell.components.materialDescription) {
      return {
        value: '',
        consumed: false,
        cost: 0,
        supply: 0
      };
    }

    return {
      value: spell.components.materialDescription,
      consumed: spell.components.materialConsumed,
      cost: spell.components.materialCost || 0,
      supply: 0
    };
  }

  /**
   * Map spell preparation to Foundry format
   */
  private mapPreparation(spell: NormalizedSpell): any {
    let mode = 'prepared';
    
    if (spell.alwaysPrepared) {
      mode = 'always';
    } else if (spell.source === 'class') {
      // Determine if it's a known spell or prepared spell based on class
      mode = 'prepared'; // Default assumption
    }

    return {
      mode,
      prepared: spell.prepared || spell.alwaysPrepared
    };
  }

  /**
   * Map spell scaling to Foundry format
   */
  private mapScaling(spell: NormalizedSpell): any {
    if (spell.damage?.scalingType) {
      return {
        mode: spell.damage.scalingType === 'spell_level' ? 'level' : 'none',
        formula: this.buildScalingFormula(spell)
      };
    }

    return {
      mode: 'none',
      formula: ''
    };
  }

  /**
   * Build scaling formula for damage
   */
  private buildScalingFormula(spell: NormalizedSpell): string {
    if (!spell.damage?.scalingDice || spell.damage.scalingDice.length === 0) {
      return '';
    }

    const scalingRoll = spell.damage.scalingDice[0];
    if (scalingRoll.diceCount > 0) {
      return `${scalingRoll.diceCount}d${scalingRoll.diceSize}`;
    }

    return scalingRoll.bonus?.toString() || '';
  }

  /**
   * Get appropriate icon for spell based on school and level
   */
  private getSpellIcon(spell: NormalizedSpell): string {
    const schoolIcons: Record<string, string> = {
      'abjuration': 'systems/dnd5e/icons/spells/protect-blue-1.jpg',
      'conjuration': 'systems/dnd5e/icons/spells/summon-air-1.jpg',
      'divination': 'systems/dnd5e/icons/spells/light-blue-1.jpg',
      'enchantment': 'systems/dnd5e/icons/spells/charm-person-purple-2.jpg',
      'evocation': 'systems/dnd5e/icons/spells/lightning-red-1.jpg',
      'illusion': 'systems/dnd5e/icons/spells/wind-wall-blue-1.jpg',
      'necromancy': 'systems/dnd5e/icons/spells/evil-eye-eerie-1.jpg',
      'transmutation': 'systems/dnd5e/icons/spells/shielding-eerie-1.jpg'
    };

    return schoolIcons[spell.school.toLowerCase()] || 'systems/dnd5e/icons/spells/magic-missile-2.jpg';
  }

  /**
   * Generate a random Foundry VTT compatible ID
   */
  private generateFoundryId(): string {
    return Array.from({ length: 16 }, () => 
      Math.random().toString(36)[Math.floor(Math.random() * 36)]
    ).join('');
  }

  /**
   * Validate that spell slots follow D&D 5e progression rules
   * Used for testing and debugging
   */
  validateSpellSlots(spellSlots: SpellSlotCalculationResult): { isValid: boolean; warnings: string[] } {
    const warnings: string[] = [];
    let isValid = true;

    // Check for impossible spell slot combinations
    const totalRegularSlots = Object.values(spellSlots.spellSlots).reduce((sum, count) => sum + count, 0);
    const totalPactSlots = Object.values(spellSlots.pactMagicSlots).reduce((sum, count) => sum + count, 0);

    // Characters with only pact magic should not have regular spell slots
    if (spellSlots.debugInfo.calculationMethod === 'pact_magic_only' && totalRegularSlots > 0) {
      warnings.push('Pure warlock should not have regular spell slots');
      isValid = false;
    }

    // Regular casters should not have pact magic
    if (spellSlots.debugInfo.calculationMethod === 'single_class' && totalPactSlots > 0) {
      const hasWarlock = spellSlots.debugInfo.classBreakdown.some(c => c.className === 'warlock');
      if (!hasWarlock) {
        warnings.push('Non-warlock should not have pact magic slots');
        isValid = false;
      }
    }

    // Check spell slot progression limits
    if (spellSlots.spellSlots[9] > 1) {
      warnings.push('Character has more than 1 ninth-level spell slot');
    }

    if (spellSlots.spellSlots[8] > 1) {
      warnings.push('Character has more than 1 eighth-level spell slot');
    }

    if (spellSlots.spellSlots[7] > 1) {
      warnings.push('Character has more than 1 seventh-level spell slot');
    }

    if (spellSlots.spellSlots[6] > 1) {
      warnings.push('Character has more than 1 sixth-level spell slot');
    }

    return { isValid, warnings };
  }
}

/**
 * Specialized mapper for traits (proficiencies, resistances, etc.)
 */
export class FoundryTraitMapper {
  private languageProcessor = new LanguageProcessor();
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
    try {
      // Use LanguageProcessor for proper language handling
      const result = this.languageProcessor.processCharacterLanguages(character, {
        includeChoicesInOutput: false,
        includeRacialOnly: false
      });

      // Generate FoundryVTT languages data
      const foundryLanguages = this.languageProcessor.generateFoundryVTTLanguages(result.languages);

      return {
        value: foundryLanguages.value,
        custom: foundryLanguages.custom
      };

    } catch (error) {
      console.warn('Failed to process languages for FoundryVTT:', error);
      return { value: [], custom: '' };
    }
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
  private inventoryMapper: FoundryVTTInventoryMapper;

  constructor() {
    this.inventoryMapper = new FoundryVTTInventoryMapper();
  }

  mapItems(inventory: ProcessedInventory, character: CharacterData): FoundryItem[] {
    if (featureFlags.isEnabled('foundry_mapper_debug')) {
      console.log('🎒 FoundryItemMapper: Mapping inventory to Foundry items', {
        itemCount: inventory.items.length,
        containerCount: inventory.containers.length
      });
    }

    try {
      // Use our comprehensive inventory mapper
      const foundryItems = this.inventoryMapper.mapInventoryToFoundryItems(inventory);

      if (featureFlags.isEnabled('foundry_mapper_debug')) {
        console.log('🎒 FoundryItemMapper: Successfully mapped items', {
          foundryItemCount: foundryItems.length,
          itemsProcessed: inventory.statistics.totalItems,
          warnings: inventory.processing.warnings.length,
          errors: inventory.processing.errors.length
        });

        // Log any processing issues from the inventory
        if (inventory.processing.warnings.length > 0) {
          console.warn('⚠️  Inventory processing warnings:', inventory.processing.warnings);
        }
        if (inventory.processing.errors.length > 0) {
          console.error('❌ Inventory processing errors:', inventory.processing.errors);
        }
      }

      return foundryItems;

    } catch (error) {
      console.error('❌ FoundryItemMapper: Failed to map inventory items:', error);
      
      // Return empty array on error - don't break the entire conversion
      return [];
    }
  }

  /**
   * Reset the internal ID counter for testing purposes
   */
  resetForTesting(): void {
    this.inventoryMapper.resetIdCounter();
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