/**
 * InventoryProcessor Service Tests
 * 
 * Comprehensive test suite for the InventoryProcessor service, covering:
 * - Nested inventory structure building
 * - XML generation with different strategies
 * - Container hierarchy processing
 * - Edge cases and validation
 * - Strategy and Builder patterns
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  InventoryProcessor, 
  FantasyGroundsXMLStrategy,
  type InventoryProcessingOptions,
  type XMLGenerationStrategy 
} from '@/domain/character/services/InventoryProcessor';
import { type InventoryItem, type ContainerItem, type ItemXMLGeneration } from '@/domain/character/models/Inventory';

describe('InventoryProcessor', () => {
  let processor: InventoryProcessor;
  let mockInventory: InventoryItem[];
  const characterId = 12345;

  beforeEach(() => {
    processor = new InventoryProcessor();
    
    mockInventory = [
      // Regular item carried by character
      {
        id: 1,
        entityTypeId: 1,
        definition: {
          id: 1,
          name: 'Longsword',
          weight: 3,
          bundleSize: 1,
          isContainer: false,
          filterType: 'Weapon',
          subType: 'Martial Weapon',
          cost: { quantity: 15, unit: 'gp' }
        },
        quantity: 1,
        isAttuned: false,
        equipped: true,
        containerEntityId: characterId
      },
      // Container item
      {
        id: 100,
        entityTypeId: 1,
        definition: {
          id: 100,
          name: 'Backpack',
          weight: 5,
          bundleSize: 1,
          isContainer: true,
          weightMultiplier: 1,
          filterType: 'Adventuring Gear'
        },
        quantity: 1,
        isAttuned: false,
        equipped: false,
        containerEntityId: characterId
      },
      // Items inside container
      {
        id: 101,
        entityTypeId: 1,
        definition: {
          id: 101,
          name: 'Rope',
          weight: 10,
          bundleSize: 1,
          isContainer: false,
          filterType: 'Adventuring Gear'
        },
        quantity: 1,
        isAttuned: false,
        equipped: false,
        containerEntityId: 100 // Inside backpack
      },
      {
        id: 102,
        entityTypeId: 1,
        definition: {
          id: 102,
          name: 'Rations',
          weight: 2,
          bundleSize: 1,
          isContainer: false,
          filterType: 'Adventuring Gear'
        },
        quantity: 10,
        isAttuned: false,
        equipped: false,
        containerEntityId: 100 // Inside backpack
      },
      // Zero quantity item (should be filtered)
      {
        id: 200,
        entityTypeId: 1,
        definition: {
          id: 200,
          name: 'Empty Potion',
          weight: 0.5,
          bundleSize: 1,
          isContainer: false,
          filterType: 'Consumable'
        },
        quantity: 0,
        isAttuned: false,
        equipped: false,
        containerEntityId: characterId
      }
    ];
  });

  describe('Inventory Structure Building', () => {
    it('should build correct nested inventory structure', () => {
      const result = processor.processInventory(mockInventory, characterId);
      
      expect(result.nestedStructure.characterId).toBe(characterId);
      expect(result.nestedStructure.rootItems).toHaveLength(3); // sword, backpack, empty potion (but zero quantity filtered in XML)
      expect(result.nestedStructure.containers.size).toBe(1);
      
      const backpack = result.nestedStructure.containers.get('100');
      expect(backpack).toBeDefined();
      expect(backpack!.contents).toHaveLength(2); // rope and rations
    });

    it('should filter zero quantity items when configured', () => {
      const options: InventoryProcessingOptions = {
        includeZeroQuantityItems: false,
        respectContainerHierarchy: true,
        generateDetailedXML: false,
        sanitizeOutput: true,
        includeCostInformation: true,
        markItemsAsIdentified: true
      };
      
      const result = processor.processInventory(mockInventory, characterId, options);
      
      // Should exclude the zero quantity empty potion
      expect(result.nestedStructure.rootItems.filter(item => item.quantity > 0)).toHaveLength(2);
    });

    it('should include zero quantity items when configured', () => {
      const options: InventoryProcessingOptions = {
        includeZeroQuantityItems: true,
        respectContainerHierarchy: true,
        generateDetailedXML: false,
        sanitizeOutput: true,
        includeCostInformation: true,
        markItemsAsIdentified: true
      };
      
      const result = processor.processInventory(mockInventory, characterId, options);
      
      expect(result.nestedStructure.rootItems).toHaveLength(3);
    });

    it('should calculate correct container weights', () => {
      const result = processor.processInventory(mockInventory, characterId);
      
      const backpack = result.nestedStructure.containers.get('100');
      expect(backpack!.currentWeight).toBe(30); // rope (10) + rations (2 * 10)
    });
  });

  describe('XML Generation', () => {
    it('should generate valid Fantasy Grounds XML', () => {
      const result = processor.processInventory(mockInventory, characterId);
      
      expect(result.xmlResult.xml).toContain('<inventorylist>');
      expect(result.xmlResult.xml).toContain('</inventorylist>');
      expect(result.xmlResult.xml).toContain('<name type="string">Longsword</name>');
      expect(result.xmlResult.xml).toContain('<weight type="number">3</weight>');
      expect(result.xmlResult.xml).toContain('<count type="number">1</count>');
    });

    it('should generate container XML with nested items', () => {
      const result = processor.processInventory(mockInventory, characterId);
      
      // Should contain backpack with nested inventory
      expect(result.xmlResult.xml).toContain('<name type="string">Backpack</name>');
      expect(result.xmlResult.xml).toContain('<inventorylist>'); // Nested inventory
      expect(result.xmlResult.xml).toContain('<name type="string">Rope</name>');
      expect(result.xmlResult.xml).toContain('<name type="string">Rations</name>');
    });

    it('should sanitize item names in XML', () => {
      mockInventory[0].definition.name = 'Sword & Shield';
      
      const result = processor.processInventory(mockInventory, characterId);
      
      expect(result.xmlResult.xml).toContain('Sword &amp; Shield');
      expect(result.xmlResult.xml).not.toContain('Sword & Shield');
    });

    it('should include cost information when configured', () => {
      const options: InventoryProcessingOptions = {
        includeZeroQuantityItems: false,
        respectContainerHierarchy: true,
        generateDetailedXML: false,
        sanitizeOutput: true,
        includeCostInformation: true,
        markItemsAsIdentified: true
      };
      
      const result = processor.processInventory(mockInventory, characterId, options);
      
      expect(result.xmlResult.xml).toContain('<cost type="string">15 gp</cost>');
    });

    it('should exclude cost information when configured', () => {
      const options: InventoryProcessingOptions = {
        includeZeroQuantityItems: false,
        respectContainerHierarchy: true,
        generateDetailedXML: false,
        sanitizeOutput: true,
        includeCostInformation: false,
        markItemsAsIdentified: true
      };
      
      const result = processor.processInventory(mockInventory, characterId, options);
      
      expect(result.xmlResult.xml).not.toContain('<cost type="string">');
    });

    it('should handle bundle sizes correctly', () => {
      mockInventory[0].definition.bundleSize = 50; // Arrow bundle
      mockInventory[0].definition.weight = 1; // 1 lb per 50 arrows
      
      const result = processor.processInventory(mockInventory, characterId);
      
      // Weight should be divided by bundle size: 1/50 = 0.02
      expect(result.xmlResult.xml).toContain('<weight type="number">0.02</weight>');
    });
  });

  describe('Statistics Calculation', () => {
    it('should calculate correct statistics', () => {
      const result = processor.processInventory(mockInventory, characterId);
      
      expect(result.statistics.totalItems).toBe(5);
      expect(result.statistics.containerCount).toBe(1);
      expect(result.statistics.magicContainers).toBe(0);
      expect(result.statistics.totalWeight).toBe(43); // sword (3) + backpack (5) + rope (10) + rations (20) + empty potion (0.5)
    });

    it('should identify magic containers', () => {
      // Add a Bag of Holding
      mockInventory.push({
        id: 300,
        entityTypeId: 1,
        definition: {
          id: 300,
          name: 'Bag of Holding',
          weight: 15,
          bundleSize: 1,
          isContainer: true,
          weightMultiplier: 0, // Magic container
          filterType: 'Wondrous Item'
        },
        quantity: 1,
        isAttuned: false,
        equipped: false,
        containerEntityId: characterId
      });
      
      const result = processor.processInventory(mockInventory, characterId);
      
      expect(result.statistics.magicContainers).toBe(1);
      expect(result.xmlResult.debugInfo.magicContainers).toContain('Bag of Holding');
    });
  });

  describe('Strategy Pattern - XML Generation', () => {
    it('should use custom XML strategy when provided', () => {
      const mockStrategy: XMLGenerationStrategy = {
        generateItemXML: vi.fn((item, index, depth) => `<custom-item-${index}>${item.name}</custom-item-${index}>\n`),
        generateContainerXML: vi.fn((container, contents, index, depth) => `<custom-container-${index}>${container.definition.name}</custom-container-${index}>\n`)
      };
      
      processor.setXMLStrategy(mockStrategy);
      const result = processor.processInventory(mockInventory, characterId);
      
      expect(mockStrategy.generateItemXML).toHaveBeenCalled();
      expect(result.xmlResult.xml).toContain('<custom-item-');
    });
  });

  describe('FantasyGroundsXMLStrategy', () => {
    let strategy: FantasyGroundsXMLStrategy;

    beforeEach(() => {
      strategy = new FantasyGroundsXMLStrategy();
    });

    it('should generate correct item XML structure', () => {
      const mockItem: ItemXMLGeneration = {
        id: '1',
        name: 'Test Item',
        type: 'Weapon',
        weight: 5,
        count: 2,
        isIdentified: true,
        isLocked: false,
        cost: { value: 10, denomination: 'gp' }
      };
      
      const xml = strategy.generateItemXML(mockItem, 1, 0);
      
      expect(xml).toContain('<id-00001>');
      expect(xml).toContain('<name type="string">Test Item</name>');
      expect(xml).toContain('<type type="string">Weapon</type>');
      expect(xml).toContain('<weight type="number">5</weight>');
      expect(xml).toContain('<count type="number">2</count>');
      expect(xml).toContain('<isidentified type="number">1</isidentified>');
      expect(xml).toContain('<locked type="number">0</locked>');
      expect(xml).toContain('<cost type="string">10 gp</cost>');
      expect(xml).toContain('</id-00001>');
    });

    it('should generate container XML with nested inventory', () => {
      const mockContainer: ContainerItem = {
        id: 100,
        entityTypeId: 1,
        definition: {
          id: 100,
          name: 'Test Container',
          weight: 2,
          bundleSize: 1,
          isContainer: true,
          weightMultiplier: 1,
          filterType: 'Container'
        },
        quantity: 1,
        isAttuned: false,
        equipped: false,
        containerEntityId: 12345,
        contents: [],
        currentWeight: 10
      };
      
      const mockContents: ItemXMLGeneration[] = [{
        id: '101',
        name: 'Inner Item',
        type: 'Gear',
        weight: 1,
        count: 1,
        isIdentified: true,
        isLocked: true
      }];
      
      const xml = strategy.generateContainerXML(mockContainer, mockContents, 1, 0);
      
      expect(xml).toContain('<name type="string">Test Container</name>');
      expect(xml).toContain('<inventorylist>');
      expect(xml).toContain('<name type="string">Inner Item</name>');
      expect(xml).toContain('</inventorylist>');
    });
  });

  describe('Validation and Error Handling', () => {
    it('should validate inventory data correctly', () => {
      const validInventory = [mockInventory[0]];
      const validation = InventoryProcessor.validateInventoryData(validInventory);
      
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should detect invalid inventory data', () => {
      const invalidInventory = [
        { ...mockInventory[0], id: -1 },
        { ...mockInventory[0], definition: undefined as any },
        { ...mockInventory[0], quantity: 'invalid' as any }
      ];
      
      const validation = InventoryProcessor.validateInventoryData(invalidInventory as InventoryItem[]);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
      expect(validation.errors.some(error => error.includes('invalid ID'))).toBe(true);
    });

    it('should handle empty inventory gracefully', () => {
      const result = processor.processInventory([], characterId);
      
      expect(result.nestedStructure.rootItems).toHaveLength(0);
      expect(result.nestedStructure.containers.size).toBe(0);
      expect(result.xmlResult.xml).toContain('<inventorylist>\n\t\t</inventorylist>');
      expect(result.statistics.totalItems).toBe(0);
    });

    it('should handle malformed item definitions', () => {
      const malformedInventory = [{
        ...mockInventory[0],
        definition: {
          ...mockInventory[0].definition,
          weight: undefined as any,
          name: ''
        }
      }];
      
      // Should not throw, but handle gracefully
      expect(() => {
        processor.processInventory(malformedInventory as InventoryItem[], characterId);
      }).not.toThrow();
    });
  });

  describe('Debug Information', () => {
    it('should provide detailed debug information', () => {
      const result = processor.processInventory(mockInventory, characterId);
      
      expect(result.xmlResult.debugInfo).toBeDefined();
      expect(result.xmlResult.debugInfo.processedItems).toBeGreaterThan(0);
      expect(result.xmlResult.debugInfo.containerItems).toBe(1);
      expect(typeof result.xmlResult.debugInfo.skippedItems).toBe('number');
      expect(Array.isArray(result.xmlResult.debugInfo.magicContainers)).toBe(true);
    });
  });
});