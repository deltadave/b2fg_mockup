/**
 * WeaponProcessor Unit Tests
 * 
 * Tests for weapon combat calculations, property handling, and format conversion.
 * Covers simple weapons, martial weapons, finesse weapons, ranged weapons, and magical weapons.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { WeaponProcessor } from '@/domain/character/services/WeaponProcessor';
import type { ProcessedAbilityScores } from '@/domain/character/services/AbilityScoreProcessor';
import type { ProcessedProficiencies } from '@/domain/character/services/ProficiencyProcessor';
import type { CharacterData } from '@/domain/character/services/CharacterFetcher';
import type { InventoryItem } from '@/domain/character/models/Inventory';

describe('WeaponProcessor', () => {
  let processor: WeaponProcessor;
  let mockCharacterData: CharacterData;
  let mockAbilities: ProcessedAbilityScores;
  let mockProficiencies: ProcessedProficiencies;

  beforeEach(() => {
    processor = new WeaponProcessor();
    
    // Mock character data
    mockCharacterData = {
      id: 12345,
      name: 'Test Character',
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
      ]
    } as CharacterData;

    // Mock abilities with typical fighter stats
    mockAbilities = {
      strength: { base: 16, bonus: 0, override: null, total: 16, modifier: 3 },
      dexterity: { base: 14, bonus: 0, override: null, total: 14, modifier: 2 },
      constitution: { base: 15, bonus: 0, override: null, total: 15, modifier: 2 },
      intelligence: { base: 10, bonus: 0, override: null, total: 10, modifier: 0 },
      wisdom: { base: 12, bonus: 0, override: null, total: 12, modifier: 1 },
      charisma: { base: 8, bonus: 0, override: null, total: 8, modifier: -1 }
    };

    // Mock proficiencies with fighter weapon proficiencies
    mockProficiencies = {
      weapons: [
        { name: 'Simple weapons', display: 'Simple weapons', category: 'weapon', entityId: 1, entityTypeId: 1 },
        { name: 'Martial weapons', display: 'Martial weapons', category: 'weapon', entityId: 2, entityTypeId: 1 }
      ],
      armor: [],
      tools: [],
      all: [],
      skippedProficiencies: [],
      debugInfo: {
        totalFound: 2,
        totalMapped: 2,
        duplicatesRemoved: 0
      }
    };
  });

  describe('processWeapons', () => {
    it('should process simple melee weapon correctly', () => {
      const inventory: InventoryItem[] = [
        {
          id: 1,
          entityTypeId: 1,
          definition: {
            id: 1,
            name: 'Club',
            filterType: 'Weapon',
            weight: 2,
            damage: { diceCount: 1, diceValue: 4, diceMultiplier: null, fixedValue: null },
            damageType: 'Bludgeoning',
            attackType: 1, // melee
            categoryId: 1, // simple
            properties: [],
            range: 5,
            longRange: null,
            baseItemId: 1,
            weaponBehaviors: [],
            isMonkWeapon: false
          },
          quantity: 1,
          equipped: true,
          isAttuned: false,
          containerEntityId: 12345,
          grantedModifiers: []
        }
      ];

      const result = processor.processWeapons(inventory, mockCharacterData, mockAbilities, mockProficiencies);

      expect(result.weapons).toHaveLength(1);
      const weapon = result.weapons[0];

      // Basic properties
      expect(weapon.name).toBe('Club');
      expect(weapon.weaponCategory).toBe('simple');
      expect(weapon.attackType).toBe('melee');
      expect(weapon.equipped).toBe(true);
      expect(weapon.proficient).toBe(true);

      // Combat calculations - Level 5 fighter (+3 prof, +3 STR)
      expect(weapon.attackBonus).toBe(6); // STR(3) + Prof(3) + Magic(0)
      expect(weapon.damageBonus).toBe(3); // STR(3) + Magic(0)
      expect(weapon.damageFormula).toBe('1d4+3');
      expect(weapon.primaryAbility).toBe('strength');

      // Statistics
      expect(result.statistics.totalWeapons).toBe(1);
      expect(result.statistics.simpleWeapons).toBe(1);
      expect(result.statistics.martialWeapons).toBe(0);
      expect(result.equippedWeapons).toHaveLength(1);
    });

    it('should process martial ranged weapon correctly', () => {
      const inventory: InventoryItem[] = [
        {
          id: 2,
          entityTypeId: 1,
          definition: {
            id: 2,
            name: 'Longbow',
            filterType: 'Weapon',
            weight: 2,
            damage: { diceCount: 1, diceValue: 8, diceMultiplier: null, fixedValue: null },
            damageType: 'Piercing',
            attackType: 2, // ranged
            categoryId: 2, // martial
            properties: [
              { name: 'Ammunition', description: 'Ammunition (range 150/600)' },
              { name: 'Heavy', description: 'Heavy weapons' },
              { name: 'Two-Handed', description: 'Two-handed weapons' }
            ],
            range: 150,
            longRange: 600,
            baseItemId: 2,
            weaponBehaviors: [],
            isMonkWeapon: false
          },
          quantity: 1,
          equipped: false,
          isAttuned: false,
          containerEntityId: 12345,
          grantedModifiers: []
        }
      ];

      const result = processor.processWeapons(inventory, mockCharacterData, mockAbilities, mockProficiencies);

      expect(result.weapons).toHaveLength(1);
      const weapon = result.weapons[0];

      // Basic properties
      expect(weapon.name).toBe('Longbow');
      expect(weapon.weaponCategory).toBe('martial');
      expect(weapon.attackType).toBe('ranged');
      expect(weapon.equipped).toBe(false);

      // Ranged weapons use DEX
      expect(weapon.primaryAbility).toBe('dexterity');
      expect(weapon.attackBonus).toBe(5); // DEX(2) + Prof(3) + Magic(0)
      expect(weapon.damageFormula).toBe('1d8+2'); // DEX modifier for damage

      // Range information
      expect(weapon.range).toBeDefined();
      expect(weapon.range!.normal).toBe(150);
      expect(weapon.range!.long).toBe(600);

      // Properties
      expect(weapon.properties).toContain('ammunition');
      expect(weapon.properties).toContain('heavy');
      expect(weapon.properties).toContain('two-handed');
    });

    it('should handle finesse weapons with optimal ability choice', () => {
      const inventory: InventoryItem[] = [
        {
          id: 3,
          entityTypeId: 1,
          definition: {
            id: 3,
            name: 'Rapier',
            filterType: 'Weapon',
            weight: 2,
            damage: { diceCount: 1, diceValue: 8, diceMultiplier: null, fixedValue: null },
            damageType: 'Piercing',
            attackType: 1, // melee
            categoryId: 2, // martial
            properties: [
              { name: 'Finesse', description: 'Use DEX instead of STR' }
            ],
            range: 5,
            longRange: null,
            baseItemId: 3,
            weaponBehaviors: [],
            isMonkWeapon: false
          },
          quantity: 1,
          equipped: true,
          isAttuned: false,
          containerEntityId: 12345,
          grantedModifiers: []
        }
      ];

      const result = processor.processWeapons(inventory, mockCharacterData, mockAbilities, mockProficiencies);

      const weapon = result.weapons[0];

      // Should use STR (16) over DEX (14) for this character
      expect(weapon.finesse).toBe(true);
      expect(weapon.primaryAbility).toBe('strength'); // STR is higher
      expect(weapon.attackBonus).toBe(6); // STR(3) + Prof(3)
      expect(weapon.damageFormula).toBe('1d8+3');
    });

    it('should handle magical weapons with enhancement bonuses', () => {
      const inventory: InventoryItem[] = [
        {
          id: 4,
          entityTypeId: 1,
          definition: {
            id: 4,
            name: 'Longsword +1',
            filterType: 'Weapon',
            weight: 3,
            damage: { diceCount: 1, diceValue: 8, diceMultiplier: null, fixedValue: null },
            damageType: 'Slashing',
            attackType: 1, // melee
            categoryId: 2, // martial
            properties: [
              { name: 'Versatile', description: 'Versatile (1d10)' }
            ],
            range: 5,
            longRange: null,
            baseItemId: 4,
            weaponBehaviors: [],
            isMonkWeapon: false
          },
          quantity: 1,
          equipped: true,
          isAttuned: false,
          containerEntityId: 12345,
          grantedModifiers: [
            {
              fixedValue: 1,
              type: 'bonus',
              subType: 'magic',
              dice: null
            }
          ]
        }
      ];

      const result = processor.processWeapons(inventory, mockCharacterData, mockAbilities, mockProficiencies);

      const weapon = result.weapons[0];

      expect(weapon.isMagical).toBe(true);
      expect(weapon.magicBonus).toBe(1);
      expect(weapon.attackBonus).toBe(7); // STR(3) + Prof(3) + Magic(1)
      expect(weapon.damageFormula).toBe('1d8+4'); // STR(3) + Magic(1)
      
      // Versatile damage
      expect(weapon.versatileDamageFormula).toBe('1d10+4');
      expect(result.magicalWeapons).toHaveLength(1);
    });

    it('should handle non-proficient weapons', () => {
      // Create proficiencies without martial weapons
      const limitedProficiencies: ProcessedProficiencies = {
        weapons: [
          { name: 'Simple weapons', display: 'Simple weapons', category: 'weapon', entityId: 1, entityTypeId: 1 }
        ],
        armor: [],
        tools: [],
        all: [],
        skippedProficiencies: [],
        debugInfo: { totalFound: 1, totalMapped: 1, duplicatesRemoved: 0 }
      };

      const inventory: InventoryItem[] = [
        {
          id: 5,
          entityTypeId: 1,
          definition: {
            id: 5,
            name: 'Greatsword',
            filterType: 'Weapon',
            weight: 6,
            damage: { diceCount: 2, diceValue: 6, diceMultiplier: null, fixedValue: null },
            damageType: 'Slashing',
            attackType: 1,
            categoryId: 2, // martial - not proficient
            properties: [
              { name: 'Heavy', description: 'Heavy weapon' },
              { name: 'Two-Handed', description: 'Two-handed weapon' }
            ],
            range: 5,
            longRange: null,
            baseItemId: 5,
            weaponBehaviors: [],
            isMonkWeapon: false
          },
          quantity: 1,
          equipped: false,
          isAttuned: false,
          containerEntityId: 12345,
          grantedModifiers: []
        }
      ];

      const result = processor.processWeapons(inventory, mockCharacterData, mockAbilities, limitedProficiencies);

      const weapon = result.weapons[0];

      expect(weapon.proficient).toBe(false);
      expect(weapon.attackBonus).toBe(3); // STR(3) + Prof(0) - no proficiency bonus
      expect(weapon.damageFormula).toBe('2d6+3'); // Still get STR to damage

      expect(result.proficientWeapons).toHaveLength(0);
    });

    it('should skip zero quantity weapons', () => {
      const inventory: InventoryItem[] = [
        {
          id: 6,
          entityTypeId: 1,
          definition: {
            id: 6,
            name: 'Dagger',
            filterType: 'Weapon',
            weight: 1,
            damage: { diceCount: 1, diceValue: 4, diceMultiplier: null, fixedValue: null },
            damageType: 'Piercing',
            attackType: 1,
            categoryId: 1,
            properties: [],
            range: 5,
            longRange: null,
            baseItemId: 6,
            weaponBehaviors: [],
            isMonkWeapon: false
          },
          quantity: 0, // Zero quantity
          equipped: false,
          isAttuned: false,
          containerEntityId: 12345,
          grantedModifiers: []
        }
      ];

      const result = processor.processWeapons(inventory, mockCharacterData, mockAbilities, mockProficiencies);

      expect(result.weapons).toHaveLength(0);
      expect(result.statistics.totalWeapons).toBe(0);
    });

    it('should process multiple weapons correctly', () => {
      const inventory: InventoryItem[] = [
        // Simple weapon
        {
          id: 7,
          entityTypeId: 1,
          definition: {
            id: 7,
            name: 'Dagger',
            filterType: 'Weapon',
            weight: 1,
            damage: { diceCount: 1, diceValue: 4, diceMultiplier: null, fixedValue: null },
            damageType: 'Piercing',
            attackType: 1,
            categoryId: 1,
            properties: [
              { name: 'Finesse', description: 'Finesse weapon' },
              { name: 'Light', description: 'Light weapon' },
              { name: 'Thrown', description: 'Thrown weapon (20/60)' }
            ],
            range: 5,
            longRange: null,
            baseItemId: 7,
            weaponBehaviors: [],
            isMonkWeapon: false
          },
          quantity: 2,
          equipped: true,
          isAttuned: false,
          containerEntityId: 12345,
          grantedModifiers: []
        },
        // Martial weapon
        {
          id: 8,
          entityTypeId: 1,
          definition: {
            id: 8,
            name: 'Battleaxe',
            filterType: 'Weapon',
            weight: 4,
            damage: { diceCount: 1, diceValue: 8, diceMultiplier: null, fixedValue: null },
            damageType: 'Slashing',
            attackType: 1,
            categoryId: 2,
            properties: [
              { name: 'Versatile', description: 'Versatile (1d10)' }
            ],
            range: 5,
            longRange: null,
            baseItemId: 8,
            weaponBehaviors: [],
            isMonkWeapon: false
          },
          quantity: 1,
          equipped: false,
          isAttuned: false,
          containerEntityId: 12345,
          grantedModifiers: []
        }
      ];

      const result = processor.processWeapons(inventory, mockCharacterData, mockAbilities, mockProficiencies);

      expect(result.weapons).toHaveLength(2);
      expect(result.statistics.totalWeapons).toBe(2);
      expect(result.statistics.simpleWeapons).toBe(1);
      expect(result.statistics.martialWeapons).toBe(1);
      expect(result.equippedWeapons).toHaveLength(1);
      expect(result.proficientWeapons).toHaveLength(2);

      // Check dagger uses STR (higher than DEX for this character)
      const dagger = result.weapons.find(w => w.name === 'Dagger')!;
      expect(dagger.finesse).toBe(true);
      expect(dagger.primaryAbility).toBe('strength');

      // Check battleaxe
      const battleaxe = result.weapons.find(w => w.name === 'Battleaxe')!;
      expect(battleaxe.versatileDamageFormula).toBe('1d10+3');
    });
  });

  describe('validateWeapon', () => {
    it('should validate valid weapon', () => {
      const validWeapon = {
        id: 1,
        entityTypeId: 1,
        definition: {
          id: 1,
          name: 'Sword',
          filterType: 'Weapon' as const,
          damage: { diceCount: 1, diceValue: 8, diceMultiplier: null, fixedValue: null },
          damageType: 'Slashing',
          attackType: 1,
          categoryId: 2,
          properties: [],
          range: 5,
          longRange: null,
          baseItemId: 1,
          weaponBehaviors: [],
          isMonkWeapon: false
        },
        quantity: 1,
        equipped: true,
        isAttuned: false,
        containerEntityId: 12345,
        grantedModifiers: []
      };

      const result = processor.validateWeapon(validWeapon);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.weaponName).toBe('Sword');
    });

    it('should catch missing damage data', () => {
      const invalidWeapon = {
        id: 1,
        entityTypeId: 1,
        definition: {
          id: 1,
          name: 'Broken Weapon',
          filterType: 'Weapon' as const,
          damage: null as any,
          damageType: 'Slashing',
          attackType: 1,
          categoryId: 1,
          properties: [],
          range: 5,
          longRange: null,
          baseItemId: 1,
          weaponBehaviors: [],
          isMonkWeapon: false
        },
        quantity: 1,
        equipped: false,
        isAttuned: false,
        containerEntityId: 12345,
        grantedModifiers: []
      };

      const result = processor.validateWeapon(invalidWeapon);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Missing damage data');
    });

    it('should catch ranged weapon with invalid range', () => {
      const invalidWeapon = {
        id: 1,
        entityTypeId: 1,
        definition: {
          id: 1,
          name: 'Broken Bow',
          filterType: 'Weapon' as const,
          damage: { diceCount: 1, diceValue: 8, diceMultiplier: null, fixedValue: null },
          damageType: 'Piercing',
          attackType: 2, // ranged
          categoryId: 1,
          properties: [],
          range: 0, // Invalid range
          longRange: null,
          baseItemId: 1,
          weaponBehaviors: [],
          isMonkWeapon: false
        },
        quantity: 1,
        equipped: false,
        isAttuned: false,
        containerEntityId: 12345,
        grantedModifiers: []
      };

      const result = processor.validateWeapon(invalidWeapon);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Ranged weapon missing range data');
    });
  });
});