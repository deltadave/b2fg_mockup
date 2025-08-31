/**
 * Weapon Processor Service
 * 
 * Processes weapon data from D&D Beyond character inventory, calculating combat statistics
 * including attack bonuses, damage formulas, and weapon properties. Handles finesse weapons,
 * magical enhancements, proficiency bonuses, and all D&D 5e weapon mechanics.
 */

import type { CharacterData } from './CharacterFetcher';
import type { ProcessedAbilityScores } from './AbilityScoreProcessor';
import type { ProcessedProficiencies } from './ProficiencyProcessor';
import type { InventoryItem } from '../models/Inventory';
import {
  WeaponInventoryItem,
  ProcessedWeapon,
  ProcessedWeaponsResult,
  WeaponProcessingOptions,
  WeaponValidationResult,
  WeaponProperty,
  WeaponCategory,
  AttackType,
  WeaponDamage,
  WeaponRange
} from '../models/Weapons';
import { DamageType, DAMAGE_TYPES } from '../constants/AbilityConstants';
import { AbilityScoreUtils, AbilityName } from '../constants/AbilityConstants';

/**
 * Dependencies for weapon processing
 */
export interface WeaponProcessorDependencies {
  readonly validateWeapons?: boolean;
  readonly calculateCombatStats?: boolean;
}

/**
 * Character proficiency level calculation
 */
export interface CharacterProficiencyInfo {
  readonly characterLevel: number;
  readonly proficiencyBonus: number;
  readonly weaponProficiencies: ReadonlyArray<string>;
}

export class WeaponProcessor {
  private readonly options: Required<WeaponProcessorDependencies>;

  constructor(dependencies: WeaponProcessorDependencies = {}) {
    this.options = {
      validateWeapons: dependencies.validateWeapons ?? true,
      calculateCombatStats: dependencies.calculateCombatStats ?? true
    };
  }

  /**
   * Main entry point for weapon processing
   */
  processWeapons(
    inventory: ReadonlyArray<InventoryItem>,
    characterData: CharacterData,
    abilities: ProcessedAbilityScores,
    proficiencies: ProcessedProficiencies
  ): ProcessedWeaponsResult {
    // Extract weapon items from inventory
    const weaponItems = this.extractWeaponItems(inventory);
    
    // Calculate character proficiency info
    const proficiencyInfo = this.calculateProficiencyInfo(characterData, proficiencies);
    
    // Process each weapon
    const processedWeapons = weaponItems.map(weapon => 
      this.processIndividualWeapon(weapon, abilities, proficiencyInfo)
    );

    // Generate statistics
    const statistics = this.calculateWeaponStatistics(processedWeapons);

    return {
      weapons: processedWeapons,
      equippedWeapons: processedWeapons.filter(w => w.equipped),
      proficientWeapons: processedWeapons.filter(w => w.proficient),
      magicalWeapons: processedWeapons.filter(w => w.isMagical),
      statistics
    };
  }

  /**
   * Extract weapon items from inventory
   */
  private extractWeaponItems(inventory: ReadonlyArray<InventoryItem>): WeaponInventoryItem[] {
    return inventory
      .filter((item): item is WeaponInventoryItem => 
        item.definition.filterType === 'Weapon'
      )
      .filter(weapon => weapon.quantity > 0); // Only include weapons with positive quantity
  }

  /**
   * Calculate character proficiency information
   */
  private calculateProficiencyInfo(
    characterData: CharacterData, 
    proficiencies: ProcessedProficiencies
  ): CharacterProficiencyInfo {
    const characterLevel = this.calculateTotalLevel(characterData);
    const proficiencyBonus = this.calculateProficiencyBonus(characterLevel);
    const weaponProficiencies = proficiencies.weapons.map(w => w.name.toLowerCase());

    return {
      characterLevel,
      proficiencyBonus,
      weaponProficiencies
    };
  }

  /**
   * Process an individual weapon with all calculations
   */
  private processIndividualWeapon(
    weapon: WeaponInventoryItem,
    abilities: ProcessedAbilityScores,
    proficiencyInfo: CharacterProficiencyInfo
  ): ProcessedWeapon {
    // Extract basic weapon data
    const weaponData = this.extractWeaponData(weapon);
    
    // Determine weapon properties
    const properties = this.extractWeaponProperties(weapon);
    const finesse = properties.includes('finesse');
    const versatile = properties.includes('versatile');
    
    // Calculate primary ability (STR vs DEX for finesse weapons)
    const primaryAbility = this.determinePrimaryAbility(weapon, abilities, finesse);
    
    // Calculate proficiency
    const proficient = this.isWeaponProficient(weapon, proficiencyInfo);
    
    // Calculate bonuses
    const magicBonus = this.extractMagicBonus(weapon);
    const abilityModifier = abilities[primaryAbility].modifier;
    const profBonus = proficient ? proficiencyInfo.proficiencyBonus : 0;
    const attackBonus = abilityModifier + profBonus + magicBonus;
    const damageBonus = abilityModifier + magicBonus;
    
    // Build damage formulas - handle missing damage data
    const damageFormula = weapon.definition.damage ? 
      this.buildDamageFormula(weapon.definition.damage, damageBonus) : '1d4';
    const versatileDamageFormula = versatile && weapon.definition.damage ? 
      this.buildVersatileDamageFormula(weapon, damageBonus) : undefined;

    return {
      id: weapon.id.toString(),
      name: weapon.definition.name,
      baseItemId: weapon.definition.baseItemId,
      type: 'weapon',
      
      damage: {
        baseDice: weapon.definition.damage ? this.formatDiceString(weapon.definition.damage) : '1d4',
        damageType: this.mapDamageType(weapon.definition.damageType || 'Bludgeoning'),
        versatileDice: versatile && weapon.definition.damage ? this.extractVersatileDice(weapon) : undefined
      },
      
      attackType: weapon.definition.attackType === 1 ? 'melee' : 'ranged',
      weaponCategory: weapon.definition.categoryId === 1 ? 'simple' : 'martial',
      properties,
      
      attackBonus,
      damageBonus,
      damageFormula,
      versatileDamageFormula,
      
      proficient,
      finesse,
      reach: this.calculateWeaponReach(weapon, properties),
      range: this.calculateWeaponRange(weapon),
      
      quantity: weapon.quantity,
      weight: weapon.definition.weight || 0,
      equipped: weapon.equipped,
      requiresAttunement: this.requiresAttunement(weapon),
      isAttuned: weapon.isAttuned,
      isMagical: magicBonus > 0 || this.hasMagicalProperties(weapon),
      magicBonus,
      primaryAbility
    };
  }

  /**
   * Extract basic weapon data from definition
   */
  private extractWeaponData(weapon: WeaponInventoryItem) {
    return {
      id: weapon.id.toString(),
      name: weapon.definition.name,
      baseItemId: weapon.definition.baseItemId
    };
  }

  /**
   * Extract weapon properties from definition
   */
  private extractWeaponProperties(weapon: WeaponInventoryItem): WeaponProperty[] {
    const properties: WeaponProperty[] = [];
    
    if (weapon.definition.properties) {
      for (const property of weapon.definition.properties) {
        const normalizedName = property.name.toLowerCase().replace(/[^a-z]/g, '');
        
        switch (normalizedName) {
          case 'ammunition': properties.push('ammunition'); break;
          case 'finesse': properties.push('finesse'); break;
          case 'heavy': properties.push('heavy'); break;
          case 'light': properties.push('light'); break;
          case 'loading': properties.push('loading'); break;
          case 'range': properties.push('range'); break;
          case 'reach': properties.push('reach'); break;
          case 'special': properties.push('special'); break;
          case 'thrown': properties.push('thrown'); break;
          case 'twohanded': properties.push('two-handed'); break;
          case 'versatile': properties.push('versatile'); break;
        }
      }
    }
    
    return properties;
  }

  /**
   * Determine primary ability for weapon attacks (STR vs DEX)
   */
  private determinePrimaryAbility(
    weapon: WeaponInventoryItem,
    abilities: ProcessedAbilityScores,
    finesse: boolean
  ): AbilityName {
    if (!finesse) {
      return weapon.definition.attackType === 2 ? 'dexterity' : 'strength';
    }
    
    // Finesse weapons use the higher of STR or DEX
    return abilities.strength.modifier >= abilities.dexterity.modifier ? 
      'strength' : 'dexterity';
  }

  /**
   * Check if character is proficient with weapon
   */
  private isWeaponProficient(
    weapon: WeaponInventoryItem,
    proficiencyInfo: CharacterProficiencyInfo
  ): boolean {
    const weaponName = weapon.definition.name.toLowerCase();
    const category = weapon.definition.categoryId === 1 ? 'simple' : 'martial';
    
    // Check specific weapon proficiency
    if (proficiencyInfo.weaponProficiencies.includes(weaponName)) {
      return true;
    }
    
    // Check category proficiency
    if (proficiencyInfo.weaponProficiencies.includes(`${category} weapons`)) {
      return true;
    }
    
    return false;
  }

  /**
   * Extract magic bonus from granted modifiers
   */
  private extractMagicBonus(weapon: WeaponInventoryItem): number {
    let magicBonus = 0;
    
    for (const modifier of weapon.grantedModifiers) {
      if (modifier.type === 'bonus' && 
          modifier.subType === 'magic' && 
          modifier.fixedValue !== null) {
        magicBonus += modifier.fixedValue;
      }
    }
    
    return magicBonus;
  }

  /**
   * Build complete damage formula including ability and magic bonuses
   */
  private buildDamageFormula(
    damage: { diceCount: number; diceValue: number; fixedValue: number | null },
    damageBonus: number
  ): string {
    const diceString = this.formatDiceString(damage);
    const totalBonus = damageBonus + (damage.fixedValue || 0);
    
    if (totalBonus === 0) {
      return diceString;
    } else if (totalBonus > 0) {
      return `${diceString}+${totalBonus}`;
    } else {
      return `${diceString}${totalBonus}`;
    }
  }

  /**
   * Build versatile damage formula
   */
  private buildVersatileDamageFormula(
    weapon: WeaponInventoryItem,
    damageBonus: number
  ): string {
    // Most versatile weapons increase die size by one step
    const baseDieValue = weapon.definition.damage.diceValue;
    const versatileDieValue = this.getVersatileDieValue(baseDieValue);
    
    const versatileDice = `${weapon.definition.damage.diceCount}d${versatileDieValue}`;
    const totalBonus = damageBonus + (weapon.definition.damage.fixedValue || 0);
    
    if (totalBonus === 0) {
      return versatileDice;
    } else if (totalBonus > 0) {
      return `${versatileDice}+${totalBonus}`;
    } else {
      return `${versatileDice}${totalBonus}`;
    }
  }

  /**
   * Get versatile die value (typically one size larger)
   */
  private getVersatileDieValue(baseDie: number): number {
    const dieProgression = [4, 6, 8, 10, 12, 20];
    const currentIndex = dieProgression.indexOf(baseDie);
    
    if (currentIndex >= 0 && currentIndex < dieProgression.length - 1) {
      return dieProgression[currentIndex + 1];
    }
    
    return baseDie; // Fallback to base die if not in progression
  }

  /**
   * Extract versatile dice string from weapon properties
   */
  private extractVersatileDice(weapon: WeaponInventoryItem): string | undefined {
    for (const property of weapon.definition.properties) {
      if (property.name.toLowerCase().includes('versatile')) {
        // Parse versatile die from description like "Versatile (1d10)"
        const match = property.description.match(/\((\d+d\d+)\)/);
        return match?.[1];
      }
    }
    return undefined;
  }

  /**
   * Calculate weapon reach in feet
   */
  private calculateWeaponReach(weapon: WeaponInventoryItem, properties: WeaponProperty[]): number {
    if (properties.includes('reach')) {
      return 10; // Reach weapons have 10-foot reach
    }
    return weapon.definition.attackType === 1 ? 5 : 0; // Melee: 5ft, Ranged: 0ft
  }

  /**
   * Calculate weapon range for ranged weapons
   */
  private calculateWeaponRange(weapon: WeaponInventoryItem): WeaponRange | undefined {
    if (weapon.definition.attackType === 2 || 
        weapon.definition.properties.some(p => p.name.toLowerCase().includes('thrown'))) {
      return {
        normal: weapon.definition.range,
        long: weapon.definition.longRange,
        units: 'ft'
      };
    }
    return undefined;
  }

  /**
   * Check if weapon requires attunement
   */
  private requiresAttunement(weapon: WeaponInventoryItem): boolean {
    return weapon.grantedModifiers.some(modifier => 
      modifier.subType?.toLowerCase().includes('attunement')
    );
  }

  /**
   * Check if weapon has magical properties beyond simple bonuses
   */
  private hasMagicalProperties(weapon: WeaponInventoryItem): boolean {
    return weapon.grantedModifiers.some(modifier => 
      modifier.type !== 'bonus' || modifier.subType !== 'magic'
    );
  }

  /**
   * Format dice string from damage data
   */
  private formatDiceString(damage: { diceCount: number; diceValue: number }): string {
    return `${damage.diceCount}d${damage.diceValue}`;
  }

  /**
   * Map D&D Beyond damage type to standard damage type
   */
  private mapDamageType(damageTypeString: string): DamageType {
    const normalized = damageTypeString.toLowerCase();
    const damageType = DAMAGE_TYPES.find(type => type === normalized);
    
    return damageType || 'bludgeoning'; // Default to bludgeoning if not found
  }

  /**
   * Calculate total character level across all classes
   */
  private calculateTotalLevel(characterData: CharacterData): number {
    if (!characterData.classes || characterData.classes.length === 0) {
      return 1;
    }
    
    return characterData.classes.reduce((total, charClass) => total + charClass.level, 0);
  }

  /**
   * Calculate proficiency bonus based on character level
   */
  private calculateProficiencyBonus(level: number): number {
    return Math.ceil(level / 4) + 1; // D&D 5e proficiency bonus formula
  }

  /**
   * Calculate weapon statistics summary
   */
  private calculateWeaponStatistics(weapons: ReadonlyArray<ProcessedWeapon>) {
    return {
      totalWeapons: weapons.length,
      equippedCount: weapons.filter(w => w.equipped).length,
      magicalCount: weapons.filter(w => w.isMagical).length,
      simpleWeapons: weapons.filter(w => w.weaponCategory === 'simple').length,
      martialWeapons: weapons.filter(w => w.weaponCategory === 'martial').length
    };
  }

  /**
   * Validate weapon data
   */
  validateWeapon(weapon: WeaponInventoryItem): WeaponValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!weapon.definition.damage) {
      errors.push('Missing damage data');
    }

    if (!weapon.definition.damageType) {
      warnings.push('Missing damage type, defaulting to bludgeoning');
    }

    if (weapon.definition.attackType === 2 && weapon.definition.range <= 0) {
      errors.push('Ranged weapon missing range data');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      weaponId: weapon.id.toString(),
      weaponName: weapon.definition.name
    };
  }
}