/**
 * AbilityScoreProcessor Service
 * 
 * Modern replacement for legacy processAbilityScoreBonuses() and getTotalAbilityScore() 
 * functions from utilities.js. Handles ability score bonuses from all sources including
 * racial traits, feats, magic items, and class features.
 * 
 * Migrated from legacy utilities.js lines 780-860
 */

import { AbilityScoreUtils, ABILITY_NAMES, type AbilityName } from '@/domain/character/constants/AbilityConstants';

export interface AbilityModifier {
  type: string;
  subType: string;
  fixedValue?: number;
  source?: string;
}

export interface AbilityStat {
  id: number;
  name?: string | null;
  value: number;
}

export interface ProcessedAbilityScores {
  [key: string]: {
    base: number;
    bonus: number;
    override: number | null;
    total: number;
    modifier: number;
  };
}

export interface BonusProcessingResult {
  processedBonuses: AbilityStat[];
  totalScores: ProcessedAbilityScores;
  debugInfo: {
    appliedBonuses: Array<{
      source: string;
      ability: string;
      bonus: number;
    }>;
    finalBonusSummary: Array<{
      ability: string;
      bonus: number;
    }>;
  };
}

export class AbilityScoreProcessor {
  /**
   * Enable or disable detailed debugging output
   */
  private static debugEnabled: boolean = false;
  
  /**
   * Set debug mode for detailed console output
   */
  static setDebugMode(enabled: boolean): void {
    this.debugEnabled = enabled;
  }

  /**
   * Debug all ability score modifier sources for detailed analysis
   */
  static debugAbilityModifierSources(character: any): void {
    if (!this.debugEnabled) return;

    console.group('🔍 Detailed Ability Score Modifier Analysis');
    
    // Analyze base stats
    console.log('📊 Base Ability Scores:');
    if (character.stats && Array.isArray(character.stats)) {
      character.stats.forEach((stat: any, index: number) => {
        const abilityName = ABILITY_NAMES[index];
        console.log(`  ${abilityName}: ${stat.value || 10} (base)`);
      });
    } else {
      console.log('  No base stats found - using defaults (10)');
    }

    // Analyze existing bonus stats
    console.log('\n💪 Existing Bonus Stats (from D&D Beyond):');
    if (character.bonusStats && Array.isArray(character.bonusStats)) {
      let hasExistingBonuses = false;
      character.bonusStats.forEach((bonus: any, index: number) => {
        const abilityName = ABILITY_NAMES[index];
        if (bonus.value && bonus.value > 0) {
          console.log(`  ${abilityName}: +${bonus.value} (pre-calculated by D&D Beyond)`);
          hasExistingBonuses = true;
        }
      });
      if (!hasExistingBonuses) {
        console.log('  No existing bonus stats from D&D Beyond');
      }
    } else {
      console.log('  No existing bonus stats from D&D Beyond');
    }

    // Analyze override stats
    console.log('\n🔄 Override Stats:');
    if (character.overrideStats && Array.isArray(character.overrideStats)) {
      let hasOverrides = false;
      character.overrideStats.forEach((override: any, index: number) => {
        const abilityName = ABILITY_NAMES[index];
        if (override.value !== null && override.value !== undefined) {
          console.log(`  ${abilityName}: ${override.value} (OVERRIDE - replaces base + bonuses)`);
          hasOverrides = true;
        }
      });
      if (!hasOverrides) {
        console.log('  No overrides found');
      }
    } else {
      console.log('  No override stats found');
    }

    // Analyze all modifier sources in detail
    const modifierSources = ['race', 'class', 'background', 'item', 'feat'];
    
    modifierSources.forEach(source => {
      console.log(`\n🎯 ${source.toUpperCase()} Modifiers:`);
      
      if (!character.modifiers || !character.modifiers[source]) {
        console.log(`  No ${source} modifiers found`);
        return;
      }

      const sourceModifiers = character.modifiers[source];
      let abilityModifiers = 0;
      let otherModifiers = 0;

      sourceModifiers.forEach((modifier: any, index: number) => {
        if (modifier.type === 'bonus' && modifier.subType && modifier.subType.endsWith('-score')) {
          const abilityName = modifier.subType.replace('-score', '');
          const value = modifier.fixedValue || 0;
          console.log(`    ✅ ${abilityName}-score: +${value} ${modifier.friendlyTypeName ? `(${modifier.friendlyTypeName})` : ''}`);
          
          // Show additional context if available
          if (modifier.componentId || modifier.componentTypeId) {
            console.log(`       🔗 Component: ${modifier.componentId || 'N/A'} (Type: ${modifier.componentTypeId || 'N/A'})`);
          }
          if (modifier.entityId || modifier.entityTypeId) {
            console.log(`       🎲 Entity: ${modifier.entityId || 'N/A'} (Type: ${modifier.entityTypeId || 'N/A'})`);
          }
          
          abilityModifiers++;
        } else {
          // Show non-ability modifiers for context
          console.log(`    ⚙️  ${modifier.subType || 'unknown'}: ${modifier.fixedValue || 0} (${modifier.type || 'unknown'})`);
          otherModifiers++;
        }
      });

      console.log(`  📈 Summary: ${abilityModifiers} ability modifiers, ${otherModifiers} other modifiers`);
    });

    // Calculate and show final results
    console.log('\n🎯 Final Ability Score Breakdown:');
    console.log('  [Comparing D&D Beyond pre-calculated vs manually calculated bonuses]');
    ABILITY_NAMES.forEach((abilityName, index) => {
      const abilityId = index + 1;
      
      // Get components
      const baseStat = character.stats?.[index]?.value || 10;
      const existingBonus = character.bonusStats?.[index]?.value || 0;
      const override = character.overrideStats?.[index]?.value;
      
      // Calculate new bonuses that would be applied
      let calculatedBonuses = 0;
      modifierSources.forEach(source => {
        if (character.modifiers?.[source]) {
          character.modifiers[source].forEach((modifier: any) => {
            if (modifier.type === 'bonus' && modifier.subType === `${abilityName}-score`) {
              const bonus = parseInt(String(modifier.fixedValue)) || 0;
              if (bonus > 0) {
                calculatedBonuses += bonus;
              }
            }
          });
        }
      });

      const finalScoreWithExisting = override !== null && override !== undefined 
        ? override 
        : baseStat + existingBonus;
        
      const finalScoreWithCalculated = override !== null && override !== undefined 
        ? override 
        : baseStat + calculatedBonuses;
      
      const modifierExisting = AbilityScoreUtils.calculateModifier(finalScoreWithExisting);
      const modifierCalculated = AbilityScoreUtils.calculateModifier(finalScoreWithCalculated);
      
      const mismatch = existingBonus !== calculatedBonuses ? ' ⚠️  MISMATCH!' : '';
      
      console.log(`  ${abilityName.padEnd(12)} ${baseStat.toString().padStart(2)} (base) + ${existingBonus.toString().padStart(2)} (D&DB) = ${finalScoreWithExisting.toString().padStart(2)} [${modifierExisting >= 0 ? '+' : ''}${modifierExisting}]`);
      console.log(`  ${' '.padEnd(12)} ${baseStat.toString().padStart(2)} (base) + ${calculatedBonuses.toString().padStart(2)} (calc) = ${finalScoreWithCalculated.toString().padStart(2)} [${modifierCalculated >= 0 ? '+' : ''}${modifierCalculated}]${mismatch}`);
      console.log('');
    });

    console.groupEnd();
  }
  /**
   * Process all ability score bonuses from all sources and calculate final scores
   * 
   * @param character - Character data from D&D Beyond
   * @returns Processed ability scores with detailed breakdown
   */
  static processAbilityScoreBonuses(character: any): BonusProcessingResult {
    console.log('AbilityScoreProcessor: Processing ability score bonuses from all sources...');
    
    // Run detailed debugging if enabled
    this.debugAbilityModifierSources(character);
    
    const appliedBonuses: Array<{ source: string; ability: string; bonus: number }> = [];
    
    // Store original bonusStats for comparison and start fresh
    const originalBonusStats = character.bonusStats ? [...character.bonusStats] : [];
    
    // Always start with fresh bonusStats to avoid double-counting
    let bonusStats: AbilityStat[] = [];
    for (let i = 1; i <= 6; i++) {
      bonusStats.push({ id: i, name: null, value: 0 });
    }
    
    // Define all modifier sources to check (from legacy utilities.js:799)
    const modifierSources = ['race', 'class', 'background', 'item', 'feat'];
    
    // Process modifiers from each source
    modifierSources.forEach(source => {
      if (character.modifiers && character.modifiers[source]) {
        character.modifiers[source].forEach((modifier: AbilityModifier) => {
          if (modifier.type === "bonus" && modifier.subType && modifier.subType.endsWith("-score")) {
            // Extract ability from subType (e.g., "strength-score" -> "strength")
            const abilityName = modifier.subType.replace("-score", "") as AbilityName;
            
            // Use AbilityConstants for ID lookup instead of legacy justAbilities
            const abilityId = AbilityScoreUtils.getAbilityIdByName(abilityName);
            
            if (abilityId > 0 && modifier.fixedValue !== null && modifier.fixedValue !== undefined) {
              const bonus = parseInt(String(modifier.fixedValue)) || 0;
              if (bonus > 0 && bonusStats[abilityId - 1]) {
                bonusStats[abilityId - 1]!.value += bonus;
                
                appliedBonuses.push({
                  source,
                  ability: abilityName,
                  bonus
                });
                
                console.log(`Applied ${source} bonus: +${bonus} to ${abilityName} (ID: ${abilityId})`);
              }
            }
          }
        });
      }
    });
    
    // Calculate total scores for all abilities
    const totalScores: ProcessedAbilityScores = {};
    
    ABILITY_NAMES.forEach((abilityName, index) => {
      const abilityId = index + 1;
      const totalScore = this.getTotalAbilityScore(character, abilityId, bonusStats);
      
      // Get base score
      const baseStat = character.stats?.find((s: any) => s.id === abilityId);
      const baseScore = baseStat?.value || 10;
      
      // Use calculated bonuses instead of D&D Beyond's pre-calculated ones
      const bonusScore = bonusStats[index]?.value || 0;
      
      // Get override
      const overrideStat = character.overrideStats?.find((s: any) => s.id === abilityId);
      const overrideScore = overrideStat?.value || null;
      
      totalScores[abilityName] = {
        base: baseScore,
        bonus: bonusScore,
        override: overrideScore,
        total: totalScore,
        modifier: AbilityScoreUtils.calculateModifier(totalScore)
      };
    });
    
    // Create final bonus summary for debugging
    const finalBonusSummary = ABILITY_NAMES.map((ability, index) => ({
      ability,
      bonus: bonusStats[index]?.value || 0
    })).filter(item => item.bonus > 0);
    
    // Log final bonus stats for debugging (legacy compatibility)
    console.log('Final ability score bonuses:');
    finalBonusSummary.forEach(({ ability, bonus }) => {
      console.log(`  ${ability}: +${bonus}`);
    });
    
    return {
      processedBonuses: bonusStats,
      totalScores,
      debugInfo: {
        appliedBonuses,
        finalBonusSummary
      }
    };
  }
  
  /**
   * Get total ability score including base, racial, and feat bonuses
   * Modern replacement for legacy getTotalAbilityScore() function
   * 
   * @param character - Character data
   * @param scoreId - Ability score ID (1-6)
   * @param bonusStats - Optional pre-processed bonus stats array
   * @returns Total ability score
   */
  static getTotalAbilityScore(character: any, scoreId: number, bonusStats?: AbilityStat[]): number {
    // Get base score
    let baseScore = 10;
    if (character.stats && character.stats.length >= scoreId) {
      baseScore = character.stats[scoreId - 1]?.value || 10;
    }
    
    // Get racial/feat bonuses
    let bonusScore = 0;
    const bonusArray = bonusStats || character.bonusStats;
    if (bonusArray && bonusArray.length >= scoreId) {
      bonusScore = bonusArray[scoreId - 1]?.value || 0;
    }
    
    // Check for ability score overrides
    let overrideScore: number | null = null;
    if (character.overrideStats && character.overrideStats.length >= scoreId) {
      overrideScore = character.overrideStats[scoreId - 1]?.value;
    }
    
    // Return override if it exists, otherwise base + bonus
    return overrideScore !== null ? overrideScore : baseScore + bonusScore;
  }
  
  /**
   * Process ability scores for all abilities and return in legacy format
   * Compatible with existing characterParser.js usage patterns
   * 
   * @param character - Character data from D&D Beyond
   * @returns Array of ability scores in legacy format
   */
  static processLegacyFormat(character: any): Array<{
    id: number;
    name: string;
    base: number;
    racial: number;
    feat: number;
    item: number;
    total: number;
    modifier: number;
  }> {
    const result = this.processAbilityScoreBonuses(character);
    
    return ABILITY_NAMES.map((name, index) => {
      const abilityId = index + 1;
      const scores = result.totalScores[name];
      
      // Break down bonuses by source for legacy compatibility
      const appliedToAbility = result.debugInfo.appliedBonuses.filter(b => b.ability === name);
      const racial = appliedToAbility.filter(b => b.source === 'race').reduce((sum, b) => sum + b.bonus, 0);
      const feat = appliedToAbility.filter(b => b.source === 'feat').reduce((sum, b) => sum + b.bonus, 0);
      const item = appliedToAbility.filter(b => b.source === 'item').reduce((sum, b) => sum + b.bonus, 0);
      
      return {
        id: abilityId,
        name,
        base: scores?.base || 10,
        racial,
        feat,
        item,
        total: scores?.total || 10,
        modifier: scores?.modifier || 0
      };
    });
  }
  
  /**
   * Validate character data structure for ability score processing
   * 
   * @param character - Character data to validate
   * @returns Validation result with any issues found
   */
  static validateCharacterData(character: any): {
    isValid: boolean;
    issues: string[];
    warnings: string[];
  } {
    const issues: string[] = [];
    const warnings: string[] = [];
    
    if (!character) {
      issues.push('Character data is null or undefined');
      return { isValid: false, issues, warnings };
    }
    
    // Check for required arrays
    if (!character.stats || !Array.isArray(character.stats)) {
      warnings.push('Character stats array is missing or invalid - will use defaults');
    } else if (character.stats.length < 6) {
      warnings.push(`Character stats array has ${character.stats.length} entries, expected 6`);
    }
    
    if (character.bonusStats && !Array.isArray(character.bonusStats)) {
      warnings.push('Character bonusStats is not an array - will initialize');
    }
    
    if (character.overrideStats && !Array.isArray(character.overrideStats)) {
      warnings.push('Character overrideStats is not an array');
    }
    
    if (character.modifiers && typeof character.modifiers !== 'object') {
      warnings.push('Character modifiers is not an object');
    }
    
    // Check modifier structure
    if (character.modifiers) {
      const modifierSources = ['race', 'class', 'background', 'item', 'feat'];
      modifierSources.forEach(source => {
        if (character.modifiers[source] && !Array.isArray(character.modifiers[source])) {
          warnings.push(`Character modifiers.${source} is not an array`);
        }
      });
    }
    
    return {
      isValid: issues.length === 0,
      issues,
      warnings
    };
  }
}