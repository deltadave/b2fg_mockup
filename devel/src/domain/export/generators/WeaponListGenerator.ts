/**
 * Standalone Weapon List Generator
 * 
 * Generates Fantasy Grounds weaponlist XML directly from D&D Beyond character data
 * without modifying existing inventory processing systems.
 */

import { StringSanitizer } from '../../../shared/utils/StringSanitizer';

export interface WeaponListEntry {
  readonly id: string;
  readonly name: string;
  readonly dice: string; // "d8", "d6", etc.
  readonly damageType: string;
  readonly attackBonus: number;
  readonly damageBonus: number;
  readonly properties: string;
  readonly weaponType: number; // 0=melee, 1=ranged, 2=equipped ranged
  readonly carried: number; // 1=carried, 2=equipped
  readonly handling: number; // 0=one-handed, 1=two-handed
  readonly ammo?: number;
  readonly maxAmmo?: number;
  readonly inventoryShortcut: string; // Reference to inventory item
}

export class WeaponListGenerator {
  /**
   * Generate weaponlist XML section for Fantasy Grounds
   */
  generateWeaponListXML(characterData: any): string {
    if (!characterData.inventory) {
      return '\t<weaponlist>\n\t</weaponlist>';
    }

    // Extract weapons from inventory, handling thrown weapons as dual entries
    const rawWeapons: WeaponListEntry[] = [];
    characterData.inventory
      .filter((item: any) => item.definition.filterType === 'Weapon')
      .forEach((weapon: any, index: number) => {
        const entries = this.convertToWeaponListEntries(weapon, characterData, index);
        rawWeapons.push(...entries);
      });

    if (rawWeapons.length === 0) {
      return '\t<weaponlist>\n\t</weaponlist>';
    }

    // Consolidate duplicate weapons (but not thrown weapon dual entries)
    const consolidatedWeapons = this.consolidateDuplicateWeapons(rawWeapons);

    let xml = '\t<weaponlist>\n';
    consolidatedWeapons.forEach((weapon, index) => {
      xml += this.generateWeaponEntryXML(weapon, index + 1);
    });
    xml += '\t</weaponlist>';

    return xml;
  }

  /**
   * Consolidate duplicate weapons using maxammo field for quantity
   * NOTE: Thrown weapon dual entries are NOT consolidated together
   */
  private consolidateDuplicateWeapons(weapons: WeaponListEntry[]): WeaponListEntry[] {
    const weaponMap = new Map<string, WeaponListEntry>();

    weapons.forEach(weapon => {
      // Create a key based on weapon properties that should match for consolidation
      // Include weapon type to prevent consolidating thrown weapon dual entries
      const key = this.createWeaponKey(weapon);
      
      if (weaponMap.has(key)) {
        // Found duplicate - add quantities together
        const existing = weaponMap.get(key)!;
        const existingQuantity = existing.maxAmmo || 1;
        const newQuantity = weapon.maxAmmo || 1;
        const totalQuantity = existingQuantity + newQuantity;
        
        weaponMap.set(key, {
          ...existing,
          maxAmmo: totalQuantity,
          ammo: existing.ammo // Keep ammo tracking for ranged weapons
        });
      } else {
        // First occurrence - keep as-is
        weaponMap.set(key, weapon);
      }
    });

    return Array.from(weaponMap.values());
  }

  /**
   * Create a unique key for weapon consolidation
   */
  private createWeaponKey(weapon: WeaponListEntry): string {
    // Consolidate based on name, dice, damage type, properties, and weapon type
    // Including weapon type prevents consolidating thrown weapon dual entries
    // This ensures magical variants don't get consolidated with non-magical
    return `${weapon.name}|${weapon.dice}|${weapon.damageType}|${weapon.properties}|${weapon.attackBonus}|${weapon.damageBonus}|${weapon.weaponType}`;
  }

  /**
   * Convert D&D Beyond weapon to weapon list entries (may return multiple for thrown weapons)
   */
  private convertToWeaponListEntries(weapon: any, characterData: any, inventoryIndex: number): WeaponListEntry[] {
    const weaponDef = weapon.definition;
    
    // Check if this is a thrown weapon (attackType 1 with thrown property)
    const isThrown = weaponDef.attackType === 1 && this.hasProperty(weaponDef.properties, 'Thrown');
    
    if (isThrown) {
      // Create dual entries for thrown weapons: melee and ranged
      return [
        this.convertToSingleWeaponListEntry(weapon, characterData, inventoryIndex, 'melee'),
        this.convertToSingleWeaponListEntry(weapon, characterData, inventoryIndex, 'ranged')
      ];
    } else {
      // Single entry for non-thrown weapons
      return [this.convertToSingleWeaponListEntry(weapon, characterData, inventoryIndex, 'normal')];
    }
  }

  /**
   * Convert D&D Beyond weapon to weapon list entry
   */
  private convertToSingleWeaponListEntry(weapon: any, characterData: any, inventoryIndex: number, entryType: 'melee' | 'ranged' | 'normal'): WeaponListEntry {
    const weaponDef = weapon.definition;
    
    // Basic weapon stats from JSON - sanitize all D&D Beyond data
    const name = StringSanitizer.sanitizeHTML(weaponDef.name) || 'Unknown Weapon';
    const dice = this.extractDiceFromDamage(weaponDef.damage);
    const damageType = this.formatDamageType(StringSanitizer.sanitizeHTML(weaponDef.damageType));
    const properties = this.formatWeaponProperties(weaponDef.properties);
    
    // Set all attack bonuses to 0 - Fantasy Grounds will calculate everything
    const magicBonus = this.extractMagicBonus(weapon.definition?.grantedModifiers || weapon.grantedModifiers || []);
    const attackBonus = 0; // Always 0 - let FG handle all calculations
    const damageBonus = magicBonus; // Keep magic bonus for damage only
    
    // Determine weapon type and handling from D&D Beyond data
    const weaponType = this.getWeaponType(weaponDef, entryType);
    const carried = weapon.equipped ? 2 : 1;
    const handling = this.getHandling(weaponDef.properties);
    
    // Build inventory reference
    const inventoryShortcut = `....inventorylist.id-${(inventoryIndex + 1).toString().padStart(5, '0')}`;
    
    // Generate unique ID for thrown weapon dual entries
    const baseId = weapon.id.toString();
    const entryId = entryType === 'ranged' ? `${baseId}_ranged` : baseId;
    
    return {
      id: entryId,
      name,
      dice,
      damageType,
      attackBonus,
      damageBonus,
      properties,
      weaponType,
      carried,
      handling,
      ammo: this.getAmmoCount(weapon, entryType),
      maxAmmo: this.getMaxAmmo(weapon, weaponDef, entryType),
      inventoryShortcut
    };
  }

  /**
   * Extract dice notation from damage data (returns "2d6", "1d8", etc.)
   */
  private extractDiceFromDamage(damage: any): string {
    if (!damage) {
      return 'd4';
    }
    
    // Prefer diceString if available (contains full notation like "2d6")
    if (damage.diceString) {
      return damage.diceString;
    }
    
    // Fallback to constructing from diceCount and diceValue
    if (damage.diceValue) {
      const diceCount = damage.diceCount || 1;
      return `${diceCount}d${damage.diceValue}`;
    }
    
    return 'd4';
  }

  /**
   * Format damage type for XML (lowercase, comma-separated for magical)
   */
  private formatDamageType(damageType: string): string {
    if (!damageType) return 'bludgeoning';
    return damageType.toLowerCase();
  }

  /**
   * Extract magic bonus from granted modifiers
   */
  private extractMagicBonus(modifiers: any[]): number {
    for (const mod of modifiers) {
      if (mod.type === 'bonus' && mod.subType === 'magic' && mod.fixedValue) {
        return mod.fixedValue;
      }
    }
    return 0;
  }

  /**
   * Calculate attack bonus based on character abilities and proficiency
   */
  private calculateAttackBonus(characterData: any, weaponDef: any, magicBonus: number, entryType: 'melee' | 'ranged' | 'normal' = 'normal'): number {
    // Determine which ability to use based on entry type and weapon properties
    let useAbility: string;
    
    if (entryType === 'ranged' || weaponDef.attackType === 2) {
      // Ranged entries (thrown weapons) and ranged-only weapons always use Dexterity
      useAbility = 'dexterity';
    } else {
      // Melee entries use STR unless weapon has finesse property
      const isFinesse = this.hasProperty(weaponDef.properties, 'Finesse');
      useAbility = isFinesse ? 'dexterity' : 'strength';
    }
    
    const abilityScore = this.getAbilityScore(characterData, useAbility);
    const abilityModifier = Math.floor((abilityScore - 10) / 2);
    
    // Get proficiency bonus (simplified - assume proficient)
    const characterLevel = this.getCharacterLevel(characterData);
    // D&D 5e proficiency bonus: +2 (levels 1-4), +3 (5-8), +4 (9-12), +5 (13-16), +6 (17-20)
    const proficiencyBonus = characterLevel <= 4 ? 2 : 
                             characterLevel <= 8 ? 3 : 
                             characterLevel <= 12 ? 4 : 
                             characterLevel <= 16 ? 5 : 6;
    
    return abilityModifier + proficiencyBonus + magicBonus;
  }

  /**
   * Calculate damage bonus based on character abilities
   */
  private calculateDamageBonus(characterData: any, weaponDef: any, magicBonus: number, entryType: 'melee' | 'ranged' | 'normal' = 'normal'): number {
    // Determine which ability to use based on entry type and weapon properties
    let useAbility: string;
    
    if (entryType === 'ranged' || weaponDef.attackType === 2) {
      // Ranged entries (thrown weapons) and ranged-only weapons always use Dexterity
      useAbility = 'dexterity';
    } else {
      // Melee entries use STR unless weapon has finesse property
      const isFinesse = this.hasProperty(weaponDef.properties, 'Finesse');
      useAbility = isFinesse ? 'dexterity' : 'strength';
    }
    
    const abilityScore = this.getAbilityScore(characterData, useAbility);
    const abilityModifier = Math.floor((abilityScore - 10) / 2);
    
    return abilityModifier + magicBonus;
  }

  /**
   * Format weapon properties as seen in example XML
   */
  private formatWeaponProperties(properties: any[]): string {
    if (!properties || properties.length === 0) {
      return '';
    }
    
    return properties
      .map(prop => {
        let propName = '';
        if (typeof prop === 'string') {
          propName = prop;
        } else if (prop.name) {
          propName = prop.name;
        } else if (prop.description) {
          propName = prop.description;
        } else {
          propName = String(prop);
        }
        
        // Sanitize each property name
        return StringSanitizer.sanitizeHTML(propName);
      })
      .filter(name => name)
      .join(', ')
      .toLowerCase();
  }

  /**
   * Get weapon type number (0=melee, 1=ranged, 2=equipped ranged)
   */
  private getWeaponType(weaponDef: any, entryType: 'melee' | 'ranged' | 'normal' = 'normal'): number {
    const attackType = weaponDef.attackType;
    
    // Handle thrown weapons based on entry type
    if (entryType === 'melee') {
      return 0; // Thrown weapon melee entry
    }
    if (entryType === 'ranged') {
      return 2; // Thrown weapon ranged entry (equipped ranged for ammunition tracking)
    }
    
    // Handle normal weapons
    if (attackType === 2) { // Ranged weapon from D&D Beyond
      return 1; // Standard ranged weapon (could be 2 if equipped and has ammo)
    }
    return 0; // Melee weapon from D&D Beyond (attackType 1)
  }

  /**
   * Get weapon handling (0=one-handed, 1=two-handed)
   */
  private getHandling(properties: any[]): number {
    return this.hasProperty(properties, 'Two-Handed') ? 1 : 0;
  }

  /**
   * Get current ammo count (for ranged weapons)
   */
  private getAmmoCount(weapon: any, entryType: 'melee' | 'ranged' | 'normal' = 'normal'): number | undefined {
    // Only ranged entries get ammo tracking
    if (entryType === 'ranged' || weapon.definition.attackType === 2) {
      return 0; // Start with 0 ammo, player needs to add
    }
    return undefined;
  }

  /**
   * Get max ammo capacity (uses D&D Beyond quantity for all weapons, or default capacity for ranged)
   */
  private getMaxAmmo(weapon: any, weaponDef: any, entryType: 'melee' | 'ranged' | 'normal' = 'normal'): number {
    // For all weapons, use the quantity from D&D Beyond
    const quantity = weapon.quantity || 1;
    
    // Only ranged entries or ranged weapons get maxAmmo property
    if (entryType === 'ranged' || weaponDef.attackType === 2) {
      // For thrown weapons (entryType === 'ranged'), always use D&D Beyond quantity
      if (entryType === 'ranged') {
        return quantity; // Use exact quantity for thrown weapons
      }
      
      // For true ranged weapons (attackType 2), use quantity or defaults
      if (quantity > 1) return quantity;
      
      // Default ammo capacity based on weapon type for single ranged weapons
      const name = weaponDef.name?.toLowerCase() || '';
      if (name.includes('bow')) return 20;
      if (name.includes('javelin')) return 4;
      return 10;
    }
    
    // For melee weapons, use quantity (this handles cases like "5 daggers")
    return quantity;
  }

  /**
   * Check if weapon has specific property
   */
  private hasProperty(properties: any[], propertyName: string): boolean {
    if (!properties) return false;
    return properties.some(prop => {
      if (typeof prop === 'string') return prop.toLowerCase().includes(propertyName.toLowerCase());
      if (prop.name) return prop.name.toLowerCase().includes(propertyName.toLowerCase());
      return false;
    });
  }

  /**
   * Get ability score from character data
   */
  private getAbilityScore(characterData: any, abilityName: string): number {
    if (!characterData.stats) return 10;
    
    const abilityMap: { [key: string]: number } = {
      'strength': 1, 'dexterity': 2, 'constitution': 3,
      'intelligence': 4, 'wisdom': 5, 'charisma': 6
    };
    
    const abilityId = abilityMap[abilityName];
    const stat = characterData.stats.find((s: any) => s.id === abilityId);
    return stat ? stat.value : 10;
  }

  /**
   * Get character level
   */
  private getCharacterLevel(characterData: any): number {
    if (!characterData.classes) return 1;
    return characterData.classes.reduce((total: number, cls: any) => total + (cls.level || 0), 0);
  }

  /**
   * Generate XML for a single weapon entry (matches example XML format exactly)
   */
  private generateWeaponEntryXML(weapon: WeaponListEntry, index: number): string {
    const id = `id-${index.toString().padStart(5, '0')}`;
    
    let xml = `\t\t<${id}>\n`;
    
    // Optional ammo fields (only for ranged weapons)
    if (weapon.ammo !== undefined) {
      xml += `\t\t\t<ammo type="number">${weapon.ammo}</ammo>\n`;
    }
    
    xml += `\t\t\t<attackbonus type="number">${weapon.attackBonus}</attackbonus>\n`;
    xml += `\t\t\t<carried type="number">${weapon.carried}</carried>\n`;
    xml += `\t\t\t<damagelist>\n`;
    xml += `\t\t\t\t<id-00001>\n`;
    xml += `\t\t\t\t\t<bonus type="number">${weapon.damageBonus}</bonus>\n`;
    xml += `\t\t\t\t\t<dice type="dice">${weapon.dice}</dice>\n`;
    xml += `\t\t\t\t\t<stat type="string">base</stat>\n`;
    xml += `\t\t\t\t\t<type type="string">${weapon.damageType}</type>\n`;
    xml += `\t\t\t\t</id-00001>\n`;
    xml += `\t\t\t</damagelist>\n`;
    xml += `\t\t\t<handling type="number">${weapon.handling}</handling>\n`;
    xml += `\t\t\t<isidentified type="number">1</isidentified>\n`;
    
    // Add maxammo field for ranged weapons (type 1 or 2) only
    if ((weapon.weaponType === 1 || weapon.weaponType === 2) && weapon.maxAmmo) {
      xml += `\t\t\t<maxammo type="number">${weapon.maxAmmo}</maxammo>\n`;
    }
    
    xml += `\t\t\t<name type="string">${StringSanitizer.sanitizeHTML(weapon.name)}</name>\n`;
    xml += `\t\t\t<properties type="string">${StringSanitizer.sanitizeHTML(weapon.properties)}</properties>\n`;
    xml += `\t\t\t<shortcut type="windowreference">\n`;
    xml += `\t\t\t\t<class>item</class>\n`;
    xml += `\t\t\t\t<recordname>${weapon.inventoryShortcut}</recordname>\n`;
    xml += `\t\t\t</shortcut>\n`;
    xml += `\t\t\t<type type="number">${weapon.weaponType}</type>\n`;
    xml += `\t\t</${id}>\n`;
    
    return xml;
  }

}