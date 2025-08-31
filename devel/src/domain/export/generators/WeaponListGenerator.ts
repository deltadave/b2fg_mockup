/**
 * Standalone Weapon List Generator
 * 
 * Generates Fantasy Grounds weaponlist XML directly from D&D Beyond character data
 * without modifying existing inventory processing systems.
 */

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

    // Extract weapons from inventory
    const weapons = characterData.inventory
      .filter((item: any) => item.definition.filterType === 'Weapon')
      .map((weapon: any, index: number) => this.convertToWeaponListEntry(weapon, characterData, index));

    if (weapons.length === 0) {
      return '\t<weaponlist>\n\t</weaponlist>';
    }

    let xml = '\t<weaponlist>\n';
    weapons.forEach((weapon, index) => {
      xml += this.generateWeaponEntryXML(weapon, index + 1);
    });
    xml += '\t</weaponlist>';

    return xml;
  }

  /**
   * Convert D&D Beyond weapon to weapon list entry
   */
  private convertToWeaponListEntry(weapon: any, characterData: any, inventoryIndex: number): WeaponListEntry {
    const weaponDef = weapon.definition;
    
    // Basic weapon stats from JSON
    const name = weaponDef.name || 'Unknown Weapon';
    const dice = this.extractDiceFromDamage(weaponDef.damage);
    const damageType = this.formatDamageType(weaponDef.damageType);
    const properties = this.formatWeaponProperties(weaponDef.properties);
    
    // Calculate bonuses based on character stats and weapon magic
    const magicBonus = this.extractMagicBonus(weapon.grantedModifiers || []);
    const attackBonus = this.calculateAttackBonus(characterData, weaponDef, magicBonus);
    const damageBonus = this.calculateDamageBonus(characterData, weaponDef, magicBonus);
    
    // Determine weapon type and handling from D&D Beyond data
    const weaponType = this.getWeaponType(weaponDef);
    const carried = weapon.equipped ? 2 : 1;
    const handling = this.getHandling(weaponDef.properties);
    
    // Build inventory reference
    const inventoryShortcut = `....inventorylist.id-${(inventoryIndex + 1).toString().padStart(5, '0')}`;
    
    return {
      id: weapon.id.toString(),
      name,
      dice,
      damageType,
      attackBonus,
      damageBonus,
      properties,
      weaponType,
      carried,
      handling,
      ammo: this.getAmmoCount(weapon),
      maxAmmo: this.getMaxAmmo(weaponDef),
      inventoryShortcut
    };
  }

  /**
   * Extract dice notation from damage data (returns "d8", "d6", etc.)
   */
  private extractDiceFromDamage(damage: any): string {
    if (!damage || !damage.diceValue) {
      return 'd4';
    }
    return `d${damage.diceValue}`;
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
  private calculateAttackBonus(characterData: any, weaponDef: any, magicBonus: number): number {
    // Get ability modifier (simplified - use STR or DEX based on finesse)
    const isFinesse = this.hasProperty(weaponDef.properties, 'Finesse');
    const abilityScore = isFinesse ? this.getAbilityScore(characterData, 'dexterity') : this.getAbilityScore(characterData, 'strength');
    const abilityModifier = Math.floor((abilityScore - 10) / 2);
    
    // Get proficiency bonus (simplified - assume proficient)
    const characterLevel = this.getCharacterLevel(characterData);
    const proficiencyBonus = Math.ceil(characterLevel / 4) + 1; // 2 at level 1-4, 3 at 5-8, etc.
    
    return abilityModifier + proficiencyBonus + magicBonus;
  }

  /**
   * Calculate damage bonus based on character abilities
   */
  private calculateDamageBonus(characterData: any, weaponDef: any, magicBonus: number): number {
    // Get ability modifier (simplified - use STR or DEX based on finesse)
    const isFinesse = this.hasProperty(weaponDef.properties, 'Finesse');
    const abilityScore = isFinesse ? this.getAbilityScore(characterData, 'dexterity') : this.getAbilityScore(characterData, 'strength');
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
        if (typeof prop === 'string') return prop;
        if (prop.name) return prop.name;
        return prop;
      })
      .filter(name => name)
      .join(', ')
      .toLowerCase();
  }

  /**
   * Get weapon type number (0=melee, 1=ranged, 2=equipped ranged)
   */
  private getWeaponType(weaponDef: any): number {
    const attackType = weaponDef.attackType;
    if (attackType === 2) { // Ranged weapon
      return 1; // Could be 2 if equipped and has ammo
    }
    return 0; // Melee
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
  private getAmmoCount(weapon: any): number | undefined {
    // Return 0 for ranged weapons - ammo tracking
    return weapon.definition.attackType === 2 ? 0 : undefined;
  }

  /**
   * Get max ammo capacity (for ranged weapons)
   */
  private getMaxAmmo(weaponDef: any): number | undefined {
    if (weaponDef.attackType === 2) { // Ranged weapon
      // Default ammo capacity based on weapon type
      const name = weaponDef.name?.toLowerCase() || '';
      if (name.includes('bow')) return 20;
      if (name.includes('javelin')) return 4;
      return 10;
    }
    return undefined;
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
    
    // Optional max ammo fields
    if (weapon.maxAmmo !== undefined) {
      xml += `\t\t\t<maxammo type="number">${weapon.maxAmmo}</maxammo>\n`;
    }
    
    xml += `\t\t\t<name type="string">${this.sanitizeString(weapon.name)}</name>\n`;
    xml += `\t\t\t<properties type="string">${weapon.properties}</properties>\n`;
    xml += `\t\t\t<shortcut type="windowreference">\n`;
    xml += `\t\t\t\t<class>item</class>\n`;
    xml += `\t\t\t\t<recordname>${weapon.inventoryShortcut}</recordname>\n`;
    xml += `\t\t\t</shortcut>\n`;
    xml += `\t\t\t<type type="number">${weapon.weaponType}</type>\n`;
    xml += `\t\t</${id}>\n`;
    
    return xml;
  }


  /**
   * Sanitize string for XML output
   */
  private sanitizeString(input: string): string {
    if (!input) return '';
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}