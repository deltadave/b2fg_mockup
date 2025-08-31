/**
 * Weapon Processing Integration Tests
 * 
 * Tests the complete weapon processing pipeline from raw D&D Beyond data
 * through to Fantasy Grounds XML and Foundry VTT JSON output.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { WeaponProcessor } from '@/domain/character/services/WeaponProcessor';
import { InventoryProcessor } from '@/domain/character/services/InventoryProcessor';
import { FoundryVTTInventoryMapper } from '@/domain/export/mappers/FoundryVTTInventoryMapper';
import { FantasyGroundsXMLFormatter } from '@/domain/export/formatters/FantasyGroundsXMLFormatter';
import type { CharacterData } from '@/domain/character/services/CharacterFetcher';
import type { ProcessedAbilityScores } from '@/domain/character/services/AbilityScoreProcessor';
import type { ProcessedProficiencies } from '@/domain/character/services/ProficiencyProcessor';

describe('Weapon Processing Integration', () => {
  let inventoryProcessor: InventoryProcessor;
  let foundryMapper: FoundryVTTInventoryMapper;
  let fantasyGroundsFormatter: FantasyGroundsXMLFormatter;

  const mockCharacterData: CharacterData = {
    id: 151483095,
    name: 'Integration Test Character',
    classes: [
      {
        id: 1,
        entityTypeId: 1,
        level: 5,
        isStartingClass: true,
        hitDiceUsed: 0,
        definition: {
          id: 1,
          name: 'Fighter',
          hitDie: 10
        }
      }
    ],
    inventory: [
      // Longsword +1 (magical martial weapon)
      {
        id: 1748604896,
        entityTypeId: 1439493548,
        definition: {
          id: 5367,
          name: 'Longsword +1',
          filterType: 'Weapon',
          weight: 3,
          cost: { quantity: 50, unit: 'gp' },
          damage: {
            diceCount: 1,
            diceValue: 8,
            diceMultiplier: null,
            fixedValue: null
          },
          damageType: 'Slashing',
          attackType: 1, // melee
          categoryId: 2, // martial
          properties: [
            {
              name: 'Versatile',
              description: 'This weapon can be used with one or two hands. A damage value in parentheses appears with the property—the damage when the weapon is used with two hands to make a melee attack.'
            }
          ],
          range: 5,
          longRange: null,
          baseItemId: 5,
          weaponBehaviors: [],
          isMonkWeapon: false
        },
        quantity: 1,
        equipped: true,
        isAttuned: false,
        containerEntityId: 151483095,
        grantedModifiers: [
          {
            fixedValue: 1,
            type: 'bonus',
            subType: 'magic',
            dice: null
          }
        ]
      },
      // Longbow (martial ranged weapon)
      {
        id: 1748604897,
        entityTypeId: 1439493548,
        definition: {
          id: 37,
          name: 'Longbow',
          filterType: 'Weapon',
          weight: 2,
          cost: { quantity: 50, unit: 'gp' },
          damage: {
            diceCount: 1,
            diceValue: 8,
            diceMultiplier: null,
            fixedValue: null
          },
          damageType: 'Piercing',
          attackType: 2, // ranged
          categoryId: 2, // martial
          properties: [
            {
              name: 'Ammunition',
              description: 'You can use a weapon that has the ammunition property to make a ranged attack only if you have ammunition to fire from the weapon.'
            },
            {
              name: 'Heavy',
              description: 'Heavy weapons are unwieldy. Small creatures have disadvantage on attack rolls with heavy weapons.'
            },
            {
              name: 'Two-Handed',
              description: 'This weapon requires two hands when you attack with it.'
            }
          ],
          range: 150,
          longRange: 600,
          baseItemId: 37,
          weaponBehaviors: [],
          isMonkWeapon: false
        },
        quantity: 1,
        equipped: false,
        isAttuned: false,
        containerEntityId: 151483095,
        grantedModifiers: []
      },
      // Dagger (simple finesse weapon)
      {
        id: 1748604898,
        entityTypeId: 1439493548,
        definition: {
          id: 3,
          name: 'Dagger',
          filterType: 'Weapon',
          weight: 1,
          cost: { quantity: 2, unit: 'gp' },
          damage: {
            diceCount: 1,
            diceValue: 4,
            diceMultiplier: null,
            fixedValue: null
          },
          damageType: 'Piercing',
          attackType: 1, // melee
          categoryId: 1, // simple
          properties: [
            {
              name: 'Finesse',
              description: 'When making an attack with a finesse weapon, you use your choice of your Strength or Dexterity modifier for the attack and damage rolls.'
            },
            {
              name: 'Light',
              description: 'A light weapon is small and easy to handle, making it ideal for use when fighting with two weapons.'
            },
            {
              name: 'Thrown',
              description: 'If a weapon has the thrown property, you can throw the weapon to make a ranged attack.'
            }
          ],
          range: 20,
          longRange: 60,
          baseItemId: 3,
          weaponBehaviors: [],
          isMonkWeapon: true
        },
        quantity: 2,
        equipped: true,
        isAttuned: false,
        containerEntityId: 151483095,
        grantedModifiers: []
      }
    ]
  } as CharacterData;

  const mockAbilities: ProcessedAbilityScores = {
    strength: { base: 16, bonus: 0, override: null, total: 16, modifier: 3 },
    dexterity: { base: 14, bonus: 0, override: null, total: 14, modifier: 2 },
    constitution: { base: 15, bonus: 0, override: null, total: 15, modifier: 2 },
    intelligence: { base: 10, bonus: 0, override: null, total: 10, modifier: 0 },
    wisdom: { base: 12, bonus: 0, override: null, total: 12, modifier: 1 },
    charisma: { base: 8, bonus: 0, override: null, total: 8, modifier: -1 }
  };

  const mockProficiencies: ProcessedProficiencies = {
    weapons: [
      { name: 'Simple weapons', display: 'Simple weapons', category: 'weapon', entityId: 1, entityTypeId: 1 },
      { name: 'Martial weapons', display: 'Martial weapons', category: 'weapon', entityId: 2, entityTypeId: 1 }
    ],
    armor: [],
    tools: [],
    all: [],
    skippedProficiencies: [],
    debugInfo: { totalFound: 2, totalMapped: 2, duplicatesRemoved: 0 }
  };

  beforeEach(() => {
    inventoryProcessor = new InventoryProcessor();
    foundryMapper = new FoundryVTTInventoryMapper();
    fantasyGroundsFormatter = new FantasyGroundsXMLFormatter();
  });

  describe('Complete Pipeline Integration', () => {
    it('should process weapons through entire pipeline', async () => {
      // Process inventory with enhanced weapon data
      const processedInventory = inventoryProcessor.processInventoryForOrchestrator(
        mockCharacterData.inventory!,
        mockCharacterData.id,
        mockCharacterData,
        mockAbilities,
        mockProficiencies
      );

      // Verify weapon processing results
      expect(processedInventory.weapons).toBeDefined();
      expect(processedInventory.weapons.weapons).toHaveLength(3);
      expect(processedInventory.statistics.weaponCount).toBe(3);
      expect(processedInventory.statistics.equippedWeapons).toBe(2);

      // Check specific weapons
      const longsword = processedInventory.weapons.weapons.find(w => w.name === 'Longsword +1');
      expect(longsword).toBeDefined();
      expect(longsword!.isMagical).toBe(true);
      expect(longsword!.magicBonus).toBe(1);
      expect(longsword!.attackBonus).toBe(7); // STR(3) + Prof(3) + Magic(1)
      expect(longsword!.damageFormula).toBe('1d8+4'); // STR(3) + Magic(1)
      expect(longsword!.versatileDamageFormula).toBe('1d10+4');

      const longbow = processedInventory.weapons.weapons.find(w => w.name === 'Longbow');
      expect(longbow).toBeDefined();
      expect(longbow!.attackType).toBe('ranged');
      expect(longbow!.primaryAbility).toBe('dexterity');
      expect(longbow!.range).toBeDefined();
      expect(longbow!.range!.normal).toBe(150);
      expect(longbow!.range!.long).toBe(600);

      const dagger = processedInventory.weapons.weapons.find(w => w.name === 'Dagger');
      expect(dagger).toBeDefined();
      expect(dagger!.finesse).toBe(true);
      expect(dagger!.primaryAbility).toBe('strength'); // STR is higher than DEX
      expect(dagger!.quantity).toBe(2);
    });

    it('should generate Fantasy Grounds XML for weapons', () => {
      // Process inventory
      const processedInventory = inventoryProcessor.processInventoryForOrchestrator(
        mockCharacterData.inventory!,
        mockCharacterData.id,
        mockCharacterData,
        mockAbilities,
        mockProficiencies
      );

      // Generate Fantasy Grounds XML
      const fantasyGroundsXML = inventoryProcessor.generateFantasyGroundsXML(processedInventory);

      // Verify XML contains weapons
      expect(fantasyGroundsXML).toContain('<inventorylist>');
      expect(fantasyGroundsXML).toContain('Longsword +1');
      expect(fantasyGroundsXML).toContain('Longbow');
      expect(fantasyGroundsXML).toContain('Dagger');
      expect(fantasyGroundsXML).toContain('type="string">Weapon</type>');

      // Check for proper XML structure
      expect(fantasyGroundsXML).toMatch(/<id-\d{5}>/);
      expect(fantasyGroundsXML).toContain('<count type="number">');
      expect(fantasyGroundsXML).toContain('<weight type="number">');
    });

    it('should generate Foundry VTT JSON for weapons', () => {
      // Process inventory
      const processedInventory = inventoryProcessor.processInventoryForOrchestrator(
        mockCharacterData.inventory!,
        mockCharacterData.id,
        mockCharacterData,
        mockAbilities,
        mockProficiencies
      );

      // Convert to Foundry items
      const foundryItems = foundryMapper.mapInventoryToFoundryItems(processedInventory);

      // Find weapon items
      const weaponItems = foundryItems.filter(item => item.type === 'weapon');
      expect(weaponItems).toHaveLength(3);

      // Check longsword +1
      const longswordItem = weaponItems.find(item => item.name === 'Longsword +1');
      expect(longswordItem).toBeDefined();
      expect(longswordItem!.system.weaponType).toBe('martial');
      expect(longswordItem!.system.damage!.parts).toContainEqual(['1d8+4', 'slashing']);
      expect(longswordItem!.system.damage!.versatile).toBe('1d10+4');
      expect(longswordItem!.system.attackBonus).toBe(1); // Only magic bonus
      expect(longswordItem!.system.proficient).toBe(true);
      expect(longswordItem!.system.equipped).toBe(true);

      // Check properties format
      expect(longswordItem!.system.properties).toBeDefined();
      expect(longswordItem!.system.properties!.ver).toBe(true); // versatile

      // Check longbow
      const longbowItem = weaponItems.find(item => item.name === 'Longbow');
      expect(longbowItem).toBeDefined();
      expect(longbowItem!.system.range!.value).toBe(150);
      expect(longbowItem!.system.range!.long).toBe(600);
      expect(longbowItem!.system.ability).toBe('dex');
      expect(longbowItem!.system.actionType).toBe('rwak');
      expect(longbowItem!.system.properties!.amm).toBe(true); // ammunition
      expect(longbowItem!.system.properties!.hvy).toBe(true); // heavy
      expect(longbowItem!.system.properties!.two).toBe(true); // two-handed

      // Check dagger
      const daggerItem = weaponItems.find(item => item.name === 'Dagger');
      expect(daggerItem).toBeDefined();
      expect(daggerItem!.system.weaponType).toBe('simple');
      expect(daggerItem!.system.quantity).toBe(2);
      expect(daggerItem!.system.properties!.fin).toBe(true); // finesse
      expect(daggerItem!.system.properties!.lgt).toBe(true); // light
      expect(daggerItem!.system.properties!.thr).toBe(true); // thrown
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle inventory with no weapons', () => {
      const emptyCharacterData: CharacterData = {
        ...mockCharacterData,
        inventory: [
          {
            id: 1,
            entityTypeId: 1,
            definition: {
              id: 1,
              name: 'Rope, Hempen',
              filterType: 'Adventuring Gear',
              weight: 2,
              cost: { quantity: 2, unit: 'gp' }
            },
            quantity: 1,
            equipped: false,
            isAttuned: false,
            containerEntityId: 151483095,
            grantedModifiers: []
          }
        ]
      } as CharacterData;

      const processedInventory = inventoryProcessor.processInventoryForOrchestrator(
        emptyCharacterData.inventory!,
        emptyCharacterData.id,
        emptyCharacterData,
        mockAbilities,
        mockProficiencies
      );

      expect(processedInventory.weapons.weapons).toHaveLength(0);
      expect(processedInventory.statistics.weaponCount).toBe(0);

      // Should still generate valid XML and JSON
      const xml = inventoryProcessor.generateFantasyGroundsXML(processedInventory);
      expect(xml).toContain('<inventorylist>');

      const foundryItems = foundryMapper.mapInventoryToFoundryItems(processedInventory);
      expect(foundryItems.filter(item => item.type === 'weapon')).toHaveLength(0);
    });

    it('should handle weapons without proficiency', () => {
      const noProficiencyData: ProcessedProficiencies = {
        weapons: [], // No weapon proficiencies
        armor: [],
        tools: [],
        all: [],
        skippedProficiencies: [],
        debugInfo: { totalFound: 0, totalMapped: 0, duplicatesRemoved: 0 }
      };

      const processedInventory = inventoryProcessor.processInventoryForOrchestrator(
        mockCharacterData.inventory!,
        mockCharacterData.id,
        mockCharacterData,
        mockAbilities,
        noProficiencyData
      );

      const weapons = processedInventory.weapons.weapons;
      expect(weapons).toHaveLength(3);

      // All weapons should be non-proficient
      weapons.forEach(weapon => {
        expect(weapon.proficient).toBe(false);
        // Attack bonus should not include proficiency bonus
        expect(weapon.attackBonus).toBeLessThan(6); // Would be 6+ with proficiency
      });
    });

    it('should handle weapons with missing or invalid data gracefully', () => {
      const malformedInventory = [
        {
          id: 999,
          entityTypeId: 1,
          definition: {
            id: 999,
            name: 'Broken Weapon',
            filterType: 'Weapon',
            weight: 1,
            damage: null as any, // Invalid damage
            damageType: '', // Empty damage type
            attackType: 1,
            categoryId: 1,
            properties: [],
            range: 0,
            longRange: null,
            baseItemId: 999,
            weaponBehaviors: [],
            isMonkWeapon: false
          },
          quantity: 1,
          equipped: false,
          isAttuned: false,
          containerEntityId: 151483095,
          grantedModifiers: []
        }
      ];

      // Should not throw an error
      expect(() => {
        const processedInventory = inventoryProcessor.processInventoryForOrchestrator(
          malformedInventory,
          mockCharacterData.id,
          mockCharacterData,
          mockAbilities,
          mockProficiencies
        );
      }).not.toThrow();
    });
  });

  describe('Format Compatibility', () => {
    it('should generate consistent weapon data across formats', () => {
      const processedInventory = inventoryProcessor.processInventoryForOrchestrator(
        mockCharacterData.inventory!,
        mockCharacterData.id,
        mockCharacterData,
        mockAbilities,
        mockProficiencies
      );

      const foundryItems = foundryMapper.mapInventoryToFoundryItems(processedInventory);
      const weaponItems = foundryItems.filter(item => item.type === 'weapon');

      // Verify each processed weapon has corresponding Foundry item
      processedInventory.weapons.weapons.forEach(processedWeapon => {
        const foundryWeapon = weaponItems.find(item => item.name === processedWeapon.name);
        expect(foundryWeapon).toBeDefined();

        // Check basic consistency
        expect(foundryWeapon!.system.quantity).toBe(processedWeapon.quantity);
        expect(foundryWeapon!.system.weight).toBe(processedWeapon.weight);
        expect(foundryWeapon!.system.equipped).toBe(processedWeapon.equipped);
        expect(foundryWeapon!.system.proficient).toBe(processedWeapon.proficient);

        // Check weapon type mapping
        expect(foundryWeapon!.system.weaponType).toBe(processedWeapon.weaponCategory);

        // Check action type
        const expectedActionType = processedWeapon.attackType === 'melee' ? 'mwak' : 'rwak';
        expect(foundryWeapon!.system.actionType).toBe(expectedActionType);
      });
    });

    it('should preserve weapon statistics across processing', () => {
      const processedInventory = inventoryProcessor.processInventoryForOrchestrator(
        mockCharacterData.inventory!,
        mockCharacterData.id,
        mockCharacterData,
        mockAbilities,
        mockProficiencies
      );

      // Verify statistics match actual weapon count
      const actualWeaponCount = processedInventory.weapons.weapons.length;
      const actualEquippedCount = processedInventory.weapons.weapons.filter(w => w.equipped).length;
      const actualMagicalCount = processedInventory.weapons.weapons.filter(w => w.isMagical).length;

      expect(processedInventory.statistics.weaponCount).toBe(actualWeaponCount);
      expect(processedInventory.statistics.equippedWeapons).toBe(actualEquippedCount);
      expect(processedInventory.weapons.statistics.magicalCount).toBe(actualMagicalCount);
    });
  });
});