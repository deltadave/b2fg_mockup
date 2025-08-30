/**
 * InventoryProcessor Service
 * 
 * Processes D&D Beyond inventory data into nested structures and generates
 * Fantasy Grounds compatible XML. Uses Strategy pattern for different XML
 * generation approaches and Builder pattern for complex XML construction.
 * 
 * Migrated from legacy functions in utilities.js:
 * - buildNestedInventory() (lines 394-449)
 * - processNestedInventoryXML() (lines 502-779) 
 * - generateContainerContentsXML() (lines 450-501)
 */

import { 
  InventoryItem, 
  ContainerItem, 
  NestedInventoryStructure, 
  ItemXMLGeneration,
  InventoryXMLResult,
  ItemId,
  Weight,
  Quantity 
} from '@/domain/character/models/Inventory';
import type { CharacterData } from '@/domain/character/services/CharacterFetcher';
import { featureFlags } from '@/core/FeatureFlags';
import { StringSanitizer } from '@/shared/utils/StringSanitizer';
import { SafeAccess } from '@/shared/utils/SafeAccess';

export interface InventoryProcessingOptions {
  includeZeroQuantityItems: boolean;
  respectContainerHierarchy: boolean;
  generateDetailedXML: boolean;
  sanitizeOutput: boolean;
  includeCostInformation: boolean;
  markItemsAsIdentified: boolean;
}

// Interface for ConversionOrchestrator integration
export interface ProcessedInventory {
  items: ProcessedInventoryItem[];
  containers: ProcessedContainer[];
  currency: ProcessedCurrency;
  encumbrance: {
    totalWeight: number;
    carryingCapacity: number;
    encumbranceLevel: 'unencumbered' | 'encumbered' | 'heavily_encumbered' | 'overloaded';
  };
  statistics: {
    totalItems: number;
    containerCount: number;
    magicContainers: string[];
    totalValue: { gp: number; };
  };
  processing: {
    timestamp: Date;
    itemsProcessed: number;
    itemsSkipped: number;
    errors: string[];
    warnings: string[];
  };
}

export interface ProcessedInventoryItem {
  id: string;
  name: string;
  type: ItemType;
  subtype?: string;
  quantity: number;
  weight: number;
  value?: { amount: number; currency: CurrencyType };
  description?: string;
  properties: string[];
  isEquipped: boolean;
  isAttuned: boolean;
  isMagical: boolean;
  containerLocation?: string;
  charges?: {
    current: number;
    maximum: number;
  };
  // Format-specific data
  fantasyGrounds: {
    xmlId: string;
    isIdentified: boolean;
    isLocked: boolean;
    location?: string;
  };
  foundryVtt: {
    itemType: FoundryItemType;
    systemData: Record<string, any>;
  };
}

export interface ProcessedContainer {
  id: string;
  name: string;
  weight: number;
  capacity: number;
  currentWeight: number;
  isMagical: boolean;
  contents: string[]; // IDs of contained items
}

export interface ProcessedCurrency {
  pp: number;
  gp: number;
  ep: number;
  sp: number;
  cp: number;
}

export type ItemType = 
  | 'weapon' | 'armor' | 'shield' | 'adventuring-gear' 
  | 'tool' | 'mount' | 'trade-good' | 'consumable'
  | 'treasure' | 'magic-item';

export type FoundryItemType = 
  | 'weapon' | 'equipment' | 'consumable' | 'tool' 
  | 'loot' | 'class' | 'spell' | 'feat' | 'backpack';

export type CurrencyType = 'cp' | 'sp' | 'ep' | 'gp' | 'pp';

export interface InventoryProcessingResult {
  nestedStructure: NestedInventoryStructure;
  xmlResult: InventoryXMLResult;
  statistics: {
    totalItems: number;
    containerCount: number;
    magicContainers: number;
    totalWeight: number;
  };
}

// Strategy Pattern: Different XML generation strategies
export interface XMLGenerationStrategy {
  generateItemXML(item: ItemXMLGeneration, index: number, depth: number): string;
  generateContainerXML(container: ContainerItem, contents: ItemXMLGeneration[], index: number, depth: number): string;
}

export class FantasyGroundsXMLStrategy implements XMLGenerationStrategy {
  private padIndex(index: number): string {
    return String(index).padStart(5, '0');
  }

  generateItemXML(item: ItemXMLGeneration, index: number, depth: number = 0): string {
    const indentBase = '\t'.repeat(3);
    const indentContent = '\t'.repeat(4);
    const itemId = this.padIndex(index);
    
    let xml = `${indentBase}<id-${itemId}>\n`;
    xml += `${indentContent}<count type="number">${item.count}</count>\n`;
    xml += `${indentContent}<name type="string">${item.name}</name>\n`;
    xml += `${indentContent}<weight type="number">${item.weight}</weight>\n`;
    xml += `${indentContent}<locked type="number">${item.isLocked ? 1 : 0}</locked>\n`;
    xml += `${indentContent}<isidentified type="number">${item.isIdentified ? 1 : 0}</isidentified>\n`;
    
    if (item.type) {
      xml += `${indentContent}<type type="string">${item.type}</type>\n`;
    }
    
    if (item.cost) {
      xml += `${indentContent}<cost type="string">${item.cost.value} ${item.cost.denomination}</cost>\n`;
    }
    
    if (item.description) {
      xml += `${indentContent}<description type="formattedtext">\n`;
      xml += `${indentContent}\t<p>${item.description}</p>\n`;
      xml += `${indentContent}</description>\n`;
    }
    
    if (item.properties && item.properties.length > 0) {
      xml += `${indentContent}<properties type="string">${item.properties.join(', ')}</properties>\n`;
    }
    
    // Add location for items inside containers (Fantasy Grounds flat structure)
    if (item.location) {
      xml += `${indentContent}<location type="string">${item.location}</location>\n`;
    }
    
    xml += `${indentBase}</id-${itemId}>\n`;
    return xml;
  }

  generateContainerXML(container: ContainerItem, contents: ItemXMLGeneration[], index: number, depth: number = 0): string {
    // For Fantasy Grounds, containers are just regular items, contents are separate with location tags
    const containerItem: ItemXMLGeneration = {
      id: container.id.toString(),
      name: container.definition.name,
      type: container.definition.subType || container.definition.filterType,
      weight: container.definition.weight,
      count: container.quantity,
      isIdentified: true,
      isLocked: false
    };
    
    return this.generateItemXML(containerItem, index, depth);
  }
}

// Builder Pattern: Complex XML construction
export class InventoryXMLBuilder {
  private xml: string = '';
  private itemCount: number = 0;
  private strategy: XMLGenerationStrategy;

  constructor(strategy: XMLGenerationStrategy) {
    this.strategy = strategy;
  }

  reset(): InventoryXMLBuilder {
    this.xml = '';
    this.itemCount = 0;
    return this;
  }

  addInventoryHeader(): InventoryXMLBuilder {
    this.xml += '\t<inventorylist>\n';
    return this;
  }

  addInventoryFooter(): InventoryXMLBuilder {
    this.xml += '\t</inventorylist>';
    return this;
  }

  addItem(item: ItemXMLGeneration): InventoryXMLBuilder {
    this.itemCount++;
    this.xml += this.strategy.generateItemXML(item, this.itemCount, 0);
    return this;
  }

  build(): { xml: string; itemCount: number } {
    return { xml: this.xml, itemCount: this.itemCount };
  }
}

export class InventoryProcessor {
  private xmlStrategy: XMLGenerationStrategy;
  private xmlBuilder: InventoryXMLBuilder;

  constructor(xmlStrategy: XMLGenerationStrategy = new FantasyGroundsXMLStrategy()) {
    this.xmlStrategy = xmlStrategy;
    this.xmlBuilder = new InventoryXMLBuilder(xmlStrategy);
  }

  /**
   * Process inventory for ConversionOrchestrator integration
   * Creates format-agnostic processed inventory data
   */
  processInventoryForOrchestrator(
    inventory: InventoryItem[], 
    characterId: number,
    characterData: CharacterData,
    options: InventoryProcessingOptions = this.getDefaultOptions()
  ): ProcessedInventory {
    const timestamp = new Date();
    const errors: string[] = [];
    const warnings: string[] = [];
    
    if (featureFlags.isEnabled('inventory_processor_debug')) {
      console.log('📦 InventoryProcessor: Processing inventory for orchestrator', {
        characterId,
        itemCount: inventory.length
      });
    }

    // Process all items into format-agnostic structure
    const processedItems: ProcessedInventoryItem[] = [];
    const processedContainers: ProcessedContainer[] = [];
    let itemsProcessed = 0;
    let itemsSkipped = 0;

    // Build container map first
    const containerMap = new Map<string, InventoryItem>();
    inventory.forEach(item => {
      if (item.definition.isContainer) {
        containerMap.set(item.id.toString(), item);
      }
    });

    // Process each item
    inventory.forEach(item => {
      try {
        if (!options.includeZeroQuantityItems && item.quantity <= 0) {
          itemsSkipped++;
          return;
        }

        const processed = this.translateItemToProcessedFormat(item, containerMap, characterId, errors, warnings);
        
        if (item.definition.isContainer) {
          processedContainers.push(this.createProcessedContainer(item));
        } else {
          processedItems.push(processed);
        }
        
        itemsProcessed++;
      } catch (error) {
        errors.push(`Failed to process item ${item.definition.name}: ${error}`);
        itemsSkipped++;
      }
    });

    // Calculate encumbrance (simplified for now)
    const totalWeight = processedItems.reduce((sum, item) => sum + (item.weight * item.quantity), 0);
    const strScore = SafeAccess.get<number>(characterData, 'stats.0.value', 10) || 10; // STR is first ability
    const carryingCapacity = strScore * 15;
    
    let encumbranceLevel: 'unencumbered' | 'encumbered' | 'heavily_encumbered' | 'overloaded' = 'unencumbered';
    if (totalWeight > carryingCapacity * 2) encumbranceLevel = 'overloaded';
    else if (totalWeight > carryingCapacity) encumbranceLevel = 'heavily_encumbered';
    else if (totalWeight > carryingCapacity * 0.5) encumbranceLevel = 'encumbered';

    // Process currency (simplified - would need currency data from character)
    const currency: ProcessedCurrency = { pp: 0, gp: 0, ep: 0, sp: 0, cp: 0 };
    
    // Calculate statistics
    const magicContainers = processedContainers
      .filter(container => container.isMagical)
      .map(container => container.name);

    const totalValue = processedItems.reduce((sum, item) => {
      return sum + (item.value?.amount || 0) * item.quantity;
    }, 0);

    return {
      items: processedItems,
      containers: processedContainers,
      currency,
      encumbrance: {
        totalWeight,
        carryingCapacity,
        encumbranceLevel
      },
      statistics: {
        totalItems: processedItems.length,
        containerCount: processedContainers.length,
        magicContainers,
        totalValue: { gp: totalValue }
      },
      processing: {
        timestamp,
        itemsProcessed,
        itemsSkipped,
        errors,
        warnings
      }
    };
  }

  /**
   * Process inventory from raw D&D Beyond data into structured format
   * 
   * @param inventory - Raw inventory items from D&D Beyond
   * @param characterId - Character ID for filtering items
   * @param options - Processing options
   * @returns Complete processing result
   */
  processInventory(
    inventory: InventoryItem[], 
    characterId: number,
    options: InventoryProcessingOptions = this.getDefaultOptions()
  ): InventoryProcessingResult {
    
    if (featureFlags.isEnabled('inventory_processor_debug')) {
      console.log('📦 InventoryProcessor: Processing inventory', {
        characterId,
        itemCount: inventory.length,
        options
      });
    }

    // Build nested structure
    const nestedStructure = this.buildNestedStructure(inventory, characterId, options);
    
    // Generate XML
    const xmlResult = this.generateInventoryXML(nestedStructure, options);
    
    // Calculate statistics
    const statistics = this.calculateStatistics(nestedStructure);

    const result: InventoryProcessingResult = {
      nestedStructure,
      xmlResult,
      statistics
    };

    if (featureFlags.isEnabled('inventory_processor_debug')) {
      console.log('📦 InventoryProcessor: Processing complete', {
        totalItems: statistics.totalItems,
        containerCount: statistics.containerCount,
        xmlLength: xmlResult.xml.length
      });
    }

    return result;
  }

  /**
   * Build nested inventory structure with container hierarchy
   * Migrated from legacy buildNestedInventory() function
   */
  private buildNestedStructure(
    inventory: InventoryItem[], 
    characterId: number, 
    options: InventoryProcessingOptions
  ): NestedInventoryStructure {
    
    const itemsByContainer = new Map<string, InventoryItem[]>();
    const containers = new Map<string, ContainerItem>();
    
    // First pass: categorize items and identify containers
    inventory.forEach(item => {
      const containerKey = item.containerEntityId.toString();
      
      // Skip zero quantity items if configured
      if (!options.includeZeroQuantityItems && item.quantity <= 0) {
        return;
      }
      
      // Track containers
      if (item.definition.isContainer) {
        containers.set(item.id.toString(), {
          ...item,
          definition: { ...item.definition, isContainer: true },
          contents: [],
          currentWeight: 0
        } as ContainerItem);
      }
      
      // Group items by container
      if (!itemsByContainer.has(containerKey)) {
        itemsByContainer.set(containerKey, []);
      }
      itemsByContainer.get(containerKey)!.push(item);
    });

    // Second pass: build hierarchy
    const characterIdStr = characterId.toString();
    const rootItems = itemsByContainer.get(characterIdStr) || [];
    
    // Populate container contents
    containers.forEach((container, containerId) => {
      const contents = itemsByContainer.get(containerId) || [];
      container.contents = contents;
      container.currentWeight = this.calculateContainerWeight(contents);
    });

    const totalWeight = this.calculateTotalInventoryWeight(rootItems, containers);
    
    return {
      characterId,
      rootItems,
      containers,
      totalItems: inventory.length,
      totalWeight
    };
  }

  /**
   * Generate Fantasy Grounds XML from nested structure
   * Fantasy Grounds uses flat structure with <location> tags for container relationships
   */
  private generateInventoryXML(
    structure: NestedInventoryStructure, 
    options: InventoryProcessingOptions
  ): InventoryXMLResult {
    
    this.xmlBuilder.reset().addInventoryHeader();
    
    let processedItems = 0;
    let skippedItems = 0;
    let containerItems = 0;
    const magicContainers: string[] = [];
    let itemIndex = 1;

    // First, add all root items (including containers)
    structure.rootItems.forEach(item => {
      if (item.quantity <= 0 && !options.includeZeroQuantityItems) {
        skippedItems++;
        return;
      }

      const xmlItem = this.convertItemToXMLFormat(item, options);
      this.xmlBuilder.addItem(xmlItem);
      processedItems++;
      
      if (item.definition.isContainer) {
        containerItems++;
        if (item.definition.weightMultiplier === 0) {
          magicContainers.push(item.definition.name);
        }
      }
    });

    // Then, add all container contents with location tags
    structure.containers.forEach((container, containerId) => {
      container.contents.forEach(item => {
        if (item.quantity <= 0 && !options.includeZeroQuantityItems) {
          skippedItems++;
          return;
        }

        const xmlItem = this.convertItemToXMLFormat(item, options);
        // Add location tag to indicate which container this item is in
        xmlItem.location = container.definition.name;
        this.xmlBuilder.addItem(xmlItem);
        processedItems++;
      });
    });

    const { xml, itemCount } = this.xmlBuilder.addInventoryFooter().build();

    return {
      xml,
      itemCount,
      totalWeight: structure.totalWeight,
      containerCount: containerItems,
      debugInfo: {
        processedItems,
        skippedItems,
        containerItems,
        magicContainers
      }
    };
  }

  /**
   * Convert inventory item to XML format
   */
  private convertItemToXMLFormat(item: InventoryItem, options: InventoryProcessingOptions): ItemXMLGeneration {
    const name = options.sanitizeOutput 
      ? StringSanitizer.sanitizeForXML(item.customName || item.definition.name)
      : (item.customName || item.definition.name);
    
    const type = options.sanitizeOutput 
      ? StringSanitizer.sanitizeForXML(item.definition.subType || item.definition.filterType)
      : (item.definition.subType || item.definition.filterType);

    const result: ItemXMLGeneration = {
      id: item.id.toString(),
      name,
      type,
      weight: (item.customWeight || item.definition.weight) / (item.definition.bundleSize || 1),
      count: item.quantity,
      isIdentified: options.markItemsAsIdentified,
      isLocked: true // FG default
    };

    if (options.includeCostInformation && item.definition.cost) {
      result.cost = {
        value: item.definition.cost.quantity,
        denomination: item.definition.cost.unit
      };
    }

    if (options.generateDetailedXML && item.definition.description) {
      result.description = options.sanitizeOutput 
        ? StringSanitizer.sanitizeHTML(item.definition.description)
        : item.definition.description;
    }

    return result;
  }

  /**
   * Convert array of items to XML format
   */
  private convertItemsToXMLFormat(items: InventoryItem[], options: InventoryProcessingOptions): ItemXMLGeneration[] {
    return items
      .filter(item => options.includeZeroQuantityItems || item.quantity > 0)
      .map(item => this.convertItemToXMLFormat(item, options));
  }

  /**
   * Calculate weight of items in a container
   */
  private calculateContainerWeight(contents: InventoryItem[]): number {
    return contents.reduce((total, item) => {
      const itemWeight = new Weight(item.definition.weight || 0);
      const quantity = new Quantity(item.quantity);
      return total + quantity.multiply(itemWeight).pounds;
    }, 0);
  }

  /**
   * Calculate total inventory weight
   */
  private calculateTotalInventoryWeight(
    rootItems: InventoryItem[], 
    containers: Map<string, ContainerItem>
  ): number {
    let totalWeight = 0;
    
    rootItems.forEach(item => {
      const itemWeight = new Weight(item.definition.weight || 0);
      const quantity = new Quantity(item.quantity);
      totalWeight += quantity.multiply(itemWeight).pounds;
    });
    
    return totalWeight;
  }

  /**
   * Calculate processing statistics
   */
  private calculateStatistics(structure: NestedInventoryStructure): InventoryProcessingResult['statistics'] {
    return {
      totalItems: structure.totalItems,
      containerCount: structure.containers.size,
      magicContainers: Array.from(structure.containers.values())
        .filter(container => container.definition.weightMultiplier === 0)
        .length,
      totalWeight: structure.totalWeight
    };
  }

  /**
   * Get default processing options
   */
  private getDefaultOptions(): InventoryProcessingOptions {
    return {
      includeZeroQuantityItems: false,
      respectContainerHierarchy: true,
      generateDetailedXML: false,
      sanitizeOutput: true,
      includeCostInformation: true,
      markItemsAsIdentified: true
    };
  }

  /**
   * Validate inventory data before processing
   */
  static validateInventoryData(inventory: InventoryItem[]): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    inventory.forEach((item, index) => {
      if (!item.id || item.id <= 0) {
        errors.push(`Item at index ${index} has invalid ID: ${item.id}`);
      }
      
      if (!item.definition) {
        errors.push(`Item at index ${index} missing definition`);
      }
      
      if (!item.definition.name) {
        errors.push(`Item at index ${index} missing name`);
      }
      
      if (typeof item.quantity !== 'number') {
        errors.push(`Item ${item.definition.name} has invalid quantity: ${item.quantity}`);
      }
    });
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Set XML generation strategy (Strategy Pattern)
   */
  setXMLStrategy(strategy: XMLGenerationStrategy): void {
    this.xmlStrategy = strategy;
    this.xmlBuilder = new InventoryXMLBuilder(strategy);
  }

  /**
   * Translate D&D Beyond item to ProcessedInventoryItem format
   */
  private translateItemToProcessedFormat(
    item: InventoryItem, 
    containerMap: Map<string, InventoryItem>,
    characterId: number,
    errors: string[], 
    warnings: string[]
  ): ProcessedInventoryItem {
    // Determine item type and subtype
    const itemType = this.mapDnDBeyondItemType(item.definition.filterType, item.definition.subType);
    
    // Find container location
    let containerLocation: string | undefined;
    const containerEntityIdStr = item.containerEntityId.toString();
    
    // If container ID is different from character ID, it's in a container
    if (containerEntityIdStr !== characterId.toString()) {
      const container = containerMap.get(containerEntityIdStr);
      if (container) {
        containerLocation = container.definition.name;
      } else {
        warnings.push(`Item ${item.definition.name} references unknown container ${item.containerEntityId}`);
      }
    }

    // Generate Fantasy Grounds XML ID
    const fantasyGroundsXmlId = `id-${String(item.id).padStart(5, '0')}`;

    // Map to Foundry VTT item type
    const foundryItemType = this.mapToFoundryItemType(itemType);

    return {
      id: item.id.toString(),
      name: item.customName || item.definition.name,
      type: itemType,
      subtype: item.definition.subType,
      quantity: item.quantity,
      weight: (item.customWeight || item.definition.weight) / (item.definition.bundleSize || 1),
      value: item.definition.cost ? {
        amount: item.definition.cost.quantity,
        currency: item.definition.cost.unit as CurrencyType
      } : undefined,
      description: item.definition.description,
      properties: this.extractItemProperties(item),
      isEquipped: item.equipped,
      isAttuned: item.isAttuned,
      isMagical: item.definition.magic,
      containerLocation,
      charges: item.limitedUse ? {
        current: item.limitedUse.maxUses - item.chargesUsed,
        maximum: item.limitedUse.maxUses
      } : undefined,
      fantasyGrounds: {
        xmlId: fantasyGroundsXmlId,
        isIdentified: true, // Most items are identified by default
        isLocked: true, // FGU default
        location: containerLocation
      },
      foundryVtt: {
        itemType: foundryItemType,
        systemData: this.buildFoundrySystemData(item, itemType)
      }
    };
  }

  /**
   * Create ProcessedContainer from InventoryItem
   */
  private createProcessedContainer(item: InventoryItem): ProcessedContainer {
    return {
      id: item.id.toString(),
      name: item.definition.name,
      weight: item.definition.weight,
      capacity: item.definition.capacityWeight || 0,
      currentWeight: 0, // Would need to calculate from contents
      isMagical: item.definition.magic || item.definition.weightMultiplier === 0,
      contents: [] // Would need to populate from inventory relationships
    };
  }

  /**
   * Map D&D Beyond item types to our ItemType enum
   */
  private mapDnDBeyondItemType(filterType: string, subType?: string): ItemType {
    const type = filterType.toLowerCase();
    
    if (type.includes('weapon')) return 'weapon';
    if (type.includes('armor')) return 'armor';
    if (type.includes('shield')) return 'shield';
    if (type.includes('wondrous') || type.includes('magic')) return 'magic-item';
    if (type.includes('consumable') || type.includes('potion')) return 'consumable';
    if (type.includes('tool')) return 'tool';
    if (type.includes('gear')) return 'adventuring-gear';
    if (type.includes('treasure') || type.includes('valuable')) return 'treasure';
    
    // Default fallback
    return 'adventuring-gear';
  }

  /**
   * Map ItemType to Foundry VTT item type
   */
  private mapToFoundryItemType(itemType: ItemType): FoundryItemType {
    switch (itemType) {
      case 'weapon': return 'weapon';
      case 'armor': 
      case 'shield': return 'equipment';
      case 'consumable': return 'consumable';
      case 'tool': return 'tool';
      case 'treasure': 
      case 'trade-good': return 'loot';
      case 'adventuring-gear':
      case 'magic-item':
      default: return 'equipment';
    }
  }

  /**
   * Extract item properties from D&D Beyond data
   */
  private extractItemProperties(item: InventoryItem): string[] {
    const properties: string[] = [];
    
    // Add tags from definition
    if (item.definition.tags) {
      properties.push(...item.definition.tags);
    }
    
    // Add weapon properties
    if (item.definition.weaponBehaviors && item.definition.weaponBehaviors.length > 0) {
      item.definition.weaponBehaviors.forEach(behavior => {
        if (behavior.properties) {
          properties.push(...behavior.properties);
        }
      });
    }
    
    // Add magic property if magical
    if (item.definition.magic) {
      properties.push('Magic');
    }
    
    // Add attunement requirement
    if (item.definition.canAttune) {
      properties.push('Requires Attunement');
    }
    
    return properties;
  }

  /**
   * Build Foundry VTT system data for an item
   */
  private buildFoundrySystemData(item: InventoryItem, itemType: ItemType): Record<string, any> {
    const baseData = {
      description: {
        value: item.definition.description || '',
        chat: '',
        unidentified: ''
      },
      quantity: item.quantity,
      weight: (item.customWeight || item.definition.weight) / (item.definition.bundleSize || 1),
      price: {
        value: item.definition.cost?.quantity || 0,
        denomination: this.mapCurrencyToFoundry(item.definition.cost?.unit || 'gp')
      },
      equipped: item.equipped,
      attuned: item.isAttuned,
      identified: !item.definition.magic || item.equipped, // Assume equipped magic items are identified
      rarity: this.mapRarityToFoundry(item.definition.rarity || 'common'),
      properties: this.extractItemProperties(item)
    };

    // Add type-specific data
    if (itemType === 'weapon' && item.definition.damage) {
      return {
        ...baseData,
        damage: {
          parts: [[item.definition.damage, item.definition.damageType || 'bludgeoning']]
        },
        range: {
          value: item.definition.range || null,
          long: item.definition.longRange || null,
          units: 'ft'
        }
      };
    }

    if ((itemType === 'armor' || itemType === 'shield') && item.definition.armorClass !== null) {
      return {
        ...baseData,
        armor: {
          value: item.definition.armorClass,
          type: itemType
        }
      };
    }

    return baseData;
  }

  /**
   * Map D&D Beyond currency to Foundry VTT format
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
   * Map D&D Beyond rarity to Foundry VTT format
   */
  private mapRarityToFoundry(rarity: string): string {
    return rarity.toLowerCase();
  }

  /**
   * Generate Fantasy Grounds XML from ProcessedInventory
   * Used by formatters to create final XML output
   */
  generateFantasyGroundsXML(processedInventory: ProcessedInventory): string {
    this.xmlBuilder.reset().addInventoryHeader();
    
    let itemIndex = 1;
    
    // Add all regular items first
    processedInventory.items.forEach(item => {
      if (item.quantity <= 0) return; // Skip zero quantity items
      
      const xmlItem: ItemXMLGeneration = {
        id: item.fantasyGrounds.xmlId,
        name: StringSanitizer.sanitizeForXML(item.name),
        type: item.type,
        weight: item.weight,
        count: item.quantity,
        isIdentified: item.fantasyGrounds.isIdentified,
        isLocked: item.fantasyGrounds.isLocked,
        cost: item.value ? {
          value: item.value.amount,
          denomination: item.value.currency
        } : undefined,
        description: item.description,
        properties: item.properties,
        location: item.fantasyGrounds.location
      };
      
      this.xmlBuilder.addItem(xmlItem);
      itemIndex++;
    });
    
    // Add containers as regular items (FGU uses flat structure with location tags)
    processedInventory.containers.forEach(container => {
      const xmlContainer: ItemXMLGeneration = {
        id: `id-${String(container.id).padStart(5, '0')}`,
        name: StringSanitizer.sanitizeForXML(container.name),
        type: 'Container',
        weight: container.weight,
        count: 1,
        isIdentified: true,
        isLocked: true
      };
      
      this.xmlBuilder.addItem(xmlContainer);
      itemIndex++;
    });
    
    const { xml } = this.xmlBuilder.addInventoryFooter().build();
    return xml;
  }
}