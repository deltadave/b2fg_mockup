/**
 * Validation UI Components
 * 
 * Reusable UI components for displaying validation states, progress indicators,
 * and detailed validation feedback within the character preview system.
 */

import Alpine from 'alpinejs';
import { ValidationIndicator } from './CharacterPreviewValidator';
import { SectionValidation, ValidationResult } from '../../domain/validation/CharacterValidationEngine';

export interface ValidationBadgeData {
  indicator: ValidationIndicator;
  size: 'sm' | 'md' | 'lg';
  showPercentage: boolean;
  clickable: boolean;
  onClick?: () => void;
}

export interface ValidationProgressData {
  percentage: number;
  status: string;
  animated: boolean;
  showLabel: boolean;
  label?: string;
}

export interface ValidationDetailsData {
  section: SectionValidation;
  expanded: boolean;
  maxHeight: number;
  showSuggestions: boolean;
}

/**
 * Validation Badge Component
 * Displays a compact validation indicator with status, percentage, and icon
 */
Alpine.data('validationBadge', (indicator: ValidationIndicator, options: Partial<ValidationBadgeData> = {}): ValidationBadgeData => ({
  indicator,
  size: options.size || 'md',
  showPercentage: options.showPercentage ?? true,
  clickable: options.clickable ?? false,
  onClick: options.onClick,

  get badgeClasses(): string {
    const sizeClasses = {
      sm: 'px-2 py-1 text-xs',
      md: 'px-3 py-1.5 text-sm',
      lg: 'px-4 py-2 text-base'
    };

    const statusClasses = this.getStatusClasses(this.indicator.status);
    const interactionClasses = this.clickable 
      ? 'cursor-pointer hover:opacity-80 transition-opacity duration-150' 
      : '';

    return `
      inline-flex items-center gap-2 font-medium rounded-lg
      ${sizeClasses[this.size]}
      ${statusClasses}
      ${interactionClasses}
    `.trim();
  },

  get iconClasses(): string {
    const sizeMap = {
      sm: 'w-3 h-3',
      md: 'w-4 h-4',
      lg: 'w-5 h-5'
    };
    
    return `${sizeMap[this.size]} ${this.indicator.color}`;
  },

  getStatusClasses(status: string): string {
    switch (status) {
      case 'success':
        return 'bg-success/10 text-success border border-success/20';
      case 'warning':
        return 'bg-warning/10 text-warning border border-warning/20';
      case 'error':
        return 'bg-error/10 text-error border border-error/20';
      case 'loading':
        return 'bg-secondary-50 text-secondary-600 border border-secondary-200';
      default:
        return 'bg-neutral-100 text-neutral-600 border border-neutral-200';
    }
  }
}));

/**
 * Validation Progress Bar Component
 * Shows validation progress with animated percentage and status colors
 */
Alpine.data('validationProgress', (percentage: number, status: string, options: Partial<ValidationProgressData> = {}): ValidationProgressData => ({
  percentage,
  status,
  animated: options.animated ?? true,
  showLabel: options.showLabel ?? true,
  label: options.label,

  get progressBarClasses(): string {
    const baseClasses = 'h-2 rounded-full transition-all duration-500 ease-out';
    const colorClass = this.getProgressColor(this.status);
    
    return `${baseClasses} ${colorClass}`;
  },

  get progressContainerClasses(): string {
    return 'w-full bg-neutral-200 rounded-full overflow-hidden';
  },

  get progressStyle(): string {
    const width = Math.max(0, Math.min(100, this.percentage));
    return `width: ${width}%;`;
  },

  get labelText(): string {
    return this.label || `${Math.round(this.percentage)}%`;
  },

  getProgressColor(status: string): string {
    switch (status) {
      case 'success':
        return 'bg-gradient-to-r from-success/80 to-success';
      case 'warning':
        return 'bg-gradient-to-r from-warning/80 to-warning';
      case 'error':
        return 'bg-gradient-to-r from-error/80 to-error';
      case 'loading':
        return 'bg-gradient-to-r from-secondary-400 to-secondary-500 animate-pulse';
      default:
        return 'bg-gradient-to-r from-neutral-400 to-neutral-500';
    }
  }
}));

/**
 * Validation Details Panel Component
 * Expandable panel showing detailed validation results with suggestions
 */
Alpine.data('validationDetails', (section: SectionValidation, options: Partial<ValidationDetailsData> = {}): ValidationDetailsData => ({
  section,
  expanded: options.expanded ?? false,
  maxHeight: options.maxHeight ?? 400,
  showSuggestions: options.showSuggestions ?? true,

  toggle() {
    this.expanded = !this.expanded;
  },

  get panelClasses(): string {
    const baseClasses = 'border rounded-lg overflow-hidden transition-all duration-300';
    const statusClasses = this.getSectionBorderClasses(this.section.status);
    
    return `${baseClasses} ${statusClasses}`;
  },

  get headerClasses(): string {
    const baseClasses = 'px-4 py-3 cursor-pointer select-none flex items-center justify-between';
    const statusClasses = this.getSectionHeaderClasses(this.section.status);
    
    return `${baseClasses} ${statusClasses}`;
  },

  get contentClasses(): string {
    return `
      px-4 py-3 border-t
      ${this.expanded ? 'block' : 'hidden'}
      ${this.getSectionContentClasses(this.section.status)}
    `.trim();
  },

  get contentStyle(): string {
    return this.expanded ? `max-height: ${this.maxHeight}px; overflow-y: auto;` : '';
  },

  getSectionBorderClasses(status: string): string {
    switch (status) {
      case 'success':
        return 'border-success/30';
      case 'warning':
        return 'border-warning/30';
      case 'error':
        return 'border-error/30';
      default:
        return 'border-neutral-300';
    }
  },

  getSectionHeaderClasses(status: string): string {
    switch (status) {
      case 'success':
        return 'bg-success/5 hover:bg-success/10';
      case 'warning':
        return 'bg-warning/5 hover:bg-warning/10';
      case 'error':
        return 'bg-error/5 hover:bg-error/10';
      default:
        return 'bg-neutral-50 hover:bg-neutral-100';
    }
  },

  getSectionContentClasses(status: string): string {
    switch (status) {
      case 'success':
        return 'bg-success/2 border-success/20';
      case 'warning':
        return 'bg-warning/2 border-warning/20';
      case 'error':
        return 'bg-error/2 border-error/20';
      default:
        return 'bg-neutral-25 border-neutral-200';
    }
  },

  getResultIcon(result: ValidationResult): string {
    switch (result.severity) {
      case 'success':
        return 'check-circle';
      case 'warning':
        return 'alert-triangle';
      case 'error':
        return 'x-circle';
      case 'info':
        return 'info-circle';
      default:
        return 'help-circle';
    }
  },

  getResultClasses(result: ValidationResult): string {
    const baseClasses = 'flex items-start gap-3 p-3 rounded-md mb-2 last:mb-0';
    
    switch (result.severity) {
      case 'success':
        return `${baseClasses} bg-success/10 border-l-4 border-success`;
      case 'warning':
        return `${baseClasses} bg-warning/10 border-l-4 border-warning`;
      case 'error':
        return `${baseClasses} bg-error/10 border-l-4 border-error`;
      case 'info':
        return `${baseClasses} bg-info/10 border-l-4 border-info`;
      default:
        return `${baseClasses} bg-neutral-100 border-l-4 border-neutral-400`;
    }
  }
}));

/**
 * Validation Summary Component
 * Shows overall validation metrics and key statistics
 */
Alpine.data('validationSummary', (report: any) => ({
  report,

  get summaryClasses(): string {
    const baseClasses = 'bg-white rounded-lg border shadow-sm p-6';
    const statusClasses = this.getSummaryBorderClass(this.report?.overallStatus);
    
    return `${baseClasses} ${statusClasses}`;
  },

  get statusIndicatorClasses(): string {
    const baseClasses = 'inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium';
    
    switch (this.report?.overallStatus) {
      case 'success':
        return `${baseClasses} bg-success/10 text-success`;
      case 'warning':
        return `${baseClasses} bg-warning/10 text-warning`;
      case 'error':
        return `${baseClasses} bg-error/10 text-error`;
      default:
        return `${baseClasses} bg-neutral-100 text-neutral-600`;
    }
  },

  get accuracyColor(): string {
    if (!this.report) return 'text-neutral-500';
    
    const accuracy = this.report.overallAccuracy;
    if (accuracy >= 90) return 'text-success';
    if (accuracy >= 70) return 'text-warning';
    return 'text-error';
  },

  getSummaryBorderClass(status: string): string {
    switch (status) {
      case 'success':
        return 'border-success/20';
      case 'warning':
        return 'border-warning/20';
      case 'error':
        return 'border-error/20';
      default:
        return 'border-neutral-200';
    }
  },

  formatTimestamp(timestamp: string): string {
    return new Date(timestamp).toLocaleString();
  }
}));

/**
 * Validation Action Button Component
 * Interactive buttons for validation actions (retry, export, etc.)
 */
Alpine.data('validationActionButton', (action: string, options: any = {}) => ({
  action,
  loading: options.loading || false,
  disabled: options.disabled || false,
  variant: options.variant || 'primary',
  size: options.size || 'md',

  async handleClick() {
    if (this.disabled || this.loading) return;
    
    this.loading = true;
    
    try {
      await (options.onClick || (() => {}))();
    } catch (error) {
      console.error(`Action ${this.action} failed:`, error);
    } finally {
      this.loading = false;
    }
  },

  get buttonClasses(): string {
    const baseClasses = 'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-200';
    
    const sizeClasses = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg'
    };

    const variantClasses = this.getVariantClasses(this.variant);
    const stateClasses = this.getStateClasses();

    return `
      ${baseClasses}
      ${sizeClasses[this.size]}
      ${variantClasses}
      ${stateClasses}
    `.trim();
  },

  getVariantClasses(variant: string): string {
    switch (variant) {
      case 'primary':
        return 'bg-primary-500 text-white hover:bg-primary-600 focus:ring-4 focus:ring-primary-200';
      case 'secondary':
        return 'bg-secondary-500 text-white hover:bg-secondary-600 focus:ring-4 focus:ring-secondary-200';
      case 'success':
        return 'bg-success text-white hover:opacity-90 focus:ring-4 focus:ring-success/20';
      case 'warning':
        return 'bg-warning text-white hover:opacity-90 focus:ring-4 focus:ring-warning/20';
      case 'error':
        return 'bg-error text-white hover:opacity-90 focus:ring-4 focus:ring-error/20';
      case 'outline':
        return 'border border-neutral-300 text-neutral-700 hover:bg-neutral-50 focus:ring-4 focus:ring-neutral-200';
      default:
        return 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 focus:ring-4 focus:ring-neutral-200';
    }
  },

  getStateClasses(): string {
    if (this.disabled) {
      return 'opacity-50 cursor-not-allowed';
    }
    
    if (this.loading) {
      return 'cursor-wait';
    }
    
    return 'cursor-pointer';
  },

  get iconClasses(): string {
    return 'w-4 h-4';
  }
}));

/**
 * Validation Tooltip Component
 * Hover tooltips for validation indicators and details
 */
Alpine.data('validationTooltip', (content: string, options: any = {}) => ({
  content,
  visible: false,
  position: options.position || 'top',
  delay: options.delay || 500,
  
  timeoutId: null,

  show() {
    if (this.timeoutId) clearTimeout(this.timeoutId);
    this.timeoutId = setTimeout(() => {
      this.visible = true;
    }, this.delay);
  },

  hide() {
    if (this.timeoutId) clearTimeout(this.timeoutId);
    this.visible = false;
  },

  get tooltipClasses(): string {
    const baseClasses = 'absolute z-50 px-3 py-2 text-sm text-white bg-dark-800 rounded-md shadow-lg whitespace-nowrap';
    const positionClasses = this.getPositionClasses(this.position);
    const visibilityClasses = this.visible 
      ? 'opacity-100 pointer-events-auto' 
      : 'opacity-0 pointer-events-none';
    
    return `
      ${baseClasses}
      ${positionClasses}
      ${visibilityClasses}
      transition-opacity duration-200
    `.trim();
  },

  getPositionClasses(position: string): string {
    switch (position) {
      case 'top':
        return 'bottom-full left-1/2 transform -translate-x-1/2 mb-2';
      case 'bottom':
        return 'top-full left-1/2 transform -translate-x-1/2 mt-2';
      case 'left':
        return 'right-full top-1/2 transform -translate-y-1/2 mr-2';
      case 'right':
        return 'left-full top-1/2 transform -translate-y-1/2 ml-2';
      default:
        return 'bottom-full left-1/2 transform -translate-x-1/2 mb-2';
    }
  }
}));

// Export utility functions for external use
export const ValidationUI = {
  /**
   * Create validation badge element
   */
  createBadge(indicator: ValidationIndicator, options: Partial<ValidationBadgeData> = {}): string {
    return `
      <div x-data="validationBadge(${JSON.stringify(indicator)}, ${JSON.stringify(options)})"
           :class="badgeClasses"
           ${options.clickable ? '@click="onClick && onClick()"' : ''}>
        <svg :class="iconClasses" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <use :href="'#icon-' + indicator.icon"></use>
        </svg>
        <span x-text="indicator.message"></span>
        <span x-show="showPercentage && indicator.percentage !== undefined" 
              x-text="'(' + indicator.percentage + '%)'"></span>
      </div>
    `;
  },

  /**
   * Create progress bar element
   */
  createProgressBar(percentage: number, status: string, options: Partial<ValidationProgressData> = {}): string {
    return `
      <div x-data="validationProgress(${percentage}, '${status}', ${JSON.stringify(options)})">
        <div x-show="showLabel" class="flex justify-between text-sm text-neutral-600 mb-2">
          <span x-text="labelText"></span>
          <span x-text="Math.round(percentage) + '%'"></span>
        </div>
        <div :class="progressContainerClasses">
          <div :class="progressBarClasses" :style="progressStyle"></div>
        </div>
      </div>
    `;
  }
};

// CSS for validation animations and transitions
export const ValidationCSS = `
  .validation-enter-active,
  .validation-leave-active {
    transition: all 0.3s ease;
  }
  
  .validation-enter-from {
    opacity: 0;
    transform: translateY(-10px);
  }
  
  .validation-leave-to {
    opacity: 0;
    transform: translateY(10px);
  }
  
  .validation-progress-shimmer {
    background: linear-gradient(90deg, 
      transparent 0%, 
      rgba(255, 255, 255, 0.4) 50%, 
      transparent 100%
    );
    animation: shimmer 1.5s infinite;
  }
  
  @keyframes shimmer {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }
  
  .validation-pulse {
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
`;

export default {
  ValidationBadgeData,
  ValidationProgressData,
  ValidationDetailsData,
  ValidationUI,
  ValidationCSS
};