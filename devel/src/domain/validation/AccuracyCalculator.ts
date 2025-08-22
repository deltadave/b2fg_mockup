/**
 * Accuracy Calculator and Missing Data Detection
 * 
 * Provides advanced accuracy calculations and missing data detection for D&D 5e
 * character validation, with weighted scoring and detailed analytics.
 */

import { ValidationResult, SectionValidation, CharacterValidationReport } from './CharacterValidationEngine';

export interface AccuracyWeights {
  identity: number;
  abilities: number;
  skills: number;
  combat: number;
  equipment: number;
  spells: number;
  features: number;
}

export interface AccuracyBreakdown {
  sectionId: string;
  sectionName: string;
  weight: number;
  rawAccuracy: number;
  weightedAccuracy: number;
  criticalIssues: number;
  missingDataCount: number;
  completenessScore: number;
}

export interface MissingDataAnalysis {
  sectionId: string;
  sectionName: string;
  criticalMissing: string[];
  optionalMissing: string[];
  suggestions: string[];
  impactScore: number; // 0-100, how much this affects character functionality
  resolutionDifficulty: 'easy' | 'medium' | 'hard' | 'impossible';
}

export interface DataQualityMetrics {
  overallCompleteness: number;
  dataIntegrity: number;
  functionalAccuracy: number;
  conversionFidelity: number;
  usabilityScore: number;
}

export class AccuracyCalculator {
  private readonly defaultWeights: AccuracyWeights = {
    identity: 0.15,   // Character name, race, class, level
    abilities: 0.20,  // Core ability scores and modifiers
    skills: 0.15,     // Skills and proficiencies
    combat: 0.20,     // AC, HP, attack bonuses, saving throws
    equipment: 0.15,  // Weapons, armor, items
    spells: 0.10,     // Spells and spell slots (if applicable)
    features: 0.05    // Class and racial features
  };

  private readonly criticalDataElements: Record<string, string[]> = {
    identity: ['name', 'race', 'classes', 'level'],
    abilities: ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'],
    skills: ['proficiency_bonus', 'skill_modifiers'],
    combat: ['armor_class', 'hit_points', 'speed'],
    equipment: ['weapons', 'armor'],
    spells: ['spell_slots', 'known_spells'],
    features: ['class_features', 'racial_traits']
  };

  constructor(private customWeights?: Partial<AccuracyWeights>) {}

  /**
   * Calculate comprehensive accuracy with weighted scoring
   */
  calculateWeightedAccuracy(report: CharacterValidationReport): {
    overallAccuracy: number;
    breakdowns: AccuracyBreakdown[];
    qualityMetrics: DataQualityMetrics;
  } {
    const weights = { ...this.defaultWeights, ...this.customWeights };
    const breakdowns: AccuracyBreakdown[] = [];
    
    let totalWeightedScore = 0;
    let totalWeight = 0;
    
    // Calculate weighted accuracy for each section
    report.sections.forEach(section => {
      const weight = weights[section.sectionId as keyof AccuracyWeights] || 0;
      const breakdown = this.calculateSectionBreakdown(section, weight);
      
      breakdowns.push(breakdown);
      totalWeightedScore += breakdown.weightedAccuracy;
      totalWeight += weight;
    });
    
    const overallAccuracy = totalWeight > 0 ? totalWeightedScore / totalWeight : 0;
    const qualityMetrics = this.calculateQualityMetrics(report, breakdowns);
    
    return {
      overallAccuracy: Math.round(overallAccuracy),
      breakdowns,
      qualityMetrics
    };
  }

  /**
   * Calculate detailed section breakdown
   */
  private calculateSectionBreakdown(section: SectionValidation, weight: number): AccuracyBreakdown {
    const criticalIssues = section.results.filter(r => r.severity === 'error').length;
    const missingDataCount = section.results.reduce((count, r) => 
      count + (r.missingData?.length || 0), 0
    );
    
    // Completeness score based on expected vs actual data
    const completenessScore = this.calculateCompletenessScore(section);
    
    // Adjust raw accuracy based on critical issues
    let adjustedAccuracy = section.overallAccuracy;
    if (criticalIssues > 0) {
      adjustedAccuracy = Math.max(0, adjustedAccuracy - (criticalIssues * 15));
    }
    
    // Factor in completeness
    adjustedAccuracy = (adjustedAccuracy + completenessScore) / 2;
    
    return {
      sectionId: section.sectionId,
      sectionName: section.sectionName,
      weight,
      rawAccuracy: section.overallAccuracy,
      weightedAccuracy: adjustedAccuracy * weight,
      criticalIssues,
      missingDataCount,
      completenessScore
    };
  }

  /**
   * Calculate completeness score for a section
   */
  private calculateCompletenessScore(section: SectionValidation): number {
    const expectedElements = this.criticalDataElements[section.sectionId] || [];
    if (expectedElements.length === 0) return 100;
    
    const missingElements = new Set<string>();
    section.results.forEach(result => {
      if (result.missingData) {
        result.missingData.forEach(item => missingElements.add(item.toLowerCase()));
      }
    });
    
    const missingCount = expectedElements.filter(element => 
      missingElements.has(element.toLowerCase())
    ).length;
    
    return Math.max(0, ((expectedElements.length - missingCount) / expectedElements.length) * 100);
  }

  /**
   * Calculate overall data quality metrics
   */
  private calculateQualityMetrics(
    report: CharacterValidationReport, 
    breakdowns: AccuracyBreakdown[]
  ): DataQualityMetrics {
    
    // Overall completeness - weighted average of section completeness
    const overallCompleteness = breakdowns.reduce((sum, breakdown) => 
      sum + (breakdown.completenessScore * breakdown.weight), 0
    ) / breakdowns.reduce((sum, breakdown) => sum + breakdown.weight, 0);
    
    // Data integrity - percentage of sections without critical errors
    const sectionsWithoutCriticalErrors = breakdowns.filter(b => b.criticalIssues === 0).length;
    const dataIntegrity = (sectionsWithoutCriticalErrors / breakdowns.length) * 100;
    
    // Functional accuracy - ability to use character in game
    const functionalAccuracy = this.calculateFunctionalAccuracy(breakdowns);
    
    // Conversion fidelity - how well the conversion preserved original data
    const conversionFidelity = this.calculateConversionFidelity(report);
    
    // Usability score - how usable the character is for gameplay
    const usabilityScore = this.calculateUsabilityScore(breakdowns);
    
    return {
      overallCompleteness: Math.round(overallCompleteness),
      dataIntegrity: Math.round(dataIntegrity),
      functionalAccuracy: Math.round(functionalAccuracy),
      conversionFidelity: Math.round(conversionFidelity),
      usabilityScore: Math.round(usabilityScore)
    };
  }

  /**
   * Calculate functional accuracy (gameplay readiness)
   */
  private calculateFunctionalAccuracy(breakdowns: AccuracyBreakdown[]): number {
    // Weight sections by gameplay importance
    const gameplayWeights = {
      identity: 0.10,
      abilities: 0.25,
      skills: 0.15,
      combat: 0.35,  // Most important for gameplay
      equipment: 0.10,
      spells: 0.05,
      features: 0.00  // Nice to have but not critical
    };
    
    let totalScore = 0;
    let totalWeight = 0;
    
    breakdowns.forEach(breakdown => {
      const gameplayWeight = gameplayWeights[breakdown.sectionId as keyof typeof gameplayWeights] || 0;
      if (gameplayWeight > 0) {
        // Penalize heavily for critical issues in gameplay-important sections
        let sectionScore = breakdown.rawAccuracy;
        if (breakdown.criticalIssues > 0) {
          sectionScore = Math.max(0, sectionScore - (breakdown.criticalIssues * 25));
        }
        
        totalScore += sectionScore * gameplayWeight;
        totalWeight += gameplayWeight;
      }
    });
    
    return totalWeight > 0 ? totalScore / totalWeight : 0;
  }

  /**
   * Calculate conversion fidelity (preservation of original data)
   */
  private calculateConversionFidelity(report: CharacterValidationReport): number {
    let totalValidations = 0;
    let successfulValidations = 0;
    
    report.sections.forEach(section => {
      section.results.forEach(result => {
        totalValidations++;
        if (result.valid && result.accuracy && result.accuracy >= 90) {
          successfulValidations++;
        }
      });
    });
    
    return totalValidations > 0 ? (successfulValidations / totalValidations) * 100 : 0;
  }

  /**
   * Calculate usability score (ease of use in VTT)
   */
  private calculateUsabilityScore(breakdowns: AccuracyBreakdown[]): number {
    // Focus on data that affects VTT usability
    const usabilityFactors = {
      hasName: 25,           // Character needs a name
      hasAbilities: 20,      // Core mechanics
      hasCombatStats: 25,    // Essential for combat
      hasBasicEquipment: 15, // Weapons and armor
      hasFeatures: 10,       // Character flavor
      dataConsistency: 5     // No conflicting data
    };
    
    let usabilityScore = 0;
    
    // Check for basic required elements
    const identityBreakdown = breakdowns.find(b => b.sectionId === 'identity');
    const abilitiesBreakdown = breakdowns.find(b => b.sectionId === 'abilities');
    const combatBreakdown = breakdowns.find(b => b.sectionId === 'combat');
    const equipmentBreakdown = breakdowns.find(b => b.sectionId === 'equipment');
    const featuresBreakdown = breakdowns.find(b => b.sectionId === 'features');
    
    // Has name and basic identity
    if (identityBreakdown && identityBreakdown.rawAccuracy >= 70) {
      usabilityScore += usabilityFactors.hasName;
    }
    
    // Has ability scores
    if (abilitiesBreakdown && abilitiesBreakdown.rawAccuracy >= 80) {
      usabilityScore += usabilityFactors.hasAbilities;
    }
    
    // Has combat statistics
    if (combatBreakdown && combatBreakdown.rawAccuracy >= 75) {
      usabilityScore += usabilityFactors.hasCombatStats;
    }
    
    // Has basic equipment
    if (equipmentBreakdown && equipmentBreakdown.rawAccuracy >= 60) {
      usabilityScore += usabilityFactors.hasBasicEquipment;
    }
    
    // Has features
    if (featuresBreakdown && featuresBreakdown.rawAccuracy >= 50) {
      usabilityScore += usabilityFactors.hasFeatures;
    }
    
    // Data consistency (no critical errors across sections)
    const totalCriticalIssues = breakdowns.reduce((sum, b) => sum + b.criticalIssues, 0);
    if (totalCriticalIssues === 0) {
      usabilityScore += usabilityFactors.dataConsistency;
    }
    
    return usabilityScore;
  }

  /**
   * Analyze missing data across all sections
   */
  analyzeMissingData(report: CharacterValidationReport): MissingDataAnalysis[] {
    const analyses: MissingDataAnalysis[] = [];
    
    report.sections.forEach(section => {
      const analysis = this.analyzeSectionMissingData(section);
      if (analysis.criticalMissing.length > 0 || analysis.optionalMissing.length > 0) {
        analyses.push(analysis);
      }
    });
    
    return analyses.sort((a, b) => b.impactScore - a.impactScore);
  }

  /**
   * Analyze missing data for a specific section
   */
  private analyzeSectionMissingData(section: SectionValidation): MissingDataAnalysis {
    const criticalMissing: string[] = [];
    const optionalMissing: string[] = [];
    const suggestions: string[] = [];
    
    const criticalElements = this.criticalDataElements[section.sectionId] || [];
    
    section.results.forEach(result => {
      if (result.missingData) {
        result.missingData.forEach(item => {
          const isCritical = criticalElements.some(critical => 
            item.toLowerCase().includes(critical.toLowerCase()) ||
            critical.toLowerCase().includes(item.toLowerCase())
          );
          
          if (isCritical) {
            criticalMissing.push(item);
          } else {
            optionalMissing.push(item);
          }
        });
      }
      
      if (result.suggestions) {
        suggestions.push(...result.suggestions);
      }
    });
    
    // Calculate impact score
    const impactScore = this.calculateMissingDataImpact(
      section.sectionId, 
      criticalMissing, 
      optionalMissing
    );
    
    // Determine resolution difficulty
    const resolutionDifficulty = this.determineResolutionDifficulty(
      section.sectionId, 
      criticalMissing
    );
    
    return {
      sectionId: section.sectionId,
      sectionName: section.sectionName,
      criticalMissing: [...new Set(criticalMissing)],
      optionalMissing: [...new Set(optionalMissing)],
      suggestions: [...new Set(suggestions)],
      impactScore,
      resolutionDifficulty
    };
  }

  /**
   * Calculate the impact score of missing data
   */
  private calculateMissingDataImpact(
    sectionId: string, 
    criticalMissing: string[], 
    optionalMissing: string[]
  ): number {
    const sectionImportance = {
      identity: 70,
      abilities: 90,
      skills: 60,
      combat: 95,
      equipment: 70,
      spells: 50,
      features: 40
    };
    
    const baseImportance = sectionImportance[sectionId as keyof typeof sectionImportance] || 50;
    const criticalPenalty = criticalMissing.length * 20;
    const optionalPenalty = optionalMissing.length * 5;
    
    return Math.max(0, Math.min(100, baseImportance + criticalPenalty + optionalPenalty));
  }

  /**
   * Determine how difficult it is to resolve missing data
   */
  private determineResolutionDifficulty(
    sectionId: string, 
    criticalMissing: string[]
  ): 'easy' | 'medium' | 'hard' | 'impossible' {
    if (criticalMissing.length === 0) return 'easy';
    
    const difficultyMap = {
      identity: 'medium',  // Usually available in D&D Beyond
      abilities: 'easy',   // Core stats are always present
      skills: 'easy',      // Can be calculated
      combat: 'medium',    // May require calculation
      equipment: 'hard',   // Complex item parsing
      spells: 'hard',      // Complex spell data
      features: 'impossible' // Often requires manual entry
    };
    
    const baseDifficulty = difficultyMap[sectionId as keyof typeof difficultyMap] || 'medium';
    
    // Increase difficulty based on number of missing critical items
    if (criticalMissing.length >= 5) {
      return 'impossible';
    } else if (criticalMissing.length >= 3) {
      return baseDifficulty === 'easy' ? 'medium' : 'hard';
    }
    
    return baseDifficulty as any;
  }

  /**
   * Generate accuracy improvement recommendations
   */
  generateImprovementRecommendations(
    report: CharacterValidationReport,
    missingDataAnalyses: MissingDataAnalysis[]
  ): string[] {
    const recommendations: string[] = [];
    
    // High-impact, easy-to-fix issues first
    const easyFixes = missingDataAnalyses.filter(
      analysis => analysis.resolutionDifficulty === 'easy' && analysis.impactScore >= 70
    );
    
    easyFixes.forEach(fix => {
      if (fix.criticalMissing.length > 0) {
        recommendations.push(
          `${fix.sectionName}: Add missing ${fix.criticalMissing.join(', ')} for immediate accuracy improvement`
        );
      }
    });
    
    // Critical accuracy issues
    report.sections.forEach(section => {
      if (section.overallAccuracy < 50 && section.itemCount.errored > 0) {
        recommendations.push(
          `${section.sectionName}: Fix ${section.itemCount.errored} critical errors to improve functionality`
        );
      }
    });
    
    // Overall accuracy recommendations
    if (report.overallAccuracy < 70) {
      recommendations.push(
        'Overall accuracy is below 70% - consider manual review of character data'
      );
    }
    
    if (report.overallAccuracy >= 90) {
      recommendations.push(
        'Excellent accuracy! Character is ready for use in Fantasy Grounds'
      );
    }
    
    return recommendations.slice(0, 10); // Limit to top 10 recommendations
  }
}

// Export singleton instance
export const accuracyCalculator = new AccuracyCalculator();

// Export types
export type {
  AccuracyWeights,
  AccuracyBreakdown,
  MissingDataAnalysis,
  DataQualityMetrics
};