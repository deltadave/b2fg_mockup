/**
 * EncumbranceCalculator Service Tests
 * 
 * Comprehensive test suite for the EncumbranceCalculator service, covering:
 * - Basic weight calculations
 * - Container weight multipliers (magic containers)
 * - Racial traits (Powerful Build)
 * - Encumbrance levels and penalties
 * - Edge cases and error handling
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { EncumbranceCalculator, type CharacterStrength, type EncumbranceOptions } from '@/domain/character/services/EncumbranceCalculator';
import { type InventoryItem } from '@/domain/character/models/Inventory';

describe('EncumbranceCalculator', () => {
  let calculator: EncumbranceCalculator;
  let mockCharacter: CharacterStrength;
  let mockInventory: InventoryItem[];

  beforeEach(() => {
    calculator = new EncumbranceCalculator();
    
    mockCharacter = {
      id: 12345,
      strengthScore: 15,
      hasPowerfulBuild: false
    };

    mockInventory = [
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
          subType: 'Martial Weapon'
        },
        quantity: 1,
        isAttuned: false,
        equipped: true,
        containerEntityId: 12345 // Carried by character
      },
      {
        id: 2,
        entityTypeId: 1,
        definition: {
          id: 2,
          name: 'Scale Mail',
          weight: 45,
          bundleSize: 1,
          isContainer: false,
          filterType: 'Armor',
          subType: 'Medium Armor'
        },
        quantity: 1,
        isAttuned: false,
        equipped: true,
        containerEntityId: 12345
      }
    ];
  });

  describe('Basic Encumbrance Calculations', () => {
    it('should calculate correct total weight for simple inventory', () => {
      const result = calculator.calculateEncumbrance(mockCharacter, mockInventory);
      
      expect(result.totalWeight).toBe(48); // 3 + 45
      expect(result.encumbranceLevel).toBe('unencumbered');
    });

    it('should calculate correct carrying capacity for STR 15', () => {
      const result = calculator.calculateEncumbrance(mockCharacter, mockInventory);
      
      expect(result.carryingCapacity.normal).toBe(75);  // 15 * 5
      expect(result.carryingCapacity.push).toBe(450);   // 15 * 30
      expect(result.carryingCapacity.lift).toBe(450);   // 15 * 30
    });

    it('should determine encumbrance levels correctly', () => {
      // Test unencumbered (under STR * 5)
      mockInventory = [{
        ...mockInventory[0],
        definition: { ...mockInventory[0].definition, weight: 70 }
      }];
      let result = calculator.calculateEncumbrance(mockCharacter, mockInventory);
      expect(result.encumbranceLevel).toBe('unencumbered');

      // Test encumbered (STR * 5 to STR * 10)
      mockInventory[0].definition.weight = 80;
      result = calculator.calculateEncumbrance(mockCharacter, mockInventory);
      expect(result.encumbranceLevel).toBe('encumbered');
      expect(result.speedPenalty).toBe(10);
      expect(result.disadvantageOnChecks).toBe(false);

      // Test heavily encumbered (STR * 10 to STR * 15)
      mockInventory[0].definition.weight = 160;
      result = calculator.calculateEncumbrance(mockCharacter, mockInventory);
      expect(result.encumbranceLevel).toBe('heavily_encumbered');
      expect(result.speedPenalty).toBe(20);
      expect(result.disadvantageOnChecks).toBe(true);

      // Test overloaded (over STR * 30)
      mockInventory[0].definition.weight = 500;
      result = calculator.calculateEncumbrance(mockCharacter, mockInventory);
      expect(result.encumbranceLevel).toBe('overloaded');
      expect(result.disadvantageOnChecks).toBe(true);
    });
  });

  describe('Container Weight Rules', () => {
    beforeEach(() => {
      mockInventory = [
        // Bag of Holding (magic container)
        {
          id: 100,
          entityTypeId: 1,
          definition: {
            id: 100,
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
          containerEntityId: 12345
        },
        // Heavy items inside the bag
        {
          id: 101,
          entityTypeId: 1,
          definition: {
            id: 101,
            name: 'Iron Ingot',
            weight: 50,
            bundleSize: 1,
            isContainer: false,
            filterType: 'Trade Good'
          },
          quantity: 10,
          isAttuned: false,
          equipped: false,
          containerEntityId: 100 // Inside Bag of Holding
        },
        // Regular backpack
        {
          id: 200,
          entityTypeId: 1,
          definition: {
            id: 200,
            name: 'Backpack',
            weight: 5,
            bundleSize: 1,
            isContainer: true,
            weightMultiplier: 1, // Normal container
            filterType: 'Adventuring Gear'
          },
          quantity: 1,
          isAttuned: false,
          equipped: false,
          containerEntityId: 12345
        },
        // Items in regular backpack
        {
          id: 201,
          entityTypeId: 1,
          definition: {
            id: 201,
            name: 'Rope',
            weight: 10,
            bundleSize: 1,
            isContainer: false,
            filterType: 'Adventuring Gear'
          },
          quantity: 1,
          isAttuned: false,
          equipped: false,
          containerEntityId: 200 // Inside backpack
        }
      ];
    });

    it('should not count weight of items in magic containers', () => {
      const result = calculator.calculateEncumbrance(mockCharacter, mockInventory);
      
      // Should only count: Bag of Holding (15) + Backpack (5) + Rope (10) = 30
      // Iron Ingots (500) should not count due to magic container
      expect(result.totalWeight).toBe(30);
      expect(result.encumbranceLevel).toBe('unencumbered');
    });

    it('should count weight of items in normal containers', () => {
      // Make the bag a normal container
      mockInventory[0].definition.weightMultiplier = 1;
      
      const result = calculator.calculateEncumbrance(mockCharacter, mockInventory);
      
      // Should count all items: 15 + 500 + 5 + 10 = 530
      expect(result.totalWeight).toBe(530);
      expect(result.encumbranceLevel).toBe('overloaded');
    });

    it('should handle containers with partial weight multipliers', () => {
      // Half-weight container
      mockInventory[0].definition.weightMultiplier = 0.5;
      
      const result = calculator.calculateEncumbrance(mockCharacter, mockInventory);
      
      // Should count: Bag (15) + Iron Ingots (500 * 0.5 = 250) + Backpack (5) + Rope (10) = 280
      expect(result.totalWeight).toBe(280);
    });
  });

  describe('Powerful Build Racial Trait', () => {
    beforeEach(() => {
      mockCharacter.hasPowerfulBuild = true;
      mockInventory = [{
        id: 1,
        entityTypeId: 1,
        definition: {
          id: 1,
          name: 'Heavy Armor',
          weight: 100,
          bundleSize: 1,
          isContainer: false,
          filterType: 'Armor'
        },
        quantity: 1,
        isAttuned: false,
        equipped: true,
        containerEntityId: 12345
      }];
    });

    it('should double carrying capacity with Powerful Build', () => {
      const result = calculator.calculateEncumbrance(mockCharacter, mockInventory);
      
      // With Powerful Build, effective STR becomes 30 (capped at 29)
      // But for STR 15, it becomes 30 but gets capped at 29
      // Actually, let's use the correct calculation: min(15 * 2, 29) = 29
      expect(result.carryingCapacity.normal).toBe(145); // 29 * 5
      expect(result.carryingCapacity.push).toBe(870);   // 29 * 30
      expect(result.carryingCapacity.powerfulBuild).toBe(true);
    });

    it('should correctly apply encumbrance with Powerful Build', () => {
      const result = calculator.calculateEncumbrance(mockCharacter, mockInventory);
      
      // 100 lbs with STR 15 normally would be encumbered
      // But with Powerful Build (effective STR 29), it's unencumbered
      expect(result.encumbranceLevel).toBe('unencumbered');
      expect(result.speedPenalty).toBe(0);
    });

    it('should respect the option to disable racial traits', () => {
      const options: EncumbranceOptions = {
        includeContainerWeights: true,
        respectMagicContainers: true,
        applyRacialTraits: false
      };
      
      const result = calculator.calculateEncumbrance(mockCharacter, mockInventory, options);
      
      // Should use base STR 15 without Powerful Build
      expect(result.carryingCapacity.normal).toBe(75);
      expect(result.carryingCapacity.powerfulBuild).toBe(false);
      expect(result.encumbranceLevel).toBe('encumbered'); // 100 > 75
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty inventory', () => {
      const result = calculator.calculateEncumbrance(mockCharacter, []);
      
      expect(result.totalWeight).toBe(0);
      expect(result.encumbranceLevel).toBe('unencumbered');
    });

    it('should skip items with zero or negative quantity', () => {
      mockInventory[0].quantity = 0;
      mockInventory[1].quantity = -1;
      
      const result = calculator.calculateEncumbrance(mockCharacter, mockInventory);
      
      expect(result.totalWeight).toBe(0);
    });

    it('should handle items without weight defined', () => {
      mockInventory[0].definition.weight = 0;
      delete (mockInventory[1].definition as any).weight;
      
      const result = calculator.calculateEncumbrance(mockCharacter, mockInventory);
      
      expect(result.totalWeight).toBe(0);
    });

    it('should validate inventory data', () => {
      const invalidInventory = [
        { ...mockInventory[0], id: -1 },
        { ...mockInventory[1], quantity: -5 }
      ];
      
      const validation = EncumbranceCalculator.validateInventoryData(invalidInventory as InventoryItem[]);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toHaveLength(2);
      expect(validation.errors[0]).toContain('invalid ID');
      expect(validation.errors[1]).toContain('negative quantity');
    });
  });

  describe('Debug Information', () => {
    it('should provide detailed debug information', () => {
      const debugInfo = calculator.getEncumbranceDebugInfo(mockCharacter, mockInventory);
      
      expect(debugInfo.itemBreakdown).toHaveLength(2);
      expect(debugInfo.itemBreakdown[0]).toEqual({
        itemId: 1,
        itemName: 'Longsword',
        weight: 3,
        quantity: 1,
        totalWeight: 3,
        magicContainer: false
      });
      
      expect(debugInfo.strengthCalculation).toEqual({
        baseStrength: 15,
        modifiers: 0,
        finalStrength: 15,
        powerfulBuild: false
      });
      
      expect(debugInfo.carryingCapacityCalculation).toEqual({
        normal: 75,
        encumbered: 150,
        heavilyEncumbered: 225,
        maximum: 450
      });
    });
  });

  describe('Static Utility Methods', () => {
    it('should detect Powerful Build from character data', () => {
      const goliathCharacter = {
        race: { fullName: 'Goliath' }
      };
      
      expect(EncumbranceCalculator.hasPowerfulBuild(goliathCharacter)).toBe(true);
    });

    it('should detect Powerful Build from traits', () => {
      const characterWithTrait = {
        traits: [
          { definition: { name: 'Powerful Build' } }
        ]
      };
      
      expect(EncumbranceCalculator.hasPowerfulBuild(characterWithTrait)).toBe(true);
    });

    it('should return false for characters without Powerful Build', () => {
      const normalCharacter = {
        race: { fullName: 'Human' }
      };
      
      expect(EncumbranceCalculator.hasPowerfulBuild(normalCharacter)).toBe(false);
    });
  });
});