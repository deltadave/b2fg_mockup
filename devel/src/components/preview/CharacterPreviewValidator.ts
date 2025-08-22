/**
 * Character Preview Validator Component
 * 
 * Alpine.js component that provides real-time character validation feedback
 * with detailed accuracy indicators and integration with the progressive disclosure system.
 */

import Alpine from 'alpinejs';
import { 
  CharacterValidationEngine, 
  CharacterValidationReport, 
  SectionValidation, 
  ValidationResult,
  characterValidationEngine 
} from '../../domain/validation/CharacterValidationEngine';
import { DisclosureSection } from '../disclosure/ProgressiveDisclosure';

export interface ValidationIndicator {
  status: 'success' | 'warning' | 'error' | 'loading';
  percentage: number;
  message: string;
  icon: string;
  color: string;
}

export interface CharacterPreviewValidatorData {
  // Validation state
  validationReport: CharacterValidationReport | null;
  isValidating: boolean;
  validationError: string | null;
  
  // Character data
  characterData: any;
  sourceData: any;
  
  // UI state
  expandedSections: Set<string>;
  showValidationDetails: boolean;
  validationTriggerDelay: number;
  
  // Methods
  init(): void;
  validateCharacter(characterData: any, sourceData?: any): Promise<void>;
  validateSectionRealtime(sectionId: string, sectionData: any): Promise<void>;
  getValidationIndicator(section: SectionValidation): ValidationIndicator;
  getOverallIndicator(): ValidationIndicator;
  getSeverityIcon(severity: string): string;
  getSeverityColor(severity: string): string;
  formatAccuracyPercentage(accuracy: number): string;
  toggleSectionExpansion(sectionId: string): void;
  getValidationBadgeText(section: SectionValidation): string;
  getValidationTooltip(section: SectionValidation): string;
  resetValidation(): void;
  exportValidationReport(): void;
}

// Character Preview Validator Alpine.js component
Alpine.data('characterPreviewValidator', (): CharacterPreviewValidatorData => ({
  // Validation state
  validationReport: null,
  isValidating: false,
  validationError: null,
  
  // Character data
  characterData: null,
  sourceData: null,
  
  // UI state
  expandedSections: new Set(),
  showValidationDetails: false,
  validationTriggerDelay: 500, // ms delay for real-time validation

  // Initialize component
  init() {
    console.log('Character Preview Validator initialized');
    
    // Listen for character data changes from main converter
    window.addEventListener('characterDataLoaded', async (event: CustomEvent) => {
      const characterData = event.detail;
      if (characterData) {
        this.characterData = characterData;
        await this.validateCharacter(characterData);
      }
    });
    
    // Listen for character parsing completion
    window.addEventListener('characterParsingComplete', async (event: CustomEvent) => {
      const { characterData, sourceData } = event.detail;
      if (characterData) {
        this.characterData = characterData;
        this.sourceData = sourceData;
        await this.validateCharacter(characterData, sourceData);
      }
    });
    
    // Listen for conversion errors
    window.addEventListener('characterConversionError', (event: CustomEvent) => {
      this.validationError = event.detail.message || 'Character conversion failed';
      this.isValidating = false;
      this.validationReport = null;
    });
    
    // Listen for section updates (real-time validation)
    window.addEventListener('characterSectionUpdated', async (event: CustomEvent) => {
      const { sectionId, sectionData } = event.detail;
      if (sectionId && sectionData) {
        await this.validateSectionRealtime(sectionId, sectionData);
      }
    });
  },

  // Validate complete character data
  async validateCharacter(characterData: any, sourceData?: any): Promise<void> {
    if (!characterData) {
      this.validationError = 'No character data to validate';
      return;
    }

    this.isValidating = true;
    this.validationError = null;
    
    try {
      console.log('Starting character validation for:', characterData.name);
      
      const report = await characterValidationEngine.validateCharacter(
        characterData, 
        sourceData
      );
      
      this.validationReport = report;
      this.isValidating = false;
      
      console.log('Character validation completed:', {
        name: report.characterName,
        accuracy: report.overallAccuracy,
        status: report.overallStatus,
        sections: report.sections.length
      });
      
      // Dispatch validation completed event for other components
      window.dispatchEvent(new CustomEvent('characterValidationComplete', {
        detail: {
          report: report,
          characterData: characterData
        }
      }));
      
    } catch (error) {
      this.validationError = error instanceof Error 
        ? `Validation failed: ${error.message}`
        : 'Unknown validation error';
      this.isValidating = false;
      console.error('Character validation error:', error);
    }
  },

  // Real-time validation for individual sections
  async validateSectionRealtime(sectionId: string, sectionData: any): Promise<void> {
    if (!this.validationReport) return;
    
    try {
      const updatedSection = await characterValidationEngine.validateSectionRealtime(
        sectionId, 
        sectionData, 
        this.sourceData
      );
      
      // Update the specific section in the current report
      const sectionIndex = this.validationReport.sections.findIndex(
        section => section.sectionId === sectionId
      );
      
      if (sectionIndex >= 0) {
        this.validationReport.sections[sectionIndex] = updatedSection;
        
        // Recalculate overall accuracy
        this.recalculateOverallAccuracy();
        
        console.log(`Section ${sectionId} validation updated:`, {
          accuracy: updatedSection.overallAccuracy,
          status: updatedSection.status
        });
      }
      
    } catch (error) {
      console.error(`Real-time validation failed for section ${sectionId}:`, error);
    }
  },

  // Recalculate overall validation metrics
  recalculateOverallAccuracy(): void {
    if (!this.validationReport) return;
    
    const sections = this.validationReport.sections;
    if (sections.length === 0) return;
    
    // Calculate weighted average of section accuracies
    const totalAccuracy = sections.reduce((sum, section) => sum + section.overallAccuracy, 0);
    this.validationReport.overallAccuracy = Math.round(totalAccuracy / sections.length);
    
    // Update summary counts
    const summary = {
      totalItems: 0,
      validatedItems: 0,
      missingItems: 0,
      erroredItems: 0
    };
    
    sections.forEach(section => {
      summary.totalItems += section.itemCount.total;
      summary.validatedItems += section.itemCount.validated;
      summary.missingItems += section.itemCount.missing;
      summary.erroredItems += section.itemCount.errored;
    });
    
    this.validationReport.summary = summary;
    
    // Update overall status
    if (summary.erroredItems > 0 || this.validationReport.overallAccuracy < 70) {
      this.validationReport.overallStatus = 'error';
    } else if (summary.missingItems > 0 || this.validationReport.overallAccuracy < 90) {
      this.validationReport.overallStatus = 'warning';
    } else {
      this.validationReport.overallStatus = 'success';
    }
  },

  // Get validation indicator for a section
  getValidationIndicator(section: SectionValidation): ValidationIndicator {
    const percentage = section.overallAccuracy;
    const status = section.status;
    
    return {
      status,
      percentage,
      message: this.getValidationBadgeText(section),
      icon: this.getSeverityIcon(status),
      color: this.getSeverityColor(status)
    };
  },

  // Get overall validation indicator
  getOverallIndicator(): ValidationIndicator {
    if (this.isValidating) {
      return {
        status: 'loading',
        percentage: 0,
        message: 'Validating...',
        icon: 'sync',
        color: 'text-secondary-500'
      };
    }
    
    if (!this.validationReport) {
      return {
        status: 'error',
        percentage: 0,
        message: 'Not validated',
        icon: 'alert-circle',
        color: 'text-error'
      };
    }
    
    const report = this.validationReport;
    return {
      status: report.overallStatus,
      percentage: report.overallAccuracy,
      message: `${report.overallAccuracy}% accuracy`,
      icon: this.getSeverityIcon(report.overallStatus),
      color: this.getSeverityColor(report.overallStatus)
    };
  },

  // Get icon for severity level
  getSeverityIcon(severity: string): string {
    const iconMap: Record<string, string> = {
      'success': 'check-circle',
      'warning': 'alert-triangle',
      'error': 'x-circle',
      'info': 'info-circle',
      'loading': 'loader'
    };
    return iconMap[severity] || 'help-circle';
  },

  // Get color class for severity level
  getSeverityColor(severity: string): string {
    const colorMap: Record<string, string> = {
      'success': 'text-success',
      'warning': 'text-warning',
      'error': 'text-error',
      'info': 'text-info',
      'loading': 'text-secondary-500'
    };
    return colorMap[severity] || 'text-neutral-500';
  },

  // Format accuracy percentage with appropriate precision
  formatAccuracyPercentage(accuracy: number): string {
    if (accuracy === 100) return '100%';
    if (accuracy === 0) return '0%';
    return `${Math.round(accuracy)}%`;
  },

  // Toggle section expansion in validation details
  toggleSectionExpansion(sectionId: string): void {
    if (this.expandedSections.has(sectionId)) {
      this.expandedSections.delete(sectionId);
    } else {
      this.expandedSections.add(sectionId);
    }
  },

  // Get badge text for validation section
  getValidationBadgeText(section: SectionValidation): string {
    const { validated, missing, errored } = section.itemCount;
    
    if (errored > 0) {
      return `${errored} error${errored > 1 ? 's' : ''}`;
    }
    
    if (missing > 0) {
      return `${missing} missing`;
    }
    
    if (validated > 0) {
      return `${validated} verified`;
    }
    
    return 'No data';
  },

  // Get tooltip text for validation section
  getValidationTooltip(section: SectionValidation): string {
    const { total, validated, missing, errored } = section.itemCount;
    const accuracy = section.overallAccuracy;
    
    let tooltip = `${section.sectionName}\n`;
    tooltip += `Accuracy: ${accuracy}%\n`;
    tooltip += `Items: ${total} total, ${validated} validated`;
    
    if (missing > 0) {
      tooltip += `, ${missing} missing`;
    }
    
    if (errored > 0) {
      tooltip += `, ${errored} errors`;
    }
    
    return tooltip;
  },

  // Reset validation state
  resetValidation(): void {
    this.validationReport = null;
    this.isValidating = false;
    this.validationError = null;
    this.characterData = null;
    this.sourceData = null;
    this.expandedSections.clear();
    this.showValidationDetails = false;
  },

  // Export validation report as JSON
  exportValidationReport(): void {
    if (!this.validationReport) {
      console.warn('No validation report to export');
      return;
    }
    
    const reportData = {
      ...this.validationReport,
      exportedAt: new Date().toISOString(),
      version: '1.0'
    };
    
    const blob = new Blob([JSON.stringify(reportData, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${this.validationReport.characterName.replace(/\W/g, '_')}_validation_report.json`;
    link.click();
    
    URL.revokeObjectURL(url);
    
    console.log('Validation report exported for:', this.validationReport.characterName);
  }
}));

// Export validation utilities for use in templates
export const ValidationUtils = {
  /**
   * Generate CSS classes for validation status
   */
  getValidationClasses(status: string): string {
    const baseClasses = 'inline-flex items-center px-2 py-1 text-sm font-medium rounded-md';
    
    switch (status) {
      case 'success':
        return `${baseClasses} bg-success/10 text-success border border-success/20`;
      case 'warning':
        return `${baseClasses} bg-warning/10 text-warning border border-warning/20`;
      case 'error':
        return `${baseClasses} bg-error/10 text-error border border-error/20`;
      case 'loading':
        return `${baseClasses} bg-secondary-50 text-secondary-600 border border-secondary-200 animate-pulse`;
      default:
        return `${baseClasses} bg-neutral-100 text-neutral-600 border border-neutral-200`;
    }
  },

  /**
   * Generate progress bar classes for accuracy percentage
   */
  getProgressBarClasses(accuracy: number, status: string): string {
    let colorClass = 'bg-neutral-200';
    
    switch (status) {
      case 'success':
        colorClass = 'bg-success';
        break;
      case 'warning':
        colorClass = 'bg-warning';
        break;
      case 'error':
        colorClass = 'bg-error';
        break;
    }
    
    return `h-2 rounded-full transition-all duration-300 ease-out ${colorClass}`;
  },

  /**
   * Generate icon size classes
   */
  getIconClasses(size: 'sm' | 'md' | 'lg' = 'md'): string {
    const sizeMap = {
      sm: 'w-4 h-4',
      md: 'w-5 h-5',
      lg: 'w-6 h-6'
    };
    
    return `${sizeMap[size]} flex-shrink-0`;
  }
};

// Export for use in other components
export { ValidationIndicator, CharacterPreviewValidatorData };