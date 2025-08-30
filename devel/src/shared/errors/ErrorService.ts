/**
 * Central Error Service
 * 
 * Main orchestrator for error handling in the D&D Beyond Character Converter.
 * Provides unified error management, classification, recovery, and reporting
 * capabilities following the centralized service architecture pattern.
 */

import { 
  ConversionError, 
  ErrorCategory, 
  ErrorSeverity, 
  ErrorTemplates,
  ErrorContext,
  ErrorReport,
  ErrorStatistics,
  ErrorUtils,
  ConversionErrorBuilder
} from './ConversionErrors';
import { ErrorClassifier, ClassificationResult } from './ErrorClassifier';
import { RecoveryStrategies, RecoveryResult } from './RecoveryStrategies';
import { featureFlags } from '@/core/FeatureFlags';

/**
 * Error service configuration
 */
export interface ErrorServiceConfig {
  enableAutomaticRecovery: boolean;
  maxRecoveryAttempts: number;
  errorReportingEnabled: boolean;
  debugMode: boolean;
  retryDelayMultiplier: number;
  maxRetryDelay: number;
}

/**
 * Error event listener for reactive error handling
 */
export type ErrorEventListener = (error: ConversionError, context: ErrorContext) => void;

/**
 * Error service events
 */
export enum ErrorServiceEvent {
  ERROR_OCCURRED = 'error_occurred',
  ERROR_RECOVERED = 'error_recovered',
  ERROR_ESCALATED = 'error_escalated',
  RECOVERY_ATTEMPTED = 'recovery_attempted',
  RECOVERY_SUCCEEDED = 'recovery_succeeded',
  RECOVERY_FAILED = 'recovery_failed'
}

/**
 * Main Error Service class
 */
export class ErrorService {
  private static instance: ErrorService;
  private config: ErrorServiceConfig;
  private eventListeners: Map<ErrorServiceEvent, ErrorEventListener[]>;
  private errorHistory: ConversionError[];
  private errorReports: ErrorReport[];
  private readonly MAX_HISTORY_SIZE = 500;

  private constructor(config: Partial<ErrorServiceConfig> = {}) {
    this.config = {
      enableAutomaticRecovery: true,
      maxRecoveryAttempts: 3,
      errorReportingEnabled: true,
      debugMode: featureFlags.isEnabled('error_service_debug'),
      retryDelayMultiplier: 2,
      maxRetryDelay: 30000,
      ...config
    };
    
    this.eventListeners = new Map();
    this.errorHistory = [];
    this.errorReports = [];
    
    this.initialize();
  }

  /**
   * Get singleton instance
   */
  static getInstance(config?: Partial<ErrorServiceConfig>): ErrorService {
    if (!ErrorService.instance) {
      ErrorService.instance = new ErrorService(config);
    }
    return ErrorService.instance;
  }

  /**
   * Initialize the error service
   */
  private initialize(): void {
    // Initialize recovery strategies
    RecoveryStrategies.initialize();
    
    // Set up global error handlers
    this.setupGlobalErrorHandlers();
    
    if (this.config.debugMode) {
      console.log('⚡ ErrorService: Initialized with config:', this.config);
    }
  }

  /**
   * Handle an error with full processing pipeline
   */
  async handleError(
    error: Error | ConversionError,
    context: {
      step: string;
      component: string;
      characterId?: string;
      characterName?: string;
      httpStatus?: number;
      metadata?: Record<string, any>;
    }
  ): Promise<ConversionError> {
    
    const startTime = Date.now();
    
    if (this.config.debugMode) {
      console.log('⚡ ErrorService: Handling error:', {
        errorType: error.constructor.name,
        step: context.step,
        component: context.component
      });
    }

    // Step 1: Create or classify the error
    let conversionError: ConversionError;
    
    // Check if it's already a ConversionError (duck typing)
    if (error && typeof error === 'object' && 'code' in error && 'severity' in error) {
      conversionError = error as ConversionError;
    } else {
      // Classify and convert generic Error to ConversionError
      conversionError = ErrorClassifier.createClassifiedError(error as Error, context);
    }

    // Step 2: Create error context
    const errorContext = {
      characterId: context.characterId,
      characterName: context.characterName
    };
    
    if (context.metadata) {
      errorContext.metadata = context.metadata;
    }

    // Step 3: Add to error history
    this.addToHistory(conversionError);

    // Step 4: Emit error occurred event
    this.emitEvent(ErrorServiceEvent.ERROR_OCCURRED, conversionError, errorContext);

    // Step 5: Attempt automatic recovery if enabled
    if (this.config.enableAutomaticRecovery && ErrorUtils.isUserActionable(conversionError)) {
      try {
        const recoveryResults = await this.attemptRecovery(conversionError, errorContext);
        
        // Check if any recovery was successful
        const successfulRecovery = recoveryResults.find(result => result.success);
        if (successfulRecovery) {
          this.emitEvent(ErrorServiceEvent.ERROR_RECOVERED, conversionError, errorContext);
          
          // Create recovery report
          this.createErrorReport(conversionError, errorContext, true, successfulRecovery.action);
          
          if (this.config.debugMode) {
            console.log('⚡ ErrorService: Error recovered successfully:', {
              errorId: conversionError.id,
              recoveryAction: successfulRecovery.action
            });
          }
          
          return conversionError;
        }
        
        // If automatic recovery failed, escalate
        this.emitEvent(ErrorServiceEvent.ERROR_ESCALATED, conversionError, errorContext);
        
      } catch (recoveryError) {
        if (this.config.debugMode) {
          console.warn('⚡ ErrorService: Recovery attempt failed:', recoveryError);
        }
      }
    }

    // Step 6: Create error report for monitoring
    this.createErrorReport(conversionError, errorContext, false);

    // Step 7: Log performance metrics
    const processingTime = Date.now() - startTime;
    if (this.config.debugMode) {
      console.log('⚡ ErrorService: Error handling complete:', {
        errorId: conversionError.id,
        processingTime: `${processingTime}ms`,
        category: conversionError.category,
        severity: conversionError.severity
      });
    }

    return conversionError;
  }

  /**
   * Handle multiple errors (batch processing)
   */
  async handleErrors(
    errors: Array<{ error: Error | ConversionError; context: any }>,
    options: { failFast?: boolean; maxConcurrent?: number } = {}
  ): Promise<ConversionError[]> {
    
    const { failFast = false, maxConcurrent = 5 } = options;
    const results: ConversionError[] = [];
    const batches = this.createBatches(errors, maxConcurrent);

    if (this.config.debugMode) {
      console.log('⚡ ErrorService: Handling batch errors:', {
        totalErrors: errors.length,
        batchCount: batches.length,
        failFast,
        maxConcurrent
      });
    }

    for (const batch of batches) {
      try {
        const batchResults = await Promise.all(
          batch.map(({ error, context }) => this.handleError(error, context))
        );
        
        results.push(...batchResults);
        
        // If fail fast is enabled and we have critical errors, stop processing
        if (failFast) {
          const criticalErrors = batchResults.filter(e => e.severity === ErrorSeverity.CRITICAL);
          if (criticalErrors.length > 0) {
            if (this.config.debugMode) {
              console.log('⚡ ErrorService: Stopping batch processing due to critical errors');
            }
            break;
          }
        }
        
      } catch (batchError) {
        if (this.config.debugMode) {
          console.warn('⚡ ErrorService: Batch processing error:', batchError);
        }
        
        if (failFast) {
          throw batchError;
        }
      }
    }

    return results;
  }

  /**
   * Attempt error recovery
   */
  async attemptRecovery(
    error: ConversionError,
    context: ErrorContext,
    preferredActions?: string[]
  ): Promise<RecoveryResult[]> {
    
    this.emitEvent(ErrorServiceEvent.RECOVERY_ATTEMPTED, error, context);
    
    const recoveryResults = await RecoveryStrategies.attemptRecovery(
      error,
      context,
      preferredActions as any[]
    );
    
    // Emit events based on results
    const hasSuccessfulRecovery = recoveryResults.some(result => result.success);
    
    if (hasSuccessfulRecovery) {
      this.emitEvent(ErrorServiceEvent.RECOVERY_SUCCEEDED, error, context);
    } else {
      this.emitEvent(ErrorServiceEvent.RECOVERY_FAILED, error, context);
    }

    return recoveryResults;
  }

  /**
   * Get error statistics
   */
  getErrorStatistics(): ErrorStatistics {
    const totalErrors = this.errorHistory.length;
    const errorsByCategory: Record<ErrorCategory, number> = {} as any;
    const errorsBySeverity: Record<ErrorSeverity, number> = {} as any;
    const errorCounts: Record<string, number> = {};

    // Initialize counters
    Object.values(ErrorCategory).forEach(category => {
      errorsByCategory[category] = 0;
    });
    
    Object.values(ErrorSeverity).forEach(severity => {
      errorsBySeverity[severity] = 0;
    });

    // Count errors
    this.errorHistory.forEach(error => {
      errorsByCategory[error.category]++;
      errorsBySeverity[error.severity]++;
      errorCounts[error.code] = (errorCounts[error.code] || 0) + 1;
    });

    // Get most common errors
    const mostCommonErrors = Object.entries(errorCounts)
      .map(([code, count]) => ({ code, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Calculate recovery rates
    const resolvedReports = this.errorReports.filter(report => report.resolved);
    const recoverySuccessRate = this.errorReports.length > 0 
      ? resolvedReports.length / this.errorReports.length 
      : 0;

    return {
      totalErrors,
      errorsByCategory,
      errorsBySeverity,
      mostCommonErrors,
      recoverySuccessRate,
      retrySuccessRate: recoverySuccessRate // Simplified - could be more specific
    };
  }

  /**
   * Get recent errors
   */
  getRecentErrors(limit: number = 50): ConversionError[] {
    return this.errorHistory.slice(-limit).reverse();
  }

  /**
   * Get error by ID
   */
  getErrorById(errorId: string): ConversionError | undefined {
    return this.errorHistory.find(error => error.id === errorId);
  }

  /**
   * Clear error history
   */
  clearErrorHistory(): void {
    this.errorHistory = [];
    this.errorReports = [];
    
    if (this.config.debugMode) {
      console.log('⚡ ErrorService: Error history cleared');
    }
  }

  /**
   * Add event listener
   */
  addEventListener(event: ErrorServiceEvent, listener: ErrorEventListener): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    
    this.eventListeners.get(event)!.push(listener);
    
    if (this.config.debugMode) {
      console.log('⚡ ErrorService: Event listener added:', event);
    }
  }

  /**
   * Remove event listener
   */
  removeEventListener(event: ErrorServiceEvent, listener: ErrorEventListener): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<ErrorServiceConfig>): void {
    this.config = { ...this.config, ...config };
    
    if (this.config.debugMode) {
      console.log('⚡ ErrorService: Configuration updated:', this.config);
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): ErrorServiceConfig {
    return { ...this.config };
  }

  /**
   * Private methods
   */

  private addToHistory(error: ConversionError): void {
    this.errorHistory.push(error);
    
    // Keep history within limits
    if (this.errorHistory.length > this.MAX_HISTORY_SIZE) {
      this.errorHistory = this.errorHistory.slice(-this.MAX_HISTORY_SIZE);
    }
  }

  private createErrorReport(
    error: ConversionError,
    context: ErrorContext,
    resolved: boolean,
    resolvedBy?: string
  ): void {
    
    if (!this.config.errorReportingEnabled) {
      return;
    }

    const report: ErrorReport = {
      error,
      context,
      resolved,
      resolvedAt: resolved ? new Date() : undefined,
      resolvedBy: resolvedBy as any
    };

    this.errorReports.push(report);

    // Keep reports within limits
    if (this.errorReports.length > this.MAX_HISTORY_SIZE) {
      this.errorReports = this.errorReports.slice(-this.MAX_HISTORY_SIZE);
    }

    if (this.config.debugMode) {
      console.log('⚡ ErrorService: Error report created:', {
        errorId: error.id,
        resolved,
        resolvedBy
      });
    }
  }

  private emitEvent(event: ErrorServiceEvent, error: ConversionError, context: ErrorContext): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(error, context);
        } catch (listenerError) {
          if (this.config.debugMode) {
            console.warn('⚡ ErrorService: Event listener error:', listenerError);
          }
        }
      });
    }
  }

  private createBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }

  private setupGlobalErrorHandlers(): void {
    if (typeof window === 'undefined') {
      return; // Server-side environment
    }

    // Global unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      if (this.config.debugMode) {
        console.warn('⚡ ErrorService: Unhandled promise rejection:', event.reason);
      }
      
      // Convert to ConversionError if possible
      if (event.reason instanceof Error) {
        this.handleError(event.reason, {
          step: 'unhandled_promise',
          component: 'global_handler'
        });
      }
    });

    // Global error handler for uncaught errors
    window.addEventListener('error', (event) => {
      if (this.config.debugMode) {
        console.warn('⚡ ErrorService: Uncaught error:', event.error);
      }
      
      if (event.error instanceof Error) {
        this.handleError(event.error, {
          step: 'uncaught_error',
          component: 'global_handler'
        });
      }
    });
  }
}

// Export singleton instance creator
export const createErrorService = (config?: Partial<ErrorServiceConfig>): ErrorService => {
  return ErrorService.getInstance(config);
};

// Export default instance
export const errorService = ErrorService.getInstance();

// Export common error creation helpers
export const createApiError = (message: string, httpStatus?: number, characterId?: string): ConversionError => {
  if (httpStatus === 404) {
    return ErrorTemplates.characterNotFound(characterId || 'unknown');
  }
  if (httpStatus === 429) {
    return ErrorTemplates.rateLimitExceeded();
  }
  if (httpStatus && httpStatus >= 500) {
    return ErrorTemplates.apiServerError(httpStatus);
  }
  
  return ErrorTemplates.networkError(message);
};

export const createValidationError = (message: string, characterName?: string): ConversionError => {
  return ErrorTemplates.incompleteCharacterData(characterName || 'Unknown', [message]);
};

export const createProcessingError = (step: string, component: string, details: string): ConversionError => {
  return ErrorTemplates.processingFailure(step, component, details);
};

export const createOutputError = (format: string, characterName: string, details: string): ConversionError => {
  return ErrorTemplates.formatGenerationError(format, characterName, details);
};