/**
 * Foundry VTT JSON Output Formatter - Complete Modern Rewrite
 * 
 * Converts processed character data from ConversionOrchestrator to complete
 * Foundry VTT D&D 5e system JSON format. Uses modern service-driven architecture
 * with specialized data mappers for comprehensive coverage.
 * 
 * Features:
 * - Complete coverage of Foundry VTT Actor JSON structure
 * - Integration with ConversionOrchestrator processed data
 * - Comprehensive validation and error handling
 * - Extensible mapper architecture
 * - Full compliance with system architecture requirements
 */

import type { 
  OutputFormatter, 
  FormatOptions, 
  FormatResult, 
  ProcessedCharacterData,
  FormatError,
  FormatWarning
} from '../interfaces/OutputFormatter';
import type { ProcessedCharacterData as OrchProcessedData } from '@/domain/conversion/ConversionOrchestrator';
import type { CharacterData } from '@/domain/character/services/CharacterFetcher';
import { FoundryVTTMapper, type FoundryActor } from '../mappers/FoundryVTTMapper';
import { StringSanitizer } from '@/shared/utils/StringSanitizer';
import { featureFlags } from '@/core/FeatureFlags';

/**
 * Foundry VTT JSON Formatter with Modern Architecture
 * 
 * This class implements the complete rewrite with specialized mappers,
 * comprehensive validation, and full integration with ConversionOrchestrator.
 */
export class FoundryVTTJSONFormatter implements OutputFormatter {
  readonly format = 'foundry-vtt-json';
  readonly version = '2.0'; // Bumped version for complete rewrite
  readonly supportedFeatures = [
    'abilities', 'skills', 'combat', 'spells', 'equipment', 
    'features', 'active-effects', 'embedded-items', 'traits',
    'currency', 'resources', 'spell-slots', 'pact-magic',
    'character-details', 'token-configuration', 'proficiencies'
  ];

  private mapper: FoundryVTTMapper;
  private validator: FoundryVTTValidator;

  constructor() {
    this.mapper = new FoundryVTTMapper();
    this.validator = new FoundryVTTValidator();
  }

  /**
   * Generate Foundry VTT Actor JSON from processed character data
   * 
   * This method integrates with the ConversionOrchestrator's processed data
   * rather than doing its own processing, following the separation of concerns
   * principle from the system architecture.
   */
  async generateOutput(
    processedData: ProcessedCharacterData, 
    options?: FormatOptions
  ): Promise<FormatResult> {
    
    const startTime = performance.now();
    
    if (featureFlags.isEnabled('foundry_formatter_debug')) {
      console.log('🏗️ FoundryVTTJSONFormatter: Starting output generation', {
        characterName: processedData.name || 'Unknown',
        characterLevel: processedData.level || 'Unknown',
        options
      });
    }

    try {
      const errors: FormatError[] = [];
      const warnings: FormatWarning[] = [];

      // Step 1: Extract data from the legacy processed data format
      // TODO: This bridges the gap between legacy ProcessedCharacterData and new OrchProcessedData
      const orchestratorData = this.adaptLegacyData(processedData);
      const originalCharacter = processedData.characterData;

      // Step 2: Validate input data
      const validationResult = this.validator.validateInput(orchestratorData, originalCharacter);
      if (!validationResult.isValid) {
        return {
          success: false,
          error: `Input validation failed: ${validationResult.errors.join(', ')}`,
          warnings: validationResult.warnings
        };
      }

      // Add any validation warnings
      warnings.push(...validationResult.warnings.map(w => ({
        code: 'validation_warning',
        message: w,
        context: 'input_validation'
      })));

      // Step 3: Map to Foundry VTT Actor structure
      const foundryActor = this.mapper.mapToFoundryActor(orchestratorData, originalCharacter);

      // Step 4: Validate output structure
      const outputValidation = this.validator.validateOutput(foundryActor);
      if (!outputValidation.isValid) {
        return {
          success: false,
          error: `Output validation failed: ${outputValidation.errors.join(', ')}`,
          warnings: warnings
        };
      }

      // Add output validation warnings
      warnings.push(...outputValidation.warnings.map(w => ({
        code: 'output_warning', 
        message: w,
        context: 'output_validation'
      })));

      // Step 5: Generate final JSON
      const jsonOutput = JSON.stringify(foundryActor, null, 2);

      // Step 6: Final format validation
      const formatValidation = this.validator.validateJSON(jsonOutput);
      if (!formatValidation.isValid) {
        return {
          success: false,
          error: `JSON format validation failed: ${formatValidation.errors.join(', ')}`,
          warnings: warnings
        };
      }

      const processingTime = performance.now() - startTime;

      if (featureFlags.isEnabled('foundry_formatter_debug')) {
        console.log('🏗️ FoundryVTTJSONFormatter: Output generation complete', {
          success: true,
          characterName: foundryActor.name,
          outputLength: jsonOutput.length,
          processingTime: `${processingTime.toFixed(2)}ms`,
          warningCount: warnings.length,
          systemDataKeys: Object.keys(foundryActor.system),
          itemCount: foundryActor.items.length,
          effectCount: foundryActor.effects.length
        });
      }

      return {
        success: true,
        output: jsonOutput,
        warnings: warnings,
        metadata: {
          processingTime,
          outputSize: jsonOutput.length,
          foundryVersion: '11.x',
          dnd5eSystemVersion: '3.x',
          characterLevel: foundryActor.system.details.level,
          hasSpellSlots: this.hasSpellSlots(foundryActor),
          hasPactMagic: this.hasPactMagic(foundryActor),
          itemCount: foundryActor.items.length,
          effectCount: foundryActor.effects.length
        }
      };

    } catch (error) {
      const processingTime = performance.now() - startTime;
      
      console.error('🏗️ FoundryVTTJSONFormatter: Generation failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        processingTime: `${processingTime.toFixed(2)}ms`,
        characterName: processedData.name || 'Unknown'
      });

      return {
        success: false,
        error: error instanceof Error ? 
          `Foundry VTT formatting error: ${error.message}` : 
          'Unknown error during Foundry VTT format generation',
        warnings: [],
        metadata: {
          processingTime,
          failed: true
        }
      };
    }
  }

  /**
   * Validate input data structure and completeness
   */
  async validateInput(processedData: ProcessedCharacterData): Promise<{ 
    isValid: boolean; 
    errors: string[]; 
    warnings: string[] 
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate required data structure
    if (!processedData) {
      errors.push('Processed character data is required');
      return { isValid: false, errors, warnings };
    }

    if (!processedData.characterData) {
      errors.push('Character data is required');
      return { isValid: false, errors, warnings };
    }

    if (!processedData.name || typeof processedData.name !== 'string') {
      errors.push('Character name is required');
    }

    if (!processedData.level || typeof processedData.level !== 'number') {
      warnings.push('Character level not found - will default to 1');
    }

    // Validate character data structure
    const character = processedData.characterData;
    
    if (!character.id) {
      errors.push('Character ID is required');
    }

    if (!character.stats || !Array.isArray(character.stats)) {
      warnings.push('Character stats missing - will use default values');
    }

    if (!character.classes || !Array.isArray(character.classes)) {
      warnings.push('Character classes missing - some features may not work correctly');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Get feature compatibility information for this formatter
   */
  getCompatibilityInfo(): { 
    supportedFeatures: string[];
    unsupportedFeatures: string[];
    limitations: string[];
  } {
    return {
      supportedFeatures: [...this.supportedFeatures],
      unsupportedFeatures: [
        'homebrew-spells',
        'custom-backgrounds',
        'variant-rules'
      ],
      limitations: [
        'Active effects are basic implementations',
        'Custom items may not transfer completely',
        'Some homebrew content may be simplified'
      ]
    };
  }

  /**
   * Adapter method to bridge legacy ProcessedCharacterData to OrchProcessedData
   * TODO: Remove this when facade fully uses ConversionOrchestrator
   */
  private adaptLegacyData(processedData: ProcessedCharacterData): OrchProcessedData {
    // This is a bridge method that will be removed once the facade
    // fully uses ConversionOrchestrator. For now, it adapts the legacy
    // processed data format to what the new mappers expect.
    
    return {
      id: processedData.characterData?.id || 0,
      name: processedData.name || 'Unknown Character',
      level: processedData.level || 1,
      abilities: processedData.abilities || {},
      spellSlots: processedData.spells || {
        spellSlots: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 },
        pactMagicSlots: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 },
        multiclassCasterLevel: 0,
        totalCasterClasses: 0,
        debugInfo: {
          classBreakdown: [],
          calculationMethod: 'single_class',
          casterLevelCalculation: []
        }
      },
      inventory: processedData.inventory || { items: [], totalWeight: 0, skippedItems: [] },
      features: processedData.features || { classFeatures: [], racialTraits: [], feats: [], skippedFeatures: [] },
      encumbrance: {
        currentWeight: 0,
        carryingCapacity: 150,
        encumbranceLevel: 'unencumbered',
        speedPenalty: 0,
        canCarry: true
      },
      processing: {
        timestamp: new Date(),
        totalTime: 0,
        steps: [],
        errors: [],
        warnings: []
      }
    } as OrchProcessedData;
  }

  private hasSpellSlots(actor: FoundryActor): boolean {
    return Object.values(actor.system.spells).some(slot => 
      typeof slot === 'object' && slot.max > 0
    );
  }

  private hasPactMagic(actor: FoundryActor): boolean {
    return actor.system.spells.pact?.max > 0;
  }
}

/**
 * Foundry VTT Validation Engine
 * 
 * Provides comprehensive validation for input data, output structure,
 * and JSON format compliance.
 */
export class FoundryVTTValidator {
  
  /**
   * Validate input data for Foundry VTT formatting
   */
  validateInput(processedData: OrchProcessedData, originalCharacter: CharacterData): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate processed data structure
    if (!processedData.id) {
      errors.push('Character ID is required');
    }

    if (!processedData.name) {
      errors.push('Character name is required');
    }

    if (processedData.level < 1 || processedData.level > 20) {
      warnings.push(`Character level ${processedData.level} is outside normal range (1-20)`);
    }

    // Validate original character data
    if (!originalCharacter.stats || originalCharacter.stats.length < 6) {
      warnings.push('Incomplete ability scores - some may default to 10');
    }

    if (!originalCharacter.classes || originalCharacter.classes.length === 0) {
      warnings.push('No classes found - character will have minimal features');
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  /**
   * Validate generated Foundry VTT Actor structure
   */
  validateOutput(actor: FoundryActor): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate required properties
    if (!actor.name) {
      errors.push('Actor name is required');
    }

    if (actor.type !== 'character') {
      errors.push('Actor type must be "character"');
    }

    if (!actor.system) {
      errors.push('System data is required');
    } else {
      // Validate system data structure
      if (!actor.system.abilities) {
        errors.push('Abilities are required');
      } else {
        const requiredAbilities = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
        requiredAbilities.forEach(ability => {
          if (!actor.system.abilities[ability as keyof typeof actor.system.abilities]) {
            errors.push(`Missing ability: ${ability}`);
          }
        });
      }

      if (!actor.system.attributes) {
        errors.push('Attributes are required');
      }

      if (!actor.system.details) {
        errors.push('Details are required');
      }
    }

    // Validate items array
    if (!Array.isArray(actor.items)) {
      errors.push('Items must be an array');
    }

    // Validate effects array  
    if (!Array.isArray(actor.effects)) {
      errors.push('Effects must be an array');
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  /**
   * Validate JSON format and structure
   */
  validateJSON(jsonString: string): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      const parsed = JSON.parse(jsonString);
      
      // Check JSON structure
      if (typeof parsed !== 'object' || parsed === null) {
        errors.push('JSON must be an object');
      }

      // Check for required Foundry properties
      const requiredProps = ['name', 'type', 'system'];
      requiredProps.forEach(prop => {
        if (!(prop in parsed)) {
          errors.push(`Missing required property: ${prop}`);
        }
      });

      // Validate JSON size (reasonable limits)
      if (jsonString.length > 10 * 1024 * 1024) { // 10MB limit
        warnings.push('JSON output is very large (>10MB)');
      }

    } catch (error) {
      errors.push(`Invalid JSON format: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return { isValid: errors.length === 0, errors, warnings };
  }
}