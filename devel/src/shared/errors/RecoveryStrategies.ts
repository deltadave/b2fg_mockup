/**
 * Error Recovery Strategies
 * 
 * Implements automated and guided recovery workflows for character conversion errors.
 * Provides intelligent retry logic, fallback mechanisms, and user-guided recovery
 * processes to improve overall system reliability and user experience.
 */

import { 
  ConversionError, 
  RecoveryAction, 
  ErrorSeverity, 
  ErrorCategory,
  ErrorContext 
} from './ConversionErrors';
import { featureFlags } from '@/core/FeatureFlags';

/**
 * Recovery attempt result
 */
export interface RecoveryResult {
  success: boolean;
  action: RecoveryAction;
  message: string;
  newError?: ConversionError;
  shouldRetry: boolean;
  retryDelay?: number; // in milliseconds
  metadata?: Record<string, any>;
}

/**
 * Recovery strategy configuration
 */
export interface RecoveryStrategy {
  action: RecoveryAction;
  automated: boolean;
  maxAttempts: number;
  delayBetweenAttempts: number;
  successCondition: (result: any) => boolean;
  handler: RecoveryHandler;
}

/**
 * Recovery handler function signature
 */
export type RecoveryHandler = (
  error: ConversionError,
  context: ErrorContext,
  attempt: number
) => Promise<RecoveryResult>;

/**
 * Recovery attempt tracking
 */
export interface RecoveryAttempt {
  errorId: string;
  action: RecoveryAction;
  attempt: number;
  timestamp: Date;
  result: RecoveryResult;
}

/**
 * Recovery statistics for monitoring
 */
export interface RecoveryStatistics {
  totalAttempts: number;
  successfulRecoveries: number;
  recoveryByAction: Record<RecoveryAction, { attempts: number; successes: number }>;
  averageRecoveryTime: number;
  mostEffectiveActions: RecoveryAction[];
}

/**
 * Main recovery strategy orchestrator
 */
export class RecoveryStrategies {
  private static strategies: Map<RecoveryAction, RecoveryStrategy> = new Map();
  private static recoveryAttempts: RecoveryAttempt[] = [];
  private static readonly MAX_HISTORY = 1000;

  /**
   * Initialize recovery strategies
   */
  static initialize(): void {
    this.registerDefaultStrategies();
    
    if (featureFlags.isEnabled('recovery_strategies_debug')) {
      console.log('🔧 RecoveryStrategies: Initialized with strategies:', 
        Array.from(this.strategies.keys())
      );
    }
  }

  /**
   * Attempt to recover from an error
   */
  static async attemptRecovery(
    error: ConversionError,
    context: ErrorContext,
    preferredActions?: RecoveryAction[]
  ): Promise<RecoveryResult[]> {
    
    const actionsToTry = preferredActions || error.recoveryActions;
    const results: RecoveryResult[] = [];
    
    if (featureFlags.isEnabled('recovery_strategies_debug')) {
      console.log('🔧 RecoveryStrategies: Attempting recovery for error:', {
        errorId: error.id,
        category: error.category,
        actions: actionsToTry
      });
    }

    for (const action of actionsToTry) {
      const strategy = this.strategies.get(action);
      if (!strategy) {
        results.push({
          success: false,
          action,
          message: `No recovery strategy available for action: ${action}`,
          shouldRetry: false
        });
        continue;
      }

      // Check if this is an automated strategy
      if (!strategy.automated) {
        results.push({
          success: false,
          action,
          message: 'Manual recovery action required',
          shouldRetry: false,
          metadata: { requiresUserAction: true }
        });
        continue;
      }

      // Attempt recovery with retry logic
      let lastResult: RecoveryResult | null = null;
      
      for (let attempt = 1; attempt <= strategy.maxAttempts; attempt++) {
        try {
          lastResult = await strategy.handler(error, context, attempt);
          
          // Track the attempt
          this.trackRecoveryAttempt(error.id, action, attempt, lastResult);
          
          if (lastResult.success) {
            results.push(lastResult);
            break; // Success, no need to retry
          }
          
          // If not successful and we have more attempts, wait before retrying
          if (attempt < strategy.maxAttempts && lastResult.shouldRetry) {
            const delay = lastResult.retryDelay || strategy.delayBetweenAttempts;
            await this.delay(delay);
          }
          
        } catch (handlerError) {
          lastResult = {
            success: false,
            action,
            message: `Recovery handler failed: ${handlerError instanceof Error ? handlerError.message : 'Unknown error'}`,
            shouldRetry: false
          };
          
          this.trackRecoveryAttempt(error.id, action, attempt, lastResult);
          break;
        }
      }
      
      if (lastResult && !lastResult.success) {
        results.push(lastResult);
      }
    }

    if (featureFlags.isEnabled('recovery_strategies_debug')) {
      console.log('🔧 RecoveryStrategies: Recovery attempts completed:', {
        errorId: error.id,
        totalAttempts: results.length,
        successful: results.filter(r => r.success).length
      });
    }

    return results;
  }

  /**
   * Get available recovery actions for an error
   */
  static getAvailableActions(error: ConversionError): RecoveryAction[] {
    return error.recoveryActions.filter(action => this.strategies.has(action));
  }

  /**
   * Check if an action can be performed automatically
   */
  static isAutomatedAction(action: RecoveryAction): boolean {
    const strategy = this.strategies.get(action);
    return strategy?.automated ?? false;
  }

  /**
   * Get user-friendly instructions for manual recovery actions
   */
  static getManualRecoveryInstructions(action: RecoveryAction, error: ConversionError): string {
    switch (action) {
      case RecoveryAction.CHECK_CHARACTER_ID:
        return 'Please verify that your character ID is correct. You can copy it from your D&D Beyond character URL (e.g., dndbeyond.com/characters/12345678).';
      
      case RecoveryAction.CHECK_PRIVACY:
        return 'Make sure your character is set to "Public" in D&D Beyond. Go to your character sheet and check the privacy settings in the top-right corner.';
      
      case RecoveryAction.CHECK_NETWORK:
        return 'Please check your internet connection and try again. Make sure you can access D&D Beyond and other websites normally.';
      
      case RecoveryAction.REFRESH_PAGE:
        return 'Try refreshing this page (Ctrl+F5 or Cmd+R) and attempting the conversion again. This clears temporary issues.';
      
      case RecoveryAction.CONTACT_SUPPORT:
        return 'If this problem continues, please contact support with the error details shown above, including your character ID and browser information.';
      
      case RecoveryAction.USE_LEGACY:
        return 'Try using the legacy converter as an alternative. Click the "Use Legacy Version" link below - it may handle your character differently.';
      
      case RecoveryAction.TRY_DIFFERENT_FORMAT:
        return 'Try converting to a different output format (Fantasy Grounds, Foundry VTT, etc.). Some formats may work better with your specific character build.';

      case RecoveryAction.FIX_CHARACTER_ID:
        return 'The system will automatically attempt to fix common character ID formatting issues (removing spaces, extracting from URLs).';

      case RecoveryAction.EXTRACT_FROM_URL:
        return 'The system will try to extract the character ID from the D&D Beyond URL you provided.';

      case RecoveryAction.CLEAR_CACHE:
        return 'Clear your browser\'s cache and cookies for this site. This resolves issues with outdated or corrupted data.';

      case RecoveryAction.USE_ALTERNATIVE_API:
        return 'The system will attempt to use an alternative API endpoint to fetch your character data.';

      case RecoveryAction.RETRY_WITH_DELAY:
        return 'The system will retry the operation with a longer delay to handle temporary server issues.';

      case RecoveryAction.TRY_DIFFERENT_BROWSER:
        return 'Try using a different web browser (Chrome, Firefox, Safari, Edge) as some browsers handle the conversion better than others.';
      
      default:
        return 'Please follow the suggested recovery action or contact support for assistance.';
    }
  }

  /**
   * Get recovery statistics
   */
  static getStatistics(): RecoveryStatistics {
    const stats: RecoveryStatistics = {
      totalAttempts: this.recoveryAttempts.length,
      successfulRecoveries: this.recoveryAttempts.filter(a => a.result.success).length,
      recoveryByAction: {} as Record<RecoveryAction, { attempts: number; successes: number }>,
      averageRecoveryTime: 0,
      mostEffectiveActions: []
    };

    // Calculate statistics by action
    const actionStats: Record<string, { attempts: number; successes: number }> = {};
    
    for (const attempt of this.recoveryAttempts) {
      const actionKey = attempt.action;
      if (!actionStats[actionKey]) {
        actionStats[actionKey] = { attempts: 0, successes: 0 };
      }
      
      actionStats[actionKey].attempts++;
      if (attempt.result.success) {
        actionStats[actionKey].successes++;
      }
    }

    stats.recoveryByAction = actionStats as Record<RecoveryAction, { attempts: number; successes: number }>;

    // Find most effective actions
    stats.mostEffectiveActions = Object.entries(actionStats)
      .map(([action, data]) => ({
        action: action as RecoveryAction,
        successRate: data.attempts > 0 ? data.successes / data.attempts : 0
      }))
      .sort((a, b) => b.successRate - a.successRate)
      .slice(0, 3)
      .map(item => item.action);

    return stats;
  }

  /**
   * Register default recovery strategies
   */
  private static registerDefaultStrategies(): void {
    // Retry strategy - automated retry with exponential backoff
    this.strategies.set(RecoveryAction.RETRY, {
      action: RecoveryAction.RETRY,
      automated: true,
      maxAttempts: 3,
      delayBetweenAttempts: 1000,
      successCondition: (result) => result.success,
      handler: this.createRetryHandler()
    });

    // Network check - automated network connectivity verification
    this.strategies.set(RecoveryAction.CHECK_NETWORK, {
      action: RecoveryAction.CHECK_NETWORK,
      automated: true,
      maxAttempts: 1,
      delayBetweenAttempts: 0,
      successCondition: (result) => result.success,
      handler: this.createNetworkCheckHandler()
    });

    // Manual actions - these require user intervention
    this.strategies.set(RecoveryAction.CHECK_CHARACTER_ID, {
      action: RecoveryAction.CHECK_CHARACTER_ID,
      automated: false,
      maxAttempts: 1,
      delayBetweenAttempts: 0,
      successCondition: () => false,
      handler: this.createManualActionHandler()
    });

    this.strategies.set(RecoveryAction.CHECK_PRIVACY, {
      action: RecoveryAction.CHECK_PRIVACY,
      automated: false,
      maxAttempts: 1,
      delayBetweenAttempts: 0,
      successCondition: () => false,
      handler: this.createManualActionHandler()
    });

    this.strategies.set(RecoveryAction.REFRESH_PAGE, {
      action: RecoveryAction.REFRESH_PAGE,
      automated: false,
      maxAttempts: 1,
      delayBetweenAttempts: 0,
      successCondition: () => false,
      handler: this.createManualActionHandler()
    });

    this.strategies.set(RecoveryAction.USE_LEGACY, {
      action: RecoveryAction.USE_LEGACY,
      automated: false,
      maxAttempts: 1,
      delayBetweenAttempts: 0,
      successCondition: () => false,
      handler: this.createManualActionHandler()
    });

    this.strategies.set(RecoveryAction.TRY_DIFFERENT_FORMAT, {
      action: RecoveryAction.TRY_DIFFERENT_FORMAT,
      automated: false,
      maxAttempts: 1,
      delayBetweenAttempts: 0,
      successCondition: () => false,
      handler: this.createManualActionHandler()
    });

    this.strategies.set(RecoveryAction.CONTACT_SUPPORT, {
      action: RecoveryAction.CONTACT_SUPPORT,
      automated: false,
      maxAttempts: 1,
      delayBetweenAttempts: 0,
      successCondition: () => false,
      handler: this.createManualActionHandler()
    });

    // Character ID validation recovery - automated ID extraction and validation
    this.strategies.set(RecoveryAction.FIX_CHARACTER_ID, {
      action: RecoveryAction.FIX_CHARACTER_ID,
      automated: true,
      maxAttempts: 1,
      delayBetweenAttempts: 0,
      successCondition: (result) => result.success,
      handler: this.createCharacterIdFixHandler()
    });

    // URL parsing recovery - extract ID from various URL formats
    this.strategies.set(RecoveryAction.EXTRACT_FROM_URL, {
      action: RecoveryAction.EXTRACT_FROM_URL,
      automated: true,
      maxAttempts: 1,
      delayBetweenAttempts: 0,
      successCondition: (result) => result.success,
      handler: this.createUrlExtractionHandler()
    });

    // File processing recovery strategies
    this.strategies.set(RecoveryAction.RETRY_WITH_DELAY, {
      action: RecoveryAction.RETRY_WITH_DELAY,
      automated: true,
      maxAttempts: 2,
      delayBetweenAttempts: 2000,
      successCondition: (result) => result.success,
      handler: this.createDelayedRetryHandler()
    });

    this.strategies.set(RecoveryAction.USE_ALTERNATIVE_API, {
      action: RecoveryAction.USE_ALTERNATIVE_API,
      automated: true,
      maxAttempts: 1,
      delayBetweenAttempts: 0,
      successCondition: (result) => result.success,
      handler: this.createAlternativeApiHandler()
    });

    this.strategies.set(RecoveryAction.CLEAR_CACHE, {
      action: RecoveryAction.CLEAR_CACHE,
      automated: false, // Requires user action but provides instructions
      maxAttempts: 1,
      delayBetweenAttempts: 0,
      successCondition: () => false,
      handler: this.createClearCacheHandler()
    });
  }

  /**
   * Create retry handler for automated retries with smart logic
   */
  private static createRetryHandler(): RecoveryHandler {
    return async (error: ConversionError, context: ErrorContext, attempt: number): Promise<RecoveryResult> => {
      // Enhanced retry logic with different strategies per error type
      if (error.category === ErrorCategory.API) {
        // API-specific retry with exponential backoff
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 30000);
        
        try {
          // Try to perform the actual retry based on context
          const result = await this.performAPIRetry(context, attempt);
          
          return {
            success: result.success,
            action: RecoveryAction.RETRY,
            message: result.success 
              ? `Retry attempt ${attempt} succeeded`
              : `Retry attempt ${attempt} failed, next retry in ${delay}ms`,
            shouldRetry: !result.success && attempt < 3,
            retryDelay: result.success ? 0 : delay,
            metadata: {
              attempt,
              nextDelay: delay,
              lastError: result.error
            }
          };
        } catch (retryError) {
          return {
            success: false,
            action: RecoveryAction.RETRY,
            message: `Retry attempt ${attempt} failed: ${retryError instanceof Error ? retryError.message : 'Unknown error'}`,
            shouldRetry: attempt < 3,
            retryDelay: delay,
            metadata: { attempt, retryError: String(retryError) }
          };
        }
      }
      
      if (error.category === ErrorCategory.PROCESSING) {
        // Processing errors might benefit from a single retry
        try {
          const result = await this.performProcessingRetry(context);
          return {
            success: result.success,
            action: RecoveryAction.RETRY,
            message: result.success ? 'Processing retry succeeded' : 'Processing retry failed',
            shouldRetry: false, // Only one retry for processing errors
            metadata: { processingRetryResult: result }
          };
        } catch (retryError) {
          return {
            success: false,
            action: RecoveryAction.RETRY,
            message: 'Processing retry failed',
            shouldRetry: false,
            metadata: { retryError: String(retryError) }
          };
        }
      }
      
      return {
        success: false,
        action: RecoveryAction.RETRY,
        message: 'Error type not suitable for automatic retry',
        shouldRetry: false
      };
    };
  }

  /**
   * Perform actual API retry with intelligent routing
   */
  private static async performAPIRetry(context: ErrorContext, attempt: number): Promise<{success: boolean, error?: string}> {
    // Get the relevant service based on context
    if (context.component === 'CharacterConverter' || context.component === 'EnhancedCharacterConverter') {
      // Try to retry the character fetch
      try {
        const characterFacade = (window as any)?.characterConverterFacade;
        if (characterFacade && context.characterId) {
          const result = await characterFacade.convertFromDNDBeyond(context.characterId);
          return { success: result.success, error: result.error };
        }
      } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'API retry failed' };
      }
    }
    
    return { success: false, error: 'No retry mechanism available for this context' };
  }

  /**
   * Perform processing retry for processing errors
   */
  private static async performProcessingRetry(context: ErrorContext): Promise<{success: boolean, error?: string}> {
    // For processing errors, we might try alternative processing paths
    try {
      if (context.component === 'FileUploader' && context.metadata?.fileName) {
        // Could retry file processing with different settings
        console.log('🔄 Attempting file processing retry for:', context.metadata.fileName);
        // This would integrate with actual file processing retry logic
        return { success: false, error: 'File processing retry not yet implemented' };
      }
      
      if (context.component === 'SimpleFormatSelector') {
        // Could retry format conversion with fallback options
        console.log('🔄 Attempting format conversion retry');
        // This would integrate with actual format conversion retry logic
        return { success: false, error: 'Format conversion retry not yet implemented' };
      }
      
      return { success: false, error: 'No processing retry available for this context' };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Processing retry failed' };
    }
  }

  /**
   * Create character ID fix handler for automated ID validation and correction
   */
  private static createCharacterIdFixHandler(): RecoveryHandler {
    return async (error: ConversionError, context: ErrorContext, attempt: number): Promise<RecoveryResult> => {
      try {
        const characterId = context.characterId || context.metadata?.characterId;
        if (!characterId) {
          return {
            success: false,
            action: RecoveryAction.FIX_CHARACTER_ID,
            message: 'No character ID found to fix',
            shouldRetry: false
          };
        }

        // Try to clean and validate the character ID
        const cleanedId = this.cleanCharacterId(characterId);
        if (cleanedId && this.isValidCharacterId(cleanedId)) {
          // Update the UI component with the fixed ID
          this.updateCharacterIdInUI(cleanedId, context.component);
          
          return {
            success: true,
            action: RecoveryAction.FIX_CHARACTER_ID,
            message: `Character ID automatically fixed: ${cleanedId}`,
            shouldRetry: false,
            metadata: { originalId: characterId, fixedId: cleanedId }
          };
        }

        return {
          success: false,
          action: RecoveryAction.FIX_CHARACTER_ID,
          message: 'Unable to automatically fix character ID',
          shouldRetry: false,
          metadata: { triedToFix: characterId }
        };
      } catch (error) {
        return {
          success: false,
          action: RecoveryAction.FIX_CHARACTER_ID,
          message: 'Error during ID fix attempt',
          shouldRetry: false,
          metadata: { error: String(error) }
        };
      }
    };
  }

  /**
   * Create URL extraction handler for extracting character ID from various URL formats
   */
  private static createUrlExtractionHandler(): RecoveryHandler {
    return async (error: ConversionError, context: ErrorContext, attempt: number): Promise<RecoveryResult> => {
      try {
        const input = context.characterId || context.metadata?.characterId || '';
        
        // Try multiple URL pattern matches
        const patterns = [
          /dndbeyond\.com\/characters\/(\d+)/i,
          /character\/(\d+)/i,
          /characters\/(\d+)/i,
          /\/(\d{8,12})\/?/,
          /character_id=(\d+)/i,
          /id=(\d+)/i
        ];

        for (const pattern of patterns) {
          const match = input.match(pattern);
          if (match && match[1]) {
            const extractedId = match[1];
            if (this.isValidCharacterId(extractedId)) {
              // Update the UI component with the extracted ID
              this.updateCharacterIdInUI(extractedId, context.component);
              
              return {
                success: true,
                action: RecoveryAction.EXTRACT_FROM_URL,
                message: `Character ID extracted from URL: ${extractedId}`,
                shouldRetry: false,
                metadata: { 
                  originalInput: input, 
                  extractedId: extractedId,
                  pattern: pattern.source
                }
              };
            }
          }
        }

        return {
          success: false,
          action: RecoveryAction.EXTRACT_FROM_URL,
          message: 'Unable to extract character ID from input',
          shouldRetry: false,
          metadata: { attemptedInput: input }
        };
      } catch (error) {
        return {
          success: false,
          action: RecoveryAction.EXTRACT_FROM_URL,
          message: 'Error during URL extraction',
          shouldRetry: false,
          metadata: { error: String(error) }
        };
      }
    };
  }

  /**
   * Clean character ID by removing common formatting issues
   */
  private static cleanCharacterId(id: string): string {
    return id
      .trim()
      .replace(/[^0-9]/g, '') // Remove all non-numeric characters
      .replace(/^0+/, ''); // Remove leading zeros
  }

  /**
   * Validate character ID format
   */
  private static isValidCharacterId(id: string): boolean {
    return /^\d{8,12}$/.test(id);
  }

  /**
   * Update character ID in the relevant UI component
   */
  private static updateCharacterIdInUI(characterId: string, componentName?: string): void {
    try {
      if (componentName === 'CharacterConverter' || componentName === 'EnhancedCharacterConverter') {
        // Find the character converter component and update its ID
        const converterElements = document.querySelectorAll('[x-data*="characterConverter"], [x-data*="enhancedCharacterConverter"]');
        
        for (const element of converterElements) {
          const alpineData = (element as any)?._x_dataStack?.[0];
          if (alpineData && typeof alpineData.characterId !== 'undefined') {
            alpineData.characterId = characterId;
            alpineData.validateCharacterId?.();
            console.log(`✅ Updated character ID in ${componentName}:`, characterId);
            break;
          }
        }

        // Also update any input fields
        const inputElements = document.querySelectorAll('input[x-model="characterId"]');
        for (const input of inputElements) {
          (input as HTMLInputElement).value = characterId;
          input.dispatchEvent(new Event('input', { bubbles: true }));
        }
      }
    } catch (error) {
      console.warn('Failed to update character ID in UI:', error);
    }
  }

  /**
   * Create delayed retry handler for file processing and conversion errors
   */
  private static createDelayedRetryHandler(): RecoveryHandler {
    return async (error: ConversionError, context: ErrorContext, attempt: number): Promise<RecoveryResult> => {
      try {
        // Add a longer delay for file processing retries
        const delay = Math.min(2000 * attempt, 10000); // 2s, 4s, 6s... up to 10s
        
        await new Promise(resolve => setTimeout(resolve, delay));
        
        // Attempt the retry based on the context
        if (context.component === 'FileUploader') {
          return {
            success: false, // Would be determined by actual retry
            action: RecoveryAction.RETRY_WITH_DELAY,
            message: `File processing retry attempt ${attempt} after ${delay}ms delay`,
            shouldRetry: attempt < 2,
            retryDelay: delay,
            metadata: { attempt, delay, component: context.component }
          };
        }
        
        if (context.component === 'SimpleFormatSelector') {
          return {
            success: false, // Would be determined by actual retry
            action: RecoveryAction.RETRY_WITH_DELAY,
            message: `Format conversion retry attempt ${attempt} after ${delay}ms delay`,
            shouldRetry: attempt < 2,
            retryDelay: delay,
            metadata: { attempt, delay, component: context.component }
          };
        }
        
        return {
          success: false,
          action: RecoveryAction.RETRY_WITH_DELAY,
          message: 'Delayed retry not applicable to this operation',
          shouldRetry: false
        };
      } catch (error) {
        return {
          success: false,
          action: RecoveryAction.RETRY_WITH_DELAY,
          message: 'Delayed retry failed',
          shouldRetry: false,
          metadata: { error: String(error) }
        };
      }
    };
  }

  /**
   * Create alternative API handler for trying different endpoints or methods
   */
  private static createAlternativeApiHandler(): RecoveryHandler {
    return async (error: ConversionError, context: ErrorContext, attempt: number): Promise<RecoveryResult> => {
      try {
        // For API errors, try alternative approaches
        if (error.category === ErrorCategory.API && context.characterId) {
          // Could try different CORS proxies or API endpoints
          const alternativeEndpoints = [
            'https://character-service.dndbeyond.com/character/v5/character/',
            'https://www.dndbeyond.com/character/v5/character/'
          ];
          
          // This would integrate with actual API retry logic using alternative endpoints
          return {
            success: false, // Would be determined by actual API call
            action: RecoveryAction.USE_ALTERNATIVE_API,
            message: 'Attempting alternative API endpoint',
            shouldRetry: false,
            metadata: { 
              characterId: context.characterId,
              alternativeEndpoints,
              originalError: error.message
            }
          };
        }
        
        return {
          success: false,
          action: RecoveryAction.USE_ALTERNATIVE_API,
          message: 'No alternative API available for this operation',
          shouldRetry: false
        };
      } catch (error) {
        return {
          success: false,
          action: RecoveryAction.USE_ALTERNATIVE_API,
          message: 'Alternative API attempt failed',
          shouldRetry: false,
          metadata: { error: String(error) }
        };
      }
    };
  }

  /**
   * Create cache clearing handler with user instructions
   */
  private static createClearCacheHandler(): RecoveryHandler {
    return async (error: ConversionError, context: ErrorContext, attempt: number): Promise<RecoveryResult> => {
      // This is a manual action that provides instructions to the user
      const instructions = this.getCacheClearInstructions();
      
      return {
        success: false, // Manual action, user must perform
        action: RecoveryAction.CLEAR_CACHE,
        message: 'Clear your browser cache and cookies, then try again',
        shouldRetry: false,
        metadata: { 
          instructions,
          browserDetected: this.detectBrowser()
        }
      };
    };
  }

  /**
   * Get browser-specific cache clearing instructions
   */
  private static getCacheClearInstructions(): string[] {
    const browser = this.detectBrowser();
    
    switch (browser) {
      case 'chrome':
        return [
          '1. Press Ctrl+Shift+Delete (Windows) or Cmd+Shift+Delete (Mac)',
          '2. Select "Cached images and files" and "Cookies and other site data"',
          '3. Click "Clear data"',
          '4. Refresh this page and try again'
        ];
      case 'firefox':
        return [
          '1. Press Ctrl+Shift+Delete (Windows) or Cmd+Shift+Delete (Mac)',
          '2. Select "Cache" and "Cookies"',
          '3. Click "Clear Now"',
          '4. Refresh this page and try again'
        ];
      case 'safari':
        return [
          '1. Press Cmd+Option+E to empty caches',
          '2. Go to Safari > Preferences > Privacy > Manage Website Data',
          '3. Click "Remove All"',
          '4. Refresh this page and try again'
        ];
      default:
        return [
          '1. Open your browser settings',
          '2. Find "Clear browsing data" or "Clear cache and cookies"',
          '3. Select cache and cookies for this site',
          '4. Clear the data and refresh this page'
        ];
    }
  }

  /**
   * Simple browser detection for targeted instructions
   */
  private static detectBrowser(): string {
    if (typeof window === 'undefined') return 'unknown';
    
    const userAgent = window.navigator.userAgent.toLowerCase();
    
    if (userAgent.includes('chrome') && !userAgent.includes('edg')) return 'chrome';
    if (userAgent.includes('firefox')) return 'firefox';
    if (userAgent.includes('safari') && !userAgent.includes('chrome')) return 'safari';
    if (userAgent.includes('edg')) return 'edge';
    
    return 'unknown';
  }

  /**
   * Create network check handler
   */
  private static createNetworkCheckHandler(): RecoveryHandler {
    return async (error: ConversionError, context: ErrorContext, attempt: number): Promise<RecoveryResult> => {
      try {
        // Simple network connectivity check
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch('https://www.dndbeyond.com/favicon.ico', {
          method: 'HEAD',
          signal: controller.signal,
          cache: 'no-cache'
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          return {
            success: true,
            action: RecoveryAction.CHECK_NETWORK,
            message: 'Network connectivity confirmed',
            shouldRetry: false,
            metadata: {
              networkLatency: Date.now() // Could calculate actual latency
            }
          };
        } else {
          return {
            success: false,
            action: RecoveryAction.CHECK_NETWORK,
            message: 'Network connectivity issues detected',
            shouldRetry: false,
            metadata: {
              httpStatus: response.status
            }
          };
        }
        
      } catch (networkError) {
        return {
          success: false,
          action: RecoveryAction.CHECK_NETWORK,
          message: networkError instanceof Error ? networkError.message : 'Network check failed',
          shouldRetry: false,
          metadata: {
            networkError: networkError instanceof Error ? networkError.message : 'Unknown error'
          }
        };
      }
    };
  }

  /**
   * Create manual action handler (non-automated actions)
   */
  private static createManualActionHandler(): RecoveryHandler {
    return async (error: ConversionError, context: ErrorContext, attempt: number): Promise<RecoveryResult> => {
      return {
        success: false,
        action: error.recoveryActions[0] || RecoveryAction.CONTACT_SUPPORT,
        message: 'Manual user action required',
        shouldRetry: false,
        metadata: {
          requiresUserAction: true
        }
      };
    };
  }

  /**
   * Track recovery attempt for statistics
   */
  private static trackRecoveryAttempt(
    errorId: string,
    action: RecoveryAction,
    attempt: number,
    result: RecoveryResult
  ): void {
    const recoveryAttempt: RecoveryAttempt = {
      errorId,
      action,
      attempt,
      timestamp: new Date(),
      result
    };

    this.recoveryAttempts.push(recoveryAttempt);

    // Keep only the most recent attempts
    if (this.recoveryAttempts.length > this.MAX_HISTORY) {
      this.recoveryAttempts = this.recoveryAttempts.slice(-this.MAX_HISTORY);
    }

    if (featureFlags.isEnabled('recovery_strategies_debug')) {
      console.log('🔧 RecoveryStrategies: Tracked recovery attempt:', {
        errorId,
        action,
        attempt,
        success: result.success
      });
    }
  }

  /**
   * Utility delay function
   */
  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Register a custom recovery strategy
   */
  static registerStrategy(strategy: RecoveryStrategy): void {
    this.strategies.set(strategy.action, strategy);
    
    if (featureFlags.isEnabled('recovery_strategies_debug')) {
      console.log('🔧 RecoveryStrategies: Registered custom strategy:', strategy.action);
    }
  }

  /**
   * Remove a recovery strategy
   */
  static unregisterStrategy(action: RecoveryAction): void {
    this.strategies.delete(action);
    
    if (featureFlags.isEnabled('recovery_strategies_debug')) {
      console.log('🔧 RecoveryStrategies: Unregistered strategy:', action);
    }
  }

  /**
   * Get all registered strategies
   */
  static getRegisteredStrategies(): RecoveryAction[] {
    return Array.from(this.strategies.keys());
  }

  /**
   * Clear recovery attempt history
   */
  static clearHistory(): void {
    this.recoveryAttempts = [];
    
    if (featureFlags.isEnabled('recovery_strategies_debug')) {
      console.log('🔧 RecoveryStrategies: Cleared recovery history');
    }
  }
}