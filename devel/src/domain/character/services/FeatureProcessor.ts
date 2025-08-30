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
  Feat,
  ProcessedFeatures,
  FeatureXMLOptions,
  CLASS_FEATURE_TYPES,
  RACIAL_TRAIT_TYPES,
  FEAT_TYPES,
  FeatureValidator,
  FeatureLevel,
  FeatureUsage
} from '@/domain/character/models/Features';
import { featureFlags } from '@/core/FeatureFlags';
import { StringSanitizer } from '@/shared/utils/StringSanitizer';
import { TraitProcessor } from './TraitProcessor';

export interface FeatureProcessingOptions {
  includeSubclassFeatures: boolean;
  includeRacialTraits: boolean;
  includeFeats: boolean;
  includeDescriptions: boolean;
  filterByLevel: boolean;
  maxLevel: number;
}

// Import the actual CharacterData interface from CharacterFetcher
import type { CharacterData } from '@/domain/character/services/CharacterFetcher';

export class FeatureProcessor {
  private static debugEnabled: boolean = false;
  private traitProcessor: TraitProcessor;

  constructor() {
    // Enable debug mode if feature flag is set
    if (featureFlags.isEnabled('feature_processor_debug')) {
      FeatureProcessor.debugEnabled = true;
    }
    this.traitProcessor = new TraitProcessor();
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
        featCount: characterData.feats?.length || 0,
        options
      });
    }

    const classFeatures = options.includeSubclassFeatures 
      ? this.processClassFeatures(characterData, options)
      : [];
    
    const racialTraits = options.includeRacialTraits 
      ? this.processRacialTraits(characterData, options)
      : [];

    const feats = options.includeFeats
      ? this.processFeats(characterData, options)
      : [];

    const featuresByClass = this.groupFeaturesByClass(classFeatures);
    const traitsByRace = this.groupTraitsByRace(racialTraits);
    const featsByCategory = this.groupFeatsByCategory(feats);

    const result: ProcessedFeatures = {
      classFeatures,
      racialTraits,
      feats,
      totalFeatures: classFeatures.length + racialTraits.length + feats.length,
      featuresByClass,
      traitsByRace,
      featsByCategory,
      debugInfo: {
        processingMethod: characterData.classes.length > 1 ? 'multiclass' : 'single_class',
        classBreakdown: this.buildClassBreakdown(characterData, classFeatures),
        raceBreakdown: this.buildRaceBreakdown(characterData, racialTraits),
        featBreakdown: this.buildFeatBreakdown(characterData, feats),
        warnings: []
      }
    };

    if (FeatureProcessor.debugEnabled || featureFlags.isEnabled('feature_processor_debug')) {
      console.log('🎭 FeatureProcessor: Result', {
        totalFeatures: result.totalFeatures,
        classFeatureCount: classFeatures.length,
        racialTraitCount: racialTraits.length,
        featCount: feats.length,
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
    const seenFeatureNames = new Set<string>(); // Track feature names to avoid name-based duplicates

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
          seenFeatures,
          seenFeatureNames
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
          seenFeatures,
          seenFeatureNames
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
          seenFeatures,
          seenFeatureNames
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
          seenFeatures,
          seenFeatureNames
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
      if (FeatureProcessor.debugEnabled) {
        console.log('No race data found in character');
      }
      return traits;
    }

    const raceName = characterData.race.fullName || characterData.race.baseName || 'Unknown Race';

    if (FeatureProcessor.debugEnabled) {
      console.log(`🔍 Processing racial traits for: ${raceName}`);
      console.log('🔍 Full race data structure:', JSON.stringify(characterData.race, null, 2));
      
      // Check all possible locations for racial traits
      console.log('🔍 Checking race.racialTraits:', !!characterData.race.racialTraits);
      console.log('🔍 Checking race.traits:', !!characterData.race.traits);
      console.log('🔍 Checking race.features:', !!characterData.race.features);
      console.log('🔍 Checking race.raceTraits:', !!characterData.race.raceTraits);
      console.log('🔍 Checking race.definition:', !!characterData.race.definition);
      
      if (characterData.race.definition) {
        console.log('🔍 Checking race.definition.racialTraits:', !!characterData.race.definition.racialTraits);
        console.log('🔍 Checking race.definition.traits:', !!characterData.race.definition.traits);
      }
      
      // Log all top-level properties of race object
      console.log('🔍 Race object keys:', Object.keys(characterData.race));
    }

    // Try multiple possible locations for racial traits
    let racialTraitsArray: any[] | null = null;
    let source = '';

    // Check race.racialTraits
    if (characterData.race.racialTraits && Array.isArray(characterData.race.racialTraits)) {
      racialTraitsArray = characterData.race.racialTraits;
      source = 'race.racialTraits';
    }
    // Check race.traits
    else if (characterData.race.traits && Array.isArray(characterData.race.traits)) {
      racialTraitsArray = characterData.race.traits;
      source = 'race.traits';
    }
    // Check race.features
    else if (characterData.race.features && Array.isArray(characterData.race.features)) {
      racialTraitsArray = characterData.race.features;
      source = 'race.features';
    }
    // Check race.definition.racialTraits
    else if (characterData.race.definition?.racialTraits && Array.isArray(characterData.race.definition.racialTraits)) {
      racialTraitsArray = characterData.race.definition.racialTraits;
      source = 'race.definition.racialTraits';
    }
    // Check race.definition.traits
    else if (characterData.race.definition?.traits && Array.isArray(characterData.race.definition.traits)) {
      racialTraitsArray = characterData.race.definition.traits;
      source = 'race.definition.traits';
    }

    if (racialTraitsArray && racialTraitsArray.length > 0) {
      if (FeatureProcessor.debugEnabled) {
        console.log(`🎯 Found ${racialTraitsArray.length} racial traits in ${source}`);
        console.log('🎯 Sample trait structure:', JSON.stringify(racialTraitsArray[0], null, 2));
      }
      
      const raceTraits = this.extractRacialTraits(
        racialTraitsArray,
        raceName,
        'race',
        options,
        undefined,
        seenTraits
      );
      traits.push(...raceTraits);
    } else {
      if (FeatureProcessor.debugEnabled) {
        console.log('❌ No racial traits array found in any expected location');
      }
    }

    // Process subrace traits
    if (characterData.race.subraceDefinition?.racialTraits && Array.isArray(characterData.race.subraceDefinition.racialTraits)) {
      const subraceName = characterData.race.subraceDefinition.name;
      if (FeatureProcessor.debugEnabled) {
        console.log(`Found ${characterData.race.subraceDefinition.racialTraits.length} subrace traits for: ${subraceName}`);
      }
      
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

    if (FeatureProcessor.debugEnabled) {
      console.log(`🏁 Final trait count: ${traits.length}`);
      if (traits.length > 0) {
        console.log('🏁 Extracted traits:', traits.map(t => t.name));
      }
    }

    return traits;
  }

  /**
   * Process feats from character data
   */
  processFeats(
    characterData: CharacterData,
    options: FeatureProcessingOptions
  ): Feat[] {
    const feats: Feat[] = [];
    const seenFeats = new Set<string>(); // Track processed feats to avoid duplicates

    if (!characterData.feats || !Array.isArray(characterData.feats)) {
      if (FeatureProcessor.debugEnabled) {
        console.log('No feats data found in character');
      }
      return feats;
    }

    if (FeatureProcessor.debugEnabled) {
      console.log(`🔍 Processing ${characterData.feats.length} feats from character data`);
    }

    for (const featInfo of characterData.feats) {

      // Handle different feat data structures
      let id: number;
      let name: string;
      let description: string;
      let prerequisite: string | undefined;
      let isRepeatable: boolean;
      let categories: any[] = [];

      // Try different possible structures
      if (featInfo.definition) {
        // Standard structure: {componentTypeId, componentId, definition: {id, name, description, ...}}
        id = featInfo.definition.id;
        name = featInfo.definition.name;
        description = featInfo.definition.description;
        prerequisite = featInfo.definition.prerequisite || undefined;
        isRepeatable = featInfo.definition.isRepeatable || false;
        categories = featInfo.definition.categories || [];
      } else if (featInfo.name) {
        // Direct structure: {id, name, description, ...}
        id = featInfo.id || 0;
        name = featInfo.name;
        description = featInfo.description || '';
        prerequisite = featInfo.prerequisite || undefined;
        isRepeatable = featInfo.isRepeatable || false;
        categories = featInfo.categories || [];
      } else {
        if (FeatureProcessor.debugEnabled) {
          console.log(`🚫 Skipping feat with unrecognized structure:`, featInfo);
        }
        continue;
      }

      // Create a unique key for this feat (use ID as primary, since same feat name can have different IDs for different levels/sources)
      const featKey = id ? `id:${id}` : `name:${name}`;
      
      // Skip if we've already processed this exact feat (same ID)
      if (seenFeats.has(featKey)) {
        if (FeatureProcessor.debugEnabled) {
          console.log(`🔄 Skipping duplicate feat: ${name} (ID: ${id})`);
        }
        continue;
      }

      // Skip explicitly excluded feats
      if (this.shouldSkipFeat(name)) {
        if (FeatureProcessor.debugEnabled) {
          console.log(`🚫 Skipping excluded feat: ${name}`);
        }
        continue;
      }
      
      // Mark this feat as seen
      seenFeats.add(featKey);

      const featType = this.determineFeatType(name, categories);
      const featCategory = this.determineFeatCategory(name, categories);
      const mechanics = this.extractFeatMechanics(name, description);

      const feat: Feat = {
        id: id,
        name: name,
        description: options.includeDescriptions ? description : '',
        prerequisite: prerequisite,
        category: featCategory,
        type: featType,
        isRepeatable: isRepeatable,
        mechanics: mechanics
      };

      // Validate feat before adding
      const validation = FeatureValidator.validateFeat(feat);
      if (validation.isValid) {
        feats.push(feat);
        if (FeatureProcessor.debugEnabled) {
          console.log(`✅ Added feat: ${name} (${featType} - ${featCategory})`);
        }
      } else {
        console.warn(`Invalid feat: ${feat.name}`, validation.errors);
      }
    }

    // Consolidate repeatable feats for display (group by name, keep only one instance)
    const consolidatedFeats = this.consolidateRepeatableFeats(feats);

    if (FeatureProcessor.debugEnabled) {
      console.log(`🏁 Processed ${feats.length} raw feats, consolidated to ${consolidatedFeats.length} display feats${consolidatedFeats.length > 0 ? ': ' + consolidatedFeats.map(f => f.name).join(', ') : ''}`);
    }

    return consolidatedFeats;
  }

  /**
   * Consolidate repeatable feats for display
   * Groups feats by name and keeps only the first instance of each
   */
  private consolidateRepeatableFeats(feats: Feat[]): Feat[] {
    const seenFeatNames = new Set<string>();
    const consolidatedFeats: Feat[] = [];

    for (const feat of feats) {
      // Clean the feat name by removing level prefixes like "4: "
      const cleanName = feat.name.replace(/^\d+:\s*/, '').trim();
      
      if (!seenFeatNames.has(cleanName)) {
        // First time seeing this feat name - add it with cleaned name
        const consolidatedFeat: Feat = {
          ...feat,
          name: cleanName,
          // If this is repeatable, update the description to indicate multiple instances
          description: feat.isRepeatable && feats.filter(f => f.name.replace(/^\d+:\s*/, '').trim() === cleanName).length > 1
            ? `${feat.description}\n\n(This feat has been taken multiple times)`
            : feat.description
        };
        
        consolidatedFeats.push(consolidatedFeat);
        seenFeatNames.add(cleanName);
        
        if (FeatureProcessor.debugEnabled) {
          const instances = feats.filter(f => f.name.replace(/^\d+:\s*/, '').trim() === cleanName);
          if (instances.length > 1) {
            console.log(`🔄 Consolidated ${instances.length} instances of "${cleanName}" feat`);
          }
        }
      }
    }

    return consolidatedFeats;
  }

  /**
   * Generate Fantasy Grounds XML for features (class features and racial traits for featurelist section)
   */
  generateFeaturesXML(features: ProcessedFeatures, options: FeatureXMLOptions = this.getDefaultXMLOptions()): string {
    let xml = '';

    // Generate class features XML only (racial traits are handled separately in traitlist section)
    if (features.classFeatures.length > 0) {
      xml += this.generateClassFeaturesXML(features.classFeatures, options);
    }

    // Note: Racial traits are no longer included in featurelist section per user request
    // They are still processed and available via generateTraitsXML() for the traitlist section

    return xml;
  }

  /**
   * Generate Fantasy Grounds XML for all character traits (racial, background, feat)
   */
  generateTraitsXML(characterData: CharacterData): string {
    const traits = this.traitProcessor.processAllTraits(characterData);
    return this.traitProcessor.generateTraitsXML(traits);
  }

  /**
   * Generate Fantasy Grounds XML for feats (for featlist section)
   */
  generateFeatsXML(features: ProcessedFeatures, options: FeatureXMLOptions = this.getDefaultXMLOptions()): string {
    if (features.feats.length > 0) {
      return this.generateFeatListXML(features.feats, options);
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
    seenFeatures?: Set<string>,
    seenFeatureNames?: Set<string>
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
          console.log(`🔄 Skipping duplicate feature by ID: ${featureInfo.name} (${featureKey})`);
        }
        continue;
      }
      
      // Skip if we've already processed a feature with this name (name-based deduplication)
      const normalizedName = this.normalizeFeatureName(featureInfo.name);
      if (seenFeatureNames && seenFeatureNames.has(normalizedName)) {
        if (FeatureProcessor.debugEnabled) {
          console.log(`🔄 Skipping duplicate feature by name: ${featureInfo.name} (normalized: ${normalizedName})`);
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
      
      // Mark this feature as seen (both by ID and name)
      if (seenFeatures) {
        seenFeatures.add(featureKey);
      }
      if (seenFeatureNames) {
        seenFeatureNames.add(normalizedName);
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
    traitData: any[],
    raceName: string,
    source: 'race' | 'subrace',
    options: FeatureProcessingOptions,
    subraceName?: string,
    seenTraits?: Set<string>
  ): RacialTrait[] {
    const traits: RacialTrait[] = [];

    for (const traitInfo of traitData) {
      if (FeatureProcessor.debugEnabled) {
        console.log(`🔍 Raw trait data:`, JSON.stringify(traitInfo, null, 2));
      }

      // Handle different trait data structures
      let id: number;
      let name: string;
      let description: string;

      // Try different possible structures
      if (traitInfo.definition) {
        // Standard structure: {id: number, definition: {id, name, description}}
        id = traitInfo.id;
        name = traitInfo.definition.name;
        description = traitInfo.definition.description;
      } else if (traitInfo.name) {
        // Direct structure: {id, name, description}
        id = traitInfo.id || 0;
        name = traitInfo.name;
        description = traitInfo.description || '';
      } else {
        if (FeatureProcessor.debugEnabled) {
          console.log(`🚫 Skipping trait with unrecognized structure:`, traitInfo);
        }
        continue;
      }

      // Create a unique key for this trait
      const traitKey = id ? `id:${id}` : `name:${name}`;
      
      if (FeatureProcessor.debugEnabled) {
        console.log(`🔍 Processing trait: ${name}`, {
          id,
          key: traitKey,
          raceName,
          source,
          hasSeenBefore: seenTraits?.has(traitKey)
        });
      }
      
      // Skip if we've already processed this trait
      if (seenTraits && seenTraits.has(traitKey)) {
        if (FeatureProcessor.debugEnabled) {
          console.log(`🔄 Skipping duplicate trait: ${name} (${traitKey})`);
        }
        continue;
      }

      // Skip explicitly excluded traits
      if (this.shouldSkipTrait(name)) {
        if (FeatureProcessor.debugEnabled) {
          console.log(`🚫 Skipping excluded trait: ${name}`);
        }
        continue;
      }
      
      // Mark this trait as seen
      if (seenTraits) {
        seenTraits.add(traitKey);
      }

      const traitType = this.determineTraitType(name, raceName);
      const mechanics = this.extractTraitMechanics(name, description);

      const trait: RacialTrait = {
        id: id,
        name: name,
        description: options.includeDescriptions ? description : '',
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
        if (FeatureProcessor.debugEnabled) {
          console.log(`✅ Added trait: ${name}`);
        }
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
        ? StringSanitizer.sanitizeForXML(feature.description, { maxLength: 10000 }) // Allow longer descriptions
        : feature.description || '';

      xml += `      <id-${featureId}>`;

      // Add level if available
      if (feature.requiredLevel && feature.requiredLevel > 0) {
        xml += `
        <level type="number">${feature.requiredLevel}</level>`;
      }

      xml += `
        <locked type="number">1</locked>
        <name type="string">${sanitizedName}</name>`;

      // Add specialization for subclass features
      if (feature.subclassName && feature.source === 'subclass') {
        xml += `
        <specialization type="string">${feature.subclassName}</specialization>`;
      }

      xml += `
        <text type="formattedtext">
          <p>${sanitizedDescription}</p>
        </text>`;

      // Add group information for better organization
      const groupName = feature.subclassName 
        ? `Class (${this.capitalizeFirst(feature.className)} - ${feature.subclassName})`
        : `Class (${this.capitalizeFirst(feature.className)})`;
      
      xml += `
        <group type="string">${groupName}</group>`;

      xml += `
      </id-${featureId}>
`;
    });

    return xml;
  }

  /**
   * Generate XML for racial traits (for featurelist section)
   */
  private generateRacialTraitsForFeatureList(traits: RacialTrait[], options: FeatureXMLOptions): string {
    let xml = '';
    
    traits.forEach((trait, index) => {
      const traitId = String(index + 500).padStart(5, '0'); // Different offset for featurelist
      const sanitizedName = options.sanitizeText ? StringSanitizer.sanitizeForXML(trait.name) : trait.name;
      const sanitizedDescription = options.sanitizeText && trait.description
        ? StringSanitizer.sanitizeForXML(trait.description, { maxLength: 10000 })
        : trait.description || '';

      xml += `      <id-${traitId}>
        <level type="number">1</level>
        <locked type="number">1</locked>
        <name type="string">${sanitizedName}</name>`;

      // Add specialization if it's a subrace trait
      if (trait.suraceName) {
        xml += `
        <specialization type="string">${trait.suraceName}</specialization>`;
      }

      xml += `
        <text type="formattedtext">
          <p>${sanitizedDescription}</p>
        </text>
      </id-${traitId}>
`;
    });

    return xml;
  }

  /**
   * Generate XML for racial traits (for traitlist section)
   */
  private generateRacialTraitsXML(traits: RacialTrait[], options: FeatureXMLOptions): string {
    let xml = '';
    
    traits.forEach((trait, index) => {
      const traitId = String(index + 1000).padStart(5, '0'); // Offset to avoid conflicts
      const sanitizedName = options.sanitizeText ? StringSanitizer.sanitizeForXML(trait.name) : trait.name;
      const sanitizedDescription = options.sanitizeText && trait.description
        ? StringSanitizer.sanitizeForXML(trait.description, { maxLength: 10000 })
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
   * Generate XML for feats
   */
  private generateFeatListXML(feats: Feat[], options: FeatureXMLOptions): string {
    let xml = '';
    
    feats.forEach((feat, index) => {
      const featId = String(index + 2000).padStart(5, '0'); // Offset to avoid conflicts with features/traits
      const sanitizedName = options.sanitizeText ? StringSanitizer.sanitizeForXML(feat.name) : feat.name;
      const sanitizedDescription = options.sanitizeText && feat.description
        ? StringSanitizer.sanitizeForXML(feat.description, { maxLength: 10000 })
        : feat.description || '';

      xml += `      <id-${featId}>
        <locked type="number">1</locked>
        <name type="string">${sanitizedName}</name>
        <text type="formattedtext">
          <p>${sanitizedDescription}</p>
        </text>
        <source type="string">${feat.category}${feat.prerequisite ? ` (Prereq: ${feat.prerequisite})` : ''}</source>
      </id-${featId}>
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
   * Group feats by category
   */
  private groupFeatsByCategory(feats: Feat[]): Record<string, Feat[]> {
    return feats.reduce((grouped, feat) => {
      const key = feat.type || 'general';
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(feat);
      return grouped;
    }, {} as Record<string, Feat[]>);
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
   * Build feat breakdown for debug info
   */
  private buildFeatBreakdown(characterData: CharacterData, feats: Feat[]): ProcessedFeatures['debugInfo']['featBreakdown'] {
    return {
      totalFeats: feats.length,
      originFeats: feats.filter(f => f.type === 'origin').length,
      generalFeats: feats.filter(f => f.type === 'general').length,
      featCount: feats.length
    };
  }

  /**
   * Get default processing options
   */
  private getDefaultOptions(): FeatureProcessingOptions {
    return {
      includeSubclassFeatures: true,
      includeRacialTraits: true,
      includeFeats: true,
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
   * Normalize feature name for duplicate detection
   * Removes level prefixes like "4: Weapon Mastery" -> "Weapon Mastery"
   */
  private normalizeFeatureName(featureName: string): string {
    if (!featureName || typeof featureName !== 'string') {
      return '';
    }
    
    // Remove level prefixes like "4: ", "10: ", etc.
    return featureName.replace(/^\d+:\s*/, '').trim();
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
      'Ability Score Improvement',
      'Core Sorcerer Traits',
      'Core Barbarian Traits',
      'Core Bard Traits',
      'Core Cleric Traits',
      'Core Druid Traits',
      'Core Fighter Traits',
      'Core Monk Traits',
      'Core Paladin Traits',
      'Core Ranger Traits',
      'Core Rogue Traits',
      'Core Warlock Traits',
      'Core Wizard Traits',
      'Metamagic Options',
      'Creature Type',
      'Hit Points',
      'Bonus Proficiency',
      'Subclass'
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
      'Languages', // Handled in languagelist section
      'Age',       // Basic character info, not needed as trait
      'Size',      // Basic character info, not needed as trait  
      'Speed',     // Basic character info, not needed as trait
      'Core Sorcerer Traits',
      'Metamagic Options'
    ];

    const traitNameLower = traitName.toLowerCase();
    return excludedTraits.some(excluded => 
      traitNameLower.includes(excluded.toLowerCase())
    );
  }

  /**
   * Check if a feat should be skipped based on exclusion rules
   */
  private shouldSkipFeat(featName: string): boolean {
    if (!featName || typeof featName !== 'string') {
      return false;
    }

    const excludedFeats = [
      'Ability Score Improvement', // This is handled separately
      'Core Class Traits',
      'Fighting Style', // This might be handled as class features instead
    ];

    const featNameLower = featName.toLowerCase();
    return excludedFeats.some(excluded => 
      featNameLower.includes(excluded.toLowerCase())
    );
  }

  /**
   * Determine feat type based on name and categories
   */
  private determineFeatType(featName: string, categories: any[]): 'origin' | 'general' | 'fighting_style' | 'epic_boon' {
    // Handle null/undefined featName
    if (!featName || typeof featName !== 'string') {
      return 'general';
    }

    // Check categories first for explicit type information
    if (categories && Array.isArray(categories)) {
      for (const category of categories) {
        const tagName = category.tagName?.toLowerCase();
        if (tagName === 'origin') return 'origin';
        if (tagName === 'fighting style') return 'fighting_style';
        if (tagName === 'epic boon' || tagName === 'epic') return 'epic_boon';
      }
    }

    // Check predefined feat types
    const featType = FEAT_TYPES[featName];
    if (featType) {
      return featType as 'origin' | 'general' | 'fighting_style' | 'epic_boon';
    }

    // Default categorization based on common patterns
    const featNameLower = featName.toLowerCase();
    if (featNameLower.includes('fighting style')) return 'fighting_style';
    if (featNameLower.includes('epic') || featNameLower.includes('boon')) return 'epic_boon';
    
    return 'general'; // Default for most feats
  }

  /**
   * Determine feat category based on name and categories
   */
  private determineFeatCategory(featName: string, categories: any[]): string {
    // Handle null/undefined featName
    if (!featName || typeof featName !== 'string') {
      return 'General';
    }

    // Check categories for explicit category information
    if (categories && Array.isArray(categories) && categories.length > 0) {
      // Use the first category's tagName as the category
      const firstCategory = categories[0];
      if (firstCategory && firstCategory.tagName) {
        return firstCategory.tagName;
      }
    }

    // Default categorization based on feat type
    const featType = this.determineFeatType(featName, categories);
    switch (featType) {
      case 'origin': return 'Origin';
      case 'fighting_style': return 'Fighting Style';
      case 'epic_boon': return 'Epic Boon';
      default: return 'General';
    }
  }

  /**
   * Extract feat mechanics from description
   */
  private extractFeatMechanics(name: string, description: string): Feat['mechanics'] {
    const mechanics: Feat['mechanics'] = {};
    
    if (!name || !description) {
      return undefined;
    }

    const nameLower = name.toLowerCase();
    const descLower = description.toLowerCase();

    // Extract ability score increases
    if (descLower.includes('increase') && descLower.includes('ability score')) {
      mechanics.abilityScoreIncrease = {
        count: 1, // Most feats give +1 to one or two scores
        abilities: [] // Would need more complex parsing to determine which abilities
      };
    }

    // Extract proficiency bonuses
    if (descLower.includes('proficiency') && descLower.includes('add')) {
      mechanics.initiative = nameLower.includes('alert');
    }

    // Extract specific feat mechanics based on name
    if (nameLower.includes('alert')) {
      mechanics.initiative = true;
    }

    if (nameLower.includes('tough')) {
      mechanics.hitPoints = 2; // +2 HP per level
    }

    return Object.keys(mechanics).length > 0 ? mechanics : undefined;
  }

  /**
   * Capitalize the first letter of a string
   */
  private capitalizeFirst(str: string): string {
    if (!str || typeof str !== 'string') return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
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