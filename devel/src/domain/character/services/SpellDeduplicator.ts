/**
 * SpellDeduplicator Service
 * 
 * Intelligently handles duplicate spells, merging information and resolving conflicts
 * based on D&D 5e rules and character configuration.
 */

import {
  NormalizedSpell,
  SpellSource,
  SpellLevel,
  ProcessingWarning,
  ProcessingError
} from '../models/Spells';

export interface DeduplicationOptions {
  readonly strategy?: DeduplicationStrategy;
  readonly preserveMulticlassSpells?: boolean;
  readonly mergePreparedStatus?: boolean;
  readonly preferOfficialSources?: boolean;
  readonly priorityOrder?: ReadonlyArray<SpellSource>;
  readonly keepDetailedWarnings?: boolean;
}

export type DeduplicationStrategy =
  | 'keep_first'      // Keep the first occurrence
  | 'keep_last'       // Keep the last occurrence
  | 'merge'           // Merge spell data intelligently
  | 'prioritize'      // Use priority order
  | 'manual';         // Flag for manual resolution

export interface DeduplicationResult {
  readonly uniqueSpells: ReadonlyArray<NormalizedSpell>;
  readonly duplicatesRemoved: ReadonlyArray<SpellDuplicate>;
  readonly warnings: ReadonlyArray<ProcessingWarning>;
  readonly errors: ReadonlyArray<ProcessingError>;
  readonly metadata: DeduplicationMetadata;
}

export interface SpellDuplicate {
  readonly key: string;
  readonly spellName: string;
  readonly level: SpellLevel;
  readonly sources: ReadonlyArray<SpellSource>;
  readonly instances: ReadonlyArray<NormalizedSpell>;
  readonly keptInstance: NormalizedSpell;
  readonly resolution: DuplicateResolution;
}

export interface DuplicateResolution {
  readonly strategy: DeduplicationStrategy;
  readonly reason: string;
  readonly conflicts: ReadonlyArray<SpellConflict>;
  readonly mergedFields: ReadonlyArray<string>;
}

export interface SpellConflict {
  readonly field: string;
  readonly values: ReadonlyArray<{ value: unknown; source: SpellSource }>;
  readonly resolution: string;
}

export interface DeduplicationMetadata {
  readonly totalSpells: number;
  readonly uniqueSpells: number;
  readonly duplicateGroups: number;
  readonly totalDuplicates: number;
  readonly processingTimeMs: number;
  readonly strategy: DeduplicationStrategy;
}

export class SpellDeduplicator {
  private readonly warnings: ProcessingWarning[] = [];
  private readonly errors: ProcessingError[] = [];

  /**
   * Deduplicate an array of spells
   * 
   * @param spells - Array of spells to deduplicate
   * @param options - Deduplication options
   * @returns Deduplication result with unique spells
   */
  public deduplicateSpells(
    spells: ReadonlyArray<NormalizedSpell>,
    options: DeduplicationOptions = {}
  ): DeduplicationResult {
    const startTime = Date.now();
    this.clearResults();

    const {
      strategy = 'merge',
      preserveMulticlassSpells = true,
      mergePreparedStatus = true,
      preferOfficialSources = true,
      priorityOrder = ['class', 'race', 'feat', 'item', 'background', 'multiclass', 'other'],
      keepDetailedWarnings = true
    } = options;

    try {
      // Group spells by name and level
      const spellGroups = this.groupSpells(spells);

      // Process each group
      const uniqueSpells: NormalizedSpell[] = [];
      const duplicatesRemoved: SpellDuplicate[] = [];

      for (const [key, instances] of spellGroups) {
        if (instances.length === 1) {
          // No duplicates - keep as is
          uniqueSpells.push(instances[0]);
        } else {
          // Handle duplicates
          const result = this.resolveDuplicates(
            instances,
            key,
            {
              strategy,
              preserveMulticlassSpells,
              mergePreparedStatus,
              preferOfficialSources,
              priorityOrder,
              keepDetailedWarnings
            }
          );

          uniqueSpells.push(result.keptInstance);
          duplicatesRemoved.push(result);

          if (keepDetailedWarnings) {
            this.addWarning(
              'duplicate_spell',
              `Resolved duplicate spell: ${result.spellName} (Level ${result.level})`,
              result.spellName,
              result.keptInstance.id,
              {
                sources: result.sources,
                strategy: result.resolution.strategy,
                conflicts: result.resolution.conflicts.length
              }
            );
          }
        }
      }

      const processingTime = Date.now() - startTime;

      const metadata: DeduplicationMetadata = {
        totalSpells: spells.length,
        uniqueSpells: uniqueSpells.length,
        duplicateGroups: duplicatesRemoved.length,
        totalDuplicates: spells.length - uniqueSpells.length,
        processingTimeMs: processingTime,
        strategy
      };

      return {
        uniqueSpells,
        duplicatesRemoved,
        warnings: [...this.warnings],
        errors: [...this.errors],
        metadata
      };

    } catch (error) {
      this.addError(
        'system_error',
        `Deduplication failed: ${error instanceof Error ? error.message : String(error)}`,
        undefined,
        undefined,
        error
      );

      return this.createFailureResult(spells, strategy, Date.now() - startTime);
    }
  }

  /**
   * Find potential duplicates without resolving them
   * 
   * @param spells - Array of spells to analyze
   * @returns Array of duplicate groups
   */
  public findDuplicates(spells: ReadonlyArray<NormalizedSpell>): ReadonlyArray<{
    key: string;
    spellName: string;
    level: SpellLevel;
    instances: ReadonlyArray<NormalizedSpell>;
  }> {
    const spellGroups = this.groupSpells(spells);
    const duplicates: Array<{
      key: string;
      spellName: string;
      level: SpellLevel;
      instances: ReadonlyArray<NormalizedSpell>;
    }> = [];

    for (const [key, instances] of spellGroups) {
      if (instances.length > 1) {
        duplicates.push({
          key,
          spellName: instances[0].name,
          level: instances[0].level,
          instances
        });
      }
    }

    return duplicates;
  }

  // ==================== Private Methods ====================

  /**
   * Group spells by name and level
   */
  private groupSpells(spells: ReadonlyArray<NormalizedSpell>): Map<string, NormalizedSpell[]> {
    const groups = new Map<string, NormalizedSpell[]>();

    for (const spell of spells) {
      const key = this.createSpellKey(spell);
      const group = groups.get(key) || [];
      group.push(spell);
      groups.set(key, group);
    }

    return groups;
  }

  /**
   * Create a unique key for grouping spells
   */
  private createSpellKey(spell: NormalizedSpell): string {
    // Normalize name by removing common variations
    const normalizedName = spell.name
      .toLowerCase()
      .trim()
      .replace(/['']/g, "'")       // Normalize apostrophes
      .replace(/[""]/g, '"')       // Normalize quotes
      .replace(/\s+/g, ' ')        // Normalize whitespace
      .replace(/[^\w\s'"-]/g, ''); // Remove special characters except common ones

    return `${normalizedName}|${spell.level}`;
  }

  /**
   * Resolve duplicates for a group of spells
   */
  private resolveDuplicates(
    instances: ReadonlyArray<NormalizedSpell>,
    key: string,
    options: Required<Omit<DeduplicationOptions, 'keepDetailedWarnings'>> & { keepDetailedWarnings: boolean }
  ): SpellDuplicate {
    const spellName = instances[0].name;
    const level = instances[0].level;
    const sources = [...new Set(instances.map(s => s.source))];

    // Determine resolution strategy
    let resolvedSpell: NormalizedSpell;
    let resolution: DuplicateResolution;

    switch (options.strategy) {
      case 'keep_first':
        resolvedSpell = instances[0];
        resolution = {
          strategy: 'keep_first',
          reason: 'Kept first occurrence',
          conflicts: [],
          mergedFields: []
        };
        break;

      case 'keep_last':
        resolvedSpell = instances[instances.length - 1];
        resolution = {
          strategy: 'keep_last',
          reason: 'Kept last occurrence',
          conflicts: [],
          mergedFields: []
        };
        break;

      case 'prioritize':
        const result = this.prioritizeBySource(instances, options.priorityOrder);
        resolvedSpell = result.spell;
        resolution = result.resolution;
        break;

      case 'merge':
        const mergeResult = this.mergeSpells(instances, {
          preserveMulticlassSpells: options.preserveMulticlassSpells,
          mergePreparedStatus: options.mergePreparedStatus,
          preferOfficialSources: options.preferOfficialSources,
          priorityOrder: options.priorityOrder
        });
        resolvedSpell = mergeResult.spell;
        resolution = mergeResult.resolution;
        break;

      case 'manual':
        // Flag for manual resolution - keep first for now
        resolvedSpell = instances[0];
        resolution = {
          strategy: 'manual',
          reason: 'Flagged for manual resolution',
          conflicts: this.identifyConflicts(instances),
          mergedFields: []
        };
        this.addWarning(
          'duplicate_spell',
          `Manual resolution required for: ${spellName}`,
          spellName,
          undefined,
          { instances: instances.length, sources }
        );
        break;

      default:
        resolvedSpell = instances[0];
        resolution = {
          strategy: 'keep_first',
          reason: 'Unknown strategy, defaulted to keep_first',
          conflicts: [],
          mergedFields: []
        };
    }

    return {
      key,
      spellName,
      level,
      sources,
      instances,
      keptInstance: resolvedSpell,
      resolution
    };
  }

  /**
   * Prioritize spells by source order
   */
  private prioritizeBySource(
    instances: ReadonlyArray<NormalizedSpell>,
    priorityOrder: ReadonlyArray<SpellSource>
  ): { spell: NormalizedSpell; resolution: DuplicateResolution } {
    // Find the highest priority spell
    let bestSpell = instances[0];
    let bestPriority = priorityOrder.indexOf(bestSpell.source);
    if (bestPriority === -1) bestPriority = 999; // Unknown sources go last

    for (const spell of instances) {
      const priority = priorityOrder.indexOf(spell.source);
      const actualPriority = priority === -1 ? 999 : priority;
      
      if (actualPriority < bestPriority) {
        bestSpell = spell;
        bestPriority = actualPriority;
      }
    }

    const conflicts = this.identifyConflicts(instances);

    return {
      spell: bestSpell,
      resolution: {
        strategy: 'prioritize',
        reason: `Prioritized ${bestSpell.source} source`,
        conflicts,
        mergedFields: []
      }
    };
  }

  /**
   * Merge multiple spell instances intelligently
   */
  private mergeSpells(
    instances: ReadonlyArray<NormalizedSpell>,
    options: {
      preserveMulticlassSpells: boolean;
      mergePreparedStatus: boolean;
      preferOfficialSources: boolean;
      priorityOrder: ReadonlyArray<SpellSource>;
    }
  ): { spell: NormalizedSpell; resolution: DuplicateResolution } {
    // Start with the highest priority instance as base
    const prioritizeResult = this.prioritizeBySource(instances, options.priorityOrder);
    const baseSpell = prioritizeResult.spell;
    
    const conflicts: SpellConflict[] = [];
    const mergedFields: string[] = [];
    const mergedSpell: NormalizedSpell = { ...baseSpell };

    // Merge preparation status
    if (options.mergePreparedStatus) {
      const anyPrepared = instances.some(s => s.prepared);
      const anyAlwaysPrepared = instances.some(s => s.alwaysPrepared);
      
      if (anyPrepared !== baseSpell.prepared) {
        mergedSpell.prepared = anyPrepared;
        mergedFields.push('prepared');
      }
      
      if (anyAlwaysPrepared !== baseSpell.alwaysPrepared) {
        mergedSpell.alwaysPrepared = anyAlwaysPrepared;
        mergedFields.push('alwaysPrepared');
      }
    }

    // Merge ritual casting capability
    const anyRitual = instances.some(s => s.ritual);
    const anyCanCastAsRitual = instances.some(s => s.canCastAsRitual);
    
    if (anyRitual !== baseSpell.ritual) {
      mergedSpell.ritual = anyRitual;
      mergedFields.push('ritual');
    }
    
    if (anyCanCastAsRitual !== baseSpell.canCastAsRitual) {
      mergedSpell.canCastAsRitual = anyCanCastAsRitual;
      mergedFields.push('canCastAsRitual');
    }

    // Merge tags (union of all tags)
    const allTags = new Set<string>();
    for (const instance of instances) {
      for (const tag of instance.tags) {
        allTags.add(tag);
      }
    }
    const uniqueTags = Array.from(allTags).sort();
    if (JSON.stringify(uniqueTags) !== JSON.stringify(baseSpell.tags)) {
      mergedSpell.tags = uniqueTags;
      mergedFields.push('tags');
    }

    // Merge source information - keep all sources in a combined source string if different
    const uniqueSources = [...new Set(instances.map(s => s.source))];
    if (uniqueSources.length > 1) {
      // Create a composite source or use the primary source
      // For now, keep the primary source but note the conflict
      conflicts.push({
        field: 'source',
        values: uniqueSources.map(source => ({ value: source, source })),
        resolution: `Kept primary source: ${mergedSpell.source}`
      });
    }

    // Handle homebrew status - prefer official sources
    if (options.preferOfficialSources) {
      const hasOfficial = instances.some(s => !s.isHomebrew);
      if (hasOfficial && mergedSpell.isHomebrew) {
        mergedSpell.isHomebrew = false;
        mergedFields.push('isHomebrew');
      }
    }

    // Handle limited use - use the most restrictive
    const limitedUseInstances = instances.filter(s => s.limitedUse);
    if (limitedUseInstances.length > 0 && !baseSpell.limitedUse) {
      // Use the most restrictive limited use
      const mostRestrictive = limitedUseInstances.reduce((most, current) => {
        if (!most.limitedUse || !current.limitedUse) return most;
        return current.limitedUse.maxUses < most.limitedUse.maxUses ? current : most;
      });
      mergedSpell.limitedUse = mostRestrictive.limitedUse;
      mergedFields.push('limitedUse');
    }

    // Check for other conflicts
    const otherConflicts = this.identifyConflicts(instances);
    conflicts.push(...otherConflicts.filter(c => c.field !== 'source'));

    return {
      spell: mergedSpell,
      resolution: {
        strategy: 'merge',
        reason: `Merged ${instances.length} instances with ${mergedFields.length} fields modified`,
        conflicts,
        mergedFields
      }
    };
  }

  /**
   * Identify conflicts between spell instances
   */
  private identifyConflicts(instances: ReadonlyArray<NormalizedSpell>): SpellConflict[] {
    if (instances.length < 2) return [];

    const conflicts: SpellConflict[] = [];
    const baseSpell = instances[0];

    // Fields to check for conflicts
    const fieldsToCheck: Array<{ field: keyof NormalizedSpell; critical: boolean }> = [
      { field: 'description', critical: true },
      { field: 'school', critical: true },
      { field: 'concentration', critical: true },
      { field: 'ritual', critical: false },
      { field: 'usesSpellSlot', critical: true },
      { field: 'source', critical: false },
      { field: 'isHomebrew', critical: false }
    ];

    for (const { field, critical } of fieldsToCheck) {
      const values = new Set(instances.map(s => s[field]));
      if (values.size > 1) {
        const conflictValues = Array.from(values).map(value => ({
          value,
          source: instances.find(s => s[field] === value)?.source || 'unknown' as SpellSource
        }));

        conflicts.push({
          field,
          values: conflictValues,
          resolution: critical ? 'Manual review required' : 'Using first occurrence'
        });

        if (critical) {
          this.addWarning(
            'duplicate_spell',
            `Critical conflict in ${field} for spell: ${baseSpell.name}`,
            baseSpell.name,
            baseSpell.id
          );
        }
      }
    }

    return conflicts;
  }

  /**
   * Add warning to processing results
   */
  private addWarning(
    type: ProcessingWarning['type'],
    message: string,
    spellName?: string,
    spellId?: string,
    context?: Record<string, unknown>
  ): void {
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
  private addError(
    type: ProcessingError['type'],
    message: string,
    spellName?: string,
    spellId?: string,
    error?: unknown
  ): void {
    this.errors.push({
      type,
      message,
      spellName,
      spellId,
      stack: error instanceof Error ? error.stack : undefined
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
  private createFailureResult(
    spells: ReadonlyArray<NormalizedSpell>,
    strategy: DeduplicationStrategy,
    processingTimeMs: number
  ): DeduplicationResult {
    const metadata: DeduplicationMetadata = {
      totalSpells: spells.length,
      uniqueSpells: spells.length,
      duplicateGroups: 0,
      totalDuplicates: 0,
      processingTimeMs,
      strategy
    };

    return {
      uniqueSpells: spells,
      duplicatesRemoved: [],
      warnings: [...this.warnings],
      errors: [...this.errors],
      metadata
    };
  }
}