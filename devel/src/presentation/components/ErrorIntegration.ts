/**
 * Error Integration Component
 * 
 * Bridges the centralized ErrorService with the UI components to provide
 * seamless error handling throughout the application. This component
 * automatically listens for errors and displays them to users with
 * appropriate recovery actions.
 */

import { errorService, ErrorServiceEvent } from '@/shared/errors/ErrorService';
import { createErrorDisplay } from './ErrorDisplay';
import { featureFlags } from '@/core/FeatureFlags';
import type { ConversionError } from '@/shared/errors/ConversionErrors';

/**
 * Error integration configuration
 */
interface ErrorIntegrationConfig {
  autoShow: boolean;
  showOnlyUserActionable: boolean;
  enableGlobalErrorHandler: boolean;
  debugMode: boolean;
}

/**
 * Error Integration Service
 */
export class ErrorIntegration {
  private static instance: ErrorIntegration;
  private errorDisplay: any; // Alpine component instance
  private config: ErrorIntegrationConfig;
  private isInitialized = false;

  private constructor(config: Partial<ErrorIntegrationConfig> = {}) {
    this.config = {
      autoShow: true,
      showOnlyUserActionable: true,
      enableGlobalErrorHandler: true,
      debugMode: featureFlags.isEnabled('error_integration_debug'),
      ...config
    };
  }

  /**
   * Get singleton instance
   */
  static getInstance(config?: Partial<ErrorIntegrationConfig>): ErrorIntegration {
    if (!ErrorIntegration.instance) {
      ErrorIntegration.instance = new ErrorIntegration(config);
    }
    return ErrorIntegration.instance;
  }

  /**
   * Initialize error integration
   */
  initialize(): void {
    if (this.isInitialized) {
      return;
    }

    if (this.config.debugMode) {
      console.log('🔗 ErrorIntegration: Initializing error display integration');
    }

    // Set up error service listeners
    this.setupErrorServiceListeners();

    // Set up global error display
    this.setupGlobalErrorDisplay();

    // Set up global error handlers if enabled
    if (this.config.enableGlobalErrorHandler) {
      this.setupGlobalErrorHandlers();
    }

    this.isInitialized = true;

    if (this.config.debugMode) {
      console.log('🔗 ErrorIntegration: Initialization complete');
    }
  }

  /**
   * Set up error service event listeners
   */
  private setupErrorServiceListeners(): void {
    // Listen for error occurred events
    errorService.addEventListener(ErrorServiceEvent.ERROR_OCCURRED, (error, context) => {
      if (this.config.debugMode) {
        console.log('🔗 ErrorIntegration: Received error event', {
          errorId: error.id,
          category: error.category,
          severity: error.severity,
          userActionable: error.userActionable
        });
      }

      // Only show user-actionable errors if configured
      if (this.config.showOnlyUserActionable && !error.userActionable) {
        return;
      }

      // Auto-show error if configured
      if (this.config.autoShow && this.errorDisplay) {
        this.showError(error);
      }
    });

    // Listen for error recovery events
    errorService.addEventListener(ErrorServiceEvent.ERROR_RECOVERED, (error, context) => {
      if (this.config.debugMode) {
        console.log('🔗 ErrorIntegration: Error recovered', {
          errorId: error.id
        });
      }

      // Hide error display if it's showing this error
      if (this.errorDisplay && this.errorDisplay.currentError?.id === error.id) {
        this.hideError();
      }
    });

    // Listen for recovery attempt events for progress updates
    errorService.addEventListener(ErrorServiceEvent.RECOVERY_ATTEMPTED, (error, context) => {
      if (this.config.debugMode) {
        console.log('🔗 ErrorIntegration: Recovery attempted', {
          errorId: error.id
        });
      }
    });
  }

  /**
   * Set up global error display
   */
  private setupGlobalErrorDisplay(): void {
    // Create error display container if it doesn't exist
    let container = document.getElementById('global-error-display');
    if (!container) {
      container = document.createElement('div');
      container.id = 'global-error-display';
      container.setAttribute('x-data', 'createErrorDisplay()');
      document.body.appendChild(container);
    }

    // Initialize Alpine component if not already done
    if (typeof Alpine !== 'undefined' && !this.errorDisplay) {
      // Wait for Alpine to be ready
      document.addEventListener('alpine:init', () => {
        this.errorDisplay = Alpine.$data(container);
      });
    }
  }

  /**
   * Set up global error handlers
   */
  private setupGlobalErrorHandlers(): void {
    if (typeof window === 'undefined') {
      return; // Server-side environment
    }

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      if (this.config.debugMode) {
        console.warn('🔗 ErrorIntegration: Unhandled promise rejection captured', event.reason);
      }

      // Prevent default browser handling
      event.preventDefault();

      // Let the error service handle it
      if (event.reason instanceof Error) {
        errorService.handleError(event.reason, {
          step: 'unhandled_promise_rejection',
          component: 'GlobalErrorHandler'
        });
      }
    });

    // Handle uncaught JavaScript errors
    window.addEventListener('error', (event) => {
      if (this.config.debugMode) {
        console.warn('🔗 ErrorIntegration: Uncaught error captured', event.error);
      }

      if (event.error instanceof Error) {
        errorService.handleError(event.error, {
          step: 'uncaught_javascript_error',
          component: 'GlobalErrorHandler',
          metadata: {
            filename: event.filename,
            line: event.lineno,
            column: event.colno
          }
        });
      }
    });
  }

  /**
   * Manually show an error
   */
  showError(error: ConversionError): void {
    if (!this.errorDisplay) {
      console.error('🔗 ErrorIntegration: Error display not initialized');
      return;
    }

    this.errorDisplay.showError(error);
  }

  /**
   * Manually hide the current error
   */
  hideError(): void {
    if (this.errorDisplay) {
      this.errorDisplay.hideError();
    }
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<ErrorIntegrationConfig>): void {
    this.config = { ...this.config, ...config };

    if (this.config.debugMode) {
      console.log('🔗 ErrorIntegration: Configuration updated', this.config);
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): ErrorIntegrationConfig {
    return { ...this.config };
  }

  /**
   * Get error statistics from the service
   */
  getErrorStatistics() {
    return errorService.getErrorStatistics();
  }

  /**
   * Clear error history
   */
  clearErrorHistory(): void {
    errorService.clearErrorHistory();

    if (this.config.debugMode) {
      console.log('🔗 ErrorIntegration: Error history cleared');
    }
  }

  /**
   * Test error display (for development)
   */
  testErrorDisplay(): void {
    if (!this.config.debugMode) {
      console.warn('🔗 ErrorIntegration: Test error display only available in debug mode');
      return;
    }

    // Create a test error
    errorService.handleError(new Error('This is a test error for development purposes'), {
      step: 'test_error',
      component: 'ErrorIntegration',
      metadata: { isTest: true }
    });
  }
}

/**
 * Create and initialize error integration
 */
export const initializeErrorIntegration = (config?: Partial<ErrorIntegrationConfig>): ErrorIntegration => {
  const integration = ErrorIntegration.getInstance(config);
  integration.initialize();
  return integration;
};

/**
 * Global error integration instance
 */
export const errorIntegration = ErrorIntegration.getInstance();

/**
 * Alpine.js store for error integration (if using stores)
 */
export const errorIntegrationStore = () => ({
  integration: errorIntegration,
  
  init() {
    this.integration.initialize();
  },
  
  showError(error: ConversionError) {
    this.integration.showError(error);
  },
  
  hideError() {
    this.integration.hideError();
  },
  
  getStatistics() {
    return this.integration.getErrorStatistics();
  }
});

// Auto-initialize if in browser environment
if (typeof window !== 'undefined') {
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      errorIntegration.initialize();
    });
  } else {
    errorIntegration.initialize();
  }
}