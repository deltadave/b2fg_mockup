/**
 * Spell Domain Models
 * 
 * Defines the comprehensive spell data structures for D&D 5e spells,
 * covering D&D Beyond JSON input, Fantasy Grounds XML output, and 
 * Foundry VTT JSON output formats.
 */

// ==================== D&D Beyond Input Models ====================

export interface DnDBeyondSpellData {
  readonly spells: {
    readonly race: ReadonlyArray<DnDBeyondSpellEntry>;
    readonly class: ReadonlyArray<DnDBeyondSpellEntry>;
    readonly feat: ReadonlyArray<DnDBeyondSpellEntry>;
    readonly item: ReadonlyArray<DnDBeyondSpellEntry>;
  };
}

export interface DnDBeyondSpellEntry {
  readonly id: number;
  readonly entityTypeId: number;
  readonly overrideSaveDc?: number | null;
  readonly limitedUse?: DnDBeyondLimitedUse | null;
  readonly definition: DnDBeyondSpellDefinition;
  readonly prepared?: boolean;
  readonly countsAsKnownSpell?: boolean;
  readonly alwaysPrepared?: boolean;
  readonly castAtLevel?: number;
  readonly usesSpellSlot?: boolean;
  readonly castOnlyAsRitual?: boolean;
  readonly ritualCastingType?: number;
  readonly range?: DnDBeyondSpellRange | null;
  readonly activation?: DnDBeyondActivation | null;
  readonly baseLevelAtWill?: boolean;
  readonly atwillLimitedUseLevel?: number | null;
  readonly displayAsAttack?: boolean | null;
  readonly additionalDescription?: string | null;
  readonly castingTimeDescription?: string | null;
  readonly spellCastingAbilityId?: number | null;
  readonly overrideSaveDcAbilityId?: number | null;
  readonly saveFailDescription?: string | null;
  readonly saveSuccessDescription?: string | null;
}

export interface DnDBeyondSpellDefinition {
  readonly id: number;
  readonly definitionKey: string;
  readonly name: string;
  readonly level: number;
  readonly school: string;
  readonly duration: DnDBeyondDuration;
  readonly activation: DnDBeyondActivation;
  readonly range: DnDBeyondSpellRange;
  readonly asPartOfWeaponAttack: boolean;
  readonly description: string;
  readonly snippet: string;
  readonly concentration: boolean;
  readonly ritual: boolean;
  readonly rangeArea?: string | null;
  readonly damageEffect?: DnDBeyondDamageEffect | null;
  readonly components: ReadonlyArray<number>; // 1=V, 2=S, 4=M
  readonly componentsDescription: string;
  readonly saveDcAbilityId?: number | null;
  readonly healing?: DnDBeyondHealing | null;
  readonly healingDice: ReadonlyArray<DnDBeyondDice>;
  readonly tempHpDice: ReadonlyArray<DnDBeyondDice>;
  readonly attackType?: number | null;
  readonly canCastAtHigherLevel?: boolean;
  readonly isHomebrew: boolean;
  readonly version?: string | null;
  readonly sourceId?: number | null;
  readonly sourcePageNumber?: number | null;
  readonly requiresAttackRoll?: boolean;
  readonly requiresSavingThrow?: boolean;
  readonly spellGroups?: ReadonlyArray<number>;
  readonly tags?: ReadonlyArray<string>;
  readonly castingTimeDescription?: string | null;
  readonly durationDescription?: string | null;
  readonly rangeDescription?: string | null;
  readonly scaleType?: string | null;
  readonly damageTypes?: ReadonlyArray<number>;
  readonly modifiers?: ReadonlyArray<DnDBeyondModifier>;
  readonly conditions?: ReadonlyArray<DnDBeyondCondition>;
  readonly spellListIds?: ReadonlyArray<number>;
}

export interface DnDBeyondDuration {
  readonly durationInterval: number;
  readonly durationUnit?: string | null;
  readonly durationType: string;
}

export interface DnDBeyondActivation {
  readonly activationTime: number;
  readonly activationType: number; // 1=Action, 2=Bonus Action, 3=Reaction, etc.
}

export interface DnDBeyondSpellRange {
  readonly origin: string;
  readonly rangeValue: number;
  readonly aoeType?: string | null;
  readonly aoeValue?: number | null;
}

export interface DnDBeyondDamageEffect {
  readonly damageRolls: ReadonlyArray<DnDBeyondDamageRoll>;
  readonly saveType?: string | null;
  readonly onSave?: string | null;
}

export interface DnDBeyondDamageRoll {
  readonly diceCount: number;
  readonly diceValue: number;
  readonly diceMultiplier: number;
  readonly fixedValue: number;
  readonly diceString: string;
  readonly damageTypeId: number;
}

export interface DnDBeyondHealing {
  readonly healingRolls: ReadonlyArray<DnDBeyondHealingRoll>;
}

export interface DnDBeyondHealingRoll {
  readonly diceCount: number;
  readonly diceValue: number;
  readonly diceMultiplier: number;
  readonly fixedValue: number;
  readonly diceString: string;
}

export interface DnDBeyondDice {
  readonly diceCount: number;
  readonly diceValue: number;
  readonly diceMultiplier: number;
  readonly fixedValue: number;
  readonly diceString: string;
}

export interface DnDBeyondLimitedUse {
  readonly maxUses: number;
  readonly numberUsed: number;
  readonly resetType: number;
  readonly resetTypeDescription: string;
}

export interface DnDBeyondModifier {
  readonly id: number;
  readonly entityId: number;
  readonly entityTypeId: number;
  readonly type: string;
  readonly subType: string;
  readonly dice?: DnDBeyondDice | null;
  readonly restriction?: string | null;
  readonly statId?: number | null;
  readonly requiresAttunement: boolean;
  readonly duration?: DnDBeyondDuration | null;
  readonly friendlyTypeName: string;
  readonly friendlySubtypeName: string;
  readonly isGranted: boolean;
  readonly bonusTypes?: ReadonlyArray<number>;
  readonly value?: number | null;
  readonly availableToMulticlass: boolean;
  readonly modifierTypeId: number;
  readonly modifierSubTypeId: number;
  readonly componentId: number;
  readonly componentTypeId: number;
}

export interface DnDBeyondCondition {
  readonly id: number;
  readonly name: string;
  readonly description: string;
  readonly slug: string;
}

// ==================== Normalized Domain Models ====================

export interface NormalizedSpell {
  readonly id: string;
  readonly name: string;
  readonly level: SpellLevel;
  readonly school: MagicSchool;
  readonly source: SpellSource;
  readonly castingTime: CastingTime;
  readonly range: SpellRange;
  readonly duration: SpellDuration;
  readonly components: SpellComponents;
  readonly description: string;
  readonly higherLevelDescription?: string;
  readonly concentration: boolean;
  readonly ritual: boolean;
  readonly damage?: SpellDamage;
  readonly healing?: SpellHealing;
  readonly savingThrow?: SavingThrow;
  readonly attackRoll?: AttackRoll;
  readonly prepared: boolean;
  readonly alwaysPrepared: boolean;
  readonly usesSpellSlot: boolean;
  readonly canCastAsRitual: boolean;
  readonly limitedUse?: LimitedUse;
  readonly overrides?: SpellOverrides;
  readonly tags: ReadonlyArray<string>;
  readonly isHomebrew: boolean;
  readonly sourceReference?: SourceReference;
}

export type SpellLevel = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export type MagicSchool = 
  | 'Abjuration'
  | 'Conjuration' 
  | 'Divination'
  | 'Enchantment'
  | 'Evocation'
  | 'Illusion'
  | 'Necromancy'
  | 'Transmutation';

export type SpellSource = 
  | 'race'
  | 'class'
  | 'feat'
  | 'item'
  | 'background'
  | 'multiclass'
  | 'other';

export interface CastingTime {
  readonly type: CastingTimeType;
  readonly value: number;
  readonly unit?: TimeUnit;
  readonly condition?: string;
  readonly description: string;
}

export type CastingTimeType = 
  | 'action'
  | 'bonus_action'
  | 'reaction'
  | 'minute'
  | 'hour'
  | 'special';

export type TimeUnit =
  | 'action'
  | 'bonus_action'
  | 'reaction'
  | 'minute'
  | 'hour'
  | 'day';

export interface SpellRange {
  readonly type: RangeType;
  readonly value?: number;
  readonly unit?: DistanceUnit;
  readonly areaOfEffect?: AreaOfEffect;
  readonly description: string;
}

export type RangeType = 
  | 'self'
  | 'touch'
  | 'ranged'
  | 'sight'
  | 'unlimited'
  | 'special';

export type DistanceUnit = 
  | 'feet'
  | 'miles'
  | 'any'
  | 'special';

export interface AreaOfEffect {
  readonly type: AoeType;
  readonly size: number;
  readonly unit: DistanceUnit;
}

export type AoeType = 
  | 'sphere'
  | 'cube'
  | 'cylinder'
  | 'cone'
  | 'line'
  | 'hemisphere'
  | 'square'
  | 'special';

export interface SpellDuration {
  readonly type: DurationType;
  readonly value?: number;
  readonly unit?: TimeUnit;
  readonly concentration: boolean;
  readonly description: string;
}

export type DurationType = 
  | 'instantaneous'
  | 'timed'
  | 'until_dispelled'
  | 'special'
  | 'permanent';

export interface SpellComponents {
  readonly verbal: boolean;
  readonly somatic: boolean;
  readonly material: boolean;
  readonly materialDescription?: string;
  readonly materialCost?: number;
  readonly materialConsumed: boolean;
  readonly description: string;
}

export interface SpellDamage {
  readonly rolls: ReadonlyArray<DamageRoll>;
  readonly scalingType?: ScalingType;
  readonly scalingDice?: ReadonlyArray<DamageRoll>;
}

export interface DamageRoll {
  readonly diceCount: number;
  readonly diceSize: number;
  readonly bonus: number;
  readonly damageType: DamageType;
  readonly diceExpression: string;
}

export type DamageType =
  | 'acid'
  | 'bludgeoning'
  | 'cold'
  | 'fire'
  | 'force'
  | 'lightning'
  | 'necrotic'
  | 'piercing'
  | 'poison'
  | 'psychic'
  | 'radiant'
  | 'slashing'
  | 'thunder';

export type ScalingType = 
  | 'spell_level'
  | 'character_level'
  | 'spell_attack_modifier'
  | 'none';

export interface SpellHealing {
  readonly rolls: ReadonlyArray<HealingRoll>;
  readonly scalingType?: ScalingType;
  readonly scalingDice?: ReadonlyArray<HealingRoll>;
}

export interface HealingRoll {
  readonly diceCount: number;
  readonly diceSize: number;
  readonly bonus: number;
  readonly diceExpression: string;
  readonly healingType?: HealingType;
}

export type HealingType = 
  | 'healing'
  | 'temporary';

export interface SavingThrow {
  readonly ability: AbilityName;
  readonly dc?: number;
  readonly onSuccess?: SaveResult;
  readonly onFailure?: SaveResult;
}

export type AbilityName = 
  | 'strength'
  | 'dexterity'
  | 'constitution'
  | 'intelligence'
  | 'wisdom'
  | 'charisma';

export type SaveResult = 
  | 'no_effect'
  | 'half_damage'
  | 'full_damage'
  | 'special';

export interface AttackRoll {
  readonly type: AttackType;
  readonly reach?: number;
  readonly targets?: number;
}

export type AttackType = 
  | 'melee_spell'
  | 'ranged_spell';

export interface LimitedUse {
  readonly maxUses: number;
  readonly usedUses: number;
  readonly resetType: ResetType;
  readonly resetCondition?: string;
}

export type ResetType = 
  | 'short_rest'
  | 'long_rest'
  | 'dawn'
  | 'daily'
  | 'weekly'
  | 'recharge'
  | 'special';

export interface SpellOverrides {
  readonly saveDc?: number;
  readonly spellcastingAbility?: AbilityName;
  readonly attackBonus?: number;
  readonly damageBonus?: number;
  readonly range?: SpellRange;
  readonly castingTime?: CastingTime;
  readonly duration?: SpellDuration;
}

export interface SourceReference {
  readonly book: string;
  readonly page?: number;
  readonly url?: string;
  readonly isOGL: boolean;
  readonly isSRD: boolean;
}

// ==================== Spell Collection Models ====================

export interface SpellCollection {
  readonly spells: ReadonlyArray<NormalizedSpell>;
  readonly spellsByLevel: SpellsByLevel;
  readonly spellsBySchool: SpellsBySchool;
  readonly spellsBySource: SpellsBySource;
  readonly metadata: SpellCollectionMetadata;
}

export interface SpellsByLevel {
  readonly cantrips: ReadonlyArray<NormalizedSpell>;
  readonly level1: ReadonlyArray<NormalizedSpell>;
  readonly level2: ReadonlyArray<NormalizedSpell>;
  readonly level3: ReadonlyArray<NormalizedSpell>;
  readonly level4: ReadonlyArray<NormalizedSpell>;
  readonly level5: ReadonlyArray<NormalizedSpell>;
  readonly level6: ReadonlyArray<NormalizedSpell>;
  readonly level7: ReadonlyArray<NormalizedSpell>;
  readonly level8: ReadonlyArray<NormalizedSpell>;
  readonly level9: ReadonlyArray<NormalizedSpell>;
}

export interface SpellsBySchool {
  readonly abjuration: ReadonlyArray<NormalizedSpell>;
  readonly conjuration: ReadonlyArray<NormalizedSpell>;
  readonly divination: ReadonlyArray<NormalizedSpell>;
  readonly enchantment: ReadonlyArray<NormalizedSpell>;
  readonly evocation: ReadonlyArray<NormalizedSpell>;
  readonly illusion: ReadonlyArray<NormalizedSpell>;
  readonly necromancy: ReadonlyArray<NormalizedSpell>;
  readonly transmutation: ReadonlyArray<NormalizedSpell>;
}

export interface SpellsBySource {
  readonly race: ReadonlyArray<NormalizedSpell>;
  readonly class: ReadonlyArray<NormalizedSpell>;
  readonly feat: ReadonlyArray<NormalizedSpell>;
  readonly item: ReadonlyArray<NormalizedSpell>;
  readonly background: ReadonlyArray<NormalizedSpell>;
  readonly multiclass: ReadonlyArray<NormalizedSpell>;
  readonly other: ReadonlyArray<NormalizedSpell>;
}

export interface SpellCollectionMetadata {
  readonly totalSpells: number;
  readonly preparedSpells: number;
  readonly knownSpells: number;
  readonly cantripsKnown: number;
  readonly ritualSpells: number;
  readonly concentrationSpells: number;
  readonly uniqueSpells: number;
  readonly duplicateSpells: number;
  readonly homebrew: number;
  readonly processingTime?: number;
  readonly lastUpdated: Date;
}

// ==================== Fantasy Grounds Output Models ====================

export interface FantasyGroundsSpell {
  readonly name: string;
  readonly level: number;
  readonly school: string;
  readonly castingtime: string;
  readonly range: string;
  readonly duration: string;
  readonly components: string;
  readonly description: string;
  readonly source: string;
  readonly prepared: number; // 0 or 1
  readonly group: string;
  readonly actions?: FantasyGroundsSpellActions;
}

export interface FantasyGroundsSpellActions {
  readonly cast?: FantasyGroundsCastAction;
  readonly damage?: FantasyGroundsDamageAction;
  readonly heal?: FantasyGroundsHealAction;
  readonly effect?: FantasyGroundsEffectAction;
}

export interface FantasyGroundsCastAction {
  readonly type: 'cast';
  readonly atktype?: 'melee' | 'ranged';
  readonly savemagic?: number;
  readonly savetype?: string;
  readonly savedcbase?: number;
  readonly savedcmod?: number;
  readonly onmissdamage?: string;
}

export interface FantasyGroundsDamageAction {
  readonly type: 'damage';
  readonly damagelist: ReadonlyArray<FantasyGroundsDamageEntry>;
}

export interface FantasyGroundsDamageEntry {
  readonly dice: string;
  readonly bonus: number;
  readonly type: string;
  readonly stat?: string;
}

export interface FantasyGroundsHealAction {
  readonly type: 'heal';
  readonly heallist: ReadonlyArray<FantasyGroundsHealEntry>;
}

export interface FantasyGroundsHealEntry {
  readonly dice: string;
  readonly bonus: number;
  readonly stat?: string;
}

export interface FantasyGroundsEffectAction {
  readonly type: 'effect';
  readonly label: string;
  readonly targeting?: string;
  readonly durmod?: number;
  readonly durunit?: string;
  readonly apply?: string;
}

// ==================== Foundry VTT Output Models ====================

export interface FoundrySpell {
  readonly _id?: string;
  readonly name: string;
  readonly type: 'spell';
  readonly img: string;
  readonly system: FoundrySpellSystem;
  readonly effects: ReadonlyArray<FoundryActiveEffect>;
  readonly flags: FoundryFlags;
  readonly folder?: string | null;
  readonly sort: number;
  readonly ownership: Record<string, number>;
}

export interface FoundrySpellSystem {
  readonly description: FoundryDescription;
  readonly source: string;
  readonly activation: FoundryActivation;
  readonly duration: FoundryDuration;
  readonly target: FoundryTarget;
  readonly range: FoundryRange;
  readonly uses: FoundryUses;
  readonly consume: FoundryConsume;
  readonly ability: string;
  readonly actionType: string;
  readonly attackBonus: string;
  readonly chatFlavor: string;
  readonly critical: FoundryCritical;
  readonly damage: FoundryDamage;
  readonly formula: string;
  readonly save: FoundrySave;
  readonly level: number;
  readonly school: string;
  readonly components: FoundryComponents;
  readonly materials: FoundryMaterials;
  readonly preparation: FoundryPreparation;
  readonly scaling: FoundryScaling;
}

export interface FoundryDescription {
  readonly value: string;
  readonly chat: string;
  readonly unidentified: string;
}

export interface FoundryActivation {
  readonly type: string;
  readonly cost: number;
  readonly condition: string;
}

export interface FoundryDuration {
  readonly value: number;
  readonly units: string;
}

export interface FoundryTarget {
  readonly value: number;
  readonly width?: number;
  readonly units: string;
  readonly type: string;
}

export interface FoundryRange {
  readonly value: number;
  readonly long?: number;
  readonly units: string;
}

export interface FoundryUses {
  readonly value?: number;
  readonly max: string;
  readonly per: string;
  readonly recovery: string;
}

export interface FoundryConsume {
  readonly type: string;
  readonly target: string;
  readonly amount: number;
}

export interface FoundryCritical {
  readonly threshold?: number;
  readonly damage: string;
}

export interface FoundryDamage {
  readonly parts: ReadonlyArray<[string, string]>;
  readonly versatile: string;
}

export interface FoundrySave {
  readonly ability: string;
  readonly dc?: number;
  readonly scaling: string;
}

export interface FoundryComponents {
  readonly vocal: boolean;
  readonly somatic: boolean;
  readonly material: boolean;
  readonly ritual: boolean;
  readonly concentration: boolean;
}

export interface FoundryMaterials {
  readonly value: string;
  readonly consumed: boolean;
  readonly cost: number;
  readonly supply: number;
}

export interface FoundryPreparation {
  readonly mode: string;
  readonly prepared: boolean;
}

export interface FoundryScaling {
  readonly mode: string;
  readonly formula: string;
}

export interface FoundryActiveEffect {
  readonly _id?: string;
  readonly label: string;
  readonly icon: string;
  readonly origin?: string;
  readonly duration: FoundryEffectDuration;
  readonly disabled: boolean;
  readonly changes: ReadonlyArray<FoundryEffectChange>;
  readonly tint?: string;
  readonly transfer: boolean;
  readonly flags: FoundryFlags;
}

export interface FoundryEffectDuration {
  readonly startTime?: number;
  readonly seconds?: number;
  readonly combat?: string;
  readonly rounds?: number;
  readonly turns?: number;
  readonly startRound?: number;
  readonly startTurn?: number;
}

export interface FoundryEffectChange {
  readonly key: string;
  readonly mode: number;
  readonly value: string;
  readonly priority: number;
}

export interface FoundryFlags {
  readonly [key: string]: any;
  readonly ddbimporter?: Record<string, any>;
  readonly 'midi-qol'?: Record<string, any>;
  readonly dae?: Record<string, any>;
}

// ==================== Processing Result Types ====================

export interface SpellProcessingResult {
  readonly success: boolean;
  readonly spells: ReadonlyArray<NormalizedSpell>;
  readonly collection: SpellCollection;
  readonly warnings: ReadonlyArray<ProcessingWarning>;
  readonly errors: ReadonlyArray<ProcessingError>;
  readonly metadata: ProcessingMetadata;
}

export interface ProcessingWarning {
  readonly type: WarningType;
  readonly message: string;
  readonly spellName?: string;
  readonly spellId?: string;
  readonly context?: Record<string, unknown>;
}

export type WarningType = 
  | 'duplicate_spell'
  | 'missing_data'
  | 'invalid_format'
  | 'unsupported_feature'
  | 'data_normalization'
  | 'validation_warning';

export interface ProcessingError {
  readonly type: ErrorType;
  readonly message: string;
  readonly spellName?: string;
  readonly spellId?: string;
  readonly stack?: string;
  readonly context?: Record<string, unknown>;
}

export type ErrorType = 
  | 'parsing_error'
  | 'validation_error'
  | 'conversion_error'
  | 'system_error';

export interface ProcessingMetadata {
  readonly startTime: Date;
  readonly endTime: Date;
  readonly processingTimeMs: number;
  readonly inputSource: 'dndbeyond' | 'legacy' | 'manual';
  readonly outputFormats: ReadonlyArray<OutputFormat>;
  readonly totalSpellsProcessed: number;
  readonly successfullyProcessed: number;
  readonly failedToProcess: number;
  readonly duplicatesRemoved: number;
  readonly memoryUsageMB?: number;
}

export type OutputFormat = 
  | 'fantasy_grounds'
  | 'foundry_vtt'
  | 'roll20'
  | 'generic_json';

// ==================== Validation Types ====================

export interface SpellValidationResult {
  readonly valid: boolean;
  readonly spell?: NormalizedSpell;
  readonly errors: ReadonlyArray<ValidationError>;
  readonly warnings: ReadonlyArray<ValidationWarning>;
}

export interface ValidationError {
  readonly field: string;
  readonly message: string;
  readonly value?: unknown;
  readonly constraint?: string;
}

export interface ValidationWarning {
  readonly field: string;
  readonly message: string;
  readonly value?: unknown;
  readonly suggestion?: string;
}

// ==================== Constants and Enums ====================

export const MAGIC_SCHOOLS: ReadonlyArray<MagicSchool> = [
  'Abjuration',
  'Conjuration', 
  'Divination',
  'Enchantment',
  'Evocation',
  'Illusion',
  'Necromancy',
  'Transmutation'
] as const;

export const SPELL_LEVELS: ReadonlyArray<SpellLevel> = [
  0, 1, 2, 3, 4, 5, 6, 7, 8, 9
] as const;

export const DAMAGE_TYPES: ReadonlyArray<DamageType> = [
  'acid',
  'bludgeoning',
  'cold',
  'fire',
  'force',
  'lightning',
  'necrotic',
  'piercing',
  'poison',
  'psychic',
  'radiant',
  'slashing',
  'thunder'
] as const;

export const ABILITY_NAMES: ReadonlyArray<AbilityName> = [
  'strength',
  'dexterity',
  'constitution',
  'intelligence',
  'wisdom',
  'charisma'
] as const;

// Component mapping for D&D Beyond (bit flags)
export const DNDBEYOND_COMPONENTS = {
  VERBAL: 1,
  SOMATIC: 2,
  MATERIAL: 4
} as const;

// Activation type mapping for D&D Beyond
export const DNDBEYOND_ACTIVATION_TYPES = {
  ACTION: 1,
  BONUS_ACTION: 2,
  REACTION: 3,
  MINUTE: 4,
  HOUR: 5,
  NO_ACTION: 6,
  SPECIAL: 7
} as const;

// Fantasy Grounds spell group mapping
export const FANTASY_GROUNDS_SPELL_GROUPS = {
  SORCERER: 'Spells (Sorcerer)',
  WIZARD: 'Spells (Wizard)',
  CLERIC: 'Spells (Cleric)',
  DRUID: 'Spells (Druid)',
  BARD: 'Spells (Bard)',
  PALADIN: 'Spells (Paladin)',
  RANGER: 'Spells (Ranger)',
  WARLOCK: 'Spells (Warlock)',
  ARTIFICER: 'Spells (Artificer)',
  RACIAL: 'Class (Racial)',
  FEAT: 'Class (Feat)',
  ITEM: 'Class (Item)'
} as const;

// Value objects for type safety
export class SpellId {
  constructor(public readonly id: string) {
    if (!id || typeof id !== 'string') {
      throw new Error('Spell ID must be a non-empty string');
    }
  }
  
  toString(): string {
    return this.id;
  }
  
  equals(other: SpellId): boolean {
    return this.id === other.id;
  }
}

export class SpellName {
  constructor(public readonly name: string) {
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      throw new Error('Spell name must be a non-empty string');
    }
  }
  
  toString(): string {
    return this.name;
  }
  
  normalized(): string {
    return this.name.toLowerCase().trim();
  }
}