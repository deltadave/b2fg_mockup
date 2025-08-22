/**
 * Compatibility Engine
 * 
 * Analyzes D&D Beyond character data to determine compatibility with different VTT formats.
 * Provides detailed analysis of feature support and conversion quality.
 */

import type { CharacterData } from '@/domain/character/services/CharacterFetcher';
import type { FormatCapability, CompatibilityAnalysis } from './interfaces/FormatAdapter';

export interface CharacterComplexity {
  /** Basic character features */
  hasMulticlass: boolean;
  hasCustomBackground: boolean;
  hasHomebrewContent: boolean;
  hasCustomFeats: boolean;
  
  /** Spellcasting complexity */
  spellcasterLevels: number;
  hasRitualCasting: boolean;
  hasPactMagic: boolean;
  hasMultipleSpellcastingClasses: boolean;
  
  /** Equipment complexity */
  hasMagicItems: boolean;
  hasCustomItems: boolean;
  hasComplexWeapons: boolean;
  
  /** Character features */
  totalFeatures: number;
  hasRacialFeatures: boolean;
  hasClassFeatures: boolean;
  hasBackgroundFeatures: boolean;
  hasFeatFeatures: boolean;
}

export interface FeatureAnalysis {
  /** Feature category */
  category: 'basic' | 'spells' | 'equipment' | 'features' | 'custom';
  /** Feature identifier */
  feature: string;
  /** Whether present in character */
  present: boolean;
  /** Complexity level */
  complexity: 'simple' | 'moderate' | 'complex';
  /** Data required for conversion */
  requiredData?: string[];
}

export class CompatibilityEngine {
  /**
   * Analyze character complexity for compatibility assessment
   */
  analyzeCharacterComplexity(characterData: CharacterData): CharacterComplexity {
    const classes = characterData.classes || [];
    const spells = characterData.spells || {};
    const inventory = characterData.inventory || [];
    
    // Class analysis
    const hasMulticlass = classes.length > 1;
    const spellcastingClasses = classes.filter(cls => 
      this.isSpellcastingClass(cls.definition?.name)
    );
    const hasMultipleSpellcastingClasses = spellcastingClasses.length > 1;
    const spellcasterLevels = spellcastingClasses.reduce((total, cls) => total + (cls.level || 0), 0);
    
    // Warlock check for pact magic
    const hasPactMagic = classes.some(cls => 
      cls.definition?.name?.toLowerCase() === 'warlock'
    );
    
    // Spellcasting analysis
    const hasRitualCasting = this.hasRitualSpells(spells);
    
    // Equipment analysis
    const hasMagicItems = inventory.some(item => 
      item.definition?.magic || item.definition?.rarity !== 'Common'
    );
    const hasCustomItems = inventory.some(item => 
      item.definition?.isHomebrew || !item.definition?.id
    );
    const hasComplexWeapons = inventory.some(item =>
      this.isComplexWeapon(item)
    );
    
    // Character features
    const features = this.extractAllFeatures(characterData);
    const totalFeatures = features.length;
    
    return {
      hasMulticlass,
      hasCustomBackground: this.hasCustomBackground(characterData),
      hasHomebrewContent: this.hasHomebrewContent(characterData),
      hasCustomFeats: this.hasCustomFeats(characterData),
      spellcasterLevels,
      hasRitualCasting,
      hasPactMagic,
      hasMultipleSpellcastingClasses,
      hasMagicItems,
      hasCustomItems,
      hasComplexWeapons,
      totalFeatures,
      hasRacialFeatures: this.hasRacialFeatures(characterData),
      hasClassFeatures: this.hasClassFeatures(characterData),
      hasBackgroundFeatures: this.hasBackgroundFeatures(characterData),
      hasFeatFeatures: this.hasFeatFeatures(characterData)
    };
  }

  /**
   * Analyze specific features present in character
   */
  analyzeFeatures(characterData: CharacterData): FeatureAnalysis[] {
    const features: FeatureAnalysis[] = [];

    // Basic character data
    features.push({
      category: 'basic',
      feature: 'abilities',
      present: !!(characterData.stats?.length),
      complexity: 'simple'
    });

    features.push({
      category: 'basic',
      feature: 'skills',
      present: this.hasSkillProficiencies(characterData),
      complexity: 'simple'
    });

    features.push({
      category: 'basic',
      feature: 'saving_throws',
      present: this.hasSavingThrowProficiencies(characterData),
      complexity: 'simple'
    });

    // Spellcasting
    const hasSpells = this.hasSpells(characterData);
    features.push({
      category: 'spells',
      feature: 'spellcasting',
      present: hasSpells,
      complexity: hasSpells ? this.getSpellcastingComplexity(characterData) : 'simple'
    });

    features.push({
      category: 'spells',
      feature: 'spell_slots',
      present: hasSpells,
      complexity: this.hasPactMagic(characterData) ? 'complex' : 'moderate'
    });

    // Equipment
    features.push({
      category: 'equipment',
      feature: 'weapons',
      present: this.hasWeapons(characterData),
      complexity: this.getWeaponComplexity(characterData)
    });

    features.push({
      category: 'equipment',
      feature: 'armor',
      present: this.hasArmor(characterData),
      complexity: 'moderate'
    });

    features.push({
      category: 'equipment',
      feature: 'magic_items',
      present: this.hasMagicItems(characterData),
      complexity: 'complex'
    });

    // Features
    features.push({
      category: 'features',
      feature: 'class_features',
      present: this.hasClassFeatures(characterData),
      complexity: 'moderate'
    });

    features.push({
      category: 'features',
      feature: 'racial_features',
      present: this.hasRacialFeatures(characterData),
      complexity: 'moderate'
    });

    features.push({
      category: 'features',
      feature: 'feats',
      present: this.hasFeats(characterData),
      complexity: 'moderate'
    });

    // Custom content
    features.push({
      category: 'custom',
      feature: 'homebrew_content',
      present: this.hasHomebrewContent(characterData),
      complexity: 'complex'
    });

    return features;
  }

  /**
   * Calculate compatibility score based on supported features
   */
  calculateCompatibilityScore(
    characterFeatures: FeatureAnalysis[],
    formatCapabilities: FormatCapability[]
  ): number {
    let totalWeight = 0;
    let supportedWeight = 0;

    for (const feature of characterFeatures) {
      if (!feature.present) continue;

      const capability = formatCapabilities.find(cap => cap.feature === feature.feature);
      const weight = this.getFeatureWeight(feature);
      
      totalWeight += weight;

      if (capability) {
        switch (capability.support) {
          case 'full':
            supportedWeight += weight;
            break;
          case 'partial':
            supportedWeight += weight * 0.6; // Partial support = 60% value
            break;
          case 'none':
            // No points for unsupported features
            break;
        }
      }
    }

    return totalWeight > 0 ? Math.round((supportedWeight / totalWeight) * 100) : 100;
  }

  /**
   * Generate compatibility analysis
   */
  generateCompatibilityAnalysis(
    characterData: CharacterData,
    formatCapabilities: FormatCapability[]
  ): CompatibilityAnalysis {
    const features = this.analyzeFeatures(characterData);
    const complexity = this.analyzeCharacterComplexity(characterData);
    const score = this.calculateCompatibilityScore(features, formatCapabilities);

    // Determine recommendation
    let recommendation: 'excellent' | 'good' | 'fair' | 'poor';
    if (score >= 90) recommendation = 'excellent';
    else if (score >= 75) recommendation = 'good';
    else if (score >= 60) recommendation = 'fair';
    else recommendation = 'poor';

    // Calculate data loss
    const dataLoss = this.calculateDataLoss(features, formatCapabilities);

    // Generate limitations
    const limitations = this.generateLimitations(features, formatCapabilities, complexity);

    return {
      score,
      capabilities: formatCapabilities,
      recommendation,
      limitations,
      dataLoss
    };
  }

  // Private helper methods

  private isSpellcastingClass(className?: string): boolean {
    if (!className) return false;
    const spellcastingClasses = [
      'wizard', 'sorcerer', 'warlock', 'bard', 'cleric', 'druid',
      'paladin', 'ranger', 'artificer', 'eldritch knight', 'arcane trickster'
    ];
    return spellcastingClasses.some(cls => 
      className.toLowerCase().includes(cls)
    );
  }

  private hasRitualSpells(spells: any): boolean {
    // Check if character has any ritual spells
    if (!spells?.class || !Array.isArray(spells.class)) return false;
    return spells.class.some((spell: any) => spell.definition?.ritual);
  }

  private isComplexWeapon(item: any): boolean {
    const definition = item.definition;
    return !!(
      definition?.magic ||
      definition?.attackType === 'Ranged' ||
      definition?.properties?.some((prop: any) => 
        ['Versatile', 'Two-Handed', 'Special'].includes(prop.name)
      )
    );
  }

  private hasCustomBackground(characterData: CharacterData): boolean {
    return !!(characterData.background?.isHomebrew || 
             characterData.background?.definition?.isHomebrew);
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

  private hasCustomFeats(characterData: CharacterData): boolean {
    const feats = characterData.feats || [];
    return feats.some((feat: any) => feat.definition?.isHomebrew);
  }

  private extractAllFeatures(characterData: CharacterData): any[] {
    const features: any[] = [];
    
    // Class features
    const classes = characterData.classes || [];
    classes.forEach(cls => {
      if (cls.classFeatures) features.push(...cls.classFeatures);
    });
    
    // Racial features
    if (characterData.race?.racialTraits) {
      features.push(...characterData.race.racialTraits);
    }
    
    // Background features
    if (characterData.background?.backgroundFeatures) {
      features.push(...characterData.background.backgroundFeatures);
    }
    
    // Feats
    if (characterData.feats) {
      features.push(...characterData.feats);
    }
    
    return features;
  }

  private hasSkillProficiencies(characterData: CharacterData): boolean {
    const modifiers = characterData.modifiers;
    return !!(modifiers?.skill?.length);
  }

  private hasSavingThrowProficiencies(characterData: CharacterData): boolean {
    const modifiers = characterData.modifiers;
    return !!(modifiers?.savingThrow?.length);
  }

  private hasSpells(characterData: CharacterData): boolean {
    const spells = characterData.spells;
    return !!(spells?.class?.length || spells?.race?.length);
  }

  private getSpellcastingComplexity(characterData: CharacterData): 'simple' | 'moderate' | 'complex' {
    const classes = characterData.classes || [];
    const spellcastingClasses = classes.filter(cls => this.isSpellcastingClass(cls.definition?.name));
    
    if (spellcastingClasses.length > 1) return 'complex';
    if (this.hasPactMagic(characterData)) return 'complex';
    return 'moderate';
  }

  private hasPactMagic(characterData: CharacterData): boolean {
    const classes = characterData.classes || [];
    return classes.some(cls => cls.definition?.name?.toLowerCase() === 'warlock');
  }

  private hasWeapons(characterData: CharacterData): boolean {
    const inventory = characterData.inventory || [];
    return inventory.some(item => 
      item.definition?.filterType === 'Weapon'
    );
  }

  private getWeaponComplexity(characterData: CharacterData): 'simple' | 'moderate' | 'complex' {
    const inventory = characterData.inventory || [];
    const weapons = inventory.filter(item => item.definition?.filterType === 'Weapon');
    
    if (weapons.some(weapon => this.isComplexWeapon(weapon))) return 'complex';
    if (weapons.length > 3) return 'moderate';
    return 'simple';
  }

  private hasArmor(characterData: CharacterData): boolean {
    const inventory = characterData.inventory || [];
    return inventory.some(item => 
      item.definition?.filterType === 'Armor'
    );
  }

  private hasMagicItems(characterData: CharacterData): boolean {
    const inventory = characterData.inventory || [];
    return inventory.some(item => 
      item.definition?.magic || 
      (item.definition?.rarity && item.definition?.rarity !== 'Common')
    );
  }

  private hasClassFeatures(characterData: CharacterData): boolean {
    const classes = characterData.classes || [];
    return classes.some(cls => cls.classFeatures?.length);
  }

  private hasRacialFeatures(characterData: CharacterData): boolean {
    return !!(characterData.race?.racialTraits?.length);
  }

  private hasBackgroundFeatures(characterData: CharacterData): boolean {
    return !!(characterData.background?.backgroundFeatures?.length);
  }

  private hasFeatFeatures(characterData: CharacterData): boolean {
    return !!(characterData.feats?.length);
  }

  private hasFeats(characterData: CharacterData): boolean {
    return !!(characterData.feats?.length);
  }

  private getFeatureWeight(feature: FeatureAnalysis): number {
    // Weight features by importance and complexity
    const baseWeights = {
      basic: 10,
      spells: 15,
      equipment: 10,
      features: 12,
      custom: 8
    };

    const complexityMultiplier = {
      simple: 1.0,
      moderate: 1.2,
      complex: 1.5
    };

    return baseWeights[feature.category] * complexityMultiplier[feature.complexity];
  }

  private calculateDataLoss(
    features: FeatureAnalysis[],
    capabilities: FormatCapability[]
  ): number {
    let totalFeatures = 0;
    let lostFeatures = 0;

    for (const feature of features) {
      if (!feature.present) continue;
      
      totalFeatures++;
      
      const capability = capabilities.find(cap => cap.feature === feature.feature);
      if (!capability || capability.support === 'none') {
        lostFeatures++;
      }
    }

    return totalFeatures > 0 ? Math.round((lostFeatures / totalFeatures) * 100) : 0;
  }

  private generateLimitations(
    features: FeatureAnalysis[],
    capabilities: FormatCapability[],
    complexity: CharacterComplexity
  ): string[] {
    const limitations: string[] = [];

    // Check for major unsupported features
    for (const capability of capabilities) {
      const feature = features.find(f => f.feature === capability.feature && f.present);
      
      if (feature && capability.support === 'none') {
        limitations.push(`${capability.feature.replace('_', ' ')} not supported`);
      } else if (feature && capability.support === 'partial' && capability.limitations) {
        limitations.push(capability.limitations);
      }
    }

    // Add complexity-based limitations
    if (complexity.hasMulticlass) {
      limitations.push('Multiclass character may have reduced feature support');
    }

    if (complexity.hasHomebrewContent) {
      limitations.push('Homebrew content may not convert properly');
    }

    if (complexity.hasPactMagic && complexity.hasMultipleSpellcastingClasses) {
      limitations.push('Complex spellcasting may not be fully supported');
    }

    return limitations;
  }
}

// Export singleton instance
export const compatibilityEngine = new CompatibilityEngine();