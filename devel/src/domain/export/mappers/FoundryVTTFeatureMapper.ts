/**
 * FoundryVTTFeatureMapper - Feature to Foundry VTT Item Conversion
 * 
 * Converts D&D Beyond features (class features, racial traits, feats) to
 * Foundry VTT Item format. Creates feature Items with appropriate Active Effects
 * for features that modify character statistics or provide mechanical benefits.
 * 
 * Features are mapped as:
 * - Class Features -> "feat" type Items with "Class" activation type
 * - Racial Traits -> "feat" type Items with "Passive" activation type  
 * - Feats -> "feat" type Items with activation based on usage
 */

import type { 
  ClassFeature, 
  RacialTrait, 
  Feat, 
  ProcessedFeatures 
} from '@/domain/character/models/Features';
import type { 
  FoundryItem, 
  FoundryActiveEffect 
} from './FoundryVTTMapper';
import { StringSanitizer } from '@/shared/utils/StringSanitizer';
import { generateId } from '@/shared/utils/IdGenerator';
import { featureFlags } from '@/core/FeatureFlags';

/**
 * Foundry VTT Feature Item System Data
 */
interface FoundryFeatureSystemData {
  description: {
    value: string;
    chat?: string;
  };
  source?: {
    book: string;
    page?: number;
    license?: string;
    custom?: string;
  };
  activation?: {
    type: string; // "none", "action", "bonus", "reaction", "minute", "hour", "day"
    cost: number;
    condition?: string;
  };
  duration?: {
    value: number | null;
    units: string; // "inst", "turn", "round", "minute", "hour", "day", "perm"
  };
  target?: {
    value: number | null;
    units: string; // "self", "touch", "ft", "mi", etc.
    type: string; // "self", "ally", "enemy", "object", etc.
  };
  range?: {
    value: number | null;
    long: number | null;
    units: string;
  };
  uses?: {
    value: number | null;
    max: string | number | null;
    per: string | null; // "charges", "sr", "lr", "day", etc.
    recovery?: string;
  };
  consume?: {
    type: string;
    target?: string;
    amount?: number;
    scale?: boolean;
  };
  ability?: string | null; // Ability used for saves/attacks
  actionType?: string | null; // "save", "heal", "util", etc.
  attackBonus?: string;
  chatFlavor?: string;
  critical?: {
    threshold: number | null;
    damage: string;
  };
  damage?: {
    parts: Array<[string, string]>; // [damage formula, damage type]
    versatile?: string;
  };
  formula?: string;
  save?: {
    ability: string;
    dc: number | null;
    scaling: string; // "spell", "flat", etc.
  };
  type?: {
    value: string; // "class", "race", "feat", "background"
    subtype?: string;
  };
  requirements?: string;
  recharge?: {
    value: number | null;
    charged: boolean;
  };
}

/**
 * Feature processing options for Foundry VTT conversion
 */
export interface FoundryFeatureOptions {
  includeDescriptions: boolean;
  generateActiveEffects: boolean;
  includeClassFeatures: boolean;
  includeRacialTraits: boolean;
  includeFeats: boolean;
  sanitizeText: boolean;
}

/**
 * FoundryVTTFeatureMapper Service
 */
export class FoundryVTTFeatureMapper {
  private static debugEnabled: boolean = false;

  constructor() {
    if (featureFlags.isEnabled('foundry_feature_mapper_debug')) {
      FoundryVTTFeatureMapper.debugEnabled = true;
    }
  }

  /**
   * Enable or disable debug mode
   */
  static setDebugMode(enabled: boolean): void {
    this.debugEnabled = enabled;
  }

  /**
   * Convert processed features to Foundry VTT Items
   */
  mapFeaturesToFoundryItems(
    features: ProcessedFeatures, 
    options: FoundryFeatureOptions = this.getDefaultOptions()
  ): FoundryItem[] {
    const items: FoundryItem[] = [];

    if (FoundryVTTFeatureMapper.debugEnabled) {
      console.log('🎭 FoundryVTTFeatureMapper: Converting features to Foundry Items', {
        classFeatures: features.classFeatures.length,
        racialTraits: features.racialTraits.length,
        feats: features.feats.length,
        options
      });
    }

    // Convert class features
    if (options.includeClassFeatures && features.classFeatures.length > 0) {
      const classFeatureItems = features.classFeatures.map(feature => 
        this.mapClassFeatureToFoundryItem(feature, options)
      );
      items.push(...classFeatureItems);
    }

    // Convert racial traits
    if (options.includeRacialTraits && features.racialTraits.length > 0) {
      const racialTraitItems = features.racialTraits.map(trait => 
        this.mapRacialTraitToFoundryItem(trait, options)
      );
      items.push(...racialTraitItems);
    }

    // Convert feats
    if (options.includeFeats && features.feats.length > 0) {
      const featItems = features.feats.map(feat => 
        this.mapFeatToFoundryItem(feat, options)
      );
      items.push(...featItems);
    }

    if (FoundryVTTFeatureMapper.debugEnabled) {
      console.log(`🎯 FoundryVTTFeatureMapper: Generated ${items.length} Foundry Items`);
    }

    return items;
  }

  /**
   * Convert class feature to Foundry VTT Item
   */
  private mapClassFeatureToFoundryItem(feature: ClassFeature, options: FoundryFeatureOptions): FoundryItem {
    const sanitizedName = options.sanitizeText ? StringSanitizer.sanitizeForXML(feature.name) : feature.name;
    const sanitizedDescription = options.sanitizeText && feature.description
      ? StringSanitizer.sanitizeForXML(feature.description)
      : feature.description || '';

    const systemData: FoundryFeatureSystemData = {
      description: {
        value: this.formatDescriptionForFoundry(sanitizedDescription),
        chat: sanitizedName
      },
      source: {
        book: "D&D Beyond Import",
        custom: `${feature.className}${feature.subclassName ? ` (${feature.subclassName})` : ''}`
      },
      activation: this.mapFeatureActivation(feature),
      type: {
        value: "class",
        subtype: feature.subclassName || undefined
      },
      requirements: feature.requiredLevel ? `${feature.className} ${feature.requiredLevel}` : undefined
    };

    // Add usage information if available
    if (feature.uses) {
      systemData.uses = this.mapFeatureUsage(feature.uses);
    }

    const item: FoundryItem = {
      _id: generateId(),
      name: sanitizedName,
      type: "feat",
      img: this.getFeatureIcon(feature.type, 'class'),
      system: systemData,
      effects: options.generateActiveEffects ? this.generateActiveEffectsForClassFeature(feature) : [],
      ownership: { default: 0 },
      flags: {
        "dnd5e": {
          sourceId: feature.id?.toString()
        },
        "b2fg": {
          originalSource: "ddbeyond-class-feature",
          className: feature.className,
          subclassName: feature.subclassName,
          featureType: feature.type
        }
      },
      sort: 0
    };

    return item;
  }

  /**
   * Convert racial trait to Foundry VTT Item
   */
  private mapRacialTraitToFoundryItem(trait: RacialTrait, options: FoundryFeatureOptions): FoundryItem {
    const sanitizedName = options.sanitizeText ? StringSanitizer.sanitizeForXML(trait.name) : trait.name;
    const sanitizedDescription = options.sanitizeText && trait.description
      ? StringSanitizer.sanitizeForXML(trait.description)
      : trait.description || '';

    const systemData: FoundryFeatureSystemData = {
      description: {
        value: this.formatDescriptionForFoundry(sanitizedDescription),
        chat: sanitizedName
      },
      source: {
        book: "D&D Beyond Import",
        custom: `${trait.raceName}${trait.suraceName ? ` (${trait.suraceName})` : ''}`
      },
      activation: this.mapTraitActivation(trait),
      type: {
        value: "race",
        subtype: trait.suraceName || undefined
      },
      requirements: undefined // Racial traits don't have level requirements
    };

    const item: FoundryItem = {
      _id: generateId(),
      name: sanitizedName,
      type: "feat",
      img: this.getFeatureIcon(trait.type, 'race'),
      system: systemData,
      effects: options.generateActiveEffects ? this.generateActiveEffectsForRacialTrait(trait) : [],
      ownership: { default: 0 },
      flags: {
        "dnd5e": {
          sourceId: trait.id?.toString()
        },
        "b2fg": {
          originalSource: "ddbeyond-racial-trait",
          raceName: trait.raceName,
          suraceName: trait.suraceName,
          traitType: trait.type
        }
      },
      sort: 0
    };

    return item;
  }

  /**
   * Convert feat to Foundry VTT Item
   */
  private mapFeatToFoundryItem(feat: Feat, options: FoundryFeatureOptions): FoundryItem {
    const sanitizedName = options.sanitizeText ? StringSanitizer.sanitizeForXML(feat.name) : feat.name;
    const sanitizedDescription = options.sanitizeText && feat.description
      ? StringSanitizer.sanitizeForXML(feat.description)
      : feat.description || '';

    const systemData: FoundryFeatureSystemData = {
      description: {
        value: this.formatDescriptionForFoundry(sanitizedDescription),
        chat: sanitizedName
      },
      source: {
        book: "D&D Beyond Import",
        custom: feat.category || 'General'
      },
      activation: this.mapFeatActivation(feat),
      type: {
        value: "feat",
        subtype: feat.type || undefined
      },
      requirements: feat.prerequisite || undefined
    };

    const item: FoundryItem = {
      _id: generateId(),
      name: sanitizedName,
      type: "feat",
      img: this.getFeatureIcon(feat.type || 'general', 'feat'),
      system: systemData,
      effects: options.generateActiveEffects ? this.generateActiveEffectsForFeat(feat) : [],
      ownership: { default: 0 },
      flags: {
        "dnd5e": {
          sourceId: feat.id?.toString()
        },
        "b2fg": {
          originalSource: "ddbeyond-feat",
          featCategory: feat.category,
          featType: feat.type,
          isRepeatable: feat.isRepeatable
        }
      },
      sort: 0
    };

    return item;
  }

  /**
   * Map feature activation based on type
   */
  private mapFeatureActivation(feature: ClassFeature): FoundryFeatureSystemData['activation'] {
    // Default activation for class features
    switch (feature.type) {
      case 'active':
        return { type: 'action', cost: 1 };
      case 'resource':
        return { type: 'bonus', cost: 1 };
      case 'spell':
        return { type: 'action', cost: 1 };
      case 'passive':
      default:
        return { type: 'none', cost: 0 };
    }
  }

  /**
   * Map trait activation based on type
   */
  private mapTraitActivation(trait: RacialTrait): FoundryFeatureSystemData['activation'] {
    switch (trait.type) {
      case 'active':
        return { type: 'action', cost: 1 };
      case 'spell':
        return { type: 'action', cost: 1 };
      case 'proficiency':
      case 'passive':
      default:
        return { type: 'none', cost: 0 };
    }
  }

  /**
   * Map feat activation based on type
   */
  private mapFeatActivation(feat: Feat): FoundryFeatureSystemData['activation'] {
    // Most feats are passive bonuses
    return { type: 'none', cost: 0 };
  }

  /**
   * Map feature usage to Foundry format
   */
  private mapFeatureUsage(uses: ClassFeature['uses']): FoundryFeatureSystemData['uses'] {
    if (!uses) return undefined;

    let per: string;
    switch (uses.rechargeOn) {
      case 'short_rest': per = 'sr'; break;
      case 'long_rest': per = 'lr'; break;
      default: per = 'charges'; break;
    }

    return {
      value: uses.amount,
      max: uses.amount,
      per: per,
      recovery: uses.rechargeOn || undefined
    };
  }

  /**
   * Generate Active Effects for class features
   */
  private generateActiveEffectsForClassFeature(feature: ClassFeature): FoundryActiveEffect[] {
    const effects: FoundryActiveEffect[] = [];

    // Example: Generate effects based on feature mechanics
    if (feature.mechanics) {
      // This would be expanded based on actual mechanics data
      // For now, return empty array as mechanics parsing is complex
    }

    return effects;
  }

  /**
   * Generate Active Effects for racial traits
   */
  private generateActiveEffectsForRacialTrait(trait: RacialTrait): FoundryActiveEffect[] {
    const effects: FoundryActiveEffect[] = [];

    // Generate effects for known racial traits
    if (trait.mechanics) {
      // Darkvision effect
      if (trait.mechanics.darkvisionRange) {
        effects.push({
          _id: generateId(),
          name: `${trait.name} - Darkvision`,
          changes: [
            {
              key: 'system.attributes.senses.darkvision',
              mode: 4, // OVERRIDE mode
              value: trait.mechanics.darkvisionRange.toString()
            }
          ],
          origin: `Actor.${generateId()}.Item.${generateId()}`,
          disabled: false,
          transfer: true,
          flags: {
            "b2fg": {
              source: "racial-trait",
              traitName: trait.name
            }
          }
        } as FoundryActiveEffect);
      }

      // Speed bonus effect
      if (trait.mechanics.speed) {
        effects.push({
          _id: generateId(),
          name: `${trait.name} - Speed`,
          changes: [
            {
              key: 'system.attributes.movement.walk',
              mode: 4, // OVERRIDE mode
              value: trait.mechanics.speed.toString()
            }
          ],
          origin: `Actor.${generateId()}.Item.${generateId()}`,
          disabled: false,
          transfer: true,
          flags: {
            "b2fg": {
              source: "racial-trait",
              traitName: trait.name
            }
          }
        } as FoundryActiveEffect);
      }
    }

    return effects;
  }

  /**
   * Generate Active Effects for feats
   */
  private generateActiveEffectsForFeat(feat: Feat): FoundryActiveEffect[] {
    const effects: FoundryActiveEffect[] = [];

    if (feat.mechanics) {
      // Initiative bonus (e.g., Alert feat)
      if (feat.mechanics.initiative) {
        effects.push({
          _id: generateId(),
          name: `${feat.name} - Initiative`,
          changes: [
            {
              key: 'system.attributes.init.bonus',
              mode: 2, // ADD mode
              value: '5' // Alert gives +5 to initiative
            }
          ],
          origin: `Actor.${generateId()}.Item.${generateId()}`,
          disabled: false,
          transfer: true,
          flags: {
            "b2fg": {
              source: "feat",
              featName: feat.name
            }
          }
        } as FoundryActiveEffect);
      }

      // Hit point bonus (e.g., Tough feat)
      if (feat.mechanics.hitPoints) {
        effects.push({
          _id: generateId(),
          name: `${feat.name} - Hit Points`,
          changes: [
            {
              key: 'system.attributes.hp.bonuses.overall',
              mode: 2, // ADD mode
              value: `${feat.mechanics.hitPoints} * @details.level`
            }
          ],
          origin: `Actor.${generateId()}.Item.${generateId()}`,
          disabled: false,
          transfer: true,
          flags: {
            "b2fg": {
              source: "feat",
              featName: feat.name
            }
          }
        } as FoundryActiveEffect);
      }
    }

    return effects;
  }

  /**
   * Get appropriate icon for feature type
   */
  private getFeatureIcon(type: string, category: 'class' | 'race' | 'feat'): string {
    // Default Foundry VTT icons based on feature type
    const iconMap: Record<string, string> = {
      // Class features
      'passive': 'icons/magic/symbols/rune-star-yellow.webp',
      'active': 'icons/magic/symbols/runes-triangle-orange.webp',
      'resource': 'icons/magic/symbols/rune-circled-stone-orange.webp',
      'spell': 'icons/magic/symbols/elements-air-earth-fire-water.webp',
      
      // Racial traits
      'proficiency': 'icons/skills/trades/academics-study-reading-book.webp',
      
      // Feats
      'general': 'icons/skills/melee/weapons-crossed-swords-yellow.webp',
      'origin': 'icons/magic/symbols/star-inverted-yellow.webp',
      'fighting_style': 'icons/skills/melee/strike-sword-steel-yellow.webp',
      'epic_boon': 'icons/magic/symbols/rune-star-glow-yellow.webp',
    };

    return iconMap[type] || iconMap['general'] || 'icons/skills/melee/weapons-crossed-swords-yellow.webp';
  }

  /**
   * Format description text for Foundry VTT
   */
  private formatDescriptionForFoundry(description: string): string {
    if (!description) return '';
    
    // Convert basic HTML formatting for Foundry VTT
    let formatted = description
      .replace(/&lt;p&gt;/g, '<p>')
      .replace(/&lt;\/p&gt;/g, '</p>')
      .replace(/&lt;strong&gt;/g, '<strong>')
      .replace(/&lt;\/strong&gt;/g, '</strong>')
      .replace(/&lt;em&gt;/g, '<em>')
      .replace(/&lt;\/em&gt;/g, '</em>')
      .replace(/&lt;br\s*\/?&gt;/g, '<br>')
      .replace(/&amp;/g, '&');

    return formatted;
  }

  /**
   * Get default feature conversion options
   */
  private getDefaultOptions(): FoundryFeatureOptions {
    return {
      includeDescriptions: true,
      generateActiveEffects: true,
      includeClassFeatures: true,
      includeRacialTraits: true,
      includeFeats: true,
      sanitizeText: true
    };
  }
}