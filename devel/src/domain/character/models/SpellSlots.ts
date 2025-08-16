/**
 * Spell Slot Domain Models
 * 
 * Defines the core spell slot types and structures for D&D 5e spellcasting
 * rules including multiclassing calculations, Pact Magic, and XML generation.
 */

export interface CharacterClass {
  id: number;
  level: number;
  classDefinition: {
    id: number;
    name: string;
    canCastSpells: boolean;
    spellCastingAbilityId?: number;
  };
  subclassDefinition?: {
    id: number;
    name: string;
  };
}

export interface SpellcastingProgression {
  className: string;
  casterType: 'full' | 'half' | 'third' | 'pact' | 'none';
  casterLevel: number;
  spellSlots: SpellSlotsByLevel;
  isPactMagic: boolean;
  spellcastingAbility?: 'INT' | 'WIS' | 'CHA';
  actualClassLevel?: number;
}

export interface SpellSlotsByLevel {
  1: number;
  2: number;
  3: number;
  4: number;
  5: number;
  6: number;
  7: number;
  8: number;
  9: number;
}

export interface SpellSlotCalculationResult {
  spellSlots: SpellSlotsByLevel;
  pactMagicSlots: SpellSlotsByLevel;
  multiclassCasterLevel: number;
  totalCasterClasses: number;
  debugInfo: {
    classBreakdown: SpellcastingProgression[];
    calculationMethod: 'single_class' | 'multiclass' | 'pact_magic_only';
    casterLevelCalculation: Array<{
      className: string;
      level: number;
      casterType: string;
      contributesToCasterLevel: number;
    }>;
  };
}

export interface PactMagicProgression {
  warlockLevel: number;
  slotLevel: number;
  slotCount: number;
  shortRestRecharge: boolean;
}

// D&D 5e Spell Slot Tables by Caster Level
export const FULL_CASTER_SPELL_SLOTS: Record<number, SpellSlotsByLevel> = {
  1: { 1: 2, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 },
  2: { 1: 3, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 },
  3: { 1: 4, 2: 2, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 },
  4: { 1: 4, 2: 3, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 },
  5: { 1: 4, 2: 3, 3: 2, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 },
  6: { 1: 4, 2: 3, 3: 3, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 },
  7: { 1: 4, 2: 3, 3: 3, 4: 1, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 },
  8: { 1: 4, 2: 3, 3: 3, 4: 2, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 },
  9: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 1, 6: 0, 7: 0, 8: 0, 9: 0 },
  10: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 0, 7: 0, 8: 0, 9: 0 },
  11: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 0, 8: 0, 9: 0 },
  12: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 0, 8: 0, 9: 0 },
  13: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1, 8: 0, 9: 0 },
  14: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1, 8: 0, 9: 0 },
  15: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1, 8: 1, 9: 0 },
  16: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1, 8: 1, 9: 0 },
  17: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1, 8: 1, 9: 1 },
  18: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 3, 6: 1, 7: 1, 8: 1, 9: 1 },
  19: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 3, 6: 2, 7: 1, 8: 1, 9: 1 },
  20: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 3, 6: 2, 7: 2, 8: 1, 9: 1 }
};

export const HALF_CASTER_SPELL_SLOTS: Record<number, SpellSlotsByLevel> = {
  1: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 },
  2: { 1: 2, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 },
  3: { 1: 3, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 },
  4: { 1: 3, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 },
  5: { 1: 4, 2: 2, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 },
  6: { 1: 4, 2: 2, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 },
  7: { 1: 4, 2: 3, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 },
  8: { 1: 4, 2: 3, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 },
  9: { 1: 4, 2: 3, 3: 2, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 },
  10: { 1: 4, 2: 3, 3: 2, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 },
  11: { 1: 4, 2: 3, 3: 3, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 },
  12: { 1: 4, 2: 3, 3: 3, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 },
  13: { 1: 4, 2: 3, 3: 3, 4: 1, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 },
  14: { 1: 4, 2: 3, 3: 3, 4: 1, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 },
  15: { 1: 4, 2: 3, 3: 3, 4: 2, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 },
  16: { 1: 4, 2: 3, 3: 3, 4: 2, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 },
  17: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 1, 6: 0, 7: 0, 8: 0, 9: 0 },
  18: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 1, 6: 0, 7: 0, 8: 0, 9: 0 },
  19: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 0, 7: 0, 8: 0, 9: 0 },
  20: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 0, 7: 0, 8: 0, 9: 0 }
};

export const THIRD_CASTER_SPELL_SLOTS: Record<number, SpellSlotsByLevel> = {
  1: { 1: 2, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 }, // Artificer starts at 1st
  2: { 1: 2, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 },
  3: { 1: 2, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 }, // EK/AT start here - corrected to 2 spell slots
  4: { 1: 3, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 },
  5: { 1: 3, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 },
  6: { 1: 3, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 },
  7: { 1: 4, 2: 2, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 },
  8: { 1: 4, 2: 2, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 },
  9: { 1: 4, 2: 2, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 },
  10: { 1: 4, 2: 3, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 },
  11: { 1: 4, 2: 3, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 },
  12: { 1: 4, 2: 3, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 },
  13: { 1: 4, 2: 3, 3: 2, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 },
  14: { 1: 4, 2: 3, 3: 2, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 },
  15: { 1: 4, 2: 3, 3: 2, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 },
  16: { 1: 4, 2: 3, 3: 3, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 },
  17: { 1: 4, 2: 3, 3: 3, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 },
  18: { 1: 4, 2: 3, 3: 3, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 },
  19: { 1: 4, 2: 3, 3: 3, 4: 1, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 },
  20: { 1: 4, 2: 3, 3: 3, 4: 1, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 }
};

export const PACT_MAGIC_PROGRESSION: Record<number, PactMagicProgression> = {
  1: { warlockLevel: 1, slotLevel: 1, slotCount: 1, shortRestRecharge: true },
  2: { warlockLevel: 2, slotLevel: 1, slotCount: 2, shortRestRecharge: true },
  3: { warlockLevel: 3, slotLevel: 2, slotCount: 2, shortRestRecharge: true },
  4: { warlockLevel: 4, slotLevel: 2, slotCount: 2, shortRestRecharge: true },
  5: { warlockLevel: 5, slotLevel: 3, slotCount: 2, shortRestRecharge: true },
  6: { warlockLevel: 6, slotLevel: 3, slotCount: 2, shortRestRecharge: true },
  7: { warlockLevel: 7, slotLevel: 4, slotCount: 2, shortRestRecharge: true },
  8: { warlockLevel: 8, slotLevel: 4, slotCount: 2, shortRestRecharge: true },
  9: { warlockLevel: 9, slotLevel: 5, slotCount: 2, shortRestRecharge: true },
  10: { warlockLevel: 10, slotLevel: 5, slotCount: 2, shortRestRecharge: true },
  11: { warlockLevel: 11, slotLevel: 5, slotCount: 3, shortRestRecharge: true },
  12: { warlockLevel: 12, slotLevel: 5, slotCount: 3, shortRestRecharge: true },
  13: { warlockLevel: 13, slotLevel: 5, slotCount: 3, shortRestRecharge: true },
  14: { warlockLevel: 14, slotLevel: 5, slotCount: 3, shortRestRecharge: true },
  15: { warlockLevel: 15, slotLevel: 5, slotCount: 3, shortRestRecharge: true },
  16: { warlockLevel: 16, slotLevel: 5, slotCount: 3, shortRestRecharge: true },
  17: { warlockLevel: 17, slotLevel: 5, slotCount: 4, shortRestRecharge: true },
  18: { warlockLevel: 18, slotLevel: 5, slotCount: 4, shortRestRecharge: true },
  19: { warlockLevel: 19, slotLevel: 5, slotCount: 4, shortRestRecharge: true },
  20: { warlockLevel: 20, slotLevel: 5, slotCount: 4, shortRestRecharge: true }
};

// Class names mapping to caster types
export const CLASS_CASTER_TYPES: Record<string, 'full' | 'half' | 'third' | 'pact' | 'none'> = {
  'bard': 'full',
  'cleric': 'full', 
  'druid': 'full',
  'sorcerer': 'full',
  'wizard': 'full',
  'paladin': 'half',
  'ranger': 'half',
  'artificer': 'third', // Actually starts at 1st but progresses as 1/2
  'fighter': 'third', // Eldritch Knight subclass only
  'rogue': 'third', // Arcane Trickster subclass only
  'warlock': 'pact'
};

// Subclasses that grant spellcasting
export const SPELLCASTING_SUBCLASSES: Record<string, string[]> = {
  'fighter': ['eldritch_knight'],
  'rogue': ['arcane_trickster'],
  'ranger': [] // All rangers cast spells except spellless variant
};

// Value objects for type safety
export class CasterLevel {
  constructor(public readonly level: number) {
    if (level < 0 || level > 20) {
      throw new Error('Caster level must be between 0 and 20');
    }
  }
  
  toString(): string {
    return this.level.toString();
  }
  
  equals(other: CasterLevel): boolean {
    return this.level === other.level;
  }
}

export class SpellSlotCount {
  constructor(public readonly count: number) {
    if (count < 0) {
      throw new Error('Spell slot count cannot be negative');
    }
  }
  
  toString(): string {
    return this.count.toString();
  }
  
  isZero(): boolean {
    return this.count === 0;
  }
}