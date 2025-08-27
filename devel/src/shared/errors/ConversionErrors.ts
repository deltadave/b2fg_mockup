/**
 * Conversion Error Definitions
 * 
 * Comprehensive error type definitions for the D&D Beyond Character Converter.
 * Provides structured error classification with user-friendly messages and
 * recovery suggestions following the system architecture requirements.
 */

import { featureFlags } from '@/core/FeatureFlags';

/**
 * Base error severity levels for user experience prioritization
 */
export enum ErrorSeverity {
  LOW = 'low',           // Minor issues, conversion can continue
  MEDIUM = 'medium',     // Significant issues, some features may be missing
  HIGH = 'high',         // Major issues, conversion may be unreliable
  CRITICAL = 'critical'  // Fatal errors, conversion cannot proceed
}

/**
 * Error categories for systematic classification
 */
export enum ErrorCategory {
  API = 'api',                    // External API communication errors
  VALIDATION = 'validation',      // Data validation and structure errors
  PROCESSING = 'processing',      // Character processing pipeline errors
  OUTPUT = 'output',              // Format generation and export errors
  SYSTEM = 'system',              // Internal system and infrastructure errors
  USER_INPUT = 'user_input'       // User input validation and sanitization errors
}

/**
 * Recovery action types that can be suggested to users
 */
export enum RecoveryAction {
  RETRY = 'retry',                    // Try the operation again
  CHECK_CHARACTER_ID = 'check_id',    // Verify character ID is correct
  CHECK_PRIVACY = 'check_privacy',    // Ensure character is public
  CHECK_NETWORK = 'check_network',    // Check internet connection
  CONTACT_SUPPORT = 'contact_support', // Contact support for help
  USE_LEGACY = 'use_legacy',          // Fall back to legacy converter
  TRY_DIFFERENT_FORMAT = 'try_format', // Try a different output format
  REFRESH_PAGE = 'refresh_page'       // Refresh the page and try again
}

/**
 * Core error interface with comprehensive context
 */
export interface ConversionError {
  // Error identification
  readonly id: string;              // Unique error identifier
  readonly category: ErrorCategory; // Error classification
  readonly severity: ErrorSeverity; // Impact level
  readonly code: string;            // Machine-readable error code
  
  // Error description
  readonly title: string;           // User-friendly error title
  readonly message: string;         // Detailed error explanation
  readonly technicalDetails?: string; // Technical details for debugging
  
  // Context information
  readonly timestamp: Date;         // When the error occurred
  readonly step: string;            // Which processing step failed
  readonly component: string;       // Which component raised the error
  readonly characterId?: string;    // Character ID if applicable
  readonly characterName?: string;  // Character name if available
  
  // Recovery information
  readonly recoverable: boolean;    // Whether error can be recovered from
  readonly recoveryActions: RecoveryAction[]; // Suggested recovery steps
  readonly retryable: boolean;      // Whether operation can be retried
  
  // Additional context
  readonly metadata?: Record<string, any>; // Additional error-specific data
  readonly userAgent?: string;      // Browser/environment info
  readonly url?: string;            // Current URL when error occurred
  readonly stack?: string;          // Stack trace for debugging
}

/**
 * Error builder for creating structured conversion errors
 */
export class ConversionErrorBuilder {
  private error: Partial<ConversionError>;
  
  constructor() {
    this.error = {
      id: this.generateErrorId(),
      timestamp: new Date(),
      recoverable: true,
      retryable: false,
      recoveryActions: [],
      metadata: {}
    };
  }
  
  static create(): ConversionErrorBuilder {
    return new ConversionErrorBuilder();
  }
  
  category(category: ErrorCategory): this {
    this.error.category = category;
    return this;
  }
  
  severity(severity: ErrorSeverity): this {
    this.error.severity = severity;
    return this;
  }
  
  code(code: string): this {
    this.error.code = code;
    return this;
  }
  
  title(title: string): this {
    this.error.title = title;
    return this;
  }
  
  message(message: string): this {
    this.error.message = message;
    return this;
  }
  
  technicalDetails(details: string): this {
    this.error.technicalDetails = details;
    return this;
  }
  
  step(step: string): this {
    this.error.step = step;
    return this;
  }
  
  component(component: string): this {
    this.error.component = component;
    return this;
  }
  
  characterId(id: string): this {
    this.error.characterId = id;
    return this;
  }
  
  characterName(name: string): this {
    this.error.characterName = name;
    return this;
  }
  
  recoverable(recoverable: boolean): this {
    this.error.recoverable = recoverable;
    return this;
  }
  
  retryable(retryable: boolean): this {
    this.error.retryable = retryable;
    return this;
  }
  
  addRecoveryAction(action: RecoveryAction): this {
    this.error.recoveryActions = [...(this.error.recoveryActions || []), action];
    return this;
  }
  
  recoveryActions(actions: RecoveryAction[]): this {
    this.error.recoveryActions = actions;
    return this;
  }
  
  metadata(key: string, value: any): this {
    this.error.metadata = { ...this.error.metadata, [key]: value };
    return this;
  }
  
  metadataObject(metadata: Record<string, any>): this {
    this.error.metadata = { ...this.error.metadata, ...metadata };
    return this;
  }
  
  userAgent(userAgent: string): this {
    this.error.userAgent = userAgent;
    return this;
  }
  
  url(url: string): this {
    this.error.url = url;
    return this;
  }
  
  stack(stack: string): this {
    this.error.stack = stack;
    return this;
  }
  
  fromJSError(error: Error): this {
    this.message(error.message);
    this.stack(error.stack || 'No stack trace available');
    this.technicalDetails(`${error.name}: ${error.message}`);
    return this;
  }
  
  build(): ConversionError {
    // Validate required fields
    if (!this.error.category) {
      throw new Error('Error category is required');
    }
    if (!this.error.severity) {
      throw new Error('Error severity is required');
    }
    if (!this.error.code) {
      throw new Error('Error code is required');
    }
    if (!this.error.title) {
      throw new Error('Error title is required');
    }
    if (!this.error.message) {
      throw new Error('Error message is required');
    }
    if (!this.error.step) {
      throw new Error('Error step is required');
    }
    if (!this.error.component) {
      throw new Error('Error component is required');
    }
    
    // Add environment context
    if (typeof window !== 'undefined') {
      this.error.userAgent = this.error.userAgent || navigator.userAgent;
      this.error.url = this.error.url || window.location.href;
    }
    
    return this.error as ConversionError;
  }
  
  private generateErrorId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `err_${timestamp}_${random}`;
  }
}

/**
 * Pre-defined error templates for common scenarios
 */
export class ErrorTemplates {
  
  /**
   * API Communication Errors
   */
  static characterNotFound(characterId: string): ConversionError {
    return ConversionErrorBuilder.create()
      .category(ErrorCategory.API)
      .severity(ErrorSeverity.HIGH)
      .code('API_CHARACTER_NOT_FOUND')
      .title('Character Not Found')
      .message('The character could not be found or is not publicly accessible.')
      .step('fetch_character')
      .component('CharacterFetcher')
      .characterId(characterId)
      .recoverable(true)
      .retryable(false)
      .addRecoveryAction(RecoveryAction.CHECK_CHARACTER_ID)
      .addRecoveryAction(RecoveryAction.CHECK_PRIVACY)
      .metadata('httpStatus', 404)
      .build();
  }
  
  static networkError(details?: string): ConversionError {
    return ConversionErrorBuilder.create()
      .category(ErrorCategory.API)
      .severity(ErrorSeverity.MEDIUM)
      .code('API_NETWORK_ERROR')
      .title('Network Connection Error')
      .message('Unable to connect to D&D Beyond servers. Please check your internet connection.')
      .technicalDetails(details)
      .step('fetch_character')
      .component('CharacterFetcher')
      .recoverable(true)
      .retryable(true)
      .addRecoveryAction(RecoveryAction.CHECK_NETWORK)
      .addRecoveryAction(RecoveryAction.RETRY)
      .build();
  }
  
  static rateLimitExceeded(): ConversionError {
    return ConversionErrorBuilder.create()
      .category(ErrorCategory.API)
      .severity(ErrorSeverity.MEDIUM)
      .code('API_RATE_LIMITED')
      .title('Request Rate Limit Exceeded')
      .message('Too many requests have been made in a short time. Please wait a moment before trying again.')
      .step('fetch_character')
      .component('CharacterFetcher')
      .recoverable(true)
      .retryable(true)
      .addRecoveryAction(RecoveryAction.RETRY)
      .metadata('httpStatus', 429)
      .build();
  }
  
  static apiServerError(httpStatus: number): ConversionError {
    return ConversionErrorBuilder.create()
      .category(ErrorCategory.API)
      .severity(ErrorSeverity.HIGH)
      .code('API_SERVER_ERROR')
      .title('D&D Beyond Server Error')
      .message('D&D Beyond servers are experiencing issues. Please try again later.')
      .step('fetch_character')
      .component('CharacterFetcher')
      .recoverable(true)
      .retryable(true)
      .addRecoveryAction(RecoveryAction.RETRY)
      .addRecoveryAction(RecoveryAction.USE_LEGACY)
      .metadata('httpStatus', httpStatus)
      .build();
  }
  
  /**
   * Validation Errors
   */
  static invalidCharacterId(input: string): ConversionError {
    return ConversionErrorBuilder.create()
      .category(ErrorCategory.USER_INPUT)
      .severity(ErrorSeverity.LOW)
      .code('VALIDATION_INVALID_CHARACTER_ID')
      .title('Invalid Character ID')
      .message('Please enter a valid D&D Beyond character ID or URL.')
      .step('validate_input')
      .component('CharacterFetcher')
      .recoverable(true)
      .retryable(false)
      .addRecoveryAction(RecoveryAction.CHECK_CHARACTER_ID)
      .metadata('userInput', input)
      .build();
  }
  
  static incompleteCharacterData(characterName: string, missingFields: string[]): ConversionError {
    return ConversionErrorBuilder.create()
      .category(ErrorCategory.VALIDATION)
      .severity(ErrorSeverity.MEDIUM)
      .code('VALIDATION_INCOMPLETE_DATA')
      .title('Incomplete Character Data')
      .message(`Character "${characterName}" is missing some required information and may not convert completely.`)
      .step('validate_character')
      .component('ConversionOrchestrator')
      .characterName(characterName)
      .recoverable(true)
      .retryable(false)
      .metadata('missingFields', missingFields)
      .build();
  }
  
  /**
   * Processing Errors
   */
  static processingFailure(step: string, component: string, details: string): ConversionError {
    return ConversionErrorBuilder.create()
      .category(ErrorCategory.PROCESSING)
      .severity(ErrorSeverity.HIGH)
      .code('PROCESSING_FAILURE')
      .title('Character Processing Failed')
      .message('An error occurred while processing the character data.')
      .technicalDetails(details)
      .step(step)
      .component(component)
      .recoverable(true)
      .retryable(true)
      .addRecoveryAction(RecoveryAction.RETRY)
      .addRecoveryAction(RecoveryAction.USE_LEGACY)
      .build();
  }
  
  static abilityScoreError(characterName: string, details: string): ConversionError {
    return ConversionErrorBuilder.create()
      .category(ErrorCategory.PROCESSING)
      .severity(ErrorSeverity.MEDIUM)
      .code('PROCESSING_ABILITY_SCORES')
      .title('Ability Score Processing Error')
      .message('Unable to correctly process ability scores. Some modifiers may be incorrect.')
      .technicalDetails(details)
      .step('process_ability_scores')
      .component('AbilityScoreProcessor')
      .characterName(characterName)
      .recoverable(true)
      .retryable(true)
      .addRecoveryAction(RecoveryAction.RETRY)
      .build();
  }
  
  static spellSlotError(characterName: string, details: string): ConversionError {
    return ConversionErrorBuilder.create()
      .category(ErrorCategory.PROCESSING)
      .severity(ErrorSeverity.MEDIUM)
      .code('PROCESSING_SPELL_SLOTS')
      .title('Spell Slot Calculation Error')
      .message('Unable to correctly calculate spell slots. Spellcasting features may be incorrect.')
      .technicalDetails(details)
      .step('calculate_spell_slots')
      .component('SpellSlotCalculator')
      .characterName(characterName)
      .recoverable(true)
      .retryable(true)
      .addRecoveryAction(RecoveryAction.RETRY)
      .build();
  }
  
  /**
   * Output Generation Errors
   */
  static formatGenerationError(format: string, characterName: string, details: string): ConversionError {
    return ConversionErrorBuilder.create()
      .category(ErrorCategory.OUTPUT)
      .severity(ErrorSeverity.HIGH)
      .code('OUTPUT_GENERATION_FAILED')
      .title('Format Generation Failed')
      .message(`Unable to generate ${format} output for character "${characterName}".`)
      .technicalDetails(details)
      .step('generate_output')
      .component(`${format}Formatter`)
      .characterName(characterName)
      .recoverable(true)
      .retryable(true)
      .addRecoveryAction(RecoveryAction.RETRY)
      .addRecoveryAction(RecoveryAction.TRY_DIFFERENT_FORMAT)
      .metadata('outputFormat', format)
      .build();
  }
  
  static validationFailure(format: string, validationErrors: string[]): ConversionError {
    return ConversionErrorBuilder.create()
      .category(ErrorCategory.OUTPUT)
      .severity(ErrorSeverity.HIGH)
      .code('OUTPUT_VALIDATION_FAILED')
      .title('Output Validation Failed')
      .message(`Generated ${format} output failed validation checks.`)
      .step('validate_output')
      .component(`${format}Formatter`)
      .recoverable(true)
      .retryable(true)
      .addRecoveryAction(RecoveryAction.RETRY)
      .addRecoveryAction(RecoveryAction.TRY_DIFFERENT_FORMAT)
      .metadata('validationErrors', validationErrors)
      .metadata('outputFormat', format)
      .build();
  }
  
  /**
   * System Errors
   */
  static unexpectedError(error: Error, step: string, component: string): ConversionError {
    return ConversionErrorBuilder.create()
      .category(ErrorCategory.SYSTEM)
      .severity(ErrorSeverity.CRITICAL)
      .code('SYSTEM_UNEXPECTED_ERROR')
      .title('Unexpected System Error')
      .message('An unexpected error occurred during character conversion.')
      .fromJSError(error)
      .step(step)
      .component(component)
      .recoverable(true)
      .retryable(true)
      .addRecoveryAction(RecoveryAction.REFRESH_PAGE)
      .addRecoveryAction(RecoveryAction.CONTACT_SUPPORT)
      .build();
  }
  
  static memoryError(step: string, component: string): ConversionError {
    return ConversionErrorBuilder.create()
      .category(ErrorCategory.SYSTEM)
      .severity(ErrorSeverity.CRITICAL)
      .code('SYSTEM_MEMORY_ERROR')
      .title('System Memory Error')
      .message('The character data is too large to process. Try using a simpler character or refresh the page.')
      .step(step)
      .component(component)
      .recoverable(true)
      .retryable(false)
      .addRecoveryAction(RecoveryAction.REFRESH_PAGE)
      .addRecoveryAction(RecoveryAction.USE_LEGACY)
      .build();
  }
}

/**
 * Error context for tracking related information
 */
export interface ErrorContext {
  characterId?: string;
  characterName?: string;
  outputFormat?: string;
  processingStep?: string;
  userAgent?: string;
  timestamp: Date;
  sessionId?: string;
  buildVersion?: string;
}

/**
 * Error statistics for monitoring and improvement
 */
export interface ErrorStatistics {
  totalErrors: number;
  errorsByCategory: Record<ErrorCategory, number>;
  errorsBySeverity: Record<ErrorSeverity, number>;
  mostCommonErrors: Array<{ code: string; count: number }>;
  recoverySuccessRate: number;
  retrySuccessRate: number;
}

/**
 * Error reporting interface for external monitoring
 */
export interface ErrorReport {
  error: ConversionError;
  context: ErrorContext;
  resolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: RecoveryAction;
  userFeedback?: string;
}

/**
 * Utility functions for error handling
 */
export class ErrorUtils {
  /**
   * Check if an error is user-actionable
   */
  static isUserActionable(error: ConversionError): boolean {
    return error.recoveryActions.length > 0 && error.recoverable;
  }
  
  /**
   * Check if an error should be retried automatically
   */
  static shouldAutoRetry(error: ConversionError): boolean {
    return error.retryable && error.severity !== ErrorSeverity.CRITICAL;
  }
  
  /**
   * Get user-friendly severity description
   */
  static getSeverityDescription(severity: ErrorSeverity): string {
    switch (severity) {
      case ErrorSeverity.LOW:
        return 'Minor Issue';
      case ErrorSeverity.MEDIUM:
        return 'Moderate Issue';
      case ErrorSeverity.HIGH:
        return 'Significant Issue';
      case ErrorSeverity.CRITICAL:
        return 'Critical Error';
      default:
        return 'Unknown';
    }
  }
  
  /**
   * Get user-friendly recovery action description
   */
  static getRecoveryActionDescription(action: RecoveryAction): string {
    switch (action) {
      case RecoveryAction.RETRY:
        return 'Try Again';
      case RecoveryAction.CHECK_CHARACTER_ID:
        return 'Check Character ID';
      case RecoveryAction.CHECK_PRIVACY:
        return 'Verify Character is Public';
      case RecoveryAction.CHECK_NETWORK:
        return 'Check Internet Connection';
      case RecoveryAction.CONTACT_SUPPORT:
        return 'Contact Support';
      case RecoveryAction.USE_LEGACY:
        return 'Use Legacy Converter';
      case RecoveryAction.TRY_DIFFERENT_FORMAT:
        return 'Try Different Format';
      case RecoveryAction.REFRESH_PAGE:
        return 'Refresh Page';
      default:
        return 'Unknown Action';
    }
  }
  
  /**
   * Create error context from current environment
   */
  static createContext(characterId?: string, characterName?: string): ErrorContext {
    return {
      characterId,
      characterName,
      timestamp: new Date(),
      userAgent: typeof window !== 'undefined' ? navigator.userAgent : undefined,
      sessionId: this.getSessionId(),
      buildVersion: this.getBuildVersion()
    };
  }
  
  private static getSessionId(): string {
    // Generate or retrieve session ID for error tracking
    if (typeof window === 'undefined') return 'server';
    
    let sessionId = sessionStorage.getItem('conversion_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      sessionStorage.setItem('conversion_session_id', sessionId);
    }
    return sessionId;
  }
  
  private static getBuildVersion(): string {
    // Get build version from environment or feature flags
    if (featureFlags.isEnabled('build_version_tracking')) {
      return process.env.BUILD_VERSION || '1.0.0-dev';
    }
    return 'unknown';
  }
}