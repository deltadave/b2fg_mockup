/**
 * Foundry VTT Inventory Mapper
 * 
 * Converts ProcessedInventory data to Foundry VTT Item format.
 * Handles proper item types, system data, and embedded structure for D&D 5e system.
 * 
 * Based on analysis of fvtt-Actor-testcharacter-wgyeGYaSKcQ04K0U.json format.
 */

import type { 
  ProcessedInventory, 
  ProcessedInventoryItem, 
  ProcessedContainer,
  ItemType,
  FoundryItemType 
} from '@/domain/character/services/InventoryProcessor';
import type { ProcessedWeapon, ProcessedWeaponsResult } from '@/domain/character/models/Weapons';
import { StringSanitizer } from '@/shared/utils/StringSanitizer';

export interface FoundryItem {
  _id: string;
  name: string;
  type: FoundryItemType;
  img: string;
  system: FoundryItemSystem;
  effects: any[];
  flags: Record<string, any>;
  sort: number;
}

export interface FoundryItemSystem {
  description: {
    value: string;
    chat: string;
    unidentified?: string;
  };
  quantity: number;
  weight: number;
  price: {
    value: number;
    denomination: string;
  };
  equipped: boolean;
  attuned: boolean;
  identified: boolean;
  rarity: string;
  properties?: Record<string, boolean>; // D&D 5e weapon/armor properties
  
  // Weapon-specific properties (D&D 5e system)
  weaponType?: string; // simple, martial
  baseItem?: string;
  damage?: {
    parts: [string, string][];
    versatile?: string;
  };
  range?: {
    value: number | null;
    long: number | null;
    units: string;
  };
  ability?: string; // str, dex, etc.
  actionType?: string; // mwak, rwak, save, etc.
  attackBonus?: number;
  chatFlavor?: string;
  critical?: {
    threshold: number | null;
    damage: string;
  };
  proficient?: boolean;
  
  // Armor-specific properties
  armor?: {
    value: number;
    type: string;
    dex?: number;
  };
  
  // Container properties
  capacity?: {
    type: string;
    value: number;
    weightless: boolean;
  };
  
  // Consumable properties
  uses?: {
    value: number;
    max: number | string;
    per: string;
    recovery: string;
  };
  
  // Activation properties
  activation?: {
    type: string;
    cost: number;
    condition: string;
  };
  
  // Duration properties
  duration?: {
    value: number;
    units: string;
  };
  
  // Target properties
  target?: {
    value: number | null;
    width: number | null;
    units: string;
    type: string;
  };
}

export class FoundryVTTInventoryMapper {
  private itemIdCounter = 1;

  /**
   * Convert ProcessedInventory to array of Foundry VTT items
   */
  mapInventoryToFoundryItems(processedInventory: ProcessedInventory): FoundryItem[] {
    const foundryItems: FoundryItem[] = [];
    
    // Process enhanced weapons first with detailed combat data
    if (processedInventory.weapons) {
      processedInventory.weapons.weapons.forEach(weapon => {
        const foundryWeapon = this.convertWeaponToFoundryFormat(weapon);
        foundryItems.push(foundryWeapon);
      });
    }
    
    // Process regular inventory items (excluding weapons as they're handled above)
    processedInventory.items.forEach(item => {
      if (item.quantity <= 0) return; // Skip zero quantity items
      if (item.type === 'weapon') return; // Skip weapons as they're handled specially
      
      const foundryItem = this.convertToFoundryFormat(item);
      foundryItems.push(foundryItem);
    });
    
    // Process containers as separate items with container logic
    processedInventory.containers.forEach(container => {
      const containerItem = this.convertContainerToFoundryFormat(container);
      foundryItems.push(containerItem);
    });
    
    return foundryItems;
  }

  /**
   * Convert ProcessedInventoryItem to Foundry VTT format
   */
  private convertToFoundryFormat(item: ProcessedInventoryItem): FoundryItem {
    const foundryId = this.generateFoundryId();
    const iconPath = this.getItemIcon(item.type, item.subtype);
    
    return {
      _id: foundryId,
      name: StringSanitizer.sanitizeText(item.name),
      type: item.foundryVtt.itemType,
      img: iconPath,
      system: this.buildFoundrySystemData(item),
      effects: [], // Active effects would be handled separately
      flags: {
        'dnd-beyond-import': {
          originalId: item.id,
          originalType: item.type,
          isMagical: item.isMagical,
          containerLocation: item.containerLocation
        }
      },
      sort: this.itemIdCounter * 100
    };
  }

  /**
   * Convert ProcessedWeapon to Foundry VTT format with D&D 5e system data
   */
  private convertWeaponToFoundryFormat(weapon: ProcessedWeapon): FoundryItem {
    const foundryId = this.generateFoundryId();
    const iconPath = this.getWeaponIcon(weapon);
    
    return {
      _id: foundryId,
      name: StringSanitizer.sanitizeText(weapon.name),
      type: 'weapon',
      img: iconPath,
      system: this.buildWeaponSystemDataFromProcessed(weapon),
      effects: [], // Active effects for magic weapons could be added here
      flags: {
        'dnd5e': {
          sourceId: weapon.baseItemId?.toString() || ''
        },
        'dnd-beyond-import': {
          originalId: weapon.id,
          attackType: weapon.attackType,
          weaponCategory: weapon.weaponCategory,
          magicBonus: weapon.magicBonus,
          isMagical: weapon.isMagical,
          proficient: weapon.proficient,
          primaryAbility: weapon.primaryAbility
        }
      },
      sort: this.itemIdCounter * 100
    };
  }

  /**
   * Convert ProcessedContainer to Foundry VTT format
   */
  private convertContainerToFoundryFormat(container: ProcessedContainer): FoundryItem {
    const foundryId = this.generateFoundryId();
    const iconPath = this.getContainerIcon(container.isMagical);
    
    return {
      _id: foundryId,
      name: StringSanitizer.sanitizeText(container.name),
      type: 'container',
      img: iconPath,
      system: {
        description: {
          value: container.isMagical ? 
            `<p>This magical container can hold ${container.capacity} pounds.</p>` :
            `<p>This container can hold ${container.capacity} pounds.</p>`,
          chat: ''
        },
        quantity: 1,
        weight: container.weight,
        price: {
          value: 0,
          denomination: 'gp'
        },
        equipped: false,
        attuned: false,
        identified: true,
        rarity: container.isMagical ? 'uncommon' : 'common',
        capacity: {
          type: 'weight',
          value: container.capacity,
          weightless: container.isMagical // Magic containers are often weightless
        }
      },
      effects: [],
      flags: {
        'dnd-beyond-import': {
          originalId: container.id,
          isMagical: container.isMagical,
          currentWeight: container.currentWeight
        }
      },
      sort: this.itemIdCounter * 100
    };
  }

  /**
   * Build comprehensive Foundry system data for an item
   */
  private buildFoundrySystemData(item: ProcessedInventoryItem): FoundryItemSystem {
    const baseData: FoundryItemSystem = {
      description: {
        value: this.formatDescription(item.description || ''),
        chat: '',
        unidentified: item.isMagical ? 'An unidentified magical item.' : ''
      },
      quantity: item.quantity,
      weight: item.weight,
      price: {
        value: item.value?.amount || 0,
        denomination: this.mapCurrencyToFoundry(item.value?.currency || 'gp')
      },
      equipped: item.isEquipped,
      attuned: item.isAttuned,
      identified: !item.isMagical || item.isEquipped, // Assume equipped magic items are identified
      rarity: this.determineRarity(item),
      properties: item.properties
    };

    // Add type-specific data
    return this.addTypeSpecificData(baseData, item);
  }

  /**
   * Add type-specific system data based on item type
   */
  private addTypeSpecificData(baseData: FoundryItemSystem, item: ProcessedInventoryItem): FoundryItemSystem {
    // Get the original system data from the processed item
    const originalSystemData = item.foundryVtt.systemData;
    
    // Merge with type-specific enhancements
    switch (item.type) {
      case 'weapon':
        return {
          ...baseData,
          ...this.buildWeaponSystemData(item, originalSystemData)
        };
      
      case 'armor':
      case 'shield':
        return {
          ...baseData,
          ...this.buildArmorSystemData(item, originalSystemData)
        };
      
      case 'consumable':
        return {
          ...baseData,
          ...this.buildConsumableSystemData(item, originalSystemData)
        };
      
      case 'tool':
        return {
          ...baseData,
          ...this.buildToolSystemData(item, originalSystemData)
        };
      
      default:
        return {
          ...baseData,
          ...originalSystemData
        };
    }
  }

  /**
   * Build comprehensive D&D 5e weapon system data from ProcessedWeapon
   */
  private buildWeaponSystemDataFromProcessed(weapon: ProcessedWeapon): FoundryItemSystem {
    // Map weapon properties to D&D 5e system format
    const properties = this.mapWeaponPropertiesToFoundry(weapon.properties);
    
    // Build damage parts array
    const damageParts: [string, string][] = [[
      weapon.damageFormula,
      weapon.damage.damageType.toLowerCase()
    ]];
    
    const baseSystemData: FoundryItemSystem = {
      description: {
        value: this.buildWeaponDescription(weapon),
        chat: '',
        unidentified: weapon.isMagical ? 'An unidentified magical weapon.' : ''
      },
      quantity: weapon.quantity,
      weight: weapon.weight,
      price: {
        value: this.estimateWeaponValue(weapon),
        denomination: 'gp'
      },
      equipped: weapon.equipped,
      attuned: weapon.isAttuned,
      identified: !weapon.isMagical || weapon.equipped,
      rarity: weapon.isMagical ? 'uncommon' : 'common',
      
      // D&D 5e weapon-specific properties
      weaponType: weapon.weaponCategory, // simple, martial
      baseItem: weapon.baseItemId?.toString() || '',
      damage: {
        parts: damageParts,
        versatile: weapon.versatileDamageFormula || ''
      },
      range: weapon.range ? {
        value: weapon.range.normal,
        long: weapon.range.long || null,
        units: weapon.range.units
      } : null,
      ability: this.mapAbilityToFoundry(weapon.primaryAbility),
      actionType: weapon.attackType === 'melee' ? 'mwak' : 'rwak',
      attackBonus: weapon.magicBonus || 0, // Only magic bonus, not total
      chatFlavor: '',
      critical: {
        threshold: null,
        damage: ''
      },
      proficient: weapon.proficient,
      properties
    };
    
    return baseSystemData;
  }

  /**
   * Build weapon-specific system data (fallback for basic items)
   */
  private buildWeaponSystemData(item: ProcessedInventoryItem, originalData: any): Partial<FoundryItemSystem> {
    const weaponData: Partial<FoundryItemSystem> = {};
    
    if (originalData.damage) {
      weaponData.damage = originalData.damage;
    }
    
    if (originalData.range) {
      weaponData.range = originalData.range;
    }
    
    // Add weapon-specific properties
    const weaponProperties = item.properties.filter(prop => 
      ['Light', 'Heavy', 'Finesse', 'Thrown', 'Two-Handed', 'Versatile', 'Ammunition', 'Loading', 'Reach'].includes(prop)
    );
    
    if (weaponProperties.length > 0) {
      weaponData.properties = this.mapArrayPropertiesToFoundry(weaponProperties);
    }
    
    return weaponData;
  }

  /**
   * Build armor-specific system data
   */
  private buildArmorSystemData(item: ProcessedInventoryItem, originalData: any): Partial<FoundryItemSystem> {
    const armorData: Partial<FoundryItemSystem> = {};
    
    if (originalData.armor) {
      armorData.armor = originalData.armor;
    }
    
    return armorData;
  }

  /**
   * Build consumable-specific system data
   */
  private buildConsumableSystemData(item: ProcessedInventoryItem, originalData: any): Partial<FoundryItemSystem> {
    const consumableData: Partial<FoundryItemSystem> = {};
    
    // Add uses/charges if available
    if (item.charges) {
      consumableData.uses = {
        value: item.charges.current,
        max: item.charges.maximum,
        per: 'charges',
        recovery: 'manual'
      };
    }
    
    return consumableData;
  }

  /**
   * Build tool-specific system data
   */
  private buildToolSystemData(item: ProcessedInventoryItem, originalData: any): Partial<FoundryItemSystem> {
    // Tools typically don't need special system data beyond base
    return originalData;
  }

  /**
   * Format item description for Foundry VTT HTML
   */
  private formatDescription(description: string): string {
    if (!description) return '';
    
    // Clean up HTML entities and format for Foundry
    let formatted = StringSanitizer.sanitizeHTML(description);
    
    // Ensure it's wrapped in paragraphs
    if (formatted && !formatted.startsWith('<p>')) {
      formatted = `<p>${formatted}</p>`;
    }
    
    return formatted;
  }

  /**
   * Get appropriate icon path for item type
   */
  private getItemIcon(itemType: ItemType, subtype?: string): string {
    const iconMap: Record<ItemType, string> = {
      'weapon': 'icons/weapons/swords/sword-broad-silver.webp',
      'armor': 'icons/equipment/chest/breastplate-scale-leather.webp', 
      'shield': 'icons/equipment/shield/round-wooden-boss-steel-brown.webp',
      'adventuring-gear': 'icons/containers/bags/pack-leather-brown.webp',
      'tool': 'icons/tools/hand/hammer-sledge-steel-wood.webp',
      'consumable': 'icons/consumables/potions/potion-flask-corked-red.webp',
      'treasure': 'icons/commodities/gems/gem-faceted-radiant-yellow.webp',
      'magic-item': 'icons/magic/symbols/rune-sigil-black-pink.webp',
      'mount': 'icons/creatures/mammals/horse-brown.webp',
      'trade-good': 'icons/commodities/materials/bowl-powder-brown.webp'
    };
    
    // Special handling for subtypes
    if (subtype) {
      const subtypeLower = subtype.toLowerCase();
      if (subtypeLower.includes('potion')) return 'icons/consumables/potions/potion-flask-corked-red.webp';
      if (subtypeLower.includes('scroll')) return 'icons/sundries/scrolls/scroll-bound-brown.webp';
      if (subtypeLower.includes('ammunition')) return 'icons/weapons/ammunition/arrows-bundle-leather-brown.webp';
    }
    
    return iconMap[itemType] || 'icons/svg/item-bag.svg';
  }

  /**
   * Get appropriate icon for container type
   */
  private getContainerIcon(isMagical: boolean): string {
    if (isMagical) {
      return 'icons/containers/bags/pack-engraved-leather-tan.webp';
    }
    return 'icons/containers/bags/pack-simple-brown.webp';
  }

  /**
   * Map currency type to Foundry VTT format
   */
  private mapCurrencyToFoundry(currency: string): string {
    const currencyMap: Record<string, string> = {
      'cp': 'cp',
      'sp': 'sp',
      'ep': 'ep', 
      'gp': 'gp',
      'pp': 'pp'
    };
    return currencyMap[currency.toLowerCase()] || 'gp';
  }

  /**
   * Determine rarity string for Foundry VTT
   */
  private determineRarity(item: ProcessedInventoryItem): string {
    if (!item.isMagical) return 'common';
    
    // Try to extract rarity from properties or use reasonable defaults
    const rarityProps = item.properties.find(prop => 
      ['common', 'uncommon', 'rare', 'very rare', 'legendary', 'artifact'].includes(prop.toLowerCase())
    );
    
    if (rarityProps) return rarityProps.toLowerCase();
    
    // Default rarity based on item type and magical nature
    if (item.isMagical) {
      return item.type === 'consumable' ? 'common' : 'uncommon';
    }
    
    return 'common';
  }

  /**
   * Generate unique Foundry VTT item ID
   */
  private generateFoundryId(): string {
    // Generate a pseudo-random ID similar to Foundry's format
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 16; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    this.itemIdCounter++;
    return result;
  }

  /**
   * Map weapon properties to Foundry VTT D&D 5e system format
   */
  private mapWeaponPropertiesToFoundry(properties: ReadonlyArray<import('@/domain/character/models/Weapons').WeaponProperty>): Record<string, boolean> {
    const foundryProperties: Record<string, boolean> = {};
    
    properties.forEach(prop => {
      switch (prop) {
        case 'ammunition':
          foundryProperties.amm = true;
          break;
        case 'finesse':
          foundryProperties.fin = true;
          break;
        case 'heavy':
          foundryProperties.hvy = true;
          break;
        case 'light':
          foundryProperties.lgt = true;
          break;
        case 'loading':
          foundryProperties.lod = true;
          break;
        case 'reach':
          foundryProperties.rch = true;
          break;
        case 'thrown':
          foundryProperties.thr = true;
          break;
        case 'two-handed':
          foundryProperties.two = true;
          break;
        case 'versatile':
          foundryProperties.ver = true;
          break;
        case 'special':
          foundryProperties.spe = true;
          break;
      }
    });
    
    return foundryProperties;
  }

  /**
   * Map array of property strings to Foundry format (fallback)
   */
  private mapArrayPropertiesToFoundry(properties: string[]): Record<string, boolean> {
    const foundryProperties: Record<string, boolean> = {};
    
    properties.forEach(prop => {
      const propLower = prop.toLowerCase();
      if (propLower.includes('ammunition')) foundryProperties.amm = true;
      if (propLower.includes('finesse')) foundryProperties.fin = true;
      if (propLower.includes('heavy')) foundryProperties.hvy = true;
      if (propLower.includes('light')) foundryProperties.lgt = true;
      if (propLower.includes('loading')) foundryProperties.lod = true;
      if (propLower.includes('reach')) foundryProperties.rch = true;
      if (propLower.includes('thrown')) foundryProperties.thr = true;
      if (propLower.includes('two-handed')) foundryProperties.two = true;
      if (propLower.includes('versatile')) foundryProperties.ver = true;
      if (propLower.includes('special')) foundryProperties.spe = true;
    });
    
    return foundryProperties;
  }

  /**
   * Map ability name to Foundry VTT format
   */
  private mapAbilityToFoundry(ability: import('@/domain/character/constants/AbilityConstants').AbilityName): string {
    const abilityMap = {
      'strength': 'str',
      'dexterity': 'dex',
      'constitution': 'con',
      'intelligence': 'int',
      'wisdom': 'wis',
      'charisma': 'cha'
    };
    
    return abilityMap[ability] || 'str';
  }

  /**
   * Build weapon description with properties and stats
   */
  private buildWeaponDescription(weapon: ProcessedWeapon): string {
    const parts: string[] = [];
    
    // Basic weapon info
    parts.push(`<p><strong>${weapon.weaponCategory.charAt(0).toUpperCase() + weapon.weaponCategory.slice(1)} ${weapon.attackType} weapon</strong></p>`);
    
    // Properties
    if (weapon.properties.length > 0) {
      const propertyNames = weapon.properties.map(prop => {
        switch (prop) {
          case 'two-handed': return 'Two-handed';
          case 'light': return 'Light';
          case 'heavy': return 'Heavy';
          case 'finesse': return 'Finesse';
          case 'versatile': return `Versatile${weapon.versatileDamageFormula ? ` (${weapon.versatileDamageFormula})` : ''}`;
          case 'thrown': return 'Thrown';
          case 'ammunition': return 'Ammunition';
          case 'loading': return 'Loading';
          case 'reach': return 'Reach';
          default: return prop.charAt(0).toUpperCase() + prop.slice(1);
        }
      });
      parts.push(`<p><strong>Properties:</strong> ${propertyNames.join(', ')}</p>`);
    }
    
    // Range for ranged weapons or thrown weapons
    if (weapon.range) {
      parts.push(`<p><strong>Range:</strong> ${weapon.range.normal}${weapon.range.long ? `/${weapon.range.long}` : ''} ft.</p>`);
    }
    
    // Magic properties
    if (weapon.isMagical && weapon.magicBonus > 0) {
      parts.push(`<p><strong>Enhancement:</strong> +${weapon.magicBonus} magical weapon</p>`);
    }
    
    if (weapon.requiresAttunement) {
      parts.push(`<p><em>Requires attunement</em></p>`);
    }
    
    return parts.join('\n');
  }

  /**
   * Estimate weapon value based on type and magic bonus
   */
  private estimateWeaponValue(weapon: ProcessedWeapon): number {
    // Base weapon values (simplified)
    let baseValue = weapon.weaponCategory === 'simple' ? 2 : 25;
    
    // Adjust for weapon type
    if (weapon.attackType === 'ranged') {
      baseValue *= 2;
    }
    
    // Magic weapon pricing
    if (weapon.isMagical && weapon.magicBonus > 0) {
      const magicMultiplier = Math.pow(10, weapon.magicBonus); // +1 = 10x, +2 = 100x, etc.
      baseValue *= magicMultiplier;
    }
    
    return Math.round(baseValue);
  }

  /**
   * Get appropriate icon for weapon type
   */
  private getWeaponIcon(weapon: ProcessedWeapon): string {
    // Basic weapon type mapping
    const weaponName = weapon.name.toLowerCase();
    
    // Sword icons
    if (weaponName.includes('sword') || weaponName.includes('rapier') || weaponName.includes('scimitar')) {
      return 'icons/weapons/swords/sword-broad-silver.webp';
    }
    
    // Bow icons
    if (weaponName.includes('bow')) {
      return 'icons/weapons/bows/bow-recurve-leather.webp';
    }
    
    // Crossbow icons
    if (weaponName.includes('crossbow')) {
      return 'icons/weapons/crossbows/crossbow-simple-brown.webp';
    }
    
    // Dagger icons
    if (weaponName.includes('dagger') || weaponName.includes('knife')) {
      return 'icons/weapons/daggers/dagger-straight-steel.webp';
    }
    
    // Axe icons
    if (weaponName.includes('axe') || weaponName.includes('hatchet')) {
      return 'icons/weapons/axes/axe-battle-steel.webp';
    }
    
    // Mace/hammer icons
    if (weaponName.includes('mace') || weaponName.includes('hammer') || weaponName.includes('club')) {
      return 'icons/weapons/maces/mace-round-spiked.webp';
    }
    
    // Spear/polearm icons
    if (weaponName.includes('spear') || weaponName.includes('pike') || weaponName.includes('halberd') || weaponName.includes('glaive')) {
      return 'icons/weapons/polearms/spear-simple-wood.webp';
    }
    
    // Staff icons
    if (weaponName.includes('staff') || weaponName.includes('quarterstaff')) {
      return 'icons/weapons/staves/staff-simple-wood.webp';
    }
    
    // Default based on attack type
    if (weapon.attackType === 'ranged') {
      return 'icons/weapons/ammunition/arrows-bundle-leather-brown.webp';
    } else if (weapon.weaponCategory === 'simple') {
      return 'icons/weapons/clubs/club-simple-wood.webp';
    } else {
      return 'icons/weapons/swords/sword-broad-silver.webp';
    }
  }

  /**
   * Reset the ID counter (useful for testing)
   */
  resetIdCounter(): void {
    this.itemIdCounter = 1;
  }
}