/**
 * Feature Domain Models
 * 
 * Defines the core feature types and structures for D&D 5e class features
 * and racial traits, including processing results and XML generation.
 */

export interface ClassFeature {
  id: number;
  name: string;
  description: string;
  requiredLevel: number;
  className: string;
  subclassName?: string;
  source: 'class' | 'subclass';
  type: 'passive' | 'active' | 'resource' | 'spell';
  uses?: {
    type: 'short_rest' | 'long_rest' | 'unlimited' | 'charges';
    amount: number;
    rechargeOn?: 'short_rest' | 'long_rest';
  };
  mechanics?: {
    damage?: string;
    range?: string;
    duration?: string;
    savingThrow?: string;
  };
}

export interface RacialTrait {
  id: number;
  name: string;
  description: string;
  raceName: string;
  suraceName?: string;
  source: 'race' | 'subrace';
  type: 'passive' | 'active' | 'spell' | 'proficiency';
  mechanics?: {
    darkvisionRange?: number;
    speed?: number;
    languages?: string[];
    proficiencies?: string[];
    spells?: string[];
    resistance?: string[];
    immunity?: string[];
  };
}

export interface ProcessedFeatures {
  classFeatures: ClassFeature[];
  racialTraits: RacialTrait[];
  totalFeatures: number;
  featuresByClass: Record<string, ClassFeature[]>;
  traitsByRace: Record<string, RacialTrait[]>;
  debugInfo: {
    processingMethod: 'single_class' | 'multiclass';
    classBreakdown: Array<{
      className: string;
      level: number;
      featureCount: number;
      subclass?: string;
    }>;
    raceBreakdown: {
      raceName: string;
      subraceName?: string;
      traitCount: number;
    };
    warnings: string[];
  };
}

export interface FeatureXMLOptions {
  includeDescriptions: boolean;
  includeUsageLimits: boolean;
  groupBySource: boolean;
  sanitizeText: boolean;
}

// Common D&D 5e class feature mappings
export const CLASS_FEATURE_TYPES: Record<string, Record<string, string>> = {
  'barbarian': {
    'Rage': 'resource',
    'Unarmored Defense': 'passive',
    'Reckless Attack': 'active',
    'Danger Sense': 'passive',
    'Primal Path': 'passive',
    'Extra Attack': 'passive',
    'Fast Movement': 'passive',
    'Feral Instinct': 'passive',
    'Brutal Critical': 'passive',
    'Relentless Rage': 'passive',
    'Persistent Rage': 'passive',
    'Indomitable Might': 'passive',
    'Primal Champion': 'passive'
  },
  'fighter': {
    'Fighting Style': 'passive',
    'Second Wind': 'resource',
    'Action Surge': 'resource',
    'Martial Archetype': 'passive',
    'Extra Attack': 'passive',
    'Indomitable': 'resource',
    'Superior Critical': 'passive',
    'Survivor': 'passive'
  },
  'ranger': {
    'Favored Enemy': 'passive',
    'Natural Explorer': 'passive',
    'Fighting Style': 'passive',
    'Spellcasting': 'spell',
    'Ranger Archetype': 'passive',
    'Primeval Awareness': 'active',
    'Extra Attack': 'passive',
    'Lands Stride': 'passive',
    'Hide in Plain Sight': 'active',
    'Vanish': 'active',
    'Feral Senses': 'passive',
    'Foe Slayer': 'passive'
  },
  'rogue': {
    'Expertise': 'passive',
    'Sneak Attack': 'passive',
    'Thieves Cant': 'passive',
    'Cunning Action': 'active',
    'Roguish Archetype': 'passive',
    'Uncanny Dodge': 'passive',
    'Evasion': 'passive',
    'Reliable Talent': 'passive',
    'Blindsense': 'passive',
    'Slippery Mind': 'passive',
    'Elusive': 'passive',
    'Stroke of Luck': 'resource'
  }
};

// Common racial trait mappings
export const RACIAL_TRAIT_TYPES: Record<string, Record<string, string>> = {
  'human': {
    'Extra Language': 'proficiency',
    'Extra Skill': 'proficiency',
    'Versatile': 'passive'
  },
  'elf': {
    'Darkvision': 'passive',
    'Keen Senses': 'proficiency',
    'Fey Ancestry': 'passive',
    'Trance': 'passive',
    'Elf Weapon Training': 'proficiency'
  },
  'dwarf': {
    'Darkvision': 'passive',
    'Dwarven Resilience': 'passive',
    'Dwarven Combat Training': 'proficiency',
    'Stonecunning': 'proficiency'
  },
  'halfling': {
    'Lucky': 'passive',
    'Brave': 'passive',
    'Halfling Nimbleness': 'passive'
  },
  'dragonborn': {
    'Draconic Ancestry': 'passive',
    'Breath Weapon': 'active',
    'Damage Resistance': 'passive'
  },
  'gnome': {
    'Darkvision': 'passive',
    'Gnome Cunning': 'passive'
  },
  'half-elf': {
    'Darkvision': 'passive',
    'Fey Ancestry': 'passive',
    'Skill Versatility': 'proficiency'
  },
  'half-orc': {
    'Darkvision': 'passive',
    'Relentless Endurance': 'resource',
    'Savage Attacks': 'passive'
  },
  'tiefling': {
    'Darkvision': 'passive',
    'Hellish Resistance': 'passive',
    'Infernal Legacy': 'spell'
  }
};

// Feature validation and utility functions
export class FeatureValidator {
  static validateClassFeature(feature: Partial<ClassFeature>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!feature.name || feature.name.trim().length === 0) {
      errors.push('Feature name is required');
    }
    
    if (!feature.className || feature.className.trim().length === 0) {
      errors.push('Class name is required');
    }
    
    if (typeof feature.requiredLevel !== 'number' || feature.requiredLevel < 1 || feature.requiredLevel > 20) {
      errors.push('Required level must be between 1 and 20');
    }
    
    if (feature.type && !['passive', 'active', 'resource', 'spell'].includes(feature.type)) {
      errors.push('Feature type must be passive, active, resource, or spell');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  static validateRacialTrait(trait: Partial<RacialTrait>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!trait.name || trait.name.trim().length === 0) {
      errors.push('Trait name is required');
    }
    
    if (!trait.raceName || trait.raceName.trim().length === 0) {
      errors.push('Race name is required');
    }
    
    if (trait.type && !['passive', 'active', 'spell', 'proficiency'].includes(trait.type)) {
      errors.push('Trait type must be passive, active, spell, or proficiency');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// Value objects for type safety
export class FeatureLevel {
  constructor(public readonly level: number) {
    if (level < 1 || level > 20) {
      throw new Error('Feature level must be between 1 and 20');
    }
  }
  
  toString(): string {
    return this.level.toString();
  }
  
  canAccessFeature(requiredLevel: number): boolean {
    return this.level >= requiredLevel;
  }
}

export class FeatureUsage {
  constructor(
    public readonly type: 'short_rest' | 'long_rest' | 'unlimited' | 'charges',
    public readonly amount: number
  ) {
    if (amount < 0) {
      throw new Error('Feature usage amount cannot be negative');
    }
  }
  
  isUnlimited(): boolean {
    return this.type === 'unlimited';
  }
  
  requiresRest(): boolean {
    return this.type === 'short_rest' || this.type === 'long_rest';
  }
}