/**
 * Inventory Domain Models
 * 
 * Defines the core inventory types and structures for D&D Beyond character inventory
 * processing. These models represent the domain entities for inventory management,
 * container nesting, and weight calculations.
 */

export interface ItemDefinition {
  id: number;
  name: string;
  weight: number;
  cost?: {
    quantity: number;
    unit: 'cp' | 'sp' | 'ep' | 'gp' | 'pp';
  };
  bundleSize: number;
  isContainer: boolean;
  weightMultiplier?: number; // 0 = magic container (Bag of Holding), 1 = normal
  filterType: string;
  subType?: string;
  description?: string;
  armorClass?: number;
  armorTypeId?: number;
  weaponBehaviors?: Array<{
    type: string;
    range?: {
      normal: number;
      long: number;
    };
    properties?: string[];
  }>;
}

export interface InventoryItem {
  id: number;
  entityTypeId: number;
  definition: ItemDefinition;
  quantity: number;
  isAttuned: boolean;
  equipped: boolean;
  containerEntityId: number; // Character ID or container item ID
  charges?: {
    chargesUsed: number;
    chargesPerUse: number;
    maxCharges: number;
  };
  customName?: string;
  customWeight?: number;
  customCost?: {
    quantity: number;
    unit: string;
  };
}

export interface ContainerItem extends InventoryItem {
  definition: ItemDefinition & {
    isContainer: true;
    weightMultiplier: number;
  };
  contents: InventoryItem[];
  maxCapacity?: number;
  currentWeight: number;
}

export interface NestedInventoryStructure {
  characterId: number;
  rootItems: InventoryItem[];
  containers: Map<string, ContainerItem>;
  totalItems: number;
  totalWeight: number;
}

export interface EncumbranceCalculation {
  totalWeight: number;
  carryingCapacity: {
    normal: number;  // STR score * 15
    push: number;    // STR score * 30  
    lift: number;    // STR score * 30
    powerfulBuild: boolean; // Goliath racial trait
  };
  encumbranceLevel: 'unencumbered' | 'encumbered' | 'heavily_encumbered' | 'overloaded';
  speedPenalty: number;
  disadvantageOnChecks: boolean;
}

export interface ItemXMLGeneration {
  id: string;
  name: string;
  type: string;
  weight: number;
  count: number;
  cost?: {
    value: number;
    denomination: string;
  };
  isIdentified: boolean;
  isLocked: boolean;
  description?: string;
  properties?: string[];
  location?: string; // Container name if inside a container (Fantasy Grounds flat structure)
}

export interface InventoryXMLResult {
  xml: string;
  itemCount: number;
  totalWeight: number;
  containerCount: number;
  debugInfo: {
    processedItems: number;
    skippedItems: number;
    containerItems: number;
    magicContainers: string[];
  };
}

// Value Objects for type safety
export class ItemId {
  constructor(public readonly value: number) {
    if (value <= 0) {
      throw new Error('ItemId must be a positive number');
    }
  }
  
  toString(): string {
    return this.value.toString();
  }
  
  equals(other: ItemId): boolean {
    return this.value === other.value;
  }
}

export class Weight {
  constructor(public readonly pounds: number) {
    if (pounds < 0) {
      throw new Error('Weight cannot be negative');
    }
  }
  
  add(other: Weight): Weight {
    return new Weight(this.pounds + other.pounds);
  }
  
  multiply(multiplier: number): Weight {
    if (multiplier < 0) {
      throw new Error('Weight multiplier cannot be negative');
    }
    return new Weight(this.pounds * multiplier);
  }
  
  isZero(): boolean {
    return this.pounds === 0;
  }
}

export class Quantity {
  constructor(public readonly amount: number) {
    if (amount < 0) {
      throw new Error('Quantity cannot be negative');
    }
  }
  
  isZero(): boolean {
    return this.amount === 0;
  }
  
  multiply(weight: Weight): Weight {
    return weight.multiply(this.amount);
  }
}