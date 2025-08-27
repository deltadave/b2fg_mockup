/**
 * Error Classification System
 * 
 * Provides intelligent error classification and categorization for the
 * D&D Beyond Character Converter. Analyzes errors and provides context-aware
 * classification to improve user experience and system monitoring.
 */

import { 
  ConversionError, 
  ErrorCategory, 
  ErrorSeverity, 
  ErrorTemplates,
  ConversionErrorBuilder,
  RecoveryAction
} from './ConversionErrors';
import { featureFlags } from '@/core/FeatureFlags';

/**
 * Error classification patterns for automatic categorization
 */
interface ClassificationPattern {
  pattern: RegExp | string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  code: string;
  title: string;
  recoverable: boolean;
  retryable: boolean;
  recoveryActions: RecoveryAction[];
}

/**
 * Error classification result with confidence score
 */
export interface ClassificationResult {
  category: ErrorCategory;
  severity: ErrorSeverity;
  confidence: number; // 0-1 confidence in classification
  suggestedCode?: string;
  suggestedTitle?: string;
  suggestedRecoveryActions?: RecoveryAction[];
  reasoning?: string; // Explanation of classification decision
}

/**
 * Intelligent error classifier that analyzes errors and provides
 * appropriate categorization and recovery suggestions
 */
export class ErrorClassifier {
  private static readonly HTTP_STATUS_PATTERNS: ClassificationPattern[] = [
    {
      pattern: /40[14]/,
      category: ErrorCategory.API,
      severity: ErrorSeverity.HIGH,
      code: 'API_CHARACTER_ACCESS',
      title: 'Character Access Error',
      recoverable: true,
      retryable: false,
      recoveryActions: [RecoveryAction.CHECK_CHARACTER_ID, RecoveryAction.CHECK_PRIVACY]
    },
    {
      pattern: /429/,
      category: ErrorCategory.API,
      severity: ErrorSeverity.MEDIUM,
      code: 'API_RATE_LIMITED',
      title: 'Request Rate Limited',
      recoverable: true,
      retryable: true,
      recoveryActions: [RecoveryAction.RETRY]
    },
    {
      pattern: /5\d{2}/,
      category: ErrorCategory.API,
      severity: ErrorSeverity.HIGH,
      code: 'API_SERVER_ERROR',
      title: 'Server Error',
      recoverable: true,
      retryable: true,
      recoveryActions: [RecoveryAction.RETRY, RecoveryAction.USE_LEGACY]
    }
  ];

  private static readonly ERROR_MESSAGE_PATTERNS: ClassificationPattern[] = [
    {
      pattern: /network|connection|timeout|fetch/i,
      category: ErrorCategory.API,
      severity: ErrorSeverity.MEDIUM,
      code: 'API_NETWORK_ERROR',
      title: 'Network Connection Error',
      recoverable: true,
      retryable: true,
      recoveryActions: [RecoveryAction.CHECK_NETWORK, RecoveryAction.RETRY]
    },
    {
      pattern: /character.*not found|invalid.*id/i,
      category: ErrorCategory.USER_INPUT,
      severity: ErrorSeverity.LOW,
      code: 'VALIDATION_CHARACTER_NOT_FOUND',
      title: 'Character Not Found',
      recoverable: true,
      retryable: false,
      recoveryActions: [RecoveryAction.CHECK_CHARACTER_ID, RecoveryAction.CHECK_PRIVACY]
    },
    {
      pattern: /validation.*failed|invalid.*data/i,
      category: ErrorCategory.VALIDATION,
      severity: ErrorSeverity.MEDIUM,
      code: 'VALIDATION_DATA_INVALID',
      title: 'Data Validation Error',
      recoverable: true,
      retryable: true,
      recoveryActions: [RecoveryAction.RETRY]
    },
    {
      pattern: /json.*parse|syntax.*error/i,
      category: ErrorCategory.PROCESSING,
      severity: ErrorSeverity.HIGH,
      code: 'PROCESSING_JSON_PARSE',
      title: 'Data Format Error',
      recoverable: true,
      retryable: true,
      recoveryActions: [RecoveryAction.RETRY, RecoveryAction.USE_LEGACY]
    },
    {
      pattern: /memory|out of memory/i,
      category: ErrorCategory.SYSTEM,
      severity: ErrorSeverity.CRITICAL,
      code: 'SYSTEM_MEMORY_ERROR',
      title: 'Memory Error',
      recoverable: true,
      retryable: false,
      recoveryActions: [RecoveryAction.REFRESH_PAGE, RecoveryAction.USE_LEGACY]
    },
    {
      pattern: /permission|access.*denied|cors/i,
      category: ErrorCategory.API,
      severity: ErrorSeverity.HIGH,
      code: 'API_ACCESS_DENIED',
      title: 'Access Permission Error',
      recoverable: true,
      retryable: false,
      recoveryActions: [RecoveryAction.CHECK_PRIVACY, RecoveryAction.USE_LEGACY]
    }
  ];

  private static readonly COMPONENT_PATTERNS: Array<{
    component: RegExp | string;
    category: ErrorCategory;
    severity: ErrorSeverity;
  }> = [
    {
      component: /CharacterFetcher/i,
      category: ErrorCategory.API,
      severity: ErrorSeverity.MEDIUM
    },
    {
      component: /ConversionOrchestrator/i,
      category: ErrorCategory.PROCESSING,
      severity: ErrorSeverity.HIGH
    },
    {
      component: /AbilityScoreProcessor|SpellSlotCalculator|InventoryProcessor/i,
      category: ErrorCategory.PROCESSING,
      severity: ErrorSeverity.MEDIUM
    },
    {
      component: /Formatter|Generator/i,
      category: ErrorCategory.OUTPUT,
      severity: ErrorSeverity.HIGH
    },
    {
      component: /Validator/i,
      category: ErrorCategory.VALIDATION,
      severity: ErrorSeverity.MEDIUM
    }
  ];

  /**
   * Classify an error based on its properties and content
   */
  static classifyError(error: Error | ConversionError, context?: {
    step?: string;
    component?: string;
    httpStatus?: number;
    characterId?: string;
    characterName?: string;
  }): ClassificationResult {
    
    if (featureFlags.isEnabled('error_classifier_debug')) {
      console.log('🔍 ErrorClassifier: Analyzing error', {
        errorType: error.constructor.name,
        message: error.message,
        context
      });
    }

    // If it's already a ConversionError, return high-confidence classification
    if (this.isConversionError(error)) {
      return {
        category: error.category,
        severity: error.severity,
        confidence: 1.0,
        reasoning: 'Pre-classified ConversionError'
      };
    }

    // Start with default classification
    let bestMatch: ClassificationResult = {
      category: ErrorCategory.SYSTEM,
      severity: ErrorSeverity.MEDIUM,
      confidence: 0.1,
      suggestedCode: 'SYSTEM_UNKNOWN_ERROR',
      suggestedTitle: 'Unknown Error',
      suggestedRecoveryActions: [RecoveryAction.RETRY, RecoveryAction.CONTACT_SUPPORT],
      reasoning: 'Default fallback classification'
    };

    // Analyze HTTP status codes if available
    if (context?.httpStatus) {
      const httpMatch = this.matchHttpStatus(context.httpStatus);
      if (httpMatch && httpMatch.confidence > bestMatch.confidence) {
        bestMatch = httpMatch;
      }
    }

    // Analyze error message content
    const messageMatch = this.matchErrorMessage(error.message);
    if (messageMatch && messageMatch.confidence > bestMatch.confidence) {
      bestMatch = messageMatch;
    }

    // Analyze component context
    if (context?.component) {
      const componentMatch = this.matchComponent(context.component);
      if (componentMatch) {
        // Component context provides category refinement
        if (componentMatch.confidence > 0.7) {
          bestMatch.category = componentMatch.category;
          bestMatch.severity = this.adjustSeverityByCategory(bestMatch.severity, componentMatch.severity);
          bestMatch.confidence = Math.max(bestMatch.confidence, componentMatch.confidence);
          bestMatch.reasoning = `${bestMatch.reasoning} + component analysis`;
        }
      }
    }

    // Analyze processing step context
    if (context?.step) {
      const stepMatch = this.matchProcessingStep(context.step);
      if (stepMatch && stepMatch.confidence > 0.5) {
        bestMatch.category = stepMatch.category;
        bestMatch.confidence = Math.max(bestMatch.confidence, stepMatch.confidence);
        bestMatch.reasoning = `${bestMatch.reasoning} + step analysis`;
      }
    }

    // Apply error severity escalation rules
    bestMatch = this.applySeverityRules(bestMatch, error, context);

    if (featureFlags.isEnabled('error_classifier_debug')) {
      console.log('🔍 ErrorClassifier: Classification complete', {
        category: bestMatch.category,
        severity: bestMatch.severity,
        confidence: bestMatch.confidence,
        reasoning: bestMatch.reasoning
      });
    }

    return bestMatch;
  }

  /**
   * Create a ConversionError from a generic Error with classification
   */
  static createClassifiedError(
    error: Error, 
    context: {
      step: string;
      component: string;
      characterId?: string;
      characterName?: string;
      httpStatus?: number;
    }
  ): ConversionError {
    
    const classification = this.classifyError(error, context);
    
    return ConversionErrorBuilder.create()
      .category(classification.category)
      .severity(classification.severity)
      .code(classification.suggestedCode || 'UNKNOWN_ERROR')
      .title(classification.suggestedTitle || 'Unknown Error')
      .message(this.generateUserFriendlyMessage(error, classification))
      .technicalDetails(`${error.name}: ${error.message}`)
      .step(context.step)
      .component(context.component)
      .characterId(context.characterId || '')
      .characterName(context.characterName || '')
      .recoverable(this.isErrorRecoverable(classification))
      .retryable(this.isErrorRetryable(classification))
      .recoveryActions(classification.suggestedRecoveryActions || [])
      .fromJSError(error)
      .metadata('classificationConfidence', classification.confidence)
      .metadata('classificationReasoning', classification.reasoning)
      .build();
  }

  /**
   * Determine if error is a ConversionError
   */
  private static isConversionError(error: any): error is ConversionError {
    return error && 
           typeof error.category === 'string' && 
           typeof error.severity === 'string' &&
           typeof error.code === 'string';
  }

  /**
   * Match HTTP status code patterns
   */
  private static matchHttpStatus(status: number): ClassificationResult | null {
    const statusStr = status.toString();
    
    for (const pattern of this.HTTP_STATUS_PATTERNS) {
      if (typeof pattern.pattern === 'string') {
        if (statusStr === pattern.pattern) {
          return this.patternToClassification(pattern, 0.9, `HTTP status ${status}`);
        }
      } else {
        if (pattern.pattern.test(statusStr)) {
          return this.patternToClassification(pattern, 0.8, `HTTP status pattern match`);
        }
      }
    }
    
    return null;
  }

  /**
   * Match error message patterns
   */
  private static matchErrorMessage(message: string): ClassificationResult | null {
    if (!message) return null;
    
    let bestMatch: ClassificationResult | null = null;
    let highestConfidence = 0;
    
    for (const pattern of this.ERROR_MESSAGE_PATTERNS) {
      if (typeof pattern.pattern === 'string') {
        if (message.toLowerCase().includes(pattern.pattern.toLowerCase())) {
          const confidence = 0.7;
          if (confidence > highestConfidence) {
            bestMatch = this.patternToClassification(pattern, confidence, 'Message exact match');
            highestConfidence = confidence;
          }
        }
      } else {
        if (pattern.pattern.test(message)) {
          const confidence = 0.6;
          if (confidence > highestConfidence) {
            bestMatch = this.patternToClassification(pattern, confidence, 'Message pattern match');
            highestConfidence = confidence;
          }
        }
      }
    }
    
    return bestMatch;
  }

  /**
   * Match component patterns
   */
  private static matchComponent(component: string): ClassificationResult | null {
    for (const pattern of this.COMPONENT_PATTERNS) {
      if (typeof pattern.component === 'string') {
        if (component.toLowerCase().includes(pattern.component.toLowerCase())) {
          return {
            category: pattern.category,
            severity: pattern.severity,
            confidence: 0.8,
            reasoning: 'Component name match'
          };
        }
      } else {
        if (pattern.component.test(component)) {
          return {
            category: pattern.category,
            severity: pattern.severity,
            confidence: 0.7,
            reasoning: 'Component pattern match'
          };
        }
      }
    }
    
    return null;
  }

  /**
   * Match processing step patterns
   */
  private static matchProcessingStep(step: string): ClassificationResult | null {
    const stepLower = step.toLowerCase();
    
    if (stepLower.includes('fetch') || stepLower.includes('api')) {
      return {
        category: ErrorCategory.API,
        severity: ErrorSeverity.MEDIUM,
        confidence: 0.6,
        reasoning: 'Processing step indicates API operation'
      };
    }
    
    if (stepLower.includes('validate') || stepLower.includes('validation')) {
      return {
        category: ErrorCategory.VALIDATION,
        severity: ErrorSeverity.MEDIUM,
        confidence: 0.6,
        reasoning: 'Processing step indicates validation operation'
      };
    }
    
    if (stepLower.includes('process') || stepLower.includes('calculate')) {
      return {
        category: ErrorCategory.PROCESSING,
        severity: ErrorSeverity.MEDIUM,
        confidence: 0.6,
        reasoning: 'Processing step indicates character processing'
      };
    }
    
    if (stepLower.includes('generate') || stepLower.includes('format') || stepLower.includes('output')) {
      return {
        category: ErrorCategory.OUTPUT,
        severity: ErrorSeverity.HIGH,
        confidence: 0.6,
        reasoning: 'Processing step indicates output generation'
      };
    }
    
    return null;
  }

  /**
   * Convert classification pattern to result
   */
  private static patternToClassification(
    pattern: ClassificationPattern, 
    confidence: number, 
    reasoning: string
  ): ClassificationResult {
    return {
      category: pattern.category,
      severity: pattern.severity,
      confidence,
      suggestedCode: pattern.code,
      suggestedTitle: pattern.title,
      suggestedRecoveryActions: pattern.recoveryActions,
      reasoning
    };
  }

  /**
   * Adjust severity based on multiple factors
   */
  private static adjustSeverityByCategory(current: ErrorSeverity, suggested: ErrorSeverity): ErrorSeverity {
    const severityOrder = [ErrorSeverity.LOW, ErrorSeverity.MEDIUM, ErrorSeverity.HIGH, ErrorSeverity.CRITICAL];
    const currentIndex = severityOrder.indexOf(current);
    const suggestedIndex = severityOrder.indexOf(suggested);
    
    // Take the higher severity
    return severityOrder[Math.max(currentIndex, suggestedIndex)];
  }

  /**
   * Apply severity escalation rules based on context
   */
  private static applySeverityRules(
    classification: ClassificationResult, 
    error: Error, 
    context?: any
  ): ClassificationResult {
    
    // Escalate severity for critical components
    if (context?.component?.includes('CharacterConverterFacade')) {
      classification.severity = this.adjustSeverityByCategory(classification.severity, ErrorSeverity.HIGH);
    }
    
    // Escalate for repeated errors (if we had error history)
    // This would require error tracking implementation
    
    // Escalate for errors with stack traces indicating system issues
    if (error.stack?.includes('RangeError') || error.stack?.includes('ReferenceError')) {
      classification.severity = this.adjustSeverityByCategory(classification.severity, ErrorSeverity.HIGH);
    }
    
    return classification;
  }

  /**
   * Generate user-friendly error message
   */
  private static generateUserFriendlyMessage(error: Error, classification: ClassificationResult): string {
    if (classification.category === ErrorCategory.API) {
      return 'Unable to connect to D&D Beyond servers. Please check your connection and try again.';
    }
    
    if (classification.category === ErrorCategory.USER_INPUT) {
      return 'Please check your character ID or URL and ensure the character is set to public visibility.';
    }
    
    if (classification.category === ErrorCategory.PROCESSING) {
      return 'An error occurred while processing your character. Some features may not convert correctly.';
    }
    
    if (classification.category === ErrorCategory.OUTPUT) {
      return 'Unable to generate the requested output format. Please try a different format or retry.';
    }
    
    if (classification.category === ErrorCategory.VALIDATION) {
      return 'The character data appears to be incomplete or invalid. The conversion may not be fully accurate.';
    }
    
    // Default system error message
    return 'An unexpected error occurred. Please try again or contact support if the problem persists.';
  }

  /**
   * Determine if error is recoverable based on classification
   */
  private static isErrorRecoverable(classification: ClassificationResult): boolean {
    // Most errors are recoverable except for critical system errors
    return classification.severity !== ErrorSeverity.CRITICAL || 
           classification.category !== ErrorCategory.SYSTEM;
  }

  /**
   * Determine if error should be retryable
   */
  private static isErrorRetryable(classification: ClassificationResult): boolean {
    // API and processing errors are usually retryable
    // User input errors are generally not retryable without user action
    return classification.category === ErrorCategory.API || 
           classification.category === ErrorCategory.PROCESSING ||
           classification.category === ErrorCategory.SYSTEM;
  }
}