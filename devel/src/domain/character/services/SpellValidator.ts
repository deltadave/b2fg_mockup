/**
 * SpellValidator Service
 * 
 * Validates spell data for completeness, accuracy, and D&D 5e rule compliance.
 * Provides comprehensive validation for normalized spell structures.
 */

import {
  NormalizedSpell,
  SpellValidationResult,
  ValidationError,
  ValidationWarning,
  SpellLevel,
  MagicSchool,
  SpellSource,
  CastingTime,
  SpellRange,
  SpellDuration,
  SpellComponents,
  SpellDamage,
  SpellHealing,
  SavingThrow,
  AttackRoll,
  LimitedUse,
  SpellOverrides,
  SourceReference,
  MAGIC_SCHOOLS,
  SPELL_LEVELS,
  DAMAGE_TYPES,
  ABILITY_NAMES
} from '../models/Spells';

export interface ValidationOptions {
  readonly strict?: boolean;
  readonly validateDnD5eRules?: boolean;
  readonly allowHomebrew?: boolean;
  readonly requireSourceReference?: boolean;
  readonly validateDamageTypes?: boolean;
  readonly validateSpellLevels?: boolean;
  readonly validateAbilityNames?: boolean;
  readonly maxNameLength?: number;
  readonly maxDescriptionLength?: number;
}

export interface ValidationContext {
  readonly characterLevel?: number;
  readonly spellcastingClasses?: ReadonlyArray<string>;
  readonly spellcastingAbilities?: ReadonlyArray<string>;
  readonly knownSpells?: ReadonlyArray<string>;
  readonly availableSpellSlots?: Record<number, number>;
}

export class SpellValidator {
  private readonly errors: ValidationError[] = [];
  private readonly warnings: ValidationWarning[] = [];

  /**
   * Validate a single spell
   * 
   * @param spell - The spell to validate
   * @param options - Validation options
   * @param context - Optional context for advanced validation
   * @returns Validation result with errors and warnings
   */
  public validateSpell(
    spell: unknown,
    options: ValidationOptions = {},
    context?: ValidationContext
  ): SpellValidationResult {
    this.clearResults();
    
    // Type guard: ensure we have a proper spell object
    if (!this.isNormalizedSpell(spell)) {
      this.addError('spell', 'Invalid spell object structure', spell);
      return this.createResult(false);
    }

    const {
      strict = false,
      validateDnD5eRules = true,
      allowHomebrew = true,
      requireSourceReference = false,
      validateDamageTypes = true,
      validateSpellLevels = true,
      validateAbilityNames = true,
      maxNameLength = 100,
      maxDescriptionLength = 10000
    } = options;

    try {
      // Core field validation
      this.validateCoreFields(spell, { maxNameLength, maxDescriptionLength });

      // D&D 5e rule validation
      if (validateDnD5eRules) {
        this.validateDnD5eRules(spell, { 
          strict, 
          validateSpellLevels, 
          validateDamageTypes, 
          validateAbilityNames 
        });
      }

      // Homebrew validation
      if (!allowHomebrew && spell.isHomebrew) {
        this.addError('isHomebrew', 'Homebrew spells are not allowed', spell.isHomebrew);
      }

      // Source reference validation
      if (requireSourceReference && !spell.sourceReference) {
        this.addError('sourceReference', 'Source reference is required', spell.sourceReference);
      }

      // Component validation
      this.validateComponents(spell.components);

      // Casting time validation
      this.validateCastingTime(spell.castingTime);

      // Range validation
      this.validateRange(spell.range);

      // Duration validation
      this.validateDuration(spell.duration);

      // Damage validation
      if (spell.damage) {
        this.validateDamage(spell.damage, { validateDamageTypes });
      }

      // Healing validation
      if (spell.healing) {
        this.validateHealing(spell.healing);
      }

      // Saving throw validation
      if (spell.savingThrow) {
        this.validateSavingThrow(spell.savingThrow, { validateAbilityNames });
      }

      // Attack roll validation
      if (spell.attackRoll) {
        this.validateAttackRoll(spell.attackRoll);
      }

      // Limited use validation
      if (spell.limitedUse) {
        this.validateLimitedUse(spell.limitedUse);
      }

      // Override validation
      if (spell.overrides) {
        this.validateOverrides(spell.overrides, { validateAbilityNames });
      }

      // Source reference validation
      if (spell.sourceReference) {
        this.validateSourceReference(spell.sourceReference);
      }

      // Context-based validation
      if (context) {
        this.validateWithContext(spell, context);
      }

      // Consistency validation
      this.validateConsistency(spell);

      return this.createResult(true, spell);

    } catch (error) {
      this.addError('validation', `Validation failed: ${error instanceof Error ? error.message : String(error)}`, error);
      return this.createResult(false);
    }
  }

  /**
   * Validate multiple spells
   * 
   * @param spells - Array of spells to validate
   * @param options - Validation options
   * @param context - Optional context for advanced validation
   * @returns Array of validation results
   */
  public validateSpells(
    spells: ReadonlyArray<unknown>,
    options: ValidationOptions = {},
    context?: ValidationContext
  ): ReadonlyArray<SpellValidationResult> {
    return spells.map(spell => this.validateSpell(spell, options, context));
  }

  /**
   * Validate spell collection for consistency
   * 
   * @param spells - Array of validated spells
   * @param context - Validation context
   * @returns Collection-level validation warnings
   */
  public validateCollection(
    spells: ReadonlyArray<NormalizedSpell>,
    context?: ValidationContext
  ): ReadonlyArray<ValidationWarning> {
    const collectionWarnings: ValidationWarning[] = [];

    // Check for duplicates
    const spellNames = new Set<string>();
    const duplicates = new Set<string>();
    
    for (const spell of spells) {
      const key = `${spell.name.toLowerCase()}-${spell.level}`;
      if (spellNames.has(key)) {
        duplicates.add(spell.name);
      } else {
        spellNames.add(key);
      }
    }

    for (const name of duplicates) {
      collectionWarnings.push({
        field: 'collection',
        message: `Duplicate spell found: ${name}`,
        value: name,
        suggestion: 'Remove duplicate spells or ensure they have different sources'
      });
    }

    // Validate spell level distribution
    const spellsByLevel = spells.reduce((acc, spell) => {
      acc[spell.level] = (acc[spell.level] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    // Warn if character has many high-level spells but no low-level spells
    if (context?.characterLevel) {
      const expectedMaxSpellLevel = Math.min(9, Math.ceil(context.characterLevel / 2));
      const hasHighLevelSpells = spells.some(s => s.level > expectedMaxSpellLevel);
      const hasLowLevelSpells = spells.some(s => s.level <= 2);

      if (hasHighLevelSpells && !hasLowLevelSpells) {
        collectionWarnings.push({
          field: 'collection',
          message: `Character has high-level spells but no low-level spells (Character Level: ${context.characterLevel})`,
          suggestion: 'Verify character can cast these spell levels'
        });
      }
    }

    return collectionWarnings;
  }

  // ==================== Private Validation Methods ====================

  /**
   * Type guard to check if object is a NormalizedSpell
   */
  private isNormalizedSpell(obj: unknown): obj is NormalizedSpell {
    return (
      typeof obj === 'object' &&
      obj !== null &&
      'id' in obj &&
      'name' in obj &&
      'level' in obj &&
      'school' in obj &&
      'source' in obj &&
      'castingTime' in obj &&
      'range' in obj &&
      'duration' in obj &&
      'components' in obj &&
      'description' in obj
    );
  }

  /**
   * Validate core spell fields
   */
  private validateCoreFields(
    spell: NormalizedSpell, 
    options: { maxNameLength: number; maxDescriptionLength: number }
  ): void {
    // ID validation
    if (!spell.id || typeof spell.id !== 'string' || spell.id.trim().length === 0) {
      this.addError('id', 'Spell ID is required and must be a non-empty string', spell.id);
    }

    // Name validation
    if (!spell.name || typeof spell.name !== 'string' || spell.name.trim().length === 0) {
      this.addError('name', 'Spell name is required and must be a non-empty string', spell.name);
    } else if (spell.name.length > options.maxNameLength) {
      this.addError('name', `Spell name exceeds maximum length (${options.maxNameLength})`, spell.name);
    }

    // Level validation
    if (!SPELL_LEVELS.includes(spell.level)) {
      this.addError('level', 'Invalid spell level', spell.level, 'Must be 0-9');
    }

    // School validation
    if (!MAGIC_SCHOOLS.includes(spell.school)) {
      this.addError('school', 'Invalid magic school', spell.school, `Must be one of: ${MAGIC_SCHOOLS.join(', ')}`);
    }

    // Source validation
    const validSources: SpellSource[] = ['race', 'class', 'feat', 'item', 'background', 'multiclass', 'other'];
    if (!validSources.includes(spell.source)) {
      this.addError('source', 'Invalid spell source', spell.source, `Must be one of: ${validSources.join(', ')}`);
    }

    // Description validation
    if (!spell.description || typeof spell.description !== 'string' || spell.description.trim().length === 0) {
      this.addError('description', 'Spell description is required and must be a non-empty string', spell.description);
    } else if (spell.description.length > options.maxDescriptionLength) {
      this.addError('description', `Spell description exceeds maximum length (${options.maxDescriptionLength})`, spell.description.length);
    }

    // Boolean field validation
    if (typeof spell.concentration !== 'boolean') {
      this.addError('concentration', 'Concentration must be a boolean', spell.concentration);
    }

    if (typeof spell.ritual !== 'boolean') {
      this.addError('ritual', 'Ritual must be a boolean', spell.ritual);
    }

    if (typeof spell.prepared !== 'boolean') {
      this.addError('prepared', 'Prepared must be a boolean', spell.prepared);
    }

    if (typeof spell.alwaysPrepared !== 'boolean') {
      this.addError('alwaysPrepared', 'AlwaysPrepared must be a boolean', spell.alwaysPrepared);
    }

    if (typeof spell.usesSpellSlot !== 'boolean') {
      this.addError('usesSpellSlot', 'UsesSpellSlot must be a boolean', spell.usesSpellSlot);
    }

    if (typeof spell.canCastAsRitual !== 'boolean') {
      this.addError('canCastAsRitual', 'CanCastAsRitual must be a boolean', spell.canCastAsRitual);
    }

    if (typeof spell.isHomebrew !== 'boolean') {
      this.addError('isHomebrew', 'IsHomebrew must be a boolean', spell.isHomebrew);
    }

    // Tags validation
    if (!Array.isArray(spell.tags)) {
      this.addError('tags', 'Tags must be an array', spell.tags);
    } else {
      for (const tag of spell.tags) {
        if (typeof tag !== 'string') {
          this.addError('tags', 'All tags must be strings', tag);
        }
      }
    }
  }

  /**
   * Validate D&D 5e specific rules
   */
  private validateDnD5eRules(
    spell: NormalizedSpell,
    options: { 
      strict: boolean; 
      validateSpellLevels: boolean; 
      validateDamageTypes: boolean; 
      validateAbilityNames: boolean;
    }
  ): void {
    // Cantrip-specific rules
    if (spell.level === 0) {
      if (spell.usesSpellSlot) {
        this.addWarning('usesSpellSlot', 'Cantrips typically do not use spell slots', spell.usesSpellSlot);
      }
      
      if (spell.concentration && options.strict) {
        this.addWarning('concentration', 'Concentration cantrips are rare in official D&D 5e', spell.concentration);
      }
    }

    // Ritual spell rules
    if (spell.ritual && spell.level === 0) {
      this.addWarning('ritual', 'Ritual cantrips do not exist in D&D 5e', spell.ritual);
    }

    // Concentration and instantaneous duration conflict
    if (spell.concentration && spell.duration.type === 'instantaneous') {
      this.addError('concentration', 'Concentration spells cannot have instantaneous duration', spell.concentration);
    }

    // School-specific validation
    this.validateSchoolConsistency(spell);

    // Level-appropriate effects validation
    if (options.strict) {
      this.validateLevelAppropriateEffects(spell);
    }
  }

  /**
   * Validate spell components
   */
  private validateComponents(components: SpellComponents): void {
    if (typeof components !== 'object' || components === null) {
      this.addError('components', 'Components must be an object', components);
      return;
    }

    // Boolean validations
    if (typeof components.verbal !== 'boolean') {
      this.addError('components.verbal', 'Verbal component must be a boolean', components.verbal);
    }

    if (typeof components.somatic !== 'boolean') {
      this.addError('components.somatic', 'Somatic component must be a boolean', components.somatic);
    }

    if (typeof components.material !== 'boolean') {
      this.addError('components.material', 'Material component must be a boolean', components.material);
    }

    if (typeof components.materialConsumed !== 'boolean') {
      this.addError('components.materialConsumed', 'MaterialConsumed must be a boolean', components.materialConsumed);
    }

    // String validations
    if (typeof components.description !== 'string') {
      this.addError('components.description', 'Description must be a string', components.description);
    }

    // Material component specific validation
    if (components.material) {
      if (components.materialDescription && typeof components.materialDescription !== 'string') {
        this.addError('components.materialDescription', 'MaterialDescription must be a string', components.materialDescription);
      }

      if (components.materialCost !== undefined && (typeof components.materialCost !== 'number' || components.materialCost < 0)) {
        this.addError('components.materialCost', 'MaterialCost must be a non-negative number', components.materialCost);
      }
    } else {
      // If not material component, these should not be set
      if (components.materialDescription) {
        this.addWarning('components.materialDescription', 'MaterialDescription set but material component is false', components.materialDescription);
      }
      if (components.materialCost !== undefined) {
        this.addWarning('components.materialCost', 'MaterialCost set but material component is false', components.materialCost);
      }
      if (components.materialConsumed) {
        this.addWarning('components.materialConsumed', 'MaterialConsumed is true but material component is false', components.materialConsumed);
      }
    }

    // At least one component should be required
    if (!components.verbal && !components.somatic && !components.material) {
      this.addWarning('components', 'Spells typically require at least one component (V, S, or M)', components);
    }
  }

  /**
   * Validate casting time
   */
  private validateCastingTime(castingTime: CastingTime): void {
    if (typeof castingTime !== 'object' || castingTime === null) {
      this.addError('castingTime', 'CastingTime must be an object', castingTime);
      return;
    }

    // Type validation
    const validTypes: CastingTime['type'][] = ['action', 'bonus_action', 'reaction', 'minute', 'hour', 'special'];
    if (!validTypes.includes(castingTime.type)) {
      this.addError('castingTime.type', 'Invalid casting time type', castingTime.type, `Must be one of: ${validTypes.join(', ')}`);
    }

    // Value validation
    if (typeof castingTime.value !== 'number' || castingTime.value < 0) {
      this.addError('castingTime.value', 'CastingTime value must be a non-negative number', castingTime.value);
    }

    // Unit validation for timed casting
    if (['minute', 'hour'].includes(castingTime.type) && !castingTime.unit) {
      this.addError('castingTime.unit', 'Unit is required for timed casting', castingTime.unit);
    }

    // Description validation
    if (typeof castingTime.description !== 'string') {
      this.addError('castingTime.description', 'Description must be a string', castingTime.description);
    }
  }

  /**
   * Validate spell range
   */
  private validateRange(range: SpellRange): void {
    if (typeof range !== 'object' || range === null) {
      this.addError('range', 'Range must be an object', range);
      return;
    }

    // Type validation
    const validTypes: SpellRange['type'][] = ['self', 'touch', 'ranged', 'sight', 'unlimited', 'special'];
    if (!validTypes.includes(range.type)) {
      this.addError('range.type', 'Invalid range type', range.type, `Must be one of: ${validTypes.join(', ')}`);
    }

    // Value validation for ranged spells
    if (range.type === 'ranged') {
      if (typeof range.value !== 'number' || range.value <= 0) {
        this.addError('range.value', 'Ranged spells must have a positive range value', range.value);
      }
    }

    // Area of effect validation
    if (range.areaOfEffect) {
      const validAoeTypes: NonNullable<SpellRange['areaOfEffect']>['type'][] = 
        ['sphere', 'cube', 'cylinder', 'cone', 'line', 'hemisphere', 'square', 'special'];
      
      if (!validAoeTypes.includes(range.areaOfEffect.type)) {
        this.addError('range.areaOfEffect.type', 'Invalid area of effect type', range.areaOfEffect.type);
      }

      if (typeof range.areaOfEffect.size !== 'number' || range.areaOfEffect.size <= 0) {
        this.addError('range.areaOfEffect.size', 'Area of effect size must be a positive number', range.areaOfEffect.size);
      }
    }

    // Description validation
    if (typeof range.description !== 'string') {
      this.addError('range.description', 'Description must be a string', range.description);
    }
  }

  /**
   * Validate spell duration
   */
  private validateDuration(duration: SpellDuration): void {
    if (typeof duration !== 'object' || duration === null) {
      this.addError('duration', 'Duration must be an object', duration);
      return;
    }

    // Type validation
    const validTypes: SpellDuration['type'][] = ['instantaneous', 'timed', 'until_dispelled', 'special', 'permanent'];
    if (!validTypes.includes(duration.type)) {
      this.addError('duration.type', 'Invalid duration type', duration.type, `Must be one of: ${validTypes.join(', ')}`);
    }

    // Value validation for timed duration
    if (duration.type === 'timed') {
      if (typeof duration.value !== 'number' || duration.value <= 0) {
        this.addError('duration.value', 'Timed duration must have a positive value', duration.value);
      }

      if (!duration.unit) {
        this.addError('duration.unit', 'Timed duration must have a unit', duration.unit);
      }
    }

    // Concentration validation
    if (typeof duration.concentration !== 'boolean') {
      this.addError('duration.concentration', 'Concentration must be a boolean', duration.concentration);
    }

    // Description validation
    if (typeof duration.description !== 'string') {
      this.addError('duration.description', 'Description must be a string', duration.description);
    }
  }

  /**
   * Validate spell damage
   */
  private validateDamage(damage: SpellDamage, options: { validateDamageTypes: boolean }): void {
    if (typeof damage !== 'object' || damage === null) {
      this.addError('damage', 'Damage must be an object', damage);
      return;
    }

    // Rolls validation
    if (!Array.isArray(damage.rolls)) {
      this.addError('damage.rolls', 'Damage rolls must be an array', damage.rolls);
      return;
    }

    for (let i = 0; i < damage.rolls.length; i++) {
      const roll = damage.rolls[i];
      
      if (typeof roll.diceCount !== 'number' || roll.diceCount < 0) {
        this.addError(`damage.rolls[${i}].diceCount`, 'Dice count must be a non-negative number', roll.diceCount);
      }

      if (typeof roll.diceSize !== 'number' || ![4, 6, 8, 10, 12, 20, 100].includes(roll.diceSize)) {
        this.addError(`damage.rolls[${i}].diceSize`, 'Invalid dice size', roll.diceSize, 'Must be 4, 6, 8, 10, 12, 20, or 100');
      }

      if (typeof roll.bonus !== 'number') {
        this.addError(`damage.rolls[${i}].bonus`, 'Bonus must be a number', roll.bonus);
      }

      if (options.validateDamageTypes && !DAMAGE_TYPES.includes(roll.damageType)) {
        this.addError(`damage.rolls[${i}].damageType`, 'Invalid damage type', roll.damageType, `Must be one of: ${DAMAGE_TYPES.join(', ')}`);
      }

      if (typeof roll.diceExpression !== 'string') {
        this.addError(`damage.rolls[${i}].diceExpression`, 'Dice expression must be a string', roll.diceExpression);
      }
    }

    // Scaling type validation
    if (damage.scalingType) {
      const validScalingTypes: NonNullable<SpellDamage['scalingType']>[] = ['spell_level', 'character_level', 'spell_attack_modifier', 'none'];
      if (!validScalingTypes.includes(damage.scalingType)) {
        this.addError('damage.scalingType', 'Invalid scaling type', damage.scalingType);
      }
    }
  }

  /**
   * Validate spell healing
   */
  private validateHealing(healing: SpellHealing): void {
    if (typeof healing !== 'object' || healing === null) {
      this.addError('healing', 'Healing must be an object', healing);
      return;
    }

    // Rolls validation
    if (!Array.isArray(healing.rolls)) {
      this.addError('healing.rolls', 'Healing rolls must be an array', healing.rolls);
      return;
    }

    for (let i = 0; i < healing.rolls.length; i++) {
      const roll = healing.rolls[i];
      
      if (typeof roll.diceCount !== 'number' || roll.diceCount < 0) {
        this.addError(`healing.rolls[${i}].diceCount`, 'Dice count must be a non-negative number', roll.diceCount);
      }

      if (typeof roll.diceSize !== 'number' || ![4, 6, 8, 10, 12, 20, 100].includes(roll.diceSize)) {
        this.addError(`healing.rolls[${i}].diceSize`, 'Invalid dice size', roll.diceSize);
      }

      if (typeof roll.bonus !== 'number') {
        this.addError(`healing.rolls[${i}].bonus`, 'Bonus must be a number', roll.bonus);
      }

      if (typeof roll.diceExpression !== 'string') {
        this.addError(`healing.rolls[${i}].diceExpression`, 'Dice expression must be a string', roll.diceExpression);
      }
    }
  }

  /**
   * Validate saving throw
   */
  private validateSavingThrow(savingThrow: SavingThrow, options: { validateAbilityNames: boolean }): void {
    if (typeof savingThrow !== 'object' || savingThrow === null) {
      this.addError('savingThrow', 'SavingThrow must be an object', savingThrow);
      return;
    }

    // Ability validation
    if (options.validateAbilityNames && !ABILITY_NAMES.includes(savingThrow.ability)) {
      this.addError('savingThrow.ability', 'Invalid ability name', savingThrow.ability, `Must be one of: ${ABILITY_NAMES.join(', ')}`);
    }

    // DC validation
    if (savingThrow.dc !== undefined && (typeof savingThrow.dc !== 'number' || savingThrow.dc < 1 || savingThrow.dc > 30)) {
      this.addError('savingThrow.dc', 'DC must be a number between 1 and 30', savingThrow.dc);
    }

    // Save results validation
    const validResults: NonNullable<SavingThrow['onSuccess']>[] = ['no_effect', 'half_damage', 'full_damage', 'special'];
    if (savingThrow.onSuccess && !validResults.includes(savingThrow.onSuccess)) {
      this.addError('savingThrow.onSuccess', 'Invalid save result', savingThrow.onSuccess);
    }

    if (savingThrow.onFailure && !validResults.includes(savingThrow.onFailure)) {
      this.addError('savingThrow.onFailure', 'Invalid save result', savingThrow.onFailure);
    }
  }

  /**
   * Validate attack roll
   */
  private validateAttackRoll(attackRoll: AttackRoll): void {
    if (typeof attackRoll !== 'object' || attackRoll === null) {
      this.addError('attackRoll', 'AttackRoll must be an object', attackRoll);
      return;
    }

    // Type validation
    const validTypes: AttackRoll['type'][] = ['melee_spell', 'ranged_spell'];
    if (!validTypes.includes(attackRoll.type)) {
      this.addError('attackRoll.type', 'Invalid attack type', attackRoll.type, `Must be one of: ${validTypes.join(', ')}`);
    }

    // Reach validation
    if (attackRoll.reach !== undefined && (typeof attackRoll.reach !== 'number' || attackRoll.reach < 0)) {
      this.addError('attackRoll.reach', 'Reach must be a non-negative number', attackRoll.reach);
    }

    // Targets validation
    if (attackRoll.targets !== undefined && (typeof attackRoll.targets !== 'number' || attackRoll.targets < 1)) {
      this.addError('attackRoll.targets', 'Targets must be a positive number', attackRoll.targets);
    }
  }

  /**
   * Validate limited use
   */
  private validateLimitedUse(limitedUse: LimitedUse): void {
    if (typeof limitedUse !== 'object' || limitedUse === null) {
      this.addError('limitedUse', 'LimitedUse must be an object', limitedUse);
      return;
    }

    // Max uses validation
    if (typeof limitedUse.maxUses !== 'number' || limitedUse.maxUses < 1) {
      this.addError('limitedUse.maxUses', 'MaxUses must be a positive number', limitedUse.maxUses);
    }

    // Used uses validation
    if (typeof limitedUse.usedUses !== 'number' || limitedUse.usedUses < 0) {
      this.addError('limitedUse.usedUses', 'UsedUses must be a non-negative number', limitedUse.usedUses);
    }

    // Used uses should not exceed max uses
    if (limitedUse.usedUses > limitedUse.maxUses) {
      this.addError('limitedUse.usedUses', 'UsedUses cannot exceed MaxUses', limitedUse.usedUses);
    }

    // Reset type validation
    const validResetTypes: LimitedUse['resetType'][] = ['short_rest', 'long_rest', 'dawn', 'daily', 'weekly', 'recharge', 'special'];
    if (!validResetTypes.includes(limitedUse.resetType)) {
      this.addError('limitedUse.resetType', 'Invalid reset type', limitedUse.resetType, `Must be one of: ${validResetTypes.join(', ')}`);
    }
  }

  /**
   * Validate spell overrides
   */
  private validateOverrides(overrides: SpellOverrides, options: { validateAbilityNames: boolean }): void {
    if (typeof overrides !== 'object' || overrides === null) {
      this.addError('overrides', 'Overrides must be an object', overrides);
      return;
    }

    // DC override validation
    if (overrides.saveDc !== undefined && (typeof overrides.saveDc !== 'number' || overrides.saveDc < 1 || overrides.saveDc > 30)) {
      this.addError('overrides.saveDc', 'SaveDc must be a number between 1 and 30', overrides.saveDc);
    }

    // Spellcasting ability validation
    if (overrides.spellcastingAbility && options.validateAbilityNames && !ABILITY_NAMES.includes(overrides.spellcastingAbility)) {
      this.addError('overrides.spellcastingAbility', 'Invalid spellcasting ability', overrides.spellcastingAbility);
    }

    // Attack bonus validation
    if (overrides.attackBonus !== undefined && typeof overrides.attackBonus !== 'number') {
      this.addError('overrides.attackBonus', 'AttackBonus must be a number', overrides.attackBonus);
    }

    // Damage bonus validation
    if (overrides.damageBonus !== undefined && typeof overrides.damageBonus !== 'number') {
      this.addError('overrides.damageBonus', 'DamageBonus must be a number', overrides.damageBonus);
    }
  }

  /**
   * Validate source reference
   */
  private validateSourceReference(sourceReference: SourceReference): void {
    if (typeof sourceReference !== 'object' || sourceReference === null) {
      this.addError('sourceReference', 'SourceReference must be an object', sourceReference);
      return;
    }

    // Book validation
    if (typeof sourceReference.book !== 'string' || sourceReference.book.trim().length === 0) {
      this.addError('sourceReference.book', 'Book must be a non-empty string', sourceReference.book);
    }

    // Page validation
    if (sourceReference.page !== undefined && (typeof sourceReference.page !== 'number' || sourceReference.page < 1)) {
      this.addError('sourceReference.page', 'Page must be a positive number', sourceReference.page);
    }

    // Boolean validations
    if (typeof sourceReference.isOGL !== 'boolean') {
      this.addError('sourceReference.isOGL', 'IsOGL must be a boolean', sourceReference.isOGL);
    }

    if (typeof sourceReference.isSRD !== 'boolean') {
      this.addError('sourceReference.isSRD', 'IsSRD must be a boolean', sourceReference.isSRD);
    }
  }

  /**
   * Validate spell with context
   */
  private validateWithContext(spell: NormalizedSpell, context: ValidationContext): void {
    // Character level validation
    if (context.characterLevel) {
      const maxSpellLevel = Math.min(9, Math.ceil(context.characterLevel / 2));
      if (spell.level > maxSpellLevel) {
        this.addWarning('level', `Spell level (${spell.level}) may be too high for character level (${context.characterLevel})`, spell.level);
      }
    }

    // Spellcasting class validation
    if (context.spellcastingClasses && context.spellcastingClasses.length > 0) {
      // This would require more detailed spell list data to validate properly
      // For now, just warn if the spell seems unusual for the classes
      if (spell.source === 'class' && spell.level === 0 && context.spellcastingClasses.includes('paladin')) {
        this.addWarning('source', 'Paladins do not typically have cantrips', spell.source);
      }
    }

    // Spell slot availability validation
    if (context.availableSpellSlots && spell.usesSpellSlot && spell.level > 0) {
      const availableSlots = context.availableSpellSlots[spell.level] || 0;
      if (availableSlots === 0) {
        this.addWarning('level', `Character has no available spell slots for level ${spell.level}`, spell.level);
      }
    }
  }

  /**
   * Validate spell consistency
   */
  private validateConsistency(spell: NormalizedSpell): void {
    // Ritual and concentration consistency
    if (spell.canCastAsRitual && !spell.ritual) {
      this.addWarning('canCastAsRitual', 'CanCastAsRitual is true but ritual is false', spell.canCastAsRitual);
    }

    // Always prepared and preparation consistency
    if (spell.alwaysPrepared && !spell.prepared) {
      this.addWarning('prepared', 'Spell is always prepared but not marked as prepared', spell.prepared);
    }

    // Damage and saving throw consistency
    if (spell.damage && !spell.savingThrow && !spell.attackRoll) {
      this.addWarning('damage', 'Spell has damage but no saving throw or attack roll', spell.damage);
    }

    // Healing spells typically don't require saves
    if (spell.healing && spell.savingThrow) {
      this.addWarning('healing', 'Healing spells typically do not require saving throws', spell.healing);
    }

    // Concentration and duration consistency
    if (spell.concentration && spell.duration.type === 'instantaneous') {
      this.addError('concentration', 'Concentration spells cannot have instantaneous duration', spell.concentration);
    }

    // Cantrip specific consistency checks
    if (spell.level === 0) {
      if (spell.usesSpellSlot) {
        this.addWarning('usesSpellSlot', 'Cantrips typically do not use spell slots', spell.usesSpellSlot);
      }
    }
  }

  /**
   * Validate school consistency with spell effects
   */
  private validateSchoolConsistency(spell: NormalizedSpell): void {
    // These are soft validations - unusual combinations that might indicate errors
    switch (spell.school) {
      case 'Necromancy':
        if (spell.healing && !spell.name.toLowerCase().includes('vampir')) {
          this.addWarning('school', 'Necromancy spells typically deal damage rather than heal (except vampiric effects)', spell.school);
        }
        break;

      case 'Evocation':
        if (!spell.damage && !spell.healing && spell.level > 0) {
          this.addWarning('school', 'Evocation spells typically deal damage or provide healing', spell.school);
        }
        break;

      case 'Abjuration':
        if (spell.damage && !spell.name.toLowerCase().includes('dispel')) {
          this.addWarning('school', 'Abjuration spells typically protect rather than deal damage', spell.school);
        }
        break;

      case 'Illusion':
        if (spell.damage && spell.level < 6) {
          this.addWarning('school', 'Low-level Illusion spells typically do not deal direct damage', spell.school);
        }
        break;
    }
  }

  /**
   * Validate level-appropriate effects
   */
  private validateLevelAppropriateEffects(spell: NormalizedSpell): void {
    // Damage validation by spell level
    if (spell.damage) {
      const totalDamage = spell.damage.rolls.reduce((sum, roll) => {
        const avgDamage = (roll.diceCount * (roll.diceSize + 1) / 2) + roll.bonus;
        return sum + avgDamage;
      }, 0);

      // Rough guidelines for average damage by spell level
      const expectedDamage: Record<number, { min: number; max: number }> = {
        0: { min: 1, max: 12 },   // Cantrips
        1: { min: 5, max: 15 },   // 1st level
        2: { min: 10, max: 25 },  // 2nd level
        3: { min: 15, max: 35 },  // 3rd level
        4: { min: 20, max: 45 },  // 4th level
        5: { min: 25, max: 60 },  // 5th level
      };

      const expected = expectedDamage[spell.level];
      if (expected && (totalDamage < expected.min || totalDamage > expected.max)) {
        this.addWarning('damage', `Damage (${totalDamage.toFixed(1)}) may be inappropriate for spell level ${spell.level}`, totalDamage);
      }
    }

    // Duration validation by spell level
    if (spell.duration.type === 'timed' && spell.duration.value && spell.duration.unit) {
      const durationInMinutes = spell.duration.unit === 'hour' ? spell.duration.value * 60 : 
                                 spell.duration.unit === 'minute' ? spell.duration.value : 1;

      if (spell.level <= 2 && durationInMinutes > 60) {
        this.addWarning('duration', 'Long durations are unusual for low-level spells', spell.duration);
      }
    }
  }

  // ==================== Helper Methods ====================

  /**
   * Add validation error
   */
  private addError(field: string, message: string, value?: unknown, constraint?: string): void {
    this.errors.push({
      field,
      message,
      value,
      constraint
    });
  }

  /**
   * Add validation warning
   */
  private addWarning(field: string, message: string, value?: unknown, suggestion?: string): void {
    this.warnings.push({
      field,
      message,
      value,
      suggestion
    });
  }

  /**
   * Clear previous validation results
   */
  private clearResults(): void {
    this.errors.length = 0;
    this.warnings.length = 0;
  }

  /**
   * Create validation result
   */
  private createResult(valid: boolean, spell?: NormalizedSpell): SpellValidationResult {
    return {
      valid,
      spell,
      errors: [...this.errors],
      warnings: [...this.warnings]
    };
  }
}