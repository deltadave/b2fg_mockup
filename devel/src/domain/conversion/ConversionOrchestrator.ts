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
import { SpellDataExtractor, type SpellProcessingResult } from '@/domain/character/services/SpellDataExtractor';
import { SpellDeduplicator } from '@/domain/character/services/SpellDeduplicator';
import { SpellValidator } from '@/domain/character/services/SpellValidator';
import { featureFlags } from '@/core/FeatureFlags';
import { errorService, createProcessingError } from '@/shared/errors/ErrorService';
import { type ConversionError as CentralizedError } from '@/shared/errors/ConversionErrors';
import { SafeAccess } from '@/shared/utils/SafeAccess';

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
  
  // Original character data (needed by formatters)
  characterData: CharacterData;
  
  // Processed components
  abilities: ProcessedAbilityScores;
  spellSlots: SpellSlotCalculationResult;
  spells: SpellProcessingResult;
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
      if (featureFlags.isEnabled('conversion_orchestrator_debug')) {
        console.log(`🔗 CharacterProcessor.process(): Starting step ${this.getStepName()}`);
      }
      
      result = await this.doProcess(context);
      
      if (featureFlags.isEnabled('conversion_orchestrator_debug')) {
        console.log(`🔗 CharacterProcessor.process(): Completed step ${this.getStepName()}`, {
          success: result.success,
          hasData: !!result.data,
          shouldContinue: result.shouldContinue
        });
      }
      
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
    
    if (featureFlags.isEnabled('conversion_orchestrator_debug')) {
      console.log('🔄 ProcessingResult.merge() debug', {
        thisData: this.data ? Object.keys(this.data) : 'no data',
        otherData: other.data ? Object.keys(other.data) : 'no data',
        combinedData: combinedData ? Object.keys(combinedData) : 'no combined data',
        hasInventoryInThis: !!this.data?.inventory,
        hasInventoryInOther: !!other.data?.inventory,
        hasInventoryInCombined: !!combinedData?.inventory
      });
    }
    
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
    
    if (featureFlags.isEnabled('conversion_orchestrator_debug')) {
      console.log('🎯 AbilityScoreProcessingStep: Starting ability score processing');
    }
    
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
    
    return ProcessingResult.success({ abilities: result.totalScores }, warnings);
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
    
    if (featureFlags.isEnabled('conversion_orchestrator_debug')) {
      console.log('✨ SpellSlotProcessingStep: Starting enhanced spell slot calculation');
    }
    
    try {
      // Use enhanced D&D Beyond parsing directly
      const rawClasses = SafeAccess.get(context.originalCharacter, 'classes', []) as any[];
      
      if (rawClasses.length === 0) {
        if (featureFlags.isEnabled('conversion_orchestrator_debug')) {
          console.log('✨ SpellSlotProcessingStep: No classes found, returning empty spell slots');
        }
        
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
        
        return ProcessingResult.success({ spellSlots: emptyResult });
      }

      // Use the enhanced D&D Beyond parsing method
      const result = this.calculator.calculateFromDnDBeyond(rawClasses, {
        includeDebugInfo: context.processingOptions.includeDebugInfo,
        strictMulticlassRules: context.processingOptions.strictValidation,
        handleSpelllessRanger: true,
        includePactMagicInMainSlots: false
      });

      if (featureFlags.isEnabled('conversion_orchestrator_debug')) {
        console.log('✨ SpellSlotProcessingStep: Spell slot calculation complete', {
          characterId: context.originalCharacter.id,
          multiclassCasterLevel: result.multiclassCasterLevel,
          totalCasterClasses: result.totalCasterClasses,
          calculationMethod: result.debugInfo.calculationMethod,
          hasRegularSpells: Object.values(result.spellSlots).some(count => count > 0),
          hasPactMagic: Object.values(result.pactMagicSlots).some(count => count > 0)
        });
      }

      // Collect any warnings from the calculation
      const warnings: ConversionWarning[] = [];
      if (result.debugInfo.classBreakdown.some(cb => cb.casterType === 'none' && cb.className !== 'unknown')) {
        warnings.push({
          step: 'spell_slots',
          type: 'feature_unsupported',
          message: `Some classes may not have spell slot calculations: ${result.debugInfo.classBreakdown.filter(cb => cb.casterType === 'none').map(cb => cb.className).join(', ')}`,
          impact: 'low'
        });
      }

      return ProcessingResult.success({ spellSlots: result }, warnings);

    } catch (error) {
      console.error('❌ SpellSlotProcessingStep: Spell slot calculation failed:', error);
      
      return ProcessingResult.error(
        'spell_slots',
        `Spell slot calculation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        this.isRecoverable(error)
      );
    }
  }
  
  // Note: extractCharacterClasses removed - now using direct D&D Beyond parsing via calculateFromDnDBeyond
  
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
    
    if (featureFlags.isEnabled('conversion_orchestrator_debug')) {
      console.log('📦 InventoryProcessingStep: Starting inventory processing');
    }
    
    // Extract inventory from character data
    const rawInventory = SafeAccess.get(context.originalCharacter, 'inventory', []) as any[];
    
    if (featureFlags.isEnabled('conversion_orchestrator_debug')) {
      console.log('📦 InventoryProcessingStep: Processing character inventory', {
        characterId: context.originalCharacter.id,
        inventoryItemCount: rawInventory.length,
        sampleInventoryItem: rawInventory[0] ? { id: rawInventory[0].id, name: rawInventory[0].definition?.name } : null
      });
    }
    
    // Use the new orchestrator-compatible method
    const result = this.processor.processInventoryForOrchestrator(
      rawInventory,
      context.originalCharacter.id,
      context.originalCharacter
    );
    
    const warnings: ConversionWarning[] = [];
    
    // Add warnings from inventory processing
    if (result.processing.warnings.length > 0) {
      warnings.push({
        step: 'inventory',
        type: 'feature_unsupported',
        message: `${result.processing.warnings.length} inventory processing warnings`,
        impact: 'low'
      });
    }
    
    if (result.processing.itemsSkipped > 0) {
      warnings.push({
        step: 'inventory',
        type: 'data_missing',
        message: `${result.processing.itemsSkipped} items were skipped`,
        impact: 'medium'
      });
    }
    
    if (result.processing.errors.length > 0) {
      warnings.push({
        step: 'inventory',
        type: 'data_missing',
        message: `${result.processing.errors.length} inventory processing errors occurred`,
        impact: 'high'
      });
    }
    
    if (featureFlags.isEnabled('conversion_orchestrator_debug')) {
      console.log('📦 InventoryProcessingStep: Inventory processing complete', {
        itemsProcessed: result.processing.itemsProcessed,
        itemsSkipped: result.processing.itemsSkipped,
        totalItems: result.statistics.totalItems,
        containers: result.statistics.containerCount,
        warnings: warnings.length,
        resultStructure: {
          hasItems: !!result.items,
          itemsLength: result.items?.length || 0,
          hasContainers: !!result.containers,
          containersLength: result.containers?.length || 0
        }
      });
    }
    
    const returnData = { inventory: result };
    
    if (featureFlags.isEnabled('conversion_orchestrator_debug')) {
      console.log('📦 InventoryProcessingStep: Returning data', {
        returnDataKeys: Object.keys(returnData),
        inventoryInReturnData: !!returnData.inventory,
        inventoryItemsCount: returnData.inventory?.items?.length || 0
      });
    }
    
    return ProcessingResult.success(returnData, warnings);
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
 * Spell Processing Step
 */
class SpellProcessingStep extends CharacterProcessor {
  private extractor: SpellDataExtractor;
  private validator: SpellValidator;
  private deduplicator: SpellDeduplicator;
  
  constructor() {
    super();
    this.extractor = new SpellDataExtractor();
    this.validator = new SpellValidator();
    this.deduplicator = new SpellDeduplicator();
  }
  
  protected async doProcess(context: ConversionContext): Promise<ProcessingResult> {
    context.currentStep = 'Processing character spells';
    context.progress = 75;
    
    if (featureFlags.isEnabled('conversion_orchestrator_debug')) {
      console.log('✨ SpellProcessingStep: Starting spell processing');
    }
    
    try {
      // Extract spells from D&D Beyond data
      const extractionResult = await this.extractor.extractSpells(
        context.originalCharacter,
        {
          strictValidation: context.processingOptions.strictValidation,
          includeDebugInfo: context.processingOptions.includeDebugInfo,
          validateSpells: true,
          deduplicateSpells: true
        }
      );
      
      if (!extractionResult.success) {
        if (featureFlags.isEnabled('conversion_orchestrator_debug')) {
          console.log('✨ SpellProcessingStep: Spell extraction failed', extractionResult.errors);
        }
        
        return ProcessingResult.error(
          'spells',
          `Spell extraction failed: ${extractionResult.errors.map(e => e.message).join(', ')}`,
          true // Spell processing failures are recoverable
        );
      }
      
      // Process warnings from extraction
      const warnings: ConversionWarning[] = [];
      
      if (extractionResult.warnings.length > 0) {
        warnings.push({
          step: 'spells',
          type: 'data_missing',
          message: `${extractionResult.warnings.length} spell extraction warnings`,
          impact: 'low'
        });
      }
      
      if (extractionResult.spells.length === 0) {
        warnings.push({
          step: 'spells',
          type: 'data_missing',
          message: 'No spells found in character data',
          impact: 'low'
        });
      }
      
      if (extractionResult.duplicatesRemoved > 0) {
        warnings.push({
          step: 'spells',
          type: 'feature_unsupported',
          message: `${extractionResult.duplicatesRemoved} duplicate spells were automatically merged`,
          impact: 'low'
        });
      }
      
      if (featureFlags.isEnabled('conversion_orchestrator_debug')) {
        console.log('✨ SpellProcessingStep: Spell processing complete', {
          characterId: context.originalCharacter.id,
          totalSpells: extractionResult.spells.length,
          duplicatesRemoved: extractionResult.duplicatesRemoved,
          validationErrors: extractionResult.validationResults.filter(r => !r.isValid).length,
          warnings: warnings.length
        });
      }
      
      return ProcessingResult.success({ spells: extractionResult }, warnings);
      
    } catch (error) {
      console.error('❌ SpellProcessingStep: Spell processing failed:', error);
      
      return ProcessingResult.error(
        'spells',
        `Spell processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        this.isRecoverable(error)
      );
    }
  }
  
  protected getStepName(): string {
    return 'spells';
  }
  
  protected isRecoverable(error: any): boolean {
    return true; // Can continue without spells
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
    const abilityStep = new AbilityScoreProcessingStep();
    const spellSlotStep = new SpellSlotProcessingStep();
    const spellStep = new SpellProcessingStep();
    const inventoryStep = new InventoryProcessingStep();
    const featureStep = new FeatureProcessingStep();
    const languageStep = new LanguageProcessingStep();
    
    abilityStep.setNext(spellSlotStep);
    spellSlotStep.setNext(spellStep);
    spellStep.setNext(inventoryStep);
    inventoryStep.setNext(languageStep); // Skip features for now
    // featureStep.setNext(languageStep);
    
    this.processingChain = abilityStep;
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
      if (featureFlags.isEnabled('conversion_orchestrator_debug')) {
        console.log('🔗 ConversionOrchestrator: Starting processing chain...');
      }
      
      const processingResult = await this.processingChain.process(context);
      
      if (featureFlags.isEnabled('conversion_orchestrator_debug')) {
        console.log('🔗 ConversionOrchestrator: Processing chain result', {
          success: processingResult.success,
          hasData: !!processingResult.data,
          inventoryInData: !!processingResult.data?.inventory,
          contextErrors: context.errors.length,
          contextWarnings: context.warnings.length
        });
      }
      
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
      
      // Calculate encumbrance (temporarily simplified to debug inventory)
      const encumbranceResult: EncumbranceResult = {
        totalWeight: processingResult.data.inventory?.encumbrance?.totalWeight || 0,
        carryingCapacity: processingResult.data.inventory?.encumbrance?.carryingCapacity || 150,
        encumbranceLevel: processingResult.data.inventory?.encumbrance?.encumbranceLevel || 'unencumbered',
        speedPenalty: 0,
        disadvantageOnChecks: false
      };
      
      // Build final processed character data
      const processedCharacter: ProcessedCharacterData = {
        id: character.id,
        name: character.name,
        level: this.calculateTotalLevel(character),
        characterData: character, // Include original character data for formatters
        abilities: processingResult.data.abilities || {},
        spellSlots: processingResult.data.spellSlots || {},
        spells: processingResult.data.spells || { success: true, spells: [], validationResults: [], warnings: [], errors: [], duplicatesRemoved: 0, performance: { extractionTime: 0, validationTime: 0, deduplicationTime: 0, totalTime: 0 } },
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
    
    // Handle the new ProcessedInventory structure
    const inventory = Array.isArray(processedData.inventory?.items) 
      ? processedData.inventory.items 
      : [];
    
    if (featureFlags.isEnabled('conversion_orchestrator_debug')) {
      console.log('🏋️ ConversionOrchestrator: Calculating encumbrance', {
        strengthScore,
        inventoryItemCount: inventory.length,
        inventoryStructure: typeof processedData.inventory
      });
    }
    
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