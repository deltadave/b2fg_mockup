/**
 * FeatureProcessor Service
 * 
 * Processes D&D 5e class features and racial traits from character data.
 * Handles feature detection, categorization, and XML generation for Fantasy Grounds.
 * 
 * Extracted from legacy characterParser.js feature processing logic.
 */

import {
  ClassFeature,
  RacialTrait,
  ProcessedFeatures,
  FeatureXMLOptions,
  CLASS_FEATURE_TYPES,
  RACIAL_TRAIT_TYPES,
  FeatureValidator,
  FeatureLevel,
  FeatureUsage
} from '@/domain/character/models/Features';
import { featureFlags } from '@/core/FeatureFlags';
import { StringSanitizer } from '@/shared/utils/StringSanitizer';

export interface FeatureProcessingOptions {
  includeSubclassFeatures: boolean;
  includeRacialTraits: boolean;
  includeDescriptions: boolean;
  filterByLevel: boolean;
  maxLevel: number;
}

export interface CharacterData {
  classes: Array<{
    id: number;
    level: number;
    definition: {
      id: number;
      name: string;
      classFeatures?: Array<{
        id: number;
        name: string;
        description: string;
        requiredLevel: number;
      }>;
    };
    subclassDefinition?: {
      id: number;
      name: string;
      classFeatures?: Array<{
        id: number;
        name: string;
        description: string;
        requiredLevel: number;
      }>;
    };
  }>;
  race: {
    id: number;
    fullName: string;
    racialTraits?: Array<{
      id: number;
      definition: {
        id: number;
        name: string;
        description: string;
      };
    }>;
    subraceDefinition?: {
      id: number;
      name: string;
      racialTraits?: Array<{
        id: number;
        definition: {
          id: number;
          name: string;
          description: string;
        };
      }>;
    };
  };
}

export class FeatureProcessor {
  private static debugEnabled: boolean = false;

  constructor() {
    // Enable debug mode if feature flag is set
    if (featureFlags.isEnabled('feature_processor_debug')) {
      FeatureProcessor.debugEnabled = true;
    }
  }

  /**
   * Enable or disable debug mode for FeatureProcessor
   */
  static setDebugMode(enabled: boolean): void {
    this.debugEnabled = enabled;
  }

  /**
   * Process all character features (class features + racial traits)
   */
  processCharacterFeatures(
    characterData: CharacterData,
    options: FeatureProcessingOptions = this.getDefaultOptions()
  ): ProcessedFeatures {
    
    if (FeatureProcessor.debugEnabled || featureFlags.isEnabled('feature_processor_debug')) {
      console.log('🎭 FeatureProcessor: Processing character features', {
        classCount: characterData.classes?.length || 0,
        raceName: characterData.race?.fullName,
        options
      });
    }

    const classFeatures = options.includeSubclassFeatures 
      ? this.processClassFeatures(characterData, options)
      : [];
    
    const racialTraits = options.includeRacialTraits 
      ? this.processRacialTraits(characterData, options)
      : [];

    const featuresByClass = this.groupFeaturesByClass(classFeatures);
    const traitsByRace = this.groupTraitsByRace(racialTraits);

    const result: ProcessedFeatures = {
      classFeatures,
      racialTraits,
      totalFeatures: classFeatures.length + racialTraits.length,
      featuresByClass,
      traitsByRace,
      debugInfo: {
        processingMethod: characterData.classes.length > 1 ? 'multiclass' : 'single_class',
        classBreakdown: this.buildClassBreakdown(characterData, classFeatures),
        raceBreakdown: this.buildRaceBreakdown(characterData, racialTraits),
        warnings: []
      }
    };

    if (FeatureProcessor.debugEnabled || featureFlags.isEnabled('feature_processor_debug')) {
      console.log('🎭 FeatureProcessor: Result', {
        totalFeatures: result.totalFeatures,
        classFeatureCount: classFeatures.length,
        racialTraitCount: racialTraits.length,
        processingMethod: result.debugInfo.processingMethod
      });
    }

    return result;
  }

  /**
   * Process class features from character data
   */
  processClassFeatures(
    characterData: CharacterData,
    options: FeatureProcessingOptions
  ): ClassFeature[] {
    const features: ClassFeature[] = [];
    const seenFeatures = new Set<string>(); // Track processed features to avoid duplicates

    if (!characterData.classes || !Array.isArray(characterData.classes)) {
      return features;
    }

    for (const characterClass of characterData.classes) {
      const className = characterClass.definition?.name?.toLowerCase() || 'unknown';
      const classLevel = characterClass.level || 1;
      
      if (FeatureProcessor.debugEnabled) {
        console.log(`🎭 Processing class: ${className} (level ${classLevel})`, {
          hasClassFeatures: !!characterClass.definition?.classFeatures,
          classFeatureCount: characterClass.definition?.classFeatures?.length || 0,
          hasSubclass: !!characterClass.subclassDefinition,
          hasSubclassFeatures: !!characterClass.subclassDefinition?.classFeatures,
          subclassFeatureCount: characterClass.subclassDefinition?.classFeatures?.length || 0,
          // Debug: check for other feature sources
          hasCustomFeatures: !!(characterClass as any).classFeatures,
          customFeatureCount: (characterClass as any).classFeatures?.length || 0,
          hasGrantedFeatures: !!(characterClass as any).grantedClassFeatures,
          grantedFeatureCount: (characterClass as any).grantedClassFeatures?.length || 0
        });
      }
      
      // Process base class features
      if (characterClass.definition?.classFeatures) {
        if (FeatureProcessor.debugEnabled) {
          console.log(`🔍 Processing ${characterClass.definition.classFeatures.length} class features for ${className}`);
        }
        const classFeatures = this.extractClassFeatures(
          characterClass.definition.classFeatures,
          className,
          classLevel,
          'class',
          options,
          undefined,
          seenFeatures
        );
        features.push(...classFeatures);
      }

      // Process subclass features
      if (characterClass.subclassDefinition?.classFeatures) {
        if (FeatureProcessor.debugEnabled) {
          console.log(`🔍 Processing ${characterClass.subclassDefinition.classFeatures.length} subclass features for ${className}`);
        }
        const subclassName = characterClass.subclassDefinition.name;
        const subclassFeatures = this.extractClassFeatures(
          characterClass.subclassDefinition.classFeatures,
          className,
          classLevel,
          'subclass',
          options,
          subclassName,
          seenFeatures
        );
        features.push(...subclassFeatures);
      }

      // Check for and process other potential feature sources that might exist in D&D Beyond data
      if ((characterClass as any).classFeatures && Array.isArray((characterClass as any).classFeatures)) {
        if (FeatureProcessor.debugEnabled) {
          console.log(`🔍 Processing additional classFeatures array (${(characterClass as any).classFeatures.length} features)`);
        }
        const additionalFeatures = this.extractClassFeatures(
          (characterClass as any).classFeatures,
          className,
          classLevel,
          'class',
          options,
          undefined,
          seenFeatures
        );
        features.push(...additionalFeatures);
      }

      // Check for granted features (from multiclassing, feats, etc.)
      if ((characterClass as any).grantedClassFeatures && Array.isArray((characterClass as any).grantedClassFeatures)) {
        if (FeatureProcessor.debugEnabled) {
          console.log(`🔍 Processing grantedClassFeatures array (${(characterClass as any).grantedClassFeatures.length} features)`);
        }
        const grantedFeatures = this.extractClassFeatures(
          (characterClass as any).grantedClassFeatures,
          className,
          classLevel,
          'class',
          options,
          undefined,
          seenFeatures
        );
        features.push(...grantedFeatures);
      }
    }

    return features;
  }

  /**
   * Process racial traits from character data
   */
  processRacialTraits(
    characterData: CharacterData,
    options: FeatureProcessingOptions
  ): RacialTrait[] {
    const traits: RacialTrait[] = [];
    const seenTraits = new Set<string>(); // Track processed traits to avoid duplicates

    if (!characterData.race) {
      return traits;
    }

    const raceName = characterData.race.fullName || 'Unknown Race';

    // Process base race traits
    if (characterData.race.racialTraits) {
      const raceTraits = this.extractRacialTraits(
        characterData.race.racialTraits,
        raceName,
        'race',
        options,
        undefined,
        seenTraits
      );
      traits.push(...raceTraits);
    }

    // Process subrace traits
    if (characterData.race.subraceDefinition?.racialTraits) {
      const subraceName = characterData.race.subraceDefinition.name;
      const subraceTraits = this.extractRacialTraits(
        characterData.race.subraceDefinition.racialTraits,
        raceName,
        'subrace',
        options,
        subraceName,
        seenTraits
      );
      traits.push(...subraceTraits);
    }

    return traits;
  }

  /**
   * Generate Fantasy Grounds XML for features (class features only)
   */
  generateFeaturesXML(features: ProcessedFeatures, options: FeatureXMLOptions = this.getDefaultXMLOptions()): string {
    if (features.classFeatures.length > 0) {
      return this.generateClassFeaturesXML(features.classFeatures, options);
    }
    return '';
  }

  /**
   * Generate Fantasy Grounds XML for racial traits (for traitlist section)
   */
  generateTraitsXML(features: ProcessedFeatures, options: FeatureXMLOptions = this.getDefaultXMLOptions()): string {
    if (features.racialTraits.length > 0) {
      return this.generateRacialTraitsXML(features.racialTraits, options);
    }
    return '';
  }

  /**
   * Extract class features from feature array
   */
  private extractClassFeatures(
    featureData: Array<{
      id: number;
      name: string;
      description: string;
      requiredLevel: number;
    }>,
    className: string,
    classLevel: number,
    source: 'class' | 'subclass',
    options: FeatureProcessingOptions,
    subclassName?: string,
    seenFeatures?: Set<string>
  ): ClassFeature[] {
    const features: ClassFeature[] = [];

    for (const featureInfo of featureData) {
      // Create a simple unique key for this feature - use ID as primary deduplication method
      const featureKey = `id:${featureInfo.id}`;
      
      if (FeatureProcessor.debugEnabled) {
        console.log(`🔍 Processing feature: ${featureInfo.name}`, {
          id: featureInfo.id,
          key: featureKey,
          className,
          source,
          level: featureInfo.requiredLevel,
          hasSeenBefore: seenFeatures?.has(featureKey)
        });
      }
      
      // Skip if we've already processed this feature by ID
      if (seenFeatures && seenFeatures.has(featureKey)) {
        if (FeatureProcessor.debugEnabled) {
          console.log(`🔄 Skipping duplicate feature: ${featureInfo.name} (${featureKey})`);
        }
        continue;
      }
      
      // Skip explicitly excluded features
      if (this.shouldSkipFeature(featureInfo.name)) {
        if (FeatureProcessor.debugEnabled) {
          console.log(`🚫 Skipping excluded feature: ${featureInfo.name}`);
        }
        continue;
      }

      // Skip features above character level if filtering is enabled
      if (options.filterByLevel && featureInfo.requiredLevel > classLevel) {
        continue;
      }

      // Skip features above max level
      if (featureInfo.requiredLevel > options.maxLevel) {
        continue;
      }
      
      // Mark this feature as seen
      if (seenFeatures) {
        seenFeatures.add(featureKey);
      }

      const featureType = this.determineFeatureType(featureInfo.name, className);
      const usageInfo = this.determineFeatureUsage(featureInfo.name, className);

      const feature: ClassFeature = {
        id: featureInfo.id,
        name: featureInfo.name,
        description: options.includeDescriptions ? featureInfo.description : '',
        requiredLevel: featureInfo.requiredLevel,
        className: className,
        subclassName: subclassName,
        source: source,
        type: featureType,
        uses: usageInfo,
        mechanics: this.extractFeatureMechanics(featureInfo.name, featureInfo.description)
      };

      // Validate feature before adding
      const validation = FeatureValidator.validateClassFeature(feature);
      if (validation.isValid) {
        features.push(feature);
      } else {
        console.warn(`Invalid class feature: ${feature.name}`, validation.errors);
      }
    }

    return features;
  }

  /**
   * Extract racial traits from trait array
   */
  private extractRacialTraits(
    traitData: Array<{
      id: number;
      definition: {
        id: number;
        name: string;
        description: string;
      };
    }>,
    raceName: string,
    source: 'race' | 'subrace',
    options: FeatureProcessingOptions,
    subraceName?: string,
    seenTraits?: Set<string>
  ): RacialTrait[] {
    const traits: RacialTrait[] = [];

    for (const traitInfo of traitData) {
      // Create a simple unique key for this trait - use ID as primary deduplication method
      const traitKey = `id:${traitInfo.id}`;
      
      if (FeatureProcessor.debugEnabled) {
        console.log(`🔍 Processing trait: ${traitInfo.definition.name}`, {
          id: traitInfo.id,
          key: traitKey,
          raceName,
          source,
          hasSeenBefore: seenTraits?.has(traitKey)
        });
      }
      
      // Skip if we've already processed this trait by ID
      if (seenTraits && seenTraits.has(traitKey)) {
        if (FeatureProcessor.debugEnabled) {
          console.log(`🔄 Skipping duplicate trait: ${traitInfo.definition.name} (${traitKey})`);
        }
        continue;
      }

      // Skip explicitly excluded traits
      if (this.shouldSkipTrait(traitInfo.definition.name)) {
        if (FeatureProcessor.debugEnabled) {
          console.log(`🚫 Skipping excluded trait: ${traitInfo.definition.name}`);
        }
        continue;
      }
      
      // Mark this trait as seen
      if (seenTraits) {
        seenTraits.add(traitKey);
      }

      const traitType = this.determineTraitType(traitInfo.definition.name, raceName);
      const mechanics = this.extractTraitMechanics(traitInfo.definition.name, traitInfo.definition.description);

      const trait: RacialTrait = {
        id: traitInfo.id,
        name: traitInfo.definition.name,
        description: options.includeDescriptions ? traitInfo.definition.description : '',
        raceName: raceName,
        suraceName: subraceName,
        source: source,
        type: traitType,
        mechanics: mechanics
      };

      // Validate trait before adding
      const validation = FeatureValidator.validateRacialTrait(trait);
      if (validation.isValid) {
        traits.push(trait);
      } else {
        console.warn(`Invalid racial trait: ${trait.name}`, validation.errors);
      }
    }

    return traits;
  }

  /**
   * Determine feature type based on name and class
   */
  private determineFeatureType(featureName: string, className: string): 'passive' | 'active' | 'resource' | 'spell' {
    // Handle null/undefined className
    if (!className || typeof className !== 'string') {
      className = 'unknown';
    }
    
    const classTypes = CLASS_FEATURE_TYPES[className.toLowerCase()];
    if (classTypes && classTypes[featureName]) {
      return classTypes[featureName] as 'passive' | 'active' | 'resource' | 'spell';
    }

    // Handle null/undefined featureName
    if (!featureName || typeof featureName !== 'string') {
      return 'passive';
    }

    // Default categorization based on common patterns
    if (featureName.toLowerCase().includes('spellcasting')) return 'spell';
    if (featureName.toLowerCase().includes('rage') || featureName.toLowerCase().includes('action surge')) return 'resource';
    if (featureName.toLowerCase().includes('attack') || featureName.toLowerCase().includes('maneuver')) return 'active';
    
    return 'passive'; // Default for most features
  }

  /**
   * Determine trait type based on name and race
   */
  private determineTraitType(traitName: string, raceName: string): 'passive' | 'active' | 'spell' | 'proficiency' {
    // Handle null/undefined raceName
    if (!raceName || typeof raceName !== 'string') {
      raceName = 'unknown';
    }
    
    const raceTypes = RACIAL_TRAIT_TYPES[raceName.toLowerCase()];
    if (raceTypes && raceTypes[traitName]) {
      return raceTypes[traitName] as 'passive' | 'active' | 'spell' | 'proficiency';
    }

    // Handle null/undefined traitName
    if (!traitName || typeof traitName !== 'string') {
      return 'passive';
    }

    // Default categorization
    if (traitName.toLowerCase().includes('proficiency') || traitName.toLowerCase().includes('training')) return 'proficiency';
    if (traitName.toLowerCase().includes('spell') || traitName.toLowerCase().includes('cantrip')) return 'spell';
    if (traitName.toLowerCase().includes('breath') || traitName.toLowerCase().includes('endurance')) return 'active';
    
    return 'passive';
  }

  /**
   * Determine feature usage information
   */
  private determineFeatureUsage(featureName: string, className: string): FeatureUsage | undefined {
    // Handle null/undefined featureName
    if (!featureName || typeof featureName !== 'string') {
      return undefined;
    }
    
    // Handle null/undefined className
    if (!className || typeof className !== 'string') {
      className = 'unknown';
    }
    
    const featureKey = featureName.toLowerCase();
    
    // Known resource features with specific usage patterns
    if (featureKey.includes('rage') && className.toLowerCase() === 'barbarian') {
      return { type: 'long_rest', amount: 1, rechargeOn: 'long_rest' };
    }
    
    if (featureKey.includes('action surge') && className.toLowerCase() === 'fighter') {
      return { type: 'short_rest', amount: 1, rechargeOn: 'short_rest' };
    }
    
    if (featureKey.includes('second wind') && className.toLowerCase() === 'fighter') {
      return { type: 'short_rest', amount: 1, rechargeOn: 'short_rest' };
    }

    return undefined; // Most features don't have usage limits
  }

  /**
   * Extract feature mechanics from description
   */
  private extractFeatureMechanics(name: string, description: string): ClassFeature['mechanics'] {
    // This is a simplified extraction - in a full implementation,
    // you'd parse the description for damage dice, ranges, etc.
    return undefined;
  }

  /**
   * Extract trait mechanics from description
   */
  private extractTraitMechanics(name: string, description: string): RacialTrait['mechanics'] {
    const mechanics: RacialTrait['mechanics'] = {};
    
    // Extract darkvision range
    if (name.toLowerCase().includes('darkvision')) {
      const match = description.match(/(\d+)\s*feet/i);
      if (match) {
        mechanics.darkvisionRange = parseInt(match[1]);
      }
    }
    
    // Extract speed bonuses
    if (name.toLowerCase().includes('fleet') || name.toLowerCase().includes('swift')) {
      mechanics.speed = 35; // Common speed increase
    }

    return Object.keys(mechanics).length > 0 ? mechanics : undefined;
  }

  /**
   * Generate XML for class features
   */
  private generateClassFeaturesXML(features: ClassFeature[], options: FeatureXMLOptions): string {
    let xml = '';
    
    features.forEach((feature, index) => {
      const featureId = String(index + 1).padStart(5, '0');
      const sanitizedName = options.sanitizeText ? StringSanitizer.sanitizeForXML(feature.name) : feature.name;
      const sanitizedDescription = options.sanitizeText && feature.description
        ? StringSanitizer.sanitizeForXML(feature.description)
        : feature.description || '';

      xml += `      <id-${featureId}>
        <locked type="number">1</locked>
        <name type="string">${sanitizedName}</name>
        <text type="formattedtext">
          <p>${sanitizedDescription}</p>
        </text>
        <source type="string">${feature.className}${feature.subclassName ? ` (${feature.subclassName})` : ''}</source>
      </id-${featureId}>
`;
    });

    return xml;
  }

  /**
   * Generate XML for racial traits
   */
  private generateRacialTraitsXML(traits: RacialTrait[], options: FeatureXMLOptions): string {
    let xml = '';
    
    traits.forEach((trait, index) => {
      const traitId = String(index + 1000).padStart(5, '0'); // Offset to avoid conflicts
      const sanitizedName = options.sanitizeText ? StringSanitizer.sanitizeForXML(trait.name) : trait.name;
      const sanitizedDescription = options.sanitizeText && trait.description
        ? StringSanitizer.sanitizeForXML(trait.description)
        : trait.description || '';

      xml += `      <id-${traitId}>
        <locked type="number">1</locked>
        <name type="string">${sanitizedName}</name>
        <text type="formattedtext">
          <p>${sanitizedDescription}</p>
        </text>
        <source type="string">${trait.raceName}${trait.suraceName ? ` (${trait.suraceName})` : ''}</source>
      </id-${traitId}>
`;
    });

    return xml;
  }

  /**
   * Group features by class
   */
  private groupFeaturesByClass(features: ClassFeature[]): Record<string, ClassFeature[]> {
    return features.reduce((grouped, feature) => {
      const key = feature.subclassName 
        ? `${feature.className} (${feature.subclassName.toLowerCase()})`
        : feature.className;
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(feature);
      return grouped;
    }, {} as Record<string, ClassFeature[]>);
  }

  /**
   * Group traits by race
   */
  private groupTraitsByRace(traits: RacialTrait[]): Record<string, RacialTrait[]> {
    return traits.reduce((grouped, trait) => {
      const key = trait.suraceName 
        ? `${trait.raceName.toLowerCase()} (${trait.suraceName.toLowerCase()})`
        : trait.raceName.toLowerCase();
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(trait);
      return grouped;
    }, {} as Record<string, RacialTrait[]>);
  }

  /**
   * Build class breakdown for debug info
   */
  private buildClassBreakdown(characterData: CharacterData, features: ClassFeature[]): ProcessedFeatures['debugInfo']['classBreakdown'] {
    return characterData.classes.map(cls => ({
      className: cls.definition?.name || 'Unknown',
      level: cls.level || 1,
      featureCount: features.filter(f => f.className === cls.definition?.name?.toLowerCase()).length,
      subclass: cls.subclassDefinition?.name
    }));
  }

  /**
   * Build race breakdown for debug info
   */
  private buildRaceBreakdown(characterData: CharacterData, traits: RacialTrait[]): ProcessedFeatures['debugInfo']['raceBreakdown'] {
    return {
      raceName: characterData.race?.fullName || 'Unknown Race',
      subraceName: characterData.race?.subraceDefinition?.name,
      traitCount: traits.length
    };
  }

  /**
   * Get default processing options
   */
  private getDefaultOptions(): FeatureProcessingOptions {
    return {
      includeSubclassFeatures: true,
      includeRacialTraits: true,
      includeDescriptions: true,
      filterByLevel: true,
      maxLevel: 20
    };
  }

  /**
   * Get default XML options
   */
  private getDefaultXMLOptions(): FeatureXMLOptions {
    return {
      includeDescriptions: true,
      includeUsageLimits: true,
      groupBySource: true,
      sanitizeText: true
    };
  }

  /**
   * Check if a feature should be skipped based on exclusion rules
   */
  private shouldSkipFeature(featureName: string): boolean {
    if (!featureName || typeof featureName !== 'string') {
      return false;
    }

    const excludedFeatures = [
      'Proficiencies',
      'Ability Score Increase',
      'Core Sorcerer Traits',
      'Metamagic Options'
    ];

    const featureNameLower = featureName.toLowerCase();
    return excludedFeatures.some(excluded => 
      featureNameLower.includes(excluded.toLowerCase())
    );
  }

  /**
   * Check if a racial trait should be skipped based on exclusion rules
   */
  private shouldSkipTrait(traitName: string): boolean {
    if (!traitName || typeof traitName !== 'string') {
      return false;
    }

    const excludedTraits = [
      'Proficiencies',
      'Ability Score Increase',
      'Core Sorcerer Traits',
      'Metamagic Options'
    ];

    const traitNameLower = traitName.toLowerCase();
    return excludedTraits.some(excluded => 
      traitNameLower.includes(excluded.toLowerCase())
    );
  }

  /**
   * Validate character data for feature processing
   */
  static validateCharacterData(characterData: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!characterData) {
      errors.push('Character data is required');
      return { isValid: false, errors };
    }
    
    if (!characterData.classes || !Array.isArray(characterData.classes)) {
      errors.push('Character classes must be an array');
    }
    
    if (!characterData.race) {
      errors.push('Character race is required');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}