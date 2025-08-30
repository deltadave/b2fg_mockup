/**
 * D&D 5E Proficiency Constants
 * 
 * Equipment and tool proficiency definitions for D&D 5th Edition.
 * Maps D&D Beyond proficiency identifiers to Fantasy Grounds display names
 * and standardized proficiency categories.
 */

/**
 * D&D Beyond Entity Type IDs for proficiencies
 * Based on analysis of TestCharacter2_151483095_v05.json
 */
export const DNDB_ENTITY_TYPES = {
  WEAPON_CATEGORY: 660121713,    // simple-weapons, martial-weapons
  WEAPON_SPECIFIC: 1782728300,   // rapier, scimitar, shortsword, etc.
  ARMOR: 174869515,              // light-armor, medium-armor, heavy-armor, shields
  TOOL: 2103445194,              // thieves-tools, forgery-kit, etc.
  SKILL: 1958004211              // Skills (handled separately)
} as const;

/**
 * Weapon proficiency mappings from D&D Beyond subType to Fantasy Grounds display
 */
export const WEAPON_PROFICIENCIES = {
  // Weapon Categories
  'simple-weapons': 'Simple Weapons',
  'martial-weapons': 'Martial Weapons',
  
  // Specific Simple Weapons
  'club': 'Club',
  'dagger': 'Dagger',
  'dart': 'Dart',
  'javelin': 'Javelin',
  'light-hammer': 'Light hammer',
  'mace': 'Mace',
  'quarterstaff': 'Quarterstaff',
  'sickle': 'Sickle',
  'spear': 'Spear',
  'crossbow-light': 'Crossbow, light',
  'shortbow': 'Shortbow',
  'sling': 'Sling',
  
  // Specific Martial Weapons
  'battleaxe': 'Battleaxe',
  'flail': 'Flail',
  'glaive': 'Glaive',
  'greataxe': 'Greataxe',
  'greatsword': 'Greatsword',
  'halberd': 'Halberd',
  'lance': 'Lance',
  'longsword': 'Longsword',
  'maul': 'Maul',
  'morningstar': 'Morningstar',
  'pike': 'Pike',
  'rapier': 'Rapier',
  'scimitar': 'Scimitar',
  'shortsword': 'Shortsword',
  'trident': 'Trident',
  'war-pick': 'War pick',
  'warhammer': 'Warhammer',
  'whip': 'Whip',
  'blowgun': 'Blowgun',
  'crossbow-hand': 'Crossbow, hand',
  'crossbow-heavy': 'Crossbow, heavy',
  'longbow': 'Longbow',
  'net': 'Net'
} as const;

/**
 * Armor proficiency mappings from D&D Beyond subType to Fantasy Grounds display
 */
export const ARMOR_PROFICIENCIES = {
  'light-armor': 'Light Armor',
  'medium-armor': 'Medium Armor', 
  'heavy-armor': 'Heavy Armor',
  'shields': 'Shields'
} as const;

/**
 * Tool proficiency mappings from D&D Beyond subType to Fantasy Grounds display
 */
export const TOOL_PROFICIENCIES = {
  // Artisan's Tools
  'alchemists-supplies': "Alchemist's supplies",
  'brewers-supplies': "Brewer's supplies",
  'calligraphers-supplies': "Calligrapher's supplies",
  'carpenters-tools': "Carpenter's tools",
  'cartographers-tools': "Cartographer's tools",
  'cobblers-tools': "Cobbler's tools",
  'cooks-utensils': "Cook's utensils",
  'glassblowers-tools': "Glassblower's tools",
  'jewelers-tools': "Jeweler's tools",
  'leatherworkers-tools': "Leatherworker's tools",
  'masons-tools': "Mason's tools",
  'painters-supplies': "Painter's supplies",
  'potters-tools': "Potter's tools",
  'smiths-tools': "Smith's tools",
  'tinkers-tools': "Tinker's tools",
  'weavers-tools': "Weaver's tools",
  'woodcarvers-tools': "Woodcarver's tools",
  
  // Other Tools
  'thieves-tools': "Thieves' tools",
  'forgery-kit': 'Forgery kit',
  'disguise-kit': 'Disguise kit',
  'herbalism-kit': 'Herbalism kit',
  'navigators-tools': "Navigator's tools",
  'poisoners-kit': "Poisoner's kit",
  
  // Gaming Sets
  'dice-set': 'Dice set',
  'dragonchess-set': 'Dragonchess set',
  'playing-card-set': 'Playing card set',
  'three-dragon-ante-set': 'Three-Dragon Ante set',
  
  // Musical Instruments
  'bagpipes': 'Bagpipes',
  'drum': 'Drum',
  'dulcimer': 'Dulcimer',
  'flute': 'Flute',
  'lute': 'Lute',
  'lyre': 'Lyre',
  'horn': 'Horn',
  'pan-flute': 'Pan flute',
  'shawm': 'Shawm',
  'viol': 'Viol',
  
  // Vehicle Proficiencies
  'vehicles-land': 'Vehicles (land)',
  'vehicles-water': 'Vehicles (water)'
} as const;

/**
 * Type definitions for proficiency data
 */
export interface ProficiencyEntry {
  readonly source: string;        // D&D Beyond subType
  readonly display: string;       // Fantasy Grounds display name
  readonly category: ProficiencyCategory;
  readonly entityTypeId: number;  // D&D Beyond entity type ID
}

export type ProficiencyCategory = 'weapon' | 'armor' | 'tool';

export type WeaponProficiencyKey = keyof typeof WEAPON_PROFICIENCIES;
export type ArmorProficiencyKey = keyof typeof ARMOR_PROFICIENCIES;
export type ToolProficiencyKey = keyof typeof TOOL_PROFICIENCIES;

/**
 * All proficiency mappings combined for lookup
 */
export const ALL_PROFICIENCY_MAPPINGS = {
  ...WEAPON_PROFICIENCIES,
  ...ARMOR_PROFICIENCIES,
  ...TOOL_PROFICIENCIES
} as const;

/**
 * Utility functions for proficiency processing
 */
export class ProficiencyUtils {
  /**
   * Get Fantasy Grounds display name for a D&D Beyond proficiency subType
   */
  static getDisplayName(subType: string): string | null {
    return ALL_PROFICIENCY_MAPPINGS[subType as keyof typeof ALL_PROFICIENCY_MAPPINGS] || null;
  }
  
  /**
   * Determine proficiency category from entity type ID
   */
  static getCategoryByEntityType(entityTypeId: number): ProficiencyCategory | null {
    switch (entityTypeId) {
      case DNDB_ENTITY_TYPES.WEAPON_CATEGORY:
      case DNDB_ENTITY_TYPES.WEAPON_SPECIFIC:
        return 'weapon';
      case DNDB_ENTITY_TYPES.ARMOR:
        return 'armor';
      case DNDB_ENTITY_TYPES.TOOL:
        return 'tool';
      default:
        return null;
    }
  }
  
  /**
   * Check if a proficiency subType is a weapon category (vs specific weapon)
   */
  static isWeaponCategory(subType: string): boolean {
    return ['simple-weapons', 'martial-weapons'].includes(subType);
  }
  
  /**
   * Check if a proficiency subType is an armor category
   */
  static isArmorCategory(subType: string): boolean {
    return ['light-armor', 'medium-armor', 'heavy-armor', 'shields'].includes(subType);
  }
  
  /**
   * Filter proficiencies by category
   */
  static filterByCategory<T extends ProficiencyEntry>(
    proficiencies: T[], 
    category: ProficiencyCategory
  ): T[] {
    return proficiencies.filter(prof => prof.category === category);
  }
  
  /**
   * Remove duplicate proficiencies
   * First removes exact duplicates by source, then handles category vs specific proficiencies
   */
  static deduplicateProficiencies(proficiencies: ProficiencyEntry[]): ProficiencyEntry[] {
    // Step 1: Remove exact duplicates based on source (same proficiency from multiple classes)
    const uniqueBySource = new Map<string, ProficiencyEntry>();
    proficiencies.forEach(prof => {
      if (!uniqueBySource.has(prof.source)) {
        uniqueBySource.set(prof.source, prof);
      }
    });
    
    const uniqueProficiencies = Array.from(uniqueBySource.values());
    
    // Step 2: Handle category vs specific proficiencies for weapons
    const weaponProfs = this.filterByCategory(uniqueProficiencies, 'weapon');
    const armorProfs = this.filterByCategory(uniqueProficiencies, 'armor');
    const toolProfs = this.filterByCategory(uniqueProficiencies, 'tool');
    
    const hasSimpleWeapons = weaponProfs.some(p => p.source === 'simple-weapons');
    const hasMartialWeapons = weaponProfs.some(p => p.source === 'martial-weapons');
    
    let filteredWeaponProfs = [...weaponProfs];
    
    // Remove specific simple weapons if character has simple weapon proficiency
    if (hasSimpleWeapons) {
      const simpleWeapons = [
        'club', 'dagger', 'dart', 'javelin', 'light-hammer', 'mace', 
        'quarterstaff', 'sickle', 'spear', 'crossbow-light', 'shortbow', 'sling'
      ];
      filteredWeaponProfs = filteredWeaponProfs.filter(p => 
        p.source === 'simple-weapons' || !simpleWeapons.includes(p.source)
      );
    }
    
    // Remove specific martial weapons if character has martial weapon proficiency  
    if (hasMartialWeapons) {
      const martialWeapons = [
        'battleaxe', 'flail', 'glaive', 'greataxe', 'greatsword', 'halberd',
        'lance', 'longsword', 'maul', 'morningstar', 'pike', 'rapier', 
        'scimitar', 'shortsword', 'trident', 'war-pick', 'warhammer', 'whip',
        'blowgun', 'crossbow-hand', 'crossbow-heavy', 'longbow', 'net'
      ];
      filteredWeaponProfs = filteredWeaponProfs.filter(p =>
        p.source === 'martial-weapons' || !martialWeapons.includes(p.source)
      );
    }
    
    // Combine all categories
    return [...filteredWeaponProfs, ...armorProfs, ...toolProfs];
  }
}