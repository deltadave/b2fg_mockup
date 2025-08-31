/**
 * Weapon-specific data models for D&D Beyond character conversion
 * Handles weapon properties, combat calculations, and format-specific data
 */

import { DamageType } from '../constants/AbilityConstants';

// Core weapon property types from D&D 5e
export type WeaponProperty = 
  | 'ammunition' 
  | 'finesse' 
  | 'heavy' 
  | 'light' 
  | 'loading' 
  | 'range' 
  | 'reach' 
  | 'special' 
  | 'thrown' 
  | 'two-handed' 
  | 'versatile';

export type WeaponCategory = 'simple' | 'martial';
export type AttackType = 'melee' | 'ranged';

// Raw weapon data from D&D Beyond API
export interface WeaponDefinition {
  readonly id: number;
  readonly name: string;
  readonly filterType: 'Weapon';
  readonly damage: {
    readonly diceCount: number;
    readonly diceValue: number;
    readonly diceMultiplier: number | null;
    readonly fixedValue: number | null;
  };
  readonly damageType: string;
  readonly attackType: number; // 1=melee, 2=ranged
  readonly categoryId: number; // 1=simple, 2=martial
  readonly properties: ReadonlyArray<{
    readonly name: string;
    readonly description: string;
  }>;
  readonly range: number;
  readonly longRange: number | null;
  readonly baseItemId: number;
  readonly weaponBehaviors: ReadonlyArray<any>;
  readonly isMonkWeapon: boolean;
}

// Weapon item from character inventory
export interface WeaponInventoryItem {
  readonly id: number;
  readonly entityTypeId: number;
  readonly definition: WeaponDefinition;
  readonly quantity: number;
  readonly isAttuned: boolean;
  readonly equipped: boolean;
  readonly grantedModifiers: ReadonlyArray<{
    readonly fixedValue: number | null;
    readonly type: string;
    readonly subType: string;
    readonly dice: any | null;
  }>;
}

// Enhanced weapon damage information
export interface WeaponDamage {
  readonly baseDice: string; // e.g., "1d8"
  readonly damageType: DamageType;
  readonly versatileDice?: string; // e.g., "1d10" for versatile weapons
}

// Weapon range information
export interface WeaponRange {
  readonly normal: number;
  readonly long: number | null;
  readonly units: 'ft';
}

// Processed weapon with calculated combat values
export interface ProcessedWeapon {
  // Core identity
  readonly id: string;
  readonly name: string;
  readonly baseItemId: number;
  readonly type: 'weapon';
  
  // Combat properties
  readonly damage: WeaponDamage;
  readonly attackType: AttackType;
  readonly weaponCategory: WeaponCategory;
  readonly properties: ReadonlyArray<WeaponProperty>;
  
  // Calculated combat values
  readonly attackBonus: number; // Total: ability + prof + magic
  readonly damageBonus: number; // Ability modifier + magic bonus
  readonly damageFormula: string; // Complete formula: "1d8+5"
  readonly versatileDamageFormula?: string; // For versatile weapons: "1d10+5"
  
  // Mechanics
  readonly proficient: boolean;
  readonly finesse: boolean; // Can use DEX instead of STR
  readonly reach: number; // Weapon reach in feet
  readonly range?: WeaponRange; // For ranged weapons
  
  // Equipment status
  readonly quantity: number;
  readonly weight: number;
  readonly equipped: boolean;
  readonly requiresAttunement: boolean;
  readonly isAttuned: boolean;
  readonly isMagical: boolean;
  readonly magicBonus: number; // Enhancement bonus
  
  // Ability score used for attacks (STR or DEX)
  readonly primaryAbility: 'strength' | 'dexterity';
}

// Result of weapon processing operation
export interface ProcessedWeaponsResult {
  readonly weapons: ReadonlyArray<ProcessedWeapon>;
  readonly equippedWeapons: ReadonlyArray<ProcessedWeapon>;
  readonly proficientWeapons: ReadonlyArray<ProcessedWeapon>;
  readonly magicalWeapons: ReadonlyArray<ProcessedWeapon>;
  readonly statistics: {
    readonly totalWeapons: number;
    readonly equippedCount: number;
    readonly magicalCount: number;
    readonly simpleWeapons: number;
    readonly martialWeapons: number;
  };
}

// Fantasy Grounds specific weapon data
export interface FGWeaponData {
  readonly subtype: string; // e.g., "Simple Melee Weapons"
  readonly properties: string; // Formatted property string
  readonly carried: number; // 0=not carried, 1=carried, 2=equipped
}

// Foundry VTT specific weapon data (D&D 5e system)
export interface FoundryWeaponData {
  readonly weaponType: string;
  readonly baseItem: string;
  readonly actionType: 'mwak' | 'rwak'; // melee/ranged weapon attack
  readonly ability: string; // 'str' | 'dex'
  readonly damage: {
    readonly parts: ReadonlyArray<[string, string]>; // [formula, damageType]
    readonly versatile: string;
  };
  readonly range: {
    readonly value: number | null;
    readonly long: number | null;
    readonly units: string;
  } | null;
  readonly properties: Record<string, boolean>;
}

// Weapon processing options
export interface WeaponProcessingOptions {
  readonly calculateCombatStats: boolean;
  readonly includeNonProficient: boolean;
  readonly processMagicalProperties: boolean;
  readonly validateWeaponData: boolean;
}

// Weapon validation result
export interface WeaponValidationResult {
  readonly isValid: boolean;
  readonly errors: ReadonlyArray<string>;
  readonly warnings: ReadonlyArray<string>;
  readonly weaponId: string;
  readonly weaponName: string;
}