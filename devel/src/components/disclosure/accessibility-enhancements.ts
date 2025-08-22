// Progressive Disclosure Accessibility Enhancements
// Ensures WCAG AA compliance and provides enhanced screen reader support

import { getAccessibilityManager } from '@/infrastructure/accessibility/AccessibilityManager';

export interface AccessibilityEnhancementOptions {
  enableLiveRegionAnnouncements: boolean;
  enableKeyboardShortcuts: boolean;
  enableFocusManagement: boolean;
  enableScreenReaderOptimization: boolean;
  announceContentSummary: boolean;
  announceLoadingStates: boolean;
}

export class DisclosureAccessibilityEnhancer {
  private accessibilityManager = getAccessibilityManager();
  private options: Required<AccessibilityEnhancementOptions>;
  private keyboardHandlers: Map<string, (event: KeyboardEvent) => void> = new Map();
  private initialized = false;

  constructor(options: Partial<AccessibilityEnhancementOptions> = {}) {
    this.options = {
      enableLiveRegionAnnouncements: true,
      enableKeyboardShortcuts: true,
      enableFocusManagement: true,
      enableScreenReaderOptimization: true,
      announceContentSummary: true,
      announceLoadingStates: true,
      ...options
    };
  }

  // Initialize accessibility enhancements
  initialize(): void {
    if (this.initialized) return;

    this.setupKeyboardNavigation();
    this.setupScreenReaderOptimizations();
    this.setupFocusManagement();
    this.setupLiveRegionSupport();
    
    this.initialized = true;
    console.log('Disclosure accessibility enhancements initialized');
  }

  // Setup comprehensive keyboard navigation
  private setupKeyboardNavigation(): void {
    if (!this.options.enableKeyboardShortcuts) return;

    // Register global keyboard shortcuts
    const globalHandler = (event: KeyboardEvent) => {
      // Alt + D: Focus first disclosure
      if (event.altKey && event.key.toLowerCase() === 'd') {
        event.preventDefault();
        this.focusFirstDisclosure();
      }

      // Alt + Shift + D: Focus last disclosure  
      if (event.altKey && event.shiftKey && event.key.toLowerCase() === 'd') {
        event.preventDefault();
        this.focusLastDisclosure();
      }

      // Ctrl + Alt + E: Expand all disclosures
      if (event.ctrlKey && event.altKey && event.key.toLowerCase() === 'e') {
        event.preventDefault();
        this.expandAllDisclosures();
      }

      // Ctrl + Alt + C: Collapse all disclosures
      if (event.ctrlKey && event.altKey && event.key.toLowerCase() === 'c') {
        event.preventDefault();
        this.collapseAllDisclosures();
      }
    };

    document.addEventListener('keydown', globalHandler);
    this.keyboardHandlers.set('global', globalHandler);
  }

  // Setup screen reader optimizations
  private setupScreenReaderOptimizations(): void {
    if (!this.options.enableScreenReaderOptimization) return;

    // Add enhanced ARIA descriptions
    this.addAriaDescriptions();
    
    // Add skip links for disclosure groups
    this.addDisclosureSkipLinks();
    
    // Optimize tab order
    this.optimizeTabOrder();
  }

  // Add comprehensive ARIA descriptions
  private addAriaDescriptions(): void {
    const disclosureTriggers = document.querySelectorAll('.disclosure-trigger');
    
    disclosureTriggers.forEach((trigger, index) => {
      const button = trigger as HTMLElement;
      const disclosureId = button.id || `disclosure-${index}`;
      const contentId = button.getAttribute('aria-controls') || `${disclosureId}-content`;
      
      // Add comprehensive aria-describedby
      const descriptionId = `${disclosureId}-description`;
      this.createAriaDescription(descriptionId, button, contentId);
      
      // Add role description for better screen reader understanding
      button.setAttribute('aria-roledescription', 'expandable section trigger');
      
      // Add live region updates
      button.addEventListener('click', () => {
        setTimeout(() => {
          this.announceDisclosureStateChange(button, disclosureId);
        }, 100);
      });
    });
  }

  // Create detailed ARIA description for disclosure trigger
  private createAriaDescription(descriptionId: string, trigger: HTMLElement, contentId: string): void {
    if (document.getElementById(descriptionId)) return;

    const description = document.createElement('div');
    description.id = descriptionId;
    description.className = 'sr-only';
    
    const isExpanded = trigger.getAttribute('aria-expanded') === 'true';
    const sectionTitle = trigger.querySelector('.disclosure-trigger-title')?.textContent || 'Section';
    const badge = trigger.querySelector('.disclosure-trigger-badge')?.textContent;
    
    let descriptionText = `${sectionTitle} section. `;
    if (badge) {
      descriptionText += `Contains ${badge} items. `;
    }
    descriptionText += `Press Enter or Space to ${isExpanded ? 'collapse' : 'expand'}.`;
    descriptionText += ' Use arrow keys to navigate between sections.';
    
    description.textContent = descriptionText;
    document.body.appendChild(description);
    
    trigger.setAttribute('aria-describedby', descriptionId);
  }

  // Add skip links for disclosure groups
  private addDisclosureSkipLinks(): void {
    const disclosureGroups = document.querySelectorAll('.disclosure-group');
    
    disclosureGroups.forEach((group, index) => {
      const groupId = `disclosure-group-${index}`;
      group.setAttribute('id', groupId);
      
      // Create skip link
      const skipLink = document.createElement('a');
      skipLink.href = `#${groupId}-end`;
      skipLink.className = 'skip-link disclosure-skip-link';
      skipLink.textContent = 'Skip disclosure group';
      skipLink.setAttribute('data-disclosure-skip', 'true');
      
      // Insert before group
      group.parentNode?.insertBefore(skipLink, group);
      
      // Create end anchor
      const endAnchor = document.createElement('div');
      endAnchor.id = `${groupId}-end`;
      endAnchor.className = 'disclosure-group-end sr-only';
      endAnchor.textContent = 'End of disclosure group';
      endAnchor.setAttribute('tabindex', '-1');
      
      // Insert after group
      group.parentNode?.insertBefore(endAnchor, group.nextSibling);
    });
  }

  // Optimize tab order for better keyboard navigation
  private optimizeTabOrder(): void {
    const disclosureTriggers = document.querySelectorAll('.disclosure-trigger');
    
    disclosureTriggers.forEach((trigger) => {
      // Ensure triggers are in tab order
      if (!trigger.hasAttribute('tabindex')) {
        trigger.setAttribute('tabindex', '0');
      }
      
      // Add keyboard event handling
      trigger.addEventListener('keydown', this.handleTriggerKeydown.bind(this));
    });
  }

  // Handle keyboard navigation for disclosure triggers
  private handleTriggerKeydown(event: KeyboardEvent): void {
    const trigger = event.target as HTMLElement;
    const allTriggers = Array.from(document.querySelectorAll('.disclosure-trigger'));
    const currentIndex = allTriggers.indexOf(trigger);
    
    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        event.preventDefault();
        this.focusDisclosureByIndex(currentIndex + 1);
        break;
        
      case 'ArrowUp':  
      case 'ArrowLeft':
        event.preventDefault();
        this.focusDisclosureByIndex(currentIndex - 1);
        break;
        
      case 'Home':
        event.preventDefault();
        this.focusDisclosureByIndex(0);
        break;
        
      case 'End':
        event.preventDefault();
        this.focusDisclosureByIndex(allTriggers.length - 1);
        break;
        
      case 'Enter':
      case ' ':
        event.preventDefault();
        trigger.click();
        break;
    }
  }

  // Focus management utilities
  private focusFirstDisclosure(): void {
    this.focusDisclosureByIndex(0);
  }

  private focusLastDisclosure(): void {
    const triggers = document.querySelectorAll('.disclosure-trigger');
    this.focusDisclosureByIndex(triggers.length - 1);
  }

  private focusDisclosureByIndex(index: number): void {
    const triggers = document.querySelectorAll('.disclosure-trigger');
    if (index < 0) index = triggers.length - 1;
    if (index >= triggers.length) index = 0;
    
    const targetTrigger = triggers[index] as HTMLElement;
    if (targetTrigger) {
      this.accessibilityManager.setFocus(targetTrigger, { 
        enhanceVisualFocus: true 
      });
    }
  }

  // Setup live region support
  private setupLiveRegionSupport(): void {
    if (!this.options.enableLiveRegionAnnouncements) return;

    // Monitor disclosure state changes
    this.observeDisclosureChanges();
    
    // Monitor loading states
    if (this.options.announceLoadingStates) {
      this.observeLoadingStates();
    }
  }

  // Monitor disclosure state changes for announcements
  private observeDisclosureChanges(): void {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'aria-expanded') {
          const target = mutation.target as HTMLElement;
          if (target.classList.contains('disclosure-trigger')) {
            this.announceDisclosureStateChange(target, target.id);
          }
        }
      });
    });

    // Observe all disclosure triggers
    document.querySelectorAll('.disclosure-trigger').forEach((trigger) => {
      observer.observe(trigger, {
        attributes: true,
        attributeFilter: ['aria-expanded']
      });
    });
  }

  // Monitor loading states for announcements  
  private observeLoadingStates(): void {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node instanceof HTMLElement) {
            // Check for loading spinners
            if (node.classList.contains('disclosure-loading-spinner')) {
              this.announceLoadingState(node, true);
            }
          }
        });
        
        mutation.removedNodes.forEach((node) => {
          if (node instanceof HTMLElement) {
            // Check for removed loading spinners
            if (node.classList.contains('disclosure-loading-spinner')) {
              this.announceLoadingState(node, false);
            }
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  // Announce disclosure state changes
  private announceDisclosureStateChange(trigger: HTMLElement, disclosureId: string): void {
    const isExpanded = trigger.getAttribute('aria-expanded') === 'true';
    const sectionTitle = trigger.querySelector('.disclosure-trigger-title')?.textContent || 'Section';
    const contentElement = document.getElementById(`${disclosureId}-content`);
    
    let message = `${sectionTitle} ${isExpanded ? 'expanded' : 'collapsed'}`;
    
    // Add content summary if enabled and section is expanded
    if (this.options.announceContentSummary && isExpanded && contentElement) {
      const contentSummary = this.generateContentSummary(contentElement);
      if (contentSummary) {
        message += `. ${contentSummary}`;
      }
    }
    
    this.accessibilityManager.announce(message, 'polite');
  }

  // Generate content summary for screen reader announcement
  private generateContentSummary(contentElement: HTMLElement): string {
    const contentInner = contentElement.querySelector('.disclosure-content-inner');
    if (!contentInner) return '';
    
    // Count different types of content
    const lists = contentInner.querySelectorAll('ul, ol').length;
    const items = contentInner.querySelectorAll('li').length;
    const paragraphs = contentInner.querySelectorAll('p').length;
    const headings = contentInner.querySelectorAll('h1, h2, h3, h4, h5, h6').length;
    
    const parts: string[] = [];
    
    if (headings > 0) {
      parts.push(`${headings} ${headings === 1 ? 'heading' : 'headings'}`);
    }
    
    if (lists > 0) {
      parts.push(`${lists} ${lists === 1 ? 'list' : 'lists'} with ${items} items`);
    } else if (items > 0) {
      parts.push(`${items} items`);
    }
    
    if (paragraphs > 0 && parts.length === 0) {
      parts.push(`${paragraphs} ${paragraphs === 1 ? 'paragraph' : 'paragraphs'}`);
    }
    
    if (parts.length === 0) {
      return 'Content available';
    }
    
    return `Contains ${parts.join(', ')}`;
  }

  // Announce loading state changes
  private announceLoadingState(element: HTMLElement, isLoading: boolean): void {
    if (!this.options.announceLoadingStates) return;
    
    const disclosureElement = element.closest('.disclosure');
    const trigger = disclosureElement?.querySelector('.disclosure-trigger');
    const sectionTitle = trigger?.querySelector('.disclosure-trigger-title')?.textContent || 'Section';
    
    const message = isLoading 
      ? `${sectionTitle} is loading`
      : `${sectionTitle} finished loading`;
    
    this.accessibilityManager.announce(message, 'polite');
  }

  // Global disclosure actions
  private expandAllDisclosures(): void {
    const expandButtons = document.querySelectorAll('[data-action="expand-all"]');
    if (expandButtons.length > 0) {
      (expandButtons[0] as HTMLElement).click();
    } else {
      // Fallback: expand all manually
      const triggers = document.querySelectorAll('.disclosure-trigger[aria-expanded="false"]');
      triggers.forEach(trigger => (trigger as HTMLElement).click());
      
      if (triggers.length > 0) {
        this.accessibilityManager.announce(`Expanded ${triggers.length} sections`, 'polite');
      }
    }
  }

  private collapseAllDisclosures(): void {
    const collapseButtons = document.querySelectorAll('[data-action="collapse-all"]');
    if (collapseButtons.length > 0) {
      (collapseButtons[0] as HTMLElement).click();
    } else {
      // Fallback: collapse all manually
      const triggers = document.querySelectorAll('.disclosure-trigger[aria-expanded="true"]');
      triggers.forEach(trigger => (trigger as HTMLElement).click());
      
      if (triggers.length > 0) {
        this.accessibilityManager.announce(`Collapsed ${triggers.length} sections`, 'polite');
      }
    }
  }

  // Validate accessibility compliance
  validateAccessibility(): {
    passed: boolean;
    issues: string[];
    recommendations: string[];
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check disclosure triggers
    const triggers = document.querySelectorAll('.disclosure-trigger');
    triggers.forEach((trigger, index) => {
      const button = trigger as HTMLElement;
      
      // Required attributes
      if (!button.hasAttribute('aria-expanded')) {
        issues.push(`Trigger ${index + 1}: Missing aria-expanded attribute`);
      }
      
      if (!button.hasAttribute('aria-controls')) {
        issues.push(`Trigger ${index + 1}: Missing aria-controls attribute`);
      }
      
      if (!button.id) {
        issues.push(`Trigger ${index + 1}: Missing id attribute`);
      }
      
      // Check accessible name
      if (!this.accessibilityManager.validateElement(button).hasAccessibleName) {
        issues.push(`Trigger ${index + 1}: Missing accessible name`);
      }
      
      // Check keyboard accessibility
      if (!this.accessibilityManager.validateElement(button).isKeyboardAccessible) {
        issues.push(`Trigger ${index + 1}: Not keyboard accessible`);
      }
      
      // Check content relationship
      const contentId = button.getAttribute('aria-controls');
      if (contentId && !document.getElementById(contentId)) {
        issues.push(`Trigger ${index + 1}: Content element not found for aria-controls`);
      }
    });

    // Check content elements
    const contents = document.querySelectorAll('.disclosure-content');
    contents.forEach((content, index) => {
      const element = content as HTMLElement;
      
      if (!element.hasAttribute('role')) {
        recommendations.push(`Content ${index + 1}: Consider adding role="region"`);
      }
      
      if (!element.hasAttribute('aria-labelledby')) {
        recommendations.push(`Content ${index + 1}: Consider adding aria-labelledby`);
      }
    });

    // Check color contrast (simplified)
    const colorIssues = this.checkColorContrast();
    issues.push(...colorIssues);

    return {
      passed: issues.length === 0,
      issues,
      recommendations
    };
  }

  // Simple color contrast validation
  private checkColorContrast(): string[] {
    const issues: string[] = [];
    
    // This is a simplified check - in production you'd want more comprehensive contrast checking
    const triggers = document.querySelectorAll('.disclosure-trigger');
    triggers.forEach((trigger, index) => {
      const styles = window.getComputedStyle(trigger);
      const textColor = styles.color;
      const backgroundColor = styles.backgroundColor;
      
      // Basic check for transparent backgrounds (which might have contrast issues)
      if (backgroundColor === 'rgba(0, 0, 0, 0)' || backgroundColor === 'transparent') {
        issues.push(`Trigger ${index + 1}: Transparent background may cause contrast issues`);
      }
    });
    
    return issues;
  }

  // Clean up event listeners
  destroy(): void {
    this.keyboardHandlers.forEach((handler, key) => {
      if (key === 'global') {
        document.removeEventListener('keydown', handler);
      }
    });
    
    this.keyboardHandlers.clear();
    this.initialized = false;
  }
}

// Global instance
let globalDisclosureAccessibilityEnhancer: DisclosureAccessibilityEnhancer;

export function getDisclosureAccessibilityEnhancer(
  options?: Partial<AccessibilityEnhancementOptions>
): DisclosureAccessibilityEnhancer {
  if (!globalDisclosureAccessibilityEnhancer) {
    globalDisclosureAccessibilityEnhancer = new DisclosureAccessibilityEnhancer(options);
    globalDisclosureAccessibilityEnhancer.initialize();
  }
  return globalDisclosureAccessibilityEnhancer;
}

// Initialize on DOM ready
if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    getDisclosureAccessibilityEnhancer();
  });
  
  // Make available globally for debugging
  (window as any).disclosureAccessibilityEnhancer = getDisclosureAccessibilityEnhancer;
}