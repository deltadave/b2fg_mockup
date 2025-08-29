/**
 * Error Display Component
 * 
 * Alpine.js component for displaying user-friendly error messages with
 * recovery actions and detailed information. Integrates with the centralized
 * ErrorService to provide consistent error experience across the application.
 */

import { 
  ConversionError, 
  ErrorSeverity, 
  ErrorCategory,
  RecoveryAction,
  ErrorUtils 
} from '@/shared/errors/ConversionErrors';
import { errorService, ErrorService, ErrorServiceEvent } from '@/shared/errors/ErrorService';
import { RecoveryStrategies } from '@/shared/errors/RecoveryStrategies';
import { featureFlags } from '@/core/FeatureFlags';
import Alpine from 'alpinejs';

/**
 * Error display component state interface
 */
export interface ErrorDisplayState {
  // Current error
  currentError: ConversionError | null;
  
  // Display state
  isVisible: boolean;
  isExpanded: boolean;
  showTechnicalDetails: boolean;
  
  // Recovery state
  isRecovering: boolean;
  recoveryResults: any[];
  availableActions: RecoveryAction[];
  
  // User interaction
  userFeedbackText: string;
  showFeedbackForm: boolean;
  
  // Animation and timing
  autoHideTimer: number | null;
  fadeOutTimer: number | null;
}

/**
 * Error display configuration
 */
export interface ErrorDisplayConfig {
  autoHide: boolean;
  autoHideDelay: number;
  maxRetries: number;
  showRecoveryActions: boolean;
  allowUserFeedback: boolean;
  showTechnicalDetails: boolean;
}

/**
 * Alpine.js Error Display Component
 */
export const errorDisplayComponent = () => ({
  // Component state
  currentError: null as ConversionError | null,
  isVisible: false,
  isExpanded: false,
  showTechnicalDetails: false,
  isRecovering: false,
  recoveryResults: [] as any[],
  availableActions: [] as RecoveryAction[],
  userFeedbackText: '',
  showFeedbackForm: false,
  autoHideTimer: null as number | null,
  fadeOutTimer: null as number | null,
  autoHideProgress: 0,
  autoHideEnabled: false,

  // Configuration
  config: {
    autoHide: false,
    autoHideDelay: 10000, // 10 seconds
    maxRetries: 3,
    showRecoveryActions: true,
    allowUserFeedback: true,
    showTechnicalDetails: featureFlags.isEnabled('error_display_debug')
  } as ErrorDisplayConfig,

  // Lifecycle methods
  init() {
    this.setupErrorServiceListeners();
    this.setupKeyboardHandlers();
    
    if (featureFlags.isEnabled('error_display_debug')) {
      console.log('🎭 ErrorDisplay: Component initialized');
    }
  },

  destroy() {
    this.clearTimers();
    // Event listeners would be cleaned up here if needed
  },

  // Error display methods
  showError(error: ConversionError) {
    this.currentError = error;
    this.isVisible = true;
    this.isExpanded = false;
    this.showTechnicalDetails = false;
    this.recoveryResults = [];
    
    // Get available recovery actions
    this.availableActions = RecoveryStrategies.getAvailableActions(error);
    
    // Setup auto-hide for low severity errors
    if (this.config.autoHide && this.shouldAutoHide(error)) {
      this.setupAutoHide();
    }
    
    // Focus management for accessibility
    this.$nextTick(() => {
      const errorElement = this.$el.querySelector('[data-error-focus]');
      if (errorElement) {
        (errorElement as HTMLElement).focus();
      }
    });

    if (featureFlags.isEnabled('error_display_debug')) {
      console.log('🎭 ErrorDisplay: Showing error', {
        errorId: error.id,
        category: error.category,
        severity: error.severity
      });
    }
  },

  hideError() {
    this.clearTimers();
    
    // Fade out animation
    this.fadeOutTimer = window.setTimeout(() => {
      this.isVisible = false;
      this.currentError = null;
      this.recoveryResults = [];
      this.availableActions = [];
      this.userFeedbackText = '';
      this.showFeedbackForm = false;
    }, 300); // Match CSS transition duration
  },

  toggleExpanded() {
    this.isExpanded = !this.isExpanded;
    
    // If expanding and has technical details, scroll into view
    if (this.isExpanded && this.currentError?.technicalDetails) {
      this.$nextTick(() => {
        const technicalDetails = this.$el.querySelector('[data-technical-details]');
        if (technicalDetails) {
          technicalDetails.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      });
    }
  },

  toggleTechnicalDetails() {
    this.showTechnicalDetails = !this.showTechnicalDetails;
  },

  // Recovery action methods
  async performRecoveryAction(action: RecoveryAction) {
    if (!this.currentError) return;
    
    this.isRecovering = true;
    
    try {
      // Check if this is an automated action
      if (RecoveryStrategies.isAutomatedAction(action)) {
        const results = await errorService.attemptRecovery(
          this.currentError,
          { characterId: this.currentError.characterId, timestamp: new Date() },
          [action]
        );
        
        this.recoveryResults = results;
        
        // If recovery was successful, hide the error after a delay
        const successfulRecovery = results.find(r => r.success);
        if (successfulRecovery) {
          this.showSuccessMessage(`Recovery successful: ${successfulRecovery.message}`);
          setTimeout(() => this.hideError(), 2000);
        } else {
          this.showRecoveryResults(results);
        }
        
      } else {
        // Manual action - show instructions
        this.showManualRecoveryInstructions(action);
      }
      
    } catch (error) {
      console.error('🎭 ErrorDisplay: Recovery action failed:', error);
      this.showErrorMessage('Recovery attempt failed. Please try again or contact support.');
    } finally {
      this.isRecovering = false;
    }
  },

  // User feedback methods
  toggleFeedbackForm() {
    this.showFeedbackForm = !this.showFeedbackForm;
    
    if (this.showFeedbackForm) {
      this.$nextTick(() => {
        const textarea = this.$el.querySelector('[data-feedback-textarea]');
        if (textarea) {
          (textarea as HTMLTextAreaElement).focus();
        }
      });
    }
  },

  submitFeedback() {
    if (!this.currentError || !this.userFeedbackText.trim()) return;
    
    // Here you would submit feedback to your analytics/monitoring service
    this.logUserFeedback(this.currentError.id, this.userFeedbackText.trim());
    
    // Reset feedback form
    this.userFeedbackText = '';
    this.showFeedbackForm = false;
    
    this.showSuccessMessage('Thank you for your feedback!');
  },

  // Utility methods
  getSeverityClass(severity: ErrorSeverity): string {
    const baseClasses = 'px-4 py-3 rounded-lg border-l-4';
    
    switch (severity) {
      case ErrorSeverity.LOW:
        return `${baseClasses} bg-blue-50 border-blue-400 text-blue-800`;
      case ErrorSeverity.MEDIUM:
        return `${baseClasses} bg-yellow-50 border-yellow-400 text-yellow-800`;
      case ErrorSeverity.HIGH:
        return `${baseClasses} bg-orange-50 border-orange-400 text-orange-800`;
      case ErrorSeverity.CRITICAL:
        return `${baseClasses} bg-red-50 border-red-400 text-red-800`;
      default:
        return `${baseClasses} bg-gray-50 border-gray-400 text-gray-800`;
    }
  },

  getSeverityIcon(severity: ErrorSeverity): string {
    switch (severity) {
      case ErrorSeverity.LOW:
        return '🔵'; // Info
      case ErrorSeverity.MEDIUM:
        return '🟡'; // Warning
      case ErrorSeverity.HIGH:
        return '🟠'; // Error
      case ErrorSeverity.CRITICAL:
        return '🔴'; // Critical
      default:
        return '⚪'; // Unknown
    }
  },

  getCategoryDescription(category: ErrorCategory): string {
    switch (category) {
      case ErrorCategory.API:
        return 'Connection Issue';
      case ErrorCategory.VALIDATION:
        return 'Data Validation';
      case ErrorCategory.PROCESSING:
        return 'Processing Error';
      case ErrorCategory.OUTPUT:
        return 'Output Generation';
      case ErrorCategory.SYSTEM:
        return 'System Error';
      case ErrorCategory.USER_INPUT:
        return 'Input Error';
      default:
        return 'Unknown Issue';
    }
  },

  getRecoveryActionLabel(action: RecoveryAction): string {
    return ErrorUtils.getRecoveryActionDescription(action);
  },

  getRecoveryActionIcon(action: RecoveryAction): string {
    switch (action) {
      case RecoveryAction.RETRY:
        return '🔄';
      case RecoveryAction.CHECK_CHARACTER_ID:
        return '🔍';
      case RecoveryAction.CHECK_PRIVACY:
        return '🔓';
      case RecoveryAction.CHECK_NETWORK:
        return '🌐';
      case RecoveryAction.REFRESH_PAGE:
        return '↻';
      case RecoveryAction.USE_LEGACY:
        return '🔙';
      case RecoveryAction.TRY_DIFFERENT_FORMAT:
        return '📄';
      case RecoveryAction.CONTACT_SUPPORT:
        return '💬';
      default:
        return '❓';
    }
  },

  formatTimestamp(timestamp: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(timestamp);
  },

  // Private methods
  setupErrorServiceListeners() {
    errorService.addEventListener(ErrorServiceEvent.ERROR_OCCURRED, (error, context) => {
      // Only show user-actionable errors
      if (ErrorUtils.isUserActionable(error)) {
        this.showError(error);
      }
    });

    errorService.addEventListener(ErrorServiceEvent.ERROR_RECOVERED, (error, context) => {
      if (this.currentError?.id === error.id) {
        this.hideError();
      }
    });
  },

  setupKeyboardHandlers() {
    document.addEventListener('keydown', (event) => {
      if (!this.isVisible) return;
      
      // Escape key closes the error
      if (event.key === 'Escape') {
        this.hideError();
        event.preventDefault();
      }
      
      // Enter key on focused recovery action
      if (event.key === 'Enter' && (event.target as HTMLElement).dataset.recoveryAction) {
        const action = (event.target as HTMLElement).dataset.recoveryAction as RecoveryAction;
        this.performRecoveryAction(action);
        event.preventDefault();
      }
    });
  },

  setupAutoHide() {
    this.clearTimers();
    
    if (this.currentError && this.shouldAutoHide(this.currentError)) {
      this.autoHideEnabled = true;
      this.autoHideProgress = 0;
      
      // Update progress every 100ms
      const progressInterval = 100;
      const totalTime = this.config.autoHideDelay;
      const progressStep = (progressInterval / totalTime) * 100;
      
      const progressTimer = setInterval(() => {
        this.autoHideProgress += progressStep;
        
        if (this.autoHideProgress >= 100) {
          clearInterval(progressTimer);
          this.hideError();
        }
      }, progressInterval);
      
      this.autoHideTimer = progressTimer;
    }
  },

  shouldAutoHide(error: ConversionError): boolean {
    // Don't auto-hide critical errors or errors requiring user action
    return error.severity === ErrorSeverity.LOW && error.recoveryActions.length === 0;
  },

  clearTimers() {
    if (this.autoHideTimer) {
      clearInterval(this.autoHideTimer);
      this.autoHideTimer = null;
    }
    
    if (this.fadeOutTimer) {
      window.clearTimeout(this.fadeOutTimer);
      this.fadeOutTimer = null;
    }
    
    this.autoHideEnabled = false;
    this.autoHideProgress = 0;
  },

  showManualRecoveryInstructions(action: RecoveryAction) {
    const instructions = RecoveryStrategies.getManualRecoveryInstructions(action, this.currentError!);
    
    // Create a temporary success-style message with instructions
    this.showInfoMessage(instructions);
  },

  showSuccessMessage(message: string) {
    // This would integrate with a toast notification system
    console.log('✅ Success:', message);
  },

  showErrorMessage(message: string) {
    // This would integrate with a toast notification system
    console.error('❌ Error:', message);
  },

  showInfoMessage(message: string) {
    // This would integrate with a toast notification system
    console.info('ℹ️ Info:', message);
  },

  showRecoveryResults(results: any[]) {
    this.recoveryResults = results;
    
    // If all recovery attempts failed, show that information
    const allFailed = results.every(r => !r.success);
    if (allFailed) {
      this.showErrorMessage('All recovery attempts failed. Please try manual recovery actions.');
    }
  },

  logUserFeedback(errorId: string, feedback: string) {
    if (featureFlags.isEnabled('error_feedback_logging')) {
      console.log('📝 User feedback:', { errorId, feedback });
      // Here you would send to your analytics service
    }
  },

  // Computed properties (for template use)
  get hasRecoveryActions(): boolean {
    return this.availableActions.length > 0;
  },

  get hasTechnicalDetails(): boolean {
    return Boolean(this.currentError?.technicalDetails);
  },

  get canShowFeedback(): boolean {
    return this.config.allowUserFeedback && this.currentError?.severity !== ErrorSeverity.LOW;
  },

  get errorSeverityText(): string {
    return this.currentError ? ErrorUtils.getSeverityDescription(this.currentError.severity) : '';
  }
});

/**
 * Error display Alpine.js data function
 */
export const createErrorDisplay = (config?: Partial<ErrorDisplayConfig>) => {
  const component = errorDisplayComponent();
  
  if (config) {
    component.config = { ...component.config, ...config };
  }
  
  return component;
};

// Register Alpine.js component
Alpine.data('errorDisplay', createErrorDisplay);

// Support both names for backward compatibility
Alpine.data('createErrorDisplay', createErrorDisplay);