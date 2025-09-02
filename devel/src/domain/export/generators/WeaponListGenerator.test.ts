/**
 * Tests for WeaponListGenerator - specifically thrown weapon dual entries
 */

import { describe, it, expect } from 'vitest';
import { WeaponListGenerator } from './WeaponListGenerator';

describe('WeaponListGenerator - Thrown Weapons', () => {
  let generator: WeaponListGenerator;

  beforeEach(() => {
    generator = new WeaponListGenerator();
  });

  it('should create dual entries for thrown weapons', () => {
    // Mock character data with multiple thrown weapons to test quantity handling
    const mockCharacterData = {
      inventory: [
        {
          id: 12345,
          definition: {
            filterType: 'Weapon',
            name: 'Javelin',
            attackType: 1, // Melee weapon
            damage: { diceValue: 6 },
            damageType: 'piercing',
            properties: [
              { id: 10, name: 'Thrown', description: 'If a weapon has the Thrown property...' }
            ]
          },
          equipped: true,
          quantity: 4,
          grantedModifiers: []
        },
        {
          id: 12346,
          definition: {
            filterType: 'Weapon',
            name: 'Dagger',
            attackType: 1, // Melee weapon
            damage: { diceValue: 4 },
            damageType: 'piercing',
            properties: [
              { id: 10, name: 'Thrown', description: 'If a weapon has the Thrown property...' }
            ]
          },
          equipped: true,
          quantity: 2,
          grantedModifiers: []
        }
      ],
      stats: [
        { id: 1, value: 16 }, // Strength
        { id: 2, value: 14 }  // Dexterity
      ],
      classes: [
        { level: 5 }
      ]
    };

    const result = generator.generateWeaponListXML(mockCharacterData);

    // Should contain two javelin entries and two dagger entries
    const javelinMatches = result.match(/<name type="string">Javelin<\/name>/g);
    expect(javelinMatches).toHaveLength(2);
    
    const daggerMatches = result.match(/<name type="string">Dagger<\/name>/g);
    expect(daggerMatches).toHaveLength(2);

    // Should have melee entries (type 0) and ranged entries (type 2)
    const meleeMatches = result.match(/<type type="number">0<\/type>/g);
    expect(meleeMatches).toHaveLength(2); // One for javelin, one for dagger
    
    const rangedMatches = result.match(/<type type="number">2<\/type>/g);
    expect(rangedMatches).toHaveLength(2); // One for javelin, one for dagger

    // Check specific quantities: javelin should have maxammo 4, dagger should have maxammo 2
    expect(result).toContain('<maxammo type="number">4</maxammo>'); // Javelin quantity
    expect(result).toContain('<maxammo type="number">2</maxammo>'); // Dagger quantity

    // Only the ranged entries should have maxammo (2 ranged entries)
    const maxammoMatches = result.match(/<maxammo type="number">\d+<\/maxammo>/g);
    expect(maxammoMatches).toHaveLength(2);

    // Only ranged entries should have ammo field 
    const ammoMatches = result.match(/<ammo type="number">\d+<\/ammo>/g);
    expect(ammoMatches).toHaveLength(2);

    console.log('Generated XML:', result);
  });

  it('should use STR for melee and DEX for ranged attack bonuses', () => {
    // Mock character data with different STR and DEX values to test bonus calculation
    const mockCharacterData = {
      inventory: [
        {
          id: 99999,
          definition: {
            filterType: 'Weapon',
            name: 'Handaxe',
            attackType: 1, // Melee weapon
            damage: { diceValue: 6 },
            damageType: 'slashing',
            properties: [
              { id: 10, name: 'Thrown', description: 'If a weapon has the Thrown property...' }
            ]
          },
          equipped: true,
          quantity: 1,
          grantedModifiers: []
        }
      ],
      stats: [
        { id: 1, value: 18 }, // Strength (+4 modifier)
        { id: 2, value: 12 }  // Dexterity (+1 modifier)
      ],
      classes: [
        { level: 1 } // Proficiency bonus +2
      ]
    };

    const result = generator.generateWeaponListXML(mockCharacterData);

    // Melee entry should use STR: +4 (STR) + 2 (prof) = +6
    // Ranged entry should use DEX: +1 (DEX) + 2 (prof) = +3
    expect(result).toContain('<attackbonus type=\"number\">6</attackbonus>'); // Melee with STR
    expect(result).toContain('<attackbonus type=\"number\">3</attackbonus>'); // Ranged with DEX

    console.log('Attack Bonus Test XML:', result);
  });

  it('should use DEX for ranged-only weapons', () => {
    // Mock character data with a longbow (ranged-only weapon)
    const mockCharacterData = {
      inventory: [
        {
          id: 88888,
          definition: {
            filterType: 'Weapon',
            name: 'Longbow',
            attackType: 2, // Ranged weapon
            damage: { diceValue: 8 },
            damageType: 'piercing',
            properties: [
              { id: 1, name: 'Ammunition', description: 'Ammunition property...' },
              { id: 2, name: 'Heavy', description: 'Heavy property...' },
              { id: 3, name: 'Two-Handed', description: 'Two-handed property...' }
            ]
          },
          equipped: true,
          quantity: 1,
          grantedModifiers: []
        }
      ],
      stats: [
        { id: 1, value: 10 }, // Strength (+0 modifier)
        { id: 2, value: 16 }  // Dexterity (+3 modifier)
      ],
      classes: [
        { level: 1 } // Proficiency bonus +2
      ]
    };

    const result = generator.generateWeaponListXML(mockCharacterData);

    // Ranged weapon should use DEX: +3 (DEX) + 2 (prof) = +5
    expect(result).toContain('<attackbonus type=\"number\">5</attackbonus>');
    expect(result).toContain('<bonus type=\"number\">3</bonus>'); // DEX damage bonus
    
    // Should be type 1 (ranged weapon)
    expect(result).toContain('<type type=\"number\">1</type>');

    console.log('Ranged Weapon Test XML:', result);
  });

  it('should extract correct dice notation including multiple dice', () => {
    // Mock character data with a maul (2d6 damage)
    const mockCharacterData = {
      inventory: [
        {
          id: 77777,
          definition: {
            filterType: 'Weapon',
            name: 'Maul',
            attackType: 1, // Melee weapon
            damage: { 
              diceCount: 2, 
              diceValue: 6,
              diceString: '2d6'
            },
            damageType: 'bludgeoning',
            properties: [
              { id: 1, name: 'Heavy', description: 'Heavy property...' },
              { id: 2, name: 'Two-Handed', description: 'Two-handed property...' }
            ]
          },
          equipped: true,
          quantity: 1,
          grantedModifiers: []
        }
      ],
      stats: [
        { id: 1, value: 16 }, // Strength (+3 modifier)
        { id: 2, value: 12 }  // Dexterity (+1 modifier)
      ],
      classes: [
        { level: 1 } // Proficiency bonus +2
      ]
    };

    const result = generator.generateWeaponListXML(mockCharacterData);

    // Should have 2d6 dice, not 1d6
    expect(result).toContain('<dice type=\"dice\">2d6</dice>');
    expect(result).not.toContain('<dice type=\"dice\">d6</dice>');
    expect(result).not.toContain('<dice type=\"dice\">1d6</dice>');

    console.log('Maul Damage Test XML:', result);
  });

  it('should include magic bonuses in damage calculation', () => {
    // Mock character data with a magic weapon (+2 Maul)
    const mockCharacterData = {
      inventory: [
        {
          id: 66666,
          definition: {
            filterType: 'Weapon',
            name: 'Maul, +2',
            attackType: 1, // Melee weapon
            damage: { 
              diceCount: 2, 
              diceValue: 6,
              diceString: '2d6'
            },
            damageType: 'bludgeoning',
            properties: [
              { id: 1, name: 'Heavy', description: 'Heavy property...' },
              { id: 2, name: 'Two-Handed', description: 'Two-handed property...' }
            ]
          },
          equipped: true,
          quantity: 1,
          grantedModifiers: [
            {
              fixedValue: 2,
              type: "bonus",
              subType: "magic",
              friendlyTypeName: "Bonus",
              friendlySubtypeName: "Magic"
            }
          ]
        }
      ],
      stats: [
        { id: 1, value: 14 }, // Strength (+2 modifier)
        { id: 2, value: 12 }  // Dexterity (+1 modifier)
      ],
      classes: [
        { level: 1 } // Proficiency bonus +2
      ]
    };

    const result = generator.generateWeaponListXML(mockCharacterData);

    // Should have +4 damage bonus: STR +2 + Magic +2 = +4
    expect(result).toContain('<bonus type=\"number\">4</bonus>');
    // Should have +6 attack bonus: STR +2 + Prof +2 + Magic +2 = +6 
    expect(result).toContain('<attackbonus type=\"number\">6</attackbonus>');

    console.log('Magic Weapon Test XML:', result);
  });

  it('should handle finesse weapons correctly with TestCharacter2 stats', () => {
    // Mock TestCharacter2 stats: STR 14 (+2), DEX 14 (+2)
    const mockCharacterData = {
      inventory: [
        {
          id: 55555,
          definition: {
            filterType: 'Weapon',
            name: 'Dagger',
            attackType: 1, // Melee weapon
            damage: { 
              diceCount: 1, 
              diceValue: 4,
              diceString: '1d4'
            },
            damageType: 'piercing',
            properties: [
              { id: 2, name: 'Finesse', description: 'Use STR or DEX...' },
              { id: 4, name: 'Light', description: 'Light weapon...' },
              { id: 10, name: 'Thrown', description: 'Thrown weapon...' }
            ]
          },
          equipped: true,
          quantity: 2,
          grantedModifiers: [] // No magic bonuses
        }
      ],
      stats: [
        { id: 1, value: 14 }, // Strength (+2 modifier)
        { id: 2, value: 14 }, // Dexterity (+2 modifier)
        { id: 3, value: 16 }, // Constitution (+3 modifier) - not used for weapons
        { id: 4, value: 18 }, // Intelligence (+4 modifier) - not used for weapons
        { id: 5, value: 15 }, // Wisdom (+2 modifier) - not used for weapons
        { id: 6, value: 8 }   // Charisma (-1 modifier) - not used for weapons
      ],
      classes: [
        { level: 5 } // Proficiency bonus +3
      ]
    };

    const result = generator.generateWeaponListXML(mockCharacterData);

    // Dagger is finesse, so should use DEX for ranged, STR or DEX for melee (both +2)
    // Melee entry: should be +2 damage bonus (STR or DEX)
    // Ranged entry: should be +2 damage bonus (DEX)
    expect(result).toContain('<bonus type=\"number\">2</bonus>');
    expect(result).not.toContain('<bonus type=\"number\">4</bonus>'); // Should NOT be +4

    console.log('Finesse Weapon Debug XML:', result);
  });

  it('should not create dual entries for regular melee weapons', () => {
    // Mock character data with a regular sword (no thrown property)
    const mockCharacterData = {
      inventory: [
        {
          id: 54321,
          definition: {
            filterType: 'Weapon',
            name: 'Longsword',
            attackType: 1, // Melee weapon
            damage: { diceValue: 8 },
            damageType: 'slashing',
            properties: [
              { id: 1, name: 'Versatile', description: 'Versatile weapon...' }
            ]
          },
          equipped: true,
          quantity: 1,
          grantedModifiers: []
        }
      ],
      stats: [
        { id: 1, value: 16 }, // Strength
        { id: 2, value: 14 }  // Dexterity
      ],
      classes: [
        { level: 5 }
      ]
    };

    const result = generator.generateWeaponListXML(mockCharacterData);

    // Should contain only one longsword entry
    const longswordMatches = result.match(/<name type="string">Longsword<\/name>/g);
    expect(longswordMatches).toHaveLength(1);

    // Should only have melee type (type 0)
    expect(result).toContain('<type type="number">0</type>');
    expect(result).not.toContain('<type type="number">2</type>');

    console.log('Generated XML:', result);
  });
});