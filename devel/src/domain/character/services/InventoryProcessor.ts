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
import { featureFlags } from '@/core/FeatureFlags';
import { StringSanitizer } from '@/shared/utils/StringSanitizer';

export interface InventoryProcessingOptions {
  includeZeroQuantityItems: boolean;
  respectContainerHierarchy: boolean;
  generateDetailedXML: boolean;
  sanitizeOutput: boolean;
  includeCostInformation: boolean;
  markItemsAsIdentified: boolean;
}

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
}