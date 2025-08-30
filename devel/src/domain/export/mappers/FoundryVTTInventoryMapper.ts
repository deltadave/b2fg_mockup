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
  properties?: string[];
  // Type-specific properties
  damage?: {
    parts: [string, string][];
    versatile?: string;
  };
  range?: {
    value: number | null;
    long: number | null;
    units: string;
  };
  armor?: {
    value: number;
    type: string;
  };
  capacity?: {
    type: string;
    value: number;
    weightless: boolean;
  };
  uses?: {
    value: number;
    max: number | string;
    per: string;
    recovery: string;
  };
}

export class FoundryVTTInventoryMapper {
  private itemIdCounter = 1;

  /**
   * Convert ProcessedInventory to array of Foundry VTT items
   */
  mapInventoryToFoundryItems(processedInventory: ProcessedInventory): FoundryItem[] {
    const foundryItems: FoundryItem[] = [];
    
    // Process regular inventory items
    processedInventory.items.forEach(item => {
      if (item.quantity <= 0) return; // Skip zero quantity items
      
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
   * Build weapon-specific system data
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
      weaponData.properties = [...(weaponData.properties || []), ...weaponProperties];
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
   * Reset the ID counter (useful for testing)
   */
  resetIdCounter(): void {
    this.itemIdCounter = 1;
  }
}