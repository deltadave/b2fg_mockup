/**
 * Validation Integration Layer
 * 
 * Provides real-time validation feedback during character conversion,
 * integrating with the existing character parser and providing seamless
 * validation updates to the UI components.
 */

import { characterValidationEngine, CharacterValidationReport, SectionValidation } from '../../domain/validation/CharacterValidationEngine';
import { DnD5eValidationRules } from '../../domain/validation/DnD5eValidationRules';

export interface ValidationConfig {
  enableRealTimeValidation: boolean;
  validationDelay: number;
  maxValidationRetries: number;
  batchValidationSize: number;
  enablePerformanceMonitoring: boolean;
}

export interface ValidationPerformanceMetrics {
  totalValidationTime: number;
  sectionValidationTimes: Record<string, number>;
  validationCount: number;
  averageValidationTime: number;
  lastValidationTimestamp: Date;
}

export class ValidationIntegrationLayer {
  private config: ValidationConfig;
  private performanceMetrics: ValidationPerformanceMetrics;
  private validationQueue: Map<string, any>;
  private validationTimeouts: Map<string, NodeJS.Timeout>;
  private currentValidationPromise: Promise<void> | null;
  
  constructor(config: Partial<ValidationConfig> = {}) {
    this.config = {
      enableRealTimeValidation: true,
      validationDelay: 300, // ms
      maxValidationRetries: 3,
      batchValidationSize: 5,
      enablePerformanceMonitoring: true,
      ...config
    };
    
    this.performanceMetrics = {
      totalValidationTime: 0,
      sectionValidationTimes: {},
      validationCount: 0,
      averageValidationTime: 0,
      lastValidationTimestamp: new Date()
    };
    
    this.validationQueue = new Map();
    this.validationTimeouts = new Map();
    this.currentValidationPromise = null;
    
    this.initializeValidationRules();
    this.setupEventListeners();
  }

  /**
   * Initialize comprehensive D&D 5e validation rules
   */
  private initializeValidationRules(): void {
    console.log('Initializing D&D 5e validation rules...');
    
    // Register all D&D 5e validation rules with the engine
    Object.entries(DnD5eValidationRules).forEach(([sectionId, rules]) => {
      rules.forEach(rule => {
        characterValidationEngine.addValidationRule(sectionId, rule);
      });
    });
    
    console.log('D&D 5e validation rules initialized');
  }

  /**
   * Setup event listeners for character conversion events
   */
  private setupEventListeners(): void {
    // Listen for character data parsing events from the legacy parser
    window.addEventListener('characterDataParsed', (event: CustomEvent) => {
      if (this.config.enableRealTimeValidation) {
        this.scheduleFullValidation(event.detail.characterData, event.detail.sourceData);
      }
    });

    // Listen for section-specific parsing completion
    window.addEventListener('characterSectionParsed', (event: CustomEvent) => {
      if (this.config.enableRealTimeValidation) {
        this.scheduleSectionValidation(event.detail.sectionId, event.detail.sectionData);
      }
    });

    // Listen for character conversion completion
    window.addEventListener('characterConversionComplete', (event: CustomEvent) => {
      this.scheduleFullValidation(event.detail.characterData, event.detail.sourceData);
    });

    // Listen for parsing errors
    window.addEventListener('characterConversionError', (event: CustomEvent) => {
      console.warn('Character conversion error, clearing validation state');
      this.clearValidationState();
    });
  }

  /**
   * Schedule full character validation with debouncing
   */
  private scheduleFullValidation(characterData: any, sourceData?: any): void {
    const validationId = 'full-character';
    
    // Clear existing timeout
    if (this.validationTimeouts.has(validationId)) {
      clearTimeout(this.validationTimeouts.get(validationId)!);
    }
    
    // Update validation queue
    this.validationQueue.set(validationId, { characterData, sourceData });
    
    // Schedule validation
    const timeout = setTimeout(async () => {
      await this.performFullValidation(characterData, sourceData);
      this.validationTimeouts.delete(validationId);
    }, this.config.validationDelay);
    
    this.validationTimeouts.set(validationId, timeout);
  }

  /**
   * Schedule section-specific validation with debouncing
   */
  private scheduleSectionValidation(sectionId: string, sectionData: any): void {
    // Clear existing timeout for this section
    if (this.validationTimeouts.has(sectionId)) {
      clearTimeout(this.validationTimeouts.get(sectionId)!);
    }
    
    // Update validation queue
    this.validationQueue.set(sectionId, sectionData);
    
    // Schedule validation
    const timeout = setTimeout(async () => {
      await this.performSectionValidation(sectionId, sectionData);
      this.validationTimeouts.delete(sectionId);
    }, this.config.validationDelay);
    
    this.validationTimeouts.set(sectionId, timeout);
  }

  /**
   * Perform full character validation
   */
  private async performFullValidation(characterData: any, sourceData?: any): Promise<void> {
    if (this.currentValidationPromise) {
      await this.currentValidationPromise;
    }
    
    this.currentValidationPromise = this.executeFullValidation(characterData, sourceData);
    await this.currentValidationPromise;
    this.currentValidationPromise = null;
  }

  /**
   * Execute full character validation with performance monitoring
   */
  private async executeFullValidation(characterData: any, sourceData?: any): Promise<void> {
    const startTime = performance.now();
    
    try {
      console.log('Starting full character validation...');
      
      // Dispatch validation start event
      window.dispatchEvent(new CustomEvent('validationStarted', {
        detail: { type: 'full', characterName: characterData?.name }
      }));
      
      // Perform validation
      const validationReport = await characterValidationEngine.validateCharacter(
        characterData, 
        sourceData
      );
      
      // Update performance metrics
      if (this.config.enablePerformanceMonitoring) {
        this.updatePerformanceMetrics('full', startTime);
      }
      
      // Dispatch validation complete event
      window.dispatchEvent(new CustomEvent('characterValidationComplete', {
        detail: { 
          report: validationReport, 
          characterData, 
          sourceData,
          performanceMetrics: this.getPerformanceMetrics()
        }
      }));
      
      console.log('Full character validation completed:', {
        accuracy: validationReport.overallAccuracy,
        status: validationReport.overallStatus,
        sections: validationReport.sections.length,
        duration: performance.now() - startTime
      });
      
    } catch (error) {
      console.error('Full character validation failed:', error);
      
      // Dispatch validation error event
      window.dispatchEvent(new CustomEvent('validationError', {
        detail: { 
          type: 'full', 
          error: error instanceof Error ? error.message : 'Unknown error',
          characterData 
        }
      }));
    }
  }

  /**
   * Perform section-specific validation
   */
  private async performSectionValidation(sectionId: string, sectionData: any): Promise<void> {
    const startTime = performance.now();
    
    try {
      console.log(`Starting section validation for: ${sectionId}`);
      
      // Get current character data from the validation queue
      const fullCharacterData = this.validationQueue.get('full-character');
      const sourceData = fullCharacterData?.sourceData;
      
      // Perform section validation
      const sectionValidation = await characterValidationEngine.validateSectionRealtime(
        sectionId,
        sectionData,
        sourceData
      );
      
      // Update performance metrics
      if (this.config.enablePerformanceMonitoring) {
        this.updateSectionPerformanceMetrics(sectionId, startTime);
      }
      
      // Dispatch section validation update event
      window.dispatchEvent(new CustomEvent('sectionValidationUpdate', {
        detail: { 
          sectionId, 
          validation: sectionValidation,
          sectionData,
          duration: performance.now() - startTime
        }
      }));
      
      console.log(`Section validation completed for ${sectionId}:`, {
        accuracy: sectionValidation.overallAccuracy,
        status: sectionValidation.status,
        duration: performance.now() - startTime
      });
      
    } catch (error) {
      console.error(`Section validation failed for ${sectionId}:`, error);
      
      // Dispatch section validation error event
      window.dispatchEvent(new CustomEvent('sectionValidationError', {
        detail: { 
          sectionId, 
          error: error instanceof Error ? error.message : 'Unknown error',
          sectionData 
        }
      }));
    }
  }

  /**
   * Update performance metrics for full validation
   */
  private updatePerformanceMetrics(validationType: string, startTime: number): void {
    const duration = performance.now() - startTime;
    
    this.performanceMetrics.totalValidationTime += duration;
    this.performanceMetrics.validationCount++;
    this.performanceMetrics.averageValidationTime = 
      this.performanceMetrics.totalValidationTime / this.performanceMetrics.validationCount;
    this.performanceMetrics.lastValidationTimestamp = new Date();
  }

  /**
   * Update performance metrics for section validation
   */
  private updateSectionPerformanceMetrics(sectionId: string, startTime: number): void {
    const duration = performance.now() - startTime;
    
    if (!this.performanceMetrics.sectionValidationTimes[sectionId]) {
      this.performanceMetrics.sectionValidationTimes[sectionId] = 0;
    }
    
    this.performanceMetrics.sectionValidationTimes[sectionId] += duration;
  }

  /**
   * Clear all validation state and timeouts
   */
  private clearValidationState(): void {
    // Clear all timeouts
    this.validationTimeouts.forEach(timeout => clearTimeout(timeout));
    this.validationTimeouts.clear();
    
    // Clear validation queue
    this.validationQueue.clear();
    
    // Cancel current validation
    this.currentValidationPromise = null;
    
    console.log('Validation state cleared');
  }

  /**
   * Get current performance metrics
   */
  public getPerformanceMetrics(): ValidationPerformanceMetrics {
    return { ...this.performanceMetrics };
  }

  /**
   * Update validation configuration
   */
  public updateConfig(newConfig: Partial<ValidationConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('Validation configuration updated:', this.config);
  }

  /**
   * Manual validation trigger for testing/debugging
   */
  public async triggerManualValidation(characterData: any, sourceData?: any): Promise<CharacterValidationReport> {
    console.log('Manual validation triggered');
    return await characterValidationEngine.validateCharacter(characterData, sourceData);
  }

  /**
   * Get validation queue status for debugging
   */
  public getValidationStatus(): any {
    return {
      config: this.config,
      queueSize: this.validationQueue.size,
      activeTimeouts: this.validationTimeouts.size,
      performanceMetrics: this.performanceMetrics,
      isValidating: this.currentValidationPromise !== null
    };
  }

  /**
   * Enable/disable real-time validation
   */
  public setRealTimeValidation(enabled: boolean): void {
    this.config.enableRealTimeValidation = enabled;
    
    if (!enabled) {
      this.clearValidationState();
    }
    
    console.log(`Real-time validation ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Reset performance metrics
   */
  public resetPerformanceMetrics(): void {
    this.performanceMetrics = {
      totalValidationTime: 0,
      sectionValidationTimes: {},
      validationCount: 0,
      averageValidationTime: 0,
      lastValidationTimestamp: new Date()
    };
    
    console.log('Performance metrics reset');
  }
}

/**
 * Integration with legacy character parser
 * This provides hooks for the existing characterParser.js to trigger validation events
 */
export class LegacyParserIntegration {
  private validationLayer: ValidationIntegrationLayer;
  
  constructor(validationLayer: ValidationIntegrationLayer) {
    this.validationLayer = validationLayer;
    this.injectValidationHooks();
  }

  /**
   * Inject validation hooks into the legacy parser
   */
  private injectValidationHooks(): void {
    // Hook into the global parseCharacter function if it exists
    if (typeof window !== 'undefined' && (window as any).parseCharacter) {
      this.wrapParseCharacterFunction();
    }
    
    // Monitor for dynamic script loading of character parser
    this.monitorLegacyParserLoading();
  }

  /**
   * Wrap the legacy parseCharacter function to add validation triggers
   */
  private wrapParseCharacterFunction(): void {
    const originalParseCharacter = (window as any).parseCharacter;
    
    (window as any).parseCharacter = (inputChar: any) => {
      console.log('Legacy parseCharacter called, triggering validation...');
      
      // Call original function
      const result = originalParseCharacter.call(this, inputChar);
      
      // Extract character data from the input
      let characterData = inputChar;
      if (inputChar.data && inputChar.success) {
        characterData = inputChar.data;
      }
      
      // Trigger validation with delay to allow parsing to complete
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('characterDataParsed', {
          detail: { characterData, sourceData: inputChar }
        }));
      }, 100);
      
      return result;
    };
    
    console.log('Legacy parseCharacter function wrapped with validation hooks');
  }

  /**
   * Monitor for legacy parser loading and hook when available
   */
  private monitorLegacyParserLoading(): void {
    const checkForParser = () => {
      if (typeof window !== 'undefined' && (window as any).parseCharacter && 
          !(window as any).parseCharacterValidationHooked) {
        this.wrapParseCharacterFunction();
        (window as any).parseCharacterValidationHooked = true;
      }
    };
    
    // Check periodically for parser availability
    const interval = setInterval(() => {
      checkForParser();
      if ((window as any).parseCharacterValidationHooked) {
        clearInterval(interval);
      }
    }, 1000);
    
    // Stop checking after 30 seconds
    setTimeout(() => {
      clearInterval(interval);
    }, 30000);
  }

  /**
   * Manual hook for character parsing completion
   */
  public notifyCharacterParsed(characterData: any, sourceData?: any): void {
    window.dispatchEvent(new CustomEvent('characterDataParsed', {
      detail: { characterData, sourceData }
    }));
  }

  /**
   * Manual hook for section parsing completion
   */
  public notifySectionParsed(sectionId: string, sectionData: any): void {
    window.dispatchEvent(new CustomEvent('characterSectionParsed', {
      detail: { sectionId, sectionData }
    }));
  }

  /**
   * Manual hook for conversion completion
   */
  public notifyConversionComplete(characterData: any, sourceData?: any): void {
    window.dispatchEvent(new CustomEvent('characterConversionComplete', {
      detail: { characterData, sourceData }
    }));
  }
}

// Global instance for use throughout the application
export let validationIntegrationLayer: ValidationIntegrationLayer;
export let legacyParserIntegration: LegacyParserIntegration;

/**
 * Initialize validation integration
 */
export function initializeValidationIntegration(config: Partial<ValidationConfig> = {}): void {
  console.log('Initializing validation integration layer...');
  
  validationIntegrationLayer = new ValidationIntegrationLayer(config);
  legacyParserIntegration = new LegacyParserIntegration(validationIntegrationLayer);
  
  // Make available globally for debugging
  if (typeof window !== 'undefined') {
    (window as any).validationIntegrationLayer = validationIntegrationLayer;
    (window as any).legacyParserIntegration = legacyParserIntegration;
  }
  
  console.log('Validation integration layer initialized');
}

// Auto-initialize if in browser environment
if (typeof window !== 'undefined') {
  // Initialize after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => initializeValidationIntegration());
  } else {
    initializeValidationIntegration();
  }
}