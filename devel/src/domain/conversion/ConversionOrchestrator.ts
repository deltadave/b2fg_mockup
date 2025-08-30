/**
 * ConversionOrchestrator
 * 
 * Orchestrates the complete character conversion process using a chain of specialized
 * processors. Implements Chain of Responsibility pattern for processing character data.
 * 
 * Based on system-architecture-analysis.md requirements for Service-Driven Architecture
 * with domain separation and comprehensive progress tracking.
 */

import type { CharacterData } from '@/domain/character/services/CharacterFetcher';
import { AbilityScoreProcessor, type ProcessedAbilityScores } from '@/domain/character/services/AbilityScoreProcessor';
import { SpellSlotCalculator, type SpellSlotCalculationResult } from '@/domain/character/services/SpellSlotCalculator';
import { InventoryProcessor, type ProcessedInventory } from '@/domain/character/services/InventoryProcessor';
import { FeatureProcessor, type ProcessedFeatures } from '@/domain/character/services/FeatureProcessor';
import { EncumbranceCalculator, type EncumbranceResult } from '@/domain/character/services/EncumbranceCalculator';
import { LanguageProcessor, type ProcessedLanguages } from '@/domain/character/services/LanguageProcessor';
import { featureFlags } from '@/core/FeatureFlags';
import { errorService, createProcessingError } from '@/shared/errors/ErrorService';
import { type ConversionError as CentralizedError } from '@/shared/errors/ConversionErrors';

export interface ConversionContext {
  originalCharacter: CharacterData;
  currentStep: string;
  progress: number;
  startTime: Date;
  errors: ConversionError[];
  warnings: ConversionWarning[];
  processingOptions: ConversionOptions;
}

export interface ConversionOptions {
  strictValidation: boolean;
  includeDebugInfo: boolean;
  enablePerformanceTracking: boolean;
  skipOptionalProcessing: boolean;
  formatSpecificOptimizations?: string[];
}

export interface ConversionError {
  step: string;
  type: 'validation' | 'processing' | 'data' | 'system';
  message: string;
  details?: any;
  recoverable: boolean;
}

export interface ConversionWarning {
  step: string;
  type: 'data_missing' | 'fallback_used' | 'feature_unsupported';
  message: string;
  impact: 'low' | 'medium' | 'high';
}

export interface ProcessedCharacterData {
  // Core data
  id: number;
  name: string;
  level: number;
  
  // Processed components
  abilities: ProcessedAbilityScores;
  spellSlots: SpellSlotCalculationResult;
  inventory: ProcessedInventory;
  features: ProcessedFeatures;
  languages: ProcessedLanguages;
  encumbrance: EncumbranceResult;
  
  // Metadata
  processing: {
    timestamp: Date;
    totalTime: number;
    steps: ProcessingStep[];
    errors: ConversionError[];
    warnings: ConversionWarning[];
  };
}

export interface ProcessingStep {
  name: string;
  duration: number;
  success: boolean;
  details?: any;
}

export interface ConversionResult {
  success: boolean;
  processedCharacter?: ProcessedCharacterData;
  errors: ConversionError[];
  warnings: ConversionWarning[];
  performance: {
    totalTime: number;
    stepBreakdown: ProcessingStep[];
    memoryUsage?: number;
  };
}

/**
 * Abstract base for character processors in the conversion chain
 */
export abstract class CharacterProcessor {
  protected next?: CharacterProcessor;
  
  setNext(processor: CharacterProcessor): CharacterProcessor {
    this.next = processor;
    return processor;
  }
  
  async process(context: ConversionContext): Promise<ProcessingResult> {
    const stepStartTime = performance.now();
    let result: ProcessingResult;
    
    try {
      result = await this.doProcess(context);
      
      // Track processing step
      const duration = performance.now() - stepStartTime;
      this.trackProcessingStep(context, this.getStepName(), duration, true, result.data);
      
    } catch (error) {
      const duration = performance.now() - stepStartTime;
      this.trackProcessingStep(context, this.getStepName(), duration, false, error);
      
      // Use centralized error handling for processing step errors
      const handledError = await errorService.handleError(error instanceof Error ? error : new Error('Unknown processing error'), {
        step: this.getStepName(),
        component: this.constructor.name,
        characterId: context.originalCharacter.id,
        characterName: context.originalCharacter.name,
        metadata: { 
          processingDuration: duration,
          processingStep: this.getStepName(),
          currentProgress: context.progress
        }
      });
      
      result = ProcessingResult.error(
        this.getStepName(),
        handledError.message,
        handledError.recoverable
      );
    }
    
    // Continue to next processor if successful and chain exists
    if (this.next && result.shouldContinue) {
      const nextResult = await this.next.process(context);
      return result.merge(nextResult);
    }
    
    return result;
  }
  
  protected abstract doProcess(context: ConversionContext): Promise<ProcessingResult>;
  protected abstract getStepName(): string;
  protected abstract isRecoverable(error: any): boolean;
  
  private trackProcessingStep(
    context: ConversionContext, 
    stepName: string, 
    duration: number, 
    success: boolean, 
    details?: any
  ): void {
    // This will be added to the final processed character data
    // Implementation would store in context for later retrieval
  }
}

/**
 * Result object for processing steps
 */
export class ProcessingResult {
  constructor(
    public readonly success: boolean,
    public readonly data?: any,
    public readonly error?: ConversionError,
    public readonly warnings: ConversionWarning[] = [],
    public readonly shouldContinue: boolean = true
  ) {}
  
  static success(data?: any, warnings: ConversionWarning[] = []): ProcessingResult {
    return new ProcessingResult(true, data, undefined, warnings, true);
  }
  
  static error(step: string, message: string, recoverable: boolean = false): ProcessingResult {
    const error: ConversionError = {
      step,
      type: 'processing',
      message,
      recoverable
    };
    return new ProcessingResult(false, undefined, error, [], !recoverable);
  }
  
  static warning(data: any, warning: ConversionWarning): ProcessingResult {
    return new ProcessingResult(true, data, undefined, [warning], true);
  }
  
  merge(other: ProcessingResult): ProcessingResult {
    const combinedData = { ...this.data, ...other.data };
    const combinedWarnings = [...this.warnings, ...other.warnings];
    const success = this.success && other.success;
    const shouldContinue = this.shouldContinue && other.shouldContinue;
    
    // If either has an error, use the first error
    const error = this.error || other.error;
    
    return new ProcessingResult(success, combinedData, error, combinedWarnings, shouldContinue);
  }
}

/**
 * Ability Score Processing Step
 */
class AbilityScoreProcessingStep extends CharacterProcessor {
  private processor: AbilityScoreProcessor;
  
  constructor() {
    super();
    this.processor = new AbilityScoreProcessor();
  }
  
  protected async doProcess(context: ConversionContext): Promise<ProcessingResult> {
    context.currentStep = 'Processing ability scores';
    context.progress = 20;
    
    const validation = AbilityScoreProcessor.validateCharacterData(context.originalCharacter);
    if (!validation.isValid) {
      return ProcessingResult.error(
        'ability_scores', 
        `Ability score validation failed: ${validation.issues.join(', ')}`,
        false
      );
    }
    
    const warnings: ConversionWarning[] = validation.warnings.map(warning => ({
      step: 'ability_scores',
      type: 'data_missing' as const,
      message: warning,
      impact: 'low' as const
    }));
    
    const result = AbilityScoreProcessor.processAbilityScoreBonuses(context.originalCharacter);
    
    return ProcessingResult.success(result.totalScores, warnings);
  }
  
  protected getStepName(): string {
    return 'ability_scores';
  }
  
  protected isRecoverable(error: any): boolean {
    // Ability score processing errors are typically recoverable with defaults
    return true;
  }
}

/**
 * Spell Slot Processing Step
 */
class SpellSlotProcessingStep extends CharacterProcessor {
  private calculator: SpellSlotCalculator;
  
  constructor() {
    super();
    this.calculator = new SpellSlotCalculator();
  }
  
  protected async doProcess(context: ConversionContext): Promise<ProcessingResult> {
    context.currentStep = 'Calculating spell slots';
    context.progress = 40;
    
    // Convert character classes to the format expected by SpellSlotCalculator
    const classes = this.extractCharacterClasses(context.originalCharacter);
    
    if (classes.length === 0) {
      // Non-spellcaster - return empty spell slots
      const emptyResult: SpellSlotCalculationResult = {
        spellSlots: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 },
        pactMagicSlots: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 },
        multiclassCasterLevel: 0,
        totalCasterClasses: 0,
        debugInfo: {
          classBreakdown: [],
          calculationMethod: 'single_class',
          casterLevelCalculation: []
        }
      };
      
      return ProcessingResult.success(emptyResult);
    }
    
    const validation = SpellSlotCalculator.validateClassData(classes);
    if (!validation.isValid) {
      return ProcessingResult.error(
        'spell_slots',
        `Spell slot validation failed: ${validation.errors.join(', ')}`,
        true
      );
    }
    
    const result = this.calculator.calculateSpellSlots(classes, {
      includeDebugInfo: context.processingOptions.includeDebugInfo,
      strictMulticlassRules: context.processingOptions.strictValidation,
      handleSpelllessRanger: true,
      includePactMagicInMainSlots: false
    });
    
    return ProcessingResult.success(result);
  }
  
  private extractCharacterClasses(character: CharacterData): any[] {
    if (!character.classes || !Array.isArray(character.classes)) {
      return [];
    }
    
    return character.classes.map((cls: any) => ({
      id: cls.id || 1,
      level: cls.level || 1,
      classDefinition: {
        id: cls.definition?.id || cls.id || 1,
        name: cls.definition?.name || 'Unknown',
        canCastSpells: cls.definition?.canCastSpells || false
      },
      subclassDefinition: cls.subclassDefinition ? {
        id: cls.subclassDefinition.id,
        name: cls.subclassDefinition.name
      } : undefined
    }));
  }
  
  protected getStepName(): string {
    return 'spell_slots';
  }
  
  protected isRecoverable(error: any): boolean {
    return true; // Can fallback to empty spell slots
  }
}

/**
 * Inventory Processing Step
 */
class InventoryProcessingStep extends CharacterProcessor {
  private processor: InventoryProcessor;
  
  constructor() {
    super();
    this.processor = new InventoryProcessor();
  }
  
  protected async doProcess(context: ConversionContext): Promise<ProcessingResult> {
    context.currentStep = 'Processing inventory and equipment';
    context.progress = 60;
    
    const result = this.processor.processInventory(context.originalCharacter, {
      includeContainers: true,
      calculateWeight: true,
      resolveItemDetails: true,
      groupSimilarItems: false
    });
    
    const warnings: ConversionWarning[] = [];
    if (result.skippedItems.length > 0) {
      warnings.push({
        step: 'inventory',
        type: 'feature_unsupported',
        message: `${result.skippedItems.length} items were skipped due to missing data`,
        impact: 'medium'
      });
    }
    
    return ProcessingResult.success(result, warnings);
  }
  
  protected getStepName(): string {
    return 'inventory';
  }
  
  protected isRecoverable(error: any): boolean {
    return true; // Can continue with empty inventory
  }
}

/**
 * Feature Processing Step
 */
class FeatureProcessingStep extends CharacterProcessor {
  private processor: FeatureProcessor;
  
  constructor() {
    super();
    this.processor = new FeatureProcessor();
  }
  
  protected async doProcess(context: ConversionContext): Promise<ProcessingResult> {
    context.currentStep = 'Processing class features and traits';
    context.progress = 70;
    
    const result = this.processor.processCharacterFeatures(context.originalCharacter, {
      includeSubclassFeatures: true,
      includeRacialTraits: true,
      includeFeats: true,
      includeDescriptions: true,
      filterByLevel: true,
      maxLevel: 20
    });
    
    const warnings: ConversionWarning[] = [];
    
    // Add warnings if any features were excluded or had issues
    if (result.debugInfo.warnings.length > 0) {
      warnings.push({
        step: 'features',
        type: 'feature_unsupported',
        message: `${result.debugInfo.warnings.length} feature processing warnings`,
        impact: 'low'
      });
    }
    
    if (result.totalFeatures === 0) {
      warnings.push({
        step: 'features',
        type: 'data_missing',
        message: 'No features found in character data',
        impact: 'medium'
      });
    }
    
    return ProcessingResult.success({ features: result }, warnings);
  }
  
  protected getStepName(): string {
    return 'features';
  }
  
  protected isRecoverable(error: any): boolean {
    return true; // Can continue without features
  }
}

/**
 * Language Processing Step
 */
class LanguageProcessingStep extends CharacterProcessor {
  private processor: LanguageProcessor;
  
  constructor() {
    super();
    this.processor = new LanguageProcessor();
  }
  
  protected async doProcess(context: ConversionContext): Promise<ProcessingResult> {
    context.currentStep = 'Processing character languages';
    context.progress = 80;
    
    const validation = LanguageProcessor.validateCharacterData(context.originalCharacter);
    if (!validation.isValid) {
      return ProcessingResult.error(
        'languages',
        `Language validation failed: ${validation.issues.join(', ')}`,
        true // Languages are recoverable - can continue with empty list
      );
    }
    
    const warnings: ConversionWarning[] = validation.warnings.map(warning => ({
      step: 'languages',
      type: 'data_missing' as const,
      message: warning,
      impact: 'low' as const
    }));
    
    const result = this.processor.processCharacterLanguages(context.originalCharacter, {
      includeChoicesInOutput: context.processingOptions.includeDebugInfo,
      includeRacialOnly: false
    });
    
    // Add warnings for language choices (these should go to the choices section, not language list)
    if (result.choices.length > 0) {
      warnings.push({
        step: 'languages',
        type: 'feature_unsupported',
        message: `${result.choices.length} language choices found - these will be added to character choices`,
        impact: 'low'
      });
    }
    
    if (result.skipped.length > 0) {
      warnings.push({
        step: 'languages',
        type: 'data_missing',
        message: `${result.skipped.length} languages were skipped (not granted or duplicates)`,
        impact: 'low'
      });
    }
    
    if (result.totalLanguages === 0) {
      warnings.push({
        step: 'languages',
        type: 'data_missing',
        message: 'No languages found - character may not speak any languages',
        impact: 'medium'
      });
    }
    
    return ProcessingResult.success({ languages: result }, warnings);
  }
  
  protected getStepName(): string {
    return 'languages';
  }
  
  protected isRecoverable(error: any): boolean {
    return true; // Can continue without languages
  }
}

/**
 * Main Conversion Orchestrator
 */
export class ConversionOrchestrator {
  private processingChain: CharacterProcessor;
  private encumbranceCalculator: EncumbranceCalculator;
  
  constructor() {
    this.encumbranceCalculator = new EncumbranceCalculator();
    this.buildProcessingChain();
  }
  
  /**
   * Build the processing chain using Chain of Responsibility pattern
   */
  private buildProcessingChain(): void {
    this.processingChain = new AbilityScoreProcessingStep()
      .setNext(new SpellSlotProcessingStep())
      .setNext(new InventoryProcessingStep())
      .setNext(new FeatureProcessingStep())
      .setNext(new LanguageProcessingStep());
  }
  
  /**
   * Process a character through the complete conversion pipeline
   */
  async processCharacter(
    character: CharacterData, 
    options: ConversionOptions = this.getDefaultOptions()
  ): Promise<ConversionResult> {
    
    const startTime = performance.now();
    const context: ConversionContext = {
      originalCharacter: character,
      currentStep: 'Starting conversion',
      progress: 0,
      startTime: new Date(),
      errors: [],
      warnings: [],
      processingOptions: options
    };
    
    if (featureFlags.isEnabled('conversion_orchestrator_debug') || options.includeDebugInfo) {
      console.log('🔄 ConversionOrchestrator: Starting character processing', {
        characterId: character.id,
        characterName: character.name,
        options
      });
    }
    
    try {
      // Run the processing chain
      const processingResult = await this.processingChain.process(context);
      
      if (!processingResult.success) {
        return {
          success: false,
          errors: processingResult.error ? [processingResult.error] : context.errors,
          warnings: [...processingResult.warnings, ...context.warnings],
          performance: {
            totalTime: performance.now() - startTime,
            stepBreakdown: []
          }
        };
      }
      
      // Calculate encumbrance as final step
      context.currentStep = 'Calculating encumbrance';
      context.progress = 90;
      
      const encumbranceResult = this.calculateEncumbrance(character, processingResult.data);
      
      // Build final processed character data
      const processedCharacter: ProcessedCharacterData = {
        id: character.id,
        name: character.name,
        level: this.calculateTotalLevel(character),
        abilities: processingResult.data.abilities || {},
        spellSlots: processingResult.data.spellSlots || {},
        inventory: processingResult.data.inventory || {},
        features: processingResult.data.features || {},
        languages: processingResult.data.languages || { languages: [], choices: [], skipped: [], totalLanguages: 0 },
        encumbrance: encumbranceResult,
        processing: {
          timestamp: new Date(),
          totalTime: performance.now() - startTime,
          steps: [], // Would be populated from context tracking
          errors: context.errors,
          warnings: [...processingResult.warnings, ...context.warnings]
        }
      };
      
      const finalResult: ConversionResult = {
        success: true,
        processedCharacter,
        errors: context.errors,
        warnings: [...processingResult.warnings, ...context.warnings],
        performance: {
          totalTime: performance.now() - startTime,
          stepBreakdown: [] // Would be populated from step tracking
        }
      };
      
      if (featureFlags.isEnabled('conversion_orchestrator_debug') || options.includeDebugInfo) {
        console.log('🔄 ConversionOrchestrator: Processing complete', {
          success: true,
          totalTime: finalResult.performance.totalTime,
          warningCount: finalResult.warnings.length,
          errorCount: finalResult.errors.length
        });
      }
      
      return finalResult;
      
    } catch (error) {
      // Use centralized error handling for orchestrator system errors
      const handledError = await errorService.handleError(error instanceof Error ? error : new Error('Unknown system error'), {
        step: context.currentStep,
        component: 'ConversionOrchestrator',
        characterId: character.id,
        characterName: character.name,
        metadata: { 
          totalTime: performance.now() - startTime,
          processingOptions: options,
          currentProgress: context.progress
        }
      });

      const conversionError: ConversionError = {
        step: context.currentStep,
        type: 'system',
        message: handledError.message,
        details: handledError.technicalDetails,
        recoverable: handledError.recoverable
      };
      
      return {
        success: false,
        errors: [conversionError, ...context.errors],
        warnings: context.warnings,
        performance: {
          totalTime: performance.now() - startTime,
          stepBreakdown: []
        }
      };
    }
  }
  
  /**
   * Calculate character encumbrance
   */
  private calculateEncumbrance(character: CharacterData, processedData: any): EncumbranceResult {
    // Get strength score from processed abilities
    const strengthScore = processedData.abilities?.strength?.total || 10;
    const inventory = processedData.inventory?.items || [];
    
    return this.encumbranceCalculator.calculateEncumbrance({
      strengthScore,
      inventory,
      isSmallCreature: this.isSmallCreature(character)
    }, {
      useVariantRule: false,
      includeArmorPenalties: true,
      roundWeights: true
    });
  }
  
  /**
   * Calculate total character level
   */
  private calculateTotalLevel(character: CharacterData): number {
    if (!character.classes || !Array.isArray(character.classes)) {
      return 1;
    }
    
    return character.classes.reduce((total: number, cls: any) => {
      return total + (cls.level || 1);
    }, 0) || 1;
  }
  
  /**
   * Check if character is small creature (for encumbrance)
   */
  private isSmallCreature(character: CharacterData): boolean {
    const raceName = character.race?.fullName?.toLowerCase() || '';
    const smallRaces = ['halfling', 'gnome', 'goblin', 'kobold'];
    return smallRaces.some(race => raceName.includes(race));
  }
  
  /**
   * Get default processing options
   */
  private getDefaultOptions(): ConversionOptions {
    return {
      strictValidation: true,
      includeDebugInfo: featureFlags.isEnabled('debug_character_processing'),
      enablePerformanceTracking: true,
      skipOptionalProcessing: false,
      formatSpecificOptimizations: []
    };
  }
  
  /**
   * Validate character data before processing
   */
  validateCharacterData(character: CharacterData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!character) {
      errors.push('Character data is null or undefined');
      return { isValid: false, errors };
    }
    
    if (!character.id || typeof character.id !== 'number') {
      errors.push('Character ID is required and must be a number');
    }
    
    if (!character.name || typeof character.name !== 'string' || character.name.trim().length === 0) {
      errors.push('Character name is required');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}