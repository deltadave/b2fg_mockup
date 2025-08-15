/**
 * EncumbranceCalculator Service
 * 
 * Calculates character encumbrance, carrying capacity, and movement penalties
 * based on D&D 5e rules with support for special traits like Powerful Build.
 * 
 * Migrated from legacy calculateEncumbrance() function in utilities.js lines 868-967
 */

import { 
  InventoryItem, 
  ContainerItem, 
  EncumbranceCalculation, 
  Weight, 
  Quantity 
} from '@/domain/character/models/Inventory';
import { featureFlags } from '@/core/FeatureFlags';
import { ObjectSearch } from '@/shared/utils/ObjectSearch';

export interface CharacterStrength {
  id: number;
  strengthScore: number;
  hasPowerfulBuild: boolean; // Goliath racial trait
  modifiers?: Array<{
    type: string;
    subType: string;
    source: string;
    value: number;
  }>;
}

export interface EncumbranceOptions {
  includeContainerWeights: boolean;
  respectMagicContainers: boolean;
  applyRacialTraits: boolean;
}

export interface EncumbranceDebugInfo {
  itemBreakdown: Array<{
    itemId: number;
    itemName: string;
    weight: number;
    quantity: number;
    totalWeight: number;
    containerName?: string;
    magicContainer: boolean;
  }>;
  strengthCalculation: {
    baseStrength: number;
    modifiers: number;
    finalStrength: number;
    powerfulBuild: boolean;
  };
  carryingCapacityCalculation: {
    normal: number;
    encumbered: number;
    heavilyEncumbered: number;
    maximum: number;
  };
}

export class EncumbranceCalculator {
  private readonly ENCUMBRANCE_MULTIPLIERS = {
    ENCUMBERED_THRESHOLD: 5,   // STR * 5 = encumbered threshold  
    HEAVILY_THRESHOLD: 10,     // STR * 10 = heavily encumbered threshold
    MAXIMUM_CAPACITY: 15,      // STR * 15 = maximum carrying capacity (D&D 5e rules)
    PUSH_DRAG_LIFT: 30        // STR * 30 = push/drag/lift capacity
  };

  /**
   * Calculate encumbrance for a character with their inventory
   * 
   * @param character - Character with strength score and traits
   * @param inventory - Array of inventory items
   * @param options - Calculation options
   * @returns Detailed encumbrance calculation
   */
  calculateEncumbrance(
    character: CharacterStrength,
    inventory: InventoryItem[],
    options: EncumbranceOptions = {
      includeContainerWeights: true,
      respectMagicContainers: true,
      applyRacialTraits: true
    }
  ): EncumbranceCalculation {
    if (featureFlags.isEnabled('encumbrance_calculator_debug')) {
      console.log('🎒 EncumbranceCalculator: Calculating encumbrance', {
        characterId: character.id,
        inventoryItems: inventory.length,
        options
      });
    }

    // Calculate total weight carried
    const weightCalculation = this.calculateTotalWeight(inventory, character.id, options);
    
    // Calculate carrying capacity
    const carryingCapacity = this.calculateCarryingCapacity(character, options);
    
    // Determine encumbrance level
    const encumbranceLevel = this.determineEncumbranceLevel(
      weightCalculation.totalWeight, 
      carryingCapacity
    );
    
    // Calculate penalties
    const { speedPenalty, disadvantageOnChecks } = this.calculatePenalties(encumbranceLevel);

    const result: EncumbranceCalculation = {
      totalWeight: weightCalculation.totalWeight,
      carryingCapacity: {
        normal: carryingCapacity.maximum,
        push: carryingCapacity.maximum * 2,  // STR * 30 for push/drag/lift
        lift: carryingCapacity.maximum * 2,  // STR * 30 for push/drag/lift
        powerfulBuild: character.hasPowerfulBuild && options.applyRacialTraits
      },
      encumbranceLevel,
      speedPenalty,
      disadvantageOnChecks
    };

    if (featureFlags.isEnabled('encumbrance_calculator_debug')) {
      console.log('🎒 EncumbranceCalculator: Result', {
        totalWeight: result.totalWeight,
        encumbranceLevel: result.encumbranceLevel,
        carryingCapacity: result.carryingCapacity,
        penalties: { speedPenalty, disadvantageOnChecks }
      });
    }

    return result;
  }

  /**
   * Calculate total weight with container rules
   * 
   * @param inventory - Array of inventory items
   * @param characterId - Character ID for filtering items
   * @param options - Calculation options
   * @returns Weight calculation with debug info
   */
  private calculateTotalWeight(
    inventory: InventoryItem[], 
    characterId: number, 
    options: EncumbranceOptions
  ): { totalWeight: number; debugInfo: EncumbranceDebugInfo['itemBreakdown'] } {
    let totalWeight = 0;
    const itemBreakdown: EncumbranceDebugInfo['itemBreakdown'] = [];

    // Create container weight multiplier map
    const containerWeightMultipliers = this.buildContainerMultiplierMap(inventory);

    inventory.forEach(item => {
      // Skip zero or negative quantity items early
      if (item.quantity <= 0) {
        return;
      }
      
      const quantity = new Quantity(item.quantity);

      const baseWeight = new Weight(item.definition.weight || 0);
      const containerEntityId = item.containerEntityId.toString();
      const characterIdStr = characterId.toString();
      
      let effectiveWeight = baseWeight.multiply(quantity.amount);
      let magicContainer = false;
      let containerName: string | undefined;

      // Apply container weight rules
      if (options.respectMagicContainers && 
          containerEntityId !== characterIdStr && 
          containerWeightMultipliers.has(containerEntityId)) {
        
        const weightMultiplier = containerWeightMultipliers.get(containerEntityId)!;
        containerName = this.findContainerName(inventory, containerEntityId);
        
        if (weightMultiplier === 0) {
          // Magic containers (Bag of Holding, Handy Haversack, etc.)
          effectiveWeight = new Weight(0);
          magicContainer = true;
        } else {
          // Apply container weight multiplier
          effectiveWeight = effectiveWeight.multiply(weightMultiplier);
        }
      }

      totalWeight += effectiveWeight.pounds;

      itemBreakdown.push({
        itemId: item.id,
        itemName: item.definition.name,
        weight: baseWeight.pounds,
        quantity: quantity.amount,
        totalWeight: effectiveWeight.pounds,
        containerName,
        magicContainer
      });
    });

    return { totalWeight, debugInfo: itemBreakdown };
  }

  /**
   * Build map of container IDs to their weight multipliers
   */
  private buildContainerMultiplierMap(inventory: InventoryItem[]): Map<string, number> {
    const containerMultipliers = new Map<string, number>();
    
    inventory.forEach(item => {
      if (item.definition.isContainer && item.definition.weightMultiplier !== undefined) {
        containerMultipliers.set(item.id.toString(), item.definition.weightMultiplier);
      }
    });
    
    return containerMultipliers;
  }

  /**
   * Find container name by ID for debug information
   */
  private findContainerName(inventory: InventoryItem[], containerId: string): string {
    const container = inventory.find(item => item.id.toString() === containerId);
    return container?.definition.name || 'Unknown Container';
  }

  /**
   * Calculate carrying capacity based on strength and racial traits
   */
  private calculateCarryingCapacity(
    character: CharacterStrength, 
    options: EncumbranceOptions
  ): { normal: number; encumbered: number; heavilyEncumbered: number; maximum: number } {
    let effectiveStrength = character.strengthScore;

    // Apply Powerful Build trait (Goliath, Firbolg, etc.)
    // Counts as one size larger for carrying capacity
    if (character.hasPowerfulBuild && options.applyRacialTraits) {
      effectiveStrength = Math.min(effectiveStrength * 2, 29); // Cap at 29 (size Large max)
    }

    return {
      normal: effectiveStrength * this.ENCUMBRANCE_MULTIPLIERS.ENCUMBERED_THRESHOLD,
      encumbered: effectiveStrength * this.ENCUMBRANCE_MULTIPLIERS.ENCUMBERED_THRESHOLD,
      heavilyEncumbered: effectiveStrength * this.ENCUMBRANCE_MULTIPLIERS.HEAVILY_THRESHOLD,
      maximum: effectiveStrength * this.ENCUMBRANCE_MULTIPLIERS.MAXIMUM_CAPACITY
    };
  }

  /**
   * Determine encumbrance level based on weight and capacity
   * D&D 5e rules: Encumbered at STR*5, Heavily Encumbered at STR*10, Max at STR*15
   */
  private determineEncumbranceLevel(
    totalWeight: number, 
    capacity: { normal: number; encumbered: number; heavilyEncumbered: number; maximum: number }
  ): EncumbranceCalculation['encumbranceLevel'] {
    if (totalWeight > capacity.maximum) {
      return 'overloaded';
    } else if (totalWeight > capacity.heavilyEncumbered) {
      return 'heavily_encumbered';
    } else if (totalWeight > capacity.encumbered) {
      return 'encumbered';
    } else {
      return 'unencumbered';
    }
  }

  /**
   * Calculate movement penalties and disadvantages
   */
  private calculatePenalties(encumbranceLevel: EncumbranceCalculation['encumbranceLevel']): 
    { speedPenalty: number; disadvantageOnChecks: boolean } {
    
    switch (encumbranceLevel) {
      case 'heavily_encumbered':
        return { speedPenalty: 20, disadvantageOnChecks: true };
      case 'encumbered':
        return { speedPenalty: 10, disadvantageOnChecks: false };
      case 'overloaded':
        return { speedPenalty: 0, disadvantageOnChecks: true }; // Cannot move
      default:
        return { speedPenalty: 0, disadvantageOnChecks: false };
    }
  }

  /**
   * Get detailed debug information about the encumbrance calculation
   */
  getEncumbranceDebugInfo(
    character: CharacterStrength,
    inventory: InventoryItem[],
    options: EncumbranceOptions = {
      includeContainerWeights: true,
      respectMagicContainers: true,
      applyRacialTraits: true
    }
  ): EncumbranceDebugInfo {
    const weightCalc = this.calculateTotalWeight(inventory, character.id, options);
    const capacity = this.calculateCarryingCapacity(character, options);

    return {
      itemBreakdown: weightCalc.debugInfo,
      strengthCalculation: {
        baseStrength: character.strengthScore,
        modifiers: 0, // TODO: Calculate from character.modifiers if needed
        finalStrength: character.strengthScore,
        powerfulBuild: character.hasPowerfulBuild && options.applyRacialTraits
      },
      carryingCapacityCalculation: capacity
    };
  }

  /**
   * Check if a character has the Powerful Build trait
   * Used by other services to determine strength multipliers
   */
  static hasPowerfulBuild(characterData: any): boolean {
    // Check for racial traits that grant Powerful Build
    if (characterData.race?.fullName?.toLowerCase().includes('goliath')) {
      return true;
    }

    // Check traits directly
    const powerfulBuildTrait = ObjectSearch.find(characterData, 'name', 'Powerful Build');
    return powerfulBuildTrait.length > 0;
  }

  /**
   * Validate inventory data before processing
   */
  static validateInventoryData(inventory: InventoryItem[]): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    inventory.forEach((item, index) => {
      if (!item.id || item.id <= 0) {
        errors.push(`Item at index ${index} has invalid ID: ${item.id}`);
      }
      
      if (item.quantity < 0) {
        errors.push(`Item ${item.definition.name} has negative quantity: ${item.quantity}`);
      }
      
      if (item.definition.weight < 0) {
        errors.push(`Item ${item.definition.name} has negative weight: ${item.definition.weight}`);
      }
    });
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}