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
        return 'Please verify that your character ID is correct. You can copy it from your D&D Beyond character URL.';
      
      case RecoveryAction.CHECK_PRIVACY:
        return 'Make sure your character is set to "Public" in D&D Beyond. Go to your character sheet and check the privacy settings.';
      
      case RecoveryAction.CHECK_NETWORK:
        return 'Please check your internet connection and try again. Make sure you can access other websites.';
      
      case RecoveryAction.REFRESH_PAGE:
        return 'Try refreshing this page and attempting the conversion again.';
      
      case RecoveryAction.CONTACT_SUPPORT:
        return 'If this problem continues, please contact support with the error details shown above.';
      
      case RecoveryAction.USE_LEGACY:
        return 'Try using the legacy converter as an alternative. It may handle your character differently.';
      
      case RecoveryAction.TRY_DIFFERENT_FORMAT:
        return 'Try converting to a different output format. Some formats may work better with your character.';
      
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
  }

  /**
   * Create retry handler for automated retries
   */
  private static createRetryHandler(): RecoveryHandler {
    return async (error: ConversionError, context: ErrorContext, attempt: number): Promise<RecoveryResult> => {
      // For API errors, we can try the request again
      if (error.category === ErrorCategory.API) {
        // This would integrate with the actual API retry logic
        // For now, we simulate a recovery attempt
        
        // Exponential backoff for retries
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 30000);
        
        return {
          success: false, // Would be determined by actual retry result
          action: RecoveryAction.RETRY,
          message: `Retry attempt ${attempt} scheduled`,
          shouldRetry: attempt < 3,
          retryDelay: delay,
          metadata: {
            attempt,
            nextDelay: delay
          }
        };
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