/**
 * SpellDataExtractor Service
 * 
 * Extracts and normalizes spell data from D&D Beyond JSON format to domain models.
 * Uses SafeAccess utility for safe property access and StringSanitizer for content cleaning.
 */

import { SafeAccess } from '../../../shared/utils/SafeAccess';
import { StringSanitizer } from '../../../shared/utils/StringSanitizer';
import {
  DnDBeyondSpellData,
  DnDBeyondSpellEntry,
  DnDBeyondSpellDefinition,
  NormalizedSpell,
  SpellCollection,
  SpellProcessingResult,
  SpellsByLevel,
  SpellsBySchool,
  SpellsBySource,
  SpellCollectionMetadata,
  ProcessingWarning,
  ProcessingError,
  ProcessingMetadata,
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
  DNDBEYOND_COMPONENTS,
  DNDBEYOND_ACTIVATION_TYPES,
  MAGIC_SCHOOLS,
  SPELL_LEVELS,
  DAMAGE_TYPES,
  ABILITY_NAMES,
  SpellId,
  SpellName
} from '../models/Spells';

export interface ExtractionOptions {
  readonly includeDuplicates?: boolean;
  readonly validateSpells?: boolean;
  readonly sanitizeContent?: boolean;
  readonly maxProcessingTime?: number;
  readonly includeHomebrew?: boolean;
  readonly sourceFilter?: ReadonlyArray<SpellSource>;
  readonly levelFilter?: ReadonlyArray<SpellLevel>;
  readonly schoolFilter?: ReadonlyArray<MagicSchool>;
}

export interface ExtractionMetrics {
  readonly totalSpellsFound: number;
  readonly spellsExtracted: number;
  readonly duplicatesFound: number;
  readonly validationErrors: number;
  readonly processingTimeMs: number;
  readonly memoryUsageMB?: number;
}

export class SpellDataExtractor {
  private readonly warnings: ProcessingWarning[] = [];
  private readonly errors: ProcessingError[] = [];
  private readonly startTime: Date = new Date();

  /**
   * Extract spells from D&D Beyond character data
   * 
   * @param characterData - D&D Beyond character JSON
   * @param options - Extraction options
   * @returns Spell processing result with normalized spells
   */
  public async extractSpells(
    characterData: unknown,
    options: ExtractionOptions = {}
  ): Promise<SpellProcessingResult> {
    const {
      includeDuplicates = false,
      validateSpells = true,
      sanitizeContent = true,
      maxProcessingTime = 30000,
      includeHomebrew = true,
      sourceFilter,
      levelFilter,
      schoolFilter
    } = options;

    try {
      this.clearResults();
      const extractionStart = Date.now();

      // Extract spell data using SafeAccess
      const spellData = this.extractSpellData(characterData);
      if (!spellData) {
        return this.createFailureResult('No spell data found in character');
      }

      console.log('🔮 SpellDataExtractor: spellData structure received:', {
        hasSpellData: !!spellData,
        hasSpellsProperty: !!spellData?.spells,
        spellsKeys: spellData?.spells ? Object.keys(spellData.spells) : []
      });

      // Process all spell sources
      const rawSpells: NormalizedSpell[] = [];
      
      // Process spells from each source
      const sources: Array<{ spells: readonly unknown[], source: SpellSource }> = [
        { spells: spellData.spells?.race || [], source: 'race' },
        { spells: spellData.spells?.class || [], source: 'class' },
        { spells: spellData.spells?.feat || [], source: 'feat' },
        { spells: spellData.spells?.item || [], source: 'item' }
      ];
      
      console.log('🔮 SpellDataExtractor: Created sources array:', sources.map(s => ({ source: s.source, count: s.spells.length })));

      for (const { spells, source } of sources) {
        if (sourceFilter && !sourceFilter.includes(source)) {
          console.log(`🔮 SpellDataExtractor: Skipping source ${source} due to filter`);
          continue;
        }

        console.log(`🔮 SpellDataExtractor: Processing ${spells.length} spells from source: ${source}`);
        
        for (const spellEntry of spells) {
          try {
            const normalizedSpell = await this.normalizeSpell(spellEntry, source, {
              sanitizeContent,
              includeHomebrew,
              levelFilter,
              schoolFilter
            });

            if (normalizedSpell) {
              rawSpells.push(normalizedSpell);
            } else {
              console.log('🔮 SpellDataExtractor: normalizeSpell returned null for spell:', spellEntry?.definition?.name || 'unknown');
            }
          } catch (error) {
            console.log('🔮 SpellDataExtractor: Failed to normalize spell:', spellEntry?.definition?.name || 'unknown', error);
            this.addError('conversion_error', `Failed to normalize spell: ${error instanceof Error ? error.message : String(error)}`, undefined, undefined, error);
          }
        }
        
        console.log(`🔮 SpellDataExtractor: Completed processing ${source}, rawSpells now: ${rawSpells.length}`);
      }

      // Handle duplicates
      const uniqueSpells = includeDuplicates ? rawSpells : this.removeDuplicates(rawSpells);

      // Create spell collection
      const collection = this.buildSpellCollection(uniqueSpells);

      // Calculate processing metrics
      const processingTimeMs = Date.now() - extractionStart;
      if (processingTimeMs > maxProcessingTime) {
        this.addWarning('data_normalization', `Processing time (${processingTimeMs}ms) exceeded limit (${maxProcessingTime}ms)`);
      }

      const metadata: ProcessingMetadata = {
        startTime: this.startTime,
        endTime: new Date(),
        processingTimeMs,
        inputSource: 'dndbeyond',
        outputFormats: [],
        totalSpellsProcessed: rawSpells.length,
        successfullyProcessed: uniqueSpells.length,
        failedToProcess: this.errors.length,
        duplicatesRemoved: rawSpells.length - uniqueSpells.length,
        memoryUsageMB: this.getMemoryUsage()
      };

      console.log('🔮 SpellDataExtractor: Final result:', {
        success: true,
        spellCount: uniqueSpells.length,
        rawSpellCount: rawSpells.length,
        warnings: this.warnings.length,
        errors: this.errors.length
      });

      return {
        success: true,
        spells: uniqueSpells,
        collection,
        warnings: [...this.warnings],
        errors: [...this.errors],
        metadata
      };

    } catch (error) {
      return this.createFailureResult(`Spell extraction failed: ${error instanceof Error ? error.message : String(error)}`, error);
    }
  }

  /**
   * Extract spell data structure from character data
   */
  private extractSpellData(characterData: unknown): DnDBeyondSpellData | null {
    console.log('🔮 SpellDataExtractor: extractSpellData called for character:', SafeAccess.get(characterData, 'id') || SafeAccess.get(characterData, 'data.id'));
    
    // Try both paths - direct spells property and nested data.spells
    const spells = SafeAccess.get<any>(characterData, 'spells') || SafeAccess.get<any>(characterData, 'data.spells');
    
    // Also check for classSpells array (alternative D&D Beyond format)
    const classSpells = SafeAccess.get<any[]>(characterData, 'classSpells') || SafeAccess.get<any[]>(characterData, 'data.classSpells');
    
    console.log('🔮 SpellDataExtractor: Found spell data structures:', {
      hasSpells: !!spells,
      hasClassSpells: !!classSpells,
      classSpellsLength: classSpells?.length || 0
    });
    
    if (!spells && !classSpells) {
      console.log('🔮 SpellDataExtractor: No spell data found');
      this.addWarning('missing_data', 'No spell data found in character (checked spells and classSpells)');
      return null;
    }

    // Extract class spells from either format
    let classSpellArray: readonly unknown[] = [];
    
    if (spells && typeof spells === 'object') {
      classSpellArray = SafeAccess.get<readonly unknown[]>(spells, 'class', []);
    }
    
    // If we found classSpells array, extract spells from it
    if (classSpells && Array.isArray(classSpells)) {
      console.log('🔮 SpellDataExtractor: Processing classSpells array format');
      const extractedClassSpells: unknown[] = [];
      for (const classSpellGroup of classSpells) {
        const spellsInGroup = SafeAccess.get<unknown[]>(classSpellGroup, 'spells', []);
        console.log('🔮 SpellDataExtractor: Found', spellsInGroup.length, 'spells in group');
        extractedClassSpells.push(...spellsInGroup);
      }
      
      // Use classSpells if we found any, otherwise fall back to spells.class
      if (extractedClassSpells.length > 0) {
        console.log('🔮 SpellDataExtractor: Using', extractedClassSpells.length, 'spells from classSpells format');
        classSpellArray = extractedClassSpells;
      }
    }

    const result = {
      spells: {
        race: spells ? SafeAccess.get<readonly unknown[]>(spells, 'race', []) : [],
        class: classSpellArray,
        feat: spells ? SafeAccess.get<readonly unknown[]>(spells, 'feat', []) : [],
        item: spells ? SafeAccess.get<readonly unknown[]>(spells, 'item', []) : []
      }
    };
    
    console.log('🔮 SpellDataExtractor: extractSpellData returning:', {
      raceCount: result.spells.race.length,
      classCount: result.spells.class.length,
      featCount: result.spells.feat.length,
      itemCount: result.spells.item.length
    });
    
    return result;
  }

  /**
   * Normalize a single spell entry from D&D Beyond format
   */
  private async normalizeSpell(
    spellEntry: unknown,
    source: SpellSource,
    options: {
      sanitizeContent: boolean;
      includeHomebrew: boolean;
      levelFilter?: ReadonlyArray<SpellLevel>;
      schoolFilter?: ReadonlyArray<MagicSchool>;
    }
  ): Promise<NormalizedSpell | null> {
    try {
      // Extract spell definition
      const definition = SafeAccess.get<any>(spellEntry, 'definition');
      if (!definition) {
        this.addWarning('missing_data', 'Spell entry missing definition', SafeAccess.get<string>(spellEntry, 'id'));
        return null;
      }

      // Basic spell info
      const id = SafeAccess.get<string>(definition, 'id', '').toString();
      const name = SafeAccess.get<string>(definition, 'name', '');
      const level = this.normalizeSpellLevel(SafeAccess.get<number>(definition, 'level', 0));
      const school = this.normalizeSchool(SafeAccess.get<string>(definition, 'school', ''));
      const isHomebrew = SafeAccess.get<boolean>(definition, 'isHomebrew', false);

      // Apply filters
      if (!options.includeHomebrew && isHomebrew) {
        return null;
      }
      if (options.levelFilter && !options.levelFilter.includes(level)) {
        return null;
      }
      if (options.schoolFilter && !options.schoolFilter.includes(school)) {
        return null;
      }

      // Validate required fields
      if (!name) {
        this.addError('validation_error', 'Spell missing name', name, id);
        return null;
      }

      // Extract spell components
      const castingTime = this.extractCastingTime(definition, options.sanitizeContent);
      const range = this.extractRange(definition, options.sanitizeContent);
      const duration = this.extractDuration(definition, options.sanitizeContent);
      const components = this.extractComponents(definition, options.sanitizeContent);

      // Extract descriptions
      const description = this.extractDescription(definition, options.sanitizeContent);
      const higherLevelDescription = this.extractHigherLevelDescription(definition, options.sanitizeContent);

      // Extract spell mechanics
      const concentration = SafeAccess.get<boolean>(definition, 'concentration', false);
      const ritual = SafeAccess.get<boolean>(definition, 'ritual', false);
      const damage = this.extractDamage(definition);
      const healing = this.extractHealing(definition);
      const savingThrow = this.extractSavingThrow(definition);
      const attackRoll = this.extractAttackRoll(definition);

      // Extract preparation and usage info
      const prepared = SafeAccess.get<boolean>(spellEntry, 'prepared', false) || 
                       SafeAccess.get<boolean>(spellEntry, 'alwaysPrepared', false);
      const alwaysPrepared = SafeAccess.get<boolean>(spellEntry, 'alwaysPrepared', false);
      const usesSpellSlot = SafeAccess.get<boolean>(spellEntry, 'usesSpellSlot', true);
      const canCastAsRitual = SafeAccess.get<boolean>(spellEntry, 'castOnlyAsRitual', false) || ritual;
      
      // Extract limited use info
      const limitedUse = this.extractLimitedUse(spellEntry);

      // Extract overrides
      const overrides = this.extractOverrides(spellEntry);

      // Extract source reference
      const sourceReference = this.extractSourceReference(definition);

      // Extract tags
      const tags = this.extractTags(definition, spellEntry);

      const normalizedSpell: NormalizedSpell = {
        id: id,
        name: name,
        level,
        school,
        source,
        castingTime,
        range,
        duration,
        components,
        description,
        higherLevelDescription,
        concentration,
        ritual,
        damage,
        healing,
        savingThrow,
        attackRoll,
        prepared,
        alwaysPrepared,
        usesSpellSlot,
        canCastAsRitual,
        limitedUse,
        overrides,
        tags,
        isHomebrew,
        sourceReference
      };

      return normalizedSpell;

    } catch (error) {
      this.addError('conversion_error', `Failed to normalize spell: ${error instanceof Error ? error.message : String(error)}`, undefined, undefined, error);
      return null;
    }
  }

  /**
   * Normalize spell level to valid range
   */
  private normalizeSpellLevel(level: number): SpellLevel {
    const normalizedLevel = Math.max(0, Math.min(9, Math.floor(level || 0)));
    return normalizedLevel as SpellLevel;
  }

  /**
   * Normalize school of magic
   */
  private normalizeSchool(school: string): MagicSchool {
    const normalizedSchool = (school || '').toLowerCase().trim();
    const schoolMap: Record<string, MagicSchool> = {
      'abjuration': 'Abjuration',
      'conjuration': 'Conjuration',
      'divination': 'Divination',
      'enchantment': 'Enchantment',
      'evocation': 'Evocation',
      'illusion': 'Illusion',
      'necromancy': 'Necromancy',
      'transmutation': 'Transmutation'
    };

    return schoolMap[normalizedSchool] || 'Evocation';
  }

  /**
   * Extract casting time information
   */
  private extractCastingTime(definition: any, sanitize: boolean): CastingTime {
    const activation = SafeAccess.get<any>(definition, 'activation', {});
    const activationType = SafeAccess.get<number>(activation, 'activationType', DNDBEYOND_ACTIVATION_TYPES.ACTION);
    const activationTime = SafeAccess.get<number>(activation, 'activationTime', 1);
    const castingTimeDescription = SafeAccess.get<string>(definition, 'castingTimeDescription', '');

    // Map D&D Beyond activation types
    const typeMap: Record<number, { type: CastingTime['type'], unit?: CastingTime['unit'] }> = {
      [DNDBEYOND_ACTIVATION_TYPES.ACTION]: { type: 'action' },
      [DNDBEYOND_ACTIVATION_TYPES.BONUS_ACTION]: { type: 'bonus_action' },
      [DNDBEYOND_ACTIVATION_TYPES.REACTION]: { type: 'reaction' },
      [DNDBEYOND_ACTIVATION_TYPES.MINUTE]: { type: 'minute', unit: 'minute' },
      [DNDBEYOND_ACTIVATION_TYPES.HOUR]: { type: 'hour', unit: 'hour' },
      [DNDBEYOND_ACTIVATION_TYPES.NO_ACTION]: { type: 'special' },
      [DNDBEYOND_ACTIVATION_TYPES.SPECIAL]: { type: 'special' }
    };

    const mappedType = typeMap[activationType] || { type: 'action' as const };
    
    const description = sanitize ? 
      StringSanitizer.sanitizeText(castingTimeDescription || this.buildCastingTimeDescription(mappedType.type, activationTime)) :
      castingTimeDescription || this.buildCastingTimeDescription(mappedType.type, activationTime);

    return {
      type: mappedType.type,
      value: activationTime,
      unit: mappedType.unit,
      description
    };
  }

  /**
   * Build casting time description
   */
  private buildCastingTimeDescription(type: CastingTime['type'], value: number): string {
    switch (type) {
      case 'action': return '1 action';
      case 'bonus_action': return '1 bonus action';
      case 'reaction': return '1 reaction';
      case 'minute': return `${value} minute${value !== 1 ? 's' : ''}`;
      case 'hour': return `${value} hour${value !== 1 ? 's' : ''}`;
      case 'special': return 'Special';
      default: return '1 action';
    }
  }

  /**
   * Extract range information
   */
  private extractRange(definition: any, sanitize: boolean): SpellRange {
    const range = SafeAccess.get<any>(definition, 'range', {});
    const origin = SafeAccess.get<string>(range, 'origin', 'Touch').toLowerCase();
    const rangeValue = SafeAccess.get<number>(range, 'rangeValue', 0);
    const aoeType = SafeAccess.get<string>(range, 'aoeType');
    const aoeValue = SafeAccess.get<number>(range, 'aoeValue');
    const rangeDescription = SafeAccess.get<string>(definition, 'rangeDescription', '');

    // Determine range type
    let type: SpellRange['type'] = 'touch';
    let value: number | undefined = undefined;
    let unit: SpellRange['unit'] = 'feet';

    if (origin === 'self') {
      type = 'self';
    } else if (origin === 'touch') {
      type = 'touch';
    } else if (origin === 'ranged') {
      type = 'ranged';
      value = rangeValue;
      unit = 'feet';
    } else if (origin === 'sight') {
      type = 'sight';
    } else if (rangeValue === 0) {
      type = 'self';
    } else {
      type = 'ranged';
      value = rangeValue;
    }

    // Handle area of effect
    let areaOfEffect: SpellRange['areaOfEffect'] = undefined;
    if (aoeType && aoeValue) {
      const normalizedAoeType = aoeType.toLowerCase();
      if (['sphere', 'cube', 'cylinder', 'cone', 'line', 'hemisphere', 'square'].includes(normalizedAoeType)) {
        areaOfEffect = {
          type: normalizedAoeType as any,
          size: aoeValue,
          unit: 'feet'
        };
      }
    }

    const description = sanitize ? 
      StringSanitizer.sanitizeText(rangeDescription || this.buildRangeDescription(type, value, areaOfEffect)) :
      rangeDescription || this.buildRangeDescription(type, value, areaOfEffect);

    return {
      type,
      value,
      unit,
      areaOfEffect,
      description
    };
  }

  /**
   * Build range description
   */
  private buildRangeDescription(type: SpellRange['type'], value?: number, aoe?: SpellRange['areaOfEffect']): string {
    let base = '';
    switch (type) {
      case 'self': base = 'Self'; break;
      case 'touch': base = 'Touch'; break;
      case 'ranged': base = value ? `${value} feet` : 'Ranged'; break;
      case 'sight': base = 'Sight'; break;
      case 'unlimited': base = 'Unlimited'; break;
      default: base = 'Special'; break;
    }

    if (aoe) {
      base += ` (${aoe.size}-foot ${aoe.type})`;
    }

    return base;
  }

  /**
   * Extract duration information
   */
  private extractDuration(definition: any, sanitize: boolean): SpellDuration {
    const duration = SafeAccess.get<any>(definition, 'duration', {});
    const durationType = SafeAccess.get<string>(duration, 'durationType', 'Instantaneous').toLowerCase();
    const durationInterval = SafeAccess.get<number>(duration, 'durationInterval', 0);
    const durationUnit = SafeAccess.get<string>(duration, 'durationUnit', '');
    const concentration = SafeAccess.get<boolean>(definition, 'concentration', false);
    const durationDescription = SafeAccess.get<string>(definition, 'durationDescription', '');

    // Map duration types
    let type: SpellDuration['type'] = 'instantaneous';
    let value: number | undefined = undefined;
    let unit: SpellDuration['unit'] = undefined;

    if (durationType === 'instantaneous') {
      type = 'instantaneous';
    } else if (durationType.includes('until') || durationType.includes('dispel')) {
      type = 'until_dispelled';
    } else if (durationType === 'permanent') {
      type = 'permanent';
    } else if (durationInterval > 0) {
      type = 'timed';
      value = durationInterval;
      // Map duration unit
      const unitLower = (durationUnit || '').toLowerCase();
      if (unitLower.includes('minute')) unit = 'minute';
      else if (unitLower.includes('hour')) unit = 'hour';
      else if (unitLower.includes('day')) unit = 'day';
      else unit = 'minute';
    } else {
      type = 'special';
    }

    const description = sanitize ? 
      StringSanitizer.sanitizeText(durationDescription || this.buildDurationDescription(type, value, unit, concentration)) :
      durationDescription || this.buildDurationDescription(type, value, unit, concentration);

    return {
      type,
      value,
      unit,
      concentration,
      description
    };
  }

  /**
   * Build duration description
   */
  private buildDurationDescription(type: SpellDuration['type'], value?: number, unit?: SpellDuration['unit'], concentration?: boolean): string {
    let base = '';
    
    switch (type) {
      case 'instantaneous': base = 'Instantaneous'; break;
      case 'until_dispelled': base = 'Until dispelled'; break;
      case 'permanent': base = 'Permanent'; break;
      case 'timed': 
        if (value && unit) {
          base = `${value} ${unit}${value !== 1 ? 's' : ''}`;
        } else {
          base = 'Timed';
        }
        break;
      default: base = 'Special'; break;
    }

    if (concentration) {
      base = `Concentration, up to ${base.toLowerCase()}`;
    }

    return base;
  }

  /**
   * Extract spell components
   */
  private extractComponents(definition: any, sanitize: boolean): SpellComponents {
    const components = SafeAccess.get<number[]>(definition, 'components', []);
    const componentsDescription = SafeAccess.get<string>(definition, 'componentsDescription', '');

    const verbal = components.includes(DNDBEYOND_COMPONENTS.VERBAL);
    const somatic = components.includes(DNDBEYOND_COMPONENTS.SOMATIC);
    const material = components.includes(DNDBEYOND_COMPONENTS.MATERIAL);

    // Extract material component details from description
    let materialDescription: string | undefined = undefined;
    let materialCost: number | undefined = undefined;
    let materialConsumed = false;

    if (material && componentsDescription) {
      materialDescription = componentsDescription;
      
      // Check for consumed materials
      if (componentsDescription.toLowerCase().includes('consumes') || 
          componentsDescription.toLowerCase().includes('which the spell consumes')) {
        materialConsumed = true;
      }

      // Extract cost if mentioned
      const costMatch = componentsDescription.match(/(\d+(?:,\d{3})*)\s*gp/i);
      if (costMatch) {
        materialCost = parseInt(costMatch[1].replace(/,/g, ''));
      }
    }

    // Build component description
    const componentParts: string[] = [];
    if (verbal) componentParts.push('V');
    if (somatic) componentParts.push('S');
    if (material) {
      componentParts.push('M');
      if (materialDescription) {
        componentParts[componentParts.length - 1] += ` (${materialDescription})`;
      }
    }

    const description = sanitize ? 
      StringSanitizer.sanitizeText(componentParts.join(', ')) :
      componentParts.join(', ');

    return {
      verbal,
      somatic,
      material,
      materialDescription: materialDescription ? (sanitize ? StringSanitizer.sanitizeText(materialDescription) : materialDescription) : undefined,
      materialCost,
      materialConsumed,
      description
    };
  }

  /**
   * Extract spell description
   */
  private extractDescription(definition: any, sanitize: boolean): string {
    const description = SafeAccess.get<string>(definition, 'description', '');
    
    if (sanitize) {
      return StringSanitizer.sanitizeHTML(description, {
        maxLength: 10000,
        allowNewlines: true
      });
    }
    
    return description;
  }

  /**
   * Extract higher level description
   */
  private extractHigherLevelDescription(definition: any, sanitize: boolean): string | undefined {
    // The main description already contains the "At Higher Levels" section properly formatted.
    // Extracting it separately with regex breaks HTML structure and creates orphaned tags.
    // Returning undefined to avoid duplicate/malformed content.
    return undefined;
  }

  /**
   * Extract damage information
   */
  private extractDamage(definition: any): SpellDamage | undefined {
    const damageEffect = SafeAccess.get<any>(definition, 'damageEffect');
    if (!damageEffect) return undefined;

    const damageRolls = SafeAccess.get<any[]>(damageEffect, 'damageRolls', []);
    if (damageRolls.length === 0) return undefined;

    const rolls = damageRolls.map(roll => {
      const diceCount = SafeAccess.get<number>(roll, 'diceCount', 1);
      const diceValue = SafeAccess.get<number>(roll, 'diceValue', 6);
      const fixedValue = SafeAccess.get<number>(roll, 'fixedValue', 0);
      const damageTypeId = SafeAccess.get<number>(roll, 'damageTypeId', 1);
      
      // Map damage type ID to string (simplified mapping)
      const damageTypeMap: Record<number, typeof DAMAGE_TYPES[number]> = {
        1: 'acid', 2: 'bludgeoning', 3: 'cold', 4: 'fire', 5: 'force',
        6: 'lightning', 7: 'necrotic', 8: 'piercing', 9: 'poison',
        10: 'psychic', 11: 'radiant', 12: 'slashing', 13: 'thunder'
      };

      const damageType = damageTypeMap[damageTypeId] || 'force';
      const diceExpression = diceCount > 0 ? `${diceCount}d${diceValue}${fixedValue !== 0 ? (fixedValue > 0 ? '+' + fixedValue : fixedValue) : ''}` : fixedValue.toString();

      return {
        diceCount,
        diceSize: diceValue,
        bonus: fixedValue,
        damageType,
        diceExpression
      };
    });

    return {
      rolls: rolls as any,
      scalingType: 'spell_level' // Default scaling
    };
  }

  /**
   * Extract healing information
   */
  private extractHealing(definition: any): SpellHealing | undefined {
    const healing = SafeAccess.get<any>(definition, 'healing');
    if (!healing) return undefined;

    const healingRolls = SafeAccess.get<any[]>(healing, 'healingRolls', []);
    if (healingRolls.length === 0) return undefined;

    const rolls = healingRolls.map(roll => {
      const diceCount = SafeAccess.get<number>(roll, 'diceCount', 1);
      const diceValue = SafeAccess.get<number>(roll, 'diceValue', 6);
      const fixedValue = SafeAccess.get<number>(roll, 'fixedValue', 0);
      const diceExpression = diceCount > 0 ? `${diceCount}d${diceValue}${fixedValue !== 0 ? (fixedValue > 0 ? '+' + fixedValue : fixedValue) : ''}` : fixedValue.toString();

      return {
        diceCount,
        diceSize: diceValue,
        bonus: fixedValue,
        diceExpression,
        healingType: 'healing' as const
      };
    });

    return {
      rolls: rolls as any,
      scalingType: 'spell_level'
    };
  }

  /**
   * Extract saving throw information
   */
  private extractSavingThrow(definition: any): SavingThrow | undefined {
    const saveDcAbilityId = SafeAccess.get<number>(definition, 'saveDcAbilityId');
    if (!saveDcAbilityId) return undefined;

    // Map ability ID to ability name
    const abilityMap: Record<number, typeof ABILITY_NAMES[number]> = {
      1: 'strength', 2: 'dexterity', 3: 'constitution',
      4: 'intelligence', 5: 'wisdom', 6: 'charisma'
    };

    const ability = abilityMap[saveDcAbilityId];
    if (!ability) return undefined;

    return {
      ability,
      onSuccess: 'half_damage', // Default assumption
      onFailure: 'full_damage'
    };
  }

  /**
   * Extract attack roll information
   */
  private extractAttackRoll(definition: any): AttackRoll | undefined {
    const requiresAttackRoll = SafeAccess.get<boolean>(definition, 'requiresAttackRoll', false);
    const attackType = SafeAccess.get<number>(definition, 'attackType');
    
    if (!requiresAttackRoll || !attackType) return undefined;

    // Map attack type
    const type = attackType === 1 ? 'melee_spell' : 'ranged_spell';

    return {
      type,
      targets: 1 // Default to single target
    };
  }

  /**
   * Extract limited use information
   */
  private extractLimitedUse(spellEntry: any): LimitedUse | undefined {
    const limitedUse = SafeAccess.get<any>(spellEntry, 'limitedUse');
    if (!limitedUse) return undefined;

    const maxUses = SafeAccess.get<number>(limitedUse, 'maxUses', 1);
    const numberUsed = SafeAccess.get<number>(limitedUse, 'numberUsed', 0);
    const resetType = SafeAccess.get<number>(limitedUse, 'resetType', 1);

    // Map reset type
    const resetTypeMap: Record<number, LimitedUse['resetType']> = {
      1: 'short_rest',
      2: 'long_rest', 
      3: 'daily',
      4: 'weekly'
    };

    return {
      maxUses,
      usedUses: numberUsed,
      resetType: resetTypeMap[resetType] || 'long_rest'
    };
  }

  /**
   * Extract spell overrides
   */
  private extractOverrides(spellEntry: any): SpellOverrides | undefined {
    const overrideSaveDc = SafeAccess.get<number>(spellEntry, 'overrideSaveDc');
    const spellcastingAbilityId = SafeAccess.get<number>(spellEntry, 'spellCastingAbilityId');
    
    if (!overrideSaveDc && !spellcastingAbilityId) return undefined;

    const overrides: Partial<SpellOverrides> = {};

    if (overrideSaveDc) {
      overrides.saveDc = overrideSaveDc;
    }

    if (spellcastingAbilityId) {
      const abilityMap: Record<number, typeof ABILITY_NAMES[number]> = {
        1: 'strength', 2: 'dexterity', 3: 'constitution',
        4: 'intelligence', 5: 'wisdom', 6: 'charisma'
      };
      overrides.spellcastingAbility = abilityMap[spellcastingAbilityId];
    }

    return Object.keys(overrides).length > 0 ? overrides as SpellOverrides : undefined;
  }

  /**
   * Extract source reference information
   */
  private extractSourceReference(definition: any): SourceReference | undefined {
    const sourceId = SafeAccess.get<number>(definition, 'sourceId');
    const sourcePageNumber = SafeAccess.get<number>(definition, 'sourcePageNumber');
    
    if (!sourceId) return undefined;

    // Map source IDs to book names (simplified)
    const sourceMap: Record<number, string> = {
      1: "Player's Handbook",
      2: "Dungeon Master's Guide", 
      3: "Monster Manual",
      145: "Player's Handbook (2024)"
      // Add more as needed
    };

    const book = sourceMap[sourceId] || 'Unknown';

    return {
      book,
      page: sourcePageNumber,
      isOGL: false, // Would need more data to determine
      isSRD: false  // Would need more data to determine
    };
  }

  /**
   * Extract spell tags
   */
  private extractTags(definition: any, spellEntry: any): ReadonlyArray<string> {
    const tags: string[] = [];

    // Add level-based tags
    const level = SafeAccess.get<number>(definition, 'level', 0);
    if (level === 0) tags.push('cantrip');

    // Add school tag
    const school = SafeAccess.get<string>(definition, 'school', '');
    if (school) tags.push(school.toLowerCase());

    // Add ritual tag
    if (SafeAccess.get<boolean>(definition, 'ritual', false)) {
      tags.push('ritual');
    }

    // Add concentration tag
    if (SafeAccess.get<boolean>(definition, 'concentration', false)) {
      tags.push('concentration');
    }

    // Add preparation tags
    if (SafeAccess.get<boolean>(spellEntry, 'alwaysPrepared', false)) {
      tags.push('always-prepared');
    }

    // Add homebrew tag
    if (SafeAccess.get<boolean>(definition, 'isHomebrew', false)) {
      tags.push('homebrew');
    }

    return tags;
  }

  /**
   * Remove duplicate spells from the array
   */
  private removeDuplicates(spells: NormalizedSpell[]): NormalizedSpell[] {
    const seen = new Set<string>();
    const unique: NormalizedSpell[] = [];
    let duplicatesCount = 0;

    for (const spell of spells) {
      // Create key based on name and level (case-insensitive)
      const key = `${spell.name.toLowerCase()}-${spell.level}`;
      
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(spell);
      } else {
        duplicatesCount++;
        this.addWarning('duplicate_spell', `Duplicate spell found: ${spell.name}`, spell.name, spell.id);
      }
    }

    return unique;
  }

  /**
   * Build spell collection from normalized spells
   */
  private buildSpellCollection(spells: ReadonlyArray<NormalizedSpell>): SpellCollection {
    const spellsByLevel: SpellsByLevel = {
      cantrips: spells.filter(s => s.level === 0),
      level1: spells.filter(s => s.level === 1),
      level2: spells.filter(s => s.level === 2),
      level3: spells.filter(s => s.level === 3),
      level4: spells.filter(s => s.level === 4),
      level5: spells.filter(s => s.level === 5),
      level6: spells.filter(s => s.level === 6),
      level7: spells.filter(s => s.level === 7),
      level8: spells.filter(s => s.level === 8),
      level9: spells.filter(s => s.level === 9)
    };

    const spellsBySchool: SpellsBySchool = {
      abjuration: spells.filter(s => s.school === 'Abjuration'),
      conjuration: spells.filter(s => s.school === 'Conjuration'),
      divination: spells.filter(s => s.school === 'Divination'),
      enchantment: spells.filter(s => s.school === 'Enchantment'),
      evocation: spells.filter(s => s.school === 'Evocation'),
      illusion: spells.filter(s => s.school === 'Illusion'),
      necromancy: spells.filter(s => s.school === 'Necromancy'),
      transmutation: spells.filter(s => s.school === 'Transmutation')
    };

    const spellsBySource: SpellsBySource = {
      race: spells.filter(s => s.source === 'race'),
      class: spells.filter(s => s.source === 'class'),
      feat: spells.filter(s => s.source === 'feat'),
      item: spells.filter(s => s.source === 'item'),
      background: spells.filter(s => s.source === 'background'),
      multiclass: spells.filter(s => s.source === 'multiclass'),
      other: spells.filter(s => s.source === 'other')
    };

    const metadata: SpellCollectionMetadata = {
      totalSpells: spells.length,
      preparedSpells: spells.filter(s => s.prepared).length,
      knownSpells: spells.length, // All extracted spells are "known"
      cantripsKnown: spellsByLevel.cantrips.length,
      ritualSpells: spells.filter(s => s.ritual).length,
      concentrationSpells: spells.filter(s => s.concentration).length,
      uniqueSpells: spells.length,
      duplicateSpells: 0, // Already removed
      homebrew: spells.filter(s => s.isHomebrew).length,
      lastUpdated: new Date()
    };

    return {
      spells,
      spellsByLevel,
      spellsBySchool,
      spellsBySource,
      metadata
    };
  }

  /**
   * Add warning to processing results
   */
  private addWarning(type: ProcessingWarning['type'], message: string, spellName?: string, spellId?: string, context?: Record<string, unknown>): void {
    this.warnings.push({
      type,
      message,
      spellName,
      spellId,
      context
    });
  }

  /**
   * Add error to processing results
   */
  private addError(type: ProcessingError['type'], message: string, spellName?: string, spellId?: string, error?: unknown, context?: Record<string, unknown>): void {
    this.errors.push({
      type,
      message,
      spellName,
      spellId,
      stack: error instanceof Error ? error.stack : undefined,
      context
    });
  }

  /**
   * Clear previous processing results
   */
  private clearResults(): void {
    this.warnings.length = 0;
    this.errors.length = 0;
  }

  /**
   * Create failure result
   */
  private createFailureResult(message: string, error?: unknown): SpellProcessingResult {
    this.addError('system_error', message, undefined, undefined, error);
    
    const metadata: ProcessingMetadata = {
      startTime: this.startTime,
      endTime: new Date(),
      processingTimeMs: Date.now() - this.startTime.getTime(),
      inputSource: 'dndbeyond',
      outputFormats: [],
      totalSpellsProcessed: 0,
      successfullyProcessed: 0,
      failedToProcess: 1,
      duplicatesRemoved: 0
    };

    return {
      success: false,
      spells: [],
      collection: this.buildSpellCollection([]),
      warnings: [...this.warnings],
      errors: [...this.errors],
      metadata
    };
  }

  /**
   * Get current memory usage (if available)
   */
  private getMemoryUsage(): number | undefined {
    try {
      if (typeof process !== 'undefined' && process.memoryUsage) {
        return Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
      }
    } catch {
      // Ignore errors in browser environment
    }
    return undefined;
  }
}